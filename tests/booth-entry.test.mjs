import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {randomUUID} from 'node:crypto';
import {PGlite} from '@electric-sql/pglite';
import {pgcrypto} from '@electric-sql/pglite/contrib/pgcrypto';

test('A verified booth session issues independent attempts until expiry, with legacy admission still single-use', async () => {
  const db = await PGlite.create({extensions:{pgcrypto}});
  try {
    await db.exec('create role anon; create role authenticated; create schema extensions; create extension pgcrypto with schema extensions;');
    await db.exec(await readFile(new URL('../supabase/migrations/20261119210102_booth_staff_entry.sql',import.meta.url),'utf8'));
    const password = randomUUID();
    await db.query("insert into booth_private.entry_password(password_hash) values(extensions.crypt($1, extensions.gen_salt('bf',4)))",[password]);
    const {rows:[legacyGrant]} = await db.query('select public.booth_entry_unlock($1) as token',[password]);
    await db.exec(await readFile(new URL('../supabase/migrations/20261119213351_booth_entry_sessions.sql',import.meta.url),'utf8'));
    const request = (sql, args) => db.transaction(async tx => {
      await tx.exec('set local role anon');
      const {rows} = await tx.query(sql,args);
      return rows[0]?.value;
    });
    const unlock = value => request('select public.booth_entry_unlock($1) as value',[value]);
    const redeem = token => request('select public.booth_entry_redeem($1) as value',[token]);
    const openSession = value => request('select public.booth_entry_open_session($1) as value',[value]);
    const startAttempt = token => request('select public.booth_entry_session_attempt($1) as value',[token]);
    await assert.rejects(request('select password_hash from booth_private.entry_password',[]),{code:'42501'});
    await assert.rejects(request('select token from booth_private.entry_grants',[]),{code:'42501'});
    assert.equal(await openSession('incorrect'),null);
    assert.equal(await startAttempt(legacyGrant.token),null);
    assert.ok(await redeem(legacyGrant.token));
    assert.equal(await redeem(legacyGrant.token),null);
    const expired = await unlock(password);
    await db.query("update booth_private.entry_grants set expires_at=now()-interval '1 second' where token=$1",[expired]);
    assert.equal(await redeem(expired),null);

    const session = await openSession(password);
    assert.ok(session.token && Date.parse(session.expiresAt) > Date.now());
    const [first, second] = await Promise.all([startAttempt(session.token), startAttempt(session.token)]);
    assert.ok(first && second && first !== second);
    assert.equal(await startAttempt(first),null);
    assert.equal(await redeem(session.token),null);
    assert.ok(await startAttempt(session.token), 'old clients cannot consume the device session');
    await db.query("update booth_private.entry_grants set expires_at=now()-interval '1 second' where token=$1",[session.token]);
    assert.equal(await startAttempt(session.token),null);

    for(let i=0;i<9;i++)assert.equal(await openSession('incorrect'),null);
    await assert.rejects(openSession(password),{code:'PT429'});
  } finally { await db.close(); }
});
