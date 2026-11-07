import test from 'node:test';
import assert from 'node:assert/strict';
import { CHECK_IN_DAYS, questionIsOpen, answerIsOpen } from '../site/check-in-content.js';

const at = (iso) => new Date(iso);

test('all 21 days keep separate Chinese and English text', () => {
  assert.equal(CHECK_IN_DAYS.length, 21);
  assert.deepEqual(CHECK_IN_DAYS.map((day) => day.n), Array.from({ length: 21 }, (_, index) => index + 1));
  const day = CHECK_IN_DAYS[10];
  assert.deepEqual(day.opts.map((option) => option.en), ['6.08%.', '1%.', '7.08%, obtained by adding the two rates.']);
  assert.equal(CHECK_IN_DAYS[20].takeZh, '投資者最後保留下來的費後回報，比產品的名氣或包裝更重要。');
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
