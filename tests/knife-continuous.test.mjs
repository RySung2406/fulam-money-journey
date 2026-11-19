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

test('quick-cut awards one bonus per pair, including simultaneous swipes and the 650ms boundary',()=>{
  const session=E.createSession();
  const cuts=[0,0,.1,.75,2,2.651,2.7];
  assert.deepEqual(cuts.map(seconds=>E.quickCutBonus(session,seconds)),[0,80,0,80,0,0,80]);
});

test('a wrong slice or missed matching bag breaks a quick pair, while avoiding a decoy keeps it',()=>{
  const session=E.createSession();
  E.quickCutBonus(session,1);E.recordHit(session,'tools',bad,'s1');
  assert.equal(E.quickCutBonus(session,1.1),0);
  E.recordMiss(session,'s2',good);assert.equal(E.quickCutBonus(session,1.2),0);
  E.recordMiss(session,'s3',bad);assert.equal(E.quickCutBonus(session,1.3),80);
});

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

test('a one-pass deck shows every choice once and then stops', () => {
  const options = questions[0].options;
  const deck = E.createOptionDeck(options, seeded(11), true);
  const order = Array.from({ length: options.length + 3 }, () => deck.next());
  assert.equal(order.filter(Boolean).length, options.length);
  assert.equal(new Set(order.filter(Boolean).map(option => option.id)).size, options.length);
  assert.equal(order.at(-1), null);
});

test('booth throws mix their answers and sides while giving every run the same quick-cut chances', () => {
  for (const {options} of questions.slice(0, 2)) {
    const wavePatterns = new Set(), openingMatches = new Set();
    for (let seed = 1; seed <= 100; seed++) {
      const deck = E.createOptionDeck(options, seeded(seed), true);
      const draws = Array.from({length: options.length}, () => deck.next());
      assert.equal(new Set(draws).size, options.length);
      assert(draws.every(option => options.includes(option)));
      const counts = [];
      for (let i = 0; i < draws.length;) {
        const size = E.spawnGroupSize(3, draws.length - i);
        const group = draws.slice(i, i + size);
        counts.push(group.filter(option => option.good).length);
        if (i === 0 && counts[0] === 1) openingMatches.add(group.findIndex(option => option.good));
        i += size;
      }
      assert(counts[0] > 0, 'the first throw gives the player a matching bag');
      assert(counts.every((n, i) => n > 0 || counts[i - 1] > 0), 'decoy-only throws are separated');
      assert.equal(counts.filter(n => n >= 2).length, 3);
      wavePatterns.add(counts.join(''));
    }
    assert(wavePatterns.size > 50, 'patterns vary between runs');
    assert.equal(openingMatches.size, 2, 'a mixed opener can place its matching bag on either side');
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
  }
});

test('booth timing varies between runs within the same delivery window and reading pace', () => {
  const windowSeconds=(45-4)/1.30;
  for(const question of questions.slice(0,2)){
    const count=question.options.length;
    const schedule=seed=>Array.from(E.boothLaunchGaps(count,windowSeconds,seeded(seed)));
    const gaps=schedule(462);
    assert.deepEqual(gaps,schedule(462));
    assert.notDeepEqual(gaps,schedule(463));
    const gapCount=Math.floor(count/2)-1, beat=windowSeconds/gapCount;
    for(let seed=1;seed<=100;seed++){
      const sample=schedule(seed);
      assert.equal(sample.length,gapCount);
      assert(sample.every(gap=>gap>=beat*.64-1e-9 && gap<=beat*1.36+1e-9));
      assert(Math.abs(sample.reduce((sum,gap)=>sum+gap,0)-windowSeconds)<1e-9);
    }
    assert(new Set(gaps.map(gap=>gap.toFixed(2))).size>3);
  }
});

test('launches wait for a whole pair, or for all three slots when an odd deck ends', () => {
  for (const free of [0, 1, 2, 3, 4, 6]) {
    assert.equal(E.spawnGroupSize(free), free >= 2 ? 2 : 0, 'endless stream');
    for (const left of [0, 1, 2, 3, 4, 5, 24, 25]) {
      const group = left < 2 ? 0 : left === 3 ? 3 : 2;
      assert.equal(E.spawnGroupSize(free, left), free >= group ? group : 0,
        `${left} remaining options and ${free} free slots`);
    }
  }
});

test('both booth decks launch every distinct choice in simultaneous pairs, with one closing trio for an odd total', () => {
  for (const question of questions.slice(0, 2)) {
    const rng = seeded(156);
    const deck = E.createOptionDeck(question.options, rng, true);
    let left = question.options.length;
    const distinct = new Set(), groups = [];
    while (left > 0) {
      const count = E.spawnGroupSize(3, left);
      assert(count === 2 || count === 3);
      const flights = E.createLaunches(count, 'medium', rng);
      assert.equal(flights.length, count);
      assert(flights.every(plan => plan.delay === 0), 'all members take off together');
      for (const flight of flights) {
        const choice = deck.next();
        assert(choice && !distinct.has(choice.id));
        distinct.add(choice.id);
        assert(flight.duration >= E.DIFFICULTIES.medium.min && flight.duration <= E.DIFFICULTIES.medium.max);
      }
      groups.push(count);
      left -= count;
    }
    assert(groups.slice(0, -1).every(size => size === 2));
    assert.equal(groups.at(-1), question.options.length % 2 ? 3 : 2);
    assert.equal(distinct.size, question.options.length);
    assert.equal(deck.next(), null);
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
        const top = Math.max(24, Math.min(ceiling, height - bagHeight - 85));
        const room = Math.max(0, height - bagHeight - 85 - top);
        assert(apex.x >= 0 && apex.x + bagWidth <= width, 'apex stays within horizontal viewport');
        assert(apex.y >= 0 && apex.y + bagHeight <= height, 'label is reachable on screen');
        assert(apex.y < top + room / 2, 'throw clears the middle height');
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
