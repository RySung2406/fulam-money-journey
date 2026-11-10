// The calendar stays visible until a member chooses to start. The question opens after that.
export function selectableCheckInDay(dayNumber, days) {
  return days.some(day => day.day_number === dayNumber && day.is_open);
}

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

export function renderQuestion(container, { day, en, choice, locked, revealed, reveal, submitted, savedChoice }) {
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
    if (revealed && reveal && option.k === reveal.letter) button.classList.add('is-answer');
    options.append(button);
  }
  const learn = node('p', '');
  learn.append(document.createTextNode(en ? 'Learning material: ' : '學習資料：'), link(en ? day.ifecEnUrl : day.ifecZhUrl, en ? day.ifecEn : day.ifecZh));
  container.append(options, node('p', 'check-in-tip', en ? day.tipEn : day.tipZh), learn);
  const note = en ? day.noteEn : day.noteZh;
  if (note) container.append(node('p', 'check-in-note', note));
  if (!revealed || !reveal) {
    container.append(node('p', 'check-in-waiting', submitted
      ? (en
        ? 'Your answer has been submitted. The correct answer and historical explanation will be revealed tomorrow. The aim is not only to guess correctly, but to understand real events through financial concepts.'
        : '答案已提交！正確答案及歷史解說將於翌日公布。今天的目標不只是猜中，而是學會用金融概念理解真實事件。')
      : (en
        ? 'Choose one answer, then submit it. The correct answer is published at 6:00am Hong Kong time tomorrow.'
        : '選擇一個答案，然後提交。正確答案於翌日早上 6 時公布。')));
    return;
  }
  const matched = day.opts.find(option => option.k === reveal.letter);
  const answerText = en ? (matched ? matched.en : '') : reveal.nick;
  const source = node('p', 'check-in-reveal-source');
  source.append(document.createTextNode(en ? 'Source: ' : '歷史依據：'), link(reveal.src_url, en ? reveal.src_en : reveal.src_zh));
  const box = node('section', 'check-in-reveal');
  box.setAttribute('aria-label', en ? 'Answer reveal' : '翌日揭曉答案');
  box.append(
    node('p', 'check-in-reveal-badge', en ? 'Answer revealed' : '翌日揭曉 · 答案'),
    ...(savedChoice ? [node('p', 'check-in-reveal-yours', en ? `Your choice: ${savedChoice}` : `你的選擇：${savedChoice}`)] : []),
    node('p', 'check-in-answer', en ? `Correct choice: ${reveal.letter}. ${answerText}` : `正確選項：${reveal.letter} ${answerText}`),
    node('p', 'check-in-reveal-exp', en ? reveal.exp_en : reveal.exp_zh),
    source,
    node('p', 'check-in-take', en ? reveal.take_en : reveal.take_zh)
  );
  container.append(box);
}

export function renderPublishedAnswer(container, { day, en, savedChoice, reveal }) {
  container.replaceChildren();
  container.classList.add('check-in-reveal');
  const matched = day.opts.find(option => option.k === reveal.letter);
  const answerText = en ? (matched ? matched.en : '') : reveal.nick;
  const source = node('p', '');
  source.append(document.createTextNode(en ? 'Source: ' : '歷史依據：'), link(reveal.src_url, en ? reveal.src_en : reveal.src_zh));
  container.append(
    node('p', 'check-in-label', en ? `Day ${day.n} revealed` : `第 ${day.n} 日揭曉`),
    node('h3', '', en ? day.titleEn : day.titleZh),
    node('p', '', en ? `Your choice: ${savedChoice}` : `你的選擇：${savedChoice}`),
    node('p', 'check-in-answer', en ? `Correct choice: ${reveal.letter}. ${answerText}` : `正確選項：${reveal.letter} ${answerText}`),
    node('p', '', en ? reveal.exp_en : reveal.exp_zh),
    source,
    node('p', 'check-in-take', en ? reveal.take_en : reveal.take_zh)
  );
}
