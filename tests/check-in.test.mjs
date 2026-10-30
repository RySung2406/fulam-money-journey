import test from 'node:test';
import assert from 'node:assert/strict';
import { createClient } from '@supabase/supabase-js';
import { createCheckInController } from '../site/check-in.js';

const userA = '11111111-1111-4111-8111-111111111111';
const userB = '22222222-2222-4222-8222-222222222222';
const days = Array.from({ length: 21 }, (_, index) => ({ day_number: index + 1, is_open: index === 0 }));
const savedRow = { day_number: 1, checked_in_at: '2026-10-30T08:03:00Z', student_confirmed: true };
const response = (data, status = 200) => new Response(JSON.stringify(data), {
  status, headers: { 'Content-Type': 'application/json' }
});
const deferred = () => {
  let resolve;
  const promise = new Promise(done => { resolve = done; });
  return { promise, resolve };
};

// The actual Supabase SDK runs against a synthetic transport. No request leaves
// the process, and there are no real accounts, access tokens or OTP messages.
function fixture() {
  const db = { activeUser: userA, records: new Map(), reads: [], submits: [], onDays: null, onRecords: null, onSubmit: null };
  const client = createClient('https://check-in-test.supabase.co', 'sb_publishable_test_only_key_123456789', {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    global: { fetch: async (input, init = {}) => {
      const url = new URL(typeof input === 'string' ? input : input.url);
      if (url.pathname === '/rest/v1/check_in_days') {
        db.reads.push({ table: 'days', select: url.searchParams.get('select') });
        return db.onDays ? db.onDays() : response(days);
      }
      if (url.pathname === '/rest/v1/check_ins') {
        const owner = url.searchParams.get('user_id');
        db.reads.push({ table: 'records', owner, select: url.searchParams.get('select') });
        return db.onRecords ? db.onRecords(owner) : response(db.records.get(owner?.slice(3)) || []);
      }
      if (url.pathname === '/rest/v1/rpc/submit_check_in') {
        const parameters = JSON.parse(init.body);
        const owner = db.activeUser;
        db.submits.push({ owner, parameters });
        if (db.onSubmit) return db.onSubmit(parameters, owner);
        if (!db.records.has(owner)) db.records.set(owner, [{ ...savedRow }]);
        return response(db.records.get(owner));
      }
      throw new Error(`Unexpected mock endpoint: ${url.pathname}`);
    } }
  });
  const snapshots = [];
  const newController = () => createCheckInController({ getClient: () => client, onChange: state => snapshots.push(state) });
  return { db, snapshots, newController, controller: newController() };
}

test('check-in stays closed before load and requires an explicit student confirmation', async () => {
  const { db, controller } = fixture();
  const gate = deferred();
  db.onDays = () => gate.promise;
  await controller.submit();
  const loading = controller.setUser(userA);
  assert.equal(controller.state.phase, 'loading');
  await controller.submit();
  assert.equal(db.submits.length, 0);
  gate.resolve(response(days));
  await loading;
  assert.equal(controller.nextDay(), 1);
  assert.equal(controller.state.days.filter(day => day.is_open).length, 1);
  assert.equal(controller.state.studentConfirmed, false);
  await controller.submit();
  assert.equal(db.submits.length, 0);
  assert.deepEqual(db.reads.find(read => read.table === 'records'), {
    table: 'records', owner: `eq.${userA}`, select: 'day_number,checked_in_at,student_confirmed'
  });
  controller.setStudentConfirmed(true);
  await controller.submit();
  assert.deepEqual(db.submits, [{ owner: userA, parameters: { p_day_number: 1, p_student_confirmed: true } }]);
  assert.deepEqual(controller.state.records, [savedRow]);
});

test('a double click submits once, waits for the server, and reload restores the saved record', async () => {
  const { db, controller, newController } = fixture();
  await controller.setUser(userA);
  controller.setStudentConfirmed(true);
  const gate = deferred();
  const reached = deferred();
  db.onSubmit = async () => { reached.resolve(); return gate.promise; };
  const pending = controller.submit();
  await reached.promise;
  await controller.submit();
  assert.equal(controller.state.phase, 'submitting');
  assert.deepEqual(controller.state.records, []);
  assert.equal(db.submits.length, 1);
  db.records.set(userA, [savedRow]);
  gate.resolve(response([savedRow]));
  await pending;
  assert.equal(controller.state.phase, 'ready');
  assert.equal(controller.nextDay(), undefined);
  await controller.submit();
  assert.equal(db.submits.length, 1);
  const reopened = newController();
  await reopened.setUser(userA);
  assert.deepEqual(reopened.state.records, [savedRow]);
  assert.equal(reopened.nextDay(), undefined);
});

