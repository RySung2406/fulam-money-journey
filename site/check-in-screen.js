// The calendar stays visible until a member chooses to start. The question opens after that.
export function checkInAction({ questionOpen, nextDay, reviewDay, draftChoice, savedChoice, phase, busy, saving }) {
  const startDay = nextDay || reviewDay || 0;
  if (!questionOpen) {
    if (phase === 'idle' || phase === 'loading') return { showQuestion: false, label: '正在載入…', disabled: true, action: 'none', day: 0 };
    if (!startDay || phase === 'error') return { showQuestion: false, label: phase === 'error' ? '暫未能打卡' : '尚未開放打卡', disabled: true, action: 'none', day: 0 };
    return { showQuestion: false, label: nextDay ? '開始打卡' : '查看題目', disabled: Boolean(busy), action: 'open', day: startDay };
  }
  const day = startDay;
  if (!day) return { showQuestion: false, label: '返回日曆', disabled: Boolean(busy), action: 'close', day: 0 };
  if (saving) return { showQuestion: true, label: '正在保存…', disabled: true, action: 'none', day };
  if (savedChoice) return { showQuestion: true, label: '返回日曆', disabled: Boolean(busy), action: 'close', day };
  if (draftChoice !== 'A' && draftChoice !== 'B' && draftChoice !== 'C') {
    return { showQuestion: true, label: '請先選擇答案', disabled: true, action: 'none', day };
  }
  return { showQuestion: true, label: '提交答案', disabled: Boolean(busy), action: 'submit', day };
}

function node(tag, className, text) {
  const element = document.createElement(tag);
  if (className) element.className = className;
  if (text != null) element.textContent = text;
  return element;
}

function link(href, text) {
  const element = node('a', '', text);
  element.href = href;
  element.target = '_blank';
  element.rel = 'noopener noreferrer';
  return element;
}

export function renderQuestion(container, { day, en, choice, locked, revealed, submitted, savedChoice }) {
  container.replaceChildren();
  if (!day) { container.hidden = true; return; }
  container.hidden = false;
  const back = node('button', 'check-in-back', en ? 'Back to calendar' : '返回日曆');
  back.type = 'button';
  back.dataset.checkInBack = 'true';
  container.append(
    back,
    node('p', 'check-in-label', en ? 'Today’s question' : '當日題目'),
    node('p', 'check-in-kicker', en ? `Day ${day.n} · ${day.placeEn} · ${day.year}` : `第 ${day.n} 日 · ${day.placeZh} · ${day.year}`),
    Object.assign(node('h3', '', en ? day.titleEn : day.titleZh), { tabIndex: -1 }),
    node('p', '', en ? `Concept · ${day.conceptEn}` : `概念 · ${day.conceptZh}`),
    node('p', '', en ? day.bgEn : day.bgZh),
    node('p', 'check-in-question', en ? day.qEn : day.qZh)
  );
  const options = node('div', 'check-in-options');
  options.setAttribute('role', 'radiogroup');
  options.setAttribute('aria-label', en ? 'Choose an answer' : '選擇答案');
  for (const option of day.opts) {
    const button = node('button', 'check-in-option');
    button.type = 'button';
    button.dataset.choice = option.k;
    button.setAttribute('role', 'radio');
    button.setAttribute('aria-checked', String(choice === option.k));
    button.disabled = locked;
    button.append(node('b', '', option.k), document.createTextNode(en ? ` ${option.en}` : ` ${option.zh}`));
    if (revealed && option.k === day.letter) button.classList.add('is-answer');
    options.append(button);
  }
  const learn = node('p', '');
  learn.append(document.createTextNode(en ? 'Learning material: ' : '學習資料：'), link(en ? day.ifecEnUrl : day.ifecZhUrl, en ? day.ifecEn : day.ifecZh));
  container.append(options, node('p', 'check-in-tip', en ? day.tipEn : day.tipZh), learn);
  const note = en ? day.noteEn : day.noteZh;
  if (note) container.append(node('p', 'check-in-note', note));
  if (!revealed) {
    container.append(node('p', 'check-in-waiting', submitted
      ? (en
        ? 'Your answer has been submitted. The correct answer and historical explanation will be revealed tomorrow. The aim is not only to guess correctly, but to understand real events through financial concepts.'
        : '答案已提交！正確答案及歷史解說將於翌日公布。今天的目標不只是猜中，而是學會用金融概念理解真實事件。')
      : (en
        ? 'Choose one answer, then submit it. The correct answer is published at 6:00am Hong Kong time tomorrow.'
        : '選擇一個答案，然後提交。正確答案於翌日早上 6 時公布。')));
    return;
  }
  const answerText = en ? day.opts.find(option => option.k === day.letter).en : day.nick;
  const source = node('p', '');
  source.append(document.createTextNode(en ? 'Source: ' : '歷史依據：'), link(day.srcUrl, en ? day.srcEn : day.srcZh));
  const reveal = [
    node('p', 'check-in-label', en ? 'What happened' : '翌日揭曉'),
    node('p', 'check-in-answer', en ? `Correct choice: ${day.letter}. ${answerText}` : `正確選項：${day.letter} ${answerText}`),
    node('p', '', en ? day.expEn : day.expZh),
    source,
    node('p', 'check-in-take', en ? day.takeEn : day.takeZh)
  ];
  if (savedChoice) reveal.splice(1, 0, node('p', '', en ? `Your choice: ${savedChoice}` : `你的選擇：${savedChoice}`));
  container.append(...reveal);
}

export function renderPublishedAnswer(container, { day, en, savedChoice }) {
  container.replaceChildren();
  container.classList.add('check-in-reveal');
  const answerText = en ? day.opts.find(option => option.k === day.letter).en : day.nick;
  const source = node('p', '');
  source.append(document.createTextNode(en ? 'Source: ' : '歷史依據：'), link(day.srcUrl, en ? day.srcEn : day.srcZh));
  container.append(
    node('p', 'check-in-label', en ? `Day ${day.n} revealed` : `第 ${day.n} 日揭曉`),
    node('h3', '', en ? day.titleEn : day.titleZh),
    node('p', '', en ? `Your choice: ${savedChoice}` : `你的選擇：${savedChoice}`),
    node('p', 'check-in-answer', en ? `Correct choice: ${day.letter}. ${answerText}` : `正確選項：${day.letter} ${answerText}`),
    node('p', '', en ? day.expEn : day.expZh),
    source,
    node('p', 'check-in-take', en ? day.takeEn : day.takeZh)
  );
}
