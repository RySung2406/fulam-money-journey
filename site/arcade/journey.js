/* FuLam arcade progression v7. Original code; scores are local, not verified online records. */
(function(root){
 'use strict';
 const VERSION='booth-v9', ROUND=30, BOOTH_ROUND=30, CHOICE=12, KNIFE_STAGES=3, KNIFE_OPTIONS=25, BOOTH_STAGES=4, BOOTH_STAGE_TIME=[20,20,20], LIMIT=120;
 const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
 const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 function random(seed){return()=>{let t=seed+=0x6D2B79F5;t=Math.imul(t^t>>>15,t|1);t^=t+Math.imul(t^t>>>7,t|61);return((t^t>>>14)>>>0)/4294967296;};}
 class Run {
  constructor(game,scene='web',difficulty='standard',seed=Date.now()){
   this.game=game;this.scene=scene==='booth'?'booth':'web';this.difficulty=this.scene==='booth'?'intermediate':difficulty==='challenge'?'challenge':'standard';
   this.seed=this.scene==='booth'?20261104:seed;this.random=random(this.seed);this.active=0;this.total=0;this.wave=1;this.roundTime=0;this.choiceTime=0;this.phase='play';this.choices=[];this.reason='';this.weapon=0;this.rate=0;this.trajectory=0;this.escort=0;this.focus=0;this.guard=0;this.life=0;this.protection=0;
  }
  tick(dt,playing=true){
   if(this.phase==='over'||!Number.isFinite(dt)||dt<=0)return null;
   this.total+=dt;
   if(this.scene==='booth'&&this.total>=LIMIT){this.total=LIMIT;this.finish('time');return 'over';}
   if(this.phase==='choice'){this.choiceTime=Math.max(0,this.choiceTime-dt);return this.choiceTime===0?'auto':null;}
   if(!playing)return null;
   const step=Math.min(dt,.1);this.active+=step;this.roundTime+=step;
   if(this.game!=='knife'&&this.roundTime>=this.roundLimit()){this.roundTime=this.roundLimit();if(this.scene==='booth'&&this.wave>=BOOTH_STAGES){this.finish('stages');return 'over';}this.completeRound();return 'choice';}
   return null;
  }
  roundLimit(){if(this.scene==='booth'&&this.game!=='knife'){const scheduled=BOOTH_STAGE_TIME[this.wave-1];if(Number.isFinite(scheduled))return scheduled;return Math.max(0,LIMIT-(this.total-this.roundTime));}return this.scene==='booth'?BOOTH_ROUND:ROUND;}
  completeRound(){if(this.phase!=='play')return false;this.phase='choice';this.choiceTime=CHOICE;this.grantedFrom=this.weapon;this.weapon++;return true;}
  choose(kind){
   const allowed=this.game==='knife'?['focus','life']:this.game==='fleet'?['escort','trajectory','rate']:['trajectory','rate'];
   if(this.phase!=='choice'||!allowed.includes(kind))return false;
   this.choices.push(kind);if(this.choices.length>100)this.choices.shift();this[kind]++;
   this.wave++;this.roundTime=0;this.choiceTime=0;this.phase='play';return true;
  }
  finish(reason='defeat'){if(this.phase==='over')return false;this.phase='over';this.reason=reason;return true;}
  key(topic='',language=''){return [this.game==='knife'?VERSION+'-slow2':VERSION+'-combat3',this.game,this.scene,this.difficulty,topic,language].join(':');}
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
  constructor(game,language){this.game=game;this.language=language;this.scene='booth';this.difficulty='intermediate';this.run=null;this.overlay=null;this.saved=false;this.onChoice=()=>{};this.onEnd=()=>{};this.onIntermission=()=>{};}
  en(){return this.language()==='en';}
  text(zh,en){return this.en()?en:zh;}
  sliceHearts(){return this.scene==='booth'?5:this.difficulty==='challenge'?3:6;}
  sliceMaxHearts(){return this.sliceHearts()+(this.run?.life||0);}
  survival(run=this.run){return survivalProfile(this.game,run||{},this.game==='knife'?this.sliceHearts():this.game==='fleet'?(this.scene==='booth'?88:this.difficulty==='challenge'?75:100):100);}
  name(id){const tier=Math.max(0,id||0);if(this.scene==='booth'&&this.game!=='knife'){const names=this.game==='fishing'?[['普通子彈','Bullets'],['雙聯激光','Twin laser'],['穿透巨彈','Piercing shot'],['爆裂彈','Blast shot']]:[['普通子彈','Bullets'],['雙聯激光','Twin laser'],['炸彈','Bombs'],['小飛機炸彈','Plane bombs']];return names[Math.min(3,tier)][this.en()?1:0];}return WEAPONS[this.game][Math.min(11,tier)][this.en()?1:0]+(tier>11?' +'+(tier-11):'');}
  stageScene(wave=this.run?.wave||1){return sceneInfo(this.game,wave);}
  applyScene(){if(!this.host||!this.run)return;const s=this.stageScene();this.host.dataset.scene=String(s.index);this.host.style.setProperty('--stage-color',s.color);this.host.style.setProperty('--stage-bg',`url('../arcade/scenes/${this.game}-${s.index}.svg')`);}
  best(){try{const r=this.run||new Run(this.game,this.scene,this.difficulty);return readBoard(localStorage,r.key(this.topic||'',this.recordLanguage||''))[0]?.score||0;}catch{return 0;}}
  settings(host,change=()=>{}){
   if(!host)return;
   this.scene='booth';this.difficulty='intermediate';
   const rule=this.game==='knife'?this.text('三關，全程 2 分鐘。每關 25 個選項，出過不再重複。','Three stages inside 2 minutes. 25 choices each, shown once.'):this.text('四回合 · 兩分鐘 · 本機排名','4 rounds · 2 minutes · Local high scores');
   host.innerHTML=`<div class="journey-settings">${this.game==='knife'?`<p class="journey-setting-label">${this.text('Booth · 三關','BOOTH · 3 STAGES')}</p>`:''}<p class="journey-rule" aria-live="polite">${rule}</p></div>`;
   change('intermediate','booth');
  }
  guide(host,onStart,onBack,question='',context=''){
   this.close();const o=document.createElement('div');o.className='journey-overlay journey-guide';o.setAttribute('role','dialog');o.setAttribute('aria-modal','true');o.setAttribute('aria-label',this.text('開始前指引','Before you play'));this.overlay=o;
   const showQuestion=this.game==='knife'&&question;
   const rows=this.game==='fishing'?[
    ['↗',this.text('長按瞄準，連射捕魚','Hold, aim and catch'),this.text('拖曳瞄準；鍵盤 ← → 瞄準、Space 射擊。捕魚補能源。','Drag to aim, or ← → and Space. Catches refill energy.')],
    ['Q–R',this.text('每回合解鎖一道具','One new skill each round'),this.text('Q/1 冰凍、W/2 連射、E/3 炸彈、R/4 誘餌；也可按畫面按鈕。','Q/1 freeze, W/2 rapid, E/3 bomb, R/4 lure. Or tap the buttons.')],
    ['★',this.text('連捕與 Boss 拉開分數','Combos and bosses score more'),this.text('武器自動升級，再揀彈道或速度。第 3 回合 Boss 破甲，第 4 回合爆裂彈。','Weapons upgrade automatically; choose spread or speed. Boss armour breaks in R3; blasts arrive in R4.')]
   ]:this.game==='fleet'?[
    ['↗',this.text('拖曳閃避，自動連射','Drag to dodge; auto fire'),this.text('也可用 WASD／方向鍵。機心白點是受傷範圍；敵機先亮線再開火。','Or use WASD / arrows. The white centre is your hit area; lines warn before shots.')],
    ['Q',this.text('留金幣，危急時開盾','Save coins for a shield'),this.text('Q 或護盾按鈕。每回合補 20 護甲；前兩回合受傷較輕。','Press Q or tap Shield. Recover 20 armour each round; early hits are gentler.')],
    ['★',this.text('連擊、擦彈、Boss 加分','Combos, grazes and bosses score'),this.text('飛機自動升級，再揀僚機、彈道或速度。受傷會中斷連擊。','Your jet upgrades automatically; choose wingman, spread or speed. Getting hit breaks the combo.')]
   ]:[
    ['01',this.text('先看題目，再切正確錢袋','Read first, then slice correct bags'),this.text('每關 25 個選項，出過不再重複。','25 choices per stage. Each one appears only once.')],
    ['↗',this.text('手指／滑鼠劃過錢袋','Swipe with your finger or mouse'),this.text('鍵盤可用 Tab 選袋，再按 Enter 或 Space。','Keyboard: Tab to a bag, then Enter or Space.')],
    ['↑ / Q',this.text('刀刃自動升級','Blade upgrades automatically'),this.text('每關刀刃先升級，再揀減速或加1心。切對充能，滿格按 Q 全屏緩慢。','Each stage upgrades the blade, then choose slow-down or +1 heart. Correct cuts charge full-screen slow with Q.')],
    ['♥',this.text('錯切扣 1 心；漏切也有代價','Wrong cuts cost a heart; misses add up'),this.text(`${this.scene==='booth'?'Booth 中等':this.difficulty==='challenge'?'挑戰':'標準'} ${this.sliceHearts()} 心；每漏切 ${this.sliceHearts()} 個正確選項扣 1 心。`,`${this.scene==='booth'?'Booth intermediate':this.difficulty==='challenge'?'Challenge':'Standard'}: ${this.sliceHearts()} hearts; ${this.sliceHearts()} missed correct bags cost a heart.`)]
   ];
   const kicker=showQuestion?this.text(this.run?'下一關開始前':'開始前 · 先看題目',this.run?'BEFORE THIS STAGE':'READ THE QUESTION FIRST'):this.text('開始前 · 操作指引','BEFORE YOU PLAY');
   const heading=showQuestion?(this.en()?'Question: ':'題目: ')+question:this.text('準備好，再開始。','Ready when you are.');
   const startLabel=showQuestion&&this.run?this.text('看完題目，開始','Start this stage'):this.text('知道了，開始！','Got it — start!');
   o.innerHTML=`<div class="journey-card"><span class="journey-kicker">${kicker}</span><h2${showQuestion?' class="journey-guide-topic"':''}>${esc(heading)}</h2>${showQuestion&&context?`<p class="journey-guide-context">${esc(context)}</p>`:''}${showQuestion?`<p class="journey-guide-lead">${this.text('切中符合題目的錢袋，讓錯誤選項落下。','Slice the bags that fit the question. Let the wrong ones fall.')}</p>`:(question?`<p class="journey-guide-question">${esc(question)}</p>`:'')}<div class="journey-guide-grid">${rows.map(([key,title,copy])=>`<div><kbd>${esc(key)}</kbd><p><b>${esc(title)}</b><small>${esc(copy)}</small></p></div>`).join('')}</div><p class="journey-guide-rule">${this.game!=='knife'?this.text('四回合，最多兩分鐘。挑戰得分；P 暫停。','Four rounds, up to two minutes. Chase a score; P pauses.'):this.scene==='booth'?this.text('Booth 三關，全程 2 分鐘。每關 25 個選項，出過不再重複。','Booth is three stages inside 2 minutes. 25 choices each, with no repeats.'):this.text('自由遊玩 · 沒有總時限，挑戰最高分。','Free play · No overall time limit. Chase your best score.')}</p><div class="journey-guide-actions"><button class="journey-exit" data-guide-back>${this.text('返回選單','Back')}</button><button class="journey-begin" data-guide-start>${startLabel}</button></div></div>`;
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
   const spreadCard=['trajectory','彈道','Spread',`${this.text('彈道','Projectiles')} ${r.trajectory} → ${r.trajectory+1} · ${this.text('數量會留在每一種武器','The extra shots stay on every weapon')}`];
   const speedCard=['rate','速度','Speed',`${this.text('每秒射擊','Bursts/s')} ${(1/before.interval).toFixed(1)} → ${(1/stats('rate').interval).toFixed(1)}${r.rate>=18?this.text(' · 傷害再提升',' · More damage'):''}`];
   const cards=this.game==='knife'?[
    ['focus','減速','Slow down',`${this.text('全屏緩慢','Full-screen slow')} ${(2.5+.6*r.focus).toFixed(1)} → ${(3.1+.6*r.focus).toFixed(1)}s · ${this.text('充能更快','Faster charge')}`],
    ['life','加1心','+1 heart',`${this.text('心數上限','Heart limit')} ${health.max} → ${nextHealth.max} · ${this.text('回復 1 心','Recover 1 heart')}`]
   ]:this.game==='fleet'?[
    ['escort','僚機','Wingman',`${this.text('僚機','Wingmen')} ${r.escort} → ${r.escort+1}`],
    spreadCard,speedCard
   ]:[spreadCard,speedCard];
   const fromName=this.name(r.grantedFrom??Math.max(0,r.weapon-1)),toName=this.name(r.weapon);
   const grant=this.game==='knife'?this.text(`刀刃已升級：${fromName} → ${toName}`,`Blade upgraded: ${fromName} → ${toName}`):this.game==='fleet'?this.text(`飛機已升級：${fromName} → ${toName}`,`Jet upgraded: ${fromName} → ${toName}`):this.text(`武器已升級：${fromName} → ${toName}`,`Weapon upgraded: ${fromName} → ${toName}`);
   const o=document.createElement('div');o.className='journey-overlay';o.setAttribute('role','dialog');o.setAttribute('aria-modal','true');o.setAttribute('aria-label',this.text('選擇進化','Choose an evolution'));this.overlay=o;
   o.innerHTML=`<div class="journey-card journey-choice-card"><span class="journey-kicker">ROUND ${r.wave} → ${r.wave+1}</span><h2>${this.game==='knife'?this.text('刀刃已升級，再揀減速或加1心。','Blade upgraded. Choose slow-down or +1 heart.'):this.game==='fleet'?this.text('飛機已升級，再揀僚機、彈道或速度。','Jet upgraded. Choose a wingman, spread or speed.'):this.text('武器已升級，再揀彈道或速度。','Weapon upgraded. Choose spread or speed.')}</h2><p class="journey-granted">${esc(grant)}</p><p class="journey-scene-note"><b>${esc(s.name[this.en()?1:0])}</b> · ${esc(s.lesson[this.en()?1:0])}</p><div class="journey-upgrades" data-count="${cards.length}">${cards.map(([kind,zh,en,copy],i)=>`<button data-upgrade="${kind}"><b>${i+1} · ${this.text(zh,en)}</b><small>${esc(copy)}</small></button>`).join('')}</div><p class="journey-count"></p><p class="journey-next">${this.game==='knife'?esc(this.nextHint?.()||''):this.game==='fishing'?this.text('每回合補給 12 能源；第 3 回合 Boss 破甲，第 4 回合爆裂彈。','Recover 12 energy each round. Boss armour breaks in R3; blast shots arrive in R4.'):this.text('下一回合：敵人血量、速度及密度上升；第 3 回合起有精英與 Boss；每回合補給 20 護甲。','Next round: tougher, faster, denser enemies. Elites and bosses from round 3; recover 20 armour each round.')}</p></div>`;
   this.host.classList.add('journey-choosing');this.host.append(o);o.querySelectorAll('[data-upgrade]').forEach(b=>b.onclick=()=>this.pick(b.dataset.upgrade));
   o.addEventListener('keydown',e=>{const b=[...o.querySelectorAll('button')];if(/^[1-5]$/.test(e.key)&&b[Number(e.key)-1]){e.preventDefault();e.stopPropagation();b[Number(e.key)-1].click();}if(e.key==='Tab'){if(e.shiftKey&&document.activeElement===b[0]){e.preventDefault();b.at(-1).focus();}else if(!e.shiftKey&&document.activeElement===b.at(-1)){e.preventDefault();b[0].focus();}}});o.querySelector('[data-upgrade]')?.focus({preventScroll:true});
  }
  pick(kind){if(!this.run?.choose(kind))return;this.close();this.applyScene();this.onChoice(kind,this.run);this.host.querySelector('canvas')?.focus({preventScroll:true});this.update();}
  close(){this.overlay?.remove();this.overlay=null;this.host?.classList.remove('journey-choosing');}
  update(){
   if(!this.status||!this.run)return;
   const r=this.run,wallLeft=Math.ceil(Math.max(0,LIMIT-r.total)),stageLeft=Math.ceil(Math.max(0,r.roundLimit()-r.roundTime));
   if(this.game!=='knife'&&r.scene==='booth'){
    const left=r.wave>=BOOTH_STAGES?wallLeft:stageLeft;
    this.status.textContent=this.text(`第 ${r.wave} / 4 回合 · ${r.phase==='choice'?'選擇升級':left+' 秒'}`,`Round ${r.wave} / 4 · ${r.phase==='choice'?'Choose an upgrade':left+'s'}`);
    return;
   }
   const clock=this.game==='knife'&&r.scene==='booth'?this.text(`第 ${Math.min(r.wave,KNIFE_STAGES)}/${KNIFE_STAGES} 關 · ${wallLeft}s`,`Stage ${Math.min(r.wave,KNIFE_STAGES)}/${KNIFE_STAGES} · ${wallLeft}s`):Math.floor(r.active)+'s';
   this.status.textContent=`${r.scene==='booth'?'Booth':this.text(r.difficulty==='challenge'?'挑戰':'標準',r.difficulty==='challenge'?'Hard':'Standard')} · R${r.wave} ${this.stageScene().name[this.en()?1:0]} · ${clock}`;
  }
  combatResult(data){
   const lesson=this.game==='fishing'?this.text('分散彈道照顧魚群，集中火力對付大魚；理財也要按目標分配資源。留一道具應急，就像預留一筆儲備。遊戲得分不代表投資回報。','Spread covers a school; focused shots tackle big fish—allocate resources to your goals. Keeping a skill ready is like keeping a reserve. Game scores are not investment returns.'):this.text('護盾和護甲就像應急儲備，讓你有餘地面對突發風險。追分也要閃避火力，理財同樣要兼顧回報與風險。遊戲得分不代表投資回報。','Shields and armour act like reserves for unexpected risks. Chasing points still calls for dodging—balance potential rewards with risk. Game scores are not investment returns.');
   return `<section class="journey-result journey-scoreboard"><div class="scoreboard-main"><div class="result-rank"><span>${this.text('本機排名','LOCAL RANK')}</span><strong>${data.rank>10?'10+':'#'+data.rank}</strong><small>${this.text('同一裝置 · 同一版本','Same device · same version')}</small></div><div class="result-board"><b>${this.text('本機前五名','TOP 5 ON THIS DEVICE')}</b><ol class="score-list">${data.board.slice(0,5).map((r,i)=>`<li${i+1===data.rank?' class="this-run" aria-current="true"':''}><span>${i+1}</span><strong>${r.score.toLocaleString('en')}</strong><small>${i+1===data.rank?this.text('本局','THIS RUN'):'R'+r.wave}</small></li>`).join('')}</ol></div></div><p class="result-lesson">${esc(lesson)}</p>${!data.saved?'<small>'+this.text('本次未能儲存排名。','This score could not be saved.')+'</small>':''}</section>`;
  }
  result(score,extra={},reason='defeat'){
   if(!this.run)return '';this.run.finish(reason);this.close();if(this.status)this.status.hidden=true;
   if(!this.saved){let storage;try{storage=localStorage;}catch{}this.resultData=saveBoard(storage,this.run.key(this.topic,this.recordLanguage),this.run.record(score,extra));this.saved=true;}
   const r=this.run,data=this.resultData;
   if(this.game!=='knife')return this.combatResult(data);
   const lesson=this.game==='knife'?this.text('切對才加分；護心擋扣心，不會把錯誤答案變成正確。遊戲分數不等於理財能力。','Only correct cuts score. Guard protects a heart, not an incorrect answer. Game score is not financial ability.'):this.text('火力與生存都需要資源。強化一項就要延後另一項；先觀察威脅，再決定進攻或保護。','Attack and survival compete for limited upgrades. Observe threats before deciding where to invest resources.');
   return `<section class="journey-result"><b>${r.reason==='time'||r.reason==='stages'?this.text('Booth 挑戰完成','Booth challenge complete'):this.text('本局紀錄','Run record')} · ${this.text('本機排名','Local rank')} #${data.rank}</b><p>${esc(lesson)}</p><small>${this.text('遊戲資源並非投資回報。','Game resources are not investment returns.')}</small><details><summary>${this.text('查看此模式本機前十名','Top 10 on this device')}</summary><ol>${data.board.map(x=>`<li>${x.score.toLocaleString('en')} · R${x.wave} · ${x.seconds}s</li>`).join('')}</ol></details>${!data.saved?'<p>'+this.text('此瀏覽器未能保存紀錄。','This browser could not save the result.')+'</p>':''}${r.scene==='booth'?`<div class="journey-qr"><img src="../arcade/${this.game}-qr.svg" width="128" height="128" alt="${this.text('再開一局 QR code','Play again QR code')}"><a href="./">${this.text('用自己手機掃碼，再開一局','Scan to play another round on your phone')}</a></div>`:''}<small>${this.text('本機紀錄，未經核實；不同模式及版本分榜。','Local, unverified records. Modes and versions have separate boards.')}</small></section>`;
  }
 }
 root.FuLamJourney={Run,UI,random,readBoard,saveBoard,VERSION,LIMIT,ROUND,BOOTH_ROUND,CHOICE,KNIFE_STAGES,KNIFE_OPTIONS,BOOTH_STAGES,BOOTH_STAGE_TIME,weaponProfile,survivalProfile,threatProfile,sceneInfo,drawScene};
})(typeof window==='undefined'?globalThis:window);
