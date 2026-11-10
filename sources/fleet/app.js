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
    move: 'Move · drag or tap the sky on mobile', autofire: 'Automatic forward fire', shieldRule: 'Spend your reserve to raise a shield', best: 'LOCAL BEST', local: 'Only your best result stays in this browser', back: '← Back',
    battle: 'Air battle', capital: 'CAPITAL ARMOUR', cash: 'GAME COINS', score: 'WEALTH SCORE',
    canvas: 'Air shooter. WASD or arrow keys to move, Q for shield, 1 to 4 for upgrades, P to pause.',
    auto: 'AUTO FIRE', boss: 'DEBT STORM · BOSS', menuTag: 'PILOT, READY TO FLY.', menuTitle: 'How long can you<br>protect your capital?',
    menuHint: 'Drag to dodge. Your guns fire automatically.<br>Endless waves. Fly until defeated.', chooseMode: 'Choose difficulty',
    standard: 'Standard', standardHint: '100 capital · rising pressure', storm: 'Challenge', stormHint: '75 capital · faster fire', start: 'Take off',
    pausedTag: 'FLIGHT PAUSED', paused: 'Battle paused', pausedHint: 'Return to the sky when you are ready.', resume: 'Continue flight',
    endTag: 'FLIGHT COMPLETE', endTitle: 'Aircraft down.<br>Go further next time.', restart: 'Fly again', share: 'Copy result', changeMode: 'Change difficulty',
    pause: 'Pause', mobileHint: 'Drag or tap the sky to move. Firing is automatic.', shield: 'Emergency shield', directionPad: 'Movement buttons', left: 'Move left', right: 'Move right', up: 'Move up', down: 'Move down',
    dockTag: 'YOUR UPGRADE DECISIONS', dock: 'Aircraft workshop', dockHint: 'Invest in strength. Keep cash for survival.',
    weapon: 'Compound cannon', escort: 'Diversify escorts', reserve: 'Reserve system', repair: 'Repair capital', repairHint: 'Restore 35 armour immediately',
    income: 'RESERVE INCOME', incomeHint: 'Cash earns game income every 15 seconds. Upgrade reserves to increase income and coin pickup range.',
    enemyTag: 'KNOW THE THREAT', fee: 'Impulse spending', feeHint: 'Light raider', inflation: 'Inflation', inflationHint: 'Fan-shaped fire', scam: 'Investment scam', scamHint: 'Fast zigzag', debt: 'High-interest debt', debtHint: 'Homing torpedoes',
    label_fee: 'Spending', label_inflation: 'Inflation', label_scam: 'Scam', label_debt: 'Debt', label_trap: 'Money trap', label_myth: 'Money myth', label_rumor: 'Rumour', label_overlord: 'Ultimate Jet',
    metaphor: 'Money concepts become aircraft abilities. Coins, income and armour are fictional game values.', credits: 'Open-source credits & licence', creditNote: 'Combat core adapted from',
    changes: 'Adds endless waves, finance-themed upgrades, new aircraft art, touch controls and bilingual UI. Original music and font assets are not used.',
    wave: 'SECTOR', combo: 'COMBO', max: 'MAX', full: 'FULL', ready: 'coins · ready', active: 'Shield active', cooldown: 'Ready in', seconds: 's', coins: 'coins',
    weapons: ['Homing cannon', 'Twin homing guns', 'Three-way spread', 'Piercing beams', 'Heavy plasma orbs'],
    escorts: ['Add a homing escort', 'Add a second escort', 'Rapid-fire escorts', 'Two rapid-fire escorts'],
    reserves: ['Longer shield · wider pickup', 'More income · cheaper shield', 'Maximum shield efficiency', 'Reserve system fully upgraded'],
    weaponNext: 'Next: ', equipped: 'Equipped: ', noCash: 'Collect more coins first', shieldWait: 'Shield is recharging', upgraded: 'Upgrade installed', repaired: 'Capital repaired',
    shieldRaised: 'EMERGENCY SHIELD', waveBanner: 'ENTERING SECTOR', bossBanner: 'WARNING · DEBT STORM', ultimateBanner: 'ULTIMATE MODE · FINAL JET', dividend: 'Reserve income', graze: 'CLOSE CALL +20',
    newBest: 'NEW LOCAL BEST', storageUnavailable: 'Saving is unavailable in this browser.', copied: 'Result copied — ready to share.', copyFallback: 'Copy this result:', fullscreenError: 'Full screen is not available in this browser.',
    endStats: (s) => `Sector ${s.wave} · ${s.kills} aircraft down · ${s.mode === 'booth' ? 'Booth intermediate' : s.mode === 'storm' ? 'Challenge' : 'Standard'}`,
    tip: 'Keep a small cash reserve. A shield can save your next run.',
    shareText: s => `FuLam Wealth Wings: ${s.score.toLocaleString('en')} points · sector ${s.wave} · ${s.kills} aircraft down (${s.mode === 'booth' ? 'Booth intermediate' : s.mode === 'storm' ? 'Challenge' : 'Standard'}). Can you beat me? https://rysung2406.github.io/fulam-money-journey/fleet/`
  };
  const ZH = {
    soundOn: '音效：開', wave: '空域', combo: '連擊', max: '滿級', full: '已滿', ready: '幣 · 就緒', active: '護盾生效中', cooldown: '冷卻', seconds: '秒', coins: '幣',
    label_fee: '衝動消費', label_inflation: '通脹', label_scam: '投資騙局', label_debt: '高息債務', label_trap: '理財陷阱', label_myth: '理財誤解', label_rumor: '流言', label_overlord: '終極戰機',
    weapons: ['追蹤火炮', '雙管追蹤炮', '三路散射炮', '貫穿射線炮', '重型能量球'],
    escorts: ['增加一架追蹤僚機', '增加第二架僚機', '僚機射速提升', '雙架高速僚機'],
    reserves: ['護盾更長 · 拾幣更遠', '收益提升 · 護盾更省', '護盾與儲備全面提升', '儲備系統已滿級'],
    weaponNext: '下級：', equipped: '裝備：', noCash: '先收集更多金幣', shieldWait: '護盾正在冷卻', upgraded: '升級完成', repaired: '本金已修復',
    shieldRaised: '應急護盾啟動', waveBanner: '進入空域', bossBanner: '警報 · 債務風暴來襲', ultimateBanner: '終極模式 · 終極戰機來襲', dividend: '儲備收益', graze: '擦彈 +20',
    newBest: '刷新本機最佳', storageUnavailable: '此瀏覽器暫時無法保存成績。', copied: '已複製戰績，可以分享了。', copyFallback: '請複製以下戰績：', fullscreenError: '此瀏覽器暫不支援全螢幕。',
    endStats: s => `空域 ${s.wave} · 擊落 ${s.kills} 架 · ${s.mode === 'booth' ? 'Booth 中等' : s.mode === 'storm' ? '挑戰' : '標準'}`,
    tip: '留一筆應急金，下次危急時按 Q 開盾。',
    shareText: s => `富臨財富戰機：${s.score.toLocaleString('en')} 分 · 空域 ${s.wave} · 擊落 ${s.kills} 架（${s.mode === 'booth' ? 'Booth 中等' : s.mode === 'storm' ? '挑戰' : '標準'}）。你能超越我嗎？https://rysung2406.github.io/fulam-money-journey/fleet/`
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
  Object.assign(EN, { workshop: 'Hangar', closeDock: 'Back to battle', shopPaused: 'Battle paused · choose an upgrade', lowHealth: 'LOW ARMOUR · REPAIR OR SHIELD', exitScreen: 'Exit full screen' });
  Object.assign(ZH, { workshop: '機庫', closeDock: '返回戰場', shopPaused: '戰局已暫停 · 安心選購升級', lowHealth: '護甲危急 · 修復或開盾', exitScreen: '退出全螢幕' });
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
    $('overlay').hidden = !which;$('sea').classList.toggle('showing-result',which==='end-menu'&&!!journey);
    for (const id of ['menu', 'pause-menu', 'end-menu']) $(id).hidden = id !== which;
  }
  function prepareStart(){if(!journey){start();return;}document.body.classList.remove('fleet-menu');document.body.classList.add('fleet-playing');showOverlay(null);journey.guide($('sea'),start,returnMenu);}
  function returnMenu(){journey?.close();if(journey?.status)journey.status.hidden=true;$('sea').classList.remove('journey-live','ultimate-mode');document.body.classList.remove('fleet-playing','ultimate-mode');document.body.classList.add('fleet-menu');phase='menu';paused=false;shopOpen=false;ultimateAnnounced=false;$('combat-layout').classList.remove('workshop-open');clearInput();game=C.createState({mode});showOverlay('menu');updateHUD();$('start').focus({preventScroll:true});}
  let ultimateAnnounced=false;
  function start() {
    document.body.classList.remove('fleet-menu','ultimate-mode');document.body.classList.add('fleet-playing');$('sea').classList.remove('ultimate-mode');
    shopOpen = false; deathTime = lowHealthSound = 0; fx.clear();ultimateAnnounced=false;
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
    put('end-label', journey?journey.text('本局戰績','RUN RECORD'):t(resultIsBest ? 'newBest' : 'endTag'));if(journey&&journey.run.reason==='exit')document.querySelector('[data-t="endTitle"]').textContent=journey.text('本局已結束','Run complete');else if(journey&&(journey.run.reason==='time'||journey.run.reason==='stages'))document.querySelector('[data-t="endTitle"]').textContent=journey.text('Booth 挑戰完成！','Booth challenge complete!');else document.querySelector('[data-t="endTitle"]').innerHTML=t('endTitle'); put('end-score', game.score.toLocaleString('en'));
    put('end-stats', journey?journey.text('第 '+game.wave+' / 4 回合 · 擊落 '+game.kills+' 架','Round '+game.wave+' / 4 · '+game.kills+' enemies defeated'):t('endStats')(game)); put('end-tip', t('tip'));if(journey){$('end-menu')?.classList.add('festive-card');document.querySelector('[data-t="endTag"]').textContent=journey.text('聖誕飛行結束','FESTIVE FLIGHT COMPLETE');document.querySelector('[data-t="endTitle"]').textContent=journey.text('聖誕飛行挑戰完成','Festive flight complete');$('share').hidden=true;$('restart').textContent=journey.text('再玩一次','Play again');}$('end-tip').classList.toggle('compact-result',!!journey);if(journey)$('end-tip').innerHTML=journey.result(game.score,{kills:game.kills},journey.run.reason||'defeat'); if (saveFailed) put('share-status', t('storageUnavailable'));
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
    const active = phase === 'play' && (!paused || shopOpen), s = game;if(journey&&$('swap-weapon')){put('swap-weapon',journey.text('飛機 ','Jet ')+'Lv.'+(game.evolution.weapon+1)+' '+journey.name(game.evolution.weapon));$('swap-weapon').title=journey.name(game.evolution.weapon);}
    const hpHTML = `${Math.ceil(s.hero.hp)}<span>/ ${s.hero.maxHp}</span>`; if ($('hp').innerHTML !== hpHTML) $('hp').innerHTML = hpHTML;
    $('hp-bar').style.width = `${s.hero.hp / s.hero.maxHp * 100}%`; $('hp-bar').style.background = s.hero.hp < 30 ? 'var(--danger)' : 'var(--aqua)';
    put('cash', s.cash.toLocaleString('en')); put('score', s.score.toLocaleString('en')); put('best', (journey?journey.best():(best?.score || 0)).toLocaleString('en'));
    put('sector', `${t('wave')} ${String(s.wave).padStart(2, '0')}`); put('combo', s.combo >= 2 ? `${s.combo} ${t('combo')}` : '');
    put('wave-progress', journey?.run?`${Math.ceil(Math.max(0,journey.run.roundLimit()-journey.run.roundTime))}s`:`${Math.min(s.waveKills, s.goal)} / ${s.goal}`); $('wave-bar').style.width = `${journey?.run?journey.run.roundTime/journey.run.roundLimit()*100:Math.min(100, s.waveKills / s.goal * 100)}%`;
    put('income', `+${s.income}`); $('income-bar').style.width = `${s.dividend / 15 * 100}%`;
    $('pause').disabled = phase !== 'play' || shopOpen; $('shield').disabled = !active || shopOpen || s.shieldCooldown > 0 || s.cash < C.shieldCost(s);
    $('dock-toggle').disabled = phase !== 'play' || (paused && !shopOpen);
    $('sea').classList.toggle('low-health', phase === 'play' && s.hero.hp <= s.hero.maxHp * .3);
    $('low-health').hidden = phase !== 'play' || s.hero.hp > s.hero.maxHp * .3;
    put('shield-status', s.shield > 0 ? `${t('active')} ${Math.ceil(s.shield)}${t('seconds')}` : s.shieldCooldown > 0 ? `${t('cooldown')} ${Math.ceil(s.shieldCooldown)}${t('seconds')}` : `${C.shieldCost(s)} ${t('ready')}`);
    if(journey&&game.evolution.protection)$('shield-status').textContent+=journey.text(' · 減傷 ',' · Guard ')+Math.round((1-journey.survival(game.evolution).multiplier)*100)+'%';
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
    const boss = s.entities.find(e => C.isBossKind(e.kind) && !e.dead); $('boss-bar').hidden = !boss || phase !== 'play';
    if(boss){const label=boss.kind==='overlord'?t('label_overlord'):t('boss');const span=$('boss-bar').querySelector('span');if(span)span.textContent=label;$('boss-hp').style.width=`${Math.max(0,boss.hp/boss.maxHp*100)}%`;}
  }
  const COLORS = { player: '#a6d5ce', fee: '#eaa694', inflation: '#d9bc85', scam: '#f99664', debt: '#b6a2cc', boss: '#e7a08b', overlord: '#ffd24a', trap: '#e4bd73', myth: '#a9b8ed', rumor: '#c6c791', escort: '#9bc8cd' };
  function path(points, fill, stroke = null) {
    ctx.beginPath(); points.forEach(([x, y], i) => i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)); ctx.closePath();
    if (fill) { ctx.fillStyle = fill; ctx.fill(); } if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = 1; ctx.stroke(); }
  }
  function candyCane(cx,cy,sc=1,tilt=-.4){
    ctx.save();ctx.translate(cx,cy);ctx.rotate(tilt);ctx.scale(sc,sc);ctx.lineCap='round';
    ctx.strokeStyle='#fffef9';ctx.lineWidth=4;ctx.beginPath();ctx.moveTo(0,12);ctx.lineTo(0,-3);ctx.quadraticCurveTo(0,-12,8,-12);ctx.stroke();
    ctx.strokeStyle='#c23b3b';ctx.lineWidth=4;ctx.setLineDash([3.5,3.5]);ctx.beginPath();ctx.moveTo(0,12);ctx.lineTo(0,-3);ctx.quadraticCurveTo(0,-12,8,-12);ctx.stroke();
    ctx.setLineDash([]);ctx.restore();
  }
  function miniBell(bx,by,sc=1){
    ctx.save();ctx.translate(bx,by);ctx.scale(sc,sc);
    ctx.fillStyle='#f0d878';ctx.beginPath();ctx.moveTo(-5,-1);ctx.quadraticCurveTo(-7,5,-8,7);ctx.lineTo(8,7);ctx.quadraticCurveTo(7,5,5,-1);ctx.quadraticCurveTo(0,-5,-5,-1);ctx.fill();
    ctx.fillStyle='#8a5a1a';ctx.fillRect(-1.6,-6,3.2,2.8);ctx.fillStyle='#d4a84a';ctx.beginPath();ctx.arc(0,8,1.5,0,Math.PI*2);ctx.fill();ctx.restore();
  }
  function jellyDot(jx,jy,tone,sc=1){
    ctx.save();ctx.translate(jx,jy);ctx.scale(sc,sc);
    ctx.fillStyle=tone;ctx.beginPath();ctx.ellipse(0,0,3.6,4.4,0,0,Math.PI*2);ctx.fill();
    ctx.fillStyle='#ffffffaa';ctx.beginPath();ctx.ellipse(-1,-1.3,1.1,1.5,-.3,0,Math.PI*2);ctx.fill();ctx.restore();
  }
  function ship(x, y, angle, scale, kind, time, flash = 0, level = 0) {
    const festive = !!journey && (kind === 'player' || kind === 'escort');
    const paint = festive && kind === 'player'
      ? (level >= 3 ? '#f2b7c8' : level >= 2 ? '#b7d6b0' : level >= 1 ? '#f3e6df' : '#c9e7f2')
      : festive && kind === 'escort'
        ? (level >= 3 ? '#e8c0cf' : level >= 2 ? '#c5d8c0' : level >= 1 ? '#efe4de' : '#bfdce6')
        : COLORS[kind];
    const fill = flash > 0 ? '#fff5d6' : paint;
    const trim = festive && kind === 'player'
      ? (level >= 3 ? '#c23b3b' : level >= 2 ? '#2f8f5b' : level >= 1 ? '#c23b3b' : '#7eb8d4')
      : (kind === 'overlord' ? '#fff3c4' : '#e1f3e9aa');
    const canopy = festive && kind === 'player'
      ? (level >= 3 ? '#5a2740' : level >= 2 ? '#1f4a38' : level >= 1 ? '#4a2a28' : '#1a3a4a')
      : (kind === 'overlord' ? '#c9952e' : '#204758');
    const canopyEdge = festive && kind === 'player'
      ? (level >= 3 ? '#ffd0e0' : level >= 2 ? '#edb579' : level >= 1 ? '#fff2c8' : '#dff4ff')
      : (kind === 'overlord' ? '#ffe9a8' : '#adf3ed');
    ctx.save(); ctx.translate(x, y); ctx.rotate(angle + Math.PI / 2); ctx.scale(scale, scale);
    // Original vector aircraft: swept wings, cockpit, wingtip lights and jet exhaust.
    ctx.fillStyle='#09192355';ctx.beginPath();ctx.ellipse(5,10,28,12,0,0,Math.PI*2);ctx.fill();
    const flame=10+Math.sin(time*38)*4;ctx.fillStyle=kind==='player'?(festive?(level>=3?'#e85a9a':level>=2?'#f0d878':level>=1?'#ffb0b0':'#a2f3ee'):'#a2f3ee'):kind==='overlord'?'#ffe39b':'#ffbd7d';
    path([[-4,19],[0,28+flame],[4,19]],ctx.fillStyle);ctx.globalAlpha=.35;path([[-7,18],[0,36+flame],[7,18]],ctx.fillStyle);ctx.globalAlpha=1;
    if(kind==='player'&&level>=3){const side=8+Math.sin(time*38+1)*3;path([[-16,16],[-12,22+side],[-8,16]],festive?'#ff8eb8':'#7ee7ff');path([[8,16],[12,22+side],[16,16]],festive?'#ff8eb8':'#7ee7ff');}
    // Round silhouette tweaks: frost delta / cane fins / evergreen canards / gift delta.
    if(festive&&kind==='player'){
      if(level===0)path([[-34,8],[-42,18],[-30,22],[-18,12]],'#9ec9dc',trim);
      if(level===0)path([[34,8],[42,18],[30,22],[18,12]],'#9ec9dc',trim);
      if(level===1){path([[-32,2],[-48,10],[-46,20],[-30,14]],'#fffef9',trim);path([[32,2],[48,10],[46,20],[30,14]],'#fffef9',trim);}
      if(level===2){path([[-28,-2],[-40,8],[-36,18],[-22,10]],'#6f9e78',trim);path([[28,-2],[40,8],[36,18],[22,10]],'#6f9e78',trim);}
      if(level>=3){path([[-31,6],[-50,12],[-48,24],[-30,16]],'#c23b3b','#fffef9');path([[31,6],[50,12],[48,24],[30,16]],'#c23b3b','#fffef9');}
    }
    path([[0,-32],[6,-10],[31,12],[30,19],[7,11],[5,23],[13,29],[13,33],[0,28],[-13,33],[-13,29],[-5,23],[-7,11],[-30,19],[-31,12],[-6,-10]],fill,trim);
    path([[0,-23],[4,-7],[3,9],[-3,9],[-4,-7]],canopy,canopyEdge);
    ctx.fillStyle=kind==='overlord'?'#fff1b8':(festive&&kind==='player'?(level>=2?'#edb579':'#f4d58f'):'#f4d58f');ctx.fillRect(-25,14,5,2);ctx.fillRect(20,14,5,2);
    if(kind==='player'&&level>=1){ctx.fillStyle=festive?(level>=2?'#f0d878':'#fffef9'):(level>=2?'#8cf4ff':'#d7fff6');ctx.fillRect(-30,4,9,16);ctx.fillRect(21,4,9,16);if(festive&&level===1){ctx.fillStyle='#c23b3b';for(let i=0;i<3;i++){ctx.fillRect(-28,6+i*5,5,2.4);ctx.fillRect(23,6+i*5,5,2.4);}}}
    if(kind==='player'&&level>=2){ctx.strokeStyle=festive?'#edb579':'#8cf4ff';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(-4,-30);ctx.lineTo(0,-48);ctx.lineTo(4,-30);ctx.stroke();ctx.fillStyle=festive?'#fff2c8':'#e8fdff';ctx.fillRect(-1.5,-46,3,16);}
    if(kind==='player'&&level>=3&&!festive){path([[-31,6],[-46,16],[-44,24],[-30,16]],'#6faca8','#d7fff6');path([[31,6],[46,16],[44,24],[30,16]],'#6faca8','#d7fff6');}
    if(kind==='trap'){path([[-30,5],[-42,17],[-30,24],[-14,11]],'#b68444','#ffe1a6');path([[30,5],[42,17],[30,24],[14,11]],'#b68444','#ffe1a6');}
    if(kind==='myth'){path([[-22,-2],[-38,8],[-30,14],[-14,7]],'#697fb1','#d8eaff');path([[22,-2],[38,8],[30,14],[14,7]],'#697fb1','#d8eaff');ctx.fillStyle='#e9edff';ctx.fillRect(-2,-17,4,9);}
    if(kind==='rumor'){path([[-12,-4],[-34,7],[-25,19],[-11,7]],'#8b9872','#e8edc8');path([[12,-4],[34,7],[25,19],[11,7]],'#8b9872','#e8edc8');}
    if(kind==='boss'){path([[-44,9],[-10,-11],[10,-11],[44,9],[42,27],[15,18],[-15,18],[-42,27]],'#d39582','#ffe2a8');path([[0,-35],[9,8],[0,26],[-9,8]],fill);}
    if(kind==='overlord'){path([[-44,9],[-10,-11],[10,-11],[44,9],[42,27],[15,18],[-15,18],[-42,27]],'#f0c14a','#fff3c4');path([[0,-35],[9,8],[0,26],[-9,8]],'#ffd24a','#fff7d6');ctx.fillStyle='#ffe9a8';ctx.fillRect(-34,8,10,3);ctx.fillRect(24,8,10,3);path([[-31,6],[-48,16],[-46,24],[-30,16]],'#e2b03a','#fff1b8');path([[31,6],[48,16],[46,24],[30,16]],'#e2b03a','#fff1b8');}
    // Integrated festive livery + hardpoints (no oversized hats).
    if(festive&&kind==='player'){
      if(level===0){
        ctx.strokeStyle='#eef8ff';ctx.fillStyle='#ffffff';ctx.lineWidth=1.3;ctx.lineCap='round';
        for(let i=0;i<3;i++){ctx.save();ctx.translate(0,-14);ctx.rotate(i*Math.PI/3);ctx.beginPath();ctx.moveTo(-5,0);ctx.lineTo(5,0);ctx.stroke();ctx.restore();}
        ctx.beginPath();ctx.arc(0,-14,1.8,0,Math.PI*2);ctx.fill();
        ctx.fillStyle='#dff4ff';ctx.beginPath();ctx.arc(-24,10,2.2,0,Math.PI*2);ctx.fill();ctx.beginPath();ctx.arc(24,10,2.2,0,Math.PI*2);ctx.fill();
        ctx.strokeStyle='#9ec9dc88';ctx.lineWidth=1.5;ctx.beginPath();ctx.moveTo(-10,2);ctx.lineTo(10,2);ctx.stroke();
      }else if(level===1){
        candyCane(-34,8,.55,.9);candyCane(34,8,.55,-.9);
        ctx.strokeStyle='#c23b3b';ctx.lineWidth=1.8;ctx.setLineDash([3,3]);
        ctx.beginPath();ctx.moveTo(-6,-6);ctx.lineTo(6,8);ctx.moveTo(6,-6);ctx.lineTo(-6,8);ctx.stroke();ctx.setLineDash([]);
        ctx.fillStyle='#c23b3b';ctx.fillRect(-3,-26,6,4);
      }else if(level===2){
        miniBell(-22,14,.72);miniBell(22,14,.72);
        ctx.fillStyle='#2f8f5b';ctx.beginPath();ctx.moveTo(-5,-26);ctx.lineTo(0,-33);ctx.lineTo(5,-26);ctx.closePath();ctx.fill();
        ctx.fillStyle='#edb579';ctx.beginPath();ctx.arc(0,-24,1.6,0,Math.PI*2);ctx.fill();
        ctx.strokeStyle='#edb57988';ctx.lineWidth=1.4;ctx.beginPath();ctx.moveTo(-12,0);ctx.quadraticCurveTo(0,8,12,0);ctx.stroke();
      }else{
        const tones=['#c23b3b','#2f9e6b','#f0d878','#e85a9a'];
        for(let i=0;i<4;i++)jellyDot(-20+i*13,12+(i%2?3:-2),tones[i],.85+Math.sin(time*5+i)*.05);
        jellyDot(-38,2,'#e85a9a',.75);jellyDot(38,2,'#f0d878',.75);
        ctx.fillStyle='#c23b3b';ctx.fillRect(-10,-4,20,3);ctx.fillRect(-1.5,-12,3,16);
        ctx.fillStyle='#edb579';ctx.beginPath();ctx.arc(0,-4,2.2,0,Math.PI*2);ctx.fill();
      }
    }else if(festive&&kind==='escort'){
      ctx.fillStyle=level>=2?'#edb579':'#dff4ff';ctx.beginPath();ctx.arc(-10,8,1.8,0,Math.PI*2);ctx.fill();ctx.beginPath();ctx.arc(10,8,1.8,0,Math.PI*2);ctx.fill();
      if(level>=1){ctx.strokeStyle='#c23b3b88';ctx.lineWidth=1.2;ctx.setLineDash([2,2]);ctx.beginPath();ctx.moveTo(-4,-4);ctx.lineTo(4,6);ctx.stroke();ctx.setLineDash([]);}
      if(level>=2)miniBell(0,12,.45);
      if(level>=3)jellyDot(0,4,'#e85a9a',.55);
    }else if(journey&&kind!=='player'&&kind!=='escort'){
      // Subtle wingtip lights only — keep enemy silhouettes readable.
      ctx.fillStyle=kind==='overlord'||kind==='boss'?'#edb579':'#c23b3b';
      ctx.beginPath();ctx.arc(-22,12,2,0,Math.PI*2);ctx.fill();ctx.beginPath();ctx.arc(22,12,2,0,Math.PI*2);ctx.fill();
    }
    ctx.restore();
  }
  const ocean = document.createElement('canvas'); ocean.width = C.W; ocean.height = C.H;
  const ox = ocean.getContext('2d'), oceanGradient = ox.createLinearGradient(0, 0, 0, C.H);
  oceanGradient.addColorStop(0, '#163a55'); oceanGradient.addColorStop(.45, '#0b2533'); oceanGradient.addColorStop(1, '#0a1f30');
  ox.fillStyle = oceanGradient; ox.fillRect(0, 0, C.W, C.H);
  const aurora = ox.createLinearGradient(0, 40, C.W, 220);
  aurora.addColorStop(0, '#2f8f5b00'); aurora.addColorStop(.35, '#2f8f5b22'); aurora.addColorStop(.65, '#edb57918'); aurora.addColorStop(1, '#2f8f5b00');
  ox.fillStyle = aurora; ox.fillRect(0, 0, C.W, 260);
  ox.fillStyle = '#fff4d255'; ox.beginPath(); ox.arc(C.W * .78, 70, 28, 0, Math.PI * 2); ox.fill();
  // Distant Christmas tree silhouettes along the horizon.
  const drawTree = (tx, ty, sc) => {
    ox.fillStyle = '#1f5a3f'; ox.beginPath(); ox.moveTo(tx, ty - 70 * sc); ox.lineTo(tx + 32 * sc, ty); ox.lineTo(tx - 32 * sc, ty); ox.closePath(); ox.fill();
    ox.fillStyle = '#2a6f4d'; ox.beginPath(); ox.moveTo(tx, ty - 52 * sc); ox.lineTo(tx + 24 * sc, ty - 8 * sc); ox.lineTo(tx - 24 * sc, ty - 8 * sc); ox.closePath(); ox.fill();
    ox.fillStyle = '#6b4423'; ox.fillRect(tx - 4 * sc, ty, 8 * sc, 12 * sc);
    ox.fillStyle = '#c23b3b'; ox.beginPath(); ox.arc(tx - 10 * sc, ty - 28 * sc, 3.2 * sc, 0, Math.PI * 2); ox.fill();
    ox.fillStyle = '#edb579'; ox.beginPath(); ox.arc(tx + 9 * sc, ty - 36 * sc, 3 * sc, 0, Math.PI * 2); ox.fill();
    ox.fillStyle = '#fff2c8'; ox.beginPath(); ox.arc(tx, ty - 48 * sc, 2.8 * sc, 0, Math.PI * 2); ox.fill();
  };
  ox.fillStyle = '#0f2a3a'; ox.beginPath(); ox.moveTo(0, C.H * .82); ox.quadraticCurveTo(C.W * .3, C.H * .72, C.W * .55, C.H * .8); ox.quadraticCurveTo(C.W * .8, C.H * .86, C.W, C.H * .78); ox.lineTo(C.W, C.H); ox.lineTo(0, C.H); ox.closePath(); ox.fill();
  drawTree(48, C.H * .84, 1.1); drawTree(110, C.H * .86, .85); drawTree(C.W - 120, C.H * .83, 1); drawTree(C.W - 55, C.H * .85, 1.25);
  ox.strokeStyle = '#edb57914'; ox.lineWidth = 1;
  for (let x=0; x<C.W; x+=46) { ox.beginPath(); ox.moveTo(x,0); ox.lineTo(x,C.H); ox.stroke(); }
  for (let y=0; y<C.H; y+=46) { ox.beginPath(); ox.moveTo(0,y); ox.lineTo(C.W,y); ox.stroke(); }
  function drawOcean(time) {
    ctx.drawImage(ocean, 0, 0); ctx.lineWidth = .8;
    for (let i = 0; i < 26; i++) {
      const x = (i * 127 + 18) % C.W, y = ((i * 71 + time * 11) % (C.H + 35)) - 18;
      ctx.strokeStyle = i % 3 === 0 ? '#edb5791a' : '#ffffff0d'; ctx.beginPath(); ctx.moveTo(x-14,y); ctx.quadraticCurveTo(x,y-5,x+14,y); ctx.stroke();
    }
    ctx.fillStyle='#ffffff1c';
    for(let i=0;i<18;i++){const x=(i*97+time*28)%(C.W+20)-10,y=(i*61+time*36)%(C.H+40)-20;ctx.beginPath();ctx.arc(x,y,1.4+(i%3)*.5,0,Math.PI*2);ctx.fill();}
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
      const scale = e.kind === 'overlord' ? 2.7 : e.kind === 'boss' ? 2.3 : e.kind === 'debt' ? 1.3 : e.kind === 'inflation' ? 1.1 : e.kind === 'scam' ? .8 : e.kind==='trap'?1:e.kind==='myth'?.9:.87;
      ship(p.x,p.y,Math.PI/2,scale,e.kind,time,e.flash);if(e.kind==='overlord'){ctx.save();ctx.strokeStyle='#ffd24acc';ctx.lineWidth=3;ctx.beginPath();ctx.arc(p.x,p.y,scale*34+Math.sin(time*4)*3,0,Math.PI*2);ctx.stroke();ctx.strokeStyle='#fff3c488';ctx.lineWidth=1.5;ctx.beginPath();ctx.arc(p.x,p.y,scale*40+Math.sin(time*4+1)*2,0,Math.PI*2);ctx.stroke();ctx.restore();}if(e.elite){ctx.strokeStyle='#ffb37e';ctx.lineWidth=2;ctx.beginPath();ctx.arc(p.x,p.y,scale*29,0,Math.PI*2);ctx.stroke();}if(!game.arcade&&e.kind==='boss'&&e.strategy.remainingBeforeAttack<.65){ctx.strokeStyle='#ffdb9c';ctx.lineWidth=2;ctx.beginPath();ctx.arc(p.x,p.y,55+Math.sin(time*14)*3,0,Math.PI*2);ctx.stroke();}
      if(e.attack){ctx.save();ctx.strokeStyle=e.kind==='overlord'?'#ffe39b':'#ffcf99';ctx.globalAlpha=.4+.4*(1-e.attack.remaining/e.attack.duration);ctx.lineWidth=2;ctx.setLineDash([5,7]);for(const a of e.attack.angles){ctx.beginPath();ctx.moveTo(p.x+Math.cos(a)*24,p.y+Math.sin(a)*24);ctx.lineTo(p.x+Math.cos(a)*(C.isBossKind(e.kind)?135:78),p.y+Math.sin(a)*(C.isBossKind(e.kind)?135:78));ctx.stroke();}ctx.setLineDash([]);ctx.beginPath();ctx.arc(p.x,p.y,scale*24,0,Math.PI*2);ctx.stroke();ctx.restore();}
      if (e.hp < e.maxHp || e.kind==='overlord') { const w=C.isBossKind(e.kind)?90:35; ctx.fillStyle='#09242f';ctx.fillRect(p.x-w/2,p.y-scale*35,w,3);ctx.fillStyle=COLORS[e.kind]||COLORS.boss;ctx.fillRect(p.x-w/2,p.y-scale*35,w*Math.max(0,e.hp/e.maxHp),3); }
      if (e.kind !== 'boss') drawLabel(t(`label_${e.kind}`),p.x,p.y+scale*34,COLORS[e.kind]||COLORS.boss,13);
    } else if (e.type === 'torpedo' && e.ray) {
      ctx.save(); ctx.lineCap='round';
      if(e.style==='candycane'){
        const sx=e.ray.start.x,sy=e.ray.start.y,ex=e.ray.end.x,ey=e.ray.end.y;
        ctx.strokeStyle='#c23b3b';ctx.globalAlpha=.35;ctx.lineWidth=7;ctx.beginPath();ctx.moveTo(sx,sy);ctx.lineTo(ex,ey);ctx.stroke();
        ctx.globalAlpha=1;ctx.lineWidth=4.2;ctx.beginPath();ctx.moveTo(sx,sy);ctx.lineTo(ex,ey);ctx.stroke();
        ctx.strokeStyle='#fffef9';ctx.lineWidth=2.4;ctx.setLineDash([7,8]);ctx.lineDashOffset=-(time*48)%15;
        ctx.beginPath();ctx.moveTo(sx,sy);ctx.lineTo(ex,ey);ctx.stroke();ctx.setLineDash([]);
        ctx.fillStyle='#fffef9';ctx.beginPath();ctx.arc(sx,sy,2.4,0,Math.PI*2);ctx.fill();
      }else{
        ctx.strokeStyle=e.color||'#8cf4ff';
        ctx.globalAlpha=.28; ctx.lineWidth=6; ctx.beginPath(); ctx.moveTo(e.ray.start.x,e.ray.start.y); ctx.lineTo(e.ray.end.x,e.ray.end.y); ctx.stroke();
        ctx.globalAlpha=1; ctx.lineWidth=2.2; ctx.stroke();
      }
      ctx.restore();
    } else if (e.type === 'torpedo') {
      ctx.save(); ctx.translate(p.x,p.y); ctx.rotate(p.r); const friendly=e.collision.group===C.FRIEND; if(friendly&&game.mode==='booth'&&e.style!=='beam'&&e.style!=='bomb'&&e.style!=='bell'&&e.style!=='jelly')ctx.scale(1.8,1.8);
      const color=friendly?(e.color||(e.style==='escort'?'#9df1de':'#ffe1a1')):e.style==='debt'?'#d5acf1':e.style==='seeker'?'#ffb36a':'#ff9b84';
      ctx.strokeStyle=color;ctx.fillStyle=color;ctx.lineWidth=e.style==='beam'?3:2;
      if(e.style==='missile'){ctx.beginPath();ctx.moveTo(12,0);ctx.lineTo(-7,-4);ctx.lineTo(-4,0);ctx.lineTo(-7,4);ctx.closePath();ctx.fill();ctx.fillStyle='#fff5c9';ctx.fillRect(-12,-1,6,2);}else if(e.style==='jelly'){const r=Math.max(6,e.collision.radius*1.4),palette=['#c23b3b','#2f9e6b','#f0d878','#e85a9a','#fffef9'],tone=palette[Math.abs(Math.floor(p.x+p.y))%palette.length];ctx.shadowColor=tone;ctx.shadowBlur=12;ctx.fillStyle=tone;ctx.beginPath();ctx.ellipse(0,0,r*.7,r,0,0,Math.PI*2);ctx.fill();ctx.shadowBlur=0;ctx.fillStyle='#ffffffbb';ctx.beginPath();ctx.ellipse(-r*.2,-r*.28,r*.2,r*.3,-.35,0,Math.PI*2);ctx.fill();ctx.strokeStyle='#ffffff55';ctx.lineWidth=1.2;ctx.beginPath();ctx.ellipse(0,0,r*.7,r,0,0,Math.PI*2);ctx.stroke();}else if(e.style==='bell'){const r=Math.max(7,e.collision.radius*1.35);ctx.shadowColor='#ffe08a';ctx.shadowBlur=14;ctx.fillStyle='#f0d878';ctx.beginPath();ctx.moveTo(-r*.55,-r*.2);ctx.quadraticCurveTo(-r*.75,r*.5,-r*.9,r*.7);ctx.lineTo(r*.9,r*.7);ctx.quadraticCurveTo(r*.75,r*.5,r*.55,-r*.2);ctx.quadraticCurveTo(0,-r*.55,-r*.55,-r*.2);ctx.fill();ctx.shadowBlur=0;ctx.fillStyle='#c23b3b';ctx.fillRect(-r*.2,-r*.72,r*.4,r*.32);ctx.strokeStyle='#fff1b0';ctx.lineWidth=1.3;ctx.beginPath();ctx.moveTo(-r*.7,r*.55);ctx.lineTo(r*.7,r*.55);ctx.stroke();ctx.fillStyle='#d4a84a';ctx.beginPath();ctx.arc(0,r*.82,r*.18,0,Math.PI*2);ctx.fill();ctx.fillStyle='#ffffff99';ctx.beginPath();ctx.ellipse(-r*.22,-r*.05,r*.16,r*.28, -.3,0,Math.PI*2);ctx.fill();}else if(e.style==='bomb'){ctx.fillStyle='#ffb07a55';ctx.beginPath();ctx.arc(0,0,9,0,Math.PI*2);ctx.fill();ctx.fillStyle='#ffb07a';ctx.beginPath();ctx.arc(0,0,5,0,Math.PI*2);ctx.fill();ctx.strokeStyle='#fff1c2';ctx.beginPath();ctx.moveTo(2,-4);ctx.lineTo(6,-9);ctx.stroke();}else if(e.style==='arc'){ctx.beginPath();ctx.moveTo(-16,-4);ctx.lineTo(-5,4);ctx.lineTo(2,-4);ctx.lineTo(12,0);ctx.stroke();}else if(e.style==='beam'){const slim=friendly&&game.mode==='booth';ctx.lineWidth=slim?2:(friendly?6:3);ctx.globalAlpha=.4;ctx.beginPath();ctx.moveTo(slim?-8:-30,0);ctx.lineTo(slim?16:(friendly?34:12),0);ctx.stroke();ctx.globalAlpha=1;ctx.lineWidth=slim?1.2:(friendly?2.6:2);ctx.beginPath();ctx.moveTo(slim?-2:-10,0);ctx.lineTo(slim?14:(friendly?28:10),0);ctx.stroke();}else if (e.style==='orb') { ctx.fillStyle='#e9c87b25';ctx.beginPath();ctx.arc(0,0,16,0,Math.PI*2);ctx.fill();ctx.fillStyle='#ffe1a1';ctx.beginPath();ctx.arc(0,0,8,0,Math.PI*2);ctx.fill();ctx.fillStyle='#fff7e4';ctx.beginPath();ctx.arc(2,-2,3,0,Math.PI*2);ctx.fill(); }
      else if(e.style==='seeker'){ctx.globalAlpha=.35;ctx.beginPath();ctx.moveTo(-14,0);ctx.lineTo(2,0);ctx.stroke();ctx.globalAlpha=1;ctx.beginPath();ctx.moveTo(7,0);ctx.lineTo(-4,-3.5);ctx.lineTo(-1,0);ctx.lineTo(-4,3.5);ctx.closePath();ctx.fill();}
      else if(e.style==='snowflake'){
        const r=Math.max(5,e.collision.radius*1.35);
        ctx.shadowColor='#cfefff';ctx.shadowBlur=10;ctx.strokeStyle='#eef8ff';ctx.fillStyle='#ffffff';ctx.lineWidth=1.6;ctx.lineCap='round';
        for(let i=0;i<3;i++){ctx.save();ctx.rotate(i*Math.PI/3);ctx.beginPath();ctx.moveTo(-r,0);ctx.lineTo(r,0);ctx.stroke();ctx.beginPath();ctx.moveTo(r*.42,0);ctx.lineTo(r*.72,-r*.28);ctx.moveTo(r*.42,0);ctx.lineTo(r*.72,r*.28);ctx.stroke();ctx.beginPath();ctx.moveTo(-r*.42,0);ctx.lineTo(-r*.72,-r*.28);ctx.moveTo(-r*.42,0);ctx.lineTo(-r*.72,r*.28);ctx.stroke();ctx.restore();}
        ctx.shadowBlur=0;ctx.beginPath();ctx.arc(0,0,r*.22,0,Math.PI*2);ctx.fill();
      }
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
      if(e.type==='sink'){if(game.combo>=5&&game.combo%5===0)soundscape.play('combo');const boss=C.isBossKind(e.kind);fx.burst(e.x,e.y,{size:boss?(e.kind==='overlord'?78:60):28,heavy:boss});fx.shatter(e.x,e.y,COLORS[e.kind]||COLORS.boss,boss?55:24);soundscape.play(boss?'heavy':'sink');if(boss&&!reduced.matches)shake=e.kind==='overlord'?.28:.2;}
      if(e.type==='damage'){fx.hit(e.x,e.y,'#ffad8f');if(!reduced.matches)shake=.14;soundscape.play('hit');}
      if(e.type==='blast'){if(game.mode==='booth'&&game.evolution.weapon===3)fx.jellyburst(e.x,e.y,Math.max(32,e.radius*.6));else if(game.mode==='booth'&&game.evolution.weapon===2)fx.bellburst(e.x,e.y,Math.max(28,e.radius*.55));else fx.burst(e.x,e.y,{size:e.radius,color:'#ffbd84',heavy:false});soundscape.play('blast');}
      if(e.type==='impact'){if(e.style==='snowflake')fx.snowburst(e.x,e.y,26);else if(e.style==='candycane')fx.candyburst(e.x,e.y,24);else if(e.style==='bell')fx.bellburst(e.x,e.y,30);else if(e.style==='jelly')fx.jellyburst(e.x,e.y,28);else fx.hit(e.x,e.y);soundscape.play('hit');}
      if(e.type==='coin')soundscape.play('coin');
      if(e.type==='fire'&&game.time-lastSound>.14){const tier=game.evolution.weapon;soundscape.play(tier===1?'laser':tier>=2?'burstShot':'fire');lastSound=game.time;}
      if(e.type==='block'){fx.hit(e.x,e.y,'#a9eee2');soundscape.play('crack');}
      if(e.type==='wave')banner('waveBanner',String(e.wave).padStart(2,'0'));
      if(e.type==='boss'){banner('bossBanner','',3);soundscape.play('boss');}
      if(e.type==='ultimate'){banner('ultimateBanner','',3.2);soundscape.play('boss');if(!reduced.matches)shake=.18;}
      if(e.type==='dividend'){floats.push({x:C.W/2,y:C.H-150,key:'dividend',extra:` +${e.amount}`,life:1.7});soundscape.play('coin');}
      if(e.type==='graze')floats.push({x:e.x,y:e.y-38,key:'graze',extra:'',life:.8});
      if(e.type==='over')end();
    }
    game.events.length=0;if(floats.length>10)floats.splice(0,floats.length-10);
  }
  function draw(time, dt) {
    ctx.setTransform(canvas.width/C.W,0,0,canvas.height/C.H,0,0);ctx.clearRect(0,0,C.W,C.H);
    if(journey)window.FuLamJourney.drawScene(ctx,C.W,C.H,'fleet',game.wave,time,reduced.matches);else drawOcean(reduced.matches?0:time);ctx.save();if(shake>0){ctx.translate((Math.random()-.5)*6,(Math.random()-.5)*6);shake=Math.max(0,shake-dt);}
    if(phase==='menu'){
      ship(70,180,.8,1.1,'inflation',time);ship(370,230,2.4,.85,'scam',time);ship(310,80,Math.PI/2,.9,'fee',time);ship(C.W/2,C.H-100,-Math.PI/2,1.2,'player',time);
    }else{
      for(const e of game.entities) if(e.type!=='torpedo')drawEntity(e,time);
      const h=game.hero.position;
      if(game.shield>0){ctx.strokeStyle='#9becd9aa';ctx.lineWidth=2;ctx.fillStyle='#78dfc31b';ctx.beginPath();ctx.arc(h.x,h.y,34+Math.sin(time*5)*2,0,Math.PI*2);ctx.fill();ctx.stroke();}
      if(phase!=='over'&&phase!=='sinking'){
        ctx.globalAlpha=game.invulnerable>0&&Math.floor(game.time*12)%2===0?.5:1;
        const jetLevel=journey?game.evolution.weapon||0:Math.max(0,(game.weapon||1)-1);ship(h.x,h.y,h.r,1.08+Math.min(.22,jetLevel*.04)+(game.ultimate?.08:0),'player',time,0,jetLevel);if(game.ultimate){ctx.save();ctx.strokeStyle='#ffd24a88';ctx.lineWidth=2;ctx.beginPath();ctx.arc(h.x,h.y,30+Math.sin(time*6)*2,0,Math.PI*2);ctx.stroke();ctx.restore();}ctx.globalAlpha=1;
        if(game.escort)for(const side of game.escort===1?[-1]:[-1,1])ship(Math.max(12,Math.min(C.W-12,h.x+side*32)),h.y+18,h.r,.43,'escort',time,0,jetLevel);
      }
      for(const e of game.entities) if(e.type==='torpedo'&&e.collision.group===C.FRIEND)drawEntity(e,time);
    }
    for(let i=particles.length-1;i>=0;i--){const p=particles[i];if(!paused){p.life-=dt;p.x+=p.vx*dt;p.y+=p.vy*dt;}if(p.life<=0){particles.splice(i,1);continue;}ctx.globalAlpha=Math.min(1,p.life/.3);ctx.fillStyle=p.color;ctx.fillRect(p.x,p.y,p.size,p.size);}ctx.globalAlpha=1;
    for(let i=ripples.length-1;i>=0;i--){const p=ripples[i];if(!paused){p.life-=dt;p.r+=70*dt;}if(p.life<=0){ripples.splice(i,1);continue;}ctx.strokeStyle=`rgba(224,220,180,${p.life*.7})`;ctx.lineWidth=1.5;ctx.beginPath();ctx.arc(p.x,p.y,p.r,0,Math.PI*2);ctx.stroke();}
    for(let i=floats.length-1;i>=0;i--){const p=floats[i];if(!paused){p.life-=dt;p.y-=22*dt;}if(p.life<=0){floats.splice(i,1);continue;}drawLabel(`${t(p.key)}${p.extra}`,p.x,p.y,'#ffe1a1',13);}
    fx.draw(ctx);
    // Threats and the centre hit marker stay above friendly explosions.
    if(phase!=='menu'){for(const e of game.entities)if(!e.dead&&e.type==='torpedo'&&e.collision.group===C.ENEMY)drawEntity(e,time);}
    if(phase==='play'){const h=game.hero.position;ctx.fillStyle='#f5ffff';ctx.strokeStyle='#123343';ctx.lineWidth=2;ctx.beginPath();ctx.arc(h.x,h.y,game.hero.collision.radius,0,Math.PI*2);ctx.fill();ctx.stroke();}
    ctx.restore();
  }
  function sizeCanvas(){const rect=canvas.getBoundingClientRect(),dpr=Math.min(2,window.devicePixelRatio||1);canvas.width=Math.round(rect.width*dpr);canvas.height=Math.round(rect.height*dpr);labelScale=C.W/Math.max(1,rect.width);}
  function frame(now){
    if(phase==='play')journey?.step(!paused);
    const dt=lastTime===null?0:Math.min(.2,(now-lastTime)/1000);lastTime=now;
    if(!paused){animation+=dt;fx.update(dt);}
    if(phase==='sinking'){deathTime-=dt;if(deathTime<=0)finishSinking();}
    if(phase==='play'&&!paused){
      if(journey?.run&&journey.run.scene==='booth'){
        const left=Math.max(0,window.FuLamJourney.LIMIT-journey.run.total);
        const on=journey.run.phase==='play'&&left>0&&left<=15;
        if(on!==game.ultimate){game.ultimate=on;document.body.classList.toggle('ultimate-mode',on);$('sea').classList.toggle('ultimate-mode',on);if(on){game.hero.hp=game.hero.maxHp;if(!ultimateAnnounced){ultimateAnnounced=true;banner('ultimateBanner','',3.2);soundscape.play('upgrade');updateHUD();}}}
      }else if(game.ultimate){game.ultimate=false;document.body.classList.remove('ultimate-mode');$('sea').classList.remove('ultimate-mode');}
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
    if(e.code==='KeyQ')shield();if(e.code==='KeyE'&&phase==='play'&&!paused&&!journey)openWorkshop();
    const kind={Digit1:'weapon',Digit2:'escort',Digit3:'reserve',Digit4:'repair'}[e.code];if(kind&&!journey)purchase(kind);
  });
  window.addEventListener('keyup',e=>{if(keyMap[e.code])pressed.delete(keyMap[e.code]);});
  const point=e=>{const r=canvas.getBoundingClientRect();return{x:(e.clientX-r.left)*C.W/r.width,y:(e.clientY-r.top)*C.H/r.height};};
  function follow(p){pointerTarget=p;}
  canvas.addEventListener('pointerdown',e=>{if(phase!=='play'||paused||(e.pointerType==='mouse'&&e.button!==0))return;e.preventDefault();canvasPointers.press(e);follow(point(canvasPointers.current));canvas.setPointerCapture(e.pointerId);unlockAudio();});
  canvas.addEventListener('pointermove',e=>{if(phase==='play'&&!paused&&canvasPointers.move(e))follow(point(e));});
  function release(e){
    if(!canvasPointers.release(e))return;
    if(canvasPointers.current)follow(point(canvasPointers.current));
    else if(e.type!=='pointerup')pointerTarget=null; // An ordinary tap remains a destination.
  }
  for(const type of ['pointerup','pointercancel','lostpointercapture'])canvas.addEventListener(type,release);
  for(const b of document.querySelectorAll('[data-dir]')){
    b.addEventListener('pointerdown',e=>{if(phase!=='play'||paused)return;e.preventDefault();b.setPointerCapture(e.pointerId);pointerTarget=null;directionPointers.set(e.pointerId,b.dataset.dir);});
    for(const event of ['pointerup','pointercancel','lostpointercapture'])b.addEventListener(event,e=>directionPointers.delete(e.pointerId));
  }
  $('start').addEventListener('click',prepareStart);$('restart').addEventListener('click',prepareStart);bindAction($('pause'),()=>setPaused(!paused));$('resume').addEventListener('click',()=>setPaused(false));
  bindAction($('shield'),shield);for(const kind of ['weapon','escort','reserve','repair'])bindAction($(kind),()=>purchase(kind));
  for(const id of ['standard','storm'])$(id).addEventListener('click',()=>chooseMode(id));
  bindAction($('lang'),()=>setLanguage(lang==='en'?'zh-Hant':'en'));
  window.addEventListener('storage',e=>{if(e.key==='fulam-language')setLanguage(e.newValue==='en'?'en':'zh-Hant');});
  bindAction($('sound'),toggleSound);bindAction($('battle-sound'),toggleSound);
  bindAction($('dock-toggle'),()=>shopOpen?closeWorkshop():openWorkshop());bindAction($('dock-close'),closeWorkshop);
  $('change-mode').addEventListener('click',returnMenu);
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
    const heading=document.createElement('div');heading.className='result-heading';
    const title=document.createElement('div');title.append($('end-label'),document.querySelector('[data-t="endTitle"]'));
    heading.append(title,document.querySelector('#end-menu .end-score'));$('end-menu').prepend(heading);
    document.querySelector('#end-menu .end-actions').prepend($('restart'));
    const exit=document.createElement('button');exit.id='exit-game';exit.className='journey-exit';$('pause').parentNode.append(exit);bindAction(exit,()=>{if(phase==='play'){journey.run.finish('exit');game.running=false;paused=false;shopOpen=false;$('combat-layout').classList.remove('workshop-open');phase='over';clearInput();showOverlay('end-menu');renderEnd();}else returnMenu();});
    const settings=document.createElement('div');settings.id='journey-settings';$('menu').insertBefore(settings,$('start'));$('menu').querySelector('.modes').hidden=true;
    const swap=document.createElement('span');swap.id='swap-weapon';swap.className='journey-swap';$('shield').parentNode.insertBefore(swap,$('shield'));document.body.classList.add('journey-no-hangar','combat-score-mode');
    const setup=()=>{journey.settings(settings,d=>chooseMode(d==='intermediate'?'booth':d==='challenge'?'storm':'standard'));swap.textContent=journey.text('普通子彈','Bullets');$('menu')?.classList.add('festive-card');document.querySelector('[data-t="menuTag"]').textContent=journey.text('富臨 · 聖誕戰機','FULAM · FESTIVE WINGS');document.querySelector('[data-t="menuTitle"]').textContent=journey.text('90 秒，飛出聖誕高分。','90 seconds. Festive high score.');document.querySelector('[data-t="menuHint"]').textContent=journey.text('拖曳閃避，自動連射。答對投資題才升級彈道；第 3 回合自動加入僚機。','Drag to dodge; firing is automatic. Answer investing questions to upgrade spread; a wingman joins in round 3.');$('low-health').textContent=journey.text('護甲偏低 · 閃避或開盾','LOW ARMOUR · DODGE OR SHIELD');canvas.setAttribute('aria-label',journey.text('拖曳、WASD 或方向鍵移動；自動射擊。Q 開盾，P 暫停。','Drag, WASD or arrows to move; automatic fire. Q shields; P pauses.'));exit.textContent=journey.text('退出','Exit');$('change-mode').textContent=journey.text('返回選單','Back to menu');$('change-mode').classList.add('journey-exit');};setup();
    const originalLanguage=setLanguage;setLanguage=function(next){originalLanguage(next);setup();};
    journey.onIntermission=()=>{if(journey.run){game.evolution={...game.evolution,weapon:journey.run.weapon};game.weaponKind=Math.min(11,journey.run.weapon);game.power=window.FuLamJourney.weaponProfile('fleet',{...game.evolution,weapon:journey.run.weapon}).damage/16*(1+game.paidPower);}paused=true;clearInput();soundscape.play('upgrade');};
    journey.onChoice=(kind,r)=>{
      C.applyRoundUpgrade(game,r,kind);game.weaponKind=Math.min(11,r.weapon);
      game.power=window.FuLamJourney.weaponProfile('fleet',r).damage/16*(1+game.paidPower);
      game.wave=r.wave;game.waveKills=0;game.bossSpawned=false;game.spawnTime=.5;
      game.entities=game.entities.filter(e=>e.type==='coin');game.raised=[];game.invulnerable=1.5;paused=false;accumulator=0;banner('waveBanner',r.wave);updateHUD();
    };
    journey.onEnd=()=>{soundscape.play('end');game.running=false;paused=false;phase='over';clearInput();showOverlay('end-menu');renderEnd();};
    window.FuLamFleet={getState:()=>({phase,paused,ultimate:!!game.ultimate,hero:{x:game.hero.position.x,y:game.hero.position.y,r:game.hero.collision.radius},threats:game.entities.filter(e=>!e.dead&&((e.type==='torpedo'&&e.collision.group===C.ENEMY)||e.type==='ship')).map(e=>({x:e.position.x,y:e.position.y,vx:e.type==='ship'?0:e.velocity.dx*e.velocity.speed,vy:e.type==='ship'?e.velocity.speed:e.velocity.dy*e.velocity.speed,r:e.collision.radius,type:e.type,elite:!!e.elite,hp:e.hp,kind:e.kind,homing:e.homing||0,style:e.style||''})),seekers:game.entities.filter(e=>!e.dead&&e.type==='torpedo'&&e.collision.group===C.ENEMY&&e.homing).map(e=>({x:e.position.x,y:e.position.y,dx:e.velocity.dx,dy:e.velocity.dy,homing:e.homing||0,style:e.style||'',lock:e.strategy?.type||'',past:e.position.y>game.hero.position.y-8})),score:game.score,hp:game.hero.hp,maxHp:game.hero.maxHp,mode:game.mode,wave:game.wave,kills:game.kills,evolution:{...game.evolution},weaponKind:game.weaponKind,weapon:game.weapon,power:game.power,shield:game.shield,shots:game.shots,run:journey.run?{scene:journey.run.scene,difficulty:journey.run.difficulty,phase:journey.run.phase,active:journey.run.active,total:journey.run.total,wave:journey.run.wave,weapon:journey.run.weapon,rate:journey.run.rate,trajectory:journey.run.trajectory,life:journey.run.life,protection:journey.run.protection,choiceTime:journey.run.choiceTime,reason:journey.run.reason}:null})};
  }
  if(journey)document.body.classList.add('fleet-menu');setLanguage(lang);sizeCanvas();requestAnimationFrame(frame);
})();
