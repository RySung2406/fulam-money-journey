import test from 'node:test';
import assert from 'node:assert/strict';
import { checkInAction } from '../site/check-in-screen.js';

const ready = { phase: 'ready', busy: false, saving: false };

test('the question stays behind Start check-in until an answer is chosen', () => {
  const calendar = checkInAction({ questionOpen: false, nextDay: 1, reviewDay: 0, draftChoice: '', savedChoice: '', ...ready });
  assert.equal(calendar.showQuestion, false);
  assert.equal(calendar.label, '開始打卡');
  assert.equal(calendar.action, 'open');
  assert.equal(calendar.day, 1);

  const opened = checkInAction({ questionOpen: true, nextDay: 0, reviewDay: 1, draftChoice: '', savedChoice: '', ...ready });
  assert.equal(opened.showQuestion, true);
  assert.equal(opened.label, '請先選擇答案');
  assert.equal(opened.disabled, true);
  assert.equal(opened.action, 'none');

  const chosen = checkInAction({ questionOpen: true, nextDay: 0, reviewDay: 1, draftChoice: 'B', savedChoice: '', ...ready });
  assert.equal(chosen.action, 'submit');
  assert.equal(chosen.disabled, false);
  assert.equal(chosen.label, '提交答案');

  const saved = checkInAction({ questionOpen: true, nextDay: 0, reviewDay: 1, draftChoice: 'B', savedChoice: 'B', ...ready });
  assert.equal(saved.action, 'close');
  assert.equal(saved.showQuestion, true);
});
