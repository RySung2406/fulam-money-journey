import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import { readFileSync } from 'node:fs';

const context = vm.createContext({ window: {} });
vm.runInContext(readFileSync(new URL('../site/game/engine.js', import.meta.url), 'utf8'), context);
vm.runInContext(readFileSync(new URL('../site/game/questions.js', import.meta.url), 'utf8'), context);
const E = context.window.GameEngine;
const questions = context.window.QUESTIONS;
const good = { id: 'good', good: true }, bad = { id: 'bad', good: false };
function seeded(seed) {
  return () => { seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0; return seed / 4294967296; };
}
const plain = value => JSON.parse(JSON.stringify(value));

test('continuous decks exhaust all choices before reshuffling, without recent repeats', () => {
  for (const question of questions) {
    const options = question.options, original = plain(options);
    const deck = E.createOptionDeck(options, seeded(74291));
    const recent = [];
    let previousOrder;
    for (let cycle = 0; cycle < 100; cycle++) {
      const order = [];
      for (let i = 0; i < options.length; i++) {
        const option = deck.next();
        assert(options.includes(option), 'returns an option from this topic');
        assert(!recent.includes(option.id), 'avoids either of the previous two labels');
        order.push(option.id);
        recent.push(option.id);
        if (recent.length > 2) recent.shift();
      }
      assert.equal(new Set(order).size, options.length, 'every choice appears once per deck');
      if (previousOrder) assert.notDeepEqual(order, previousOrder, 'next deck has a new order');
      previousOrder = order;
    }
    assert.deepEqual(plain(options), original, 'randomizing does not mutate the question bank');
  }
});

test('answer order can be reproduced for QA and changes with a different seed', () => {
  const options = questions[0].options;
  const draw = seed => {
    const deck = E.createOptionDeck(options, seeded(seed));
    return Array.from({ length: 120 }, () => deck.next().id);
  };
  assert.deepEqual(draw(1), draw(1));
  assert.notDeepEqual(draw(1), draw(2));
});

test('repeated answer appearances score independently but each appearance settles once', () => {
  const s = E.createSession();
  assert.equal(E.recordHit(s, 'tools', good, 'bag-1').delta, 100);
  assert.equal(E.recordHit(s, 'tools', good, 'bag-1'), null);
  assert.equal(E.recordMiss(s, 'bag-1', good), null);
  assert.equal(E.recordHit(s, 'tools', good, 'bag-2').delta, 110);
  assert.equal(s.correct, 2);
  assert.equal(E.recordHit(s, 'tools', bad, 'bag-3').delta, -150);
  assert.equal(s.wrong, 1);
  assert.equal(s.combo, 0);
  assert.equal(s.bestCombo, 2);
  assert.equal(s.score, 60);
});

test('expired correct answers count as misses; leaving a decoy is an avoided mistake', () => {
  const s = E.createSession();
  assert.equal(E.recordMiss(s, 'bag-1', good).status, 'missed');
  assert.equal(E.recordMiss(s, 'bag-2', bad).status, 'avoided');
  assert.equal(E.recordMiss(s, 'bag-1', good), null);
  assert.equal(E.recordHit(s, 'tools', good, 'bag-1'), null);
  assert.equal(s.missed, 1);
  assert.equal(s.avoided, 1);
  assert.equal(s.correct, 0);
  assert.equal(s.wrong, 0);
});

test('a long endless session keeps bounded deduplication state and aggregate counts', () => {
  const s = E.createSession();
  for (let i = 0; i < 20000; i++) {
    if (i % 2) E.recordMiss(s, 'bag-' + i, good);
    else E.recordHit(s, 'tools', good, 'bag-' + i);
    assert(s.seen.size <= 512, 'settled targets do not accumulate without bound');
  }
  assert.equal(s.correct, 10000);
  assert.equal(s.missed, 10000);
  assert.equal(s.records.length, 0, 'no per-hit history is recorded');
  assert.equal(E.recordMiss(s, 'bag-19999', good), null, 'latest settlement remains protected');
});

test('independent spawn cadence is variable and earlier than the end of a flight', () => {
  for (const [mode, config] of Object.entries(E.DIFFICULTIES)) {
    const rng = seeded(987);
    const delays = Array.from({ length: 1000 }, () => E.nextSpawnDelay(mode, rng));
    assert(delays.every(delay => Number.isFinite(delay) && delay > 0 && delay < config.min));
    assert(new Set(delays.map(delay => delay.toFixed(3))).size > 50, 'not one fixed launch rhythm');
    for (const free of [0, 1, 2, 3, 4, 7]) {
      const sizes = Array.from({ length: 100 }, () => E.spawnGroupSize(free, rng));
      assert(sizes.every(size => Number.isInteger(size) && size >= 0 && size <= free));
      if (free === 0) assert(sizes.every(size => size === 0));
      else assert(sizes.every(size => size >= 1 && size <= 3));
      if (free >= 3) assert(new Set(sizes).size > 1, 'mixes single bags and small groups');
    }
  }
});

test('launches use varied continuous origins and remain visible through the apex', () => {
  for (const mode of Object.keys(E.DIFFICULTIES)) {
    const rng = seeded(73671);
    const plans = Array.from({ length: 120 }, () => E.createLaunches(1, mode, rng)[0]);
    assert(new Set(plans.map(plan => plan.startX.toFixed(3))).size > 70, 'origins are not fixed columns');
    assert(new Set(plans.map(plan => plan.depth.toFixed(3))).size > 60, 'apex heights vary');
    assert(plans.some(p => p.startX < p.endX) && plans.some(p => p.startX > p.endX), 'both drift directions occur');
    for (const p of plans) {
      for (const [width, height, bagWidth, bagHeight, ceiling] of [[320, 600, 132, 180, 170], [1000, 720, 160, 205, 190]]) {
        const apex = E.arcadePosition(p, .5, width, height, bagWidth, bagHeight, ceiling);
        assert(apex.x >= 0 && apex.x + bagWidth <= width, 'apex stays within horizontal viewport');
        assert(apex.y >= 0 && apex.y + bagHeight <= height, 'label is reachable on screen');
      }
    }
  }
});

test('sprint ranking time uses milliseconds and adds three seconds per mistake', () => {
  assert.equal(E.GAME_RULES.version, 'continuous-v1');
  assert.equal(E.GAME_RULES.sprintTarget, 20);
  assert.equal(E.GAME_RULES.wrongPenaltySeconds, 3);
  assert.equal(E.sprintTimeMs(12.345, 0), 12345);
  assert.equal(E.sprintTimeMs(12.345, 2), 18345);
  assert.equal(E.sprintTimeMs(12.3451, 2), 18346);
});
