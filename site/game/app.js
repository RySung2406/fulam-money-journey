'use strict';
window.startMoneyGame = () => {
if (window.FuLamSlice) return;
const $ = selector => document.querySelector(selector);
const app = $('#app'), modal = $('#modal'), E = window.GameEngine;
const icon = (name, cls = '') => `<svg class="${cls}" aria-hidden="true"><use href="#i-${name}"/></svg>`;
const bag = (cls = '') => `<svg class="${cls}" aria-hidden="true" viewBox="0 0 200 210"><use href="#bag-art"/></svg>`;
const escape = value => String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const prefs = {
 get(key, fallback) { try { return localStorage.getItem('fulam-' + key) ?? fallback; } catch { return fallback; } },
 set(key, value) { try { localStorage.setItem('fulam-' + key, String(value)); return true; } catch { return false; } }
};
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
const effects = new MoneyEffects(reducedMotion), coinAudio = new CoinAudio();
let mode = prefs.get('mode', 'easy'), playKind = prefs.get('play-kind', 'practice');
if (!E.DIFFICULTIES[mode]) mode = 'easy';
if (!['practice', 'sprint'].includes(playKind)) playKind = 'practice';
let sound = prefs.get('sound', 'true') === 'true', phase = 'home', paused = false;
let session = E.createSession(), question = null, optionDeck = null, optionStats = new Map();
let arena = null, targets = [], elapsed = 0, lastTime = 0, raf = 0, nextSpawnAt = 0, spawned = 0;
let trail = [], pointer = null, canvas = null, ctx = null, knife = null, arenaWidth = 0, arenaHeight = 0, arenaCeiling = 0, flightFloor = 0;
let audioCtx = null, arenaEvents = null, runSerial = 0, avoided = 0, lastGroup = [], finalTimeMs = null, bestResult = null;
const cleanupTimers = new Set();
const difficulty = () => E.DIFFICULTIES[mode];
const totalChoices = () => QUESTIONS.reduce((sum, q) => sum + q.options.length, 0);
const liveCap = () => window.innerWidth <= 420 ? 3 : window.innerWidth < 650 ? 4 : 6;
const timeLabel = milliseconds => {
 const seconds = Math.max(0, milliseconds) / 1000;
 return `${Math.floor(seconds / 60)}:${(seconds % 60).toFixed(2).padStart(5, '0')}`;
};
const bestKey = q => `best-${E.GAME_RULES.version}-${q.id}-${mode}`;
function readBest(q) {
 try {
  const value = JSON.parse(prefs.get(bestKey(q), 'null'));
  return value && Number.isSafeInteger(value.timeMs) && value.timeMs > 0 ? value : null;
 } catch { return null; }
}
function later(fn, ms) {
 const id = setTimeout(() => { cleanupTimers.delete(id); fn(); }, ms);
 cleanupTimers.add(id); return id;
}
function announce(text) { $('#announcer').textContent = text; }
function toast(text) {
 document.querySelector('.toast')?.remove();
 const el = document.createElement('div'); el.className = 'toast'; el.textContent = text; document.body.append(el);
 later(() => el.remove(), 3000);
}
function playSound(kind){
 if(!sound)return;
 try{
  audioCtx??=new (window.AudioContext||window.webkitAudioContext)();
  if(audioCtx.state==='suspended')audioCtx.resume();
  const t=audioCtx.currentTime;
  if(kind==='good'){coinAudio.play(audioCtx);return;}
  if(kind==='slice'){
   const length=Math.ceil(audioCtx.sampleRate*.13),buffer=audioCtx.createBuffer(1,length,audioCtx.sampleRate),data=buffer.getChannelData(0);
   for(let i=0;i<length;i++)data[i]=(Math.random()*2-1)*(1-i/length);
   const source=audioCtx.createBufferSource(),filter=audioCtx.createBiquadFilter(),gain=audioCtx.createGain();
   source.buffer=buffer;filter.type='bandpass';filter.Q.value=.7;filter.frequency.setValueAtTime(3200,t);filter.frequency.exponentialRampToValueAtTime(650,t+.12);
   gain.gain.setValueAtTime(0,t);gain.gain.linearRampToValueAtTime(.13,t+.015);gain.gain.exponentialRampToValueAtTime(.001,t+.13);
   source.connect(filter);filter.connect(gain);gain.connect(audioCtx.destination);source.start(t);source.stop(t+.14);
   source.onended=()=>{source.disconnect();filter.disconnect();gain.disconnect();};return;
  }
  const notes=kind==='bad'?[180,115]:[440,660,880];
  notes.forEach((n,i)=>{
   const o=audioCtx.createOscillator(),g=audioCtx.createGain(),at=t+i*.065;
   o.type=kind==='bad'?'triangle':'sine';o.frequency.setValueAtTime(n,at);
   g.gain.setValueAtTime(0,at);g.gain.linearRampToValueAtTime(.055,at+.004);g.gain.exponentialRampToValueAtTime(.001,at+.23);
   o.connect(g);g.connect(audioCtx.destination);o.start(at);o.stop(at+.25);o.onended=()=>{o.disconnect();g.disconnect();};
  });
 }catch{}
}
function updateSound() {
 for (const button of [$('#sound-toggle'), $('#game-sound')].filter(Boolean)) {
  button.innerHTML = icon(sound ? 'volume' : 'muted');
  button.setAttribute('aria-label', sound ? 'Mute sound' : 'Enable sound');
  button.setAttribute('aria-pressed', String(sound));
 }
}
$('#sound-toggle').addEventListener('click', () => { sound = !sound; prefs.set('sound', sound); updateSound(); if (sound) playSound('good'); });
updateSound();
$('#fullscreen').addEventListener('click', async () => {
 try {
  if (document.fullscreenElement) await document.exitFullscreen();
  else if (document.documentElement.requestFullscreen) await document.documentElement.requestFullscreen();
  else toast('Fullscreen is unavailable in this browser. You can keep playing here.');
 } catch { toast('Could not open fullscreen. You can keep playing here.'); }
});
function releasePointer() {
 if (pointer && arena?.hasPointerCapture?.(pointer.id)) {
  try { arena.releasePointerCapture(pointer.id); } catch {}
 }
 pointer = null; trail = []; hideKnife();
}
function stopAnimation() {
 cancelAnimationFrame(raf); raf = 0;
 arenaEvents?.abort(); arenaEvents = null;
 cleanupTimers.forEach(clearTimeout); cleanupTimers.clear();
 document.querySelector('.toast')?.remove();
 releasePointer(); targets = []; effects.clear();
 knife = null; arena = null; ctx = null; canvas = null;
}
function render(markup) {
 stopAnimation();
 document.body.classList.toggle('immersive-game', ['ready', 'playing'].includes(phase));
 app.innerHTML = markup;
 window.scrollTo({top: 0, behavior: 'instant'});
}
function advanceClock(now = performance.now()) {
 if (phase === 'playing' && !paused) elapsed += Math.max(0, now - lastTime) / 1000;
 lastTime = now;
}
function freezeGame() {
 if (phase !== 'playing' || paused) return;
 advanceClock(); paused = true; releasePointer(); arena?.classList.add('is-paused'); updateHUD();
}
function showModal(title, body, buttons) {
 freezeGame();
 $('#modal-content').innerHTML = `<h2 id="modal-title">${title}</h2>${body}${buttons}`;
 if (!modal.open) modal.showModal();
}
function closeModal() { if (modal.open) modal.close(); }
modal.addEventListener('close', () => {
 if (phase === 'playing') {
  if (document.hidden) { paused = true; return; }
  paused = false; lastTime = performance.now(); arena?.classList.remove('is-paused');
 }
});
function about() {
 showModal('Every slice is a choice.', `<p>FuLam One Slice is The Money Journey’s finance arcade. Choose a topic and slice its correct money bags in a continuous stream.</p><p>Practice has no time limit. The sprint finishes after ${E.GAME_RULES.sprintTarget} correct slices, with ${E.GAME_RULES.wrongPenaltySeconds} seconds added for each wrong slice. Repeated bags count as new chances to answer.</p><p>No account is needed. Completed sprint bests stay on this device, separately for each topic and difficulty. There is no online leaderboard in this game.</p><p>Optional explanations and official resources are available after you finish. Your score reflects gameplay, not overall financial ability.</p><p><a href="./OPEN_SOURCE.md" target="_blank" rel="noopener noreferrer">Open-source credits and licences ↗</a></p>`, '<button class="primary" id="close-modal">Got it</button>');
 $('#close-modal').onclick = closeModal;
}
$('#about-button').onclick = about;
function rules() {
 showModal('Read. Choose. Slice.', `<ol><li><strong>Pick a topic.</strong> Its question stays visible throughout your run.</li><li><strong>Swipe through correct bags.</strong> Hold your mouse button or use your finger. Let wrong choices fall.</li><li><strong>Keep going.</strong> Bags arrive continuously in a shuffled order, with varied timing and flight paths.</li><li><strong>Choose your finish.</strong> Practice lasts until you finish. Sprint ends at ${E.GAME_RULES.sprintTarget} correct cuts; every wrong cut adds ${E.GAME_RULES.wrongPenaltySeconds} seconds.</li></ol><div class="rule-points"><span>Correct +100</span><span>Wrong −150</span><span>Combo bonus</span></div><p>Keyboard: Tab to an active bag, then press Enter or Space. A missed correct bag breaks your combo. Review explanations after your run, whenever you want.</p>`, `<button class="primary" id="close-modal">Got it ${icon('slice')}</button>`);
 $('#close-modal').onclick = closeModal;
}
function topicCards() {
 return QUESTIONS.map((q, index) => {
  const best = playKind === 'sprint' ? readBest(q) : null;
  return `<button class="topic-card" data-topic="${escape(q.id)}"><span class="topic-number">${String(index + 1).padStart(2, '0')} / ${escape(q.chapter.toUpperCase())}</span><strong>${escape(q.chapter)}</strong><p>${escape(q.question)}</p><span class="topic-meta">${q.options.length} answers · ${q.options.filter(o => o.good).length} correct choices</span>${playKind === 'sprint' ? `<span class="local-best">On this device: ${best ? timeLabel(best.timeMs) : 'no completed sprint yet'}</span>` : ''}<span class="topic-start">Play this topic ${icon('arrow')}</span></button>`;
 }).join('');
}
function refreshTopicCards() {
 $('.topic-grid').innerHTML = topicCards();
 app.querySelectorAll('[data-topic]').forEach(button => { button.onclick = () => startGame(button.dataset.topic); });
}
function home() {
 phase = 'home'; paused = false; closeModal();
 render(`<section class="hero page-in"><div class="hero-copy"><div class="eyebrow"><span class="live-dot"></span> THE MONEY CHOICE CHALLENGE</div><h1>One topic.<br>Keep <span class="gold">slicing.</span></h1><p class="hero-desc">A continuous stream of money choices.<br>Read the question. Find your rhythm.<br><strong>How long can you keep a combo?</strong></p><div class="mode-picker" aria-label="Game difficulty">${Object.entries(E.DIFFICULTIES).map(([key, d]) => `<button data-mode="${key}" aria-pressed="${mode === key}">${d.label}<span>${d.description}</span></button>`).join('')}</div><div class="play-kind-picker" aria-label="Play mode"><button data-play-kind="practice" aria-pressed="${playKind === 'practice'}"><strong>Endless practice</strong><span>No time limit · finish when you want</span></button><button data-play-kind="sprint" aria-pressed="${playKind === 'sprint'}"><strong>20-correct sprint</strong><span>Beat your time · +3s per wrong slice</span></button></div><div class="hero-actions"><a class="primary" href="#topics">Choose a topic ${icon('arrow')}</a><button class="text-button" id="how-to">How to play ↗</button></div><div class="hero-meta"><span>No rounds or waiting</span><span>Phone or desktop</span><span>Open to everyone</span></div></div><div class="hero-art" aria-hidden="true"><div class="art-glow"></div><div class="orbit"></div><div class="orbit two"></div><div class="small-bag one">${bag()}</div><div class="small-bag two">${bag()}</div><div class="hero-bag">${bag()}</div><div class="art-label">Stocks</div><div class="art-slice"></div><div class="floating-label top">Pick your topic ↗</div><div class="floating-label bottom">✦ GOOD CHOICE +100</div><span class="art-number">YOUR NEXT MOVE</span><span class="spark s1">✦</span><span class="spark s2">✧</span><span class="spark s3">✦</span></div></section><section class="topic-menu" id="topics"><div class="topic-menu-heading"><div class="eyebrow">PICK YOUR TOPIC</div><h2>One topic. Non-stop choices.</h2><p>Each entrance has its own question and answer pool. Read once, then keep slicing.</p></div><div class="topic-grid">${topicCards()}</div></section><section class="bottom-strip" aria-label="Game features"><div class="strip-item"><span class="strip-number">05</span><div><strong>Separate topic entrances</strong><small>Tools · Investing · Insurance · Loans · Scams</small></div></div><div class="strip-item"><span class="strip-number">${totalChoices()}</span><div><strong>Different money choices</strong><small>Shuffled answers, timing and flight paths.</small></div></div><div class="strip-item"><span class="strip-number">∞</span><div><strong>Keep your rhythm</strong><small>Practice freely or chase a sprint best.</small></div></div></section>`);
 app.querySelectorAll('[data-mode]').forEach(button => {
  button.onclick = () => {
   mode = button.dataset.mode; prefs.set('mode', mode);
   app.querySelectorAll('[data-mode]').forEach(other => other.setAttribute('aria-pressed', String(other === button)));
   refreshTopicCards();
  };
 });
 app.querySelectorAll('[data-play-kind]').forEach(button => {
  button.onclick = () => {
   playKind = button.dataset.playKind; prefs.set('play-kind', playKind);
   app.querySelectorAll('[data-play-kind]').forEach(other => other.setAttribute('aria-pressed', String(other === button)));
   refreshTopicCards();
  };
 });
 app.querySelectorAll('[data-topic]').forEach(button => { button.onclick = () => startGame(button.dataset.topic); });
 $('#how-to').onclick = rules;
}
$('#brand-home').onclick = () => {
 if (['playing', 'ready'].includes(phase)) {
  showModal('Return to the game menu?', '<p>This run will end. Unfinished sprints do not replace your best time.</p>', '<button class="primary" id="continue-game">Keep playing</button><button class="text-button" id="leave-game">Game menu</button>');
  $('#continue-game').onclick = closeModal; $('#leave-game').onclick = home;
 } else home();
};
function startGame(topicId) {
 const selected = QUESTIONS.find(q => q.id === topicId);
 if (!selected) return;
 question = selected; session = E.createSession(); optionDeck = E.createOptionDeck(question.options);
 optionStats = new Map(question.options.map(option => [option.id, {option, shown: 0, correct: 0, wrong: 0, missed: 0, avoided: 0}]));
 elapsed = 0; nextSpawnAt = 0; spawned = 0; avoided = 0; lastGroup = []; finalTimeMs = null; bestResult = null; runSerial++;
 phase = 'ready'; paused = false; closeModal(); renderGame();
}
function renderGame() {
 const q = question;
 render(`<section class="game-wrap"><div class="game-topline"><div class="progress-steps"><span class="step-dot current"></span><span class="round-number">${escape(q.chapter)} · ${playKind === 'sprint' ? '20-correct sprint' : 'Endless practice'}</span></div><div class="game-tools"><button type="button" class="language-switch">English</button><span class="mode-label">${difficulty().label} · continuous play</span><button class="icon-button" id="game-sound" aria-label="Sound">${icon(sound ? 'volume' : 'muted')}</button><button class="icon-button" id="game-fullscreen" aria-label="Toggle fullscreen">${icon('expand')}</button><button class="icon-button" id="pause-game" aria-label="Pause game">${icon('pause')}</button></div></div><div class="game-panel"><div class="question-bar"><div class="eyebrow">${escape(q.eyebrow)}</div><h1>${escape(q.question)}</h1><p class="question-context">${escape(q.context)}</p></div><div class="game-hud"><div class="score-block"><span>SCORE</span><strong class="score-value" id="score">0</strong><span class="combo-block" id="combo"></span></div><div class="run-progress"><span id="run-goal">${playKind === 'sprint' ? '0 / 20 CORRECT' : 'NO TIME LIMIT'}</span><strong class="sprint-clock" id="run-clock" ${playKind === 'practice' ? 'hidden' : ''}>0:00.00</strong><div class="session-stats"><span id="correct-count">0 correct</span><span id="wrong-count">0 wrong</span><span id="missed-count">0 missed</span></div></div></div><div class="arena" id="arena" role="group" aria-label="Money bag slicing arena"><span class="arena-caption">SLICE THE RIGHT CHOICES</span><span class="arena-watermark">FuLam One Slice</span><canvas class="trail" id="trail" aria-hidden="true"></canvas><span class="knife-cursor" id="knife-cursor" aria-hidden="true"><img src="knife.svg" alt="" draggable="false"></span><div class="arena-overlay" id="ready-overlay"><div class="ready-card"><div class="ready-icon">${icon('slice')}</div><h2>${escape(q.chapter)}</h2><p>Read the question above.<br>Slice correct choices and let wrong ones fall.<br>${q.options.length} different answers · ${difficulty().label}<br>${playKind === 'sprint' ? '20 correct slices to finish. Wrong cuts add 3 seconds.' : 'No time limit. Finish whenever you want.'}</p><button class="primary" id="ready-button">Ready to slice ${icon('arrow')}</button></div></div></div><div class="arena-footer"><span>${playKind === 'sprint' ? 'Wrong slice +3s · Missed correct bag breaks combo' : 'Correct +100 · Wrong −150 · Combo bonus'}</span><button class="finish-session" id="finish-session">Finish & review →</button></div></div><p class="small-note">Bags keep coming · Same topic throughout · Keyboard: Tab to a bag, Enter or Space to slice</p></section>`);
 arena = $('#arena'); canvas = $('#trail'); ctx = canvas.getContext('2d'); knife = $('#knife-cursor');
 resizeArena(); bindPointer();
 $('#pause-game').onclick = pauseGame;
 $('#game-sound').onclick = () => $('#sound-toggle').click();
 $('#game-fullscreen').onclick = () => $('#fullscreen').click();
 $('#finish-session').disabled = true; $('#finish-session').onclick = () => finishSession(false);
 $('#ready-button').onclick = beginStream;
 updateSound();
}
function resizeArena() {
 if (!arena) return;
 const rect = arena.getBoundingClientRect(); arenaWidth = rect.width; arenaHeight = rect.height;
 arenaCeiling = Math.max(70, ($('.question-bar')?.getBoundingClientRect().bottom ?? rect.top + 160) - rect.top + 20);
 flightFloor = Math.min(arenaHeight, ($('.game-hud')?.getBoundingClientRect().top ?? rect.bottom) - rect.top - 8);
 arena.style.setProperty('--flight-ceiling', arenaCeiling + 'px');
 if (canvas && ctx) {
  const dpr = Math.min(devicePixelRatio || 1, 2);
  canvas.width = Math.round(arenaWidth * dpr); canvas.height = Math.round(arenaHeight * dpr);
  canvas.style.width = arenaWidth + 'px'; canvas.style.height = arenaHeight + 'px'; ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
 }
 targets.forEach(target => { target.metrics = measureTarget(target.el); });
 // A narrower viewport must not retain more scheduled or airborne bags than its cap.
 if (targets.length > liveCap()) {
  const excess = targets.splice(liveCap());
  excess.forEach(target => { target.el.remove(); });
 }
}
window.addEventListener('resize', resizeArena);
function beginStream() {
 if (phase !== 'ready') return;
 phase = 'playing'; paused = false; $('#ready-overlay')?.remove(); $('#finish-session').disabled = false;
 arena.classList.add('knife-enabled'); lastTime = performance.now(); nextSpawnAt = 0;
 playSound('start'); spawnIfReady(); positionTargets(); updateHUD(); raf = requestAnimationFrame(loop);
}
// Sample free trajectories, then favour paths whose labels stay apart near the apex.
// This is a spatial check, not a lane or answer-position assignment.
function measureTarget(el) {
 const label = el.querySelector('.option-label'), width = el.offsetWidth, height = el.offsetHeight;
 const labelTop = label?.offsetTop ?? Math.round(height * .6);
 const labelHeight = label?.offsetHeight || 54;
 return {width, height, labelTop, labelHeight, labelBottom: labelTop + labelHeight};
}
function targetPosition(plan, progress, metrics) {
 // Leave the question in place. Decorative art may use its 20px bottom gap;
 // the readable label, rather than empty button padding, sets the lower edge.
 const visualHeight = Math.max(metrics.labelBottom, metrics.height * .65);
 const availableHeight = flightFloor - arenaCeiling;
 let apexCeiling = arenaCeiling - 20;
 if (availableHeight < metrics.labelBottom + 40) {
  // In very short landscape views, let the decorative top pass behind the
  // question while keeping the label and some bag art in the open space.
  const visibleArt = Math.min(32, Math.max(0, (availableHeight - metrics.labelHeight) * .4));
  apexCeiling = Math.min(apexCeiling, arenaCeiling - metrics.labelTop + visibleArt);
 }
 return E.arcadePosition(plan, progress, arenaWidth, flightFloor + 85,
  metrics.width, visualHeight, Math.max(24, apexCeiling));
}
function chooseLaunch(initial, metrics) {
 const others = targets.filter(target => !target.hit);
 if (!others.length) return initial;
 let best = initial, bestSeparation = -1;
 for (let attempt = 0; attempt < 12; attempt++) {
  const plan = attempt ? {...E.createLaunches(1, mode)[0], delay: initial.delay} : initial;
  let separation = Infinity;
  for (const progress of [.35, .5, .65]) {
   const future = elapsed + plan.delay + plan.duration * progress;
   const pos = targetPosition(plan, progress, metrics);
   for (const other of others) {
    const otherProgress = (future - other.bornAt - other.launch.delay) / other.launch.duration;
    if (otherProgress <= 0 || otherProgress >= 1) continue;
    const otherMetrics = other.metrics;
    const otherPos = targetPosition(other.launch, otherProgress, otherMetrics);
    if (otherPos.y > flightFloor || otherPos.y + otherMetrics.height < arenaCeiling) continue;
    const dx = (pos.x + metrics.width / 2 - otherPos.x - otherMetrics.width / 2) / ((metrics.width + otherMetrics.width) / 2 + 14);
    const dy = (pos.y + metrics.labelTop - otherPos.y - otherMetrics.labelTop) / ((metrics.labelHeight + otherMetrics.labelHeight) / 2 + 12);
    separation = Math.min(separation, Math.hypot(dx, dy));
   }
  }
  if (separation > bestSeparation) { best = plan; bestSeparation = separation; }
 }
 return best;
}
// Continuous spawn clock adapted from an1kens/fruit-blade WaveManager.update (MIT); see OPEN_SOURCE.md.
function spawnIfReady() {
 if (!arena || phase !== 'playing' || paused || elapsed < nextSpawnAt) return;
 const available = Math.max(0, liveCap() - targets.filter(target => !target.hit).length);
 if (!available) return;
 const count = Math.min(available, Math.max(1, E.spawnGroupSize(available)));
 const launches = E.createLaunches(count, mode);
 lastGroup = [];
 for (let index = 0; index < count; index++) {
  const option = optionDeck.next();
  const instanceId = `${runSerial}:${++spawned}`;
  const el = document.createElement('button');
  el.className = 'target choice-target'; el.dataset.instanceId = instanceId; el.dataset.optionId = option.id;
  el.setAttribute('aria-label', 'Slice: ' + option.text); el.style.visibility = 'hidden'; el.disabled = true;
  el.innerHTML = bag('bag-svg') + `<span class="option-label">${escape(option.text)}</span>`;
  arena.append(el);
  const metrics = measureTarget(el), launch = chooseLaunch(launches[index], metrics);
  const target = {instanceId, option, el, metrics, hit: false, active: false, shown: false, x: 0, y: 0, bornAt: elapsed, launch};
  targets.push(target);
  lastGroup.push({instanceId, optionId: option.id, bornAt: elapsed, launch: {...launch}});
  // Keep the handler on this short-lived node, not the run's shared AbortSignal.
  el.onclick = event => { if (event.detail === 0) cutTarget(target); };
 }
 nextSpawnAt = elapsed + E.nextSpawnDelay(mode);
}
function positionTargets() {
 if (!arena) return;
 const remaining = [];
 for (const target of targets) {
  if (target.hit) { target.el.remove(); continue; }
  const localTime = elapsed - target.bornAt - target.launch.delay;
  if (localTime >= target.launch.duration) {
   const stats = optionStats.get(target.option.id);
   if (target.shown) {
    E.recordMiss(session, target.instanceId, target.option);
    if (target.option.good) stats.missed++;
    else { avoided++; stats.avoided++; }
   }
   target.el.remove(); continue;
  }
  target.active = false;
  if (localTime >= 0) {
   const progress = localTime / target.launch.duration, metrics = target.metrics;
   const pos = targetPosition(target.launch, progress, metrics);
   target.x = pos.x; target.y = pos.y;
   target.el.style.transform = `translate(${pos.x}px,${pos.y}px)`;
   target.el.style.setProperty('--bag-rotation', reducedMotion ? '0deg' : ((progress - .5) * target.launch.rotation * 2) + 'deg');
   // A bag is cuttable only once its label is fully inside the playing space.
   target.active = pos.y + metrics.labelTop >= arenaCeiling && pos.y + metrics.labelBottom <= flightFloor;
   if (target.active && !target.shown) { target.shown = true; optionStats.get(target.option.id).shown++; }
   target.el.style.visibility = pos.y < flightFloor && pos.y + metrics.height > arenaCeiling ? 'visible' : 'hidden';
  } else target.el.style.visibility = 'hidden';
  target.el.disabled = !target.active; target.el.setAttribute('aria-hidden', String(!target.active));
  target.el.style.pointerEvents = target.active ? '' : 'none';
  remaining.push(target);
 }
 targets = remaining;
}
function loop(now) {
 if (phase !== 'playing') return;
 const frameDelta = Math.max(0, now - lastTime) / 1000;
 advanceClock(now);
 if (!paused) { positionTargets(); spawnIfReady(); drawTrail(now, Math.min(frameDelta, .05)); updateHUD(); }
 raf = requestAnimationFrame(loop);
}
function updateHUD() {
 if (!$('#score')) return;
 $('#score').textContent = session.score;
 $('#combo').textContent = session.combo > 1 ? `${session.combo} COMBO` : '';
 $('#correct-count').textContent = `${session.correct} correct`;
 $('#wrong-count').textContent = `${session.wrong} wrong`;
 $('#missed-count').textContent = `${session.missed} missed`;
 $('#run-goal').textContent = playKind === 'sprint' ? `${session.correct} / ${E.GAME_RULES.sprintTarget} CORRECT` : 'NO TIME LIMIT';
 $('#run-clock').textContent = timeLabel(playKind === 'sprint' ? E.sprintTimeMs(elapsed, session.wrong) : Math.ceil(elapsed * 1000));
 $('#run-clock').title = playKind === 'sprint' ? `Includes ${session.wrong * E.GAME_RULES.wrongPenaltySeconds} seconds of wrong-slice penalties` : 'Time played';
}
function cutTarget(target) {
 if (target.hit || !target.active || paused || phase !== 'playing') return;
 advanceClock();
 const result = E.recordHit(session, question.id, target.option, target.instanceId);
 if (!result) return;
 target.hit = true; target.active = false; target.el.disabled = true;
 target.el.classList.add(target.option.good ? 'cut-good' : 'cut-bad');
 const stats = optionStats.get(target.option.id); stats[target.option.good ? 'correct' : 'wrong']++;
 playSound(target.option.good ? 'good' : 'bad');
 const centerX = target.x + target.el.offsetWidth / 2, centerY = target.y + target.el.offsetHeight * .48;
 splitBag(target); effects.burst(centerX, centerY, target.option.good, arenaWidth < 650 ? .8 : 1);
 feedback(centerX, centerY, result.delta > 0 ? '+' + result.delta : String(result.delta), target.option.good ? (result.combo > 1 ? result.combo + ' COMBO' : 'Good choice!') : (playKind === 'sprint' ? '+3 seconds' : 'Wrong choice'), target.option.good);
 updateHUD(); announce(target.option.text + ': ' + (target.option.good ? 'Correct slice' : 'Wrong slice'));
 if (playKind === 'sprint' && session.correct >= E.GAME_RULES.sprintTarget) finishSession(true);
}
function feedback(x, y, text, sub, good) {
 const el = document.createElement('div'); el.className = 'feedback-tag' + (good ? '' : ' bad');
 el.style.left = x + 'px'; el.style.top = y + 'px'; el.innerHTML = escape(text) + `<small>${escape(sub)}</small>`;
 arena.append(el); later(() => el.remove(), 1000);
}
function splitBag(target) {
 const art = target.el.querySelector('.bag-svg').getBoundingClientRect(), bounds = arena.getBoundingClientRect();
 for (const side of ['left', 'right']) {
  const part = document.createElement('div'); part.className = 'bag-fragment ' + side;
  part.style.left = (art.left - bounds.left) + 'px'; part.style.top = (art.top - bounds.top) + 'px';
  part.style.width = art.width + 'px'; part.style.height = art.height + 'px'; part.innerHTML = bag();
  arena.append(part); later(() => part.remove(), 700);
 }
}
function hideKnife() { knife?.classList.remove('visible', 'slicing'); }
function moveKnife(point, active, dx = 0) {
 if (!knife) return;
 knife.style.left = point.x + 'px'; knife.style.top = point.y + 'px';
 knife.style.setProperty('--tilt', Math.max(-28, Math.min(28, dx * .7)) + 'deg');
 knife.classList.add('visible'); knife.classList.toggle('slicing', active);
}
function bindPointer() {
 arenaEvents = new AbortController(); const opts = {signal: arenaEvents.signal};
 const getPoint = event => { const rect = arena.getBoundingClientRect(); return {x: event.clientX - rect.left, y: event.clientY - rect.top, t: performance.now()}; };
 const canSlice = () => !paused && phase === 'playing';
 arena.addEventListener('pointerdown', event => {
  if (!canSlice() || event.button > 0 || pointer) return;
  event.preventDefault(); const point = getPoint(event); pointer = {id: event.pointerId, point};
  trail.push(point); moveKnife(point, true); playSound('slice'); arena.setPointerCapture(event.pointerId);
 }, opts);
 arena.addEventListener('pointermove', event => {
  if (!canSlice()) { hideKnife(); return; }
  const point = getPoint(event);
  if (!pointer) { if (event.pointerType !== 'touch') moveKnife(point, false); return; }
  if (pointer.id !== event.pointerId) return;
  event.preventDefault(); const previous = pointer.point; moveKnife(point, true, point.x - previous.x);
  if (Math.hypot(point.x - previous.x, point.y - previous.y) < 2) return;
  for (const target of targets) {
   if (target.hit || !target.active) continue;
   const width = target.el.offsetWidth, height = target.el.offsetHeight;
   const rect = {left: target.x + 12, right: target.x + width - 12, top: Math.max(arenaCeiling, target.y + 18), bottom: Math.min(flightFloor, target.y + height - 10)};
   if (E.segmentIntersectsRect(previous, point, rect)) cutTarget(target);
   if (!canSlice()) return;
  }
  trail.push(point); if (trail.length > 80) trail.shift();
  if (pointer) pointer.point = point;
 }, opts);
 const end = event => {
  if (pointer?.id !== event.pointerId) return;
  pointer = null;
  if (event.type === 'pointerup' && event.pointerType === 'mouse' && canSlice()) knife?.classList.remove('slicing'); else hideKnife();
 };
 arena.addEventListener('pointerup', end, opts); arena.addEventListener('pointercancel', end, opts); arena.addEventListener('lostpointercapture', end, opts);
 arena.addEventListener('pointerleave', () => { if (!pointer) hideKnife(); }, opts);
}
function drawTrail(now, dt) {
 if (!ctx) return;
 ctx.clearRect(0, 0, arenaWidth, arenaHeight); effects.draw(ctx, dt);
 trail = trail.filter(point => now - point.t < 180); if (trail.length < 2) return;
 ctx.save(); ctx.lineCap = 'round'; ctx.lineJoin = 'round';
 for (let index = 1; index < trail.length; index++) {
  const alpha = Math.max(0, 1 - (now - trail[index].t) / 180);
  ctx.beginPath(); ctx.moveTo(trail[index - 1].x, trail[index - 1].y); ctx.lineTo(trail[index].x, trail[index].y);
  ctx.strokeStyle = `rgba(120,214,255,${alpha * .12})`; ctx.lineWidth = 20; ctx.stroke();
  ctx.strokeStyle = `rgba(184,236,255,${alpha * .4})`; ctx.lineWidth = 8; ctx.stroke();
  ctx.strokeStyle = `rgba(255,251,224,${alpha})`; ctx.lineWidth = 2.5; ctx.stroke();
 }
 ctx.restore();
}
function pauseGame() {
 if (phase !== 'playing') { toast('There is no countdown on the ready screen. Take your time to read.'); return; }
 showModal('Game paused', '<p>Your bags and clock are paused. Continue when you are ready.</p>', `<button class="primary" id="resume">Resume ${icon('arrow')}</button><button class="text-button" id="pause-finish">Finish & review</button><button class="text-button" id="pause-home">Game menu</button>`);
 $('#resume').onclick = closeModal;
 $('#pause-finish').onclick = () => finishSession(false);
 $('#pause-home').onclick = home;
}
document.addEventListener('visibilitychange', () => {
 if (phase === 'playing' && document.hidden && !paused) pauseGame();
 if (phase === 'playing' && !document.hidden && paused && !modal.open) pauseGame();
});
window.addEventListener('blur', () => { if (phase === 'playing' && !paused) pauseGame(); });
function sourceLinks(q) {
 return q.sources?.length ? `<details class="source-links"><summary>Official learning resources ↗</summary>${q.sources.map(source => `<a href="${escape(source.url)}" target="_blank" rel="noopener noreferrer">${escape(source.title)} ↗</a>`).join('')}</details>` : '';
}
function reviewCards() {
 const mistakes = [...optionStats.values()].filter(stats => stats.wrong || stats.missed);
 if (!mistakes.length) return '<p class="empty-review">No wrong slices or missed correct bags in this run. Try another topic or difficulty.</p>';
 return `<div class="decisions-grid">${mistakes.map(stats => `<article class="decision-card ${stats.wrong ? 'wrong' : 'missed'}"><div class="decision-top"><span class="decision-title">${escape(stats.option.text)}</span><span class="status-pill">${stats.wrong ? `${stats.wrong} wrong slice${stats.wrong === 1 ? '' : 's'}` : `${stats.missed} missed`}</span></div><p>${escape(stats.option.why)}</p></article>`).join('')}</div>`;
}
function finishSession(completed) {
 if (phase !== 'playing') return;
 advanceClock(); finalTimeMs = E.sprintTimeMs(elapsed, session.wrong);
 phase = 'results'; paused = false; closeModal();
 if (playKind === 'sprint' && completed && session.correct >= E.GAME_RULES.sprintTarget) {
  const previous = readBest(question), improved = !previous || finalTimeMs < previous.timeMs;
  const saved = improved ? prefs.set(bestKey(question), JSON.stringify({timeMs: finalTimeMs, wrong: session.wrong, score: session.score})) : true;
  bestResult = {timeMs: improved && saved ? finalTimeMs : previous?.timeMs, improved: improved && saved, saved};
 }
 showResults(completed);
}
function showResults(completed) {
 const q = question, mistakes = [...optionStats.values()].filter(stats => stats.wrong || stats.missed).length;
 const sprintComplete = playKind === 'sprint' && completed;
 const primaryResult = sprintComplete ? timeLabel(finalTimeMs) : session.score.toLocaleString();
 const resultCaption = sprintComplete ? `Raw time ${timeLabel(Math.ceil(elapsed * 1000))} + ${session.wrong * E.GAME_RULES.wrongPenaltySeconds}s penalties` : `Time played ${timeLabel(Math.ceil(elapsed * 1000))} · Best ${session.bestCombo} combo`;
 render(`<section class="results-page page-in"><div class="result-top"><div class="result-emblem">${icon('slice')}</div><div class="eyebrow">${sprintComplete ? '20-CORRECT SPRINT COMPLETE' : playKind === 'sprint' ? 'SPRINT ENDED EARLY' : 'PRACTICE COMPLETE'}</div><h1>${sprintComplete ? 'Your next target: a faster run.' : 'That was your rhythm.'}</h1><p>${escape(q.chapter)} · ${difficulty().label}</p><div class="big-score">${primaryResult}<small>${sprintComplete ? 'final time' : 'points'}</small></div><p>${resultCaption}</p>${sprintComplete ? `<p class="local-best">${bestResult.saved ? `${bestResult.improved ? 'New best! ' : ''}On this device: ${timeLabel(bestResult.timeMs)}` : 'This browser could not save your best time.'}</p>` : playKind === 'sprint' ? '<p class="local-best">Complete 20 correct slices to record a sprint best on this device.</p>' : ''}</div><div class="results-stats"><div class="result-stat"><strong>${session.correct}</strong><small>Correct bags sliced</small></div><div class="result-stat"><strong>${avoided}</strong><small>Wrong bags avoided</small></div><div class="result-stat needs-work"><strong>${session.wrong}</strong><small>Wrong bags sliced</small></div><div class="result-stat needs-work"><strong>${session.missed}</strong><small>Correct bags missed</small></div></div><div class="action-card"><div class="action-number">✦</div><div><div class="eyebrow">${sprintComplete ? `${session.score} POINTS · BEST ${session.bestCombo} COMBO` : 'ONE THING TO KEEP'}</div><p>${escape(q.takeaway)}</p></div></div><div class="result-actions"><button class="primary" id="replay">Play this topic again ${icon('arrow')}</button><button class="secondary" id="choose-topic">Choose another topic</button><button class="secondary" id="review-mistakes">Review choices${mistakes ? ' · ' + mistakes : ''}</button><button class="text-button" id="copy-result">Copy results ↗</button></div><p class="result-caption">Every run reshuffles the answer pool and flight paths. Best times stay on this device, separately for each topic and difficulty.</p><div class="result-review" id="result-review" hidden><h2>A closer look at your choices.</h2>${reviewCards()}${sourceLinks(q)}</div></section>`);
 $('#replay').onclick = () => startGame(q.id); $('#choose-topic').onclick = home;
 $('#review-mistakes').onclick = () => {
  const box = $('#result-review'); box.hidden = !box.hidden;
  if (!box.hidden) box.scrollIntoView({behavior: reducedMotion ? 'instant' : 'smooth', block: 'start'});
 };
 $('#copy-result').onclick = async () => {
  const text = `FuLam One Slice · ${q.chapter} · ${difficulty().label}\n${sprintComplete ? `20-correct sprint: ${timeLabel(finalTimeMs)} (includes ${session.wrong * E.GAME_RULES.wrongPenaltySeconds}s penalties)` : `${playKind === 'sprint' ? 'Unfinished sprint' : 'Endless practice'}: ${session.score} points`}\n${session.correct} correct · ${session.wrong} wrong · ${session.missed} missed · Best ${session.bestCombo} combo\nThe Money Journey · FuLam`;
  try { await navigator.clipboard.writeText(window.FuLamSliceLanguage?.translate(text) || text); toast('Results copied!'); }
  catch {
   showModal('Your results', `<p class="copyable-result">${escape(text)}</p>`, '<button class="primary" id="close-modal">Done</button>'); $('#close-modal').onclick = closeModal;
  }
 };
 announce(sprintComplete ? 'Sprint complete. Final time ' + timeLabel(finalTimeMs) : 'Run complete. Total score ' + session.score);
}
function freezeSnapshot(value) {
 if (value && typeof value === 'object') { Object.values(value).forEach(freezeSnapshot); Object.freeze(value); }
 return value;
}
Object.defineProperty(window, 'FuLamSlice', {value: Object.freeze({getState() {
 return freezeSnapshot({
  phase, paused, topic: question?.id ?? null, mode: playKind, playKind, difficulty: mode, elapsed,
  score: session.score, correct: session.correct, wrong: session.wrong, missed: session.missed, flightFloor, arenaCeiling,
  combo: session.combo, bestCombo: session.bestCombo, avoided, spawned, cap: liveCap(),
  pending: targets.filter(target => !target.hit && elapsed < target.bornAt + target.launch.delay).length,
  active: targets.filter(target => !target.hit && target.active).map(target => ({id: target.instanceId, option: {...target.option}, x: target.x, y: target.y, width: target.el.offsetWidth, height: target.el.offsetHeight, labelTop: target.y + target.metrics.labelTop, labelBottom: target.y + target.metrics.labelBottom})),
  scheduled: targets.filter(target => !target.hit).map(target => ({id: target.instanceId, optionId: target.option.id, bornAt: target.bornAt, launch: {...target.launch}})),
  nextSpawnAt, nextSpawnIn: Math.max(0, nextSpawnAt - elapsed), lastGroup: lastGroup.map(item => ({...item, launch: {...item.launch}})),
  reviewOptionCount: optionStats.size, timerCount: cleanupTimers.size, finalTimeMs, rules: {...E.GAME_RULES}
 });
}}), writable: false, configurable: false});
home();
};
