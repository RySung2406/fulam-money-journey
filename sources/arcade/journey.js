/* FuLam arcade progression v7. Original code; scores are local, not verified online records. */
(function(root){
 'use strict';
 const VERSION='booth-v16', ROUND=30, BOOTH_ROUND=30, CHOICE=12, KNIFE_STAGES=2, KNIFE_OPTIONS=25, BOOTH_STAGES=4, BOOTH_STAGE_TIME=[15,20,25,30], LIMIT=90;
 const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
 const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 function random(seed){return()=>{let t=seed+=0x6D2B79F5;t=Math.imul(t^t>>>15,t|1);t^=t+Math.imul(t^t>>>7,t|61);return((t^t>>>14)>>>0)/4294967296;};}
 const QUIZZES={
  fishing:{
   topic:['認識保險','Know insurance'],
   items:[
    {q:['購買醫療保險前，以下哪項做法最明智？','Before buying medical insurance, which approach is wisest?'],choices:[['選擇保費最低的計劃','Pick the plan with the lowest premium'],['直接購買朋友推薦的保單','Buy the policy a friend recommends'],['比較保障範圍、不保事項及自付額','Compare cover, exclusions and the deductible'],['選擇迎新優惠最多的保險公司','Choose the insurer with the most welcome offers']],ok:2,why:['保費低不代表保障合適，還應考慮保障限額、不保事項及自己需要承擔的費用。','A low premium does not mean suitable cover—check limits, exclusions and what you still pay.']},
    {q:['某醫療保險設有 HK$5,000 自付額（Deductible）。假設合資格醫療費用為 HK$20,000，且沒有其他賠償限制，保險公司最多賠償多少？','A medical plan has a HK$5,000 deductible. If eligible costs are HK$20,000 with no other limits, how much will the insurer pay at most?'],choices:[['HK$5,000','HK$5,000'],['HK$15,000','HK$15,000'],['HK$20,000','HK$20,000'],['HK$25,000','HK$25,000']],ok:1,why:['受保人須先承擔 HK$5,000，保險公司才支付其餘合資格費用。','You pay the first HK$5,000; the insurer covers the remaining eligible costs.']},
    {q:['購買分紅保險時，對「非保證紅利」的理解，哪一項正確？','For participating insurance, which statement about non-guaranteed dividends is correct?'],choices:[['每年必定收到相同金額','You always receive the same amount each year'],['紅利完全不受保險公司表現影響','Dividends are unaffected by the insurer’s performance'],['所有預期紅利都可以提前提取','All expected dividends can be withdrawn early'],['實際紅利可能高於或低於預期，甚至為零','Actual dividends may be higher or lower than illustrated—even zero']],ok:3,why:['非保證紅利取決於保險公司的實際表現及相關政策，不能當作保證回報。','Non-guaranteed dividends depend on insurer results and policy; they are not a guaranteed return.']}
   ]
  },
  fleet:{
   topic:['投資之前的檢查','Checks before you invest'],
   items:[
    {q:['某基金去年回報達 30%，你正考慮投資。以下哪項做法最合理？','A fund returned 30% last year and you are considering it. Which step is most reasonable?'],choices:[['檢查基金風險、收費及是否符合自己的投資目標','Check risk, fees and fit with your goals'],['因為去年回報高，所以立即買入','Buy immediately because last year’s return was high'],['把大部分積蓄投入這隻基金','Put most of your savings into this fund'],['只參考社交媒體上的盈利截圖','Rely only on profit screenshots on social media']],ok:0,why:['過往表現不代表未來回報，投資前應評估產品風險、費用及個人的承受能力。','Past performance is not a future guarantee—assess risk, fees and what you can bear.']},
    {q:['有人在投資群組推薦一個交易平台，聲稱可以提供穩定高回報。你應該怎樣做？','Someone in an investment chat promotes a platform that claims stable high returns. What should you do?'],choices:[['先投入小額資金測試平台','Test with a small deposit first'],['查看群組成員的盈利截圖','Look at members’ profit screenshots'],['核實平台及相關中介人是否持有適當牌照','Verify the platform and intermediaries hold proper licences'],['邀請朋友一同投資以分散風險','Invite friends to invest together to spread risk']],ok:2,why:['可以透過證監會的持牌人及註冊機構公眾紀錄冊核實相關資料。持牌也不代表投資必然安全。','Check the SFC public register of licensed persons and registered institutions. A licence still does not make an investment safe.']},
    {q:['你有 HK$20,000，準備半年後用作交換生費用。以下哪種安排通常較合適？','You have HK$20,000 needed in six months for an exchange programme. Which arrangement usually fits better?'],choices:[['全數投資於高波動股票','Invest it all in high-volatility stocks'],['優先考慮流動性及本金風險較低的儲蓄方式','Favour liquidity and lower principal risk'],['借錢增加投資本金','Borrow to increase the principal'],['投資近期升幅最大的加密貨幣','Buy the crypto that rose the most recently']],ok:1,why:['短期內需要使用的資金，應優先考慮流動性、投資期限及承受虧損的能力。','Money needed soon should prioritise liquidity, time horizon and loss tolerance.']}
   ]
  },
  knife:{
   topic:['辨認投資產品','Spot investment products'],
   items:[
    {q:['以下哪項不屬於投資產品？','Which of the following is NOT an investment product?'],choices:[['股票','Stocks'],['政府債券','Government bonds'],['儲蓄戶口','Savings account'],['股票基金','Equity funds']],ok:2,why:['儲蓄戶口用於存放資金，並非主要投資產品。','A savings account is for depositing money, not mainly investing.']}
   ]
  }
 };
 function quizFor(game,wave){const bank=QUIZZES[game];if(!bank)return null;return bank.items[Math.max(0,Math.min(bank.items.length-1,(wave|0)-1))]||null;}
 class Run {
  constructor(game,scene='web',difficulty='standard',seed=Date.now()){
   this.game=game;this.scene=scene==='booth'?'booth':'web';this.difficulty=this.scene==='booth'?'intermediate':difficulty==='challenge'?'challenge':'standard';
   this.seed=this.scene==='booth'?20261104:seed;this.random=random(this.seed);this.active=0;this.total=0;this.wave=1;this.roundTime=0;this.choiceTime=0;this.phase='play';this.choices=[];this.reason='';this.weapon=0;this.rate=0;this.trajectory=0;this.escort=0;this.focus=0;this.guard=0;this.life=0;this.protection=0;
  }
  quizMode(){return this.scene==='booth'&&(this.game==='fishing'||this.game==='fleet'||this.game==='knife');}
  tick(dt,playing=true){
   if(this.phase==='over'||!Number.isFinite(dt)||dt<=0)return null;
   // Quiz / upgrade wait does not spend the 90s match clock.
   if(this.phase==='choice'){
    if(this.quizMode())return null;
    this.choiceTime=Math.max(0,this.choiceTime-dt);return this.choiceTime===0?'auto':null;
   }
   // Pause freezes wall time, round time, and active play time.
   if(!playing)return null;
   if(this.scene==='booth'){
    const duration=this.roundLimit(),remaining=duration-this.roundTime;
    const played=Math.min(dt,remaining);
    this.roundTime+=played;this.total+=played;this.active+=played;
    if(this.roundTime+1e-7<duration)return null;
    if(this.wave===(this.game==='knife'?KNIFE_STAGES:BOOTH_STAGES)){
     if(this.game!=='knife'){this.total=LIMIT;this.active=LIMIT;}
     this.finish('time');return 'over';
    }
    this.completeRound();return 'choice';
   }
   this.total+=dt;
   const step=Math.min(dt,.1);this.active+=step;this.roundTime+=step;
   if(this.game!=='knife'&&this.roundTime>=this.roundLimit()){this.roundTime=this.roundLimit();this.completeRound();return 'choice';}
   return null;
  }
  roundLimit(){if(this.scene==='booth')return this.game==='knife'?LIMIT/KNIFE_STAGES:BOOTH_STAGE_TIME[this.wave-1];return ROUND;}
  completeRound(){
   if(this.phase!=='play')return false;
   if(this.scene==='booth'&&this.game==='knife'&&this.wave===KNIFE_STAGES)return this.finish('stages');
   this.phase='choice';this.choiceTime=this.quizMode()?Number.POSITIVE_INFINITY:CHOICE;
   this.grantedFrom=this.weapon;if(this.game!=='knife')this.weapon++;return true;
  }
  choose(kind){
   if(this.phase!=='choice')return false;
   if(this.quizMode()){
    if(this.game==='knife'){
     if(kind!=='continue')return false;
     this.choices.push('continue');if(this.choices.length>100)this.choices.shift();
     this.wave++;if(this.scene==='booth'&&this.wave===2)this.weapon=1;this.roundTime=0;this.choiceTime=0;this.phase='play';return true;
    }
    if(kind!=='trajectory')return false;
    this.choices.push('trajectory');if(this.choices.length>100)this.choices.shift();
    this.trajectory++;
    this.wave++;
    if(this.game==='fleet'&&this.wave===3)this.escort=Math.max(1,this.escort);
    this.roundTime=0;this.choiceTime=0;this.phase='play';return true;
   }
   const allowed=this.game==='knife'?['continue']:this.game==='fleet'?['escort','trajectory','rate']:['trajectory','rate'];
   if(!allowed.includes(kind))return false;
   this.choices.push(kind);if(this.choices.length>100)this.choices.shift();if(kind!=='continue')this[kind]++;
   this.wave++;this.roundTime=0;this.choiceTime=0;this.phase='play';return true;
  }
  finish(reason='defeat'){if(this.phase==='over')return false;this.phase='over';this.reason=reason;return true;}
  key(topic='',language=''){return [this.game==='knife'?VERSION+'-quiz1':VERSION+'-combat4',this.game,this.scene,this.difficulty,topic,language].join(':');}
  record(score,extra={}){return{score:Math.max(0,Math.floor(Number(score)||0)),wave:this.wave,seconds:Math.round(this.active),reason:this.reason,...extra};}
 }
 function readBoard(storage,key){try{const a=JSON.parse(storage.getItem(key)||'[]');return Array.isArray(a)?a.filter(r=>r&&Number.isSafeInteger(r.score)&&r.score>=0&&Number.isInteger(r.wave)&&r.wave>0&&Number.isFinite(r.seconds)&&r.seconds>=0).slice(0,10):[];}catch{return[];}}
 function saveBoard(storage,key,record){const a=readBoard(storage,key);a.push(record);a.sort((x,y)=>y.score-x.score||y.wave-x.wave);const rank=a.indexOf(record)+1;try{storage.setItem(key,JSON.stringify(a.slice(0,10)));return{rank,board:a.slice(0,10),saved:true};}catch{return{rank,board:a.slice(0,10),saved:false};}}
 const WEAPONS={
  fishing:[['單管水炮','Water cannon'],['雙管水炮','Twin cannon'],['穿甲水炮','Piercer'],['重型穿甲炮','Heavy piercer'],['電漿炮','Plasma'],['爆裂電漿炮','Burst plasma'],['光束炮','Beam cannon'],['聚焦光束炮','Focus beam'],['追蹤魚雷','Homing torpedo'],['集束魚雷','Cluster torpedo'],['電弧主炮','Arc cannon'],['極光主炮','Aurora cannon']],
  fleet:[['偵察機炮','Scout gun'],['雙聯機炮','Twin gun'],['穿甲機炮','Piercer'],['重型穿甲炮','Heavy piercer'],['電漿機炮','Plasma gun'],['爆裂電漿炮','Burst plasma'],['雷射機炮','Laser gun'],['聚焦雷射','Focus laser'],['追蹤導彈','Homing missiles'],['集束導彈','Cluster missiles'],['電弧機炮','Arc gun'],['極光陣列','Aurora array']],
  knife:[['聖誕練習刀','Festive practice'],['薑餅銅刀','Ginger bronze'],['糖果鋼刀','Candy steel'],['拐杖長鋒','Cane edge'],['雪花星紋','Snowflake edge'],['銀鈴月刀','Silver bell'],['燈飾流光','Light trail'],['極光聖誕','Aurora yule'],['糖豆星核','Jellybean core'],['槲寄生光棱','Mistletoe prism'],['雪夜天穹','Snow sky'],['冬曉曙光','Winter dawn']]
 };
 const SCENES=[
  {color:'#edb579',sky:'#0a1f30',names:{fishing:['聖誕港灣','Festive harbour'],fleet:['雪夜海灣','Snow bay'],knife:['聖誕工坊','Festive workshop']},lesson:['先理解工具的用途，再決定怎樣運用有限資源。','Understand a tool before allocating limited resources.']},
  {color:'#9fd4ff',sky:'#0b2533',names:{fishing:['糖果珊瑚','Candy reef'],fleet:['燈飾群島','Lights islands'],knife:['禮物花園','Gift garden']},lesson:['分散能減少對單一目標的依賴，也可能分薄集中火力。','Diversification reduces dependence on one target; it also spreads your firepower.']},
  {color:'#c9a0ff',sky:'#120f28',names:{fishing:['暴風雪峽','Blizzard strait'],fleet:['極光航線','Aurora route'],knife:['燈籠燈塔','Lantern lighthouse']},lesson:['遇到突發狀況，預留的緩衝能給你更多應對空間。','A reserve gives you room to respond to unexpected events.']},
  {color:'#eab77f',sky:'#1a121c',names:{fishing:['薑餅遺跡','Gingerbread ruins'],fleet:['聖誕都市','Holiday city'],knife:['糖果城橋','Candy bridge']},lesson:['每次升級都有機會成本；選擇一項，就要等待其他強化。','Every upgrade has an opportunity cost: choosing one delays the others.']},
  {color:'#ffdbb6',sky:'#161a2e',names:{fishing:['冬曉遠海','Winter dawn'],fleet:['曙光雲海','Dawn clouds'],knife:['星夜觀測台','Star observatory']},lesson:['一刀先查證再判斷；戰鬥先觀察威脅再配置火力。','Verify before deciding; observe threats before allocating firepower.']}
 ];
 function sceneInfo(game,wave=1){const index=(Math.max(1,wave)-1)%SCENES.length,s=SCENES[index];return {...s,index,name:s.names[game]||s.names.fleet};}
 function threatProfile(wave=1){const n=Math.max(0,wave-1);return {health:1+.22*n+.035*n*n,speed:1+Math.min(.6,n*.045),density:1+Math.min(1.4,n*.09),bullet:1+Math.min(.6,n*.035),elite:n>=2};}
 const BASE_WEAPON={
  fishing:{damage:1.8*1.42,interval:.22/1.50},
  fleet:{damage:24,interval:.20/1.45},
  knife:{damage:16,interval:.20}
 };
 function weaponProfile(game,run={}){
  const base=BASE_WEAPON[game]||BASE_WEAPON.knife;
  const weapon=Math.max(0,run.weapon||0),rate=Math.max(0,run.rate||0),trajectory=Math.max(0,run.trajectory||0),stage=Math.min(11,weapon);
  const count=Math.min(7,1+(weapon>=1?1:0)+trajectory),spread=Array.from({length:count},(_,i)=>(i-(count-1)/2)*(count===2?.045:.115));
  const damage=base.damage*(1+.35*weapon+.04*weapon*weapon)*(1+Math.max(0,trajectory-5)*.08+Math.max(0,rate-18)*.06);
  return {stage,tier:weapon+1,kind:stage>=10?'arc':stage>=8?'missile':stage>=6?'beam':stage>=4?'orb':'bullet',damage,interval:base.interval/(1+.18*Math.min(18,rate)),count,spread,pierce:Math.min(12,Math.floor(weapon/2)+Math.floor(trajectory/3)),blast:weapon>=4?Math.min(85,28+weapon*3):0,homing:weapon>=8?2.1:0,chain:weapon>=10?Math.min(5,2+Math.floor((weapon-10)/2)):0,speed:stage>=6?820:stage>=4?560:720,color:['#ffe39b','#ffe39b','#91e8ec','#91e8ec','#c8a5ff','#c8a5ff','#8df4ff','#8df4ff','#ffa77e','#ffa77e','#d1bcff','#e8e4ff'][stage]};
 }
 function survivalProfile(game,run={},base=100){
  const life=Math.max(0,run.life||0),protection=Math.max(0,run.protection||0);
  return {max:base+life*(game==='knife'?1:20),multiplier:1/(1+.15*protection),shieldBonus:Math.min(2,.4*protection)};
 }
 const sceneImages=new Map();
 let campusImage,campusHorizon;
 function drawCampusHorizon(ctx,w,h,game){
  if(!campusImage && typeof Image!=='undefined'){
   campusImage=new Image();
   campusImage.onload=()=>{
    const layer=document.createElement('canvas');layer.width=960;layer.height=320;
    const brush=layer.getContext('2d');brush.drawImage(campusImage,0,0,960,320);
    const fade=brush.createLinearGradient(0,0,0,320);
    fade.addColorStop(0,'transparent');fade.addColorStop(.20,'#000');fade.addColorStop(.68,'#000');fade.addColorStop(1,'transparent');
    brush.globalCompositeOperation='destination-in';brush.fillStyle=fade;brush.fillRect(0,0,960,320);campusHorizon=layer;
   };
   campusImage.src='../arcade/campus-christmas.webp';
  }
  if(!campusHorizon)return;
  const height=Math.min(h*.38,w*.43),width=Math.max(w,height*3);
  ctx.save();ctx.globalAlpha=game==='fleet'?.65:.50;
  ctx.drawImage(campusHorizon,(w-width)*.62,h*.07,width,height);
  ctx.restore();
 }
 function drawScene(ctx,w,h,game,wave,time=0,reduced=false){
  const s=sceneInfo(game,wave),key=game+'-'+s.index;let img=sceneImages.get(key);
  if(!img&&typeof Image!=='undefined'){img=new Image();img.src='../arcade/scenes/'+key+'.svg';sceneImages.set(key,img);}
  ctx.save();ctx.fillStyle=s.sky;ctx.fillRect(0,0,w,h);
  if(img?.complete&&img.naturalWidth)ctx.drawImage(img,0,0,w,h);
  drawCampusHorizon(ctx,w,h,game);
  const t=reduced?0:time;ctx.fillStyle='#ffffff18';
  for(let i=0;i<(game==='fleet'?14:18);i++){const x=(i*131+37+t*(game==='fleet'?8:12))%w,y=(i*173+t*(game==='fleet'?22:28)+h*10)%(h+80)-40;ctx.beginPath();ctx.ellipse(x,y,game==='fleet'?2.2:1.6,game==='fleet'?2.2:1.6,0,0,Math.PI*2);ctx.fill();}
  ctx.restore();
 }

 class UI {
  constructor(game,language){this.game=game;this.language=language;this.station=root.FuLamStation?.gameAttempt(game);this.scene='booth';this.difficulty='intermediate';this.run=null;this.overlay=null;this.saved=false;this.onChoice=()=>{};this.onEnd=()=>{};this.onIntermission=()=>{};}
  en(){return this.language()==='en';}
  text(zh,en){return this.en()?en:zh;}
  sliceHearts(){return this.scene==='booth'?5:this.difficulty==='challenge'?3:6;}
  sliceMaxHearts(){return this.sliceHearts()+(this.run?.life||0);}
  survival(run=this.run){return survivalProfile(this.game,run||{},this.game==='knife'?this.sliceHearts():this.game==='fleet'?(this.scene==='booth'?88:this.difficulty==='challenge'?75:100):100);}
  name(id){const tier=Math.max(0,id||0);if(this.scene==='booth'&&this.game==='knife'){const names=[['聖誕練習刀','Festive practice'],['拐杖糖刀','Candy cane blade'],['槲寄生日刃','Mistletoe blade'],['雪夜聖誕刀','Snow-night blade']];return names[Math.min(3,tier)][this.en()?1:0];}if(this.scene==='booth'&&this.game!=='knife'){const names=this.game==='fishing'?[['雙管雪花','Twin snowflake'],['糖杖雙聯','Candy cane'],['聖誕鈴鐺','Jingle bells'],['爆炸聖誕糖豆','Exploding jellybeans']]:[['雪花子彈','Snowflake'],['糖杖雙聯','Candy cane'],['聖誕鈴鐺','Jingle bells'],['爆炸聖誕糖豆','Exploding jellybeans']];return names[Math.min(3,tier)][this.en()?1:0];}return WEAPONS[this.game][Math.min(11,tier)][this.en()?1:0]+(tier>11?' +'+(tier-11):'');}
  stageScene(wave=this.run?.wave||1){return sceneInfo(this.game,wave);}
  applyScene(){if(!this.host||!this.run)return;const s=this.stageScene();this.host.dataset.scene=String(s.index);this.host.style.setProperty('--stage-color',s.color);this.host.style.setProperty('--stage-bg',`url('../arcade/scenes/${this.game}-${s.index}.svg')`);}
  best(){try{const r=this.run||new Run(this.game,this.scene,this.difficulty);return readBoard(localStorage,r.key(this.topic||'',this.recordLanguage||''))[0]?.score||0;}catch{return 0;}}
  settings(host,change=()=>{}){
   if(!host)return;
   this.scene='booth';this.difficulty='intermediate';
   const lobby=host.closest?.('.welcome-card,.card,#menu');
   if(lobby&&!lobby.querySelector('.campus-art')){
    lobby.classList.add('campus-lobby');
    const art=document.createElement('div');art.className='campus-art';art.setAttribute('aria-hidden','true');lobby.prepend(art);
   }
   const knife=this.game==='knife';
   const stages=knife?this.text('兩關','2 stages'):this.text('四回合','4 rounds');
   const timing=knife?this.text('最多 90 秒','Up to 90s'):this.text('90 秒','90s');
   host.innerHTML=`<p class="campus-format"><b>${timing}</b><span>${stages}</span><span>${this.text('答題時停鐘','Clock pauses for quizzes')}</span></p>`;
   change('intermediate','booth');
  }
  guide(host,onStart,onBack,question='',context='',stage=1){
   this.close();const o=document.createElement('div');o.className='journey-overlay journey-guide';o.setAttribute('role','dialog');o.setAttribute('aria-modal','true');o.setAttribute('aria-label',this.text('開始前指引','Before you play'));this.overlay=o;
   const showQuestion=this.game==='knife'&&question;
   if(showQuestion && this.scene==='booth'){
    o.classList.add('slice-interlude');
    const counter=String(stage).padStart(2,'0');
    const back=stage===1?this.text('返回','Back'):this.text('提前結算','Finish early');
    o.setAttribute('aria-labelledby','slice-stage-question');
    o.innerHTML=`<section class="slice-prompt-card">
      <header class="slice-stage-ribbon">
        <span class="slice-stage-progress" aria-label="${this.text('第 '+stage+' 關，共兩關','Stage '+stage+' of 2')}"><b>${counter}</b><span>/ 02</span></span>
        <span class="slice-blade-mark" aria-hidden="true"><img src="knife-${stage-1}.svg" alt=""></span>
      </header>
      <h2 id="slice-stage-question" class="journey-guide-topic">${esc(question)}</h2>
      <div class="slice-prompt-actions"><button type="button" class="slice-back" data-guide-back>${back}</button><button type="button" class="slice-go" data-guide-start>${this.text('開切','Start slicing')} <span aria-hidden="true">↗</span></button></div>
    </section>`;
   }else{
   const rows=this.game==='fishing'?[
    ['↗',this.text('指向魚群，自動開炮','Aim at the school'),this.text('點一下、移動滑鼠或按 ← → 轉動炮管。','Tap, move the mouse or use ← → to turn the cannon.')],
    ['◎',this.text('道具每 5 秒自動施放','Automatic skills every 5s'),this.text('漁網罩住魚群，聲納自動掃描得分。','Nets hold schools in place. Sonar scans fish for bonus points.')],
    ['★',this.text('答對保險題，多一條彈道','Answer for an extra shot'),this.text('魚群密集時可一次瞄準多條魚。','Aim where several fish cross paths.')]
   ]:this.game==='fleet'?[
    ['↗',this.text('拖曳閃避，自動開火','Drag to dodge and fire'),this.text('也可用 WASD 或方向鍵。用機身白點穿過彈幕空隙。','Or use WASD or the arrow keys. Guide the white dot through gaps in the fire.')],
    ['★',this.text('每 5 秒自動支援','Automatic support every 5s'),this.text('無人機集星加分，藍盾擋彈，也有機會獲得飛行加速或僚機支援。','Drones collect stars, shields block shots, and some drops boost speed or call a wingman.')],
    ['★',this.text('答對投資題，多一條彈道','Answer for an extra shot'),this.text('第 3 回合有僚機加入。','A wingman joins in round 3.')]
   ]:[
    ['01',this.text('先看題目，再切正確錢袋','Read first, then slice correct bags'),this.text('兩關練習：先切開理財工具，再分辨投資產品。','Two stages: slice money tools, then spot investment products.')],
    ['↗',this.text('手指／滑鼠劃過錢袋','Swipe with your finger or mouse'),this.text('鍵盤可用 Tab 選袋，再按 Enter 或 Space。','Keyboard: Tab to a bag, then Enter or Space.')],
    ['Q1',this.text('過關先答一題 MC','Answer a mid-stage MC to continue'),this.text('第 1 關結束後，答「哪項不屬於投資產品」。答對後刀刃進化成拐杖糖刀，再進入第 2 關。','After stage 1, answer which item is NOT an investment product. A correct answer evolves the blade into a candy cane, then opens stage 2.')],
    ['♥',this.text('錯切扣 1 心；漏切也有代價','Wrong cuts cost a heart; misses add up'),this.text(`${this.scene==='booth'?'Booth 中等':this.difficulty==='challenge'?'挑戰':'標準'} ${this.sliceHearts()} 心；每漏切 ${this.sliceHearts()} 個正確選項扣 1 心。`,`${this.scene==='booth'?'Booth intermediate':this.difficulty==='challenge'?'Challenge':'Standard'}: ${this.sliceHearts()} hearts; ${this.sliceHearts()} missed correct bags cost a heart.`)]
   ];
   const kicker=showQuestion?this.text(this.run?'聖誕下一關':'聖誕開始前 · 先看題目',this.run?'FESTIVE NEXT STAGE':'FESTIVE WARM-UP · READ FIRST'):this.text('聖誕攤位 · 操作指引','CHRISTMAS BOOTH · HOW TO PLAY');
   const heading=showQuestion?(this.en()?'Question: ':'題目: ')+question:this.text('聖誕關卡，準備好了嗎？','Ready for the festive stage?');
   const startLabel=showQuestion&&this.run?this.text('看完題目，開始','Start this stage'):this.text('知道了，開始！','Got it — start!');
   o.innerHTML=`<div class="journey-card"><span class="journey-kicker">${kicker}</span><h2${showQuestion?' class="journey-guide-topic"':''}>${esc(heading)}</h2>${showQuestion&&context?`<p class="journey-guide-context">${esc(context)}</p>`:''}${showQuestion?`<p class="journey-guide-lead">${this.text('切中符合題目的錢袋，讓錯誤選項落下。','Slice the bags that fit the question. Let the wrong ones fall.')}</p>`:(question?`<p class="journey-guide-question">${esc(question)}</p>`:'')}<div class="journey-guide-grid">${rows.map(([key,title,copy])=>`<div><kbd>${esc(key)}</kbd><p><b>${esc(title)}</b><small>${esc(copy)}</small></p></div>`).join('')}</div><p class="journey-guide-rule">${this.game!=='knife'?this.text(`四回合共 ${LIMIT} 秒（${BOOTH_STAGE_TIME.join('／')}）。答題時停鐘，答對後繼續。P 鍵暫停。`,`Four rounds, ${LIMIT}s total (${BOOTH_STAGE_TIME.join(' / ')}). The clock pauses for quizzes. Answer correctly to continue. Press P to pause.`):this.scene==='booth'?this.text('聖誕 Booth 兩關。第 1 關切開理財工具，第 2 關分辨投資產品；中間答「哪項不屬於投資產品」。','Christmas Booth is two stages: slice money tools, then spot investment products; mid-stage MC asks what is NOT an investment product.'):this.text('自由遊玩 · 沒有總時限，挑戰最高分。','Free play · No overall time limit. Chase your best score.')}</p><div class="journey-guide-actions"><button class="journey-exit" data-guide-back>${this.text('返回選單','Back')}</button><button class="journey-begin" data-guide-start>${startLabel}</button></div></div>`;
   }
   host.append(o);o.querySelector('[data-guide-start]').onclick=()=>{this.close();onStart();};o.querySelector('[data-guide-back]').onclick=()=>{this.close();onBack();};
   o.addEventListener('keydown',e=>{if(e.key==='Escape'){e.preventDefault();o.querySelector('[data-guide-back]').click();}if(e.key==='Tab'){const b=[...o.querySelectorAll('button')];if(e.shiftKey&&document.activeElement===b[0]){e.preventDefault();b.at(-1).focus();}else if(!e.shiftKey&&document.activeElement===b.at(-1)){e.preventDefault();b[0].focus();}}});o.querySelector('[data-guide-start]').focus({preventScroll:true});
  }
  completeRound(){
   if(!this.run?.completeRound())return;
   if(this.run.phase==='over'){this.close();this.onEnd(this.run.reason);return;}
   this.onIntermission();this.showChoices();
  }
  start(host,topic=''){
   this.close();this.run=new Run(this.game,this.scene,this.difficulty);this.topic=topic;this.recordLanguage=this.game==='knife'?this.language():'';this.saved=false;this.last=performance.now();this.host=host;
   this.status=host.querySelector('.journey-status')||document.createElement('div');this.status.className='journey-status';this.status.setAttribute('role','status');if(!this.status.parentNode)host.prepend(this.status);
   this.status.hidden=false;this.applyScene();this.update();return this.run;
  }
  step(playing){
   if(!this.run||this.run.phase==='over')return;const now=performance.now(),dt=Math.max(0,(now-this.last)/1000);this.last=now;
   const event=this.run.tick(dt,playing);if(event==='over'){this.close();this.onEnd('time');return;}
   if(event==='choice'){this.onIntermission();this.showChoices();}if(event==='auto')this.pick(this.overlay?.querySelector('[data-upgrade]')?.dataset.upgrade||(this.run.game==='knife'?'continue':'trajectory'));
   const counter=this.overlay?.querySelector('.journey-count');if(counter&&Number.isFinite(this.run.choiceTime))counter.textContent=this.text('未揀就自動選：','Auto pick: ')+Math.ceil(this.run.choiceTime)+'s';this.update();
  }
  showChoices(){
   if(this.run?.quizMode()){this.showQuiz();return;}
   if(this.game==='knife'){this.pick('continue');return;}
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
   o.innerHTML=`<div class="journey-card journey-choice-card"><span class="journey-kicker">ROUND ${r.wave} → ${r.wave+1}</span><h2>${this.game==='knife'?this.text('刀刃已升級，再揀減速或加1心。','Blade upgraded. Choose slow-down or +1 heart.'):this.game==='fleet'?this.text('飛機已升級，再揀僚機、彈道或速度。','Jet upgraded. Choose a wingman, spread or speed.'):this.text('武器已升級，再揀彈道或速度。','Weapon upgraded. Choose spread or speed.')}</h2><p class="journey-granted">${esc(grant)}</p><p class="journey-scene-note"><b>${esc(s.name[this.en()?1:0])}</b> · ${esc(s.lesson[this.en()?1:0])}</p><div class="journey-upgrades" data-count="${cards.length}">${cards.map(([kind,zh,en,copy],i)=>`<button data-upgrade="${kind}"><b>${i+1} · ${this.text(zh,en)}</b><small>${esc(copy)}</small></button>`).join('')}</div><p class="journey-count"></p><p class="journey-next">${this.game==='knife'?esc(this.nextHint?.()||''):this.game==='fishing'?this.text('每回合補給 12 能源；第 3 回合 Boss 破甲，第 4 回合爆炸聖誕糖豆。','Recover 12 energy each round. Boss armour breaks in R3; exploding jellybeans arrive in R4.'):this.text('下一回合：敵人血量、速度及密度上升；第 3 回合起有精英與 Boss；每回合補給 20 護甲。','Next round: tougher, faster, denser enemies. Elites and bosses from round 3; recover 20 armour each round.')}</p></div>`;
   this.host.classList.add('journey-choosing');this.host.append(o);o.querySelectorAll('[data-upgrade]').forEach(b=>b.onclick=()=>this.pick(b.dataset.upgrade));
   o.addEventListener('keydown',e=>{const b=[...o.querySelectorAll('button')];if(/^[1-5]$/.test(e.key)&&b[Number(e.key)-1]){e.preventDefault();e.stopPropagation();b[Number(e.key)-1].click();}if(e.key==='Tab'){if(e.shiftKey&&document.activeElement===b[0]){e.preventDefault();b.at(-1).focus();}else if(!e.shiftKey&&document.activeElement===b.at(-1)){e.preventDefault();b[0].focus();}}});o.querySelector('[data-upgrade]')?.focus({preventScroll:true});
  }
  showQuiz(){
   this.close();const r=this.run,bank=QUIZZES[this.game],item=quizFor(this.game,r.wave),s=this.stageScene(r.wave+1);
   const knife=this.game==='knife';
   const evolve=knife&&r.scene==='booth'&&r.wave===1;
   const fromName=this.name(evolve?r.weapon:(r.grantedFrom??Math.max(0,r.weapon-1))),toName=this.name(evolve?r.weapon+1:r.weapon);
   const grant=knife?(evolve?this.text(`答對後刀刃進化：${fromName} → ${toName}`,`Answer correctly and the blade evolves: ${fromName} → ${toName}`):this.text('第 1 關完成。答對「哪項不屬於投資產品」，再看第 2 關題目。','Stage 1 done. Answer which is NOT an investment product, then read stage 2.')):this.game==='fleet'?this.text(`飛機已升級：${fromName} → ${toName}`,`Jet upgraded: ${fromName} → ${toName}`):this.text(`武器已升級：${fromName} → ${toName}`,`Weapon upgraded: ${fromName} → ${toName}`);
   const reward=knife
    ?(evolve?this.text('第 2 關使用進化後的拐杖糖刀。','Stage 2 uses the evolved candy-cane blade.'):this.text('答對後會介紹下一關題目。','The next stage question follows a correct answer.'))
    :this.game==='fleet'&&r.wave===2
    ?this.text(`答對後彈道 ${r.trajectory} → ${r.trajectory+1}，並自動加入僚機。`,`Answer correctly: spread ${r.trajectory} → ${r.trajectory+1}, and a wingman joins.`)
    :this.text(`答對後彈道 ${r.trajectory} → ${r.trajectory+1}，會留在每一種武器。`,`Answer correctly: spread ${r.trajectory} → ${r.trajectory+1}, kept on every weapon.`);
   const nextCopy=knife
    ?esc(this.nextHint?.()||this.text('下一關：分辨投資產品。','Next stage: spot investment products.'))
    :this.game==='fishing'?this.text('每回合補給 12 能源；第 3 回合 Boss 破甲，第 4 回合爆炸聖誕糖豆。','Recover 12 energy each round. Boss armour breaks in R3; exploding jellybeans arrive in R4.'):this.text('下一回合：敵人血量、速度及密度上升；第 3 回合起有精英與 Boss；每回合補給 20 護甲。','Next round: tougher, faster, denser enemies. Elites and bosses from round 3; recover 20 armour each round.');
   const letters='ABCD';
   const o=document.createElement('div');o.className='journey-overlay';o.setAttribute('role','dialog');o.setAttribute('aria-modal','true');o.setAttribute('aria-label',this.text('答題繼續','Answer to continue'));this.overlay=o;
   if(knife){
    o.classList.add('slice-interlude');
    o.setAttribute('aria-labelledby','slice-quiz-question');
    o.innerHTML=`<section class="slice-prompt-card slice-quiz">
      <header class="slice-stage-ribbon"><span class="slice-stage-progress"><b>01</b><span aria-hidden="true">→</span><span>02</span></span>
        <span class="slice-blade-mark" aria-hidden="true"><img src="knife-1.svg" alt=""></span></header>
      <h2 class="journey-quiz-q" id="slice-quiz-question">${esc(this.text(item.q[0],item.q[1]))}</h2>
      <div class="slice-answer-grid">${item.choices.map((choice,i)=>`<button type="button" data-quiz="${i}"><span aria-hidden="true">${letters[i]}</span>${esc(this.text(choice[0],choice[1]))}</button>`).join('')}</div>
      <p class="journey-quiz-tip" role="status" hidden></p></section>`;
   }else o.innerHTML=`<div class="journey-card journey-choice-card journey-quiz-card"><span class="journey-kicker">${this.text('聖誕答題','FESTIVE QUIZ')} · ${r.wave} → ${r.wave+1} · ${esc(this.text(bank.topic[0],bank.topic[1]))}</span><h2>${knife?this.text('答對這題，才進入下一關。','Answer correctly to open the next stage.'):this.text('答對題目，才能繼續下一回合。','Answer correctly to continue to the next round.')}</h2><p class="journey-granted">${esc(grant)}</p><p class="journey-scene-note"><b>${esc(s.name[this.en()?1:0])}</b> · ${esc(reward)}</p><p class="journey-quiz-q"><b>Q${r.wave}.</b> ${esc(this.text(item.q[0],item.q[1]))}</p><div class="journey-upgrades journey-quiz-choices" data-count="4">${item.choices.map((c,i)=>`<button type="button" data-quiz="${i}"><b>${letters[i]} · ${esc(this.text(c[0],c[1]))}</b></button>`).join('')}</div><p class="journey-quiz-tip" hidden></p><p class="journey-next">${knife?this.text('答對後下一關題目：','Next stage question after a correct answer: ')+nextCopy:nextCopy}</p></div>`;
   this.host.classList.add('journey-choosing');this.host.append(o);
   const tip=o.querySelector('.journey-quiz-tip');
   o.querySelectorAll('[data-quiz]').forEach(b=>b.onclick=()=>{
    const i=Number(b.dataset.quiz);
    if(i===item.ok){this.pick(knife?'continue':'trajectory');return;}
    b.classList.add('is-wrong');b.disabled=true;
    tip.hidden=false;tip.textContent=this.text(item.why[0],item.why[1]);
    const next=[...o.querySelectorAll('[data-quiz]:not(:disabled)')].find(x=>x!==b);next?.focus({preventScroll:true});
   });
   o.addEventListener('keydown',e=>{const b=[...o.querySelectorAll('[data-quiz]:not(:disabled)')];const all=[...o.querySelectorAll('[data-quiz]')];if(/^[1-4]$/.test(e.key)&&all[Number(e.key)-1]&&!all[Number(e.key)-1].disabled){e.preventDefault();e.stopPropagation();all[Number(e.key)-1].click();}if(/^[a-dA-D]$/.test(e.key)){const idx='ABCD'.indexOf(e.key.toUpperCase());if(all[idx]&&!all[idx].disabled){e.preventDefault();e.stopPropagation();all[idx].click();}}if(e.key==='Tab'&&b.length){if(e.shiftKey&&document.activeElement===b[0]){e.preventDefault();b.at(-1).focus();}else if(!e.shiftKey&&document.activeElement===b.at(-1)){e.preventDefault();b[0].focus();}}});
   o.querySelector('[data-quiz]')?.focus({preventScroll:true});
  }
  pick(kind){if(!this.run?.choose(kind))return;this.close();this.applyScene();this.onChoice(kind,this.run);this.host.querySelector('canvas')?.focus({preventScroll:true});this.update();}
  close(){this.overlay?.remove();this.overlay=null;this.host?.classList.remove('journey-choosing');}
  update(){
   if(!this.status||!this.run)return;
   const r=this.run,knife=this.game==='knife';
   if(r.scene==='booth'){
    const stages=knife?KNIFE_STAGES:BOOTH_STAGES;
    const duration=knife?r.roundLimit():LIMIT;
    const wallLeft=Math.ceil(Math.max(0,duration-(knife?r.roundTime:r.total)));
    const clock=Math.floor(wallLeft/60)+':'+String(wallLeft%60).padStart(2,'0');
    const label=r.phase==='choice'?this.text('答題中 · 已停鐘','Quiz · clock paused'):knife?this.text('本關剩餘時間','Stage time left'):wallLeft<=15?this.text('最後衝刺','Final stretch'):this.text('剩餘時間','Time left');
    const status=this.text('第 '+r.wave+'/'+stages+' 關','Stage '+r.wave+'/'+stages)+'   ·   '+label+'   '+clock;
    if(this.status.textContent!==status){
     this.status.textContent=status;
     this.status.style.setProperty('--time-left',(wallLeft/duration*100)+'%');
     this.status.classList.toggle('final-stretch',wallLeft<=15);
    }
    return;
   }
   const clock=this.game==='knife'&&r.scene==='booth'?this.text(`第 ${Math.min(r.wave,KNIFE_STAGES)}/${KNIFE_STAGES} 關 · ${this.name(r.weapon)}`,`Stage ${Math.min(r.wave,KNIFE_STAGES)}/${KNIFE_STAGES} · ${this.name(r.weapon)}`):Math.floor(r.active)+'s';
   this.status.textContent=`${r.scene==='booth'?'Booth':this.text(r.difficulty==='challenge'?'挑戰':'標準',r.difficulty==='challenge'?'Hard':'Standard')} · R${r.wave} ${this.stageScene().name[this.en()?1:0]} · ${clock}`;
  }
  combatResult(data){
   const lesson=this.game==='fishing'?this.text('魚群聚在一起時，一張漁網就能留住幾條魚。理財也要選合適的時機運用有限資源。遊戲得分並非投資回報。','One well-placed net can hold several fish. Timing matters when using limited resources. Game scores do not measure investment returns.'):this.text('追擊高分敵機時，也要留意前方的彈道。理財決定同樣要衡量回報和風險。遊戲得分並非投資回報。','Chasing a high-value aircraft can take you into the line of fire. Financial decisions also involve weighing risk against reward. Game scores do not measure investment returns.');
   return `<section class="journey-result journey-scoreboard"><div class="scoreboard-main"><div class="result-rank"><span>${this.text('聖誕本機排名','FESTIVE LOCAL RANK')}</span><strong>${data.rank>10?'10+':'#'+data.rank}</strong><small>${this.text('同一裝置 · 同一版本','Same device · same version')}</small></div><div class="result-board"><b>${this.text('聖誕本機前五名','FESTIVE TOP 5')}</b><ol class="score-list">${data.board.slice(0,5).map((r,i)=>`<li${i+1===data.rank?' class="this-run" aria-current="true"':''}><span>${i+1}</span><strong>${r.score.toLocaleString('en')}</strong><small>${i+1===data.rank?this.text('本局','THIS RUN'):'R'+r.wave}</small></li>`).join('')}</ol></div></div><p class="result-lesson">${esc(lesson)}</p>${!data.saved?'<small>'+this.text('本次未能儲存排名。','This score could not be saved.')+'</small>':''}</section>`;
  }
  result(score,extra={},reason='defeat'){
   if(!this.run)return '';this.run.finish(reason);this.close();if(this.status)this.status.hidden=true;
   if(this.station){
    const points=this.run.record(score,extra).score;
    if(this.station.finish(points))return '';
    return `<div class="journey-result" role="alert"><b>${this.text('未能儲存。請工作人員抄下成績。','Save failed. Ask staff to write down this score.')}</b><p>UID ${esc(this.station.uid)} · ${points}</p><button type="button" data-retry-booth-save>${this.text('重新儲存','Retry save')}</button></div>`;
   }
   if(!this.saved){let storage;try{storage=localStorage;}catch{}this.resultData=saveBoard(storage,this.run.key(this.topic,this.recordLanguage),this.run.record(score,extra));this.saved=true;}
   const r=this.run,data=this.resultData;
   if(this.game!=='knife')return this.combatResult(data);
   const error=data.saved?'':'<p class="slice-save-error" role="alert">Score could not be saved on this device.</p>';
   const rows=data.board.map((entry,i)=>`<li${i+1===data.rank?' aria-current="true"':''}><b>${i+1}</b><strong>${entry.score.toLocaleString('en')}</strong>${i+1===data.rank?'<small>This run</small>':''}</li>`).join('');
   const qr=r.scene==='booth'?'<div class="slice-board-qr"><img src="../arcade/knife-qr.svg" alt="" width="88" height="88" loading="lazy"><a href="./">Play on your phone</a></div>':'';
   return `${error}<details class="slice-board"><summary>Local leaderboard</summary><ol>${rows}</ol>${qr}</details>`;
  }
 }
 root.FuLamJourney={Run,UI,random,readBoard,saveBoard,VERSION,LIMIT,ROUND,BOOTH_ROUND,CHOICE,KNIFE_STAGES,KNIFE_OPTIONS,BOOTH_STAGES,BOOTH_STAGE_TIME,QUIZZES,quizFor,weaponProfile,survivalProfile,threatProfile,sceneInfo,drawScene};
})(typeof window==='undefined'?globalThis:window);
