/* FuLam arcade progression v4. Original code; scores are local, not verified online records. */
(function(root){
 'use strict';
 const VERSION='booth-v4', LIMIT=180, ROUND=30, CHOICE=8;
 const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
 const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 function random(seed){return()=>{let t=seed+=0x6D2B79F5;t=Math.imul(t^t>>>15,t|1);t^=t+Math.imul(t^t>>>7,t|61);return((t^t>>>14)>>>0)/4294967296;};}
 class Run {
  constructor(game,scene='web',difficulty='standard',seed=Date.now()){
   this.game=game;this.scene=scene==='booth'?'booth':'web';this.difficulty=this.scene==='booth'?'intermediate':difficulty==='challenge'?'challenge':'standard';
   this.seed=this.scene==='booth'?20261104:seed;this.random=random(this.seed);this.active=0;this.total=0;this.wave=1;this.roundTime=0;this.choiceTime=0;this.phase='play';this.choices=[];this.reason='';this.power=0;this.support=0;this.swaps=0;this.weapon=0;this.reserveWeapon=1;this.swapCooldown=0;
  }
  tick(dt,playing=true){
   if(this.phase==='over'||!Number.isFinite(dt)||dt<=0)return null;
   this.total+=dt;
   if(this.scene==='booth'&&this.total>=LIMIT){this.total=LIMIT;this.finish('time');return 'over';}
   if(this.phase==='choice'){this.choiceTime=Math.max(0,this.choiceTime-dt);return this.choiceTime===0?'auto':null;}
   if(!playing)return null;
   const step=Math.min(dt,.1);this.active+=step;this.roundTime+=step;this.swapCooldown=Math.max(0,this.swapCooldown-step);
   if(this.game!=='knife'&&this.roundTime>=ROUND){this.roundTime=ROUND;this.completeRound();return 'choice';}
   return null;
  }
  completeRound(){if(this.phase!=='play')return false;this.phase='choice';this.choiceTime=CHOICE;return true;}
  choose(kind){
   if(this.phase!=='choice'||!['power','weapon','support'].includes(kind))return false;
   this.choices.push(kind);if(this.choices.length>100)this.choices.shift();if(kind==='power')this.power++;if(kind==='support')this.support++;if(kind==='weapon'){this.reserveWeapon=this.weapon;this.weapon=(this.weapon+1)%(this.game==='knife'?3:4);this.swaps++;}
   this.wave++;this.roundTime=0;this.choiceTime=0;this.phase='play';return true;
  }
  swap(){if(this.phase!=='play'||this.swapCooldown>0)return false;[this.weapon,this.reserveWeapon]=[this.reserveWeapon,this.weapon];this.swapCooldown=3;this.swaps++;return true;}
  finish(reason='defeat'){if(this.phase==='over')return false;this.phase='over';this.reason=reason;return true;}
  key(topic='',language=''){return [VERSION,this.game,this.scene,this.difficulty,topic,language].join(':');}
  record(score,extra={}){return{score:Math.max(0,Math.floor(Number(score)||0)),wave:this.wave,seconds:Math.round(this.active),reason:this.reason,...extra};}
 }
 function readBoard(storage,key){try{const a=JSON.parse(storage.getItem(key)||'[]');return Array.isArray(a)?a.filter(r=>r&&Number.isSafeInteger(r.score)&&r.score>=0&&Number.isInteger(r.wave)&&r.wave>0&&Number.isFinite(r.seconds)&&r.seconds>=0).slice(0,10):[];}catch{return[];}}
 function saveBoard(storage,key,record){const a=readBoard(storage,key);a.push(record);a.sort((x,y)=>y.score-x.score||y.wave-x.wave);const rank=a.indexOf(record)+1;try{storage.setItem(key,JSON.stringify(a.slice(0,10)));return{rank,board:a.slice(0,10),saved:true};}catch{return{rank,board:a.slice(0,10),saved:false};}}
 const WEAPONS={fishing:[['散射炮','Spread'],['穿透光束','Beam'],['連鎖電炮','Chain lightning'],['重型能量炮','Plasma']],fleet:[['速射機炮','Autocannon'],['扇形散射','Spread'],['聚焦雷射','Laser'],['追蹤導彈','Missiles']],knife:[['精準短刀','Precision'],['連斬長刀','Combo blade'],['蓄能刀','Focus blade']]};
 class UI {
  constructor(game,language){this.game=game;this.language=language;this.scene=new URLSearchParams(location.search).get('mode')==='booth'?'booth':'web';this.difficulty=this.scene==='booth'?'intermediate':'standard';this.run=null;this.overlay=null;this.saved=false;this.onChoice=()=>{};this.onEnd=()=>{};this.onSwap=()=>{};this.onIntermission=()=>{};}
  en(){return this.language()==='en';}
  text(zh,en){return this.en()?en:zh;}
  sliceHearts(){return this.scene==='booth'?4:this.difficulty==='challenge'?3:5;}
  name(id){return WEAPONS[this.game][id][this.en()?1:0];}
  best(){try{const r=this.run||new Run(this.game,this.scene,this.difficulty);return readBoard(localStorage,r.key(this.topic||'',this.recordLanguage||''))[0]?.score||0;}catch{return 0;}}
  settings(host,change=()=>{}){
   if(!host)return;
   const hints=this.game==='knife'?[this.text('5 顆心 · 循序闖關','5 hearts · Steady pace'),this.text('3 顆心 · 更快拋袋','3 hearts · Faster bags')]:this.game==='fleet'?[this.text('100 護甲 · 循序加壓','100 armour · Steady pace'),this.text('75 護甲 · 高速彈幕','75 armour · Faster threats')]:[this.text('較慢魚群 · 輕鬆上手','Slower fish · Get started'),this.text('更快更強 · 能源壓力','Stronger fish · Energy pressure')];
   host.innerHTML=`<div class="journey-settings"><p class="journey-setting-label">${this.text('自由遊玩 · 選擇難度','FREE PLAY · CHOOSE DIFFICULTY')}</p><div class="journey-options" role="group" aria-label="${this.text('頁遊難度','Free play difficulty')}"><button type="button" data-difficulty="standard"><b>${this.text('標準','Standard')}</b><small>${hints[0]}</small></button><button type="button" data-difficulty="challenge"><b>${this.text('挑戰','Challenge')}</b><small>${hints[1]}</small></button></div><button type="button" class="journey-booth" data-scene="booth"><span><b>Booth ${this.text('現場挑戰','Challenge')}</b><small>${this.text('中等難度 · 獨立本機榜','Intermediate · Separate local board')}</small></span><strong>180s</strong></button><p class="journey-rule" aria-live="polite"></p></div>`;
   const update=()=>{host.querySelectorAll('[data-difficulty]').forEach(b=>b.setAttribute('aria-pressed',String(this.scene==='web'&&b.dataset.difficulty===this.difficulty)));host.querySelector('[data-scene]').setAttribute('aria-pressed',String(this.scene==='booth'));host.querySelector('.journey-rule').textContent=this.scene==='booth'?this.text('已選 Booth · 180 秒包含暫停及強化','Booth selected · 180s includes pauses & upgrades'):this.game==='knife'?this.text('每關 20 個選項 · 完成後三選一強化','20 choices per stage · Pick an upgrade between stages'):this.text('無盡回合 · 每 30 秒三選一強化','Endless rounds · Pick an upgrade every 30s');change(this.difficulty,this.scene);};
   host.querySelector('[data-scene]').onclick=()=>{this.scene='booth';this.difficulty='intermediate';update();};
   host.querySelectorAll('[data-difficulty]').forEach(b=>b.onclick=()=>{this.scene='web';this.difficulty=b.dataset.difficulty;update();});update();
  }
  guide(host,onStart,onBack,question=''){
   this.close();const o=document.createElement('div');o.className='journey-overlay journey-guide';o.setAttribute('role','dialog');o.setAttribute('aria-modal','true');o.setAttribute('aria-label',this.text('開始前指引','Before you play'));this.overlay=o;
   const rows=this.game==='fishing'?[
    ['↗',this.text('長按瞄準，持續射擊','Hold and aim to keep firing'),this.text('手指／滑鼠拖曳 · ← → 瞄準，Space 射擊','Drag with finger / mouse · ← → aim, Space fires')],
    ['U',this.text('隨時換炮，保留強化','Switch weapons, keep upgrades'),this.text('按「換炮」或 U · 每回合三選一強化','Tap Switch or U · Choose an upgrade each round')],
    ['1–6',this.text('六種道具，逐回合解鎖','Six skills, unlocked by rounds'),this.text('Q 網、W 冰、E 連射、R 雙倍、T 炸彈、Y 誘餌；亦可 1–6。另一手可同時按技能。','Q net, W freeze, E rapid, R double, T bomb, Y lure; or 1–6. Use a second finger for skills.')],
    ['⚡',this.text('捕魚補能源；零能源結算','Catches refill energy; zero ends the run'),this.text('已解鎖道具可用畫面按鈕；冷卻秒數就在旁邊。','Tap an unlocked skill on screen; its cooldown is shown.')]
   ]:this.game==='fleet'?[
    ['↗',this.text('拖曳移動，自動向前射擊','Drag to move; fire automatically'),this.text('手指／滑鼠拖曳 · WASD 或方向鍵移動','Drag with finger / mouse · WASD or arrow keys')],
    ['E',this.text('換武器，應付不同敵機','Switch weapons for different threats'),this.text('機炮、散射、雷射、導彈；按畫面按鈕或 E','Autocannon, spread, laser, missiles · Tap Switch or E')],
    ['Q',this.text('開盾保命，留意儲備金','Shield up; keep a cash reserve'),this.text('按護盾或 Q；可一指移動、另一指開盾','Tap Shield or Q · Move and shield with two fingers')],
    ['1–4',this.text('機庫升級：火力／僚機／儲備／維修','Hangar: power / wingmen / reserve / repair'),this.text('按「機庫」安心選購，或用 1–4 快捷鍵。P 暫停。','Open Hangar to pause and shop, or use 1–4. P pauses.')]
   ]:[
    ['01',this.text('先看題目，再切正確錢袋','Read first, then slice correct bags'),this.text('每關 20 個選項，分批出現；讓錯誤選項落下。','20 choices per stage, shown in small groups. Let wrong choices fall.')],
    ['↗',this.text('手指／滑鼠劃過錢袋','Swipe with your finger or mouse'),this.text('鍵盤可用 Tab 選袋，再按 Enter 或 Space。','Keyboard: Tab to a bag, then Enter or Space.')],
    ['E / Q',this.text('換刀／慢時：就在畫面下方','Switch / Focus: buttons below the arena'),this.text('E 換刀；蓄能刀充滿後按 Q 慢時。P 暫停。','E switches blades; Q slows time when Focus is charged. P pauses.')],
    ['♥',this.text('錯切扣 1 心；漏切也有代價','Wrong cuts cost a heart; misses add up'),this.text(`${this.scene==='booth'?'Booth 中等':this.difficulty==='challenge'?'挑戰':'標準'} ${this.sliceHearts()} 心；每漏切 ${this.sliceHearts()} 個正確選項扣 1 心。`,`${this.scene==='booth'?'Booth intermediate':this.difficulty==='challenge'?'Challenge':'Standard'}: ${this.sliceHearts()} hearts; ${this.sliceHearts()} missed correct bags cost a heart.`)]
   ];
   o.innerHTML=`<div class="journey-card"><span class="journey-kicker">${this.text('開始前 · 操作指引','BEFORE YOU PLAY')}</span><h2>${this.text('準備好，再開始。','Ready when you are.')}</h2>${question?`<p class="journey-guide-question">${esc(question)}</p>`:''}<div class="journey-guide-grid">${rows.map(([key,title,copy])=>`<div><kbd>${esc(key)}</kbd><p><b>${esc(title)}</b><small>${esc(copy)}</small></p></div>`).join('')}</div><p class="journey-guide-rule">${this.scene==='booth'?this.text('Booth 中等難度 · 按開始後才計時，最多 180 秒。','Booth intermediate · The 180s clock starts only when you press Start.'):this.text('自由遊玩 · 沒有總時限，挑戰最高分。','Free play · No overall time limit. Chase your best score.')}</p><div class="journey-guide-actions"><button class="journey-exit" data-guide-back>${this.text('返回選單','Back')}</button><button class="journey-begin" data-guide-start>${this.text('知道了，開始！','Got it — start!')}</button></div></div>`;
   host.append(o);o.querySelector('[data-guide-start]').onclick=()=>{this.close();onStart();};o.querySelector('[data-guide-back]').onclick=()=>{this.close();onBack();};
   o.addEventListener('keydown',e=>{if(e.key==='Escape'){e.preventDefault();o.querySelector('[data-guide-back]').click();}if(e.key==='Tab'){const b=[...o.querySelectorAll('button')];if(e.shiftKey&&document.activeElement===b[0]){e.preventDefault();b.at(-1).focus();}else if(!e.shiftKey&&document.activeElement===b.at(-1)){e.preventDefault();b[0].focus();}}});o.querySelector('[data-guide-start]').focus({preventScroll:true});
  }
  completeRound(){if(this.run?.completeRound()){this.onIntermission();this.showChoices();}}
  start(host,topic=''){
   this.close();this.run=new Run(this.game,this.scene,this.difficulty);this.topic=topic;this.recordLanguage=this.game==='knife'?this.language():'';this.saved=false;this.last=performance.now();this.host=host;
   this.status=host.querySelector('.journey-status')||document.createElement('div');this.status.className='journey-status';this.status.setAttribute('role','status');if(!this.status.parentNode)host.prepend(this.status);
   this.status.hidden=false;this.update();return this.run;
  }
  step(playing){
   if(!this.run||this.run.phase==='over')return;const now=performance.now(),dt=Math.max(0,(now-this.last)/1000);this.last=now;
   const event=this.run.tick(dt,playing);if(event==='over'){this.close();this.onEnd('time');return;}
   if(event==='choice'){this.onIntermission();this.showChoices();}if(event==='auto')this.pick('power');
   const counter=this.overlay?.querySelector('.journey-count');if(counter)counter.textContent=this.text('自動強化：','Auto upgrade: ')+Math.ceil(this.run.choiceTime)+'s';this.update();
  }
  showChoices(){
   this.close();const r=this.run,next=(r.weapon+1)%WEAPONS[this.game].length;const o=document.createElement('div');o.className='journey-overlay';o.setAttribute('role','dialog');o.setAttribute('aria-modal','true');o.setAttribute('aria-label',this.text('選擇強化','Choose an upgrade'));this.overlay=o;
   const support=this.game==='knife'?this.text('回復 1 顆心 · 上限不變','Recover 1 heart · capped'):this.game==='fishing'?this.text('能源 +25 · 延長續航','Energy +25 · stay in the game'):this.text('修復 25 · 增強僚機','Repair 25 · improve wingmen');
   const note=this.game==='knife'?this.text('下一回合先看清題目，再切選項。','Read the next question before slicing.'):this.text('火力、裝備與緩衝：每次選擇都有機會成本。','Firepower, equipment or a buffer: every choice has an opportunity cost.');
   o.innerHTML=`<div class="journey-card"><span class="journey-kicker">ROUND ${r.wave} → ${r.wave+1}</span><h2>${this.text('下一回合，點樣配？','Build your next round.')}</h2><p>${esc(note)}</p><div class="journey-upgrades"><button data-upgrade="power"><b>↑ ${this.text('強化現有武器','Strengthen weapon')}</b><small>${this.game==='knife'?this.text('基礎正確得分 +15% · 本局保留','Base correct score +15% · This run'):this.game==='fishing'?this.text('基礎火力 +22% · 本局保留','Base firepower +22% · This run'):this.text('基礎火力 +18% · 本局保留','Base firepower +18% · This run')}</small></button><button data-upgrade="weapon"><b>⇄ ${esc(this.name(next))}</b><small>${this.text('換打法 · 共通強化保留','Change play style · retain upgrades')}</small></button><button data-upgrade="support"><b>＋ ${this.text('應急緩衝','Safety buffer')}</b><small>${esc(support)}</small></button></div><p class="journey-count"></p><p class="journey-next"></p></div>`;
   if(this.nextHint)o.querySelector('.journey-next').textContent=this.nextHint();
   this.host.append(o);o.querySelectorAll('[data-upgrade]').forEach(b=>b.onclick=()=>this.pick(b.dataset.upgrade));o.addEventListener('keydown',e=>{if(e.key==='Tab'){const b=[...o.querySelectorAll('button')],first=b[0],last=b.at(-1);if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus();}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus();}}});o.querySelector('button').focus({preventScroll:true});
  }
  pick(kind){if(!this.run?.choose(kind))return;this.close();this.onChoice(kind,this.run);this.host.querySelector('canvas')?.focus({preventScroll:true});this.update();}
  close(){this.overlay?.remove();this.overlay=null;}
  swap(){if(!this.run?.swap())return;this.onSwap(this.run.weapon);this.update();}
  update(){if(!this.status||!this.run)return;const r=this.run;this.status.textContent=`${r.scene==='booth'?this.text('BOOTH 中等','BOOTH INTERMEDIATE'):this.text(r.difficulty==='challenge'?'挑戰':'標準',r.difficulty==='challenge'?'CHALLENGE':'STANDARD')} · ${this.text('回合','ROUND')} ${r.wave} · ${r.scene==='booth'?Math.ceil(Math.max(0,LIMIT-r.total))+'s':Math.floor(r.active)+'s'} · ${this.name(r.weapon)}`;}
  result(score,extra={},reason='defeat'){
   if(!this.run)return '';this.run.finish(reason);this.close();if(this.status)this.status.hidden=true;
   if(!this.saved){let storage;try{storage=localStorage;}catch{}this.resultData=saveBoard(storage,this.run.key(this.topic,this.recordLanguage),this.run.record(score,extra));this.saved=true;}
   const r=this.run,data=this.resultData;
   let lesson=this.game==='knife'?this.text('先讀清楚條件，再判斷；速度與遊戲分數不等於理財能力。','Read the conditions before deciding. Speed and game scores do not measure financial ability.'):r.power>r.support?this.text('你較多選擇火力：產出更高，但留給回復的選擇較少。下局試試預留緩衝。','You chose firepower more often than recovery. Try keeping a buffer next run.'):r.support>0?this.text('你有保留應急緩衝；同時留意，防守選擇也會佔用提升火力的機會。','You kept a safety buffer. Defensive choices also use opportunities to improve firepower.'):r.swaps>0?this.text('你試過切換裝備。不同配置適合不同目標，沒有一種選擇在所有情況都最好。','You tried switching equipment. Different setups suit different targets; no choice is best in every situation.'):this.text('火力、裝備與回復都需要取捨；下一局試試為意外留一點緩衝。','Firepower, equipment and recovery involve trade-offs. Try keeping a buffer for surprises next run.');
   return `<section class="journey-result"><b>${r.reason==='time'?this.text('Booth 挑戰完成','Booth challenge complete'):this.text('本局紀錄','Run record')} · ${this.text('本機排名','Local rank')} #${data.rank}</b><p>${esc(lesson)}</p><small>${this.text('遊戲資源並非投資回報。','Game resources are not investment returns.')}</small><details><summary>${this.text('查看此模式本機前十名','Top 10 on this device')}</summary><ol>${data.board.map(x=>`<li>${x.score.toLocaleString('en')} · R${x.wave} · ${x.seconds}s</li>`).join('')}</ol></details>${!data.saved?'<p>'+this.text('此瀏覽器未能保存紀錄。','This browser could not save the result.')+'</p>':''}${r.scene==='booth'?`<div class="journey-qr"><img src="../arcade/${this.game}-qr.svg" width="128" height="128" alt="${this.text('自由遊玩 QR code','Free play QR code')}"><a href="?mode=web">${this.text('用自己手機掃碼，繼續自由遊玩','Scan to play on your own phone')}</a></div>`:''}<small>${this.text('本機紀錄，未經核實；不同模式及版本分榜。','Local, unverified records. Modes and versions have separate boards.')}</small></section>`;
  }
 }
 root.FuLamJourney={Run,UI,random,readBoard,saveBoard,VERSION,LIMIT,ROUND,CHOICE};
})(typeof window==='undefined'?globalThis:window);
