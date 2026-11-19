import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {randomUUID} from 'node:crypto';
import {PGlite} from '@electric-sql/pglite';
import {pgcrypto} from '@electric-sql/pglite/contrib/pgcrypto';

test('The database checks the staff password and issues one expiring admission per successful entry', async () => {
  const db = await PGlite.create({extensions:{pgcrypto}});
  try {
    await db.exec('create role anon; create role authenticated; create schema extensions; create extension pgcrypto with schema extensions;');
    await db.exec(await readFile(new URL('../supabase/migrations/20261119210102_booth_staff_entry.sql',import.meta.url),'utf8'));
    const password = randomUUID();
    await db.query("insert into booth_private.entry_password(password_hash) values(extensions.crypt($1, extensions.gen_salt('bf',4)))",[password]);
    const request = (sql, args) => db.transaction(async tx => {
      await tx.exec('set local role anon');
      const {rows} = await tx.query(sql,args);
      return rows[0]?.value;
    });
    const unlock = value => request('select public.booth_entry_unlock($1) as value',[value]);
    const redeem = token => request('select public.booth_entry_redeem($1) as value',[token]);
    await assert.rejects(request('select password_hash from booth_private.entry_password',[]),{code:'42501'});
    assert.equal(await unlock('incorrect'),null);
    const grant = await unlock(password);
    assert.ok(grant);
    assert.ok(await redeem(grant));
    assert.equal(await redeem(grant),null);
    const expired = await unlock(password);
    await db.query("update booth_private.entry_grants set expires_at=now()-interval '1 second' where token=$1",[expired]);
    assert.equal(await redeem(expired),null);
    for(let i=0;i<9;i++)assert.equal(await unlock('incorrect'),null);
    await assert.rejects(unlock(password),{code:'PT429'});
  } finally { await db.close(); }
});