test('load failures and incomplete schedules fail closed, and refresh can recover', async () => {
  for (const invalid of [response({ message: 'offline' }, 503), response(days.slice(0, 1))]) {
    const { db, controller } = fixture();
    db.onDays = () => invalid;
    await controller.setUser(userA);
    controller.setStudentConfirmed(true);
    await controller.submit();
    assert.equal(controller.state.phase, 'error');
    assert.equal(db.submits.length, 0);
    assert.deepEqual(controller.state.records, []);
    db.onDays = null;
    await controller.refresh();
    assert.equal(controller.state.phase, 'ready');
    assert.equal(controller.nextDay(), 1);
  }
});

test('a lost success response can be retried without trusting or duplicating the first attempt', async () => {
  const { db, controller } = fixture();
  await controller.setUser(userA);
  controller.setStudentConfirmed(true);
  db.onSubmit = (_parameters, owner) => {
    db.records.set(owner, [savedRow]);
    return response({ message: 'response interrupted' }, 503);
  };
  await controller.submit();
  assert.deepEqual(controller.state.records, []);
  assert.equal(controller.state.isError, true);
  assert.equal(controller.state.phase, 'ready');
  db.onSubmit = null;
  await controller.submit();
  assert.deepEqual(controller.state.records, [savedRow]);
  assert.equal(db.records.get(userA).length, 1);
  assert.equal(controller.state.isError, false);
  assert.deepEqual(db.submits[0].parameters, db.submits[1].parameters);
});

test('server-side closing and expired access disable subsequent submissions', async () => {
  for (const message of ['check_in_day_closed', 'check_in_auth_required']) {
    const { db, controller } = fixture();
    await controller.setUser(userA);
    controller.setStudentConfirmed(true);
    db.onSubmit = () => response({ message, code: 'P0001' }, 400);
    await controller.submit();
    await controller.submit();
    assert.equal(db.submits.length, 1);
    assert.deepEqual(controller.state.records, []);
    assert.equal(controller.state.isError, true);
    if (message === 'check_in_day_closed') assert.equal(controller.nextDay(), undefined);
    else assert.equal(controller.state.phase, 'error');
  }
});

test('late reads cannot repopulate a signed-out or different account', async () => {
  for (const nextUser of [undefined, userB]) {
    const { db, controller } = fixture();
    const gate = deferred();
    const reached = deferred();
    db.onRecords = owner => {
      if (owner === `eq.${userA}`) { reached.resolve(); return gate.promise; }
      return response([]);
    };
    const oldLoad = controller.setUser(userA);
    await reached.promise;
    await controller.setUser(nextUser);
    gate.resolve(response([savedRow]));
    await oldLoad;
    assert.deepEqual(controller.state.records, []);
    assert.equal(controller.state.studentConfirmed, false);
    assert.equal(controller.state.phase, nextUser ? 'ready' : 'idle');
  }
});

test('late submission success or failure cannot alter a signed-out or different account', async () => {
  for (const nextUser of [undefined, userB]) {
    for (const result of [[savedRow], { message: 'check_in_auth_required' }]) {
      const { db, controller } = fixture();
      await controller.setUser(userA);
      controller.setStudentConfirmed(true);
      const gate = deferred();
      const reached = deferred();
      db.onSubmit = () => { reached.resolve(); return gate.promise; };
      const oldSubmit = controller.submit();
      await reached.promise;
      await controller.setUser(nextUser);
      gate.resolve(response(result, Array.isArray(result) ? 200 : 400));
      await oldSubmit;
      assert.deepEqual(controller.state.records, []);
      assert.equal(controller.state.message, '');
      assert.equal(controller.state.isError, false);
      assert.equal(controller.state.phase, nextUser ? 'ready' : 'idle');
    }
  }
});

test('empty, wrong-day, or invalid RPC results never claim completion', async () => {
  for (const data of [[], [{ ...savedRow, day_number: 2 }], [{ ...savedRow, checked_in_at: 'invalid' }]]) {
    const { db, controller } = fixture();
    await controller.setUser(userA);
    controller.setStudentConfirmed(true);
    db.onSubmit = () => response(data);
    await controller.submit();
    assert.deepEqual(controller.state.records, []);
    assert.equal(controller.state.isError, true);
    assert.equal(controller.nextDay(), 1);
  }
});
