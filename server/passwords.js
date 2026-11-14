import { randomBytes, scrypt as scryptCallback, timingSafeEqual } from 'node:crypto';
import { promisify } from 'node:util';

const scrypt = promisify(scryptCallback);

export async function hashPassword(password) {
  if (typeof password !== 'string' || password.length < 10 || password.length > 200) {
    throw new Error('Пароль должен содержать от 10 до 200 символов.');
  }
  const salt = randomBytes(16);
  const derived = await scrypt(password, salt, 64, { N: 1 << 15, r: 8, p: 1, maxmem: 64 * 1024 * 1024 });
  return `scrypt$32768$8$1$${salt.toString('base64url')}$${Buffer.from(derived).toString('base64url')}`;
}

export async function verifyPassword(password, encoded) {
  if (typeof password !== 'string' || typeof encoded !== 'string') return false;
  const [kind, n, r, p, saltText, keyText] = encoded.split('$');
  if (kind !== 'scrypt' || n !== '32768' || r !== '8' || p !== '1' || !saltText || !keyText) return false;
  try {
    const expected = Buffer.from(keyText, 'base64url');
    const actual = Buffer.from(await scrypt(password, Buffer.from(saltText, 'base64url'), expected.length,
      { N: 1 << 15, r: 8, p: 1, maxmem: 64 * 1024 * 1024 }));
    return actual.length === expected.length && timingSafeEqual(actual, expected);
  } catch {
    return false;
  }
}
