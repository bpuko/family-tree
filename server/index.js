import express from 'express';
import helmet from 'helmet';
import session from 'express-session';
import connectPgSimple from 'connect-pg-simple';
import { rateLimit } from 'express-rate-limit';
import { pool, ensureSchema } from './db.js';
import { hashPassword, verifyPassword } from './passwords.js';

const app = express();
const PgSession = connectPgSimple(session);
const port = Number(process.env.PORT || 3000);
const allowedOrigins = new Set((process.env.ALLOWED_ORIGINS || '').split(',').map(x => x.trim()).filter(Boolean));

if (!process.env.SESSION_SECRET || process.env.SESSION_SECRET.length < 40) {
  throw new Error('SESSION_SECRET must be a random secret of at least 40 characters.');
}
if (!allowedOrigins.size) throw new Error('ALLOWED_ORIGINS must list the allowed website origins.');

app.disable('x-powered-by');
app.set('trust proxy', 1);
app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
app.use((req, res, next) => {
  const origin = req.get('Origin');
  if (origin && allowedOrigins.has(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Vary', 'Origin');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  }
  if (req.method === 'OPTIONS') return res.sendStatus(origin && allowedOrigins.has(origin) ? 204 : 403);
  if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method) && origin && !allowedOrigins.has(origin)) {
    return res.status(403).json({ error: 'Источник запроса не разрешён.' });
  }
  next();
});
app.use(express.json({ limit: '8mb' }));
app.use(session({
  name: 'family.sid',
  store: new PgSession({ pool, tableName: 'user_sessions', createTableIfMissing: false }),
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: { httpOnly: true, secure: true, sameSite: 'lax', maxAge: 1000 * 60 * 60 * 24 * 14 }
}));

const loginLimiter = rateLimit({ windowMs: 15 * 60 * 1000, limit: 10, standardHeaders: 'draft-8', legacyHeaders: false });
const inviteLimiter = rateLimit({ windowMs: 60 * 60 * 1000, limit: 20, standardHeaders: 'draft-8', legacyHeaders: false });

function requireUser(req, res, next) {
  if (!req.session.account) return res.status(401).json({ error: 'Войдите в аккаунт.' });
  next();
}
function requireOwner(req, res, next) {
  if (req.session.account?.role !== 'owner') return res.status(403).json({ error: 'Доступно только владельцу древа.' });
  next();
}
function safeAccount(account) {
  return { id: account.id, email: account.email, displayName: account.display_name, role: account.role };
}

app.get('/api/health', async (req, res) => {
  try { await pool.query('SELECT 1'); res.json({ ok: true }); }
  catch { res.status(503).json({ ok: false }); }
});

app.post('/api/auth/login', loginLimiter, async (req, res) => {
  const email = String(req.body?.email || '').trim().toLowerCase();
  const password = req.body?.password;
  if (!email || typeof password !== 'string') return res.status(400).json({ error: 'Введите почту и пароль.' });
  const { rows } = await pool.query('SELECT id, email, display_name, password_hash, role FROM family_accounts WHERE email=$1', [email]);
  const account = rows[0];
  if (!account || !(await verifyPassword(password, account.password_hash))) {
    return res.status(401).json({ error: 'Неверная почта или пароль.' });
  }
  req.session.regenerate(error => {
    if (error) return res.status(500).json({ error: 'Не удалось создать сессию.' });
    req.session.account = safeAccount(account);
    req.session.save(saveError => saveError
      ? res.status(500).json({ error: 'Не удалось сохранить сессию.' })
      : res.json({ user: req.session.account }));
  });
});

app.get('/api/auth/session', (req, res) => res.json({ user: req.session.account || null }));
app.post('/api/auth/logout', requireUser, (req, res) => req.session.destroy(() => {
  res.clearCookie('family.sid', { httpOnly: true, secure: true, sameSite: 'lax' });
  res.json({ ok: true });
}));

app.post('/api/auth/password', requireUser, loginLimiter, async (req, res) => {
  const oldPassword = req.body?.oldPassword;
  const newPassword = req.body?.newPassword;
  const { rows } = await pool.query('SELECT password_hash FROM family_accounts WHERE id=$1', [req.session.account.id]);
  if (!rows[0] || !(await verifyPassword(oldPassword, rows[0].password_hash))) {
    return res.status(401).json({ error: 'Текущий пароль указан неверно.' });
  }
  const passwordHash = await hashPassword(newPassword);
  await pool.query('UPDATE family_accounts SET password_hash=$1 WHERE id=$2', [passwordHash, req.session.account.id]);
  res.json({ ok: true });
});

app.post('/api/owner/members', requireUser, requireOwner, inviteLimiter, async (req, res) => {
  const email = String(req.body?.email || '').trim().toLowerCase();
  const displayName = String(req.body?.displayName || '').trim().slice(0, 100);
  const password = req.body?.password;
  if (!/^\S+@\S+\.\S+$/.test(email)) return res.status(400).json({ error: 'Укажите корректную почту.' });
  let passwordHash;
  try { passwordHash = await hashPassword(password); }
  catch (error) { return res.status(400).json({ error: error.message }); }
  try {
    const { rows } = await pool.query(
      'INSERT INTO family_accounts (email, display_name, password_hash, role) VALUES ($1,$2,$3,\'editor\') RETURNING id,email,display_name,role',
      [email, displayName, passwordHash]
    );
    res.status(201).json({ member: safeAccount(rows[0]) });
  } catch (error) {
    if (error.code === '23505') return res.status(409).json({ error: 'Аккаунт с этой почтой уже существует.' });
    throw error;
  }
});

app.get('/api/tree', requireUser, async (req, res) => {
  const { rows } = await pool.query('SELECT members, version FROM family_tree WHERE id=1');
  res.json({ tree: rows[0].members, version: Number(rows[0].version) });
});

app.post('/api/tree', requireUser, async (req, res) => {
  const tree = req.body?.tree;
  const expectedVersion = Number(req.body?.expectedVersion);
  if (!Array.isArray(tree) || tree.length > 5000 || !Number.isSafeInteger(expectedVersion) || expectedVersion < 1) {
    return res.status(400).json({ error: 'Данные древа имеют неверный формат.' });
  }
  const { rows } = await pool.query(
    'UPDATE family_tree SET members=$1::jsonb, version=version+1, updated_at=now() WHERE id=1 AND version=$2 RETURNING version',
    [JSON.stringify(tree), expectedVersion]
  );
  if (!rows.length) {
    const current = await pool.query('SELECT members,version FROM family_tree WHERE id=1');
    return res.status(409).json({ error: 'Древо изменилось на другом устройстве.', tree: current.rows[0].members, version: Number(current.rows[0].version) });
  }
  res.json({ version: Number(rows[0].version) });
});

app.use((error, req, res, next) => {
  console.error('Request failed:', req.method, req.path, error?.message || 'unknown');
  if (res.headersSent) return next(error);
  res.status(500).json({ error: 'Внутренняя ошибка сервера.' });
});

await ensureSchema();
app.listen(port, '0.0.0.0', () => console.log(`Family tree API listening on ${port}`));
