import test from 'node:test';
import assert from 'node:assert/strict';
import { checkInAction, renderPublishedAnswer, renderQuestion, selectableCheckInDay } from '../site/check-in-screen.js';

class Element {
  constructor(tag) {
    this.tagName = tag.toUpperCase();
    this.className = '';
    this.textContent = '';
    this.hidden = false;
    this.children = [];
    this.dataset = {};
    this.attrs = {};
    const classes = new Set();
    this.classList = { add: (name) => classes.add(name), contains: (name) => classes.has(name) };
  }
  setAttribute(name, value) { this.attrs[name] = String(value); }
  append(...nodes) { this.children.push(...nodes); }
  replaceChildren(...nodes) { this.children = [...nodes]; }
}
function textOf(node) {
  return [node.textContent || '', ...(node.children || []).map(textOf)].join(' ');
}
function findChoice(node, choice) {
  if (node.dataset?.choice === choice) return node;
  return (node.children || []).map(child => findChoice(child, choice)).find(Boolean);
}
globalThis.document = {
  createElement: (tag) => new Element(tag),
  createTextNode: (text) => ({ textContent: text, children: [] })
};

const sampleDay = {
  n: 4, placeZh: '測試', placeEn: 'Test', year: '2000', titleZh: '題目', titleEn: 'Title',
  conceptZh: '概念', conceptEn: 'Concept', bgZh: '背景', bgEn: 'Background', qZh: '問題？', qEn: 'Question?',
  opts: [{ k: 'A', zh: '甲', en: 'Alpha' }, { k: 'B', zh: '乙', en: 'Beta' }, { k: 'C', zh: '丙', en: 'Gamma' }],
  tipZh: '提示', tipEn: 'Tip', ifecZh: '資料', ifecEn: 'Guide',
  ifecZhUrl: 'https://www.ifec.org.hk/zh', ifecEnUrl: 'https://www.ifec.org.hk/en', noteZh: '', noteEn: ''
};
const sampleReveal = {
  letter: 'C', nick: '簡稱', exp_zh: '伺服器解釋', exp_en: 'Server explanation',
  src_zh: '出處', src_en: 'Citation', src_url: 'https://example.com/source', take_zh: '重點', take_en: 'Takeaway'
};

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

test('day 2 can be chosen while day 1 is still unfinished', () => {
  const days = [
    { day_number: 1, is_open: true },
    { day_number: 2, is_open: true },
    { day_number: 3, is_open: false }
  ];
  assert.equal(selectableCheckInDay(2, days), true);
  assert.equal(selectableCheckInDay(3, days), false);
  const opened = checkInAction({ questionOpen: true, nextDay: 0, reviewDay: 2, draftChoice: '', savedChoice: '', ...ready });
  assert.equal(opened.showQuestion, true);
  assert.equal(opened.day, 2);
  assert.equal(opened.label, '請先選擇答案');
});

test('a submitted day shows no correct choice until the server sends that reveal', () => {
  const waiting = document.createElement('div');
  renderQuestion(waiting, { day: sampleDay, en: false, choice: 'A', locked: true, revealed: false, reveal: null, submitted: true, savedChoice: 'A' });
  assert.equal(textOf(waiting).includes('正確選項'), false);
  assert.equal(textOf(waiting).includes('伺服器解釋'), false);
  assert.equal(findChoice(waiting, 'C').classList.contains('is-answer'), false);

  const shown = document.createElement('div');
  renderQuestion(shown, { day: sampleDay, en: false, choice: 'A', locked: true, revealed: true, reveal: sampleReveal, submitted: true, savedChoice: 'A' });
  assert.match(textOf(shown), /正確選項：C 簡稱/);
  assert.match(textOf(shown), /伺服器解釋/);
  assert.equal(findChoice(shown, 'C').classList.contains('is-answer'), true);
  assert.equal(findChoice(shown, 'A').classList.contains('is-answer'), false);

  const published = document.createElement('section');
  renderPublishedAnswer(published, { day: sampleDay, en: true, savedChoice: 'A', reveal: sampleReveal });
  assert.match(textOf(published), /Correct choice: C\. Gamma/);
  assert.match(textOf(published), /Server explanation/);
});
