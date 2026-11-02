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
    tag: 'ENDLESS NAVAL ARCADE · BETA', title: 'Wealth<br>Fleet', subtitle: 'Protect your capital.<br>Chart your own course.',
    intro: 'The enemy keeps coming. Turn your loot into firepower, or keep a cash reserve for an emergency shield?',
    move: 'Move · drag or tap the sea on mobile', autofire: 'Automatic targeting & rapid fire', shieldRule: 'Spend your reserve to raise a shield', best: 'LOCAL BEST', local: 'Only your best result stays in this browser', back: '← Back to the arcade',
    battle: 'Naval battle', capital: 'CAPITAL ARMOUR', cash: 'GAME COINS', score: 'WEALTH SCORE',
    canvas: 'Naval shooter. WASD or arrow keys to move, Q for shield, 1 to 4 for upgrades, P to pause.',
    auto: 'AUTO FIRE', boss: 'DEBT STORM · BOSS', menuTag: 'CAPTAIN, READY TO SAIL.', menuTitle: 'How long can you<br>protect your capital?',
    menuHint: 'Drag to dodge. Your guns fire automatically.<br>Endless waves. Sail until you sink.', chooseMode: 'Choose a route',
    standard: 'Standard route', standardHint: '100 capital · rising pressure', storm: 'Storm route', stormHint: '75 capital · faster fire', start: 'Set sail',
    pausedTag: 'AT ANCHOR', paused: 'Battle paused', pausedHint: 'Return to sea when you are ready.', resume: 'Continue sailing',
    endTag: 'VOYAGE COMPLETE', endTitle: 'Fleet down.<br>Go further next time.', restart: 'Set sail again', share: 'Copy result', changeMode: 'Change route',
    pause: 'Pause', mobileHint: 'Drag or tap the sea to move. Firing is automatic.', shield: 'Emergency shield', directionPad: 'Movement buttons', left: 'Move left', right: 'Move right', up: 'Move up', down: 'Move down',
    dockTag: 'YOUR UPGRADE DECISIONS', dock: 'Fleet workshop', dockHint: 'Invest in strength. Keep cash for survival.',
    weapon: 'Compound cannon', escort: 'Diversify escorts', reserve: 'Reserve system', repair: 'Repair capital', repairHint: 'Restore 35 armour immediately',
    income: 'RESERVE INCOME', incomeHint: 'Cash earns game income every 15 seconds. Upgrade reserves to increase income and coin pickup range.',
    enemyTag: 'KNOW THE THREAT', fee: 'Impulse spending', feeHint: 'Light raider', inflation: 'Inflation', inflationHint: 'Fan-shaped fire', scam: 'Investment scam', scamHint: 'Fast zigzag', debt: 'High-interest debt', debtHint: 'Homing torpedoes',
    label_fee: 'Spending', label_inflation: 'Inflation', label_scam: 'Scam', label_debt: 'Debt',
    metaphor: 'Money concepts become ship abilities. Coins, income and armour are fictional game values.', credits: 'Open-source credits & licence', creditNote: 'Combat core adapted from',
    changes: 'Adds endless waves, finance-themed upgrades, new ship art, touch controls and bilingual UI. Original music and font assets are not used.',
    wave: 'SECTOR', combo: 'COMBO', max: 'MAX', full: 'FULL', ready: 'coins · ready', active: 'Shield active', cooldown: 'Ready in', seconds: 's', coins: 'coins',
    weapons: ['Homing cannon', 'Twin homing guns', 'Three-way spread', 'Piercing beams', 'Heavy plasma orbs'],
    escorts: ['Add a homing escort', 'Add a second escort', 'Rapid-fire escorts', 'Two rapid-fire escorts'],
    reserves: ['Longer shield · wider pickup', 'More income · cheaper shield', 'Maximum shield efficiency', 'Reserve system fully upgraded'],
    weaponNext: 'Next: ', equipped: 'Equipped: ', noCash: 'Collect more coins first', shieldWait: 'Shield is recharging', upgraded: 'Upgrade installed', repaired: 'Capital repaired',
    shieldRaised: 'EMERGENCY SHIELD', waveBanner: 'ENTERING SECTOR', bossBanner: 'WARNING · DEBT STORM', dividend: 'Reserve income', graze: 'CLOSE CALL +20',
    newBest: 'NEW LOCAL BEST', storageUnavailable: 'Saving is unavailable in this browser.', copied: 'Result copied — ready to share.', copyFallback: 'Copy this result:', fullscreenError: 'Full screen is not available in this browser.',
    endStats: (s) => `Sector ${s.wave} · ${s.kills} ships sunk · ${s.mode === 'storm' ? 'Storm' : 'Standard'}`,
    tip: 'Keep a small cash reserve. A shield can save your next run.',
    shareText: s => `FuLam Wealth Fleet: ${s.score.toLocaleString('en')} points · sector ${s.wave} · ${s.kills} ships sunk (${s.mode === 'storm' ? 'Storm' : 'Standard'}). Can you beat me? https://rysung2406.github.io/fulam-money-journey/fleet/`
  };
  const ZH = {
    soundOn: '音效：開', wave: '航區', combo: '連擊', max: '滿級', full: '已滿', ready: '幣 · 就緒', active: '護盾生效中', cooldown: '冷卻', seconds: '秒', coins: '幣',
    label_fee: '衝動消費', label_inflation: '通脹', label_scam: '投資騙局', label_debt: '高息債務',
    weapons: ['追蹤火炮', '雙管追蹤炮', '三路散射炮', '貫穿射線炮', '重型能量球'],
    escorts: ['增加一艘追蹤僚艦', '增加第二艘僚艦', '僚艦射速提升', '雙艘高速僚艦'],
    reserves: ['護盾更長 · 拾幣更遠', '收益提升 · 護盾更省', '護盾與儲備全面提升', '儲備系統已滿級'],
    weaponNext: '下級：', equipped: '裝備：', noCash: '先收集更多金幣', shieldWait: '護盾正在冷卻', upgraded: '升級完成', repaired: '本金已修復',
    shieldRaised: '應急護盾啟動', waveBanner: '進入航區', bossBanner: '警報 · 債務風暴來襲', dividend: '儲備收益', graze: '擦彈 +20',
    newBest: '刷新本機最佳', storageUnavailable: '此瀏覽器暫時無法保存成績。', copied: '已複製戰績，可以分享了。', copyFallback: '請複製以下戰績：', fullscreenError: '此瀏覽器暫不支援全螢幕。',
    endStats: s => `航區 ${s.wave} · 擊沉 ${s.kills} 艘 · ${s.mode === 'storm' ? '風暴航線' : '標準航線'}`,
    tip: '留一筆應急金，下次危急時按 Q 開盾。',
    shareText: s => `富臨財富艦隊：${s.score.toLocaleString('en')} 分 · 航區 ${s.wave} · 擊沉 ${s.kills} 艘（${s.mode === 'storm' ? '風暴' : '標準'}）。你能超越我嗎？https://rysung2406.github.io/fulam-money-journey/fleet/`
  };
  const translated = [...document.querySelectorAll('[data-t]')];
  const originals = new Map(translated.map(e => [e, e.innerHTML]));
  const labels = [...document.querySelectorAll('[data-label]')];
  const originalLabels = new Map(labels.map(e => [e, e.getAttribute('aria-label')]));
  for (const e of translated) if (!(e.dataset.t in ZH)) ZH[e.dataset.t] = e.textContent;
  const t = key => (lang === 'en' ? EN : ZH)[key] ?? key;
  let mode = 'standard', phase = 'menu', game = C.createState({ seed: 742 }), best = null, paused = false;
  let sound = false, audio = null, lastSound = 0, resultIsBest = false, saveFailed = false;
  let pointerId = null, pointerTarget = null, animation = 0, lastTime = null, accumulator = 0, hudTime = 0;
  let bannerTime = 0, bannerKey = '', bannerValue = '', toastTimer, shake = 0;
  const pressed = new Set(), particles = [], ripples = [], floats = [];
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  try { const stored = safeGet(KEY); if (stored && stored.length < 600) { const r = JSON.parse(stored); if (Number.isFinite(r.score) && r.score >= 0 && Number.isInteger(r.wave) && r.wave > 0 && Number.isInteger(r.kills) && r.kills >= 0 && ['standard', 'storm'].includes(r.mode)) best = r; } } catch { /* invalid records are ignored */ }
  function put(id, text) { const e = $(id); const s = String(text); if (e.textContent !== s) e.textContent = s; }
  function toast(key) { $('toast').textContent = t(key); $('toast').classList.add('show'); clearTimeout(toastTimer); toastTimer = setTimeout(() => $('toast').classList.remove('show'), 2400); }
  function setLanguage(next) {
    lang = next; safeSet('fulam-language', lang); document.documentElement.lang = lang;
    document.title = lang === 'en' ? 'FuLam Wealth Fleet · FuLam Money Journey' : '富臨財富艦隊 · FuLam Wealth Fleet';
    for (const e of translated) e.innerHTML = lang === 'en' ? (EN[e.dataset.t] ?? originals.get(e)) : originals.get(e);
    for (const e of labels) e.setAttribute('aria-label', lang === 'en' ? (EN[e.dataset.label] ?? originalLabels.get(e)) : originalLabels.get(e));
    $('lang').textContent = lang === 'en' ? '繁中' : 'EN'; $('lang').setAttribute('aria-label', lang === 'en' ? '切換至繁體中文' : 'Switch to English');
    put('sound', t(sound ? 'soundOn' : 'soundOff'));
    if (phase === 'over') renderEnd();
    $('banner').textContent = bannerTime > 0 ? `${t(bannerKey)} ${bannerValue}` : '';
    $('share-status').textContent = ''; $('toast').classList.remove('show'); updateHUD();
  }
  function unlockAudio() {
    if (!sound) return;
    try { if (!audio) audio = new (window.AudioContext || window.webkitAudioContext)(); if (audio.state === 'suspended') void audio.resume().catch(() => {}); } catch { sound = false; }
  }
  function tone(frequency, duration = .06, volume = .025, type = 'sine') {
    if (!sound || !audio || audio.state !== 'running') return;
    try {
      const now = audio.currentTime, oscillator = audio.createOscillator(), gain = audio.createGain();
      oscillator.type = type; oscillator.frequency.setValueAtTime(frequency, now); oscillator.frequency.exponentialRampToValueAtTime(Math.max(30, frequency * .5), now + duration);
      gain.gain.setValueAtTime(volume, now); gain.gain.exponentialRampToValueAtTime(.001, now + duration);
      oscillator.connect(gain); gain.connect(audio.destination); oscillator.start(now); oscillator.stop(now + duration);
      oscillator.onended = () => { oscillator.disconnect(); gain.disconnect(); };
    } catch { /* audio must not interrupt play */ }
  }
  function banner(key, value = '', seconds = 2.2) { bannerKey = key; bannerValue = value; bannerTime = seconds; $('banner').textContent = `${t(key)} ${value}`; $('banner').classList.add('show'); }
  function clearInput() { pressed.clear(); pointerTarget = null; pointerId = null; }
  function showOverlay(which) {
    $('overlay').hidden = !which;
    for (const id of ['menu', 'pause-menu', 'end-menu']) $(id).hidden = id !== which;
  }
  function start() {
    game = C.createState({ mode }); phase = 'play'; paused = false; accumulator = 0; lastTime = null; lastSound = 0; saveFailed = false;
    clearInput(); particles.length = ripples.length = floats.length = 0; bannerTime = 0; $('banner').classList.remove('show'); shake = 0;
    showOverlay(null); unlockAudio(); $('pause').disabled = false; canvas.focus({ preventScroll: true }); updateHUD();
    if (matchMedia('(max-width:650px)').matches) document.querySelector('.battle').scrollIntoView({ block: 'start' });
  }
  function setPaused(value) {
    if (phase !== 'play') return;
    paused = value; clearInput(); accumulator = 0; showOverlay(paused ? 'pause-menu' : null); updateHUD();
    if (paused) $('resume').focus({ preventScroll: true }); else { canvas.focus({ preventScroll: true }); unlockAudio(); }
  }
  function end() {
    if (phase !== 'play') return;
    phase = 'over'; paused = false; clearInput();
    resultIsBest = !best || game.score > best.score; best = C.bestRecord(best, game);
    if (resultIsBest) saveFailed = !safeSet(KEY, JSON.stringify(best));
    showOverlay('end-menu'); renderEnd(); updateHUD(); $('restart').focus({ preventScroll: true }); tone(90, .45, .05, 'triangle');
  }
  function renderEnd() {
    put('end-label', t(resultIsBest ? 'newBest' : 'endTag')); put('end-score', game.score.toLocaleString('en'));
    put('end-stats', t('endStats')(game)); put('end-tip', t('tip')); if (saveFailed) put('share-status', t('storageUnavailable'));
  }
  function chooseMode(value) {
    mode = value;
    for (const id of ['standard', 'storm']) { $(id).classList.toggle('active', id === mode); $(id).setAttribute('aria-pressed', String(id === mode)); }
    if (phase === 'menu') { game = C.createState({ mode, seed: 742 }); updateHUD(); }
  }
  function purchase(kind) {
    if (phase !== 'play' || paused) return;
    if (C.buy(game, kind)) { tone(540, .12, .04); toast(kind === 'repair' ? 'repaired' : 'upgraded'); }
    else if (C.upgradeCost(game, kind) !== null && game.cash < C.upgradeCost(game, kind)) toast('noCash');
    updateHUD();
  }
  function shield() {
    if (phase !== 'play' || paused) return;
    if (C.activateShield(game)) { tone(240, .3, .04); banner('shieldRaised', '', 1); }
    else toast(game.shieldCooldown > 0 ? 'shieldWait' : 'noCash'); updateHUD();
  }
  function updateHUD() {
    const active = phase === 'play' && !paused, s = game;
    const hpHTML = `${s.hero.hp}<span>/ ${s.hero.maxHp}</span>`; if ($('hp').innerHTML !== hpHTML) $('hp').innerHTML = hpHTML;
    $('hp-bar').style.width = `${s.hero.hp / s.hero.maxHp * 100}%`; $('hp-bar').style.background = s.hero.hp < 30 ? 'var(--danger)' : 'var(--aqua)';
    put('cash', s.cash.toLocaleString('en')); put('score', s.score.toLocaleString('en')); put('best', (best?.score || 0).toLocaleString('en'));
    put('sector', `${t('wave')} ${String(s.wave).padStart(2, '0')}`); put('combo', s.combo >= 2 ? `${s.combo} ${t('combo')}` : '');
    put('wave-progress', `${Math.min(s.waveKills, s.goal)} / ${s.goal}`); $('wave-bar').style.width = `${Math.min(100, s.waveKills / s.goal * 100)}%`;
    put('income', `+${s.income}`); $('income-bar').style.width = `${s.dividend / 15 * 100}%`;
    $('pause').disabled = phase !== 'play'; $('shield').disabled = !active || s.shieldCooldown > 0 || s.cash < C.shieldCost(s);
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
        put(`${kind}-desc`, desc);
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
    // Wake and bow waves make movement and orientation visible without sprite assets.
    ctx.lineWidth = 1; ctx.strokeStyle = '#b0f0e33e';
    for (let i = 0; i < 3; i++) {
      const n = (time * 28 + i * 18) % 55;
      ctx.globalAlpha = (1 - n / 55) * .5;
      ctx.beginPath(); ctx.moveTo(-8 - n * .21, 14 + n); ctx.quadraticCurveTo(0, 24 + n, 8 + n * .21, 14 + n); ctx.stroke();
    }
    ctx.globalAlpha = 1; ctx.fillStyle = '#04131d88'; ctx.beginPath(); ctx.ellipse(4, 6, 17, 32, 0, 0, Math.PI * 2); ctx.fill();
    path([[0,-32],[10,-19],[14,11],[10,28],[-10,28],[-14,11],[-10,-19]], '#153541', '#d8e6d044');
    path([[0,-29],[8,-17],[10,12],[7,24],[-7,24],[-10,12],[-8,-17]], fill, '#edf8ed80');
    path([[0,-22],[5,-10],[6,19],[-6,19],[-5,-10]], '#47646a');
    ctx.fillStyle = '#1c3845'; ctx.fillRect(-5,-2,10,13); ctx.fillStyle = '#d6e7d9'; ctx.fillRect(-4,0,8,4);
    ctx.strokeStyle = '#d9ecdf'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(0,-8); ctx.lineTo(0,-22); ctx.stroke();
    ctx.fillStyle = kind === 'player' ? '#f3c77c' : '#203d48'; ctx.beginPath(); ctx.arc(0,-8,4.5,0,Math.PI*2); ctx.fill();
    ctx.fillStyle = '#0c2834'; ctx.fillRect(-6,15,12,3);
    if (kind === 'boss' || kind === 'debt') {
      for (const side of [-1,1]) { ctx.fillStyle = '#354951'; ctx.fillRect(side * 9 - 2, -2, 4, 15); ctx.fillStyle = '#ead6b6'; ctx.fillRect(side * 9 - 1, -7, 2, 9); }
    }
    if (kind === 'player') { ctx.fillStyle = '#ffda91'; ctx.fillRect(-3,6,6,3); }
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
    // Distant harbour contours stay outside the playable channel.
    ctx.fillStyle = '#173b41'; ctx.strokeStyle = '#618c8030'; ctx.lineWidth = 5;
    for (const [x,y,rx,ry] of [[-34,105,62,105],[490,450,55,90]]) { ctx.beginPath(); ctx.ellipse(x,y,rx,ry,.25,0,Math.PI*2); ctx.fill(); ctx.stroke(); }
    ctx.fillStyle = '#62826e30'; ctx.fillRect(4,72,13,25); ctx.fillRect(5,102,18,22); ctx.fillRect(445,412,9,32);
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
      ship(p.x,p.y,Math.PI/2,scale,e.kind,time,e.flash);
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
      if(e.type==='sink'){burst(e.x,e.y,COLORS[e.kind],e.kind==='boss'?42:18);tone(e.kind==='boss'?65:120,.16,.03,'triangle');}
      if(e.type==='damage'){burst(e.x,e.y,'#f9a38b',10);if(!reduced.matches)shake=.14;tone(75,.18,.04,'sawtooth');}
      if(e.type==='fire'&&game.time-lastSound>.18){tone(320,.04,.008);lastSound=game.time;}
      if(e.type==='block')burst(e.x,e.y,'#a9eee2',3);
      if(e.type==='wave')banner('waveBanner',String(e.wave).padStart(2,'0'));
      if(e.type==='boss')banner('bossBanner','',3);
      if(e.type==='dividend'){floats.push({x:C.W/2,y:C.H-150,key:'dividend',extra:` +${e.amount}`,life:1.7});tone(650,.1,.025);}
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
      if(phase!=='over'){
        ctx.globalAlpha=game.invulnerable>0&&Math.floor(game.time*12)%2===0?.5:1;
        ship(h.x,h.y,h.r,1.08,'player',time);ctx.globalAlpha=1;
        if(game.escort)for(const side of game.escort===1?[-1]:[-1,1])ship(Math.max(12,Math.min(C.W-12,h.x+side*32)),h.y+18,h.r,.43,'escort',time);
      }
      for(const e of game.entities) if(e.type==='torpedo')drawEntity(e,time);
    }
    for(let i=particles.length-1;i>=0;i--){const p=particles[i];if(!paused){p.life-=dt;p.x+=p.vx*dt;p.y+=p.vy*dt;}if(p.life<=0){particles.splice(i,1);continue;}ctx.globalAlpha=Math.min(1,p.life/.3);ctx.fillStyle=p.color;ctx.fillRect(p.x,p.y,p.size,p.size);}ctx.globalAlpha=1;
    for(let i=ripples.length-1;i>=0;i--){const p=ripples[i];if(!paused){p.life-=dt;p.r+=70*dt;}if(p.life<=0){ripples.splice(i,1);continue;}ctx.strokeStyle=`rgba(224,220,180,${p.life*.7})`;ctx.lineWidth=1.5;ctx.beginPath();ctx.arc(p.x,p.y,p.r,0,Math.PI*2);ctx.stroke();}
    for(let i=floats.length-1;i>=0;i--){const p=floats[i];if(!paused){p.life-=dt;p.y-=22*dt;}if(p.life<=0){floats.splice(i,1);continue;}drawLabel(`${t(p.key)}${p.extra}`,p.x,p.y,'#ffe1a1',13);}
    ctx.restore();
  }
  function sizeCanvas(){const rect=canvas.getBoundingClientRect(),dpr=Math.min(2,window.devicePixelRatio||1);canvas.width=Math.round(rect.width*dpr);canvas.height=Math.round(rect.height*dpr);labelScale=C.W/Math.max(1,rect.width);}
  function frame(now){
    const dt=lastTime===null?0:Math.min(.2,(now-lastTime)/1000);lastTime=now;
    if(!paused)animation+=dt;
    if(phase==='play'&&!paused){
      accumulator+=dt;
      const input={x:Number(pressed.has('right'))-Number(pressed.has('left')),y:Number(pressed.has('down'))-Number(pressed.has('up'))};
      if(pointerTarget)input.target=pointerTarget;
      while(accumulator>=1/60&&phase==='play'){C.tick(game,1/60,input);accumulator-=1/60;events();}
      bannerTime=Math.max(0,bannerTime-dt);if(bannerTime===0&&$('banner').textContent){$('banner').classList.remove('show');$('banner').textContent='';}
    }
    hudTime+=dt;if(hudTime>.1){updateHUD();hudTime=0;}
    draw(animation,dt);requestAnimationFrame(frame);
  }
  const keyMap={KeyW:'up',ArrowUp:'up',KeyA:'left',ArrowLeft:'left',KeyS:'down',ArrowDown:'down',KeyD:'right',ArrowRight:'right'};
  window.addEventListener('keydown',e=>{
    if(e.ctrlKey||e.metaKey||e.altKey||/INPUT|TEXTAREA|SELECT/.test(e.target.tagName))return;
    if(keyMap[e.code]&&phase==='play'&&!paused){e.preventDefault();pressed.add(keyMap[e.code]);pointerTarget=null;}
    if(e.repeat)return;
    if(e.code==='KeyP'||e.code==='Escape'){if(phase==='play'){e.preventDefault();setPaused(!paused);}}
    if(e.code==='KeyQ')shield();
    const kind={Digit1:'weapon',Digit2:'escort',Digit3:'reserve',Digit4:'repair'}[e.code];if(kind)purchase(kind);
  });
  window.addEventListener('keyup',e=>{if(keyMap[e.code])pressed.delete(keyMap[e.code]);});
  const point=e=>{const r=canvas.getBoundingClientRect();return{x:(e.clientX-r.left)*C.W/r.width,y:(e.clientY-r.top)*C.H/r.height};};
  canvas.addEventListener('pointerdown',e=>{if(phase!=='play'||paused||pointerId!==null)return;e.preventDefault();pointerId=e.pointerId;pointerTarget=point(e);canvas.setPointerCapture(e.pointerId);unlockAudio();});
  canvas.addEventListener('pointermove',e=>{if(e.pointerId===pointerId)pointerTarget=point(e);});
  function release(e){if(e.pointerId===pointerId){pointerId=null;/* A tap remains a destination; movement stops once reached. */}}
  canvas.addEventListener('pointerup',release);canvas.addEventListener('pointercancel',()=>{pointerId=null;pointerTarget=null;});canvas.addEventListener('lostpointercapture',release);
  for(const b of document.querySelectorAll('[data-dir]')){
    b.addEventListener('pointerdown',e=>{if(phase!=='play'||paused)return;e.preventDefault();b.setPointerCapture(e.pointerId);pointerTarget=null;pressed.add(b.dataset.dir);});
    for(const event of ['pointerup','pointercancel','lostpointercapture'])b.addEventListener(event,()=>pressed.delete(b.dataset.dir));
  }
  $('start').addEventListener('click',start);$('restart').addEventListener('click',start);$('pause').addEventListener('click',()=>setPaused(!paused));$('resume').addEventListener('click',()=>setPaused(false));
  $('shield').addEventListener('click',shield);for(const kind of ['weapon','escort','reserve','repair'])$(kind).addEventListener('click',()=>purchase(kind));
  for(const id of ['standard','storm'])$(id).addEventListener('click',()=>chooseMode(id));
  $('lang').addEventListener('click',()=>setLanguage(lang==='en'?'zh-Hant':'en'));
  window.addEventListener('storage',e=>{if(e.key==='fulam-language')setLanguage(e.newValue==='en'?'en':'zh-Hant');});
  $('sound').addEventListener('click',()=>{sound=!sound;unlockAudio();$('sound').setAttribute('aria-pressed',String(sound));put('sound',t(sound?'soundOn':'soundOff'));if(sound)tone(520,.1);});
  $('change-mode').addEventListener('click',()=>{phase='menu';paused=false;clearInput();game=C.createState({mode});showOverlay('menu');updateHUD();$('start').focus({preventScroll:true});});
  $('share').addEventListener('click',async()=>{const text=t('shareText')(game);try{await navigator.clipboard.writeText(text);put('share-status',t('copied'));}catch{put('share-status',`${t('copyFallback')} ${text}`);}});
  $('fullscreen').addEventListener('click',async()=>{try{if(document.fullscreenElement)await document.exitFullscreen();else await document.querySelector('.battle').requestFullscreen();}catch{toast('fullscreenError');}});
  document.addEventListener('visibilitychange',()=>{if(document.hidden&&phase==='play'&&!paused)setPaused(true);lastTime=null;});
  window.addEventListener('blur',()=>{clearInput();if(phase==='play'&&!paused)setPaused(true);});
  window.addEventListener('resize',sizeCanvas);document.addEventListener('fullscreenchange',sizeCanvas);
  setLanguage(lang);sizeCanvas();requestAnimationFrame(frame);
})();
