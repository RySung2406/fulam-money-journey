import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import { readFileSync } from 'node:fs';
import { verifyGameAccess } from '../site/game-access.js';
const context = vm.createContext({ window: {} });
vm.runInContext(readFileSync(new URL('../site/game/engine.js', import.meta.url), 'utf8'), context);
vm.runInContext(readFileSync(new URL('../site/game/questions.js', import.meta.url), 'utf8'), context);
const E = context.window.GameEngine;
const questions = JSON.parse(JSON.stringify(context.window.QUESTIONS));
const good = { id: 'good', good: true }, bad = { id: 'bad', good: false };
test('scoring rewards combos once per choice and penalises wrong slices', () => {
  const session = E.createSession();
  assert.equal(E.recordHit(session, 'round', good).delta, 100);
  assert.equal(E.recordHit(session, 'round', good), null);
  assert.equal(E.recordHit(session, 'round', { ...good, id: 'second' }).delta, 110);
  assert.equal(E.recordHit(session, 'round', bad).delta, -150);
  assert.equal(session.score, 60);
  assert.equal(session.combo, 0);
  assert.equal(session.bestCombo, 2);
  assert.equal(E.recordHit(session, 'next-round', good).delta, 100);
});
test('each round contains 12 unique choices, and random waves preserve all 60', () => {
  assert.equal(questions.length, 5);
  for (const q of questions) {
    assert.equal(q.options.length, 12);
    assert.equal(new Set(q.options.map(o => o.id)).size, 12);
    assert.ok(q.options.some(o => o.good) && q.options.some(o => !o.good));
    for (let i = 0; i < 100; i++) {
      const waves = E.createWaves(q.options);
      assert.ok(waves.every(w => w.length >= 1 && w.length <= 3));
      assert.deepEqual(Array.from(waves.flat(), o => o.id), q.options.map(o => o.id));
      assert.deepEqual(Array.from(new Set(waves.slice(0, 3).map(w => w.length))).sort(), [1, 2, 3]);
    }
  }
});
test('review distinguishes correct, avoided, wrong and missed decisions', () => {
  const choices = [{ id: 'a', good: true }, { id: 'b', good: false }, { id: 'c', good: false }, { id: 'd', good: true }];
  const decisions = E.decisions(choices, new Set(['a', 'c']));
  assert.deepEqual(Array.from(decisions, d => d.status), ['correct', 'avoided', 'wrong', 'missed']);
  assert.deepEqual(JSON.parse(JSON.stringify(E.summarise([{ decisions }]))), { correct: 1, avoided: 1, wrong: 1, missed: 1, total: 4 });
});
test('a fast swipe crossing a bag counts, while a parallel miss does not', () => {
  const rect = { left: 10, right: 20, top: 10, bottom: 20 };
  assert.equal(E.segmentIntersectsRect({ x: 0, y: 15 }, { x: 30, y: 15 }, rect), true);
  assert.equal(E.segmentIntersectsRect({ x: 0, y: 5 }, { x: 30, y: 5 }, rect), false);
  assert.equal(E.segmentIntersectsRect({ x: 15, y: 15 }, { x: 15, y: 15 }, rect), true);
});
test('all difficulty settings produce bounded arcs with continuous sideways movement', () => {
  for (const [mode, config] of Object.entries(E.DIFFICULTIES)) {
    for (let i = 0; i < 100; i++) {
      for (const plan of E.createLaunches(3, mode)) {
        assert.ok(plan.duration >= config.min && plan.duration <= config.max);
        assert.ok(plan.startX >= 0 && plan.startX <= 1 && plan.endX >= 0 && plan.endX <= 1);
        const start = E.arcadePosition(plan, 0, 390, 844, 114, 155, 220);
        const apex = E.arcadePosition(plan, .5, 390, 844, 114, 155, 220);
        const end = E.arcadePosition(plan, 1, 390, 844, 114, 155, 220);
        assert.ok(apex.y < start.y);
        assert.equal(start.y, end.y);
        assert.notEqual(start.x, end.x);
      }
    }
  }
});
function fakeClient(user, profile = { participant_code: 'TEST' }, error = null) {
  const calls = [];
  const client = {
    auth: { getUser: async () => { calls.push('server-user'); return { data: { user }, error }; } },
    from: table => { calls.push(table); return { select: field => { calls.push(field); return { eq: (field, id) => { calls.push([field, id]); return { single: async () => ({ data: profile, error: null }) }; } }; } }; }
  };
  return { client, calls };
}
const user = { id: 'verified-id', email: 'participant@connect.hku.hk', email_confirmed_at: '2026-10-24T00:00:00Z', is_anonymous: false };
test('game access validates the server user then reads only that user profile', async () => {
  const { client, calls } = fakeClient(user);
  assert.equal(await verifyGameAccess(client), user);
  assert.deepEqual(calls, ['server-user', 'profiles', 'participant_code', ['id', user.id]]);
});
test('game access denies non-school, unverified, anonymous and absent users before profile access', async () => {
  for (const invalid of [null, { ...user, email: 'person@gmail.com' }, { ...user, email_confirmed_at: null }, { ...user, is_anonymous: true }]) {
    const { client, calls } = fakeClient(invalid);
    await assert.rejects(verifyGameAccess(client), /invalid-school-session/);
    assert.deepEqual(calls, ['server-user']);
  }
});
test('game access stays closed on server errors or missing profiles', async () => {
  const unavailable = fakeClient(user, {}, new Error('network unavailable'));
  await assert.rejects(verifyGameAccess(unavailable.client), /network unavailable/);
  assert.deepEqual(unavailable.calls, ['server-user']);
  await assert.rejects(verifyGameAccess(fakeClient(user, null).client), /profile-not-ready/);
});
