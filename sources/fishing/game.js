/* FuLam Catch — offline Canvas edition. Original gameplay and art; Kenney CC0 audio and Lucide icons.
   Fish formation layouts and placement adapted from imtonyjaa/ggemu-fishing-joy (MIT).
   No GGEMU SDK, external services, probabilistic payout tuning, or remote assets. */
(()=>{'use strict';
const $=id=>document.getElementById(id), canvas=$('game'), ctx=canvas.getContext('2d'), scene=$('scene'), overlay=$('overlay'), Art=window.FuLamArt;
const TAU=Math.PI*2, rnd=(a,b)=>a+Math.random()*(b-a), clamp=(v,a,b)=>Math.max(a,Math.min(b,v)), fmt=v=>Math.floor(v).toLocaleString('en-US');
const reduced=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const canvasPointers=new window.FuLamArcade.Pointers();
function clearPointerInput(){canvasPointers.clear();pointerDown=false}
// Share the site's language choice while preserving the current game session.
let language='zh-Hant';try{language=localStorage.getItem('fulam-language')==='en'?'en':'zh-Hant'}catch{}
const journey=window.FuLamJourney?new window.FuLamJourney.UI('fishing',()=>language):null;
let energy=100;
const gameRandom=()=>journey?.run?.random()??Math.random();
const gameRnd=(a,b)=>a+gameRandom()*(b-a);
const translations={
 '能源耗盡便結算；捕魚可回復能源。每 30 秒選擇強化，U 查看炮台。':'Energy drains over time; catches refill it. Choose an upgrade every 30s; U opens the loadout guide.',
 '捕魚補能源 · 回合升級 · 最高分挑戰':'Catch for energy · Round upgrades · High scores',
 '全螢幕':'Full screen','退出全螢幕':'Exit full screen','音效 /':'audio /','圖示':'icons','炮台升級與道具':'Cannon upgrades and skills','捕財道具':'Fishing skills','12 階炮台 · 回合強化 ·':'12 cannon levels ·',
 '退出':'Exit','返回選單':'Back to menu',
 '小目標 · 捕獲 10 條':'Goal · Catch 10 fish','定投單發 · 穩定射擊':'Steady single shot','捕財升級，解鎖更多道具。':'Upgrade to unlock more skills.','Q W E R T Y 道具 · U 升級 · P 暫停':'Q W E R T Y skills · U upgrade · P pause','金幣 ×2':'Coins ×2','連射 ×2':'Rapid ×2','連射':'Fire',
 '捕財 · 連擊 · 升級':'Catch · Combo · Upgrade','準備就緒':'Ready','無限時':'No time limit','炮台':'Cannon','分數':'Score','秒':'s',
 '富臨錢進號':'The Money Journey','捕財達人':'FuLam Catch','投資海洋・無限挑戰':'Investment ocean · Endless play','個人最佳':'Personal best',
 '12 階炮台 · 回合強化':'4 cannons · round upgrades','炮台養成 · 12 級火力':'4 cannons · round upgrades','本局捕財':'SCORE','可用金幣':'Coins','捕獲':'Caught','無限暢玩':'Endless','連續發射':'hold to fire','長按滑鼠':'Hold mouse','長按畫面':'Hold screen','純遊戲積分':'Game points only','製作與授權':'Credits & licences','返回遊戲區':'Back to games',
 '大漁網技能，鍵盤 Q 或 1':'Net skill, press Q or 1','冰凍技能，鍵盤 W 或 2':'Freeze skill, press W or 2','狂熱連射技能，鍵盤 E 或 3':'Rapid fire, press E or 3','雙倍金幣技能，鍵盤 R 或 4':'Double coins, press R or 4','深海炸彈技能，鍵盤 T 或 5':'Bomb skill, press T or 5','黃金誘餌技能，鍵盤 Y 或 6':'Lure skill, press Y or 6','暫停遊戲，鍵盤 P':'Pause game, press P','升級炮台，鍵盤 U':'Upgrade cannon, press U','玩法說明':'How to play','開關音效':'Toggle sound','關閉音效':'Mute sound','開啟音效':'Enable sound','暫停 · P':'Pause · P',
 '捕財遊戲畫面。按住滑鼠或手指連射；鍵盤左右方向瞄準，空白鍵發射，Q 大漁網，W 冰凍，E 狂熱連射，R 雙倍金幣，T 深海炸彈，Y 黃金誘餌，U 升級，P 暫停。':'Fishing arena. Hold to fire. Arrow keys aim; Space fires; Q net, W freeze, E rapid fire, R double coins, T bomb, Y lure, U upgrade, P pause.',
 '想捕幾耐，':'Catch for','就捕幾耐。':'as long as you like.','瞄準大魚，長按連射。':'Aim for fish and hold to fire.','捕魚補能源，升炮打大魚。':'Catch for energy. Evolve your cannon for bigger targets.','遊戲難度':'Difficulty','輕鬆':'Easy','標準':'Normal','Booth 中等':'Booth intermediate','挑戰':'Hard','開炮捕財':'Start fishing','01 · 無限時':'01 · NO TIME LIMIT','隨時暫停結算':'Pause and finish anytime','02 · 武器變形':'02 · EVOLVING WEAPONS','散射、大球、射線':'Spread, orbs and beams','03 · 海域升溫':'03 · RISING CHALLENGE','魚血量和速度漸增':'Fish get tougher and faster','魚種與武器是理財概念造型 · 分數不代表投資回報':'Financial themes are fictional · Scores are not investment returns',
 '遊戲已暫停':'Game paused','無限時，隨時繼續捕財。':'No time limit. Continue whenever you are ready.','本局':'This run','分 · 炮台 Lv.':'points · Cannon Lv.','繼續遊戲':'Resume','結算離場':'Finish run','結算後可重新開局 · 最佳分數已儲存':'Play again after finishing · Best score saved','滿載而歸！':'Great catch!','刷新個人最佳 · ':'New personal best · ','模式 · ':' · ','深海財神':'Ocean Tycoon','金庫大戶':'Vault Master','捕財高手':'Expert Fisher','新晉捕手':'New Fisher','捕獲魚數':'Fish caught','最高連擊':'Best combo','炮台等級':'Cannon level','今次捕財 ':'Played for ',' 分 ':' min ',' 秒。':' sec.','想玩隨時再出海。':'Come back to the ocean anytime.','重新開局':'Play again','返回遊戲首頁':'Game menu','最佳紀錄儲存在此瀏覽器 · 純遊戲積分':'Best score saved on this browser · Game points only','本局已結算，共 ':'Run complete: ',' 分，捕獲 ':' points, ',' 條。':' fish caught.',
 '無限捕財。':'Endless fishing.','長按畫面連射，移動手指或滑鼠瞄準。發射免費，無限時；想離場可按暫停，再選「結算離場」。':'Hold to fire and move your finger or mouse to aim. Shots are free and there is no time limit. Pause and choose Finish run when you are done.',
 '金幣可升級 12 級炮台，唔會扣總積分。分散投資炮會散射、複利炮會發射穿透大球、長線炮會射出光束。海域每 45 秒升一級，魚會更耐打、更快；最高 16 級，沒有時間上限。':'Spend coins on 12 cannon levels without reducing your score. Upgrade to spread shots, piercing orbs and beams. The sea gets tougher every 45 seconds, up to level 16, with no time limit.',
 'ETF 魔鬼魚滑翔、股票魚走折線、槓桿快鯊突然衝刺，債券海龜則較慢但更耐打。造型只借用理財概念，不代表真實投資風險或回報。':'ETF rays glide, stock fish zigzag, sharks dash and bond turtles move slowly but have more health. These are game themes, not real investment risks or returns.',
 '範圍捕捉，冷卻 16 秒。':'Area damage; 16-second cooldown.','慢速 5 秒，冷卻 20 秒。':'Slows fish for 5 seconds; 20-second cooldown.','射速加倍 8 秒，冷卻 24 秒。':'Double fire rate for 8 seconds; 24-second cooldown.','捕魚收益加倍 8 秒，冷卻 30 秒。':'Double coins for 8 seconds; 30-second cooldown.','大範圍爆破，冷卻 28 秒。':'Large explosion; 28-second cooldown.','召喚高值魚群，冷卻 32 秒。':'Summon valuable fish; 32-second cooldown.','鍵盤：← → 瞄準 · 空白鍵射擊':'Keyboard: ← → aim · Space fires','道具（亦可 1–6）':'skills (or 1–6)','升級':'upgrade','暫停':'pause','知道了':'Got it',
 '現金流單炮':'Cashflow Cannon','雙軌儲蓄':'Double Savings','分散投資':'Diversified Spread','複利能量球':'Compound Orb','複利增幅':'Compound Boost','長線光束':'Long-term Beam','資產配置':'Asset Allocation','複利重核':'Compound Core','長線聚焦':'Focused Beam','全球配置':'Global Allocation','平衡組合':'Balanced Portfolio','全域財富':'Total Wealth',
 '精準單發':'Single shot','雙管齊射':'Double shot','三路散射':'Three-way spread','穿透大球':'Piercing orb','爆破大球':'Blast orb','直線穿透':'Piercing beam','五路散射':'Five-way spread','巨球連爆':'Multi-blast orb','寬幅射線':'Wide beam','七路火網':'Seven-way spread','光束＋三球':'Beam + three orbs','巨球＋寬射線':'Orbs + wide beam',
 '現金金幣魚':'Cash Coinfish','儲蓄魚':'Savings Fish','基金魚':'Fund Fish','股票折線魚':'Stock Fish','金庫巨鯨':'Vault Whale','槓桿快鯊':'Leveraged Shark','ETF 魔鬼魚':'ETF Manta Ray','債券海龜':'Bond Turtle','波動水母':'Volatility Jellyfish','黃金海馬':'Gold Seahorse',
 '大漁網':'Net','冰凍':'Freeze','狂熱連射':'Rapid Fire','雙倍金幣':'Double Coins','深海炸彈':'Bomb','黃金誘餌':'Golden Lure','範圍捕捉':'Area damage','慢速 5 秒':'Slow for 5s','加速 8 秒':'Faster for 8s','雙倍 8 秒':'Double for 8s','大範圍爆破':'Area blast','召喚高值魚群':'Summon valuable fish',
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
function toggleLanguage(){language=language==='en'?'zh-Hant':'en';try{localStorage.setItem('fulam-language',language)}catch{}localize(document.body);updateHud();if(journey&&mode==='welcome'){const holder=overlay.querySelector('.journey-settings')?.parentNode;if(holder)journey.settings(holder,d=>{difficulty=d==='intermediate'?'booth':d==='challenge'?'hard':'normal';});}}

let w=1000,h=600,dpr=1,mode='welcome',difficulty='normal',last=0,time=0,round=0,score=0,wallet=0,caught=0,shots=0,hits=0,level=1,combo=0,maxCombo=0,lastCatch=-10,missionIndex=0,bossSpawned=0,nextBossAt=20,saveClock=5,startingBest=0;
let fish=[],bullets=[],beams=[],particles=[],rings=[],floaters=[],coins=[],aim={x:500,y:240},pointerDown=false,keys=new Set(),shotClock=0,spawnClock=0,recoil=0,shake=0,freezeTime=0,netCooldown=0,freezeCooldown=0,hudClock=0,eventTime=0,sessionStarted=false;
let angle=-Math.PI/2,demoSpawn=0,modalReturn='welcome',oldFocus=null,toastTimeout,resultRecord=false;
let rapidCooldown=0,doubleCooldown=0,bombCooldown=0,lureCooldown=0,rapidTime=0,doubleTime=0,fishSerial=0,lastPressureTier=0;
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
 net:{name:'大漁網',unlock:1,cooldown:16,ready:'範圍捕捉'},
 freeze:{name:'冰凍',unlock:1,cooldown:20,ready:'慢速 5 秒'},
 rapid:{name:'狂熱連射',unlock:3,cooldown:24,ready:'加速 8 秒'},
 double:{name:'雙倍金幣',unlock:5,cooldown:30,ready:'雙倍 8 秒'},
 bomb:{name:'深海炸彈',unlock:7,cooldown:28,ready:'大範圍爆破'},
 lure:{name:'黃金誘餌',unlock:9,cooldown:32,ready:'召喚高值魚群'}
};
const defs={
 coin:{name:'現金金幣魚',value:10,hp:3,size:20,speed:72,color:'#ffe294',swim:'cruise'},
 save:{name:'儲蓄魚',value:20,hp:6,size:27,speed:60,color:'#9be8cf',swim:'sine'},
 fund:{name:'基金魚',value:35,hp:9,size:32,speed:64,color:'#c1b4ff',swim:'sine'},
 stock:{name:'股票折線魚',value:55,hp:12,size:34,speed:105,color:'#ffb78b',swim:'zigzag'},
 whale:{name:'金庫巨鯨',value:360,hp:70,size:72,speed:38,color:'#ffdb85',swim:'glide',boss:true},
 shark:{name:'槓桿快鯊',value:240,hp:45,size:56,speed:140,color:'#9cd9ff',swim:'dash',boss:true},
 ray:{name:'ETF 魔鬼魚',value:95,hp:22,size:45,speed:74,color:'#a6baff',swim:'glide'},
 bond:{name:'債券海龜',value:65,hp:18,size:35,speed:43,color:'#a9e0b0',swim:'cruise'},
 crypto:{name:'波動水母',value:85,hp:15,size:32,speed:65,color:'#e7a2fa',swim:'pulse'},
 gold:{name:'黃金海馬',value:75,hp:14,size:31,speed:68,color:'#ffd47d',swim:'orbit'}
};
const modes={easy:{speed:.82,hp:.9,spawn:1.5,label:'輕鬆'},normal:{speed:1.05,hp:1.15,spawn:1.35,drain:.85,label:'標準'},booth:{speed:1.2,hp:1.375,spawn:1.2,drain:1.05,label:'Booth 中等'},hard:{speed:1.35,hp:1.6,spawn:1.05,drain:1.25,label:'挑戰'}};
function pressureTier(){return journey?.run?journey.run.wave-1:Math.min(15,Math.floor(round/45));}
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
function fishSize(type){
 const boss=!!defs[type].boss,base=defs[type].size*(boss?1.3:1.55)*(w<600?.9:1);
 return Math.min(base,w*(boss?.26:.16),h*.20);
}
function fishLimit(){return journey?(w<600?18:28):(w<600?30:42)}
function mission(){
 if(missionIndex<missions.length)return {...missions[missionIndex],previous:missionIndex?missions[missionIndex-1].n:0};
 const extra=missionIndex-missions.length;return {n:150+extra*50,bonus:Math.min(1000,450+extra*50),previous:100+extra*50};
}
function persistBest(){if(journey)return;if(score>prefs.best[difficulty]){prefs.best[difficulty]=score;save()}}
function resetItems(){freezeTime=rapidTime=doubleTime=netCooldown=freezeCooldown=rapidCooldown=doubleCooldown=bombCooldown=lureCooldown=0}
function cooldownFor(id){return {net:netCooldown,freeze:freezeCooldown,rapid:rapidCooldown,double:doubleCooldown,bomb:bombCooldown,lure:lureCooldown}[id]}
function canUse(id){return mode==='playing'&&level>=itemDefs[id].unlock&&cooldownFor(id)<=0}
function activeSeconds(id){return id==='freeze'?freezeTime:id==='rapid'?rapidTime:id==='double'?doubleTime:0}
function visibleFish(f){return !f.dead&&f.x>-f.size&&f.x<w+f.size}
function spawn(type,opts={}){
 if(fish.filter(f=>!f.dead).length>=fishLimit())return false;
 const d=defs[type],dir=opts.dir||(gameRandom()<.5?1:-1),sz=fishSize(type),y=clamp(opts.y??gameRnd(...swimBounds(sz)),...swimBounds(sz)),boss=!!d.boss;
 const growth=opts.demo?1:(journey?1:(boss?1+(level-1)*.65:1+Math.pow(level-1,1.3)*.18))*pressure().hp;
 const elite=!!(journey?.run&&journey.run.wave>=3&&!boss&&(fishSerial+1)%4===0);
 const hp=Math.max(1,Math.round(d.hp*(elite?1.6:1)*(journey?.run&&boss&&!opts.demo?2+journey.run.wave*.15:1)*(opts.demo?1:modes[difficulty].hp)*growth));
 const value=Math.round(d.value*(boss?1+Math.min(1.5,(level-1)*.10):1));
 fish.push({uid:++fishSerial,type,elite,swim:d.swim,swimTime:0,x:opts.x??(dir===1?-sz*3:w+sz*3),y,baseY:y,size:sz,angle:dir===1?0:Math.PI,dir,speed:opts.speed??d.speed*(opts.demo?.55:modes[difficulty].speed*pressure().speed),phase:opts.phase??gameRnd(0,TAU),hp,maxHp:hp,value,hit:0,dead:false,age:0,seen:false,school:!!opts.school});return true;
}
function school(demo=false){
 if(fish.filter(f=>!f.dead).length>fishLimit()-6)return;
 const dir=gameRandom()<.5?1:-1,types=['coin','coin','save','fund','bond'],type=types[Math.floor(gameRandom()*types.length)],kind=['line','wave','v','circle'][Math.floor(gameRandom()*4)],count=w<600?4:6,points=FuLamFormations.create(kind,count,w,h,dir,gameRandom),speed=defs[type].speed*(demo?.55:modes[difficulty].speed*pressure().speed);
 const [lo,hi]=swimBounds(fishSize(type)),ys=points.map(p=>p.y),minY=Math.min(...ys),maxY=Math.max(...ys),spread=maxY-minY,scale=Math.min(1,(hi-lo)/Math.max(1,spread)),center=clamp((minY+maxY)/2,lo+spread*scale/2,hi-spread*scale/2);
 for(const p of points)spawn(type,{x:p.x,y:center+(p.y-(minY+maxY)/2)*scale,dir,speed,phase:p.phase,school:true,demo});
}
function seedDemo(){fish=[];for(let i=0;i<9;i++)spawn(['coin','save','fund','stock','ray','bond','crypto','gold'][i%8],{demo:true,x:rnd(0,w),y:rnd(110,Math.max(150,h-145))});spawn('whale',{demo:true,x:w*.8,y:h*.35,dir:-1})}
function notify(msg,seconds=2){$('event').textContent=msg;$('event').classList.add('visible');eventTime=seconds;$('live').textContent=msg;localize(document.body)}
function toast(msg){$('toast').textContent=msg;$('toast').classList.add('on');clearTimeout(toastTimeout);toastTimeout=setTimeout(()=>$('toast').classList.remove('on'),2200);localize(document.body)}
const welcomeIcon='<div class="welcome-icon" aria-hidden="true"><svg viewBox="0 0 90 75"><defs><linearGradient id="goldg" x2=".8" y2="1"><stop stop-color="#ffeca6"/><stop offset="1" stop-color="#d1a84e"/></linearGradient></defs><path d="M10 36C29 12 57 14 70 29L84 19 81 50 69 43C48 64 21 54 10 36Z" fill="url(#goldg)"/><path d="m30 23 9-13 13 9m-22 32 12 14 10-12" fill="#ba8a38"/><circle cx="26" cy="32" r="4" fill="#174444"/><circle cx="25" cy="31" r="1.3" fill="white"/><path d="M50 26v23M55 29h-8a5 5 0 0 0 0 9h6a5 5 0 0 1 0 9h-9" fill="none" stroke="#846124" stroke-width="2.8" stroke-linecap="round"/><path d="M8 63q7-6 16 0t16 0t16 0t16 0" fill="none" stroke="#9be8cf" stroke-width="2"/></svg></div>';
function openModal(html){oldFocus=document.activeElement;clearPointerInput();keys.clear();overlay.innerHTML='<div class="card"><button type="button" class="modal-language" id="languageModal">English</button>'+html+'</div>';overlay.hidden=false;const langButton=$('languageModal');if(langButton)langButton.onclick=toggleLanguage;localize(document.body);requestAnimationFrame(()=>{const first=overlay.querySelector('[data-autofocus]')||overlay.querySelector('button');first?.focus({preventScroll:true})})}
function closeModal(){overlay.hidden=true;overlay.innerHTML='';canvas.focus({preventScroll:true})}
function showWelcome(){
 journey?.close();if(journey?.status)journey.status.hidden=true;scene.classList.remove('journey-live');
 fx.clear();soundscape.stop();mode='welcome';sessionStarted=false;$('pause').disabled=true;document.body.classList.remove('game-active');resetItems();score=wallet=caught=round=0;level=1;combo=0;missionIndex=0;bullets=[];beams=[];particles=[];rings=[];floaters=[];coins=[];eventTime=0;seedDemo();
 openModal(welcomeIcon+'<div class="label">FULAM · ENDLESS FISHING</div><h2 id="dialogTitle">想捕幾耐，<br><em>就捕幾耐。</em></h2><p>瞄準大魚，長按連射。<br>捕魚補能源，升炮打大魚。</p><div class="difficulty" role="group" aria-label="遊戲難度"><button data-diff="easy">輕鬆</button><button data-diff="normal">標準</button><button data-diff="hard">挑戰</button></div><button class="primary" id="start" data-autofocus>開炮捕財 <span aria-hidden="true">↗</span></button><div class="how"><span><b>01 · 無限時</b>隨時暫停結算</span><span><b>02 · 武器變形</b>散射、大球、射線</span><span><b>03 · 海域升溫</b>魚血量和速度漸增</span></div><div class="micro">魚種與武器是理財概念造型 · 分數不代表投資回報</div>');
 overlay.querySelectorAll('[data-diff]').forEach(b=>{b.classList.toggle('selected',b.dataset.diff===difficulty);b.setAttribute('aria-pressed',String(b.dataset.diff===difficulty));b.onclick=()=>{difficulty=b.dataset.diff;overlay.querySelectorAll('[data-diff]').forEach(e=>{e.classList.toggle('selected',e===b);e.setAttribute('aria-pressed',String(e===b))});updateHud()}});$('start').onclick=prepareStart;if(journey){const container=document.createElement('div');overlay.querySelector('.difficulty').replaceWith(container);journey.settings(container,d=>{difficulty=d==='intermediate'?'booth':d==='challenge'?'hard':'normal';});}updateHud();
}
function prepareStart(){if(!journey){start();return;}closeModal();document.body.classList.add('game-active');resize();journey.guide(scene,start,showWelcome);}
function start(){
 if(journey){journey.start(scene);scene.classList.add('journey-live');energy=100;difficulty=journey.run.difficulty==='intermediate'?'booth':journey.run.difficulty==='challenge'?'hard':'normal';}
 fx.clear();initAudio();mode='playing';sessionStarted=true;round=0;score=wallet=caught=shots=hits=0;level=1;combo=maxCombo=0;lastCatch=-10;missionIndex=0;bossSpawned=0;nextBossAt=20;saveClock=5;startingBest=journey?journey.best():prefs.best[difficulty];resultRecord=false;lastPressureTier=0;
 fish=[];bullets=[];beams=[];particles=[];floaters=[];coins=[];rings=[];resetItems();shotClock=0;spawnClock=.5;clearPointerInput();keys.clear();aim={x:w/2,y:h*.35};angle=-Math.PI/2;closeModal();document.body.classList.add('game-active');
 if(journey)nextBossAt=Infinity;
 for(let i=0;i<(journey?6:10);i++)spawn(['coin','save','coin','fund','stock','bond','gold','crypto','gold','coin'][i%10],journey?{x:w*(.17+.33*(i%3)),y:h*(.35+.25*Math.floor(i/3))}:{x:gameRnd(w*.06,w*.94)});
 notify(journey?'捕魚補能源 · 回合升級 · 最高分挑戰':'無限時捕財 · U 升級可改變攻擊方式',3);updateHud();
}
function pause(){
 if(mode!=='playing')return;persistBest();mode='paused';soundscape.stop();
 openModal('<div class="label">GAME PAUSED</div><h2 id="dialogTitle">遊戲已暫停</h2><p>無限時，隨時繼續捕財。<br>本局 '+fmt(score)+' 分 · 炮台 Lv.'+level+'</p><button class="primary" id="resume" data-autofocus>繼續遊戲</button><button class="journey-exit" id="finishSession">結算離場</button><div class="micro">結算後可重新開局 · 最佳分數已儲存</div>');
 $('resume').onclick=resume;$('finishSession').onclick=()=>finish();updateHud();
}
function resume(){mode='playing';closeModal();initAudio();updateHud()}
function finish(commit=true){
 mode='ended';journey?.close();clearPointerInput();keys.clear();if(commit){resultRecord=score>startingBest;persistBest();sound('end')}
 const rank=score>=20000?'深海財神':score>=8000?'金庫大戶':score>=2000?'捕財高手':'新晉捕手';
 openModal('<div class="label">YOUR CATCH OF THE DAY</div><h2 id="dialogTitle">滿載而歸！</h2><div class="result-score">'+fmt(score)+'</div><div class="badge">'+(resultRecord?'刷新個人最佳 · ':modes[difficulty].label+'模式 · ')+rank+'</div><div class="result-grid"><div><b>'+caught+'</b><span>捕獲魚數</span></div><div><b>'+maxCombo+'</b><span>最高連擊</span></div><div><b>Lv.'+level+'</b><span>炮台等級</span></div></div><p>今次捕財 '+Math.floor(round/60)+' 分 '+Math.floor(round%60)+' 秒。<br>想玩隨時再出海。</p><button class="primary" id="again" data-autofocus>重新開局</button><button class="journey-exit" id="home">返回遊戲首頁</button><div class="micro">最佳紀錄儲存在此瀏覽器 · 純遊戲積分</div>');
 if(journey){const result=document.createElement('div');result.innerHTML=journey.result(score,{caught,maxCombo},journey.run.reason||'finish');overlay.querySelector('.card').insertBefore(result,$('again'));$('again').textContent=journey.text(journey.scene==='booth'?'下一位':'再玩一次',journey.scene==='booth'?'Next player':'Play again');}
 $('again').onclick=prepareStart;$('home').onclick=showWelcome;$('live').textContent='本局已結算，共 '+score+' 分，捕獲 '+caught+' 條。';updateHud();
}
function help(){
 if(journey){if(mode==='upgrading')return;modalReturn=mode;mode='help';clearPointerInput();openModal('<h2 id="dialogTitle">'+journey.text('捕財達人','FuLam Catch')+'</h2><p>'+journey.text('長按連射，U 查看炮台資訊；另一手可按六種道具，依回合解鎖。Q/W/E/R/T/Y 或 1–6 施放。捕魚補能源，能源耗盡結算。每 30 秒選射速、武器升階或彈道；強化永久保留，每回合補 12 能源。Booth 在 180 秒結算，包含暫停及升級時間。','Hold to fire, U for the guide. Use a second finger for six skills, unlocked by rounds; Q/W/E/R/T/Y or 1–6. Catch fish to refill energy; zero ends the run. Every 30s choose rate, weapon evolution or spread. Keep upgrades and recover 12 energy each round. Booth ends at 180s, including pauses and upgrades.')+'</p><button id="helpClose" class="primary">'+journey.text('返回','Back')+'</button>');$('helpClose').onclick=returnModal;return;}
 if(mode==='help'||mode==='credits')return;modalReturn=mode;if(mode==='playing')clearPointerInput();soundscape.stop();mode='help';
 openModal('<div class="label">HOW TO PLAY</div><h2 id="dialogTitle">無限捕財。</h2><p style="text-align:left">長按畫面連射，移動手指或滑鼠瞄準。發射免費，無限時；想離場可按暫停，再選「結算離場」。<br><br>金幣可升級 12 級炮台，唔會扣總積分。分散投資炮會散射、複利炮會發射穿透大球、長線炮會射出光束。海域每 45 秒升一級，魚會更耐打、更快；最高 16 級，沒有時間上限。<br><br>ETF 魔鬼魚滑翔、股票魚走折線、槓桿快鯊突然衝刺，債券海龜則較慢但更耐打。造型只借用理財概念，不代表真實投資風險或回報。<br><br><b>Q / 1 大漁網</b>：範圍捕捉，冷卻 16 秒。<br><b>W / 2 冰凍</b>：慢速 5 秒，冷卻 20 秒。<br><b>E / 3 狂熱連射 · Lv.3</b>：射速加倍 8 秒，冷卻 24 秒。<br><b>R / 4 雙倍金幣 · Lv.5</b>：捕魚收益加倍 8 秒，冷卻 30 秒。<br><b>T / 5 深海炸彈 · Lv.7</b>：大範圍爆破，冷卻 28 秒。<br><b>Y / 6 黃金誘餌 · Lv.9</b>：召喚高值魚群，冷卻 32 秒。</p><p style="font-size:11px">鍵盤：← → 瞄準 · 空白鍵射擊<br>Q/W/E/R/T/Y 道具（亦可 1–6）· U 升級 · P 暫停</p><button class="primary" id="helpClose" data-autofocus>知道了</button>');
 $('helpClose').onclick=returnModal;updateHud();
}
function returnModal(){if(modalReturn==='playing'){resume()}else if(modalReturn==='paused'){mode='playing';pause()}else if(modalReturn==='ended'){mode='ended';finishWithoutSound()}else showWelcome()}
function finishWithoutSound(){finish(false)}
function addParticles(x,y,color,n=15){n=reduced?Math.min(n,5):n;for(let i=0;i<n&&particles.length<250;i++){const a=rnd(0,TAU),s=rnd(25,150);particles.push({x,y,vx:Math.cos(a)*s,vy:Math.sin(a)*s,life:rnd(.3,.8),max:.8,r:rnd(1.5,4),color})}}
function floater(x,y,text,color='#ffe3a0',big=false){floaters.push({x,y,text,color,life:1.1,max:1.1,big});if(floaters.length>30)floaters.shift()}
function capture(f){
 if(f.dead)return;f.dead=true;if(journey)energy=Math.min(100,energy+(f.type==='whale'?18:f.type==='shark'?10:Math.min(5,.8+f.value/35)));caught++;combo=round-lastCatch<2.6?combo+1:1;lastCatch=round;maxCombo=Math.max(maxCombo,combo);
 const mult=(1+Math.min(1,Math.floor(combo/5)*.15))*(doubleTime>0?2:1),gain=Math.round(f.value*mult);score+=gain;wallet+=gain;
 fx.burst(f.x,f.y,{color:defs[f.type].color,size:f.size*.7,water:true,heavy:f.type==='whale'||f.type==='shark'});if(['bond','crypto'].includes(f.type)){fx.shatter(f.x,f.y,defs[f.type].color,f.size*.4);sound('crack');}rings.push({x:f.x,y:f.y,r:10,end:f.size*2.3,life:.45,max:.45,color:defs[f.type].color,net:false});floater(f.x,f.y-15,'+'+gain,defs[f.type].color,f.type==='whale'||f.type==='shark');
 for(let i=0;i<(reduced?2:Math.min(8,Math.ceil(gain/15)))&&coins.length<180;i++)coins.push({x:f.x+rnd(-12,12),y:f.y+rnd(-12,12),sx:f.x,sy:f.y,age:0,delay:i*.035,life:.8+Math.random()*.2,spin:rnd(0,TAU),vx:rnd(-60,60)});
 sound('coin');if(f.type==='whale'||f.type==='shark'){notify(f.type==='whale'?'金庫巨鯨入袋！':'槓桿快鯊擊破！',2.5);shake=reduced?0:5;sound('heavy')}
 const m=mission();if(caught>=m.n){score+=m.bonus;wallet+=m.bonus;missionIndex++;notify('捕財小目標完成 · +'+m.bonus+' 金幣',2.5);sound('upgrade')}
 if(caught%8===0)netCooldown=Math.max(0,netCooldown-3);
}
function damage(f,amount){if(f.dead)return;f.hp-=amount;f.hit=.16;fx.hit(f.x,f.y,'#c6f6e2');if(f.hp<=0)capture(f);else sound('hit')}
// Swept segment collision is shared by fast bullets and instant penetrating beams.
function segmentFish(x1,y1,x2,y2,f,radius=0){
 const cs=Math.cos(f.angle),sn=Math.sin(f.angle),rx=f.size*1.15+radius,ry=f.size*(f.type==='ray'?.90:.63)+radius;
 const ax=((x1-f.x)*cs+(y1-f.y)*sn)/rx,ay=(-(x1-f.x)*sn+(y1-f.y)*cs)/ry;
 const bx=((x2-f.x)*cs+(y2-f.y)*sn)/rx,by=(-(x2-f.x)*sn+(y2-f.y)*cs)/ry;
 const dx=bx-ax,dy=by-ay,t=clamp(-(ax*dx+ay*dy)/(dx*dx+dy*dy||1),0,1);
 return Math.hypot(ax+dx*t,ay+dy*t)<=1?t:null;
}
function emitBeam(cannon,a,amount=cannon.damage){
 const o=origin(),length=Math.hypot(w,h)*1.25,x=o.x+Math.cos(a)*48,y=o.y+Math.sin(a)*48,ex=x+Math.cos(a)*length,ey=y+Math.sin(a)*length;
 const width=cannon.beamWidth||12;
 beams.push({x,y,ex,ey,width,life:.19,max:.19,color:level>=9?'#c7a5ff':'#8fece5'});if(beams.length>12)beams.shift();
 for(const f of fish)if(visibleFish(f)&&segmentFish(x,y,ex,ey,f,width*.5)!==null){hits++;damage(f,amount)}
 shots++;
}
function currentCannon(){
 if(!journey?.run)return cannons[level-1];
 const p=window.FuLamJourney.weaponProfile('fishing',journey.run);
 return {...p,name:journey.name(journey.run.weapon),label:journey.name(journey.run.weapon),beamWidth:8+p.stage,pierce:p.pierce+1};
}
function fire(){
 if(mode!=='playing'||bullets.length>180)return;const o=origin(),cannon=currentCannon();
 if(cannon.kind==='beam'||cannon.kind==='hybrid')for(const offset of journey?cannon.spread:[0])emitBeam(cannon,angle+offset,(cannon.beamDamage||cannon.damage)*(journey&&cannon.count===2?.65:journey&&offset!==0?.55:1));
 if(cannon.kind!=='beam')for(const spread of cannon.spread){
  const a=angle+spread,isOrb=cannon.kind==='orb'||cannon.kind==='hybrid';
  bullets.push({x:o.x+Math.cos(a)*48,y:o.y+Math.sin(a)*48,px:o.x,py:o.y,vx:Math.cos(a)*cannon.speed,vy:Math.sin(a)*cannon.speed,age:0,damage:cannon.damage*(journey&&cannon.count===2?.65:journey&&spread!==0?.55:1),color:cannon.color,homing:cannon.homing||0,chain:cannon.chain||0,r:isOrb?Math.min(24,12+level):Math.min(6,3.8+level*.25),kind:isOrb?'orb':'bullet',pierce:journey?cannon.pierce:isOrb?cannon.pierce:1,blast:journey?cannon.blast:isOrb?cannon.blast:0,hitIds:new Set(),exploded:false});
  shots++;
 }
 recoil=1;fx.hit(o.x+Math.cos(angle)*48,o.y+Math.sin(angle)*48,'#ffdfa3');sound('fire');
}
function useNet(){
 if(!canUse('net'))return;initAudio();netCooldown=itemDefs.net.cooldown;
 const x=clamp(aim.x,25,w-25),y=clamp(aim.y,...swimBounds(0)),r=w<600?125:175;
 rings.push({x,y,r:0,end:r,life:.75,max:.75,color:'#ffdf8d',net:true});
 for(const f of fish)if(visibleFish(f)&&Math.hypot(f.x-x,f.y-y)<r+f.size*.7)damage(f,8+level*3);
 shake=reduced?0:2;sound('net');updateHud();
}
function useFreeze(){if(!canUse('freeze'))return;initAudio();freezeCooldown=itemDefs.freeze.cooldown;freezeTime=5;sound('freeze');notify('冰凍時間 · 5 秒慢速捕財',2);updateHud()}
function useRapid(){if(!canUse('rapid'))return;initAudio();rapidCooldown=itemDefs.rapid.cooldown;rapidTime=8;shotClock=0;sound('rapid');notify('狂熱連射 · 8 秒雙倍射速',2);updateHud()}
function useDouble(){if(!canUse('double'))return;initAudio();doubleCooldown=itemDefs.double.cooldown;doubleTime=8;sound('double');notify('雙倍金幣 · 8 秒捕魚收益 ×2',2);updateHud()}
function useBomb(){
 if(!canUse('bomb'))return;initAudio();bombCooldown=itemDefs.bomb.cooldown;
 const x=clamp(aim.x,25,w-25),y=clamp(aim.y,...swimBounds(0)),r=w<600?190:280;
 rings.push({x,y,r:0,end:r,life:.9,max:.9,color:'#ffaf85',net:false});fx.burst(x,y,{color:'#ffbf86',size:w<600?65:90,water:true,heavy:true});fx.shatter(x,y,'#ffd4a6',30);
 for(const f of fish)if(visibleFish(f)&&Math.hypot(f.x-x,f.y-y)<r+f.size*.7)damage(f,30+level*9);
 shake=reduced?0:7;sound('blast');notify('深海炸彈 · 魚群大豐收',2);updateHud();
}
function useLure(){
 if(!canUse('lure'))return;const slots=fishLimit()-fish.filter(f=>!f.dead).length;
 if(slots<3){toast('魚群太多，捕幾條再放魚餌');return}
 initAudio();lureCooldown=itemDefs.lure.cooldown;const count=Math.min(slots,w<600?6:9);
 for(let i=0;i<count;i++){const type=['stock','fund','ray','gold'][i%4],x=w*(.14+.72*(i/Math.max(1,count-1)));spawn(type,{x,dir:i%2?1:-1,speed:defs[type].speed*.55,y:rnd(...swimBounds(fishSize(type)))})}
 sound('lure');notify('黃金誘餌 · 高值魚群入場',2.5);updateHud();
}
function upgrade(){
 if(journey){if(mode==='playing')help();return;}
 if(mode!=='playing'||level>=maxLevel)return;const next=cannons[level],price=next.cost;
 if(wallet<price){toast('再捕 '+(price-wallet)+' 金幣就可以升級');return}
 wallet-=price;level++;sound('upgrade');shake=reduced?0:3;const o=origin();addParticles(o.x,o.y-20,'#ffe29a',32);
 const unlocked=Object.values(itemDefs).find(item=>item.unlock===level);
 notify('Lv.'+level+' '+next.name+(unlocked?' · 解鎖'+unlocked.name:''),3);updateHud();
}
function updateHud(){
 $('score').textContent=fmt(score);$('wallet').textContent=fmt(wallet);$('caught').textContent=caught;$('timer').textContent='∞';$('timerBox').classList.remove('urgent');$('best').textContent=fmt(Math.max(journey?journey.best():prefs.best[difficulty],score));
 $('level').textContent=translated('LV.'+level+' / '+maxLevel+' · '+cannons[level-1].name);const weaponMode=$('weaponMode');if(weaponMode)weaponMode.textContent=translated(cannons[level-1].label+' · 海域 '+(pressureTier()+1));$('pause').disabled=mode!=='playing';
 for(const [id,item] of Object.entries(itemDefs)){
  const locked=level<item.unlock,cooldown=cooldownFor(id),active=activeSeconds(id),button=$(id);
  button.disabled=mode!=='playing'||locked||cooldown>0;button.classList.toggle('active',active>0);button.classList.toggle('locked',locked);button.style.setProperty('--charge',(locked?0:Math.max(0,1-cooldown/item.cooldown))*100+'%');
  $(id+'Count').textContent=translated(locked?(journey?'R'+item.unlock+' 解鎖':'Lv.'+item.unlock+' 解鎖'):active>0?Math.ceil(active)+' 秒生效':cooldown>0?Math.ceil(cooldown)+' 秒冷卻':item.ready);
  button.setAttribute('title',translated(item.name)+' · '+$(id+'Count').textContent);
 }
 const effects=[];if(freezeTime>0)effects.push('冰凍 '+Math.ceil(freezeTime)+'s');if(rapidTime>0)effects.push('連射 ×2 '+Math.ceil(rapidTime)+'s');if(doubleTime>0)effects.push('金幣 ×2 '+Math.ceil(doubleTime)+'s');
 $('effectStatus').textContent=translated(effects.join(' · ')||(level===maxLevel?'全部道具已解鎖 · 自由組合火力':'升級炮台，解鎖更多道具'));
 const next=cannons[level];$('upgrade').disabled=mode!=='playing'||!next||wallet<next.cost;$('upgradeTitle').textContent=translated(next?'升級炮台':'已達最高等級');$('upgradePrice').textContent=translated(next?fmt(next.cost)+' 金幣 → Lv.'+(level+1):cannons[level-1].name+' · 巨球＋射線');
 if(journey?.run){$('timer').textContent=Math.ceil(energy)+'%';$('timerBox').querySelector('small').textContent=journey.text('能源','ENERGY');$('timerBox').classList.toggle('urgent',energy<25);$('level').textContent='Lv.'+(journey.run.weapon+1)+' '+journey.name(journey.run.weapon);$('weaponMode').textContent=journey.text('射速 Lv.','Rate Lv.')+journey.run.rate+' · '+journey.text('彈道 Lv.','Spread Lv.')+journey.run.trajectory;$('upgrade').disabled=mode!=='playing';$('upgradeTitle').textContent=journey.text('炮台資訊 · U','Loadout · U');$('upgradePrice').textContent=journey.text('射速 ','Rate ')+(1/currentCannon().interval).toFixed(1)+'/s · '+currentCannon().count+journey.text(' 路',' lanes');$('effectStatus').textContent=journey.text('捕魚補充能源 · 每回合選擇強化','Catch fish for energy · upgrade each round');}
 const m=mission();$('missionLabel').textContent=translated('捕獲 '+caught+' / '+m.n+' · 獎勵 '+fmt(m.bonus));$('missionFill').style.width=clamp((caught-m.previous)/(m.n-m.previous)*100,0,100)+'%';
 if(journey?.run){$('missionLabel').textContent=journey.text('能源 ','ENERGY ')+Math.ceil(energy)+' / 100';$('missionFill').style.width=energy+'%';$('missionFill').style.background=energy<25?'#f4a381':'#94dfc2';}
 $('combo').classList.toggle('show',combo>=3&&round-lastCatch<2.6&&mode==='playing');$('comboNum').textContent=combo+' COMBO';$('comboSub').textContent=translated('連捕加成 ×'+(1+Math.min(1,Math.floor(combo/5)*.15)).toFixed(2));
 $('freezeVeil').classList.toggle('on',freezeTime>0&&mode==='playing');$('event').classList.toggle('visible',eventTime>0&&mode==='playing');
}
function moveFish(dt,demo=false){
 for(const f of fish){
  f.age+=dt;const slow=freezeTime>0&&!demo?.18:1;f.swimTime+=dt*slow;
  const t=f.swimTime,phase=f.phase,profile=f.swim||defs[f.type].swim;
  let speedFactor=1,offset=0,tilt=0;
  if(profile==='dash'){const cycle=(t+phase)%3.6;speedFactor=cycle<.65?2.45:.68;offset=Math.sin(t*1.7+phase)*16;tilt=Math.cos(t*1.7+phase)*.08;f.dashing=cycle<.65;}
  else if(profile==='zigzag'){offset=Math.asin(Math.sin(t*2.2+phase))*29;tilt=Math.cos(t*2.2+phase)>0?.20:-.20;}
  else if(profile==='glide'){offset=Math.sin(t*.8+phase)*(f.type==='ray'?38:18);tilt=Math.cos(t*.8+phase)*.1;}
  else if(profile==='pulse'){speedFactor=.65+(Math.sin(t*3+phase)+1)*.52;offset=Math.sin(t*2.4+phase)*28;tilt=Math.cos(t*2.4+phase)*.12;}
  else if(profile==='orbit'){speedFactor=1+Math.cos(t*2.1+phase)*.68;offset=Math.sin(t*2.1+phase)*32;tilt=Math.cos(t*2.1+phase)*.22;}
  else if(profile==='sine'){offset=Math.sin(t*1.7+phase)*18;tilt=Math.cos(t*1.7+phase)*.08;}
  else{offset=Math.sin(t*.85+phase)*5;tilt=Math.cos(t*.85+phase)*.025;}
  f.x+=f.dir*f.speed*dt*slow*speedFactor;
  f.y=clamp(f.baseY+offset,...swimBounds(f.size));f.angle=(f.dir===1?0:Math.PI)+tilt;
  f.hit=Math.max(0,f.hit-dt);if(f.x>-f.size*2&&f.x<w+f.size*2)f.seen=true;
 }
 fish=fish.filter(f=>!f.dead&&((f.dir===1&&f.x<w+f.size*4)||(f.dir===-1&&f.x>-f.size*4))&&f.age<65);
}
function step(dt,elapsed=dt){
 const playing=mode==='playing';
 if(playing){
  if(journey){energy=Math.max(0,energy-elapsed*((modes[difficulty].drain??.85)+Math.min(1.4,pressureTier()*.09)));if(energy<=0){journey.run.finish('energy');finish();return;}}
  round+=elapsed;const tier=pressureTier();if(tier>lastPressureTier){lastPressureTier=tier;notify('海域 '+(tier+1)+' · 魚群血量與速度提升',2.8)}
  freezeTime=Math.max(0,freezeTime-elapsed);rapidTime=Math.max(0,rapidTime-elapsed);doubleTime=Math.max(0,doubleTime-elapsed);
  netCooldown=Math.max(0,netCooldown-elapsed);freezeCooldown=Math.max(0,freezeCooldown-elapsed);rapidCooldown=Math.max(0,rapidCooldown-elapsed);doubleCooldown=Math.max(0,doubleCooldown-elapsed);bombCooldown=Math.max(0,bombCooldown-elapsed);lureCooldown=Math.max(0,lureCooldown-elapsed);eventTime=Math.max(0,eventTime-elapsed);
  saveClock-=elapsed;if(saveClock<=0){persistBest();saveClock=5}
  if(keys.has('ArrowLeft')||keys.has('ArrowRight')){angle=clamp(angle+(keys.has('ArrowLeft')?-1:1)*dt*1.7,-Math.PI+.16,-.16);const o=origin();aim={x:o.x+Math.cos(angle)*h*.65,y:o.y+Math.sin(angle)*h*.65}}
  else{const o=origin();angle=clamp(Math.atan2(Math.min(aim.y,o.y-24)-o.y,aim.x-o.x),-Math.PI+.16,-.16)}
  shotClock=Math.max(-.3,shotClock-dt);if(pointerDown||keys.has(' ')){let catchUp=0;while(shotClock<=0&&catchUp++<4){fire();shotClock+=currentCannon().interval/(rapidTime>0?2:1)}}else shotClock=Math.max(0,shotClock)
  spawnClock-=dt;if(spawnClock<=0){spawnClock=modes[difficulty].spawn*(1-Math.min(.4,(level-1)*.025+pressureTier()*.01))/(pressure().density||1);if(fish.length<fishLimit()){if(gameRandom()<.24)school();else{const pool=['coin','coin','save','fund','stock','ray','bond','crypto','gold','shark'];spawn(pool[Math.floor(gameRandom()*pool.length)])}}}
  if(round>=nextBossAt){
   if(fish.filter(f=>!f.dead).length>=fishLimit()){const index=fish.findIndex(f=>f.type!=='whale'&&f.type!=='shark');if(index>=0)fish.splice(index,1)}
   const type=bossSpawned%2===0?'whale':'shark';
   if(spawn(type,{dir:bossSpawned%2===0?1:-1})){bossSpawned++;nextBossAt=round+32;notify('第 '+bossSpawned+' 波 · '+defs[type].name+'出現！',3);sound('boss');if(bossSpawned%3===0)school()}
   else nextBossAt=round+3;
  }
  moveFish(dt);
  for(const b of bullets){
   if(b.homing){const target=fish.filter(f=>!f.dead&&!b.hitIds.has(f.uid)&&visibleFish(f)).sort((a,c)=>Math.hypot(a.x-b.x,a.y-b.y)-Math.hypot(c.x-b.x,c.y-b.y))[0];if(target){const speed=Math.hypot(b.vx,b.vy),angle=Math.atan2(target.y-b.y,target.x-b.x),blend=Math.min(1,dt*b.homing);b.vx+=(Math.cos(angle)*speed-b.vx)*blend;b.vy+=(Math.sin(angle)*speed-b.vy)*blend;}}
   b.px=b.x;b.py=b.y;b.x+=b.vx*dt;b.y+=b.vy*dt;b.age+=dt;
   for(const f of fish){
    if(f.dead||b.hitIds.has(f.uid))continue;
    const contact=segmentFish(b.px,b.py,b.x,b.y,f,b.r);
    if(contact!==null){
     const impactX=b.px+(b.x-b.px)*contact,impactY=b.py+(b.y-b.py)*contact;
     b.hitIds.add(f.uid);hits++;damage(f,b.damage);b.pierce--;
     if(b.chain){const near=fish.filter(other=>other!==f&&!other.dead&&Math.hypot(other.x-f.x,other.y-f.y)<150).sort((a,c)=>Math.hypot(a.x-f.x,a.y-f.y)-Math.hypot(c.x-f.x,c.y-f.y)).slice(0,b.chain);for(const other of near){damage(other,b.damage*.25);beams.push({x:f.x,y:f.y,ex:other.x,ey:other.y,width:3,life:.16,max:.16,color:b.color});}b.chain=0;if(beams.length>24)beams.splice(0,beams.length-24);}
     rings.push({x:impactX,y:impactY,r:3,end:b.kind==='orb'?b.blast:30,life:.28,max:.28,color:b.kind==='orb'?'#d9b4ff':'#c2f2e0',net:false});
     if(b.blast&&!b.exploded){b.exploded=true;for(const other of fish)if(!other.dead&&other!==f&&Math.hypot(other.x-impactX,other.y-impactY)<b.blast+other.size*.5){damage(other,b.damage*.45)}}
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
function draw(){ctx.setTransform(dpr,0,0,dpr,0,0);ctx.clearRect(0,0,w,h);ctx.save();if(shake&&!reduced)ctx.translate(rnd(-shake,shake),rnd(-shake,shake));if(journey)window.FuLamJourney.drawScene(ctx,w,h,'fishing',journey.run?.wave||1,time,reduced);else Art.drawBackground(ctx,w,h,time,reduced?.2:1);for(const f of fish){if(f.dead||f.x<-f.size*3||f.x>w+f.size*3)continue;Art.drawFish(ctx,f,time);if(f.elite){ctx.strokeStyle='#ffad79';ctx.lineWidth=2;ctx.beginPath();ctx.ellipse(f.x,f.y,f.size*1.15,f.size*.8,0,0,TAU);ctx.stroke();}if(mode!=='welcome'){const bw=Math.max(35,f.size*1.2),x=f.x-bw/2,y=f.y-f.size*.85;ctx.fillStyle='#001d28dd';ctx.beginPath();ctx.roundRect(x,y,bw,5,2);ctx.fill();ctx.fillStyle=defs[f.type].color;ctx.beginPath();ctx.roundRect(x,y,bw*Math.max(0,f.hp)/f.maxHp,5,2);ctx.fill();ctx.font='700 '+(w<600?10:11)+'px system-ui';ctx.textAlign='center';ctx.strokeStyle='#05232b';ctx.lineWidth=3;const hpText=Math.ceil(Math.max(0,f.hp))+'/'+f.maxHp;ctx.strokeText(hpText,f.x,y-4);ctx.fillStyle='#f4ffef';ctx.fillText(hpText,f.x,y-4)}if(f.type==='whale'||f.type==='shark'){ctx.font='600 '+(w<600?10:11)+'px system-ui';ctx.textAlign='center';ctx.fillStyle=defs[f.type].color;ctx.shadowColor='#001d28';ctx.shadowBlur=5;ctx.fillText(translated(defs[f.type].name)+' · '+f.value,f.x,f.y+f.size*.9+15);ctx.shadowBlur=0}}
for(const beam of beams){ctx.save();ctx.globalAlpha=clamp(beam.life/beam.max,0,1);ctx.strokeStyle=beam.color;ctx.lineWidth=beam.width*2.2;ctx.shadowColor=beam.color;ctx.shadowBlur=20;ctx.lineCap='round';ctx.beginPath();ctx.moveTo(beam.x,beam.y);ctx.lineTo(beam.ex,beam.ey);ctx.stroke();ctx.strokeStyle='#f2fffb';ctx.lineWidth=Math.max(2,beam.width*.38);ctx.stroke();ctx.restore()}
for(const b of bullets){ctx.save();const orb=b.kind==='orb';ctx.strokeStyle=orb?'#ceabff99':'#ffdc7f55';ctx.lineWidth=orb?b.r:2;ctx.beginPath();ctx.moveTo(b.x-b.vx*(orb?.055:.024),b.y-b.vy*(orb?.055:.024));ctx.lineTo(b.x,b.y);ctx.stroke();ctx.fillStyle=b.color||(orb?'#bba1fc':'#fff1bd');ctx.shadowColor=orb?'#d9b3ff':'#ffd269';ctx.shadowBlur=orb?20:10;ctx.beginPath();ctx.arc(b.x,b.y,b.r,0,TAU);ctx.fill();if(orb){ctx.shadowBlur=0;ctx.strokeStyle='#f7ebff';ctx.lineWidth=2;ctx.beginPath();ctx.arc(b.x,b.y,b.r*.68,0,TAU);ctx.stroke();ctx.fillStyle='#fff8df';ctx.beginPath();ctx.arc(b.x-b.r*.23,b.y-b.r*.23,b.r*.25,0,TAU);ctx.fill()}ctx.restore()}
for(const r of rings){const progress=1-r.life/r.max,rad=r.end*(1-Math.pow(1-progress,3)),alpha=r.life/r.max;ctx.save();ctx.globalAlpha=alpha;ctx.strokeStyle=r.color;ctx.lineWidth=r.net?2:1.4;ctx.beginPath();ctx.arc(r.x,r.y,rad,0,TAU);ctx.stroke();if(r.net){ctx.globalAlpha=alpha*.17;ctx.fillStyle=r.color;ctx.fill();ctx.globalAlpha=alpha*.65;ctx.beginPath();ctx.arc(r.x,r.y,rad,0,TAU);ctx.clip();ctx.lineWidth=1;for(let v=-rad*2;v<rad*2;v+=22){ctx.beginPath();ctx.moveTo(r.x-rad,r.y+v-rad);ctx.lineTo(r.x+rad,r.y+v+rad);ctx.stroke();ctx.beginPath();ctx.moveTo(r.x-rad,r.y+v+rad);ctx.lineTo(r.x+rad,r.y+v-rad);ctx.stroke()}}ctx.restore()}
for(const p of particles){ctx.globalAlpha=clamp(p.life/p.max,0,1);ctx.fillStyle=p.color;ctx.beginPath();ctx.arc(p.x,p.y,p.r,0,TAU);ctx.fill()}ctx.globalAlpha=1;
fx.draw(ctx);
const o=origin();if(mode==='playing'&&overlay.hidden){ctx.save();ctx.globalAlpha=.16;ctx.strokeStyle='#fff2c8';ctx.setLineDash([3,10]);ctx.beginPath();ctx.moveTo(o.x+Math.cos(angle)*55,o.y+Math.sin(angle)*55);ctx.lineTo(o.x+Math.cos(angle)*150,o.y+Math.sin(angle)*150);ctx.stroke();ctx.restore()}
Art.drawCannon(ctx,o.x,o.y,angle,journey?.run?Math.min(12,journey.run.weapon+1):level,recoil,time,currentCannon().kind);
for(const c of coins){const t=clamp((c.age-c.delay)/c.life,0,1);if(c.age<c.delay)continue;const e=t*t,x=c.sx+(55-c.sx)*e+Math.sin(t*Math.PI)*c.vx,y=c.sy+(47-c.sy)*e-Math.sin(t*Math.PI)*60;ctx.globalAlpha=1-t*.7;Art.drawCoin(ctx,x,y,7,c.spin+time*9)}ctx.globalAlpha=1;
for(const f of floaters){ctx.save();ctx.globalAlpha=clamp(f.life/.3,0,1);ctx.font='800 '+(f.big?25:19)+'px system-ui';ctx.textAlign='center';ctx.strokeStyle='#05232bdd';ctx.lineWidth=4;ctx.strokeText(f.text,f.x,f.y);ctx.fillStyle=f.color;ctx.fillText(f.text,f.x,f.y);ctx.restore()}ctx.restore()}
function loop(now){
 if(sessionStarted&&journey?.run?.phase!=='over')journey?.step(mode==='playing');
 const elapsed=last?Math.max(0,(now-last)/1000):0;last=now;
 // Bounded fixed-size integration keeps 15 Hz and 60 Hz play at the same speed.
 // A stalled tab cannot produce an unbounded catch-up loop; wall-clock cooldowns still advance.
 const simulated=Math.min(.25,elapsed),steps=Math.max(1,Math.ceil(simulated*120)),dt=simulated/steps;
 for(let i=0;i<steps;i++){if(mode==='playing'||mode==='welcome')time+=dt;step(dt,elapsed/steps)}
 draw();requestAnimationFrame(loop);
}
function locate(e){const r=canvas.getBoundingClientRect();aim={x:(e.clientX-r.left)*w/r.width,y:(e.clientY-r.top)*h/r.height}}
canvas.addEventListener('pointerdown',e=>{
 if(mode!=='playing'||(e.pointerType==='mouse'&&e.button!==0))return;
 e.preventDefault();initAudio();canvasPointers.press(e);locate(canvasPointers.current);
 if(!pointerDown)shotClock=0;pointerDown=true;canvas.setPointerCapture(e.pointerId);canvas.focus({preventScroll:true});
});
canvas.addEventListener('pointermove',e=>{if(mode==='playing'&&(canvasPointers.move(e)||(!pointerDown&&e.pointerType==='mouse')))locate(e)});
function releasePointer(e){if(!canvasPointers.release(e))return;pointerDown=canvasPointers.size>0;if(pointerDown)locate(canvasPointers.current)}
for(const type of ['pointerup','pointercancel','lostpointercapture'])canvas.addEventListener(type,releasePointer);
canvas.addEventListener('contextmenu',e=>e.preventDefault());
window.addEventListener('keydown',e=>{if(!overlay.hidden){if(e.key==='Tab'){const els=[...overlay.querySelectorAll('button:not(:disabled),a[href],input')],first=els[0],end=els.at(-1);if(e.shiftKey&&document.activeElement===first){e.preventDefault();end?.focus()}else if(!e.shiftKey&&document.activeElement===end){e.preventDefault();first?.focus()}}if(e.key==='Escape'){if(mode==='paused')resume();else if(mode==='help'||mode==='credits')returnModal()}return}if(mode!=='playing')return;if([' ','ArrowLeft','ArrowRight'].includes(e.key)){if(document.activeElement!==canvas&&document.activeElement?.tagName==='BUTTON')return;e.preventDefault();keys.add(e.key);initAudio()}if(e.repeat)return;const k=e.key.toLowerCase();if(k==='1'||k==='q')useNet();if(k==='2'||k==='w')useFreeze();if(k==='3'||k==='e')useRapid();if(k==='4'||k==='r')useDouble();if(k==='5'||k==='t')useBomb();if(k==='6'||k==='y')useLure();if(k==='u')upgrade();if(k==='p'||k==='escape')pause()});window.addEventListener('keyup',e=>keys.delete(e.key));window.addEventListener('blur',()=>{clearPointerInput();keys.clear();if(mode==='playing')pause()});document.addEventListener('visibilitychange',()=>{if(document.hidden){if(sessionStarted)persistBest();if(mode==='playing')pause()}});window.addEventListener('pagehide',()=>{if(sessionStarted)persistBest()});
$('sound').onclick=()=>{prefs.sound=!prefs.sound;soundscape.setEnabled(prefs.sound);if(prefs.sound)initAudio();syncSound();save()};$('soundGame').onclick=$('sound').onclick;$('pause').onclick=pause;$('help').onclick=help;$('net').onclick=useNet;$('freeze').onclick=useFreeze;$('rapid').onclick=useRapid;$('double').onclick=useDouble;$('bomb').onclick=useBomb;$('lure').onclick=useLure;$('upgrade').onclick=upgrade;
$('credits').onclick=()=>{if(mode==='help'||mode==='credits')return;modalReturn=mode;soundscape.stop();mode='credits';openModal('<div class="label">MADE FOR FULAM</div><h2 id="dialogTitle">捕財達人</h2><p style="text-align:left">富臨錢進號 · 投資海洋單機版 v3.0<br>沿用 Fishing Joy 的魚群編排程式，重製為 Canvas 遊戲。畫面、魚種、炮台及計分玩法為此版本重新製作。<br><br>Kenney · CC0 音效 / Lucide · ISC 圖示<br>原始專案：imtonyjaa/ggemu-fishing-joy<br>授權：MIT · Copyright (c) 2026 大帅老猿</p><pre class="license" id="licenseText"></pre><button class="primary" id="creditsClose" data-autofocus>返回遊戲</button>');$('licenseText').textContent=UPSTREAM_LICENSE+'\n\n'+ARCADE_LICENSE;$('creditsClose').onclick=returnModal;updateHud()};
// Small read-only state snapshot makes local gameplay QA possible without changing outcomes.
window.FuLamGame={getState:()=>({mode,difficulty,energy,run:journey?.run?{scene:journey.run.scene,difficulty:journey.run.difficulty,wave:journey.run.wave,phase:journey.run.phase,total:journey.run.total,active:journey.run.active,weapon:journey.run.weapon,rate:journey.run.rate,trajectory:journey.run.trajectory,reason:journey.run.reason}:null,pressure:pressure(),endless:journey?.scene!=='booth',timeLimit:journey?.scene==='booth'?180:null,score,wallet,caught,shots,hits,level,maxLevel,round,maxCombo,missionIndex,mission:mission(),bossSpawned,nextBossAt,netCooldown,freezeCooldown,freezeTime,rapidCooldown,doubleCooldown,bombCooldown,lureCooldown,rapidTime,doubleTime,cannon:{...currentCannon(),spread:[...currentCannon().spread]},nextUpgradeCost:cannons[level]?.cost??null,abilities:Object.fromEntries(Object.entries(itemDefs).map(([id,item])=>[id,{...item,unlocked:level>=item.unlock,cooldownRemaining:cooldownFor(id),activeRemaining:activeSeconds(id)}])),fishCount:fish.filter(f=>!f.dead).length,bulletCount:bullets.length,beamCount:beams.length,fishTypes:Object.keys(defs),particleCount:particles.length,coinCount:coins.length,ringCount:rings.length,fish:fish.filter(f=>!f.dead&&f.x>0&&f.x<w).map(f=>({x:f.x,y:f.y,baseY:f.baseY,hp:f.hp,maxHp:f.maxHp,elite:f.elite,type:f.type,swim:f.swim,speed:f.speed,dashing:!!f.dashing,size:f.size,value:f.value,bounds:swimBounds(f.size)})),width:w,height:h}),version:'3.0'};
$('screen').onclick=async()=>{const wrap=document.querySelector('.wrap');try{if(document.fullscreenElement)await document.exitFullscreen();else if(wrap.classList.contains('expanded'))wrap.classList.remove('expanded');else if(wrap.requestFullscreen)await wrap.requestFullscreen();else wrap.classList.add('expanded')}catch{wrap.classList.toggle('expanded')}document.body.classList.toggle('screen-expanded',wrap.classList.contains('expanded'));resize()};
$('screenGame').onclick=$('screen').onclick;
if($('languageSwitch'))$('languageSwitch').onclick=toggleLanguage;if($('languageGame'))$('languageGame').onclick=toggleLanguage;window.addEventListener('storage',e=>{if(e.key==='fulam-language'){language=e.newValue==='en'?'en':'zh-Hant';localize(document.body);updateHud()}});
for(const id of ['sound','soundGame','pause','help','net','freeze','rapid','double','bomb','lure','upgrade','screen','screenGame','languageSwitch','languageGame']){
 const button=$(id);if(button)window.FuLamArcade.bindAction(button,button.onclick,{onRelease:id==='screen'||id==='screenGame'});
}
if(journey){
 journey.onIntermission=()=>{mode='upgrading';clearPointerInput();keys.clear();sound('upgrade');};
 journey.onChoice=(kind,r)=>{level=Math.min(12,r.wave);energy=Math.min(100,energy+12);fish=[];bullets=[];beams=[];spawnClock=.1;mode='playing';if(r.wave%3===0){spawn(r.wave%6===0?'shark':'whale',{x:w*.5});bossSpawned++;sound('boss');}updateHud();};
 journey.onEnd=()=>finish();
 for(const [id,unlock] of Object.entries({rapid:2,double:3,bomb:4,lure:5}))itemDefs[id].unlock=unlock;
 const exit=document.createElement('button');exit.id='exit-game';exit.className='journey-exit';exit.textContent=translated('退出');document.querySelector('.control-top').append(exit);window.FuLamArcade.bindAction(exit,()=>{if(sessionStarted&&mode!=='ended'){journey.run.finish('exit');finish();}else showWelcome();});
}
resize();syncSound();showWelcome();requestAnimationFrame(loop);
})();
