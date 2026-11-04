import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import fs from 'node:fs';
const context=vm.createContext({console});
const shared=fs.readFileSync(new URL('../sources/arcade/journey.js',import.meta.url),'utf8');
vm.runInContext(shared,context);
vm.runInContext(fs.readFileSync(new URL('../sources/fleet/core.js',import.meta.url),'utf8'),context);
const {Run,readBoard,saveBoard}=context.FuLamJourney,C=context.FleetCore;
test('Combat results show score ranking and three short lessons without duplicate QR/share panels',()=>{
 for(const game of ['fishing','fleet'])for(const lang of ['zh-Hant','en']){
  const ui=new context.FuLamJourney.UI(game,()=>lang);
  const html=ui.combatResult({rank:2,saved:true,board:[{score:300,wave:4},{score:200,wave:4},{score:100,wave:3}]});
  assert(html.includes('#2'));assert.equal((html.match(/aria-current="true"/g)||[]).length,1);
  assert(!html.includes('journey-qr'));assert(!html.includes('<details>'));
  const lesson=html.match(/class="result-lesson">([^<]+)/)[1];assert.equal((lesson.match(lang==='en'?/\./g:/。/g)||[]).length,3);
  const outside=ui.combatResult({rank:11,saved:false,board:[]});assert(outside.includes('<strong>10+</strong>'));assert(!outside.includes('#11'));
 }
 assert(new Run('fleet','booth').key().includes('combat3'));
 assert(!new Run('knife','booth').key().includes('combat3'));
});
const tick=(r,seconds,playing=true)=>{for(let i=0;i<Math.round(seconds*60);i++)r.tick(1/60,playing);};
test('Each stage grants a weapon, then one other upgrade, and a new player starts fresh',()=>{
 for(const game of ['fleet','fishing','knife']){
  const r=new Run(game,'booth');
  const picks=game==='knife'?['focus','life','focus']:game==='fleet'?['escort','trajectory','rate']:['trajectory','rate','trajectory'];
  for(const kind of picks){r.completeRound();assert.equal(r.choose('weapon'),false);assert.equal(r.choose('guard'),false);assert(r.choose(kind));}
  assert.equal(r.weapon,3);assert.equal(r.wave,4);
  if(game==='knife'){assert.equal(r.focus,2);assert.equal(r.guard,0);assert.equal(r.life,1);}
  else if(game==='fleet'){assert.equal(r.escort,1);assert.equal(r.trajectory,1);assert.equal(r.rate,1);}
  else{assert.equal(r.trajectory,2);assert.equal(r.rate,1);assert.equal(r.choose('escort'),false);}
  const fresh=new Run(game,'booth');assert.equal(fresh.weapon,0);assert.equal(fresh.life,0);assert.equal(fresh.protection,0);assert.equal(fresh.guard,0);assert.equal(fresh.rate,0);assert.equal(fresh.trajectory,0);assert.equal(fresh.escort,0);
 }
});
test('Aircraft armour upgrades change the real cap and repair amount without losing firepower',()=>{
 for(const [mode,base] of [['standard',100],['booth',88],['storm',75]]){
  const s=C.createState({arcade:true,mode,seed:1});s.hero.hp=20;
  C.applyRoundUpgrade(s,{weapon:3,rate:2,trajectory:1,life:1,protection:0},'life');
  assert.equal(s.hero.maxHp,base+20);assert.equal(s.hero.hp,mode==='booth'?75:67);assert.equal(s.evolution.weapon,3);
  s.hero.hp=s.hero.maxHp-1;s.cash=100;C.buy(s,'repair');assert.equal(s.hero.hp,s.hero.maxHp);
 }
});
test('Protection reduces actual enemy projectile damage and extends shield within a bounded duration',()=>{
 const lost=[];
 for(const protection of [0,1,5]){
  const s=C.createState({arcade:true,mode:'booth',seed:1});s.evolution.protection=protection;s.wave=4;s.invulnerable=0;s.spawnTime=s.fireTime=100;
  C.fireTorpedo(s,{x:s.hero.position.x,y:s.hero.position.y},0,C.ENEMY,{damage:20,speed:0});C.maintainWorld(s);C.tick(s,.016);
  lost.push(88-s.hero.hp);
  assert(Math.abs((88-s.hero.hp)-20/(1+.15*protection))<1e-9);
  s.cash=100;assert(C.activateShield(s));assert(s.shield>=2.8&&s.shield<=4.8);
 }
 assert(lost[0]>lost[1]&&lost[1]>lost[2]);
 const p=context.FuLamJourney.survivalProfile('fleet',{protection:1000});assert(p.multiplier>0);assert.equal(p.shieldBonus,2);
});
test('Every permanent upgrade improves output; late upgrades remain useful and finite',()=>{
 const profile=context.FuLamJourney.weaponProfile;
 const output=p=>p.damage*(p.count===2?1.3:p.count%2?1+(p.count-1)*.55:p.count*.55)/p.interval;
 for(const game of ['fishing','fleet'])for(const level of [0,1,5,11,20,60]){
  const r={weapon:level,rate:level,trajectory:level},before=profile(game,r);
  for(const kind of ['weapon','rate','trajectory']){const after=profile(game,{...r,[kind]:level+1});assert(output(after)>output(before),`${game} ${kind} ${level}`);assert(Number.isFinite(output(after)));assert(after.count<=7);assert(after.pierce<=12);}
 }
});
test('Enemy pressure rises after upgrades; bosses remain multi-second fights even with all weapon upgrades',()=>{
 let previous=0;
 for(const wave of [3,6,9,12]){
  const s=C.createState({arcade:true,mode:'booth',seed:1});s.wave=wave;
  const boss=C.spawnEnemy(s,'boss'),p=context.FuLamJourney.weaponProfile('fleet',{weapon:wave-1});
  const idealSeconds=boss.maxHp/(p.damage*1.3/p.interval);
  assert(idealSeconds>=(wave<=4?6:9),`wave ${wave}: ${idealSeconds}s`);assert(boss.maxHp>previous);previous=boss.maxHp;
  const enemies=Array.from({length:8},()=>C.spawnEnemy(s,'fee'));assert(enemies.some(e=>e.elite));assert(enemies.find(e=>e.elite).maxHp>enemies.find(e=>!e.elite).maxHp);
 }
});
test('Each round scene has a local original image and the five topic scenes cycle in order',()=>{
 for(const game of ['knife','fishing','fleet']){
  const names=new Set();for(let wave=1;wave<=5;wave++){const s=context.FuLamJourney.sceneInfo(game,wave);names.add(s.name[0]);assert(s.lesson[0].length>10);assert(fs.existsSync(new URL(`../site/arcade/scenes/${game}-${s.index}.svg`,import.meta.url)));}
  assert.equal(names.size,5);assert.equal(context.FuLamJourney.sceneInfo(game,6).index,0);
 }
});
test('Every Booth game forces intermediate difficulty and a reproducible seed; public runs keep two difficulties',()=>{
 for(const game of ['knife','fishing','fleet']){
  const a=new Run(game,'booth','challenge',99),b=new Run(game,'booth','standard',222);
  assert.equal(a.difficulty,'intermediate');assert.equal(a.seed,b.seed);
  assert.deepEqual(Array.from({length:30},()=>a.random()),Array.from({length:30},()=>b.random()));
  assert.equal(new Run(game,'web','challenge').difficulty,'challenge');
  assert.equal(new Run(game,'web','intermediate').difficulty,'standard');
  assert.notEqual(a.key(),a.key().replace('booth-v9','booth-v8'));
 }
});
test('Thirty active seconds opens one choice and freezes the active play clock',()=>{
 const r=new Run('fishing');tick(r,30.1);assert.equal(r.phase,'choice');assert.equal(r.wave,1);const t=r.active;
 tick(r,5);assert.equal(r.active,t);assert.equal(r.roundTime,30);assert(r.choiceTime<8);
});
test('An upgrade applies once; rate, evolution and trajectory accumulate without switching',()=>{
 const r=new Run('fleet');tick(r,30.1);assert.equal(r.phase,'choice');assert.equal(r.weapon,1);assert.equal(r.choose('weapon'),false);assert(r.choose('rate'));assert(!r.choose('rate'));assert.equal(r.wave,2);
 tick(r,30.1);assert.equal(r.weapon,2);assert(r.choose('trajectory'));
 assert.deepEqual([r.weapon,r.rate,r.trajectory],[2,1,1]);assert.equal(typeof r.swap,'undefined');
});
test('All games evolve through twelve stages and continue growing beyond the final form',()=>{
 for(const game of ['fishing','fleet','knife']){const r=new Run(game);for(let i=0;i<14;i++){r.completeRound();assert.equal(r.weapon,i+1);assert(r.choose(game==='knife'?'focus':'rate'));}assert.equal(r.weapon,14);assert.equal(r.wave,15);}
});
test('A paused public run cannot advance rounds or time out, even after an hour',()=>{
 const r=new Run('knife');r.tick(3600,false);assert.equal(r.phase,'play');assert.equal(r.active,0);assert.equal(r.wave,1);
});
test('Booth wall time expires through pause and upgrade, exactly once',()=>{
 const limit=context.FuLamJourney.LIMIT;
 for(const inChoice of [false,true]){const r=new Run('fleet','booth');if(inChoice)tick(r,20.1);r.tick(limit-r.total,false);assert.equal(r.phase,'over');assert.equal(r.reason,'time');assert.equal(r.total,limit);assert.equal(r.finish('defeat'),false);assert.equal(r.reason,'time');assert.equal(r.tick(10),null);assert(!r.choose('weapon'));}
 const paced=new Run('fleet','booth');tick(paced,19);assert.equal(paced.phase,'play');tick(paced,1.2);assert.equal(paced.phase,'choice');
 const slice=new Run('knife','booth');tick(slice,119);assert.equal(slice.phase,'play');tick(slice,1.2);assert.equal(slice.phase,'over');assert.equal(slice.reason,'time');assert.equal(slice.total,limit);
});
test('Booth plays four stages inside two minutes and the last one fills the remaining time',()=>{
 const r=new Run('fishing','booth');
 assert.equal(context.FuLamJourney.LIMIT,120);
 assert.equal(JSON.stringify([...context.FuLamJourney.BOOTH_STAGE_TIME]),JSON.stringify([20,20,20]));
 tick(r,20.05);assert.equal(r.phase,'choice');assert.equal(r.weapon,1);assert(r.choose('rate'));
 tick(r,20.05);assert.equal(r.phase,'choice');assert.equal(r.weapon,2);assert(r.choose('trajectory'));
 tick(r,20.05);assert.equal(r.phase,'choice');assert.equal(r.weapon,3);assert(r.choose('rate'));
 assert.equal(r.wave,4);assert.equal(r.phase,'play');assert(r.total<120);
 tick(r,120-r.total-.3);assert.equal(r.phase,'play');tick(r,.6);assert.equal(r.phase,'over');assert.equal(r.reason,'time');assert.equal(r.total,120);
});
test('Public challenges continue beyond six rounds with bounded choice history',()=>{
 const r=new Run('fleet','web','challenge');for(let i=0;i<110;i++){tick(r,30.1);assert.equal(r.weapon,i+1);assert(r.choose('rate'));}assert.equal(r.weapon,110);assert.equal(r.wave,111);assert.equal(r.phase,'play');assert.equal(r.choices.length,100);
});
test('Invalid clock deltas never corrupt a score run',()=>{const r=new Run('fishing');for(const dt of [NaN,Infinity,-1,0])r.tick(dt);assert.equal(r.total,0);assert.equal(r.active,0);});
test('Record keys separate games, scenes, difficulty, topics and language',()=>{
 const keys=[new Run('knife').key('tools','en'),new Run('knife').key('tools','zh-Hant'),new Run('knife').key('scams','en'),new Run('knife','booth').key('tools','en'),new Run('knife','web','challenge').key('tools','en'),new Run('fleet').key()];assert.equal(new Set(keys).size,6);
});
test('Local boards cap at ten and rank by score, not farming elapsed time',()=>{
 const m=new Map(),storage={getItem:k=>m.get(k),setItem:(k,v)=>m.set(k,v)};
 for(let i=0;i<20;i++)saveBoard(storage,'x',{score:i*100,wave:1,seconds:1000-i});
 const a=readBoard(storage,'x');assert.equal(a.length,10);assert.equal(a[0].score,1900);assert.equal(a[9].score,1000);
 assert.equal(saveBoard(storage,'x',{score:2050,wave:2,seconds:4}).rank,1);
});
test('Blocked storage and malformed records do not crash results',()=>{
 const blocked={getItem(){throw Error('blocked');},setItem(){throw Error('blocked');}};assert.equal(saveBoard(blocked,'x',{score:1,wave:1,seconds:1}).saved,false);
 assert.equal(readBoard({getItem:()=>'{broken'},'x').length,0);
 assert.equal(readBoard({getItem:()=>JSON.stringify([{score:'<script>',wave:1,seconds:1},{score:1,wave:-1,seconds:2},{score:7,wave:2,seconds:2}])},'x').length,1);
});
test('A Booth jet becomes a laser once it upgrades, while a public jet keeps the early shell',()=>{
 const fire=(mode,weapon,trajectory=0)=>{const s=C.createState({arcade:true,mode,seed:1});s.evolution.weapon=weapon;s.evolution.trajectory=trajectory;s.spawnTime=100;s.fireTime=.01;C.tick(s,.05);return s.entities.filter(e=>e.type==='torpedo'&&e.collision.group===C.FRIEND);};
 const upgraded=fire('booth',1);assert.equal(upgraded.length,2);assert(upgraded.every(e=>e.style==='beam'&&e.color==='#8cf4ff'&&e.blast===0&&e.collision.radius<=3.2&&e.ray));
 const span=e=>Math.hypot(e.ray.end.x-e.ray.start.x,e.ray.end.y-e.ray.start.y);
 assert(upgraded.every(e=>e.ray.end.y<0&&e.ray.start.y>C.H*.5&&span(e)>C.H*.7));
 assert(Math.abs(upgraded[0].position.r-upgraded[1].position.r)<.02);
 assert(Math.abs(upgraded[0].ray.start.x-upgraded[1].ray.start.x)>12);
 const early=fire('booth',0);assert.equal(early.length,1);assert(early.every(e=>e.style==='shell'&&e.blast===0&&!e.ray&&e.damage>=12&&e.damage<=13));
 const pub=fire('standard',1);assert(pub.length>=1);assert(pub.every(e=>e.style==='shell'));
 const bomb=fire('booth',2);assert.equal(bomb.length,1);assert(bomb.every(e=>e.style==='bomb'&&e.blast>0&&e.blast<=22&&!e.ray));
 const plane=fire('booth',3);assert.equal(plane.length,1);assert(plane.every(e=>e.style==='missile'&&e.blast>0&&e.blast<=28));
 const wide=fire('booth',1,2);assert.equal(wide.length,4);assert(wide.every(e=>e.style==='beam'&&e.ray));
 assert(new Set(wide.map(e=>e.ray.start.x.toFixed(2))).size===4);
});
test('Aircraft evolution changes actual projectiles, with increasing damage and retained fire-rate/trajectory upgrades',()=>{
 let previousDamage=0;
 for(let weapon=0;weapon<12;weapon++){const s=C.createState({arcade:true,seed:1});s.spawnTime=100;s.evolution={weapon,rate:2,trajectory:2};C.tick(s,.05);C.tick(s,.05);C.tick(s,.05);const bullets=s.entities.filter(e=>e.type==='torpedo');assert(bullets.length>=3);const damage=bullets.reduce((sum,e)=>sum+e.damage,0);assert(damage>previousDamage);previousDamage=damage;if(weapon>=2)assert(bullets.every(e=>e.pierce>0));if(weapon>=4)assert(bullets.every(e=>e.blast>0));if(weapon>=8)assert(bullets.every(e=>e.homing>0));if(weapon>=10)assert(bullets.every(e=>e.chain>0));assert.equal(s.hero.position.r,-Math.PI/2);}
});
test('Arcade round control replaces kill farming and bosses occur every third wave',()=>{
 const s=C.createState({arcade:true,seed:3});s.waveKills=999;C.tick(s,.016);assert.equal(s.wave,1);s.wave=3;C.tick(s,.016);assert.equal(s.entities.filter(e=>e.kind==='boss').length,1);C.tick(s,.016);assert.equal(s.entities.filter(e=>e.kind==='boss').length,1);
});
test('Paid aircraft upgrades add real damage without spending score',()=>{
 const s=C.createState({arcade:true,seed:1});s.cash=500;s.score=1234;s.spawnTime=100;
 assert(C.buy(s,'weapon'));assert.equal(s.power,1.18);assert.equal(s.paidPower,.18);assert.equal(s.score,1234);
 for(let i=0;i<4;i++)C.tick(s,.05);assert(s.entities.filter(e=>e.type==='torpedo').every(e=>Math.abs(e.damage-16*1.18)<1e-9));
});
test('Aircraft boss warns first, then fires a wider second phase with a centre gap',()=>{
 for(const [health,count] of [[1,6],[.4,8]]){
  const s=C.createState({arcade:true,seed:1});s.spawnTime=100;s.fireTime=100;
  const boss=C.spawnEnemy(s,'boss');C.maintainWorld(s);boss.position.y=100;boss.hp=boss.maxHp*health;boss.strategy.remainingBeforeAttack=0;
  C.tick(s,1/60);assert(boss.attack);assert.equal(s.entities.filter(e=>e.type==='torpedo').length,0);
  const angles=[...boss.attack.angles];
  for(let i=0;i<58;i++)C.tick(s,1/60);
  const bullets=s.entities.filter(e=>e.type==='torpedo'&&e.collision.group===C.ENEMY);
  assert.equal(bullets.length,count);assert.deepEqual(Array.from(bullets,e=>e.position.r),angles);
  assert(2*160*Math.sin((angles[count/2]-angles[count/2-1])/2)>s.hero.collision.radius*2+9.6+16);
 }
});
test('Aircraft difficulty keeps paced spawns and caps projectile speed, including late waves',()=>{
 for(const wave of [1,3,6,12])for(const kind of Object.keys(C.SPECS)){
  const rows=['standard','booth','storm'].map(mode=>{
   const s=C.createState({arcade:true,mode,seed:7});s.wave=wave;s.bossSpawned=true;s.spawnTime=0;s.fireTime=100;
   const enemy=C.spawnEnemy(s,kind);C.maintainWorld(s);enemy.position.y=100;enemy.strategy.remainingBeforeAttack=0;
   C.tick(s,1/60);const interval=s.spawnTime;s.spawnTime=100;assert(enemy.attack);
   for(let i=0;i<58;i++)C.tick(s,1/60);
   const bullet=s.entities.find(e=>e.type==='torpedo'&&e.collision.group===C.ENEMY);
   assert(bullet,`${mode} ${kind} fired after warning`);assert.equal(bullet.homing,0);assert(bullet.velocity.speed<=145);
   return {armour:s.hero.maxHp,hp:enemy.maxHp,speed:enemy.velocity.speed,bullet:bullet.velocity.speed,interval};
  });
  assert(rows[2].armour<rows[1].armour&&rows[1].armour<rows[0].armour);
  assert(rows[0].hp<rows[1].hp);assert(rows[0].speed<rows[1].speed&&rows[1].speed<rows[2].speed);
  assert(rows[0].bullet<=rows[1].bullet&&rows[1].bullet<=rows[2].bullet);
  assert(rows[2].interval<rows[1].interval&&rows[1].interval<rows[0].interval);
 }
});
test('Published shared files exactly match the authored runtime',()=>{
 assert.equal(fs.readFileSync(new URL('../site/arcade/journey.js',import.meta.url),'utf8'),shared);
 for(const name of ['fishing','fleet']){const html=fs.readFileSync(new URL(`../site/${name}/index.html`,import.meta.url),'utf8');assert(html.includes(shared));assert(!html.includes('window.__qa'));}
});

test('Slice stages wait for their choice pool, not thirty seconds; completing twice cannot skip a stage',()=>{
 const r=new Run('knife');tick(r,60);assert.equal(r.phase,'play');assert.equal(r.wave,1);
 assert(r.completeRound());assert(!r.completeRound());assert.equal(r.phase,'choice');assert.equal(r.choiceTime,12);
 assert.equal(r.weapon,1);assert.equal(r.choose('weapon'),false);assert(r.choose('focus'));assert.equal(r.wave,2);assert.equal(r.weapon,1);assert.equal(r.roundTime,0);
 const booth=new Run('knife','booth');booth.tick(30);assert.equal(booth.phase,'play');assert.equal(booth.reason,'');assert(booth.completeRound());booth.tick(120);assert.equal(booth.phase,'over');assert.equal(booth.reason,'time');
});
