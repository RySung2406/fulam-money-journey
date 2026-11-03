(function () {
  'use strict';
  const C = window.FleetCore, $ = id => document.getElementById(id);
  const canvas = $('game'), ctx = canvas.getContext('2d');
  const canvasFont = getComputedStyle(document.documentElement).getPropertyValue('--font');
  let labelScale = 1;
  const KEY = 'fulam-fleet-best-v1';
  const safeGet = key => { try { return localStorage.getItem(key); } catch { return null; } };
  const safeSet = (key, value) => { try { localStorage.setItem(key, value); return true; } catch { return false; } };
  let lang = safeGet('fulam-language') === 'en' ? 'en' : 'zh-Hant';
  const EN = {
    home: 'Back to FuLam Money Journey', settings: 'Game settings', arcade: 'ARCADE HARBOUR', soundOff: 'Sound: off', soundOn: 'Sound: on', fullscreen: 'Full screen',
    tag: 'ENDLESS AIR ARCADE · BETA', title: 'Wealth<br>Wings', subtitle: 'Protect your capital.<br>Chart your own course.',
    intro: 'The enemy keeps coming. Turn your loot into firepower, or keep a cash reserve for an emergency shield?',
    move: 'Move · drag or tap the sky on mobile', autofire: 'Automatic targeting & rapid fire', shieldRule: 'Spend your reserve to raise a shield', best: 'LOCAL BEST', local: 'Only your best result stays in this browser', back: '← Back to the arcade',
    battle: 'Air battle', capital: 'CAPITAL ARMOUR', cash: 'GAME COINS', score: 'WEALTH SCORE',
    canvas: 'Air shooter. WASD or arrow keys to move, Q for shield, 1 to 4 for upgrades, P to pause.',
    auto: 'AUTO FIRE', boss: 'DEBT STORM · BOSS', menuTag: 'PILOT, READY TO FLY.', menuTitle: 'How long can you<br>protect your capital?',
    menuHint: 'Drag to dodge. Your guns fire automatically.<br>Endless waves. Fly until defeated.', chooseMode: 'Choose difficulty',
    standard: 'Standard', standardHint: '100 capital · rising pressure', storm: 'Challenge', stormHint: '75 capital · faster fire', start: 'Take off',
    pausedTag: 'FLIGHT PAUSED', paused: 'Battle paused', pausedHint: 'Return to sea when you are ready.', resume: 'Continue flight',
    endTag: 'FLIGHT COMPLETE', endTitle: 'Aircraft down.<br>Go further next time.', restart: 'Fly again', share: 'Copy result', changeMode: 'Change difficulty',
    pause: 'Pause', mobileHint: 'Drag or tap the sky to move. Firing is automatic.', shield: 'Emergency shield', directionPad: 'Movement buttons', left: 'Move left', right: 'Move right', up: 'Move up', down: 'Move down',
    dockTag: 'YOUR UPGRADE DECISIONS', dock: 'Aircraft workshop', dockHint: 'Invest in strength. Keep cash for survival.',
    weapon: 'Compound cannon', escort: 'Diversify escorts', reserve: 'Reserve system', repair: 'Repair capital', repairHint: 'Restore 35 armour immediately',
    income: 'RESERVE INCOME', incomeHint: 'Cash earns game income every 15 seconds. Upgrade reserves to increase income and coin pickup range.',
    enemyTag: 'KNOW THE THREAT', fee: 'Impulse spending', feeHint: 'Light raider', inflation: 'Inflation', inflationHint: 'Fan-shaped fire', scam: 'Investment scam', scamHint: 'Fast zigzag', debt: 'High-interest debt', debtHint: 'Homing torpedoes',
    label_fee: 'Spending', label_inflation: 'Inflation', label_scam: 'Scam', label_debt: 'Debt',
    metaphor: 'Money concepts become aircraft abilities. Coins, income and armour are fictional game values.', credits: 'Open-source credits & licence', creditNote: 'Combat core adapted from',
    changes: 'Adds endless waves, finance-themed upgrades, new aircraft art, touch controls and bilingual UI. Original music and font assets are not used.',
    wave: 'SECTOR', combo: 'COMBO', max: 'MAX', full: 'FULL', ready: 'coins · ready', active: 'Shield active', cooldown: 'Ready in', seconds: 's', coins: 'coins',
    weapons: ['Homing cannon', 'Twin homing guns', 'Three-way spread', 'Piercing beams', 'Heavy plasma orbs'],
    escorts: ['Add a homing escort', 'Add a second escort', 'Rapid-fire escorts', 'Two rapid-fire escorts'],
    reserves: ['Longer shield · wider pickup', 'More income · cheaper shield', 'Maximum shield efficiency', 'Reserve system fully upgraded'],
    weaponNext: 'Next: ', equipped: 'Equipped: ', noCash: 'Collect more coins first', shieldWait: 'Shield is recharging', upgraded: 'Upgrade installed', repaired: 'Capital repaired',
    shieldRaised: 'EMERGENCY SHIELD', waveBanner: 'ENTERING SECTOR', bossBanner: 'WARNING · DEBT STORM', dividend: 'Reserve income', graze: 'CLOSE CALL +20',
    newBest: 'NEW LOCAL BEST', storageUnavailable: 'Saving is unavailable in this browser.', copied: 'Result copied — ready to share.', copyFallback: 'Copy this result:', fullscreenError: 'Full screen is not available in this browser.',
    endStats: (s) => `Sector ${s.wave} · ${s.kills} aircraft down · ${s.mode === 'storm' ? 'Challenge' : 'Standard'}`,
    tip: 'Keep a small cash reserve. A shield can save your next run.',
    shareText: s => `FuLam Wealth Wings: ${s.score.toLocaleString('en')} points · sector ${s.wave} · ${s.kills} aircraft down (${s.mode === 'storm' ? 'Challenge' : 'Standard'}). Can you beat me? https://rysung2406.github.io/fulam-money-journey/fleet/`
  };
  const ZH = {
    soundOn: '音效：開', wave: '空域', combo: '連擊', max: '滿級', full: '已滿', ready: '幣 · 就緒', active: '護盾生效中', cooldown: '冷卻', seconds: '秒', coins: '幣',
    label_fee: '衝動消費', label_inflation: '通脹', label_scam: '投資騙局', label_debt: '高息債務',
    weapons: ['追蹤火炮', '雙管追蹤炮', '三路散射炮', '貫穿射線炮', '重型能量球'],
    escorts: ['增加一架追蹤僚機', '增加第二架僚機', '僚機射速提升', '雙架高速僚機'],
    reserves: ['護盾更長 · 拾幣更遠', '收益提升 · 護盾更省', '護盾與儲備全面提升', '儲備系統已滿級'],
    weaponNext: '下級：', equipped: '裝備：', noCash: '先收集更多金幣', shieldWait: '護盾正在冷卻', upgraded: '升級完成', repaired: '本金已修復',
    shieldRaised: '應急護盾啟動', waveBanner: '進入空域', bossBanner: '警報 · 債務風暴來襲', dividend: '儲備收益', graze: '擦彈 +20',
    newBest: '刷新本機最佳', storageUnavailable: '此瀏覽器暫時無法保存成績。', copied: '已複製戰績，可以分享了。', copyFallback: '請複製以下戰績：', fullscreenError: '此瀏覽器暫不支援全螢幕。',
    endStats: s => `空域 ${s.wave} · 擊落 ${s.kills} 架 · ${s.mode === 'storm' ? '挑戰' : '標準'}`,
    tip: '留一筆應急金，下次危急時按 Q 開盾。',
    shareText: s => `富臨財富戰機：${s.score.toLocaleString('en')} 分 · 空域 ${s.wave} · 擊落 ${s.kills} 架（${s.mode === 'storm' ? '挑戰' : '標準'}）。你能超越我嗎？https://rysung2406.github.io/fulam-money-journey/fleet/`
  };
  const translated = [...document.querySelectorAll('[data-t]')];
  const originals = new Map(translated.map(e => [e, e.innerHTML]));
  const labels = [...document.querySelectorAll('[data-label]')];
  const originalLabels = new Map(labels.map(e => [e, e.getAttribute('aria-label')]));
  for (const e of translated) if (!(e.dataset.t in ZH)) ZH[e.dataset.t] = e.textContent;
  const t = key => (lang === 'en' ? EN : ZH)[key] ?? key;
  const journey=window.FuLamJourney?new window.FuLamJourney.UI('fleet',()=>lang):null;
  let mode = 'standard', phase = 'menu', game = C.createState({ seed: 742 }), best = null, paused = false;
  let sound = safeGet('fulam-fleet-sound-v1') !== 'off', lastSound = 0, resultIsBest = false, saveFailed = false;
  const soundscape = new window.FuLamArcade.Audio(sound);
  let shopOpen = false, deathTime = 0, lowHealthSound = 0;
  let pointerTarget = null, animation = 0, lastTime = null, accumulator = 0, hudTime = 0;
  let bannerTime = 0, bannerKey = '', bannerValue = '', toastTimer, shake = 0;
  const pressed = new Set(), particles = [], ripples = [], floats = [];
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const fx = new window.FuLamArcade.Effects(reduced.matches);
  const canvasPointers = new window.FuLamArcade.Pointers(), directionPointers = new Map();
  const bindAction = window.FuLamArcade.bindAction;
  Object.assign(EN, { workshop: 'Upgrades', closeDock: 'Back to sea', shopPaused: 'Battle paused · choose an upgrade', lowHealth: 'LOW ARMOUR · REPAIR OR SHIELD', exitScreen: 'Exit full screen' });
  Object.assign(ZH, { workshop: '升級', closeDock: '返回戰場', shopPaused: '戰局已暫停 · 安心選購升級', lowHealth: '護甲危急 · 修復或開盾', exitScreen: '退出全螢幕' });
  try { const stored = safeGet(KEY); if (stored && stored.length < 600) { const r = JSON.parse(stored); if (Number.isFinite(r.score) && r.score >= 0 && Number.isInteger(r.wave) && r.wave > 0 && Number.isInteger(r.kills) && r.kills >= 0 && ['standard', 'storm'].includes(r.mode)) best = r; } } catch { /* invalid records are ignored */ }
  function put(id, text) { const e = $(id); const s = String(text); if (e.textContent !== s) e.textContent = s; }
  function toast(key) { $('toast').textContent = t(key); $('toast').classList.add('show'); clearTimeout(toastTimer); toastTimer = setTimeout(() => $('toast').classList.remove('show'), 2400); }
  function setLanguage(next) {
    lang = next; safeSet('fulam-language', lang); document.documentElement.lang = lang;
    document.title = lang === 'en' ? 'FuLam Wealth Wings · FuLam Money Journey' : '富臨財富戰機 · FuLam Wealth Wings';
    for (const e of translated) e.innerHTML = lang === 'en' ? (EN[e.dataset.t] ?? originals.get(e)) : originals.get(e);
    for (const e of labels) e.setAttribute('aria-label', lang === 'en' ? (EN[e.dataset.label] ?? originalLabels.get(e)) : originalLabels.get(e));
    $('lang').textContent = lang === 'en' ? '繁中' : 'EN'; $('lang').setAttribute('aria-label', lang === 'en' ? '切換至繁體中文' : 'Switch to English');
    put('sound', t(sound ? 'soundOn' : 'soundOff'));
    syncSound();
    if (phase === 'over') renderEnd();
    $('banner').textContent = bannerTime > 0 ? `${t(bannerKey)} ${bannerValue}` : '';
    $('share-status').textContent = ''; $('toast').classList.remove('show'); updateHUD();
  }
  function unlockAudio() {
    void soundscape.unlock();
  }
  function syncSound() {
    for (const id of ['sound', 'battle-sound']) {
      $(id).setAttribute('aria-pressed', String(sound));
      $(id).setAttribute('aria-label', t(sound ? 'soundOn' : 'soundOff'));
    }
    put('sound', t(sound ? 'soundOn' : 'soundOff'));
    $('battle-sound').classList.toggle('muted', !sound);
  }
  function toggleSound() {
    sound = !sound; safeSet('fulam-fleet-sound-v1', sound ? 'on' : 'off');
    soundscape.setEnabled(sound); syncSound();
    if (sound) void soundscape.unlock().then(() => soundscape.play('coin'));
  }
  function closeWorkshop() {
    if (!shopOpen) return;
    shopOpen = false; $('combat-layout').classList.remove('workshop-open');
    $('dock-toggle').setAttribute('aria-expanded', 'false');
    $('dock').removeAttribute('role'); $('dock').removeAttribute('aria-modal');
    setPaused(false); $('dock-toggle').focus({ preventScroll: true });
  }
  function openWorkshop() {
    if (phase !== 'play' || paused) return;
    shopOpen = true; paused = true; clearInput(); accumulator = 0; soundscape.stop(); showOverlay(null);
    $('combat-layout').classList.add('workshop-open');
    $('dock-toggle').setAttribute('aria-expanded', 'true');
    $('dock').setAttribute('role', 'dialog'); $('dock').setAttribute('aria-modal', 'true');
    updateHUD(); $('dock-close').focus({ preventScroll: true });
  }
  function banner(key, value = '', seconds = 2.2) { bannerKey = key; bannerValue = value; bannerTime = seconds; $('banner').textContent = `${t(key)} ${value}`; $('banner').classList.add('show'); }
  function clearInput() { pressed.clear(); directionPointers.clear(); canvasPointers.clear(); pointerTarget = null; }
  function showOverlay(which) {
    $('overlay').hidden = !which;
    for (const id of ['menu', 'pause-menu', 'end-menu']) $(id).hidden = id !== which;
  }
  function start() {
    shopOpen = false; deathTime = lowHealthSound = 0; fx.clear();
    $('combat-layout').classList.remove('workshop-open');
    game = C.createState({ mode, arcade:!!journey, seed:journey?.scene==='booth'?20261104:Date.now() }); if(journey){journey.start($('sea'));$('sea').classList.add('journey-live');} phase = 'play'; paused = false; accumulator = 0; lastTime = null; lastSound = 0; saveFailed = false;
    clearInput(); particles.length = ripples.length = floats.length = 0; bannerTime = 0; $('banner').classList.remove('show'); shake = 0;
    showOverlay(null); unlockAudio(); $('pause').disabled = false; canvas.focus({ preventScroll: true }); updateHUD();
    if (matchMedia('(max-width:650px)').matches) document.querySelector('.battle').scrollIntoView({ block: 'start' });
  }
  function setPaused(value) {
    if (phase !== 'play') return;
    if (journey?.run?.phase==='choice') return;
    if (shopOpen) { if (!value) closeWorkshop(); return; }
    paused = value; clearInput(); accumulator = 0; showOverlay(paused ? 'pause-menu' : null); updateHUD();
    if (paused) soundscape.stop();
    if (paused) $('resume').focus({ preventScroll: true }); else { canvas.focus({ preventScroll: true }); unlockAudio(); }
  }
  function end() {
    journey?.run?.finish('defeat');journey?.close();
    if (phase !== 'play') return;
    phase = 'sinking'; paused = false; deathTime = reduced.matches ? .45 : 1.15; clearInput();
    fx.burst(game.hero.position.x, game.hero.position.y, { size: 48, heavy: true });
    fx.shatter(game.hero.position.x, game.hero.position.y, '#a6d5ce', 35);
    soundscape.play('death');
    updateHUD();
  }
  function finishSinking() {
    phase = 'over';
    if(journey){journey.result(game.score,{kills:game.kills},journey.run.reason||'defeat');}
    resultIsBest = !best || game.score > best.score; best = C.bestRecord(best, game);
    if (resultIsBest && !journey) saveFailed = !safeSet(KEY, JSON.stringify(best));
    showOverlay('end-menu'); renderEnd(); updateHUD(); $('restart').focus({ preventScroll: true });
  }
  function renderEnd() {
    put('end-label', journey?journey.text('本局戰績','RUN RECORD'):t(resultIsBest ? 'newBest' : 'endTag'));if(journey&&journey.run.reason==='time')document.querySelector('[data-t="endTitle"]').textContent=journey.text('Booth 挑戰完成！','Booth challenge complete!');else document.querySelector('[data-t="endTitle"]').innerHTML=t('endTitle'); put('end-score', game.score.toLocaleString('en'));
    put('end-stats', t('endStats')(game)); put('end-tip', t('tip'));if(journey)$('end-tip').innerHTML=journey.result(game.score,{kills:game.kills},journey.run.reason||'defeat'); if (saveFailed) put('share-status', t('storageUnavailable'));
  }
  function chooseMode(value) {
    mode = value;
    for (const id of ['standard', 'storm']) { $(id).classList.toggle('active', id === mode); $(id).setAttribute('aria-pressed', String(id === mode)); }
    if (phase === 'menu') { game = C.createState({ mode, seed: 742 }); updateHUD(); }
  }
  function purchase(kind) {
    if (phase !== 'play' || (paused && !shopOpen)) return;
    if (C.buy(game, kind)) { unlockAudio(); soundscape.play(kind === 'repair' ? 'repair' : 'upgrade'); toast(kind === 'repair' ? 'repaired' : 'upgraded'); }
    else if (C.upgradeCost(game, kind) !== null && game.cash < C.upgradeCost(game, kind)) toast('noCash');
    updateHUD();
  }
  function shield() {
    if (phase !== 'play' || paused) return;
    if (C.activateShield(game)) { soundscape.play('shield'); banner('shieldRaised', '', 1); }
    else toast(game.shieldCooldown > 0 ? 'shieldWait' : 'noCash'); updateHUD();
  }
  function updateHUD() {
    const active = phase === 'play' && (!paused || shopOpen), s = game;
    const hpHTML = `${s.hero.hp}<span>/ ${s.hero.maxHp}</span>`; if ($('hp').innerHTML !== hpHTML) $('hp').innerHTML = hpHTML;
    $('hp-bar').style.width = `${s.hero.hp / s.hero.maxHp * 100}%`; $('hp-bar').style.background = s.hero.hp < 30 ? 'var(--danger)' : 'var(--aqua)';
    put('cash', s.cash.toLocaleString('en')); put('score', s.score.toLocaleString('en')); put('best', (journey?journey.best():(best?.score || 0)).toLocaleString('en'));
    put('sector', `${t('wave')} ${String(s.wave).padStart(2, '0')}`); put('combo', s.combo >= 2 ? `${s.combo} ${t('combo')}` : '');
    put('wave-progress', journey?.run?`${Math.ceil(Math.max(0,30-journey.run.roundTime))}s`:`${Math.min(s.waveKills, s.goal)} / ${s.goal}`); $('wave-bar').style.width = `${journey?.run?journey.run.roundTime/30*100:Math.min(100, s.waveKills / s.goal * 100)}%`;
    put('income', `+${s.income}`); $('income-bar').style.width = `${s.dividend / 15 * 100}%`;
    $('pause').disabled = phase !== 'play' || shopOpen; $('shield').disabled = !active || shopOpen || s.shieldCooldown > 0 || s.cash < C.shieldCost(s);
    $('dock-toggle').disabled = phase !== 'play' || (paused && !shopOpen);
    $('sea').classList.toggle('low-health', phase === 'play' && s.hero.hp <= s.hero.maxHp * .3);
    $('low-health').hidden = phase !== 'play' || s.hero.hp > s.hero.maxHp * .3;
    put('shield-status', s.shield > 0 ? `${t('active')} ${Math.ceil(s.shield)}${t('seconds')}` : s.shieldCooldown > 0 ? `${t('cooldown')} ${Math.ceil(s.shieldCooldown)}${t('seconds')}` : `${C.shieldCost(s)} ${t('ready')}`);
    for (const kind of ['weapon', 'escort', 'reserve', 'repair']) {
      const cost = C.upgradeCost(s, kind), full = kind === 'repair' && s.hero.hp >= s.hero.maxHp;
      $(kind).disabled = !active || cost === null || full || s.cash < cost;
      put(`${kind}-cost`, full ? t('full') : cost === null ? t('max') : cost);
      if (kind !== 'repair') {
        const dots = Array.from({ length: C.MAX[kind] }, (_, i) => `<i class="${i < s[kind] ? 'on' : ''}"></i>`).join('');
        if ($(`${kind}-dots`).innerHTML !== dots) $(`${kind}-dots`).innerHTML = dots;
        let desc;
        if (kind === 'weapon') desc = `${t(s.weapon < 5 ? 'weaponNext' : 'equipped')}${t('weapons')[Math.min(4, s.weapon)]}`;
        else desc = t(kind === 'escort' ? 'escorts' : 'reserves')[s[kind]];
        if(journey?.run&&kind==='weapon')desc=journey.name(journey.run.weapon)+' · '+game.power.toFixed(2)+'×';put(`${kind}-desc`, desc);
      }
    }
    const boss = s.entities.find(e => e.kind === 'boss' && !e.dead); $('boss-bar').hidden = !boss || phase !== 'play';
    if (boss) $('boss-hp').style.width = `${Math.max(0, boss.hp / boss.maxHp * 100)}%`;
  }
  const COLORS = { player: '#a6d5ce', fee: '#eaa694', inflation: '#d9bc85', scam: '#f99664', debt: '#b6a2cc', boss: '#e7a08b', escort: '#9bc8cd' };
  function path(points, fill, stroke = null) {
    ctx.beginPath(); points.forEach(([x, y], i) => i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)); ctx.closePath();
    if (fill) { ctx.fillStyle = fill; ctx.fill(); } if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = 1; ctx.stroke(); }
  }
  function ship(x, y, angle, scale, kind, time, flash = 0) {
    const fill = flash > 0 ? '#fff5d6' : COLORS[kind];
    ctx.save(); ctx.translate(x, y); ctx.rotate(angle + Math.PI / 2); ctx.scale(scale, scale);
    // Original vector aircraft: swept wings, cockpit, wingtip lights and jet exhaust.
    ctx.fillStyle='#09192355';ctx.beginPath();ctx.ellipse(5,10,28,12,0,0,Math.PI*2);ctx.fill();
    const flame=10+Math.sin(time*38)*4;ctx.fillStyle=kind==='player'?'#a2f3ee':'#ffbd7d';
    path([[-4,19],[0,28+flame],[4,19]],ctx.fillStyle);ctx.globalAlpha=.35;path([[-7,18],[0,36+flame],[7,18]],ctx.fillStyle);ctx.globalAlpha=1;
    path([[0,-32],[6,-10],[31,12],[30,19],[7,11],[5,23],[13,29],[13,33],[0,28],[-13,33],[-13,29],[-5,23],[-7,11],[-30,19],[-31,12],[-6,-10]],fill,'#e1f3e9aa');
    path([[0,-23],[4,-7],[3,9],[-3,9],[-4,-7]],'#204758','#adf3ed');
    ctx.fillStyle='#f4d58f';ctx.fillRect(-25,14,5,2);ctx.fillRect(20,14,5,2);
    if(kind==='boss'){path([[-44,9],[-10,-11],[10,-11],[44,9],[42,27],[15,18],[-15,18],[-42,27]],'#d39582','#ffe2a8');path([[0,-35],[9,8],[0,26],[-9,8]],fill);}
    ctx.restore();
  }
  const ocean = document.createElement('canvas'); ocean.width = C.W; ocean.height = C.H;
  const ox = ocean.getContext('2d'), oceanGradient = ox.createLinearGradient(0, 0, C.W, C.H);
  oceanGradient.addColorStop(0, '#123c49'); oceanGradient.addColorStop(.5, '#0b2b3a'); oceanGradient.addColorStop(1, '#124653');
  ox.fillStyle = oceanGradient; ox.fillRect(0, 0, C.W, C.H);
  ox.strokeStyle = '#85b8b50b'; ox.lineWidth = 1;
  for (let x=0; x<C.W; x+=46) { ox.beginPath(); ox.moveTo(x,0); ox.lineTo(x,C.H); ox.stroke(); }
  for (let y=0; y<C.H; y+=46) { ox.beginPath(); ox.moveTo(0,y); ox.lineTo(C.W,y); ox.stroke(); }
  function drawOcean(time) {
    ctx.drawImage(ocean, 0, 0); ctx.lineWidth = .8;
    for (let i = 0; i < 26; i++) {
      const x = (i * 127 + 18) % C.W, y = ((i * 71 + time * 11) % (C.H + 35)) - 18;
      ctx.strokeStyle = i % 3 === 0 ? '#a4d5d01d' : '#a4d5d00d'; ctx.beginPath(); ctx.moveTo(x-14,y); ctx.quadraticCurveTo(x,y-5,x+14,y); ctx.stroke();
    }
    ctx.fillStyle='#c2e8e50d';
    for(let i=0;i<5;i++){const x=(i*139+45)%C.W,y=(i*173+time*21)%(C.H+130)-65;ctx.beginPath();ctx.ellipse(x,y,85,32,.2,0,Math.PI*2);ctx.fill();}

  }
  function drawLabel(text, x, y, color = '#d8e6e2', size = 12) {
    size = Math.max(size, 12 * labelScale);
    ctx.save(); ctx.font = `600 ${size}px ${canvasFont}`; ctx.textAlign = 'center';
    const width = ctx.measureText(text).width + 12;
    x = Math.max(width / 2 + 3, Math.min(C.W - width / 2 - 3, x));
    ctx.fillStyle = '#071f2bd9'; ctx.fillRect(x - width/2, y - size, width, size + 7);
    ctx.fillStyle = color; ctx.fillText(text,x,y); ctx.restore();
  }
  function drawEntity(e, time) {
    const p = e.position;
    if (e.type === 'ship') {
      const scale = e.kind === 'boss' ? 2.3 : e.kind === 'debt' ? 1.3 : e.kind === 'inflation' ? 1.1 : e.kind === 'scam' ? .8 : .87;
      ship(p.x,p.y,Math.PI/2,scale,e.kind,time,e.flash);if(e.kind==='boss'&&e.strategy.remainingBeforeAttack<.65){ctx.strokeStyle='#ffdb9c';ctx.lineWidth=2;ctx.beginPath();ctx.arc(p.x,p.y,55+Math.sin(time*14)*3,0,Math.PI*2);ctx.stroke();}
      if (e.hp < e.maxHp) { const w=e.kind==='boss'?80:35; ctx.fillStyle='#09242f';ctx.fillRect(p.x-w/2,p.y-scale*35,w,3);ctx.fillStyle=COLORS[e.kind];ctx.fillRect(p.x-w/2,p.y-scale*35,w*Math.max(0,e.hp/e.maxHp),3); }
      if (e.kind !== 'boss') drawLabel(t(`label_${e.kind}`),p.x,p.y+scale*34,COLORS[e.kind],13);
    } else if (e.type === 'torpedo') {
      ctx.save(); ctx.translate(p.x,p.y); ctx.rotate(p.r); const friendly=e.collision.group===C.FRIEND;
      const color=friendly?(e.style==='escort'?'#9df1de':'#ffe1a1'):e.style==='debt'?'#d5acf1':'#ff9b84';
      ctx.strokeStyle=color;ctx.fillStyle=color;ctx.lineWidth=e.style==='beam'?3:2;
      if (e.style==='orb') { ctx.fillStyle='#e9c87b25';ctx.beginPath();ctx.arc(0,0,16,0,Math.PI*2);ctx.fill();ctx.fillStyle='#ffe1a1';ctx.beginPath();ctx.arc(0,0,8,0,Math.PI*2);ctx.fill();ctx.fillStyle='#fff7e4';ctx.beginPath();ctx.arc(2,-2,3,0,Math.PI*2);ctx.fill(); }
      else { ctx.globalAlpha=.3;ctx.beginPath();ctx.moveTo(-17,0);ctx.lineTo(0,0);ctx.stroke();ctx.globalAlpha=1;ctx.beginPath();ctx.moveTo(-4,0);ctx.lineTo(friendly?7:3,0);ctx.stroke();if(!friendly){ctx.beginPath();ctx.arc(0,0,e.collision.radius,0,Math.PI*2);ctx.stroke();} }
      ctx.restore();
    } else if (e.type === 'coin') {
      ctx.save();ctx.translate(p.x,p.y);ctx.globalAlpha=e.ttl.timeLeft<2?.5+.5*Math.sin(time*14):1;
      ctx.fillStyle='#f6cc81';ctx.strokeStyle='#fff0c5';ctx.lineWidth=1;ctx.beginPath();ctx.arc(0,0,6,0,Math.PI*2);ctx.fill();ctx.stroke();
      ctx.fillStyle='#86633d';ctx.font='bold 8px sans-serif';ctx.textAlign='center';ctx.fillText('$',0,3);ctx.restore();
    }
  }
  function burst(x,y,color,count=16) {
    if (reduced.matches) count=5;
    for(let i=0;i<count;i++){const a=Math.random()*Math.PI*2,v=35+Math.random()*100;particles.push({x,y,vx:Math.cos(a)*v,vy:Math.sin(a)*v,life:.35+Math.random()*.4,max:.8,color,size:1+Math.random()*3});}
    ripples.push({x,y,r:6,life:.55});
    if(particles.length>260)particles.splice(0,particles.length-260);
  }
  function events() {
    for(const e of game.events){
      if(e.type==='sink'){const boss=e.kind==='boss';fx.burst(e.x,e.y,{size:boss?60:28,heavy:boss});fx.shatter(e.x,e.y,COLORS[e.kind],boss?55:24);soundscape.play(boss?'heavy':'sink');if(boss&&!reduced.matches)shake=.2;}
      if(e.type==='damage'){fx.hit(e.x,e.y,'#ffad8f');if(!reduced.matches)shake=.14;soundscape.play('hit');}
      if(e.type==='impact'){fx.hit(e.x,e.y);soundscape.play('hit');}
      if(e.type==='coin')soundscape.play('coin');
      if(e.type==='fire'&&game.time-lastSound>.12){soundscape.play('fire');lastSound=game.time;}
      if(e.type==='block'){fx.hit(e.x,e.y,'#a9eee2');soundscape.play('crack');}
      if(e.type==='wave')banner('waveBanner',String(e.wave).padStart(2,'0'));
      if(e.type==='boss'){banner('bossBanner','',3);soundscape.play('boss');}
      if(e.type==='dividend'){floats.push({x:C.W/2,y:C.H-150,key:'dividend',extra:` +${e.amount}`,life:1.7});soundscape.play('coin');}
      if(e.type==='graze')floats.push({x:e.x,y:e.y-38,key:'graze',extra:'',life:.8});
      if(e.type==='over')end();
    }
    game.events.length=0;if(floats.length>10)floats.splice(0,floats.length-10);
  }
  function draw(time, dt) {
    ctx.setTransform(canvas.width/C.W,0,0,canvas.height/C.H,0,0);ctx.clearRect(0,0,C.W,C.H);
    drawOcean(reduced.matches?0:time);ctx.save();if(shake>0){ctx.translate((Math.random()-.5)*6,(Math.random()-.5)*6);shake=Math.max(0,shake-dt);}
    if(phase==='menu'){
      ship(70,180,.8,1.1,'inflation',time);ship(370,230,2.4,.85,'scam',time);ship(310,80,Math.PI/2,.9,'fee',time);ship(C.W/2,C.H-100,-Math.PI/2,1.2,'player',time);
    }else{
      for(const e of game.entities) if(e.type!=='torpedo')drawEntity(e,time);
      const h=game.hero.position;
      if(game.shield>0){ctx.strokeStyle='#9becd9aa';ctx.lineWidth=2;ctx.fillStyle='#78dfc31b';ctx.beginPath();ctx.arc(h.x,h.y,34+Math.sin(time*5)*2,0,Math.PI*2);ctx.fill();ctx.stroke();}
      if(phase!=='over'&&phase!=='sinking'){
        ctx.globalAlpha=game.invulnerable>0&&Math.floor(game.time*12)%2===0?.5:1;
        ship(h.x,h.y,h.r,1.08,'player',time);ctx.globalAlpha=1;
        if(game.escort)for(const side of game.escort===1?[-1]:[-1,1])ship(Math.max(12,Math.min(C.W-12,h.x+side*32)),h.y+18,h.r,.43,'escort',time);
      }
      for(const e of game.entities) if(e.type==='torpedo')drawEntity(e,time);
    }
    for(let i=particles.length-1;i>=0;i--){const p=particles[i];if(!paused){p.life-=dt;p.x+=p.vx*dt;p.y+=p.vy*dt;}if(p.life<=0){particles.splice(i,1);continue;}ctx.globalAlpha=Math.min(1,p.life/.3);ctx.fillStyle=p.color;ctx.fillRect(p.x,p.y,p.size,p.size);}ctx.globalAlpha=1;
    for(let i=ripples.length-1;i>=0;i--){const p=ripples[i];if(!paused){p.life-=dt;p.r+=70*dt;}if(p.life<=0){ripples.splice(i,1);continue;}ctx.strokeStyle=`rgba(224,220,180,${p.life*.7})`;ctx.lineWidth=1.5;ctx.beginPath();ctx.arc(p.x,p.y,p.r,0,Math.PI*2);ctx.stroke();}
    for(let i=floats.length-1;i>=0;i--){const p=floats[i];if(!paused){p.life-=dt;p.y-=22*dt;}if(p.life<=0){floats.splice(i,1);continue;}drawLabel(`${t(p.key)}${p.extra}`,p.x,p.y,'#ffe1a1',13);}
    fx.draw(ctx); ctx.restore();
  }
  function sizeCanvas(){const rect=canvas.getBoundingClientRect(),dpr=Math.min(2,window.devicePixelRatio||1);canvas.width=Math.round(rect.width*dpr);canvas.height=Math.round(rect.height*dpr);labelScale=C.W/Math.max(1,rect.width);}
  function frame(now){
    if(phase==='play')journey?.step(!paused);
    const dt=lastTime===null?0:Math.min(.2,(now-lastTime)/1000);lastTime=now;
    if(!paused){animation+=dt;fx.update(dt);}
    if(phase==='sinking'){deathTime-=dt;if(deathTime<=0)finishSinking();}
    if(phase==='play'&&!paused){
      accumulator+=dt;
      const directions=new Set([...pressed,...directionPointers.values()]);
      const input={x:Number(directions.has('right'))-Number(directions.has('left')),y:Number(directions.has('down'))-Number(directions.has('up'))};
      if(pointerTarget)input.target=pointerTarget;
      while(accumulator>=1/60&&phase==='play'){C.tick(game,1/60,input);accumulator-=1/60;events();}
      bannerTime=Math.max(0,bannerTime-dt);if(bannerTime===0&&$('banner').textContent){$('banner').classList.remove('show');$('banner').textContent='';}
      lowHealthSound-=dt;
      if(game.hero.hp>0&&game.hero.hp<=game.hero.maxHp*.3&&lowHealthSound<=0){soundscape.play('warning');lowHealthSound=5;}
    }
    hudTime+=dt;if(hudTime>.1){updateHUD();hudTime=0;}
    draw(animation,dt);requestAnimationFrame(frame);
  }
  const keyMap={KeyW:'up',ArrowUp:'up',KeyA:'left',ArrowLeft:'left',KeyS:'down',ArrowDown:'down',KeyD:'right',ArrowRight:'right'};
  window.addEventListener('keydown',e=>{
    if(e.ctrlKey||e.metaKey||e.altKey||/INPUT|TEXTAREA|SELECT/.test(e.target.tagName))return;
    if(shopOpen){
      if(e.code==='Escape'){e.preventDefault();closeWorkshop();return;}
      if(e.key==='Tab'){const buttons=[...$('dock').querySelectorAll('button:not(:disabled)')],first=buttons[0],last=buttons.at(-1);if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus();}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus();}}
    }
    if(keyMap[e.code]&&phase==='play'&&!paused){e.preventDefault();pressed.add(keyMap[e.code]);pointerTarget=null;}
    if(e.repeat)return;
    if(e.code==='KeyP'||e.code==='Escape'){if(phase==='play'){e.preventDefault();setPaused(!paused);}}
    if(e.code==='KeyQ')shield();if(e.code==='KeyE'&&phase==='play'&&!paused)journey?.swap();
    const kind={Digit1:'weapon',Digit2:'escort',Digit3:'reserve',Digit4:'repair'}[e.code];if(kind)purchase(kind);
  });
  window.addEventListener('keyup',e=>{if(keyMap[e.code])pressed.delete(keyMap[e.code]);});
  const point=e=>{const r=canvas.getBoundingClientRect();return{x:(e.clientX-r.left)*C.W/r.width,y:(e.clientY-r.top)*C.H/r.height};};
  canvas.addEventListener('pointerdown',e=>{if(phase!=='play'||paused||(e.pointerType==='mouse'&&e.button!==0))return;e.preventDefault();canvasPointers.press(e);pointerTarget=point(canvasPointers.current);canvas.setPointerCapture(e.pointerId);unlockAudio();});
  canvas.addEventListener('pointermove',e=>{if(phase==='play'&&!paused&&canvasPointers.move(e))pointerTarget=point(e);});
  function release(e){
    if(!canvasPointers.release(e))return;
    if(canvasPointers.current)pointerTarget=point(canvasPointers.current);
    else if(e.type!=='pointerup')pointerTarget=null; // An ordinary tap remains a destination.
  }
  for(const type of ['pointerup','pointercancel','lostpointercapture'])canvas.addEventListener(type,release);
  for(const b of document.querySelectorAll('[data-dir]')){
    b.addEventListener('pointerdown',e=>{if(phase!=='play'||paused)return;e.preventDefault();b.setPointerCapture(e.pointerId);pointerTarget=null;directionPointers.set(e.pointerId,b.dataset.dir);});
    for(const event of ['pointerup','pointercancel','lostpointercapture'])b.addEventListener(event,e=>directionPointers.delete(e.pointerId));
  }
  $('start').addEventListener('click',start);$('restart').addEventListener('click',start);bindAction($('pause'),()=>setPaused(!paused));$('resume').addEventListener('click',()=>setPaused(false));
  bindAction($('shield'),shield);for(const kind of ['weapon','escort','reserve','repair'])bindAction($(kind),()=>purchase(kind));
  for(const id of ['standard','storm'])$(id).addEventListener('click',()=>chooseMode(id));
  bindAction($('lang'),()=>setLanguage(lang==='en'?'zh-Hant':'en'));
  window.addEventListener('storage',e=>{if(e.key==='fulam-language')setLanguage(e.newValue==='en'?'en':'zh-Hant');});
  bindAction($('sound'),toggleSound);bindAction($('battle-sound'),toggleSound);
  bindAction($('dock-toggle'),()=>shopOpen?closeWorkshop():openWorkshop());bindAction($('dock-close'),closeWorkshop);
  $('change-mode').addEventListener('click',()=>{phase='menu';paused=false;clearInput();game=C.createState({mode});showOverlay('menu');updateHUD();$('start').focus({preventScroll:true});});
  $('share').addEventListener('click',async()=>{const text=t('shareText')(game);try{await navigator.clipboard.writeText(text);put('share-status',t('copied'));}catch{put('share-status',`${t('copyFallback')} ${text}`);}});
  async function fullscreen(){
    const layout=$('combat-layout');
    try{if(document.fullscreenElement)await document.exitFullscreen();else if(layout.classList.contains('expanded'))layout.classList.remove('expanded');else if(layout.requestFullscreen)await layout.requestFullscreen();else layout.classList.add('expanded');}
    catch{layout.classList.toggle('expanded');}
    document.body.classList.toggle('screen-expanded',layout.classList.contains('expanded'));sizeCanvas();
  }
  bindAction($('fullscreen'),fullscreen,{onRelease:true});bindAction($('battle-fullscreen'),fullscreen,{onRelease:true});
  document.addEventListener('visibilitychange',()=>{if(document.hidden&&phase==='play'&&!paused)setPaused(true);lastTime=null;});
  window.addEventListener('blur',()=>{clearInput();if(phase==='play'&&!paused)setPaused(true);});
  window.addEventListener('resize',()=>{
    // Keep rotation safe when the mobile workshop becomes a permanent side panel.
    if(shopOpen&&getComputedStyle($('dock-toggle')).display==='none'){closeWorkshop();setPaused(true);}
    sizeCanvas();
  });document.addEventListener('fullscreenchange',sizeCanvas);
  new ResizeObserver(sizeCanvas).observe($('sea'));
  if(journey){
    const settings=document.createElement('div');settings.id='journey-settings';$('menu').insertBefore(settings,$('start'));$('menu').querySelector('.modes').hidden=true;
    const swap=document.createElement('button');swap.id='swap-weapon';swap.className='journey-swap';$('shield').parentNode.insertBefore(swap,$('shield'));bindAction(swap,()=>{if(phase==='play'&&!paused)journey.swap();});
    const setup=()=>{journey.settings(settings,d=>chooseMode(d==='challenge'?'storm':'standard'));swap.textContent=journey.text('⇄ 換武器 · E','⇄ Switch · E');};setup();
    const originalLanguage=setLanguage;setLanguage=function(next){originalLanguage(next);setup();};
    journey.onIntermission=()=>{paused=true;clearInput();soundscape.play('upgrade');};
    journey.onChoice=(kind,r)=>{
      if(kind==='power'){game.weapon=Math.min(5,game.weapon+1);}
      if(kind==='support'){game.hero.hp=Math.min(game.hero.maxHp,game.hero.hp+25);game.escort=Math.min(3,game.escort+1);}
      game.power=1+(r.wave-1)*.10+r.power*.18+game.paidPower;game.weaponKind=r.weapon;game.wave=r.wave;game.waveKills=0;game.bossSpawned=false;game.spawnTime=.5;
      game.entities=game.entities.filter(e=>e.type==='coin');game.raised=[];game.invulnerable=1.5;paused=false;accumulator=0;banner('waveBanner',r.wave);updateHUD();
    };
    journey.onSwap=kind=>{game.weaponKind=kind;soundscape.play('upgrade');};
    journey.onEnd=()=>{game.running=false;paused=false;phase='over';clearInput();showOverlay('end-menu');renderEnd();};
    window.FuLamFleet={getState:()=>({phase,paused,score:game.score,hp:game.hero.hp,wave:game.wave,kills:game.kills,weaponKind:game.weaponKind,weapon:game.weapon,power:game.power,shield:game.shield,shots:game.shots,run:journey.run?{scene:journey.run.scene,difficulty:journey.run.difficulty,phase:journey.run.phase,active:journey.run.active,total:journey.run.total,wave:journey.run.wave,choiceTime:journey.run.choiceTime,reason:journey.run.reason}:null})};
  }
  setLanguage(lang);sizeCanvas();requestAnimationFrame(frame);
})();
