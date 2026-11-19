import {mkdir, readFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {fileURLToPath, pathToFileURL} from 'node:url';
import {createInterface} from 'node:readline/promises';
import {PGlite} from '@electric-sql/pglite';
import {pgcrypto} from '@electric-sql/pglite/contrib/pgcrypto';

const directory = fileURLToPath(new URL('../.openai/booth-postgres', import.meta.url));
const migration = new URL('../supabase/migrations/20261119210102_booth_staff_entry.sql', import.meta.url);
const sessionMigration = new URL('../supabase/migrations/20261119213351_booth_entry_sessions.sql', import.meta.url);
let database;
async function openDatabase() {
  await mkdir(directory, {recursive: true});
  const pg = await PGlite.create({dataDir: directory, extensions: {pgcrypto}});
  await pg.transaction(async tx => {
    const {rows:[schema]} = await tx.query(`select
      to_regprocedure('public.booth_entry_unlock(text)') is not null as ready,
      to_regprocedure('public.booth_entry_open_session(text)') is not null as sessions`);
    if (!schema.ready) {
      await tx.exec('create role anon; create role authenticated; create schema extensions; create extension pgcrypto with schema extensions;');
      await tx.exec(await readFile(migration, 'utf8'));
    }
    if (!schema.sessions) await tx.exec(await readFile(sessionMigration, 'utf8'));
  });
  return pg;
}

const rpc = new Map([
  ['/rest/v1/rpc/booth_entry_unlock', ['select public.booth_entry_unlock($1) as value', 'p_password']],
  ['/rest/v1/rpc/booth_entry_redeem', ['select public.booth_entry_redeem($1) as value', 'p_token']],
  ['/rest/v1/rpc/booth_entry_open_session', ['select public.booth_entry_open_session($1) as value', 'p_password']],
  ['/rest/v1/rpc/booth_entry_session_attempt', ['select public.booth_entry_session_attempt($1) as value', 'p_token']]
]);

export async function handleBoothRpc(req, res) {
  const endpoint = rpc.get(req.url);
  if (!endpoint) return false;
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('Content-Type', 'application/json');
  const send = (code, value) => { res.statusCode = code; res.end(JSON.stringify(value)); };
  if (req.method !== 'POST') { send(405, null); return true; }
  if ((req.headers.origin && req.headers.origin !== 'http://' + req.headers.host) ||
      !req.headers['content-type']?.startsWith('application/json')) { send(403, null); return true; }
  try {
    let body = '';
    for await (const chunk of req) {
      body += chunk;
      if (body.length > 512) { send(413, null); return true; }
    }
    const arg = JSON.parse(body)?.[endpoint[1]];
    if (typeof arg !== 'string') { send(400, null); return true; }
    const pg = await (database ??= openDatabase());
    const {rows} = await pg.transaction(async tx => {
      await tx.exec('set local role anon');
      return tx.query(endpoint[0], [arg]);
    });
    send(200, rows[0].value);
  } catch (err) {
    send(err.code === 'PT429' ? 429 : err instanceof SyntaxError || err.code === '22P02' ? 400 : 503, null);
  }
  return true;
}

if (process.argv[1] && pathToFileURL(resolve(process.argv[1])).href === import.meta.url) {
  if (process.argv[2] !== '--set-password') throw new Error('Use --set-password and supply the password on stdin.');
  const pg = await openDatabase();
  const input = createInterface({input:process.stdin, terminal:false});
  try {
    for await (const password of input) {
      if (!password || Buffer.byteLength(password) > 64) throw new Error('Invalid password length');
      await pg.query(`insert into booth_private.entry_password(password_hash)
        values (extensions.crypt($1, extensions.gen_salt('bf', 10)))
        on conflict (singleton) do update set password_hash = excluded.password_hash, failures = 0, window_start = now()`, [password]);
      console.log('Booth preview password configured.');
      break;
    }
  } finally { input.close(); await pg.close(); }
}
