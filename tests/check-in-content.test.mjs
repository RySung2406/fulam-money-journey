import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { CHECK_IN_DAYS, questionIsOpen, answerIsOpen, answerVisible } from '../site/check-in-content.js';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');

const at = (iso) => new Date(iso);

test('all 21 days keep separate Chinese and English text', () => {
  assert.equal(CHECK_IN_DAYS.length, 21);
  assert.deepEqual(CHECK_IN_DAYS.map((day) => day.n), Array.from({ length: 21 }, (_, index) => index + 1));
  const day = CHECK_IN_DAYS[10];
  assert.deepEqual(day.opts.map((option) => option.en), [
    'Airfare, insurance, visa or accommodation deposits, and emergency reserves.',
    'Only add souvenir expenses; everything else can be arranged after arrival.',
    'No additional funds are needed because monthly living expenses are already covered.'
  ]);
  const hidden = ['letter', 'nick', 'expZh', 'expEn', 'srcZh', 'srcEn', 'srcUrl', 'takeZh', 'takeEn'];
  for (const item of CHECK_IN_DAYS) {
    for (const key of hidden) assert.equal(Object.hasOwn(item, key), false);
    assert.equal(item.opts.length, 3);
    assert.ok(item.sceneZh && item.sceneEn && item.bgZh && item.bgEn && item.qZh && item.qEn);
  }
  assert.equal(JSON.stringify(CHECK_IN_DAYS).includes('utm_source'), false);
});

test('day 1 question is open on the morning of 8 November and its answer waits until the next morning', () => {
  const morning = at('2026-11-07T21:09:00Z');
  assert.equal(questionIsOpen(1, morning), true);
  assert.equal(answerIsOpen(1, morning), false);
  assert.equal(questionIsOpen(2, morning), true);
  assert.equal(questionIsOpen(3, morning), false);
  assert.equal(answerIsOpen(1, at('2026-11-08T22:00:00Z')), true);
  assert.equal(questionIsOpen(2, at('2026-11-08T22:00:00Z')), true);
  assert.equal(questionIsOpen(3, at('2026-11-09T22:00:00Z')), true);
  assert.equal(answerIsOpen(21, at('2026-11-28T16:00:00Z')), false);
  assert.equal(answerIsOpen(21, at('2026-11-28T22:00:00Z')), true);
});

test('published source and migrations do not carry the answer key', () => {
  const files = [
    'site/check-in-content.js', 'site/check-in-days.js', 'site/check-in-screen.js', 'site/check-in.js', 'site/app.js', 'site/app.bundle.js'
  ];
  const migrationDir = path.join(root, 'supabase/migrations');
  for (const name of readdirSync(migrationDir)) files.push(path.join('supabase/migrations', name));
  const published = files.map(file => readFileSync(path.join(root, file), 'utf8')).join('\n');
  for (const marker of ['expZh', 'expEn', 'takeZh', 'takeEn', 'srcUrl', '"letter"', 'insert into private.check_in_answers']) {
    assert.equal(published.includes(marker), false, marker);
  }
  const reveal = readFileSync(path.join(migrationDir, '20261109070000_check_in_reveals.sql'), 'utf8');
  assert.match(reveal, /revoke all on table private\.check_in_answers from public, anon, authenticated/);
  assert.match(reveal, /c\.choice in \('A', 'B', 'C'\)/);
  assert.match(reveal, /a\.day_number = 1/);
  assert.doesNotMatch(reveal, /grant select on table private\.check_in_answers/i);
});

test('day 1 answer is visible now only after that person submits', () => {
  const morning = at('2026-11-07T21:09:00Z');
  assert.equal(answerVisible(1, false, morning), false);
  assert.equal(answerVisible(1, true, morning), true);
  assert.equal(answerVisible(2, true, morning), false);
  assert.equal(answerVisible(2, false, at('2026-11-09T22:00:00Z')), false);
  assert.equal(answerVisible(2, true, at('2026-11-09T22:00:00Z')), true);
});
