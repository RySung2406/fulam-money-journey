/* FuLam arcade progression v7. Original code; scores are local, not verified online records. */
(function(root){
 'use strict';
 const VERSION='booth-v9', LIMIT=120, ROUND=30, BOOTH_ROUND=30, CHOICE=12, KNIFE_STAGES=3, KNIFE_OPTIONS=25;
 const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
 const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 function random(seed){return()=>{let t=seed+=0x6D2B79F5;t=Math.imul(t^t>>>15,t|1);t^=t+Math.imul(t^t>>>7,t|61);return((t^t>>>14)>>>0)/4294967296;};}
 class Run {
  constructor(game,scene='web',difficulty='standard',seed=Date.now()){
   this.game=game;this.scene=scene==='booth'?'booth':'web';this.difficulty=this.scene==='booth'?'intermediate':difficulty==='challenge'?'challenge':'standard';
   this.seed=this.scene==='booth'?20261104:seed;this.random=random(this.seed);this.active=0;this.total=0;this.wave=1;this.roundTime=0;this.choiceTime=0;this.phase='play';this.choices=[];this.reason='';this.weapon=0;this.rate=0;this.trajectory=0;this.focus=0;this.guard=0;this.life=0;this.protection=0;
  }
  tick(dt,playing=true){
   if(this.phase==='over'||!Number.isFinite(dt)||dt<=0)return null;
   this.total+=dt;
   const knifeBooth=this.scene==='booth'&&this.game==='knife';
   if(this.scene==='booth'&&!knifeBooth&&this.total>=LIMIT){this.total=LIMIT;this.finish('time');return 'over';}
   if(this.phase==='choice'){this.choiceTime=Math.max(0,this.choiceTime-dt);return this.choiceTime===0?'auto':null;}
   if(!playing)return null;
   const step=Math.min(dt,.1);this.active+=step;this.roundTime+=step;
   if(this.game!=='knife'&&this.roundTime>=this.roundLimit()){this.roundTime=this.roundLimit();this.completeRound();return 'choice';}
   return null;
  }
  roundLimit(){return this.scene==='booth'?BOOTH_ROUND:ROUND;}
  completeRound(){if(this.phase!=='play')return false;this.phase='choice';this.choiceTime=CHOICE;this.grantedFrom=this.weapon;this.weapon++;return true;}
  choose(kind){
   const allowed=this.game==='knife'?['focus','guard','life']:['trajectory','rate'];
   if(this.phase!=='choice'||!allowed.includes(kind))return false;
   this.choices.push(kind);if(this.choices.length>100)this.choices.shift();this[kind]++;
   this.wave++;this.roundTime=0;this.choiceTime=0;this.phase='play';return true;
  }
  finish(reason='defeat'){if(this.phase==='over')return false;this.phase='over';this.reason=reason;return true;}
  key(topic='',language=''){return [VERSION,this.game,this.scene,this.difficulty,topic,language].join(':');}
  record(score,extra={}){return{score:Math.max(0,Math.floor(Number(score)||0)),wave:this.wave,seconds:Math.round(this.active),reason:this.reason,...extra};}
 }
 function readBoard(storage,key){try{const a=JSON.parse(storage.getItem(key)||'[]');return Array.isArray(a)?a.filter(r=>r&&Number.isSafeInteger(r.score)&&r.score>=0&&Number.isInteger(r.wave)&&r.wave>0&&Number.isFinite(r.seconds)&&r.seconds>=0).slice(0,10):[];}catch{return[];}}
 function saveBoard(storage,key,record){const a=readBoard(storage,key);a.push(record);a.sort((x,y)=>y.score-x.score||y.wave-x.wave);const rank=a.indexOf(record)+1;try{storage.setItem(key,JSON.stringify(a.slice(0,10)));return{rank,board:a.slice(0,10),saved:true};}catch{return{rank,board:a.slice(0,10),saved:false};}}
 const WEAPONS={
  fishing:[['單管水炮','Water cannon'],['雙管水炮','Twin cannon'],['穿甲水炮','Piercer'],['重型穿甲炮','Heavy piercer'],['電漿炮','Plasma'],['爆裂電漿炮','Burst plasma'],['光束炮','Beam cannon'],['聚焦光束炮','Focus beam'],['追蹤魚雷','Homing torpedo'],['集束魚雷','Cluster torpedo'],['電弧主炮','Arc cannon'],['極光主炮','Aurora cannon']],
  fleet:[['偵察機炮','Scout gun'],['雙聯機炮','Twin gun'],['穿甲機炮','Piercer'],['重型穿甲炮','Heavy piercer'],['電漿機炮','Plasma gun'],['爆裂電漿炮','Burst plasma'],['雷射機炮','Laser gun'],['聚焦雷射','Focus laser'],['追蹤導彈','Homing missiles'],['集束導彈','Cluster missiles'],['電弧機炮','Arc gun'],['極光陣列','Aurora array']],
  knife:[['練習刀','Practice'],['青銅刀','Bronze'],['精鋼刀','Steel'],['長鋒刀','Long edge'],['星紋刀','Star edge'],['銀月刀','Silver moon'],['流光刀','Radiant'],['極光刀','Aurora'],['星核刀','Star core'],['光棱刀','Prismatic'],['天穹刀','Sky edge'],['曙光刀','Daybreak']]
 };
 const SCENES=[
  {color:'#8fe2c7',sky:'#103e50',names:{fishing:['起步港','Harbour'],fleet:['初航灣','Bay'],knife:['理財工坊','Workshop']},lesson:['先理解工具的用途，再決定怎樣運用有限資源。','Understand a tool before allocating limited resources.']},
  {color:'#9fd4ff',sky:'#182e64',names:{fishing:['珊瑚群島','Reef'],fleet:['群島航線','Islands'],knife:['投資花園','Garden']},lesson:['分散能減少對單一目標的依賴，也可能分薄集中火力。','Diversification reduces dependence on one target; it also spreads your firepower.']},
  {color:'#c3b0ff',sky:'#25203f',names:{fishing:['風暴海峽','Storm'],fleet:['雷雨航線','Storm'],knife:['保障燈塔','Lighthouse']},lesson:['遇到突發狀況，預留的緩衝能給你更多應對空間。','A reserve gives you room to respond to unexpected events.']},
  {color:'#eab77f',sky:'#382b3e',names:{fishing:['深海遺跡','Ruins'],fleet:['都市上空','City'],knife:['借貸城橋','Bridge']},lesson:['每次升級都有機會成本；選擇一項，就要等待其他強化。','Every upgrade has an opportunity cost: choosing one delays the others.']},
  {color:'#ffdbb6',sky:'#383454',names:{fishing:['晨曦遠海','Dawn'],fleet:['曙光雲海','Dawn'],knife:['查證星台','Observatory']},lesson:['一刀先查證再判斷；戰鬥先觀察威脅再配置火力。','Verify before deciding; observe threats before allocating firepower.']}
 ];
 function sceneInfo(game,wave=1){const index=(Math.max(1,wave)-1)%SCENES.length,s=SCENES[index];return {...s,index,name:s.names[game]||s.names.fleet};}
 function threatProfile(wave=1){const n=Math.max(0,wave-1);return {health:1+.22*n+.035*n*n,speed:1+Math.min(.6,n*.045),density:1+Math.min(1.4,n*.09),bullet:1+Math.min(.6,n*.035),elite:n>=2};}
 function weaponProfile(game,run={}){
  const weapon=Math.max(0,run.weapon||0),rate=Math.max(0,run.rate||0),trajectory=Math.max(0,run.trajectory||0),stage=Math.min(11,weapon);
  const count=Math.min(7,1+(weapon>=1?1:0)+trajectory),spread=Array.from({length:count},(_,i)=>(i-(count-1)/2)*(count===2?.045:.115));
  const damage=(game==='fishing'?1.8:16)*(1+.35*weapon+.04*weapon*weapon)*(1+Math.max(0,trajectory-5)*.08+Math.max(0,rate-18)*.06);
  return {stage,tier:weapon+1,kind:stage>=10?'arc':stage>=8?'missile':stage>=6?'beam':stage>=4?'orb':'bullet',damage,interval:(game==='fishing'?.22:.20)/(1+.18*Math.min(18,rate)),count,spread,pierce:Math.min(12,Math.floor(weapon/2)+Math.floor(trajectory/3)),blast:weapon>=4?Math.min(85,28+weapon*3):0,homing:weapon>=8?2.1:0,chain:weapon>=10?Math.min(5,2+Math.floor((weapon-10)/2)):0,speed:stage>=6?820:stage>=4?560:720,color:['#ffe39b','#ffe39b','#91e8ec','#91e8ec','#c8a5ff','#c8a5ff','#8df4ff','#8df4ff','#ffa77e','#ffa77e','#d1bcff','#e8e4ff'][stage]};
 }
 function survivalProfile(game,run={},base=100){
  const life=Math.max(0,run.life||0),protection=Math.max(0,run.protection||0);
  return {max:base+life*(game==='knife'?1:20),multiplier:1/(1+.15*protection),shieldBonus:Math.min(2,.4*protection)};
 }
 const sceneImages=new Map();
 function drawScene(ctx,w,h,game,wave,time=0,reduced=false){
  const s=sceneInfo(game,wave),key=game+'-'+s.index;let img=sceneImages.get(key);
  if(!img&&typeof Image!=='undefined'){img=new Image();img.src='../arcade/scenes/'+key+'.svg';sceneImages.set(key,img);}
  ctx.save();ctx.fillStyle=s.sky;ctx.fillRect(0,0,w,h);
  if(img?.complete&&img.naturalWidth)ctx.drawImage(img,0,0,w,h);
  const t=reduced?0:time;ctx.fillStyle=s.color+'12';
  for(let i=0;i<9;i++){const x=(i*131+37)%w,y=(i*173+t*(game==='fleet'?16:-5)+h*10)%(h+80)-40;ctx.beginPath();ctx.ellipse(x,y,game==='fleet'?70:2,game==='fleet'?18:2,.1,0,Math.PI*2);ctx.fill();}
  ctx.restore();
 }

 class UI {
  constructor(game,language){this.game=game;this.language=language;this.scene=game==='knife'||new URLSearchParams(location.search).get('mode')==='booth'?'booth':'web';this.difficulty=this.scene==='booth'?'intermediate':'standard';this.run=null;this.overlay=null;this.saved=false;this.onChoice=()=>{};this.onEnd=()=>{};this.onIntermission=()=>{};}
  en(){return this.language()==='en';}
  text(zh,en){return this.en()?en:zh;}
  sliceHearts(){return this.scene==='booth'?5:this.difficulty==='challenge'?3:6;}
  sliceMaxHearts(){return this.sliceHearts()+(this.run?.life||0);}
  survival(run=this.run){return survivalProfile(this.game,run||{},this.game==='knife'?this.sliceHearts():this.game==='fleet'?(this.scene==='booth'?88:this.difficulty==='challenge'?75:100):100);}
  name(id){const tier=Math.max(0,id||0);return WEAPONS[this.game][Math.min(11,tier)][this.en()?1:0]+(tier>11?' +'+(tier-11):'');}
  stageScene(wave=this.run?.wave||1){return sceneInfo(this.game,wave);}
  applyScene(){if(!this.host||!this.run)return;const s=this.stageScene();this.host.dataset.scene=String(s.index);this.host.style.setProperty('--stage-color',s.color);this.host.style.setProperty('--stage-bg',`url('../arcade/scenes/${this.game}-${s.index}.svg')`);}
  best(){try{const r=this.run||new Run(this.game,this.scene,this.difficulty);return readBoard(localStorage,r.key(this.topic||'',this.recordLanguage||''))[0]?.score||0;}catch{return 0;}}
  settings(host,change=()=>{}){
   if(!host)return;
   const hints=this.game==='knife'?[this.text('6 顆心 · 穩陣過關','6 hearts · Room to finish'),this.text('3 顆心 · 更快拋袋','3 hearts · Faster bags')]:this.game==='fleet'?[this.text('100 護甲 · 循序加壓','100 armour · Steady pace'),this.text('75 護甲 · 高速彈幕','75 armour · Faster threats')]:[this.text('較慢魚群 · 輕鬆上手','Slower fish · Get started'),this.text('更快更強 · 能源壓力','Stronger fish · Energy pressure')];
   if(this.game==='knife'){this.scene='booth';this.difficulty='intermediate';host.innerHTML=`<div class="journey-settings"><p class="journey-setting-label">${this.text('Booth · 三關','BOOTH · 3 STAGES')}</p><p class="journey-rule" aria-live="polite">${this.text('每關 25 個選項，出過不再重複。三關結束，不限兩分鐘。','25 choices per stage, shown once. Three stages, with no two-minute limit.')}</p></div>`;change('intermediate','booth');return;}
   host.innerHTML=`<div class="journey-settings"><p class="journey-setting-label">${this.text('自由遊玩 · 選擇難度','FREE PLAY · CHOOSE DIFFICULTY')}</p><div class="journey-options" role="group" aria-label="${this.text('頁遊難度','Free play difficulty')}"><button type="button" data-difficulty="standard"><b>${this.text('標準','Standard')}</b><small>${hints[0]}</small></button><button type="button" data-difficulty="challenge"><b>${this.text('挑戰','Challenge')}</b><small>${hints[1]}</small></button></div><button type="button" class="journey-booth" data-scene="booth"><span><b>Booth ${this.text('現場挑戰','Challenge')}</b><small>${this.text('中等難度 · 獨立本機榜','Intermediate · Separate local board')}</small></span><strong>120s</strong></button><p class="journey-rule" aria-live="polite"></p></div>`;
   const update=()=>{host.querySelectorAll('[data-difficulty]').forEach(b=>b.setAttribute('aria-pressed',String(this.scene==='web'&&b.dataset.difficulty===this.difficulty)));host.querySelector('[data-scene]').setAttribute('aria-pressed',String(this.scene==='booth'));host.querySelector('.journey-rule').textContent=this.scene==='booth'?this.text('已選 Booth · 120 秒 · 每階段 30 秒 · 武器自動升級','Booth selected · 120 seconds · 30 seconds a stage · Weapon upgrades automatically'):this.game==='fleet'?this.text('每階段飛機自動升級 · 再揀彈道或速度','Each stage upgrades the jet, then choose spread or speed'):this.text('每階段武器自動升級 · 再揀彈道或速度','Each stage upgrades the weapon, then choose spread or speed');change(this.difficulty,this.scene);};
   host.querySelector('[data-scene]').onclick=()=>{this.scene='booth';this.difficulty='intermediate';update();};
   host.querySelectorAll('[data-difficulty]').forEach(b=>b.onclick=()=>{this.scene='web';this.difficulty=b.dataset.difficulty;update();});update();
  }
  guide(host,onStart,onBack,question='',context=''){
   this.close();const o=document.createElement('div');o.className='journey-overlay journey-guide';o.setAttribute('role','dialog');o.setAttribute('aria-modal','true');o.setAttribute('aria-label',this.text('開始前指引','Before you play'));this.overlay=o;
   const showQuestion=this.game==='knife'&&question;
   const rows=this.game==='fishing'?[
    ['↗',this.text('長按瞄準，持續射擊','Hold and aim to keep firing'),this.text('手指／滑鼠拖曳 · ← → 瞄準，Space 射擊','Drag with finger / mouse · ← → aim, Space fires')],
    ['↑',this.text('武器自動升級','Weapon upgrades automatically'),this.text('每階段炮台升一階，再揀彈道或速度。','Each stage levels the cannon, then choose spread or speed.')],
    ['1–6',this.text('六種道具，逐回合解鎖','Six skills, unlocked by rounds'),this.text('Q 網、W 冰、E 連射、R 雙倍、T 炸彈、Y 誘餌；亦可 1–6。另一手可同時按技能。','Q net, W freeze, E rapid, R double, T bomb, Y lure; or 1–6. Use a second finger for skills.')],
    ['⚡',this.text('捕魚補能源；零能源結算','Catches refill energy; zero ends the run'),this.text('已解鎖道具可用畫面按鈕；冷卻秒數就在旁邊。','Tap an unlocked skill on screen; its cooldown is shown.')]
   ]:this.game==='fleet'?[
    ['↗',this.text('拖曳移動，自動向前射擊','Drag to move; fire automatically'),this.text('手指／滑鼠拖曳 · WASD 或方向鍵移動','Drag with finger / mouse · WASD or arrow keys')],
    ['↑',this.text('飛機自動升級','The jet upgrades automatically'),this.text('每階段飛機升一階，再揀彈道或速度。','Each stage upgrades the jet, then choose spread or speed.')],
    ['Q',this.text('開盾保命，留意儲備金','Shield up; keep a cash reserve'),this.text('按護盾或 Q；可一指移動、另一指開盾','Tap Shield or Q · Move and shield with two fingers')],
    ['1–2',this.text('再揀彈道或速度','Then choose spread or speed'),this.text('唔使入機庫。飛機已經自動升級，畫面只俾你揀彈道或速度。P 暫停。','No hangar. The jet is already upgraded; the screen only asks for spread or speed. P pauses.')]
   ]:[
    ['01',this.text('先看題目，再切正確錢袋','Read first, then slice correct bags'),this.text('每關 25 個選項，出過不再重複。','25 choices per stage. Each one appears only once.')],
    ['↗',this.text('手指／滑鼠劃過錢袋','Swipe with your finger or mouse'),this.text('鍵盤可用 Tab 選袋，再按 Enter 或 Space。','Keyboard: Tab to a bag, then Enter or Space.')],
    ['↑ / Q',this.text('刀刃自動升級','Blade upgrades automatically'),this.text('每關刀刃先升級，再揀全屏緩慢、護心或加心。切對充能，滿格按 Q 全屏緩慢。','Each stage upgrades the blade, then choose full-screen slow, guard or hearts. Correct cuts charge full-screen slow with Q.')],
    ['♥',this.text('錯切扣 1 心；漏切也有代價','Wrong cuts cost a heart; misses add up'),this.text(`${this.scene==='booth'?'Booth 中等':this.difficulty==='challenge'?'挑戰':'標準'} ${this.sliceHearts()} 心；每漏切 ${this.sliceHearts()} 個正確選項扣 1 心。`,`${this.scene==='booth'?'Booth intermediate':this.difficulty==='challenge'?'Challenge':'Standard'}: ${this.sliceHearts()} hearts; ${this.sliceHearts()} missed correct bags cost a heart.`)]
   ];
   const kicker=showQuestion?this.text(this.run?'下一關開始前':'開始前 · 先看題目',this.run?'BEFORE THIS STAGE':'READ THE QUESTION FIRST'):this.text('開始前 · 操作指引','BEFORE YOU PLAY');
   const heading=showQuestion?question:this.text('準備好，再開始。','Ready when you are.');
   const startLabel=showQuestion&&this.run?this.text('看完題目，開始','Start this stage'):this.text('知道了，開始！','Got it — start!');
   o.innerHTML=`<div class="journey-card"><span class="journey-kicker">${kicker}</span><h2${showQuestion?' class="journey-guide-topic"':''}>${esc(heading)}</h2>${showQuestion&&context?`<p class="journey-guide-context">${esc(context)}</p>`:''}${showQuestion?`<p class="journey-guide-lead">${this.text('切中符合題目的錢袋，讓錯誤選項落下。','Slice the bags that fit the question. Let the wrong ones fall.')}</p>`:(question?`<p class="journey-guide-question">${esc(question)}</p>`:'')}<div class="journey-guide-grid">${rows.map(([key,title,copy])=>`<div><kbd>${esc(key)}</kbd><p><b>${esc(title)}</b><small>${esc(copy)}</small></p></div>`).join('')}</div><p class="journey-guide-rule">${this.scene==='booth'?(this.game==='knife'?this.text('Booth 三關。每關 25 個選項，出過不再重複。','Booth is three stages. 25 choices each, with no repeats.'):this.text('Booth 兩分鐘，每階段 30 秒。武器自動升級，再揀彈道或速度。','Booth is two minutes, 30 seconds a stage. The weapon upgrades automatically, then choose spread or speed.')):this.text('自由遊玩 · 沒有總時限，挑戰最高分。','Free play · No overall time limit. Chase your best score.')}</p><div class="journey-guide-actions"><button class="journey-exit" data-guide-back>${this.text('返回選單','Back')}</button><button class="journey-begin" data-guide-start>${startLabel}</button></div></div>`;
   host.append(o);o.querySelector('[data-guide-start]').onclick=()=>{this.close();onStart();};o.querySelector('[data-guide-back]').onclick=()=>{this.close();onBack();};
   o.addEventListener('keydown',e=>{if(e.key==='Escape'){e.preventDefault();o.querySelector('[data-guide-back]').click();}if(e.key==='Tab'){const b=[...o.querySelectorAll('button')];if(e.shiftKey&&document.activeElement===b[0]){e.preventDefault();b.at(-1).focus();}else if(!e.shiftKey&&document.activeElement===b.at(-1)){e.preventDefault();b[0].focus();}}});o.querySelector('[data-guide-start]').focus({preventScroll:true});
  }
  completeRound(){if(this.run?.completeRound()){this.onIntermission();this.showChoices();}}
  start(host,topic=''){
   this.close();this.run=new Run(this.game,this.scene,this.difficulty);this.topic=topic;this.recordLanguage=this.game==='knife'?this.language():'';this.saved=false;this.last=performance.now();this.host=host;
   this.status=host.querySelector('.journey-status')||document.createElement('div');this.status.className='journey-status';this.status.setAttribute('role','status');if(!this.status.parentNode)host.prepend(this.status);
   this.status.hidden=false;this.applyScene();this.update();return this.run;
  }
  step(playing){
   if(!this.run||this.run.phase==='over')return;const now=performance.now(),dt=Math.max(0,(now-this.last)/1000);this.last=now;
   const event=this.run.tick(dt,playing);if(event==='over'){this.close();this.onEnd('time');return;}
   if(event==='choice'){this.onIntermission();this.showChoices();}if(event==='auto')this.pick(this.overlay?.querySelector('[data-upgrade]')?.dataset.upgrade||(this.run.game==='knife'?'focus':'trajectory'));
   const counter=this.overlay?.querySelector('.journey-count');if(counter)counter.textContent=this.text('未揀就自動選：','Auto pick: ')+Math.ceil(this.run.choiceTime)+'s';this.update();
  }
  showChoices(){
   this.close();const r=this.run,s=this.stageScene(r.wave+1),before=weaponProfile(this.game,r);
   const stats=(kind)=>weaponProfile(this.game,{...r,[kind]:r[kind]+1});
   const health=this.game==='knife'?this.survival(r):null,nextHealth=this.game==='knife'?this.survival({...r,life:r.life+1}):null;
   const cards=this.game==='knife'?[
    ['focus','全屏緩慢延長','Longer full-screen slow',`${this.text('全屏緩慢','Full-screen slow')} ${(2.5+.6*r.focus).toFixed(1)} → ${(3.1+.6*r.focus).toFixed(1)}s · ${this.text('充能更快','Faster charge')}`],
    ['guard','護心防錯','Mistake guard',this.text('護心 +1、回復 1 心；擋一次錯切扣心，仍扣分。','+1 guard and recover 1 heart. Block a wrong-cut heart loss, not its score penalty.')],
    ['life','生命強化','More hearts',`${this.text('心數上限','Heart limit')} ${health.max} → ${nextHealth.max} · ${this.text('回復 2 心','Recover 2 hearts')}`]
   ]:[
    ['trajectory','彈道','Spread',`${this.text('同時彈道','Projectiles')} ${before.count} → ${stats('trajectory').count} · ${r.trajectory>=5?this.text('穿透／傷害繼續成長','Pierce / damage keep growing'):this.text('加闊火網，覆蓋更多目標','Wider fire covers more targets')}`],
    ['rate','速度','Speed',`${this.text('每秒射擊','Bursts/s')} ${(1/before.interval).toFixed(1)} → ${(1/stats('rate').interval).toFixed(1)}${r.rate>=18?this.text(' · 傷害再提升',' · More damage'):''}`]
   ];
   const fromName=this.name(r.grantedFrom??Math.max(0,r.weapon-1)),toName=this.name(r.weapon);
   const grant=this.game==='knife'?this.text(`刀刃已升級：${fromName} → ${toName}`,`Blade upgraded: ${fromName} → ${toName}`):this.game==='fleet'?this.text(`飛機已升級：${fromName} → ${toName}`,`Jet upgraded: ${fromName} → ${toName}`):this.text(`武器已升級：${fromName} → ${toName}`,`Weapon upgraded: ${fromName} → ${toName}`);
   const o=document.createElement('div');o.className='journey-overlay';o.setAttribute('role','dialog');o.setAttribute('aria-modal','true');o.setAttribute('aria-label',this.text('選擇進化','Choose an evolution'));this.overlay=o;
   o.innerHTML=`<div class="journey-card journey-choice-card"><span class="journey-kicker">ROUND ${r.wave} → ${r.wave+1}</span><h2>${this.game==='knife'?this.text('刀刃已升級，再揀一項。','Blade upgraded. Choose one more.'):this.game==='fleet'?this.text('飛機已升級，再揀彈道或速度。','Jet upgraded. Choose spread or speed.'):this.text('武器已升級，再揀彈道或速度。','Weapon upgraded. Choose spread or speed.')}</h2><p class="journey-granted">${esc(grant)}</p><p class="journey-scene-note"><b>${esc(s.name[this.en()?1:0])}</b> · ${esc(s.lesson[this.en()?1:0])}</p><div class="journey-upgrades" data-count="${cards.length}">${cards.map(([kind,zh,en,copy],i)=>`<button data-upgrade="${kind}"><b>${i+1} · ${this.text(zh,en)}</b><small>${esc(copy)}</small></button>`).join('')}</div><p class="journey-count"></p><p class="journey-next">${this.game==='knife'?esc(this.nextHint?.()||''):this.text('下一回合：敵人血量、速度及密度上升；第 3 回合起有精英與 Boss；每回合補給 12 點。','Next round: tougher, faster, denser enemies. Elites and bosses from round 3; recover 12 each round.')}</p></div>`;
   this.host.classList.add('journey-choosing');this.host.append(o);o.querySelectorAll('[data-upgrade]').forEach(b=>b.onclick=()=>this.pick(b.dataset.upgrade));
   o.addEventListener('keydown',e=>{const b=[...o.querySelectorAll('button')];if(/^[1-5]$/.test(e.key)&&b[Number(e.key)-1]){e.preventDefault();e.stopPropagation();b[Number(e.key)-1].click();}if(e.key==='Tab'){if(e.shiftKey&&document.activeElement===b[0]){e.preventDefault();b.at(-1).focus();}else if(!e.shiftKey&&document.activeElement===b.at(-1)){e.preventDefault();b[0].focus();}}});o.querySelector('[data-upgrade]')?.focus({preventScroll:true});
  }
  pick(kind){if(!this.run?.choose(kind))return;this.close();this.applyScene();this.onChoice(kind,this.run);this.host.querySelector('canvas')?.focus({preventScroll:true});this.update();}
  close(){this.overlay?.remove();this.overlay=null;this.host?.classList.remove('journey-choosing');}
  update(){if(!this.status||!this.run)return;const r=this.run;const clock=this.game==='knife'&&r.scene==='booth'?this.text(`第 ${r.wave}/${KNIFE_STAGES} 關`,`Stage ${r.wave}/${KNIFE_STAGES}`):r.scene==='booth'?Math.ceil(Math.max(0,LIMIT-r.total))+'s':Math.floor(r.active)+'s';this.status.textContent=`${r.scene==='booth'?'Booth':this.text(r.difficulty==='challenge'?'挑戰':'標準',r.difficulty==='challenge'?'Hard':'Standard')} · R${r.wave} ${this.stageScene().name[this.en()?1:0]} · ${clock}`;}
  result(score,extra={},reason='defeat'){
   if(!this.run)return '';this.run.finish(reason);this.close();if(this.status)this.status.hidden=true;
   if(!this.saved){let storage;try{storage=localStorage;}catch{}this.resultData=saveBoard(storage,this.run.key(this.topic,this.recordLanguage),this.run.record(score,extra));this.saved=true;}
   const r=this.run,data=this.resultData;
   const lesson=this.game==='knife'?this.text('切對才加分；護心擋扣心，不會把錯誤答案變成正確。遊戲分數不等於理財能力。','Only correct cuts score. Guard protects a heart, not an incorrect answer. Game score is not financial ability.'):this.text('火力與生存都需要資源。強化一項就要延後另一項；先觀察威脅，再決定進攻或保護。','Attack and survival compete for limited upgrades. Observe threats before deciding where to invest resources.');
   return `<section class="journey-result"><b>${r.reason==='time'?this.text('Booth 挑戰完成','Booth challenge complete'):this.text('本局紀錄','Run record')} · ${this.text('本機排名','Local rank')} #${data.rank}</b><p>${esc(lesson)}</p><small>${this.text('遊戲資源並非投資回報。','Game resources are not investment returns.')}</small><details><summary>${this.text('查看此模式本機前十名','Top 10 on this device')}</summary><ol>${data.board.map(x=>`<li>${x.score.toLocaleString('en')} · R${x.wave} · ${x.seconds}s</li>`).join('')}</ol></details>${!data.saved?'<p>'+this.text('此瀏覽器未能保存紀錄。','This browser could not save the result.')+'</p>':''}${r.scene==='booth'?`<div class="journey-qr"><img src="../arcade/${this.game}-qr.svg" width="128" height="128" alt="${this.text('自由遊玩 QR code','Free play QR code')}"><a href="?mode=web">${this.text('用自己手機掃碼，繼續自由遊玩','Scan to play on your own phone')}</a></div>`:''}<small>${this.text('本機紀錄，未經核實；不同模式及版本分榜。','Local, unverified records. Modes and versions have separate boards.')}</small></section>`;
  }
 }
 root.FuLamJourney={Run,UI,random,readBoard,saveBoard,VERSION,LIMIT,ROUND,BOOTH_ROUND,CHOICE,KNIFE_STAGES,KNIFE_OPTIONS,weaponProfile,survivalProfile,threatProfile,sceneInfo,drawScene};
})(typeof window==='undefined'?globalThis:window);
