import readline from 'node:readline/promises';
import { stdin, stdout } from 'node:process';
import { pool, ensureSchema } from './db.js';
import { hashPassword } from './passwords.js';

function hiddenPrompt(prompt) {
  return new Promise((resolve, reject) => {
    stdout.write(prompt);
    let value = '';
    const wasRaw = Boolean(stdin.isRaw);
    if (stdin.isTTY && stdin.setRawMode) stdin.setRawMode(true);
    stdin.resume();
    const onData = chunk => {
      for (const char of chunk.toString('utf8')) {
        if (char === '\r' || char === '\n') {
          stdin.off('data', onData);
          if (stdin.isTTY && stdin.setRawMode) stdin.setRawMode(wasRaw);
          stdout.write('\n');
          resolve(value);
          return;
        }
        if (char === '\u0003') {
          stdin.off('data', onData);
          if (stdin.isTTY && stdin.setRawMode) stdin.setRawMode(wasRaw);
          reject(new Error('Cancelled'));
          return;
        }
        if (char === '\u007f') value = value.slice(0, -1);
        else value += char;
      }
    };
    stdin.on('data', onData);
  });
}

try {
  await ensureSchema();
  const rl = readline.createInterface({ input: stdin, output: stdout });
  const email = (await rl.question('Email владельца: ')).trim().toLowerCase();
  const displayName = (await rl.question('Имя владельца: ')).trim() || 'Владелец';
  rl.close();
  const password = await hiddenPrompt('Пароль владельца (ввод скрыт): ');
  const hash = await hashPassword(password);
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const { rows: [{ count }] } = await client.query('SELECT count(*)::int AS count FROM family_accounts');
    if (Number(count) > 0) throw new Error('Аккаунты уже существуют; первичное создание владельца запрещено.');
    await client.query('INSERT INTO family_accounts (email, display_name, password_hash, role) VALUES ($1,$2,$3,\'owner\')',
      [email, displayName, hash]);
    await client.query('COMMIT');
    console.log('Аккаунт владельца создан.');
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
} finally {
  await pool.end();
}
