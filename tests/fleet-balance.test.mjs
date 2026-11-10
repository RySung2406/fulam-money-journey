import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const context=vm.createContext({console});
vm.runInContext(fs.readFileSync(new URL('../sources/arcade/journey.js',import.meta.url),'utf8'),context);
vm.runInContext(fs.readFileSync(new URL('../sources/fleet/core.js',import.meta.url),'utf8'),context);
const C=context.FleetCore;
const hostile=s=>s.entities.filter(e=>!e.dead&&e.type==='torpedo'&&e.collision.group===C.ENEMY);

test('Booth opening hits are forgiving, last-round damage is full, and supply stays capped',()=>{
 const damage=[];
 for(let wave=1;wave<=4;wave++){
  const s=C.createState({arcade:true,mode:'booth'});s.wave=wave;s.spawnTime=s.fireTime=100;s.bossSpawned=true;s.invulnerable=0;
  C.fireTorpedo(s,s.hero.position,0,C.ENEMY,{speed:0,damage:20});C.maintainWorld(s);C.tick(s,1/60);
  damage.push(88-s.hero.hp);assert.equal(s.combo,0);assert.equal(s.invulnerable,1.2);
  C.applyRoundUpgrade(s,{weapon:wave,rate:0,trajectory:0},'trajectory');assert.equal(s.hero.hp,88);
 }
 assert.deepEqual(damage.map(n=>Math.round(n)),[13,16,18,20]);
});

test('A slow reactive beginner reaches R4 in most seeded runs; standing still cannot finish',()=>{
 const counts={react:0,idle:0},finished={react:0,idle:0};
 for(const style of ['react','idle'])for(let seed=1;seed<=20;seed++){
  const s=C.createState({arcade:true,mode:'booth',seed});let input={},reached=false;
  for(let frame=0;frame<7200&&s.running;frame++){
   const wave=Math.min(4,Math.floor(frame/1200)+1);
   if(wave!==s.wave){s.wave=wave;s.entities=[];s.raised=[];s.bossSpawned=false;s.invulnerable=1.5;s.spawnTime=.5;C.applyRoundUpgrade(s,{weapon:wave-1,escort:wave>1?1:0,trajectory:wave>2?1:0,rate:wave>3?1:0},'trajectory');}
   if(wave===4)reached=true;
   // 600ms decisions, no prediction, aiming, shield or repair input.
   if(style==='react'&&frame%36===0){const h=s.hero.position,e=hostile(s).find(e=>Math.hypot(h.x-e.position.x,h.y-e.position.y)<175);let d=e?(h.x>e.position.x?1:-1):0;if(e&&h.x<65)d=1;if(e&&h.x>395)d=-1;input={x:d};}
   C.tick(s,1/60,input);s.events=[];
  }
  counts[style]+=reached?1:0;finished[style]+=s.running?1:0;
 }
 assert(counts.react>=8,JSON.stringify(counts));assert.equal(finished.idle,0,JSON.stringify(finished));
});

test('An ordinary volley gives reaction time, locks aim, and can be dodged with keyboard movement',()=>{
 const s=C.createState({arcade:true,mode:'booth',seed:1});s.spawnTime=s.fireTime=100;s.invulnerable=0;
 const e=C.spawnEnemy(s,'fee');C.maintainWorld(s);e.position.y=300;e.originX=230;e.phase=0;e.strategy.remainingBeforeAttack=0;
 C.tick(s,1/60);assert(e.attack);const angle=e.attack.angles[0];
 for(let i=0;i<36;i++)C.tick(s,1/60);assert.equal(hostile(s).length,0,'at least 600ms to react');
 for(let i=0;i<40;i++)C.tick(s,1/60,{x:1});
 assert.equal(hostile(s).length,1);assert.equal(hostile(s)[0].position.r,angle,'does not retarget after wind-up');
 for(let i=0;i<90;i++)C.tick(s,1/60);
 assert.equal(s.hero.hp,88,'a paced sideways dodge avoids the locked shot');
});

test('Enemies never start or finish a point-blank volley',()=>{
 const s=C.createState({arcade:true,seed:1});s.spawnTime=s.fireTime=100;
 const e=C.spawnEnemy(s,'inflation');C.maintainWorld(s);e.position.y=430;e.originX=230;e.phase=0;e.strategy.remainingBeforeAttack=0;
 for(let i=0;i<60;i++)C.tick(s,1/60);
 assert.equal(hostile(s).length,0);assert(!e.attack);
 e.position.y=250;e.strategy.remainingBeforeAttack=0;C.tick(s,1/60);assert(e.attack);
 C.placeHero(s,e.position.x,e.position.y+90);C.tick(s,1/60);assert(!e.attack,'approaching cancels a queued volley');
 assert.equal(hostile(s).length,0);
});

// A bounded keyboard controller samples visible straight trajectories every
// 150ms. It neither teleports nor shields, heals, or changes combat outcomes.
// This verifies feasible routes in seeded runs, not human completion rates.
const directions=[{x:0,y:0},...Array.from({length:8},(_,i)=>({x:Math.cos(i*Math.PI/4),y:Math.sin(i*Math.PI/4)}))];
function dodge(s){
 const h=s.hero.position,threats=s.entities.filter(e=>!e.dead&&(e.type==='ship'||e.type==='torpedo'&&e.collision.group===C.ENEMY));
 let best=directions[0],cost=Infinity;
 for(const dir of directions){
  let risk=0;
  for(const t of [.15,.3,.5,.8,1.1]){
   const x=Math.max(22,Math.min(C.W-22,h.x+dir.x*230*t)),y=Math.max(48,Math.min(C.H-27,h.y+dir.y*230*t));
   risk+=(Math.abs(x-230)*.002+Math.abs(y-535)*.003);
   if(y<360)risk+=(360-y)*.12;if(x<42||x>C.W-42)risk+=2;
   for(const e of threats){
    const ex=e.position.x+(e.type==='torpedo'?e.velocity.dx*e.velocity.speed*t:0);
    const ey=e.position.y+(e.type==='torpedo'?e.velocity.dy*e.velocity.speed*t:e.velocity.speed*t);
    const clearance=Math.hypot(x-ex,y-ey)-e.collision.radius-s.hero.collision.radius;
    if(clearance<50)risk+=Math.max(0,50-clearance)**2/(t+.2);
   }
  }
  if(risk<cost){cost=risk;best=dir;}
 }
 return best;
}

for(const seed of [20261104,7,91])test(`Four rounds have a survivable keyboard route and bounded hostile density (seed ${seed})`,()=>{
 const s=C.createState({arcade:true,mode:'booth',seed});let input={},maxBullets=0,damage=0;
 for(let frame=0;frame<120*60&&s.running;frame++){
  const wave=Math.min(4,Math.floor(frame/(20*60))+1);
  if(wave!==s.wave){s.wave=wave;s.entities=[];s.raised=[];s.bossSpawned=false;s.spawnTime=.5;s.invulnerable=1.5;C.applyRoundUpgrade(s,{weapon:wave-1,trajectory:wave-1,rate:0},'trajectory');}
  if(frame%9===0)input=dodge(s);
  C.tick(s,1/60,input);maxBullets=Math.max(maxBullets,hostile(s).length);
  for(const e of s.events)if(e.type==='damage')damage+=e.amount;s.events=[];
  assert(hostile(s).length<=24+Math.min(4,s.wave)*6);
 }
 assert(s.running&&s.hero.hp>0,`survives: hp=${s.hero.hp}, damage=${damage}, time=${s.time}`);
 assert(s.kills>20,'route still permits active shooting');assert(maxBullets>0,'enemies still attack');
});
