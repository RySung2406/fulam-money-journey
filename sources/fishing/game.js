/* FuLam Catch — offline Canvas edition. Original gameplay and art; Kenney CC0 audio and Lucide icons.
   Fish formation layouts and placement adapted from imtonyjaa/ggemu-fishing-joy (MIT).
   No GGEMU SDK, external services, probabilistic payout tuning, or remote assets. */
(()=>{'use strict';
const $=id=>document.getElementById(id), canvas=$('game'), ctx=canvas.getContext('2d'), scene=$('scene'), overlay=$('overlay'), Art=window.FuLamArt;
const TAU=Math.PI*2, rnd=(a,b)=>a+Math.random()*(b-a), clamp=(v,a,b)=>Math.max(a,Math.min(b,v)), fmt=v=>Math.floor(v).toLocaleString('en-US');
const reduced=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const canvasPointers=new window.FuLamArcade.Pointers();
// Share the site's language choice while preserving the current game session.
let language='zh-Hant';try{language=localStorage.getItem('fulam-language')==='en'?'en':'zh-Hant'}catch{}
const journey=window.FuLamJourney?new window.FuLamJourney.UI('fishing',()=>language):null;
let energy=100;
function survival(){return window.FuLamJourney?.survivalProfile('fishing',journey?.run||{})||{max:100,multiplier:1,shieldBonus:0};}
const gameRandom=()=>journey?.run?.random()??Math.random();
const gameRnd=(a,b)=>a+gameRandom()*(b-a);
const translations={
 '連捕加成 +':'Combo bonus +','霜晶漁網':'Frost net','聲納標記':'Sonar tag','折射浮鏡':'Bank shot','漩流浮標':'Vortex buoy',
 '區域減速':'Slow zone','標記得分':'Tag bonus','彈道反射':'Ricochet','引魚聚集':'Group fish','自動補給 · 自動瞄準':'Auto-supply · Auto-target',
 '捕財遊戲畫面。點按、移動滑鼠或按左右鍵瞄準，炮台自動射擊。補給每五秒自動啟動並鎖定魚群。':'Fishing arena. Tap, move the mouse or use the arrow keys to aim. The cannon fires automatically. Supplies activate and target fish every five seconds.',
 '極光燈籠魚':'Aurora Anglerfish','霜晶河豚':'Frost Puffer','急速連射':'Rapid fire','霜晶慢速':'Frost slow',
 'U 說明 · P 暫停':'U guide · P pause',
 '能源耗盡便結算；捕魚可回復能源。每 30 秒選擇強化，U 查看炮台。':'Energy drains over time; catches refill it. Choose an upgrade every 30s; U opens the loadout guide.',
 '燈籠魚亮燈引魚 · 河豚受擊鼓起':'Anglerfish lure a school · Puffers inflate when hit',
 '捕魚補能源 · 回合升級 · 最高分挑戰':'Catch for energy · Round upgrades · High scores',
 '全螢幕':'Full screen','退出全螢幕':'Exit full screen','音效 /':'audio /','圖示':'icons','炮台升級與道具':'Cannon upgrades and skills','捕財道具':'Fishing skills','12 階炮台 · 回合強化 ·':'12 cannon levels ·',
 '退出':'Exit','返回選單':'Back to menu',
 '小目標 · 捕獲 10 條':'Goal · Catch 10 fish','定投單發 · 穩定射擊':'Steady single shot','捕財升級，解鎖更多道具。':'Upgrade to unlock more skills.','金幣 ×2':'Coins ×2','連射 ×2':'Rapid ×2','連射':'Fire',
 '捕財 · 連擊 · 升級':'Catch · Combo · Upgrade','準備就緒':'Ready','無限時':'No time limit','炮台':'Cannon','分數':'Score','秒':'s',
 '富臨錢進號':'The Money Journey','捕財達人':'FuLam Catch','投資海洋・無限挑戰':'Investment ocean · Endless play','個人最佳':'Personal best',
 '12 階炮台 · 回合強化':'4 cannons · round upgrades','炮台養成 · 12 級火力':'4 cannons · round upgrades','本局捕財':'SCORE','可用金幣':'Coins','捕獲':'Caught','無限暢玩':'Endless','自動連射':'automatic fire','移動滑鼠瞄準':'Move the mouse to aim','點按畫面瞄準':'Tap to aim','純遊戲積分':'Game points only','製作與授權':'Credits & licences','返回遊戲區':'Back to games',
 '暫停遊戲，鍵盤 P':'Pause game, press P','升級炮台，鍵盤 U':'Upgrade cannon, press U','玩法說明':'How to play','開關音效':'Toggle sound','關閉音效':'Mute sound','開啟音效':'Enable sound','暫停 · P':'Pause · P',
 '想捕幾耐，':'Catch for','就捕幾耐。':'as long as you like.','聖誕金鯨捕財賽':'Golden Whale Catch','點按魚群或移動滑鼠，炮台會持續朝該方向發射。連捕可加分，最後 15 秒挑戰金鯨。':'Tap a school or move the mouse to aim. Chain catches for bonus points and track the golden whale in the final 15 seconds.','HKU · 聖誕儲蓄灣':'HKU · CHRISTMAS COVE','聖誕本局成績':'FESTIVE SCORE','聖誕捕財完成':'Festive catch complete','瞄準大魚，炮台會自動連射。':'Aim at a fish. The cannon fires automatically.','捕魚補能源，升炮打大魚。':'Catch for energy. Evolve your cannon for bigger targets.','遊戲難度':'Difficulty','輕鬆':'Easy','標準':'Normal','Booth 中等':'Booth intermediate','挑戰':'Hard','開炮捕財':'Start fishing','01 · 無限時':'01 · NO TIME LIMIT','隨時暫停結算':'Pause and finish anytime','02 · 武器變形':'02 · EVOLVING WEAPONS','散射、大球、射線':'Spread, orbs and beams','03 · 海域升溫':'03 · RISING CHALLENGE','魚血量和速度漸增':'Fish get tougher and faster','魚種與武器是理財概念造型 · 分數不代表投資回報':'Financial themes are fictional · Scores are not investment returns',
 '遊戲已暫停':'Game paused','無限時，隨時繼續捕財。':'No time limit. Continue whenever you are ready.','本局':'This run','分 · 炮台 Lv.':'points · Cannon Lv.','繼續遊戲':'Resume','結算離場':'Finish run','結算後可重新開局 · 最佳分數已儲存':'Play again after finishing · Best score saved','滿載而歸！':'Great catch!','刷新個人最佳 · ':'New personal best · ','模式 · ':' · ','深海財神':'Ocean Tycoon','金庫大戶':'Vault Master','捕財高手':'Expert Fisher','新晉捕手':'New Fisher','捕獲魚數':'Fish caught','最高連擊':'Best combo','炮台等級':'Cannon level','今次捕財 ':'Played for ',' 分 ':' min ',' 秒。':' sec.','想玩隨時再出海。':'Come back to the ocean anytime.','重新開局':'Play again','返回遊戲首頁':'Game menu','最佳紀錄儲存在此瀏覽器 · 純遊戲積分':'Best score saved on this browser · Game points only','本局已結算，共 ':'Run complete: ',' 分，捕獲 ':' points, ',' 條。':' fish caught.',
 '無限捕財。':'Endless fishing.','炮台會自動連射。點按畫面或移動滑鼠即可改變方向。發射免費，無限時；想離場可按暫停，再選「結算離場」。':'The cannon fires automatically. Tap the screen or move the mouse to aim. Shots are free and there is no time limit. Pause and choose Finish run when you are done.',
 '金幣可升級 12 級炮台，唔會扣總積分。分散投資炮會散射、複利炮會發射穿透大球、長線炮會射出光束。海域每 45 秒升一級，魚會更耐打、更快；最高 16 級，沒有時間上限。':'Spend coins on 12 cannon levels without reducing your score. Upgrade to spread shots, piercing orbs and beams. The sea gets tougher every 45 seconds, up to level 16, with no time limit.',
 'ETF 魔鬼魚滑翔、股票魚走折線、槓桿快鯊突然衝刺，債券海龜則較慢但更耐打。造型只借用理財概念，不代表真實投資風險或回報。':'ETF rays glide, stock fish zigzag, sharks dash and bond turtles move slowly but have more health. These are game themes, not real investment risks or returns.',
 '範圍捕捉，冷卻 16 秒。':'Area damage; 16-second cooldown.','慢速 5 秒，冷卻 20 秒。':'Slows fish for 5 seconds; 20-second cooldown.','射速加倍 8 秒，冷卻 24 秒。':'Double fire rate for 8 seconds; 24-second cooldown.','捕魚收益加倍 8 秒，冷卻 30 秒。':'Double coins for 8 seconds; 30-second cooldown.','大範圍爆破，冷卻 28 秒。':'Large explosion; 28-second cooldown.','召喚高值魚群，冷卻 32 秒。':'Summon valuable fish; 32-second cooldown.','鍵盤：← → 調整方向':'Keyboard: ← → to aim','道具（亦可 1–4）':'skills (or 1–4)','升級':'upgrade','暫停':'pause','知道了':'Got it',
 '現金流單炮':'Cashflow Cannon','雙軌儲蓄':'Double Savings','分散投資':'Diversified Spread','複利能量球':'Compound Orb','複利增幅':'Compound Boost','長線光束':'Long-term Beam','資產配置':'Asset Allocation','複利重核':'Compound Core','長線聚焦':'Focused Beam','全球配置':'Global Allocation','平衡組合':'Balanced Portfolio','全域財富':'Total Wealth',
 '精準單發':'Single shot','雙管齊射':'Double shot','三路散射':'Three-way spread','穿透大球':'Piercing orb','爆破大球':'Blast orb','直線穿透':'Piercing beam','五路散射':'Five-way spread','巨球連爆':'Multi-blast orb','寬幅射線':'Wide beam','七路火網':'Seven-way spread','光束＋三球':'Beam + three orbs','巨球＋寬射線':'Orbs + wide beam',
 '現金金幣魚':'Cash Coinfish','儲蓄魚':'Savings Fish','基金魚':'Fund Fish','股票折線魚':'Stock Fish','金庫巨鯨':'Vault Whale','狂歡金鯨':'Carnival Golden Whale','槓桿快鯊':'Leveraged Shark','ETF 魔鬼魚':'ETF Manta Ray','債券海龜':'Bond Turtle','波動水母':'Volatility Jellyfish','黃金海馬':'Gold Seahorse',
 '狂歡金鯨入袋！':'Carnival golden whale caught!',
 '冰凍':'Freeze','狂熱連射':'Rapid Fire','雙倍金幣':'Double Coins','深海炸彈':'Bomb','黃金誘餌':'Golden Lure','範圍捕捉':'Area damage','慢速 5 秒':'Slow for 5s','加速 8 秒':'Faster for 8s','雙倍 8 秒':'Double for 8s','大範圍爆破':'Area blast','召喚高值魚群':'Summon valuable fish',
 '無限時捕財 · U 升級可改變攻擊方式':'No time limit · Press U to change your weapon','冰凍時間 · 5 秒慢速捕財':'Freeze · Fish slowed for 5s','狂熱連射 · 8 秒雙倍射速':'Rapid Fire · Double speed for 8s','雙倍金幣 · 8 秒捕魚收益 ×2':'Double Coins · 2× coins for 8s','深海炸彈 · 魚群大豐收':'Bomb · Big catch!','黃金誘餌 · 高值魚群入場':'Golden Lure · Valuable fish incoming','魚群太多，捕幾條再放魚餌':'Too many fish. Catch some before using the lure.','金庫巨鯨入袋！':'Vault Whale caught!','槓桿快鯊擊破！':'Leveraged Shark caught!','捕財小目標完成 · +':'Goal complete · +',' 金幣就可以升級':' more coins needed to upgrade','再捕 ':'Catch ',' 金幣':' coins',' · 解鎖':' · unlocked ',' 解鎖':' unlock',' 秒生效':'s active',' 秒冷卻':'s cooldown','全部道具已解鎖 · 自由組合火力':'All skills unlocked','升級炮台，解鎖更多道具':'Upgrade the cannon to unlock skills','升級炮台':'Upgrade','已達最高等級':'Maximum level','海域 ':'Sea ',' · 獎勵 ':' · reward ','連捕加成 ×':'Combo bonus ×','第 ':'Wave ',' 波 · ':' · ','出現！':' appears!','魚群血量與速度提升':'fish health and speed increased',
 '富臨錢進號 · 投資海洋單機版 v3.0':'The Money Journey · Investment Ocean v3.0','沿用 Fishing Joy 的魚群編排程式，重製為 Canvas 遊戲。畫面、魚種、炮台及計分玩法為此版本重新製作。':'Fish formations adapted from Fishing Joy. Art, fish, cannons and scoring were remade for this Canvas game.','原始專案：':'Original project: ','授權：':'Licence: ','返回遊戲':'Back to game'
};
const transKeys=Object.keys(translations).sort((a,b)=>b.length-a.length), translationPattern=new RegExp(transKeys.map(key=>key.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')).join('|'),'g'), originalText=new WeakMap(),originalAttrs=new WeakMap();
function translated(zh){if(language!=='en'||!/[\u3400-\u9fff]/.test(zh))return zh;return zh.replace(translationPattern,key=>translations[key]);}
function localize(root){
 if(!root||!document.createTreeWalker)return;
 const walker=document.createTreeWalker(root,4);let node;
 while((node=walker.nextNode())){if(node.parentElement?.closest('script,style,pre,kbd'))continue;let rec=originalText.get(node);if(!rec||node.nodeValue!==rec.shown)rec={zh:node.nodeValue,shown:node.nodeValue};const next=translated(rec.zh);if(node.nodeValue!==next)node.nodeValue=next;rec.shown=next;originalText.set(node,rec)}
 if(root.querySelectorAll)for(const el of root.querySelectorAll('[aria-label],[title]'))for(const attr of ['aria-label','title'])if(el.hasAttribute(attr)){let rec=originalAttrs.get(el)||{};let item=rec[attr],current=el.getAttribute(attr);if(!item||current!==item.shown)item={zh:current,shown:current};const next=translated(item.zh);if(current!==next)el.setAttribute(attr,next);item.shown=next;rec[attr]=item;originalAttrs.set(el,rec)}
 for(const id of ['languageSwitch','languageGame']){const switcher=$(id);if(switcher){switcher.textContent=language==='en'?'繁中':'English';switcher.setAttribute('aria-label',language==='en'?'Switch to Traditional Chinese':'Switch to English')}}
 const modalSwitch=$('languageModal');if(modalSwitch){modalSwitch.textContent=language==='en'?'繁中':'English';modalSwitch.setAttribute('aria-label',language==='en'?'Switch to Traditional Chinese':'Switch to English')}
 document.documentElement.lang=language;document.title=language==='en'?'FuLam Catch · The Money Journey':'捕財達人 · 富臨錢進號';
}
function toggleLanguage(){language=language==='en'?'zh-Hant':'en';try{localStorage.setItem('fulam-language',language)}catch{}localize(document.body);updateHud();if(mode==='help')showSkillHelp();if(journey&&mode==='welcome'){showWelcome();}}

let w=1000,h=600,dpr=1,mode='welcome',difficulty='normal',last=0,time=0,round=0,score=0,wallet=0,caught=0,shots=0,hits=0,level=1,combo=0,maxCombo=0,lastCatch=-10,missionIndex=0,bossSpawned=0,nextBossAt=20,saveClock=5,startingBest=0;
let fish=[],bullets=[],beams=[],particles=[],rings=[],floaters=[],coins=[],aim={x:500,y:240},keys=new Set(),shotClock=0,spawnClock=0,recoil=0,shake=0,hudClock=0,eventTime=0,sessionStarted=false;
let angle=-Math.PI/2,demoSpawn=0,modalReturn='welcome',oldFocus=null,toastTimeout,resultRecord=false;
let fishSerial=0,lastPressureTier=0,carnivalBossSpawned=false,reinforcementCredit=0;
// Each cost upgrades TO this level; the first cannon is free.
const cannons=[
 {name:'現金流單炮',kind:'single',label:'精準單發',cost:0,damage:1,spread:[0],interval:.16,speed:700},
 {name:'雙軌儲蓄',kind:'double',label:'雙管齊射',cost:80,damage:1.6,spread:[-.045,.045],interval:.17,speed:730},
 {name:'分散投資',kind:'spread',label:'三路散射',cost:180,damage:2,spread:[-.18,0,.18],interval:.19,speed:750},
 {name:'複利能量球',kind:'orb',label:'穿透大球',cost:300,damage:8,spread:[0],interval:.22,speed:470,pierce:2,blast:42},
 {name:'複利增幅',kind:'orb',label:'爆破大球',cost:450,damage:11,spread:[0],interval:.22,speed:490,pierce:3,blast:58},
 {name:'長線光束',kind:'beam',label:'直線穿透',cost:650,damage:18,spread:[0],interval:.25,speed:900,beamWidth:11},
 {name:'資產配置',kind:'spread',label:'五路散射',cost:900,damage:4,spread:[-.3,-.15,0,.15,.3],interval:.20,speed:810},
 {name:'複利重核',kind:'orb',label:'巨球連爆',cost:1200,damage:25,spread:[0],interval:.22,speed:540,pierce:5,blast:80},
 {name:'長線聚焦',kind:'beam',label:'寬幅射線',cost:1600,damage:32,spread:[0],interval:.25,speed:950,beamWidth:20},
 {name:'全球配置',kind:'spread',label:'七路火網',cost:2100,damage:5,spread:[-.42,-.28,-.14,0,.14,.28,.42],interval:.22,speed:870},
 {name:'平衡組合',kind:'hybrid',label:'光束＋三球',cost:2700,damage:20,beamDamage:30,spread:[-.20,0,.20],interval:.30,speed:580,pierce:3,blast:48,beamWidth:14},
 {name:'全域財富',kind:'hybrid',label:'巨球＋寬射線',cost:3400,damage:24,beamDamage:36,spread:[-.24,0,.24],interval:.25,speed:620,pierce:4,blast:64,beamWidth:24}
];
const maxLevel=cannons.length;
const itemDefs={
 freeze:{name:'霜晶漁網',hint:'區域減速',color:'#98e4ff',duration:3.5},
 rapid:{name:'聲納標記',hint:'標記得分',color:'#ffe38a',duration:6},
 bomb:{name:'折射浮鏡',hint:'彈道反射',color:'#c7b2ff',duration:5},
 lure:{name:'漩流浮標',hint:'引魚聚集',color:'#7df2c9',duration:4}
};
const fields={freeze:null,lure:null};
const supplyCycle=[];
const SUPPLY_INTERVAL=5;
let supplyCatch=null;
let supplyAge=0,scanPoints=0,mirrorTarget=null,mirrorTime=0,mirrorClock=0,sonarTime=0,sonarSlots=0,lastSupplyAt=0,suppliesTriggered=0;
const defs={
 coin:{name:'現金金幣魚',value:10,hp:3,size:20,speed:72,color:'#edb579',swim:'cruise'},
 save:{name:'儲蓄魚',value:20,hp:6,size:27,speed:60,color:'#3db87a',swim:'sine'},
 fund:{name:'基金魚',value:35,hp:9,size:32,speed:64,color:'#d47aa8',swim:'sine'},
 stock:{name:'股票折線魚',value:55,hp:12,size:34,speed:105,color:'#e85a4a',swim:'zigzag'},
 whale:{name:'金庫巨鯨',value:360,hp:34,size:72,speed:38,color:'#edb579',swim:'glide',boss:true},
 midas:{name:'狂歡金鯨',value:620,hp:24,size:96,speed:28,color:'#f0d878',swim:'glide',boss:true},
 shark:{name:'槓桿快鯊',value:240,hp:22,size:56,speed:140,color:'#7ab8d9',swim:'dash',boss:true},
 ray:{name:'ETF 魔鬼魚',value:95,hp:22,size:45,speed:74,color:'#4ec4a8',swim:'glide'},
 bond:{name:'債券海龜',value:65,hp:18,size:35,speed:43,color:'#7aaa5e',swim:'cruise'},
 crypto:{name:'波動水母',value:85,hp:15,size:32,speed:65,color:'#d070d0',swim:'pulse'},
 gold:{name:'黃金海馬',value:75,hp:14,size:31,speed:68,color:'#efbf4b',swim:'orbit'},
 lantern:{name:'極光燈籠魚',value:40,hp:7,size:31,speed:65,color:'#60efca',swim:'beacon',drop:'lure'},
 puffer:{name:'霜晶河豚',value:55,hp:10,size:34,speed:58,color:'#a9ddff',swim:'inflate',drop:'freeze'}
};
const modes={easy:{speed:.82,hp:.9,spawn:1.5,label:'輕鬆'},normal:{speed:1.05,hp:1.15,spawn:1.35,drain:.85,label:'標準'},booth:{speed:1.27,hp:1.375,spawn:1.1,drain:.95,label:'Booth 中等'},hard:{speed:1.35,hp:1.6,spawn:1.05,drain:1.25,label:'挑戰'}};
function pressureTier(){return journey?.run?journey.run.wave-1:Math.min(15,Math.floor(round/45));}
function laterBoothRound(){
 const run=journey?.run;
 return run?.scene==='booth' && run.wave>=2 && run.wave<=4;
}
function pressure(){if(journey?.run){const p=window.FuLamJourney.threatProfile(journey.run.wave);return {tier:pressureTier(),hp:p.health,speed:p.speed,density:p.density};}return {tier:pressureTier(),hp:1+pressureTier()*.12,speed:1+Math.min(.9,pressureTier()*.025)};}
const missions=[{n:10,bonus:50},{n:25,bonus:100},{n:45,bonus:180},{n:70,bonus:250},{n:100,bonus:400}];
let prefs={sound:true,best:{easy:0,normal:0,hard:0}};try{let p=JSON.parse(localStorage.getItem('fulam-catch-v1')||'null');if(p){prefs.sound=p.sound!==false;for(const k of ['easy','normal','hard'])prefs.best[k]=Math.max(0,Number(p.best?.[k])||0)}}catch(e){}
function save(){try{localStorage.setItem('fulam-catch-v1',JSON.stringify(prefs))}catch(e){}}
const soundscape=new window.FuLamArcade.Audio(prefs.sound),fx=new window.FuLamArcade.Effects(reduced);
function initAudio(){void soundscape.unlock()}
function sound(kind){soundscape.play(kind)}
function syncSound(){$('soundGame').setAttribute('aria-pressed',String(prefs.sound));$('soundGame').setAttribute('aria-label',prefs.sound?'關閉音效':'開啟音效');$('soundGame').classList.toggle('muted',!prefs.sound);$('sound').setAttribute('aria-label',prefs.sound?'關閉音效':'開啟音效');$('sound').setAttribute('aria-pressed',String(prefs.sound));$('soundWaves').setAttribute('d',prefs.sound?'M15 8a6 6 0 0 1 0 8m3-11a10 10 0 0 1 0 14':'m16 9 6 6m0-6-6 6')}
function resize(){
 const box=scene.getBoundingClientRect(),ow=w,oh=h;
 w=Math.max(1,Math.round(box.width));h=Math.max(1,Math.round(box.height));dpr=Math.min(devicePixelRatio||1,2);
 canvas.width=Math.round(w*dpr);canvas.height=Math.round(h*dpr);ctx.setTransform(dpr,0,0,dpr,0,0);
 if(ow&&oh){for(const f of fish){f.x*=w/ow;f.size=fishSize(f.type);f.baseY=clamp(f.baseY*h/oh,...swimBounds(f.size));f.y=f.baseY}
 for(const b of bullets){b.x*=w/ow;b.y*=h/oh}aim.x*=w/ow;aim.y*=h/oh}
 if(!sessionStarted)aim={x:w/2,y:h*.4};
}
new ResizeObserver(resize).observe(scene);
function origin(){return {x:w/2,y:h-55}}
function swimBounds(size=38){
 const lo=Math.min(h*.4,96+size*.72+12),hi=Math.max(lo,h-105-size*.7-12);return [lo,hi];
}
// Apply the size and durability adjustment only to touch-first devices.
function mobileFishing(){return matchMedia('(hover: none) and (pointer: coarse) and (max-width: 650px), (hover: none) and (pointer: coarse) and (max-height: 500px)').matches;}
function fishSize(type){
 const boss=!!defs[type].boss,base=defs[type].size*(boss?1.3:1.55)*(w<600?.9:1);
 const size=Math.min(base,w*(boss?.26:.16),h*.20)*(mobileFishing()?.9:1);
 return type==='midas'?Math.min(size,w*.155):size;
}
function whaleFlank(side,size){
 // The fully raised tail reaches 1.65 body units behind the whale.
 const inset=Math.max(w*.16,size*1.68+3);
 return side<0?inset:w-inset;
}
function fishLimit(){
 if(!journey)return w<600?30:42;
 const base=w<600?18:28;
 return laterBoothRound()?Math.round(base*1.2):base;
}
function mission(){
 if(missionIndex<missions.length)return {...missions[missionIndex],previous:missionIndex?missions[missionIndex-1].n:0};
 const extra=missionIndex-missions.length;return {n:150+extra*50,bonus:Math.min(1000,450+extra*50),previous:100+extra*50};
}
function persistBest(){if(journey)return;if(score>prefs.best[difficulty]){prefs.best[difficulty]=score;save()}}
function resetItems(){supplyCycle.length=0;supplyCatch=null;supplyAge=scanPoints=0;fields.freeze=fields.lure=mirrorTarget=null;mirrorTime=mirrorClock=sonarTime=sonarSlots=lastSupplyAt=suppliesTriggered=0;}
function activeSeconds(id){
 if(id==='bomb')return mirrorTime;
 if(id==='rapid')return sonarTime;
 return fields[id]?.left||0;
}
function visibleFish(f){return !f.dead&&f.x>-f.size&&f.x<w+f.size}
function spawn(type,opts={}){
 if(fish.filter(f=>!f.dead).length>=fishLimit())return false;
 const d=defs[type],dir=opts.dir||(gameRandom()<.5?1:-1),sz=fishSize(type),y=clamp(opts.y??gameRnd(...swimBounds(sz)),...swimBounds(sz)),boss=!!d.boss;
 // Boss durability grows gently in the opening four rounds, so the evolving
 // cannon can catch up. Early armour is removed in round three.
 const growth=opts.demo?1:(journey?.run&&boss?1+Math.min(3,pressureTier())*.08+Math.max(0,pressureTier()-3)*.16:(journey?1:(boss?1+(level-1)*.65:1+Math.pow(level-1,1.3)*.18))*pressure().hp);
 const elite=!!(journey?.run&&journey.run.wave>=3&&!boss&&(fishSerial+1)%4===0);
 const baseHp=Math.max(1,Math.round(d.hp*(elite?1.6:1)*(journey?.run&&boss&&!opts.demo&&type!=='midas'?2.5:1)*(opts.demo?1:modes[difficulty].hp)*growth));
 const waveHp=journey?.run?.wave===3&&!opts.demo?1.1:1;
 let hp=Math.ceil(baseHp*(mobileFishing()&&!opts.demo?1.1:1)*waveHp);
 // Apply the finale bonus after rounding the device-scaled whale HP.
 if(type==='midas'&&opts.carnival&&journey?.run){
  const growth=1+Math.min(3,pressureTier())*.08+Math.max(0,pressureTier()-3)*.16;
  const topWhale=Math.round(defs.whale.hp*2.5*(modes[difficulty].hp||1)*growth);
  const carnivalHp=Math.ceil(topWhale*1.4*(mobileFishing()?1.1:1));
  hp=Math.ceil(carnivalHp*1.5);
 }
 if(!opts.demo)hp=Math.ceil(hp*1.15);
 if(journey?.run&&!opts.demo){
  const stage=Math.min(3,Math.max(0,journey.run.wave-1));
  hp=Math.ceil(hp*(boss?1+stage*.035:[1,1.35,1.48,1.65][stage]));
  if(!boss)hp=Math.max(hp,[5,13,19,29][stage]);
 }
 if(!opts.demo)hp=Math.max(1,Math.round(hp*.9));
 if(!opts.demo&&laterBoothRound())hp=Math.round(hp*1.15);
 const value=Math.round(d.value*(boss?1+Math.min(1.5,(level-1)*.10):1));
 const armored=!!(journey?.run&&boss&&!opts.demo&&journey.run.wave<3&&type!=='midas');
 const bossSpeed=journey?.run&&boss&&!opts.demo?(type==='shark'?36:type==='midas'?22:26):d.speed;
 const patrolScale = journey?.run?.scene === 'booth' && boss && !opts.demo ? .8 : 1;
 fish.push({uid:++fishSerial,type,elite,armored,swim:d.swim,swimTime:0,x:opts.x??(dir===1?-sz*3:w+sz*3),y,baseY:y,size:sz,angle:dir===1?0:Math.PI,dir,speed:opts.speed??bossSpeed*patrolScale*(opts.demo?.55:modes[difficulty].speed*pressure().speed),phase:opts.phase??gameRnd(0,TAU),hp,maxHp:hp,damageCarry:0,chipHp:hp,value,hit:0,dead:false,age:0,seen:false,school:!!opts.school});return true;
}
function carnivalActive(){
 if(!journey?.run||journey.run.scene!=='booth'||journey.run.phase!=='play')return false;
 const left=(window.FuLamJourney.LIMIT||120)-journey.run.total;
 return left>0&&left<=15;
}
function spawnCarnivalBoss(){
 if(carnivalBossSpawned||!carnivalActive())return false;
 if(fish.some(f=>!f.dead&&f.type==='midas')){carnivalBossSpawned=true;return false;}
 fish=fish.filter(f=>!defs[f.type].boss);
 if(fish.filter(f=>!f.dead).length>=fishLimit()){const i=fish.findIndex(f=>!defs[f.type].boss);if(i>=0)fish.splice(i,1);}
 const side=gameRandom()<.5?-1:1;
 if(!spawn('midas',{x:whaleFlank(side,fishSize('midas')),y:h*.54,dir:-side,carnival:true}))return false;
 carnivalBossSpawned=true;
 const whale=fish[fish.length-1];
 whale.tide={phase:'wait',left:1.5,duration:0,damage:0,target:0,side};
 rings.push({x:whale.x,y:whale.y,end:whale.size*1.9,life:.95,max:.95,color:'#ffcf78',blast:true});
 sound('finalBoss');
 notify(journey.text('金鯨甩尾！瞄準鯨身，打斷巨浪','Tail slap! Aim at the whale to break its wave'),2.4);
 return true;
}
function updateWhaleTide(whale,dt){
 const tide=whale.tide;
 tide.left-=dt;
 if(tide.left>0)return;
 const enraged=tide.enraged;
 if(tide.phase==='wait'){
  tide.phase='charge';tide.left=tide.duration=enraged?1.85:2.5;
  tide.damage=0;tide.target=enraged?22:16;
  return;
 }
 const loss=enraged?24:18;
 energy=Math.max(0,energy-loss*survival().multiplier);
 combo=0;lastCatch=-10;
 tide.phase='surge';tide.left=1.35;tide.side*=-1;
 rings.push({x:whale.x,y:whale.y,end:Math.hypot(w,h),life:.95,max:.95,color:'#ffb67c',tide:true});
 floater(whale.x,whale.y-whale.size*.55,journey.text('巨浪','Wave')+' −'+Math.round(loss*survival().multiplier),'#ffb67c');
 sound('heavy');shake=reduced?0:4;
}
function spawnRoundBoss(){
 if(carnivalBossSpawned)return false;
 if(fish.some(f=>!f.dead&&defs[f.type].boss))return false;
 if(fish.filter(f=>!f.dead).length>=fishLimit()){const i=fish.findIndex(f=>!defs[f.type].boss);if(i>=0)fish.splice(i,1);}
 const wave=journey.run.wave,type=wave%2?'shark':'whale';
 if(!spawn(type,{x:w*(wave%2?.25:.75),dir:wave%2?1:-1,y:h*.42}))return false;
 bossSpawned++;sound('boss');
 notify(translated(defs[type].name)+' · '+journey.text(wave<3?'裝甲保護 · 第 3 回合破甲':'已破甲 · 集中火力！',wave<3?'Armoured · breaks in round 3':'Armour broken · focus fire!'),2.5);
 return true;
}
function school(demo=false){
 if(fish.filter(f=>!f.dead).length>fishLimit()-6)return;
 const dir=gameRandom()<.5?1:-1,types=['coin','coin','save','fund','bond'],type=types[Math.floor(gameRandom()*types.length)],kind=['line','wave','v','circle'][Math.floor(gameRandom()*4)],count=w<600?4:6,points=FuLamFormations.create(kind,count,w,h,dir,gameRandom),speed=defs[type].speed*(demo?.55:modes[difficulty].speed*pressure().speed);
 const [lo,hi]=swimBounds(fishSize(type)),ys=points.map(p=>p.y),minY=Math.min(...ys),maxY=Math.max(...ys),spread=maxY-minY,scale=Math.min(1,(hi-lo)/Math.max(1,spread)),center=clamp((minY+maxY)/2,lo+spread*scale/2,hi-spread*scale/2);
 for(const p of points)spawn(type,{x:p.x,y:center+(p.y-(minY+maxY)/2)*scale,dir,speed,phase:p.phase,school:true,demo});
}
function seedDemo(){fish=[];for(const type of ['coin','save','fund','lantern','ray','bond','crypto','gold','puffer'])spawn(type,{demo:true,x:rnd(0,w),y:rnd(110,Math.max(150,h-145))});spawn('whale',{demo:true,x:w*.8,y:h*.35,dir:-1})}
function spawnOrdinaryWave(){
 if(fish.length>=fishLimit())return;
 const first=fish.length;
 if(gameRandom()<.24)school();
 else{
  const pool=['coin','coin','save','fund','stock','ray','bond','crypto','gold','lantern','puffer',...(journey?[]:['shark'])];
  spawn(pool[Math.floor(gameRandom()*pool.length)]);
 }
 if(!laterBoothRound()||fish.length===first)return;
 // One extra swimmer for every five regular arrivals; a full school counts fish by fish.
 reinforcementCredit+=fish.length-first;
 let leader=fish[first];
 while(reinforcementCredit>=5){
  const joined=spawn(leader.type,{dir:leader.dir,x:leader.x-leader.dir*leader.size*1.3,y:leader.y+leader.size,speed:leader.speed,phase:leader.phase+1.3,school:leader.school});
  if(!joined)break;
  leader=fish[fish.length-1];
  reinforcementCredit-=5;
 }
}
function notify(msg,seconds=2){$('event').textContent=msg;$('event').classList.add('visible');eventTime=seconds;$('live').textContent=msg;localize(document.body)}
function toast(msg){$('toast').textContent=msg;$('toast').classList.add('on');clearTimeout(toastTimeout);toastTimeout=setTimeout(()=>$('toast').classList.remove('on'),2200);localize(document.body)}
const welcomeIcon='<div class="welcome-icon" aria-hidden="true"><svg viewBox="0 0 90 75"><defs><linearGradient id="goldg" x2=".8" y2="1"><stop stop-color="#ffeca6"/><stop offset="1" stop-color="#d1a84e"/></linearGradient></defs><path d="M10 36C29 12 57 14 70 29L84 19 81 50 69 43C48 64 21 54 10 36Z" fill="url(#goldg)"/><path d="m30 23 9-13 13 9m-22 32 12 14 10-12" fill="#ba8a38"/><circle cx="26" cy="32" r="4" fill="#174444"/><circle cx="25" cy="31" r="1.3" fill="white"/><path d="M50 26v23M55 29h-8a5 5 0 0 0 0 9h6a5 5 0 0 1 0 9h-9" fill="none" stroke="#846124" stroke-width="2.8" stroke-linecap="round"/><path d="M8 63q7-6 16 0t16 0t16 0t16 0" fill="none" stroke="#9be8cf" stroke-width="2"/></svg></div>';
function openModal(html){scene.classList.toggle('showing-result',mode==='ended'&&!!journey);oldFocus=document.activeElement;canvasPointers.clear();keys.clear();overlay.innerHTML='<div class="card"><button type="button" class="modal-language" id="languageModal">English</button>'+html+'</div>';overlay.hidden=false;const langButton=$('languageModal');if(langButton)langButton.onclick=toggleLanguage;localize(document.body);requestAnimationFrame(()=>{const first=overlay.querySelector('[data-autofocus]')||overlay.querySelector('button');first?.focus({preventScroll:true})})}
function closeModal(){scene.classList.remove('showing-result');overlay.hidden=true;overlay.innerHTML='';canvas.focus({preventScroll:true})}
function showWelcome(){
 document.body.classList.add('welcome-screen');
 scene.classList.remove('showing-result');journey?.close();if(journey?.status)journey.status.hidden=true;scene.classList.remove('journey-live');
 fx.clear();soundscape.stop();mode='welcome';sessionStarted=false;$('pause').disabled=true;document.body.classList.remove('game-active');resetItems();score=wallet=caught=round=0;level=1;combo=0;missionIndex=0;bullets=[];beams=[];particles=[];rings=[];floaters=[];coins=[];eventTime=0;seedDemo();
 openModal(welcomeIcon+'<div class="label">FULAM · ENDLESS FISHING</div><h2 id="dialogTitle">想捕幾耐，<br> <em>就捕幾耐。</em></h2><p>瞄準大魚，炮台會自動連射。<br>捕魚補能源，升炮打大魚。</p><div class="difficulty" role="group" aria-label="遊戲難度"><button data-diff="easy">輕鬆</button><button data-diff="normal">標準</button><button data-diff="hard">挑戰</button></div><button class="primary" id="start" data-autofocus>開炮捕財 <span aria-hidden="true">↗</span></button><div class="how"><span><b>01 · 無限時</b>隨時暫停結算</span><span><b>02 · 武器變形</b>散射、大球、射線</span><span><b>03 · 海域升溫</b>魚血量和速度漸增</span></div><div class="micro">魚種與武器是理財概念造型 · 分數不代表投資回報</div>');
 overlay.querySelectorAll('[data-diff]').forEach(b=>{b.classList.toggle('selected',b.dataset.diff===difficulty);b.setAttribute('aria-pressed',String(b.dataset.diff===difficulty));b.onclick=()=>{difficulty=b.dataset.diff;overlay.querySelectorAll('[data-diff]').forEach(e=>{e.classList.toggle('selected',e===b);e.setAttribute('aria-pressed',String(e===b))});updateHud()}});$('start').onclick=prepareStart;if(journey){const container=document.createElement('div');overlay.querySelector('.difficulty').replaceWith(container);journey.settings(container,d=>{difficulty=d==='intermediate'?'booth':d==='challenge'?'hard':'normal';});overlay.querySelector('.card')?.classList.add('festive-card');overlay.querySelector('.card>.label').textContent=journey.text('HKU · 聖誕儲蓄灣','HKU · CHRISTMAS COVE');$('dialogTitle').textContent=journey.text('聖誕金鯨捕財賽','Golden Whale Catch');const intro=overlay.querySelector('.card>p');if(intro)intro.textContent=journey.text('點按魚群或移動滑鼠，炮台會持續朝該方向發射。連捕可加分，最後 15 秒挑戰金鯨。','Tap a school or move the mouse to aim. Chain catches for bonus points and track the golden whale in the final 15 seconds.');}updateHud();
}
function prepareStart(){document.body.classList.remove('welcome-screen');if(!journey){start();return;}closeModal();document.body.classList.add('game-active');resize();if(journey.scene==='booth')start();else journey.guide(scene,start,showWelcome);}
function start(){
 if(journey?.station && !journey.station.begin())return;
 document.body.classList.remove('welcome-screen');
 if(journey){journey.start(scene);scene.classList.add('journey-live');energy=100;difficulty=journey.run.difficulty==='intermediate'?'booth':journey.run.difficulty==='challenge'?'hard':'normal';}
 fx.clear();initAudio();mode='playing';sessionStarted=true;round=0;score=wallet=caught=shots=hits=0;level=1;combo=maxCombo=0;lastCatch=-10;missionIndex=0;bossSpawned=0;carnivalBossSpawned=false;nextBossAt=20;saveClock=5;startingBest=journey?journey.best():prefs.best[difficulty];resultRecord=false;lastPressureTier=0;
 fish=[];bullets=[];beams=[];particles=[];floaters=[];coins=[];rings=[];resetItems();shotClock=0;spawnClock=.5;canvasPointers.clear();keys.clear();aim={x:w/2,y:h*.35};angle=-Math.PI/2;closeModal();document.body.classList.add('game-active');
 if(journey)nextBossAt=8;
 fishSerial=0;reinforcementCredit=0;
 const starters=['coin','lantern','save','fund','coin','puffer','gold','crypto','stock','bond'];
 for(let i=0;i<(journey?6:starters.length);i++)spawn(starters[i],journey?{x:w*(.17+.33*(i%3)),y:h*(.35+.25*Math.floor(i/3))}:{x:gameRnd(w*.06,w*.94)});
 notify(journey?'燈籠魚亮燈引魚 · 河豚受擊鼓起':'無限時捕財 · U 升級可改變攻擊方式',3);updateHud();
}
function pause(){
 if(mode!=='playing')return;persistBest();mode='paused';soundscape.stop();
 openModal('<div class="label">GAME PAUSED</div><h2 id="dialogTitle">遊戲已暫停</h2><p>無限時，隨時繼續捕財。<br>本局 '+fmt(score)+' 分 · 炮台 Lv.'+level+'</p><button class="primary" id="resume" data-autofocus>繼續遊戲</button><button class="journey-exit" id="finishSession">結算離場</button><div class="micro">結算後可重新開局 · 最佳分數已儲存</div>');
 $('resume').onclick=resume;$('finishSession').onclick=()=>finish();updateHud();
}
function resume(){mode='playing';closeModal();initAudio();updateHud()}
function finish(commit=true){
 mode='ended';journey?.close();canvasPointers.clear();keys.clear();if(commit){resultRecord=score>startingBest;persistBest();sound('end')}
 const rank=score>=20000?'深海財神':score>=8000?'金庫大戶':score>=2000?'捕財高手':'新晉捕手';
 if(!journey)openModal('<div class="label">YOUR CATCH OF THE DAY</div><h2 id="dialogTitle">滿載而歸！</h2><div class="result-score">'+fmt(score)+'</div><div class="badge">'+(resultRecord?'刷新個人最佳 · ':modes[difficulty].label+'模式 · ')+rank+'</div><div class="result-grid"><div><b>'+caught+'</b><span>捕獲魚數</span></div><div><b>'+maxCombo+'</b><span>最高連擊</span></div><div><b>Lv.'+level+'</b><span>炮台等級</span></div></div><p>今次捕財 '+Math.floor(round/60)+' 分 '+Math.floor(round%60)+' 秒。<br>想玩隨時再出海。</p><button class="primary" id="again" data-autofocus>重新開局</button><button class="journey-exit" id="home">返回遊戲首頁</button><div class="micro">最佳紀錄儲存在此瀏覽器 · 純遊戲積分</div>');
 if(journey){const result=journey.result(score,{caught,maxCombo},journey.run.reason||'finish');openModal('<div class="result-heading"><div><div class="label">'+journey.text('聖誕本局成績','FESTIVE SCORE')+'</div><h2 id="dialogTitle">'+journey.text('聖誕捕財完成','Festive catch complete')+'</h2></div><div class="result-score">'+fmt(score)+'</div></div><p class="result-meta">'+journey.text('第 '+journey.run.wave+' / 4 回合 · 捕獲 '+caught+' 條 · 最高連捕 '+maxCombo,'Round '+journey.run.wave+' / 4 · '+caught+' catches · Best combo '+maxCombo)+'</p>'+result+'<div class="result-actions"><button class="primary" id="again" data-autofocus>'+journey.text('再玩一次','Play again')+'</button><button class="journey-exit" id="home">'+journey.text('返回選單','Menu')+'</button></div>');overlay.querySelector('.card')?.classList.add('festive-card');}
 $('again').onclick=prepareStart;$('home').onclick=showWelcome;$('live').textContent='本局已結算，共 '+score+' 分，捕獲 '+caught+' 條。';updateHud();
}
function help(){
 if(mode==='help'||mode==='credits'||mode==='upgrading')return;
 modalReturn=mode;mode='help';canvasPointers.clear();soundscape.stop();showSkillHelp();
}
function showSkillHelp(){
 const en=language==='en';
 const skills=en?['Slows a school','Scanning earns points. Tagged catches pay +50%.','Bounces a beam off the wall towards a fish','Gathers nearby fish']:['網內魚群減速','掃描即得分，捕獲標記魚另加五成','炮彈碰到側牆會反彈','將附近魚群捲向浮標'];
 const rows=Object.values(itemDefs).map((item,i)=>'<p><b>'+translated(item.name)+'</b> · '+skills[i]+'</p>').join('');
 openModal('<h2 id="dialogTitle">'+(en?'FuLam Catch':'捕財達人')+'</h2><p>'+(en?'Aim to fire. Supplies activate every five seconds and pick their own targets.':'瞄準即會開炮。補給每五秒自動啟動並鎖定魚群。')+'</p>'+rows+'<button id="helpClose" class="primary" data-autofocus>'+(en?'Back':'返回')+'</button>');
 $('helpClose').onclick=returnModal;
}
function returnModal(){if(modalReturn==='playing'){resume()}else if(modalReturn==='paused'){mode='playing';pause()}else if(modalReturn==='ended'){mode='ended';finishWithoutSound()}else showWelcome()}
function finishWithoutSound(){finish(false)}
function addParticles(x,y,color,n=15){n=reduced?Math.min(n,5):n;for(let i=0;i<n&&particles.length<250;i++){const a=rnd(0,TAU),s=rnd(25,150);particles.push({x,y,vx:Math.cos(a)*s,vy:Math.sin(a)*s,life:rnd(.3,.8),max:.8,r:rnd(1.5,4),color})}}
function floater(x,y,text,color='#ffe3a0',big=false){floaters.push({x,y,text,color,life:1.1,max:1.1,big});if(floaters.length>30)floaters.shift()}
function trySupply(){
 if(mode!=='playing'||supplyAge+1e-8<SUPPLY_INTERVAL)return;
 const catchFish=round-lastCatch<=1?supplyCatch:null;
 if(!supplyCycle.length)supplyCycle.push(...Object.keys(itemDefs));
 const affinity=catchFish&&defs[catchFish.type].drop;
 const index=supplyCycle.includes(affinity)?supplyCycle.indexOf(affinity):Math.floor(gameRandom()*supplyCycle.length);
 const [kind]=supplyCycle.splice(index,1);
 supplyAge=Math.max(0,supplyAge-SUPPLY_INTERVAL);
 supplyCatch=null;lastSupplyAt=round;suppliesTriggered++;
 const from=catchFish||{x:w*.5,y:origin().y-muzzleLength};
 deploySkill(kind,from);
 const item=itemDefs[kind],name=translated(item.name);
 const target=fields[kind]||(kind==='bomb'?mirrorTarget:fish.find(f=>!f.dead&&f.tagged>0))||from;
 floater(from.x,Math.max(30,from.y-42),name,item.color);
 $('live').textContent=name;
 rings.push({x:from.x,y:from.y,end:45,life:.7,max:.7,color:item.color,stars:true});
 if(coins.length<180)coins.push({kind,sx:from.x,sy:from.y,tx:target.x,ty:target.y,age:0,delay:0,life:.65,vx:0});
}
function capture(f){
 if(f.dead)return;f.dead=true; if(journey)energy=Math.min(survival().max,energy+(f.type==='midas'?22:f.type==='whale'?18:f.type==='shark'?10:Math.min(5,.8+f.value/35)));caught++;combo=round-lastCatch<2.6?combo+1:1;lastCatch=round;maxCombo=Math.max(maxCombo,combo);
 const mult=1+Math.min(1,Math.floor(combo/5)*.15),tagBonus=f.tagged>0?Math.round(f.value*.5):0,gain=Math.round(f.value*mult)+tagBonus;score+=gain;wallet+=gain;
 if(tagBonus)rings.push({x:f.x,y:f.y,end:50,life:.7,max:.7,color:itemDefs.rapid.color,stars:true});
 const heavy=f.type==='whale'||f.type==='shark'||f.type==='midas';
 if(f.tide)rings.push({x:f.x,y:f.y,end:Math.min(w*.42,180),life:1.05,max:1.05,color:'#ffe9a1',stars:true});
 fx.burst(f.x,f.y,{color:defs[f.type].color,size:f.size*.7,water:true,heavy});if(['bond','crypto'].includes(f.type)){fx.shatter(f.x,f.y,defs[f.type].color,f.size*.4);sound('crack');}if(f.type==='midas')fx.jellyburst(f.x,f.y,42);rings.push({x:f.x,y:f.y,r:10,end:f.size*2.3,life:.45,max:.45,color:defs[f.type].color,net:false});floater(f.x,f.y-15,'+'+gain,defs[f.type].color,heavy);
 if(combo>=5&&combo%5===0){
  rings.push({x:f.x,y:f.y,end:Math.min(92,f.size*1.8),life:.55,max:.55,color:'#ffdf85',stars:true});
  floater(f.x,Math.max(30,f.y-f.size*.75),combo+' COMBO','#ffdf85',true);
 }
 supplyCatch={type:f.type,x:f.x,y:f.y};
 if(heavy||combo>=3){
  const amount=reduced?1:Math.min(3,Math.ceil(gain/50));
  for(let i=0;i<amount&&coins.length<180;i++)coins.push({kind:'coin',sx:f.x,sy:f.y,age:0,delay:i*.05,life:.7,spin:rnd(0,TAU),vx:rnd(-50,50)});
 }
 sound(combo>=5&&combo%5===0?'combo':'coin');if(heavy){notify(f.type==='midas'?'狂歡金鯨入袋！':f.type==='whale'?'金庫巨鯨入袋！':'槓桿快鯊擊破！',2.5);shake=reduced?0:(f.type==='midas'?7:5);sound('heavy')}
 const m=mission();if(caught>=m.n){score+=m.bonus;wallet+=m.bonus;missionIndex++;notify('捕財小目標完成 · +'+m.bonus+' 金幣',2.5);sound('upgrade')}
}
function damage(f,amount,impact='direct',shotAim=angle){
 if(f.dead)return;
 let dealt=amount*(f.armored?.5:1),focused=true;
 if(f.tide){
  const o=origin();
  const offset=Math.abs((f.x-o.x)*Math.sin(shotAim)-(f.y-o.y)*Math.cos(shotAim));
  focused=impact==='direct'&&offset<=f.size*.68;
  if(!focused&&impact!=='bomb')dealt*=impact==='direct'?.55:.30;
 }
 if(f.type==='puffer'){
  if(f.puffTime>0)dealt*=.55;
  else if(!(f.puffCooldown>0)){f.puffTime=1;f.puffCooldown=3.2;}
 }
 // Carry fractional pellets and resistance between hits. The fish and its bar
 // both lose whole points, even when several weak splash hits arrive together.
 const accumulated=dealt+f.damageCarry;
 const points=Math.floor(accumulated+.5+1e-9);
 f.damageCarry=accumulated-points;
 f.hp=Math.max(0,f.hp-points);f.hit=.16;fx.hit(f.x,f.y,f.armored||f.puffTime>0?'#9cd9ff':'#c6f6e2');
 if(f.hp<=0){capture(f);return;}
 const tide=f.tide;
 if(tide?.phase==='charge'&&focused){
  tide.damage+=dealt;
  if(tide.damage>=tide.target){
   tide.phase='wait';tide.left=tide.enraged?1.8:2.5;
   score+=60;
   fx.shatter(f.x,f.y,'#a9ffed',f.size*.7);
   rings.push({x:f.x,y:f.y,end:f.size*1.3,life:.55,max:.55,color:'#adffec',stars:true});
   floater(f.x,Math.max(30,f.y-f.size*.6),journey.text('破浪 +60','Wave break +60'),'#adffec');
   sound('combo');return;
  }
 }
 sound('hit');
}
function blastImpact(x,y,radius,color,jelly=false){
 // Stacked shells can share one footprint, but distinct detonation centres need separate outlines.
 const mergeDistance=jelly?8:radius*.35;
 if(rings.some(r=>r.blast&&!!r.jelly===jelly&&r.life>.34&&Math.hypot(r.x-x,r.y-y)<mergeDistance))return;
 // Nearby shells keep their own damage outlines but share the spray of candy fragments.
 const showShards=jelly&&!rings.some(r=>r.showShards&&r.life>.23&&Math.hypot(r.x-x,r.y-y)<radius*.50);
 rings.push({x,y,r:0,end:radius,life:.48,max:.48,color,blast:true,jelly,showShards});
 if(!jelly)fx.burst(x,y,{color,size:Math.min(46,radius*.45),water:true,heavy:false});
 sound('blast');
}
// Swept segment collision is shared by fast bullets and instant penetrating beams.
function segmentFish(x1,y1,x2,y2,f,radius=0){
 const puff=f.puff||0;
 const cs=Math.cos(f.angle),sn=Math.sin(f.angle),rx=f.size*(f.tide?.95:1.15+puff*.15)+radius,ry=f.size*(f.type==='puffer'?.74+puff*.22:f.type==='ray'?.90:.63)+radius;
 const ax=((x1-f.x)*cs+(y1-f.y)*sn)/rx,ay=(-(x1-f.x)*sn+(y1-f.y)*cs)/ry;
 const bx=((x2-f.x)*cs+(y2-f.y)*sn)/rx,by=(-(x2-f.x)*sn+(y2-f.y)*cs)/ry;
 const dx=bx-ax,dy=by-ay,t=clamp(-(ax*dx+ay*dy)/(dx*dx+dy*dy||1),0,1);
 return Math.hypot(ax+dx*t,ay+dy*t)<=1?t:null;
}
const muzzleLength=74;
function shotOrigin(cannon,offset){
 const base=origin();
 const booth=journey?.run?.scene==='booth';
 const heading=booth?angle:angle+offset;
 const port=cannon.kind==='snowflake'?7:cannon.theme==='candycane'?11:0;
 // Extra trajectories share the two physical ports. The centre shot alternates sides.
 const side=port*(Math.sign(offset)||(shots%2===0?1:-1));
 const dx=Math.cos(heading),dy=Math.sin(heading);
 return {x:base.x+dx*muzzleLength-dy*side,y:base.y+dy*muzzleLength+dx*side};
}
function emitBeam(cannon,offset,amount=cannon.damage){
 const a=angle+offset,{x,y}=shotOrigin(cannon,offset);
 const dx=Math.cos(a),dy=Math.sin(a),length=Math.hypot(w,h)*1.25;
 const width=cannon.beamWidth||12,theme=cannon.theme||'',struck=new Set();
 function trace(x1,y1,x2,y2,reflected=false){
  beams.push({x:x1,y:y1,ex:x2,ey:y2,width,life:.19,max:.19,color:reflected?itemDefs.bomb.color:cannon.color||(level>=9?'#c7a5ff':'#8fece5'),theme:reflected?'':theme});
  if(beams.length>12)beams.shift();
  for(const f of fish)if(!struck.has(f.uid)&&visibleFish(f)&&segmentFish(x1,y1,x2,y2,f,width*.5)!==null){
   struck.add(f.uid);hits++;damage(f,amount,reflected?'splash':'direct',a);
   if(theme==='candycane')fx.candyburst(f.x,f.y,20);
  }
 }
 const wall=dx>0?w:0,travel=dx?(wall-x)/dx:Infinity,wallY=y+dy*travel;
 if(mirrorTime>0&&travel>=0&&travel<length&&wallY>0&&wallY<h){
  trace(x,y,wall,wallY);trace(wall,wallY,wall-dx*(length-travel),wallY+dy*(length-travel),true);
  fx.hit(wall,wallY,itemDefs.bomb.color);
 }else trace(x,y,x+dx*length,y+dy*length);
 shots++;
}
function boothSpread(base,trajectory,openStep,packedStep){
 const extra=Math.max(0,trajectory|0),count=Math.min(7,base+extra);
 if(count<=1)return [0];
 const gap=extra?(packedStep??.08):(openStep??.11);
 return Array.from({length:count},(_,i)=>(i-(count-1)/2)*gap);
}
// Offline play uses its own twelve-level loadout. Match the shared arcade boost.
const offlineCannons=cannons.map(base=>({
 ...base,damage:base.damage*1.42,beamDamage:base.beamDamage?base.beamDamage*1.42:undefined,interval:base.interval/1.5
}));
function currentCannon(){
 if(!journey?.run)return offlineCannons[level-1];
 const p=window.FuLamJourney.weaponProfile('fishing',journey.run);
 if(laterBoothRound())p.damage*=.8;
 const booth=journey.run.scene==='booth',shots=journey.run.trajectory||0;
 if(booth&&p.tier===1){const spread=boothSpread(2,shots,.1,.09);return {...p,name:journey.text('雙管雪花','Twin snowflake'),label:journey.text('雙管雪花','Twin snowflake'),kind:'snowflake',spread,count:spread.length,radius:5,reach:1,pierce:1,blast:0,speed:p.speed,color:'#eef8ff'};}
 if(booth&&p.tier===2){const spread=boothSpread(2,shots,.16,.08);return {...p,name:journey.text('糖杖雙聯','Candy cane'),label:journey.text('糖杖雙聯','Candy cane'),kind:'beam',theme:'candycane',spread,count:spread.length,beamWidth:8,pierce:p.pierce+1,blast:0,speed:p.speed,color:'#c23b3b'};}
 if(booth&&p.tier===3){const spread=boothSpread(2,shots,.1,.09);return {...p,name:journey.text('聖誕鈴鐺','Jingle bells'),label:journey.text('聖誕鈴鐺','Jingle bells'),kind:'bell',spread,count:spread.length,radius:16,reach:1,pierce:8,blast:0,speed:620,color:'#f0d878'};}
 if(booth&&p.tier>=4){
  const spread=boothSpread(2,shots,.1,.09);
  const name=journey.text('爆炸聖誕糖豆','Exploding jellybeans');
  return {...p,name,label:name,kind:'jelly',spread,count:spread.length,damage:p.damage*1.3225,
   radius:7,reach:1,pierce:1,blast:w<600?88.2:117.6,speed:680,color:'#e85a9a'};
 }
 const wide=booth?1.8:1;
 return {...p,name:journey.name(journey.run.weapon),label:journey.name(journey.run.weapon),kind:p.kind,beamWidth:8+p.stage,pierce:p.pierce+1,blast:(p.blast||0)*wide,speed:p.speed,color:p.color};
}
function fire(){
 if(mode!=='playing'||bullets.length>180)return;const o=origin(),cannon=currentCannon();
 if(cannon.kind==='beam'||cannon.kind==='hybrid')for(const offset of journey?cannon.spread:[0])emitBeam(cannon,offset,(cannon.beamDamage||cannon.damage)*(journey&&cannon.count===2?.65:journey&&offset!==0?.55:1));
 if(cannon.kind!=='beam')for(const spread of cannon.spread){
  const muzzle=shotOrigin(cannon,spread);
  const a=angle+spread,isOrb=cannon.kind==='orb'||cannon.kind==='hybrid'||cannon.kind==='bell';
  const torpedo=cannon.kind==='missile'||cannon.kind==='arc',reach=cannon.reach??(journey?.run?.scene==='booth'?1.8:1);
  bullets.push({reflect:mirrorTime>0,shotAim:angle,x:muzzle.x,y:muzzle.y,px:muzzle.x,py:muzzle.y,vx:Math.cos(a)*cannon.speed,vy:Math.sin(a)*cannon.speed,age:0,damage:cannon.damage*(journey&&cannon.count===2?.65:journey&&spread!==0?.55:1),color:cannon.kind==='jelly'?['#e76679','#62c7a6','#ffd478','#ea8bc7'][shots%4]:cannon.color,homing:cannon.homing||0,chain:cannon.chain||0,r:(cannon.radius||(isOrb?Math.min(24,12+level):torpedo?8:Math.min(6,3.8+level*.25)))*reach,kind:cannon.kind==='snowflake'?'snowflake':cannon.kind==='bell'?'bell':cannon.kind==='jelly'?'jelly':isOrb?'orb':torpedo?'missile':'bullet',pierce:journey?cannon.pierce:isOrb?cannon.pierce:1,blast:(journey?cannon.blast:isOrb?cannon.blast:0)*(torpedo?reach:1),hitIds:new Set(),exploded:false});
  shots++;
 }
 recoil=1;
 if(journey?.run?.scene!=='booth')fx.hit(o.x+Math.cos(angle)*muzzleLength,o.y+Math.sin(angle)*muzzleLength,cannon.color||'#ffdfa3');
 sound(cannon.kind==='beam'?'laser':cannon.kind==='orb'||cannon.kind==='bell'?'pierce':cannon.blast||cannon.kind==='jelly'?'burstShot':'fire');
}
function targetableFish(f){return !f.dead&&f.x>=0&&f.x<=w&&f.y>=0&&f.y<=h;}
function schoolCentre(field,id){
 const candidates=fish.filter(f=>targetableFish(f)&&(id!=='lure'||!defs[f.type].boss));
 let centre=null,best=-Infinity;
 for(const f of candidates){
  let weight=0;
  for(const other of candidates)if(Math.hypot(f.x-other.x,f.y-other.y)<field.radius*.9)weight++;
  // Favour the densest school, then the one nearest the catch.
  weight-=Math.hypot(f.x-field.x,f.y-field.y)/Math.hypot(w,h);
  if(weight>best){best=weight;centre=f;}
 }
 if(centre){field.x=centre.x;field.y=centre.y;field.seeking=false;}
}
function tagFish(){
 if(!sonarSlots)return;
 const targets=fish.filter(f=>targetableFish(f)&&!f.scanned)
  .sort((a,b)=>(b.value/Math.sqrt(Math.max(1,b.hp)))-(a.value/Math.sqrt(Math.max(1,a.hp)))).slice(0,sonarSlots);
 for(const f of targets){
  f.scanned=true;f.tagged=sonarTime;sonarSlots--;
  const bonus=clamp(Math.round(f.value*.2),2,12);
  score+=bonus;scanPoints+=bonus;
  floater(f.x,Math.max(24,f.y-f.size*.8),'+'+bonus,itemDefs.rapid.color);
  rings.push({x:f.x,y:f.y,end:f.size*1.45,life:.65,max:.65,color:itemDefs.rapid.color});
 }
}
function fireMirror(){
 const o=origin();
 const targets=fish.filter(targetableFish);
 if(!targets.length)return false;
 // Reflect the target across its nearest wall to find a physical two-leg route.
 const target=targets.reduce((best,f)=>f.hp/f.value<best.hp/best.value?f:best);
 const wall=target.x<w/2?0:w,virtualX=2*wall-target.x;
 const wallY=o.y+(target.y-o.y)*(wall-o.x)/(virtualX-o.x);
 mirrorTarget={x:target.x,y:target.y,wallX:wall,wallY};
 const shade=itemDefs.bomb.color;
 for(const [x,y,ex,ey] of [[o.x,o.y,wall,wallY],[wall,wallY,target.x,target.y]]){
  beams.push({x,y,ex,ey,width:4,life:.23,max:.23,color:shade});
  if(beams.length>12)beams.shift();
 }
 fx.hit(wall,wallY,shade);hits++;shots++;
 damage(target,currentCannon().damage,'splash');
 return true;
}
function deploySkill(id,from){
 const item=itemDefs[id];
 if(id==='rapid'){
  sonarTime=item.duration;sonarSlots=3;tagFish();
 }else if(id==='bomb'){
  mirrorTarget=null;mirrorTime=item.duration;mirrorClock=fireMirror() ? .85 : .12;
 }else{
  const field={x:clamp(from.x,0,w),y:clamp(from.y,...swimBounds(0)),radius:Math.min(w*.32,id==='lure'?185:135),left:item.duration,seeking:true};
  fields[id]=field;schoolCentre(field,id);
  rings.push({x:field.x,y:field.y,end:field.radius,life:.65,max:.65,color:item.color,net:id==='freeze'});
 }
 sound({freeze:'freeze',rapid:'lure',bomb:'laser',lure:'lure'}[id]);
}
function upgrade(){
 if(journey){if(mode==='playing')help();return;}
 if(mode!=='playing'||level>=maxLevel)return;const next=cannons[level],price=next.cost;
 if(wallet<price){toast('再捕 '+(price-wallet)+' 金幣就可以升級');return}
 wallet-=price;level++;sound('upgrade');shake=reduced?0:3;const o=origin();addParticles(o.x,o.y-20,'#ffe29a',32);
 notify('Lv.'+level+' '+next.name,3);updateHud();
}
function updateHud(){
 $('score').textContent=fmt(score);$('wallet').textContent=fmt(wallet);$('caught').textContent=caught;$('timer').textContent='∞';$('timerBox').classList.remove('urgent');$('best').textContent=fmt(Math.max(journey?journey.best():prefs.best[difficulty],score));
 $('level').textContent=translated('LV.'+level+' / '+maxLevel+' · '+cannons[level-1].name);const weaponMode=$('weaponMode');if(weaponMode)weaponMode.textContent=translated(cannons[level-1].label+' · 海域 '+(pressureTier()+1));$('pause').disabled=mode!=='playing';
 const activeSkills=Object.entries(itemDefs).filter(([id])=>activeSeconds(id)>0).map(([,item])=>translated(item.name));
 $('effectStatus').textContent=activeSkills.join(' · ');
 $('effectStatus').hidden=!activeSkills.length;
 const next=cannons[level];$('upgrade').disabled=mode!=='playing'||!next||wallet<next.cost;$('upgradeTitle').textContent=translated(next?'升級炮台':'已達最高等級');$('upgradePrice').textContent=translated(next?fmt(next.cost)+' 金幣 → Lv.'+(level+1):cannons[level-1].name+' · 巨球＋射線');
 if(journey?.run){$('timer').textContent=Math.ceil(energy/survival().max*100)+'%';$('timerBox').querySelector('small').textContent=journey.text('能源','ENERGY');$('timerBox').classList.toggle('urgent',energy<25);$('level').textContent=currentCannon().name;$('weaponMode').textContent='';$('upgrade').disabled=mode!=='playing';$('upgradeTitle').textContent=journey.text('玩法','Guide');$('upgrade').setAttribute('aria-label',journey.text('玩法說明，鍵盤 U','How to play, press U'));$('upgradePrice').textContent='';}
 const m=mission();$('missionLabel').textContent=translated('捕獲 '+caught+' / '+m.n+' · 獎勵 '+fmt(m.bonus));$('missionFill').style.width=clamp((caught-m.previous)/(m.n-m.previous)*100,0,100)+'%';
 if(journey?.run){$('missionLabel').textContent=journey.text('能源 ','ENERGY ')+Math.ceil(energy)+' / '+survival().max+(journey.run.protection?journey.text(' · 保護 ',' · Guard ')+Math.round((1-survival().multiplier)*100)+'%':'');$('missionFill').style.width=Math.min(100,energy/survival().max*100)+'%';$('missionFill').style.background=energy<25?'#f4a381':'#94dfc2';}
 $('combo').classList.toggle('show',combo>=3&&round-lastCatch<2.6&&mode==='playing');$('comboNum').textContent=combo+' COMBO';$('comboSub').textContent=translated('連捕加成 +'+Math.min(100,Math.floor(combo/5)*15)+'%');
 if(journey?.run?.scene==='booth' && carnivalBossSpawned){
  const whale=fish.find(f=>f.type==='midas'&&!f.dead);
  if(whale){
   const hp=Math.ceil(100*whale.hp/whale.maxHp);
   const tide=whale.tide,charging=tide?.phase==='charge';
   const name=tide?.enraged?journey.text('暴怒金鯨','Enraged whale'):journey.text('狂歡金鯨','Golden whale');
   $('missionLabel').textContent=charging?journey.text('鯨尾蓄力 · 瞄準鯨身','Tail slap · aim at whale')+' · '+Math.ceil(tide.left)+'s':name+' · '+hp+'%';
   $('missionFill').style.width=hp+'%';$('missionFill').style.background=charging||tide?.enraged?'#ff9578':'#ffcf74';
  }
 }
 $('event').classList.toggle('visible',eventTime>0&&mode==='playing');
}
function moveFish(dt,demo=false){
 const booth=journey?.run?.scene==='booth'&&!demo;
 for(const f of fish){
  f.age+=dt;f.tagged=Math.max(0,(f.tagged||0)-dt);
  const net=fields.freeze,netted=!demo&&net&&Math.hypot(f.x-net.x,f.y-net.y)<net.radius;
  const slow=netted?(defs[f.type].boss?.72:.18):1;f.swimTime+=dt*slow;
  const t=f.swimTime,phase=f.phase,profile=f.swim||defs[f.type].swim;
  let speedFactor=1,offset=0,tilt=0;
  if(profile==='dash'){
   const boothShark=booth&&f.type==='shark';
   const cycle=(t+phase)%(boothShark?5.4:3.6);
   f.dashing=cycle<.65;
   speedFactor=f.dashing?(boothShark?2:2.45):.68;
   const bob=t*(boothShark?1.35:1.7)+phase;
   offset=Math.sin(bob)*16;tilt=Math.cos(bob)*.08;
  }
  else if(profile==='zigzag'){offset=Math.asin(Math.sin(t*2.2+phase))*29;tilt=Math.cos(t*2.2+phase)>0?.20:-.20;}
  else if(profile==='glide'){offset=Math.sin(t*.8+phase)*(f.type==='ray'?38:18);tilt=Math.cos(t*.8+phase)*.1;}
  else if(profile==='pulse'){speedFactor=.65+(Math.sin(t*3+phase)+1)*.52;offset=Math.sin(t*2.4+phase)*28;tilt=Math.cos(t*2.4+phase)*.12;}
  else if(profile==='orbit'){speedFactor=1+Math.cos(t*2.1+phase)*.68;offset=Math.sin(t*2.1+phase)*32;tilt=Math.cos(t*2.1+phase)*.22;}
  else if(profile==='beacon'){
   const cycle=(t+phase)%4;
   f.luring=cycle>=1.4&&cycle<2.9;
   f.beacon=f.luring?.4+.6*Math.sin((cycle-1.4)*Math.PI/1.5):0;
   speedFactor=cycle<1.4?.7:cycle<2.9?.16:2.2;
   offset=Math.sin(t*1.35+phase)*12;
  }
  else if(profile==='inflate'){
   f.puffTime=Math.max(0,(f.puffTime||0)-dt*slow);
   f.puffCooldown=Math.max(0,(f.puffCooldown||0)-dt*slow);
   f.puff=clamp((f.puff||0)+(f.puffTime>0?6:-4)*dt*slow,0,1);
   speedFactor=1.35-f.puff*1.18;
   offset=Math.sin(t*1.9+phase)*12;
  }
  else if(profile==='sine'){offset=Math.sin(t*1.7+phase)*18;tilt=Math.cos(t*1.7+phase)*.08;}
  else{offset=Math.sin(t*.85+phase)*5;tilt=Math.cos(t*.85+phase)*.025;}
  if(f.tide){
   if(!f.tide.enraged&&(f.hp<=f.maxHp*.45||journey.run.total>=window.FuLamJourney.LIMIT-6)){
    f.tide.enraged=true;
    if(f.tide.phase==='wait')f.tide.left=Math.min(f.tide.left,1.35);
    notify(journey.text('金鯨暴怒 · 巨浪加快！','Whale enraged · faster waves!'),1.5);
   }
   if(f.tide.phase==='surge'){
    f.tide.left-=dt;
    if(f.tide.left<=0){f.tide.phase='wait';f.tide.left=f.tide.enraged?1.65:2.4;}
   }else{
    updateWhaleTide(f,dt);
   }
   // An interrupted wave leaves the whale on its current flank.
   const anchor=whaleFlank(f.tide.side,f.size),delta=anchor-f.x;
   const travel=w*dt*(f.tide.phase==='surge'?.54:.40)*slow;
   f.x+=clamp(delta,-travel,travel);
   f.dir=Math.abs(delta)>2?Math.sign(delta):-f.tide.side;
  }else{
   f.x+=f.dir*f.speed*dt*slow*speedFactor;
   if(journey?.run&&defs[f.type].boss&&!demo){const inset=Math.min(w*.28,f.size*1.1);if(f.x> w-inset&&f.dir===1){f.x=w-inset;f.dir=-1;}else if(f.x<inset&&f.dir===-1){f.x=inset;f.dir=1;}}
  }
  const buoy=fields.lure;
  if(buoy&&!demo&&!defs[f.type].boss){
   const dx=buoy.x-f.x,dy=buoy.y-f.baseY;
   if(Math.hypot(dx,buoy.y-f.y)<buoy.radius){
    const pull=1-Math.exp(-3.2*dt);f.x+=dx*pull;f.baseY=clamp(f.baseY+dy*pull,...swimBounds(f.size));
   }
  }
  f.y=clamp(f.baseY+offset,...swimBounds(f.size));f.angle=(f.dir===1?0:Math.PI)+tilt;
  f.chipHp=Math.max(f.hp,f.chipHp-f.maxHp*dt*.72);
  f.hit=Math.max(0,f.hit-dt);if(f.x>-f.size*2&&f.x<w+f.size*2)f.seen=true;
 }
 const lures=fish.filter(f=>f.luring&&visibleFish(f));
 if(lures.length)for(const f of fish){
  if(f.dead||(f.type!=='coin'&&f.type!=='save'&&f.type!=='fund'))continue;
  let closest=null,range=Math.min(165,w*.39);
  for(const lamp of lures){
   const d=Math.hypot(lamp.x-f.x,lamp.y-f.y);
   if(d<range){range=d;closest=lamp;}
  }
  if(!closest)continue;
  const pace=dt;
  const dx=closest.x-f.x,dy=closest.y-f.y;
  if(Math.abs(dx)>f.size*.8){f.dir=Math.sign(dx);f.angle=f.dir>0?0:Math.PI;}
  const turn=clamp(dy,-48*pace,48*pace);
  f.baseY=clamp(f.baseY+turn,...swimBounds(f.size));f.y=clamp(f.y+turn,...swimBounds(f.size));
 }
 fish=fish.filter(f=>!f.dead&&((f.dir===1&&f.x<w+f.size*4)||(f.dir===-1&&f.x>-f.size*4))&&f.age<65);
}
function step(dt,elapsed=dt){
 const playing=mode==='playing';
  if(playing){
  if(journey){energy=Math.max(0,energy-elapsed*((modes[difficulty].drain??.85)+Math.min(1.4,pressureTier()*.09))*survival().multiplier);if(energy<=0){if(journey.run.scene==='booth'){energy=survival().max;combo=0;notify(journey.text('應急儲備補滿能源','Emergency reserve refilled your energy'),2);}else{journey.run.finish('energy');finish();return;}}if(carnivalActive())spawnCarnivalBoss();}
  round+=elapsed;const tier=pressureTier();if(tier>lastPressureTier){lastPressureTier=tier;notify('海域 '+(tier+1)+' · 魚群血量與速度提升',2.8)}
  if(sonarSlots<3)sonarTime=Math.max(0,sonarTime-elapsed);
  if(sonarTime>0&&sonarSlots)tagFish();
  if(mirrorTarget)mirrorTime=Math.max(0,mirrorTime-elapsed);
  if(mirrorTime>0){mirrorClock-=elapsed;if(mirrorClock<=0)mirrorClock=fireMirror() ? .85 : .12;}
  eventTime=Math.max(0,eventTime-elapsed);
  for(const id of ['freeze','lure']){
   const field=fields[id];if(!field)continue;
   if(field.seeking)schoolCentre(field,id);
   else{field.left-=elapsed;if(field.left<=0)fields[id]=null;}
  }
  // The simulation step is bounded after a stalled frame, so supplies never arrive in a backlog.
  supplyAge+=dt;trySupply();
  saveClock-=elapsed;if(saveClock<=0){persistBest();saveClock=5}
  if(keys.has('ArrowLeft')||keys.has('ArrowRight')){angle=clamp(angle+(keys.has('ArrowLeft')?-1:1)*dt*1.7,-Math.PI+.16,-.16);const o=origin();aim={x:o.x+Math.cos(angle)*h*.65,y:o.y+Math.sin(angle)*h*.65}}
  else{const o=origin();angle=clamp(Math.atan2(Math.min(aim.y,o.y-24)-o.y,aim.x-o.x),-Math.PI+.16,-.16)}
  shotClock=Math.max(-.3,shotClock-dt);
  for(let burst=0;shotClock<=0&&burst<4;burst++){
   fire();
   shotClock+=currentCannon().interval;
  }
  spawnClock-=dt;if(spawnClock<=0){spawnClock=modes[difficulty].spawn*(1-Math.min(.4,(level-1)*.025+pressureTier()*.01))/(pressure().density||1);spawnOrdinaryWave();}
  if(round>=nextBossAt){
   if(journey){const spawned=spawnRoundBoss();nextBossAt=round+(spawned?14:2);}
   else{
   if(fish.filter(f=>!f.dead).length>=fishLimit()){const index=fish.findIndex(f=>f.type!=='whale'&&f.type!=='shark');if(index>=0)fish.splice(index,1)}
   const type=bossSpawned%2===0?'whale':'shark';
   if(spawn(type,{dir:bossSpawned%2===0?1:-1})){bossSpawned++;nextBossAt=round+32;notify('第 '+bossSpawned+' 波 · '+defs[type].name+'出現！',3);sound('boss');if(bossSpawned%3===0)school()}
   else nextBossAt=round+3;
   }
  }
  moveFish(dt);
  for(const b of bullets){
   if(b.homing){const target=fish.filter(f=>!f.dead&&!b.hitIds.has(f.uid)&&visibleFish(f)).sort((a,c)=>Math.hypot(a.x-b.x,a.y-b.y)-Math.hypot(c.x-b.x,c.y-b.y))[0];if(target){const speed=Math.hypot(b.vx,b.vy),angle=Math.atan2(target.y-b.y,target.x-b.x),blend=Math.min(1,dt*b.homing);b.vx+=(Math.cos(angle)*speed-b.vx)*blend;b.vy+=(Math.sin(angle)*speed-b.vy)*blend;}}
   b.px=b.x;b.py=b.y;b.x+=b.vx*dt;b.y+=b.vy*dt;b.age+=dt;
   if(b.reflect&&((b.x<0&&b.vx<0)||(b.x>w&&b.vx>0))){
    const wall=b.vx>0?w:0;
    b.y=b.py+(b.y-b.py)*clamp((wall-b.px)/(b.x-b.px),0,1);
    b.x=wall;b.vx*=-1;b.reflect=false;b.banked=true;
    fx.hit(wall,b.y,itemDefs.bomb.color);
   }
   for(const f of fish){
    if(f.dead||b.hitIds.has(f.uid))continue;
    const contact=segmentFish(b.px,b.py,b.x,b.y,f,b.r);
    if(contact!==null){
     const impactX=b.px+(b.x-b.px)*contact,impactY=b.py+(b.y-b.py)*contact;
     b.hitIds.add(f.uid);hits++;damage(f,b.damage,b.banked?'splash':'direct',b.shotAim);b.pierce--;
     if(b.kind==='snowflake')fx.snowburst(impactX,impactY,22);else if(b.kind==='bell')fx.bellburst(impactX,impactY,28);
     if(b.chain){const near=fish.filter(other=>other!==f&&!other.dead&&Math.hypot(other.x-f.x,other.y-f.y)<150).sort((a,c)=>Math.hypot(a.x-f.x,a.y-f.y)-Math.hypot(c.x-f.x,c.y-f.y)).slice(0,b.chain);for(const other of near){damage(other,b.damage*.25,'splash');beams.push({x:f.x,y:f.y,ex:other.x,ey:other.y,width:3,life:.16,max:.16,color:b.color});}b.chain=0;if(beams.length>24)beams.splice(0,beams.length-24);}
     if(b.blast&&!b.exploded){b.exploded=true;blastImpact(impactX,impactY,b.blast,b.color||'#d9b4ff',b.kind==='jelly');for(const other of fish)if(!other.dead&&other!==f&&Math.hypot(other.x-impactX,other.y-impactY)<b.blast+other.size*.5){damage(other,b.damage*(journey?.run?.scene==='booth'?.6:.45),'splash')}}
     else rings.push({x:impactX,y:impactY,r:3,end:30,life:.28,max:.28,color:'#c2f2e0',net:false});
     if(b.pierce<=0){b.dead=true;break}
    }
   }
  }
  bullets=bullets.filter(b=>!b.dead&&b.x>-30&&b.x<w+30&&b.y>-30&&b.y<h+20&&b.age<4);if(round-lastCatch>2.6)combo=0;
 }else if(mode==='welcome'){demoSpawn-=dt;if(demoSpawn<0){demoSpawn=2.7;school(true)}moveFish(dt,true)}
 if(playing||mode==='welcome'){
  fx.update(dt);
  for(const p of particles){p.life-=dt;p.x+=p.vx*dt;p.y+=p.vy*dt;p.vy+=75*dt}particles=particles.filter(p=>p.life>0);
  for(const beam of beams)beam.life-=dt;beams=beams.filter(beam=>beam.life>0);
  for(const r of rings)r.life-=dt;rings=rings.filter(r=>r.life>0).slice(-120);
  for(const f of floaters){f.life-=dt;f.y-=dt*35}floaters=floaters.filter(f=>f.life>0);
  for(const c of coins)c.age+=dt;coins=coins.filter(c=>c.age<c.life+c.delay);
  recoil=Math.max(0,recoil-dt*7);shake=Math.max(0,shake-dt*15);
 }
 hudClock-=dt;if(hudClock<=0){updateHud();hudClock=.09}
}
function drawSkillWater(){
 ctx.save();
 for(const id of ['freeze','lure']){
  const field=fields[id];if(!field)continue;
  const {x,y,radius}=field,swirl=id==='lure',tone=itemDefs[id].color;
  ctx.save();ctx.translate(x,y);ctx.strokeStyle=tone;ctx.fillStyle=tone;
  ctx.beginPath();ctx.arc(0,0,radius,0,TAU);ctx.globalAlpha=.07;ctx.fill();
  ctx.globalAlpha=.65;ctx.lineWidth=2;ctx.setLineDash([5,8]);ctx.stroke();ctx.setLineDash([]);ctx.clip();
  ctx.lineWidth=1.5;ctx.globalAlpha=.47;
  if(swirl){
   ctx.rotate(reduced?0:time*.7);
   for(let arm=0;arm<3;arm++){
    ctx.rotate(TAU/3);ctx.beginPath();ctx.moveTo(4,0);
    ctx.bezierCurveTo(radius*.15,-radius*.65,radius,-radius*.47,radius*.96,0);ctx.stroke();
   }
   ctx.beginPath();ctx.arc(0,0,5,0,TAU);ctx.fill();
  }else{
   for(let line=-radius*2;line<radius*2;line+=24){
    ctx.beginPath();ctx.moveTo(-radius,line-radius);ctx.lineTo(radius,line+radius);
    ctx.moveTo(-radius,line+radius);ctx.lineTo(radius,line-radius);ctx.stroke();
   }
  }
  ctx.restore();
 }
 if(mirrorTime>0){
  ctx.strokeStyle=itemDefs.bomb.color;ctx.lineWidth=5;ctx.globalAlpha=.8;
  for(const x of [3,w-3]){
   ctx.beginPath();ctx.moveTo(x,h*.12);ctx.lineTo(x,h*.87);ctx.stroke();
  }
 }
 ctx.restore();
}
// These sprites are drawn in local coordinates with the shot travelling towards +X.
function drawSnowflakeShot(b){
 const r=b.r*1.25;
 if(!reduced){
  ctx.fillStyle='#a8e6ff77';ctx.beginPath();ctx.moveTo(-r,-2);
  ctx.lineTo(-r-17,0);ctx.lineTo(-r,2);ctx.fill();
  ctx.rotate(b.age*4);
 }
 ctx.lineWidth=1.55;ctx.strokeStyle='#d4f5ff';ctx.lineCap='round';ctx.beginPath();
 for(let arm=0;arm<6;arm++){
  ctx.moveTo(0,0);ctx.lineTo(r,0);
  ctx.moveTo(r*.75,-r*.25);ctx.lineTo(r*.48,0);ctx.lineTo(r*.75,r*.25);
  ctx.rotate(TAU/6);
 }
 ctx.stroke();ctx.fillStyle='#fff';ctx.fillRect(-1.5,-1.5,3,3);
}
function drawBellShot(b){
 const r=b.r;
 // The travelling wavefronts stay perpendicular to the piercing bolt, even after a ricochet.
 ctx.strokeStyle='#ffe9a2';ctx.lineWidth=1.5;
 for(let i=0;i<(reduced?1:2);i++){
  ctx.globalAlpha=.7-i*.32;ctx.beginPath();
  ctx.ellipse(-r*(.9+i*.65),0,r*.22,r*(.6+i*.22),0,Math.PI*.45,Math.PI*1.55);ctx.stroke();
 }
 ctx.globalAlpha=1;ctx.fillStyle='#eebd58';ctx.strokeStyle='#fff0b0';ctx.lineWidth=1.4;
 ctx.beginPath();ctx.moveTo(-r*.64,0);
 ctx.bezierCurveTo(-r*.64,-r*.6,r*.17,-r*.45,r*.43,-r*.75);
 ctx.lineTo(r*.49,-r*.74);ctx.lineTo(r*.49,r*.74);
 ctx.bezierCurveTo(r*.1,r*.37,-r*.64,r*.61,-r*.64,0);ctx.fill();ctx.stroke();
 ctx.fillStyle='#885124';ctx.beginPath();ctx.ellipse(r*.49,0,r*.18,r*.71,0,0,TAU);ctx.fill();
 ctx.fillStyle='#ffe6a0';ctx.beginPath();ctx.arc(r*.65,0,r*.21,0,TAU);ctx.fill();
 ctx.fillStyle='#c94d55';ctx.fillRect(-r*.65,-r*.2,r*.16,r*.4);
}
function drawJellyShot(b){
 const r=b.r*1.26;
 if(!reduced){
  const wake=Math.min(1,b.age*12);
  const length=(11+r*1.45)*wake;
  // A tapering wake and two air pearls follow the shell's actual heading.
  ctx.fillStyle=b.color;ctx.globalAlpha=.38;ctx.beginPath();
  ctx.moveTo(-r*.7,-r*.38);
  ctx.quadraticCurveTo(-r-length*.45,-r*.09,-r-length,0);
  ctx.quadraticCurveTo(-r-length*.38,r*.18,-r*.7,r*.38);ctx.fill();
  ctx.strokeStyle='#d4fffa';ctx.lineWidth=1;ctx.globalAlpha=.58*wake;ctx.beginPath();
  for(let i=0;i<2;i++){
   const phase=(b.age*3+i*.5)%1, size=1.1+phase*.8;
   const x=-r-length*(.28+.76*phase), y=(i?1:-1)*r*(.22+.2*phase);
   ctx.moveTo(x+size,y);ctx.arc(x,y,size,0,TAU);
  }
  ctx.stroke();ctx.globalAlpha=1;
 }
 // A short brass fuse distinguishes candy shells from coins and score drops.
 ctx.fillStyle='#eabd79';ctx.fillRect(-r*1.07,-r*.32,r*.5,r*.64);
 ctx.fillStyle=b.color;ctx.strokeStyle='#ffedcf';ctx.lineWidth=1.15;
 ctx.beginPath();ctx.moveTo(-r*.77,-r*.18);
 ctx.bezierCurveTo(-r,-r*.96,r*.73,-r*1.13,r,r*.02);
 ctx.bezierCurveTo(r*1.04,r*.87,r*.29,r*.96,0,r*.6);
 ctx.bezierCurveTo(-r*.22,r*.32,-r*.66,r*.57,-r*.77,-r*.18);ctx.fill();ctx.stroke();
 ctx.strokeStyle='#fff2c3';ctx.lineWidth=1.6;ctx.beginPath();
 ctx.moveTo(r*.19,-r*.71);ctx.quadraticCurveTo(-r*.21,-r*.15,r*.24,r*.61);ctx.stroke();
 ctx.strokeStyle='#fff7ef';ctx.lineCap='round';ctx.beginPath();
 ctx.moveTo(-r*.48,-r*.36);ctx.quadraticCurveTo(0,-r*.7,r*.45,-r*.39);ctx.stroke();
}
function drawSugarShards(r,progress){
 const fade=1-progress,travel=reduced?.52:1-fade*fade;
 const count=reduced?3:6;
 const phase=(r.x*.053+r.y*.029)%TAU;
 for(let i=0;i<count;i++){
  const a=phase+TAU*i/count;
  const distance=r.end*(.08+travel*(i%2?.64:.76));
  const size=Math.min(8,r.end*.09)*(.72+(i%3)*.14)*(1-progress*.42);
  ctx.save();ctx.rotate(a);ctx.translate(distance,0);
  if(!reduced){
   // Small air pockets follow the broken sugar shell through the water.
   ctx.strokeStyle='#bbf6ef';ctx.lineWidth=1;ctx.globalAlpha=fade*.65;
   ctx.beginPath();ctx.arc(-4-size,2+size*.45,size*.35,0,TAU);ctx.stroke();
   ctx.rotate((i%2?1:-1)*progress*2);
  }
  ctx.globalAlpha=fade*.92;ctx.fillStyle=i%3===0?r.color:i%3===1?'#ffb1c1':'#8ed9bd';
  ctx.strokeStyle='#fff0cd';ctx.lineWidth=1.15;
  ctx.beginPath();ctx.moveTo(-size,-size*.28);
  ctx.quadraticCurveTo(0,-size*1.24,size,size*.14);
  ctx.lineTo(size*.41,size*.53);ctx.lineTo(0,size*.18);
  ctx.lineTo(-size*.57,size*.45);ctx.closePath();ctx.fill();ctx.stroke();
  ctx.restore();
 }
}
function drawJellyBlast(r,progress){
 const fade=1-progress;
 ctx.translate(r.x,r.y);ctx.strokeStyle=r.color;
 // Mark the full damage radius immediately. The shock front catches it while the outline is still visible.
 ctx.globalAlpha=fade*.61;ctx.lineWidth=1.4;ctx.beginPath();
 for(let i=0;i<8;i++){
  const a=i*TAU/8;
  ctx.moveTo(Math.cos(a)*r.end,Math.sin(a)*r.end);ctx.arc(0,0,r.end,a,a+TAU/16);
 }
 ctx.stroke();
 const front=reduced?r.end:r.end*(1-Math.pow(1-Math.min(1,progress/.68),2));
 ctx.beginPath();ctx.arc(0,0,front,0,TAU);
 ctx.fillStyle=r.color;ctx.globalAlpha=fade*.045;ctx.fill();
 ctx.strokeStyle='#ffedc1';ctx.lineWidth=1+fade*1.3;ctx.globalAlpha=fade*.74;ctx.stroke();
 if(!reduced){
  // Short mint crests trail the outer pressure wave.
  const wake=front*.82;
  ctx.globalAlpha=fade*.52;ctx.strokeStyle='#9de7d6';ctx.lineWidth=1.5;ctx.beginPath();
  for(let i=0;i<3;i++){
   const a=i*TAU/3+.14;
   ctx.moveTo(Math.cos(a)*wake,Math.sin(a)*wake);ctx.arc(0,0,wake,a,a+.63);
  }
  ctx.stroke();
 }
 if(r.showShards)drawSugarShards(r,progress);
 const core=reduced?8:Math.min(18,r.end*.19)*Math.max(0,1-progress/.48);
 if(core>0){
  ctx.globalAlpha=fade*(reduced?.48:.8);ctx.fillStyle='#fff1ce';
  ctx.beginPath();ctx.moveTo(0,-core);ctx.quadraticCurveTo(1,-2,core*.88,0);
  ctx.quadraticCurveTo(2,1,0,core*.8);ctx.quadraticCurveTo(-1,2,-core*.88,0);
  ctx.quadraticCurveTo(-2,-1,0,-core);ctx.fill();
 }
}
function draw(){ctx.setTransform(dpr,0,0,dpr,0,0);ctx.clearRect(0,0,w,h);ctx.save();if(shake&&!reduced)ctx.translate(rnd(-shake,shake),rnd(-shake,shake));if(journey)window.FuLamJourney.drawScene(ctx,w,h,'fishing',journey.run?.wave||1,time,reduced);else Art.drawBackground(ctx,w,h,time,reduced?.2:1);drawSkillWater();for(const f of fish){if(f.dead||f.x<-f.size*3||f.x>w+f.size*3)continue;Art.drawFish(ctx,f,time);if(f.tagged>0){
 const radius=f.size*1.25;ctx.save();ctx.translate(f.x,f.y);ctx.strokeStyle=itemDefs.rapid.color;ctx.lineWidth=2;
 for(let k=0;k<4;k++){ctx.rotate(Math.PI/2);ctx.beginPath();ctx.arc(0,0,radius,.15,.72);ctx.stroke();}
 ctx.restore();
}if(f.armored){ctx.strokeStyle='#9cd9ff88';ctx.lineWidth=2;ctx.beginPath();ctx.ellipse(f.x,f.y,f.size*1.15,f.size*.78,0,0,TAU);ctx.stroke();}if(f.elite){ctx.strokeStyle='#ffad79';ctx.lineWidth=2;ctx.beginPath();ctx.ellipse(f.x,f.y,f.size*1.15,f.size*.8,0,0,TAU);ctx.stroke();}if(mode!=='welcome'){const bw=Math.max(35,f.size*1.2),x=f.x-bw/2,y=f.y-f.size*.85;ctx.fillStyle='#001d28dd';ctx.beginPath();ctx.roundRect(x,y,bw,5,2);ctx.fill();if(f.chipHp>f.hp){ctx.fillStyle='#ffe4a4';ctx.fillRect(x,y,bw*Math.min(1,f.chipHp/f.maxHp),5);}ctx.fillStyle=defs[f.type].color;ctx.beginPath();ctx.roundRect(x,y,bw*Math.max(0,f.hp)/f.maxHp,5,2);ctx.fill();ctx.font='700 '+(w<600?10:11)+'px system-ui';ctx.textAlign='center';ctx.strokeStyle='#05232b';ctx.lineWidth=3;const hpText=f.hp+'/'+f.maxHp;ctx.strokeText(hpText,f.x,y-4);ctx.fillStyle='#f4ffef';ctx.fillText(hpText,f.x,y-4)}if(f.type==='whale'||f.type==='shark'||f.type==='midas'){ctx.font='600 '+(w<600?10:11)+'px system-ui';ctx.textAlign='center';ctx.fillStyle=defs[f.type].color;ctx.shadowColor='#001d28';ctx.shadowBlur=5;ctx.fillText(translated(defs[f.type].name)+(f.armored?' · '+journey.text('裝甲','ARMOUR'):' · '+f.value),f.x,f.y+f.size*.9+15);ctx.shadowBlur=0}}
for(const beam of beams){ctx.save();ctx.globalAlpha=clamp(beam.life/beam.max,0,1);ctx.lineCap='round';
 if(beam.theme==='candycane'){
  ctx.beginPath();ctx.moveTo(beam.x,beam.y);ctx.lineTo(beam.ex,beam.ey);
  ctx.strokeStyle='#ef697958';ctx.lineWidth=beam.width*2;ctx.stroke();
  ctx.strokeStyle='#df4354';ctx.lineWidth=beam.width;ctx.stroke();
  ctx.strokeStyle='#fff2db';ctx.lineWidth=beam.width*.68;ctx.lineCap='butt';
  ctx.setLineDash([12,12]);ctx.lineDashOffset=reduced?0:-(beam.max-beam.life)*160;ctx.stroke();
  ctx.setLineDash([]);ctx.strokeStyle='#fffdf3';ctx.lineWidth=1.3;ctx.stroke();
 }else{
  ctx.strokeStyle=beam.color;ctx.lineWidth=beam.width*2.2;ctx.shadowColor=beam.color;ctx.shadowBlur=20;ctx.beginPath();ctx.moveTo(beam.x,beam.y);ctx.lineTo(beam.ex,beam.ey);ctx.stroke();ctx.strokeStyle='#f2fffb';ctx.lineWidth=Math.max(2,beam.width*.38);ctx.stroke();
 }
 ctx.restore()}
for(const b of bullets){ctx.save();
 if(b.kind==='snowflake'||b.kind==='bell'||b.kind==='jelly'){
  ctx.translate(b.x,b.y);ctx.rotate(Math.atan2(b.vy,b.vx));
  if(b.kind==='snowflake')drawSnowflakeShot(b);
  else if(b.kind==='bell')drawBellShot(b);
  else drawJellyShot(b);
 }
 else{const orb=b.kind==='orb';ctx.strokeStyle=orb?'#ceabff99':'#ffdc7f55';ctx.lineWidth=orb?b.r:2;ctx.beginPath();ctx.moveTo(b.x-b.vx*(orb?.055:.024),b.y-b.vy*(orb?.055:.024));ctx.lineTo(b.x,b.y);ctx.stroke();ctx.fillStyle=b.color||(orb?'#bba1fc':'#fff1bd');ctx.shadowColor=orb?'#d9b3ff':'#ffd269';ctx.shadowBlur=orb?20:10;ctx.beginPath();ctx.arc(b.x,b.y,b.r,0,TAU);ctx.fill();if(orb){ctx.shadowBlur=0;ctx.strokeStyle='#f7ebff';ctx.lineWidth=2;ctx.beginPath();ctx.arc(b.x,b.y,b.r*.68,0,TAU);ctx.stroke();ctx.fillStyle='#fff8df';ctx.beginPath();ctx.arc(b.x-b.r*.23,b.y-b.r*.23,b.r*.25,0,TAU);ctx.fill()}}
 ctx.restore()}
for(const r of rings){const progress=1-r.life/r.max,rad=r.end*(1-Math.pow(1-progress,3)),alpha=r.life/r.max;ctx.save();ctx.globalAlpha=alpha;
 if(r.jelly){drawJellyBlast(r,progress);ctx.restore();continue;}
 if(r.tide){
  const crest=r.y+(h-r.y+24)*progress,waves=reduced?2:4;
  for(let band=0;band<2;band++){
   const y=crest+band*10;
   ctx.beginPath();ctx.moveTo(-2,y);
   for(let i=0;i<waves;i++){
    const a=i*w/waves,b=(i+1)*w/waves;
    ctx.bezierCurveTo(a+(b-a)*.28,y-19,a+(b-a)*.64,y+15,b,y);
   }
   ctx.strokeStyle=band?'#8de5e6':'#ffe0ab';ctx.lineWidth=band?2:4;ctx.stroke();
  }
  ctx.restore();continue;
 }
 if(r.stars){
  const count=r.max>1?12:6,travel=(reduced?.45:1)*rad;
  ctx.translate(r.x,r.y);ctx.fillStyle=r.color;
  for(let i=0;i<count;i++){
   const a=i*TAU/count,d=(i%2?.73:1)*travel;
   const x=Math.cos(a)*d,y=Math.sin(a)*d*.78,sz=(i%2?3:6)*(1-progress*.55);
   ctx.beginPath();ctx.moveTo(x,y-sz*1.6);ctx.lineTo(x+sz*.3,y-sz*.3);
   ctx.lineTo(x+sz,y);ctx.lineTo(x+sz*.3,y+sz*.3);ctx.lineTo(x,y+sz*1.6);
   ctx.lineTo(x-sz*.3,y+sz*.3);ctx.lineTo(x-sz,y);ctx.lineTo(x-sz*.3,y-sz*.3);ctx.closePath();ctx.fill();
  }
  ctx.restore();continue;
 }
 ctx.strokeStyle=r.color;ctx.lineWidth=r.blast?3:r.net?2:1.4;ctx.beginPath();ctx.arc(r.x,r.y,rad,0,TAU);ctx.stroke();if(r.blast){ctx.globalAlpha=alpha*.10;ctx.fillStyle=r.color;ctx.fill();ctx.globalAlpha=alpha*.7;ctx.lineWidth=1.5;ctx.beginPath();ctx.arc(r.x,r.y,rad*.72,0,TAU);ctx.stroke();}if(r.net){ctx.globalAlpha=alpha*.17;ctx.fillStyle=r.color;ctx.fill();ctx.globalAlpha=alpha*.65;ctx.beginPath();ctx.arc(r.x,r.y,rad,0,TAU);ctx.clip();ctx.lineWidth=1;for(let v=-rad*2;v<rad*2;v+=22){ctx.beginPath();ctx.moveTo(r.x-rad,r.y+v-rad);ctx.lineTo(r.x+rad,r.y+v+rad);ctx.stroke();ctx.beginPath();ctx.moveTo(r.x-rad,r.y+v+rad);ctx.lineTo(r.x+rad,r.y+v-rad);ctx.stroke()}}ctx.restore()}
for(const p of particles){ctx.globalAlpha=clamp(p.life/p.max,0,1);ctx.fillStyle=p.color;ctx.beginPath();ctx.arc(p.x,p.y,p.r,0,TAU);ctx.fill()}ctx.globalAlpha=1;
fx.draw(ctx);
const o=origin();if(mode==='playing'&&overlay.hidden){ctx.save();ctx.globalAlpha=.16;ctx.strokeStyle='#fff2c8';ctx.setLineDash([3,10]);ctx.beginPath();ctx.moveTo(o.x+Math.cos(angle)*(muzzleLength+6),o.y+Math.sin(angle)*(muzzleLength+6));ctx.lineTo(o.x+Math.cos(angle)*150,o.y+Math.sin(angle)*150);ctx.stroke();ctx.restore()}
const cannon=currentCannon();
Art.drawCannon(ctx,o.x,o.y,angle,journey?.run?Math.min(12,journey.run.weapon+1):level,recoil,time,cannon.theme||cannon.kind,reduced);
if(mode==='playing'&&journey?.run?.scene==='booth'){
 const distance=Math.min(Math.hypot(aim.x-o.x,aim.y-o.y),h*.85);
 const x=o.x+Math.cos(angle)*distance,y=o.y+Math.sin(angle)*distance;
 ctx.save();ctx.strokeStyle=carnivalBossSpawned?'#ffdf8d':'#b0ffeb';ctx.lineWidth=2;
 for(let i=0;i<4;i++){ctx.beginPath();ctx.arc(x,y,12,i*Math.PI/2+.16,i*Math.PI/2+1.08);ctx.stroke();}
 ctx.fillStyle='#fff5d0';ctx.beginPath();ctx.arc(x,y,2,0,TAU);ctx.fill();ctx.restore();
}
if(sessionStarted&&journey?.run?.protection){ctx.save();ctx.strokeStyle='#bcb2ff99';ctx.lineWidth=2;ctx.beginPath();ctx.arc(o.x,o.y,43,Math.PI,TAU);ctx.stroke();ctx.restore()}
for(const c of coins){
 if(c.age<c.delay)continue;
 const t=clamp((c.age-c.delay)/c.life,0,1),e=t*t,coin=c.kind==='coin',targetX=coin?55:c.tx,targetY=coin?47:c.ty;
 const x=c.sx+(targetX-c.sx)*e+Math.sin(t*Math.PI)*c.vx,y=c.sy+(targetY-c.sy)*e-Math.sin(t*Math.PI)*60;
 ctx.globalAlpha=1-t*.7;
 if(coin)Art.drawCoin(ctx,x,y,7,c.spin+time*9);
 else Art.drawSupply(ctx,x,y,c.kind);
}ctx.globalAlpha=1;
for(const f of floaters){ctx.save();ctx.globalAlpha=clamp(f.life/.3,0,1);ctx.font='800 '+(f.big?25:19)+'px system-ui';ctx.textAlign='center';ctx.strokeStyle='#05232bdd';ctx.lineWidth=4;ctx.strokeText(f.text,f.x,f.y);ctx.fillStyle=f.color;ctx.fillText(f.text,f.x,f.y);ctx.restore()}ctx.restore()}
function loop(now){
 if(sessionStarted&&journey?.run?.phase!=='over')journey?.step(mode==='playing');
 const elapsed=last?Math.max(0,(now-last)/1000):0;last=now;
 // Bounded fixed-size integration keeps 15 Hz and 60 Hz play at the same speed.
 // A stalled tab cannot produce an unbounded catch-up loop; active skill timers still advance.
 const simulated=Math.min(.25,elapsed),steps=Math.max(1,Math.ceil(simulated*120)),dt=simulated/steps;
 for(let i=0;i<steps;i++){if(mode==='playing'||mode==='welcome')time+=dt;step(dt,elapsed/steps)}
 draw();requestAnimationFrame(loop);
}
function locate(e){const r=canvas.getBoundingClientRect();aim={x:(e.clientX-r.left)*w/r.width,y:(e.clientY-r.top)*h/r.height}}
canvas.addEventListener('pointerdown',e=>{
 if(mode!=='playing'||(e.pointerType==='mouse'&&e.button!==0))return;
 e.preventDefault();initAudio();canvasPointers.press(e);locate(canvasPointers.current);
 canvas.setPointerCapture(e.pointerId);canvas.focus({preventScroll:true});
});
canvas.addEventListener('pointermove',e=>{if(mode==='playing'&&(canvasPointers.move(e)||(!canvasPointers.size&&e.pointerType==='mouse')))locate(e)});
function releasePointer(e){if(canvasPointers.release(e)&&canvasPointers.current)locate(canvasPointers.current)}
for(const type of ['pointerup','pointercancel','lostpointercapture'])canvas.addEventListener(type,releasePointer);
canvas.addEventListener('contextmenu',e=>e.preventDefault());
window.addEventListener('keydown',e=>{if(!overlay.hidden){if(e.key==='Tab'){const els=[...overlay.querySelectorAll('button:not(:disabled),a[href],input')],first=els[0],end=els.at(-1);if(e.shiftKey&&document.activeElement===first){e.preventDefault();end?.focus()}else if(!e.shiftKey&&document.activeElement===end){e.preventDefault();first?.focus()}}if(e.key==='Escape'){if(mode==='paused')resume();else if(mode==='help'||mode==='credits')returnModal()}return}if(mode!=='playing')return;if(['ArrowLeft','ArrowRight'].includes(e.key)){if(document.activeElement!==canvas&&document.activeElement?.tagName==='BUTTON')return;e.preventDefault();keys.add(e.key);initAudio()}if(e.repeat)return;const k=e.key.toLowerCase();if(k==='u')upgrade();if(k==='p'||k==='escape')pause()});window.addEventListener('keyup',e=>keys.delete(e.key));window.addEventListener('blur',()=>{canvasPointers.clear();keys.clear();if(mode==='playing')pause()});document.addEventListener('visibilitychange',()=>{if(document.hidden){if(sessionStarted)persistBest();if(mode==='playing')pause()}});window.addEventListener('pagehide',()=>{if(sessionStarted)persistBest()});
$('sound').onclick=()=>{prefs.sound=!prefs.sound;soundscape.setEnabled(prefs.sound);if(prefs.sound)initAudio();syncSound();save()};$('soundGame').onclick=$('sound').onclick;$('pause').onclick=pause;$('help').onclick=help;$('upgrade').onclick=upgrade;
$('credits').onclick=()=>{if(mode==='help'||mode==='credits')return;modalReturn=mode;soundscape.stop();mode='credits';openModal('<div class="label">MADE FOR FULAM</div><h2 id="dialogTitle">捕財達人</h2><p style="text-align:left">富臨錢進號 · 投資海洋單機版 v3.0<br>沿用 Fishing Joy 的魚群編排程式，重製為 Canvas 遊戲。畫面、魚種、炮台及計分玩法為此版本重新製作。<br><br>Kenney · CC0 音效 / Lucide · ISC 圖示<br>原始專案：imtonyjaa/ggemu-fishing-joy<br>授權：MIT · Copyright (c) 2026 大帅老猿</p><pre class="license" id="licenseText"></pre><button class="primary" id="creditsClose" data-autofocus>返回遊戲</button>');$('licenseText').textContent=UPSTREAM_LICENSE+'\n\n'+ARCADE_LICENSE;$('creditsClose').onclick=returnModal;updateHud()};
// Small read-only state snapshot makes local gameplay QA possible without changing outcomes.
window.FuLamGame={getState:()=>({mode,difficulty,energy:Math.ceil(energy),maxEnergy:survival().max,protection:1-survival().multiplier,run:journey?.run?{scene:journey.run.scene,difficulty:journey.run.difficulty,wave:journey.run.wave,phase:journey.run.phase,total:journey.run.total,active:journey.run.active,weapon:journey.run.weapon,rate:journey.run.rate,trajectory:journey.run.trajectory,life:journey.run.life,protection:journey.run.protection,reason:journey.run.reason}:null,pressure:pressure(),endless:journey?.scene!=='booth',timeLimit:journey?.scene==='booth'?window.FuLamJourney.LIMIT:null,score,wallet,caught,shots,hits,level,maxLevel,round,maxCombo,missionIndex,mission:mission(),bossSpawned,nextBossAt,cannon:{...currentCannon(),spread:[...currentCannon().spread]},nextUpgradeCost:cannons[level]?.cost??null,suppliesTriggered,lastSupplyAt,scanPoints,skillTargets:{freeze:fields.freeze?{...fields.freeze}:null,lure:fields.lure?{...fields.lure}:null,rapid:fish.filter(f=>!f.dead&&f.tagged>0).map(f=>({x:f.x,y:f.y,type:f.type})),bomb:mirrorTime>0&&mirrorTarget?{...mirrorTarget}:null},abilities:Object.fromEntries(Object.entries(itemDefs).map(([id,item])=>[id,{...item,activeRemaining:activeSeconds(id)}])),fishCount:fish.filter(f=>!f.dead).length,bulletCount:bullets.length,beamCount:beams.length,fishTypes:Object.keys(defs),particleCount:particles.length,coinCount:coins.filter(c=>c.kind==='coin').length,ringCount:rings.length,fish:fish.filter(f=>!f.dead&&f.x>0&&f.x<w).map(f=>({x:f.x,y:f.y,baseY:f.baseY,hp:f.hp,maxHp:f.maxHp,elite:f.elite,armored:f.armored,type:f.type,tidePhase:f.tide?.phase,swim:f.swim,speed:f.speed,dashing:!!f.dashing,size:f.size,value:f.value,bounds:swimBounds(f.size)})),width:w,height:h}),version:'3.0'};
$('screen').onclick=async()=>{const wrap=document.querySelector('.wrap');try{if(document.fullscreenElement)await document.exitFullscreen();else if(wrap.classList.contains('expanded'))wrap.classList.remove('expanded');else if(wrap.requestFullscreen)await wrap.requestFullscreen();else wrap.classList.add('expanded')}catch{wrap.classList.toggle('expanded')}document.body.classList.toggle('screen-expanded',wrap.classList.contains('expanded'));resize()};
$('screenGame').onclick=$('screen').onclick;
if($('languageSwitch'))$('languageSwitch').onclick=toggleLanguage;if($('languageGame'))$('languageGame').onclick=toggleLanguage;window.addEventListener('storage',e=>{if(e.key==='fulam-language'){language=e.newValue==='en'?'en':'zh-Hant';localize(document.body);updateHud()}});
for(const id of ['sound','soundGame','pause','help','upgrade','screen','screenGame','languageSwitch','languageGame']){
 const button=$(id);if(button)window.FuLamArcade.bindAction(button,button.onclick,{onRelease:id==='screen'||id==='screenGame'});
}
if(journey){
 document.body.classList.add('combat-score-mode');
 journey.onIntermission=()=>{mode='upgrading';canvasPointers.clear();keys.clear();sound('upgrade');};
 journey.onChoice=(kind,r)=>{level=Math.min(12,r.wave);energy=Math.min(survival().max,energy+12+(kind==='life'?35:0));fish=[];bullets=[];beams=[];supplyCatch=null;fields.freeze=fields.lure=mirrorTarget=null;mirrorTime=mirrorClock=sonarTime=sonarSlots=0;spawnClock=.1;mode='playing';spawnRoundBoss();nextBossAt=round+14;updateHud();};
 journey.onEnd=()=>finish();

 const exit=document.createElement('button');exit.id='exit-game';exit.className='journey-exit';exit.textContent=translated('退出');document.querySelector('.control-top').append(exit);window.FuLamArcade.bindAction(exit,()=>{if(sessionStarted&&mode!=='ended'){journey.run.finish('exit');finish();}else showWelcome();});
}
resize();syncSound();showWelcome();requestAnimationFrame(loop);
})();
