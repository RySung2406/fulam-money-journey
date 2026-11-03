import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import fs from 'node:fs';
const context=vm.createContext({console});
const shared=fs.readFileSync(new URL('../sources/arcade/journey.js',import.meta.url),'utf8');
vm.runInContext(shared,context);
vm.runInContext(fs.readFileSync(new URL('../sources/fleet/core.js',import.meta.url),'utf8'),context);
const {Run,readBoard,saveBoard}=context.FuLamJourney,C=context.FleetCore;
const tick=(r,seconds,playing=true)=>{for(let i=0;i<Math.round(seconds*60);i++)r.tick(1/60,playing);};
test('Booth forces one difficulty and a reproducible seed; public runs keep two difficulties',()=>{
 const a=new Run('fleet','booth','challenge',99),b=new Run('fleet','booth','standard',222);
 assert.equal(a.difficulty,'standard');assert.equal(a.seed,b.seed);
 assert.deepEqual(Array.from({length:30},()=>a.random()),Array.from({length:30},()=>b.random()));
 assert.equal(new Run('fleet','web','challenge').difficulty,'challenge');
});
test('Thirty active seconds opens one choice and freezes the active play clock',()=>{
 const r=new Run('fishing');tick(r,30.1);assert.equal(r.phase,'choice');assert.equal(r.wave,1);const t=r.active;
 tick(r,5);assert.equal(r.active,t);assert.equal(r.roundTime,30);assert(r.choiceTime<4);
});
test('An upgrade applies once and switching retains common power with a cooldown',()=>{
 const r=new Run('fleet');tick(r,30.1);assert(r.choose('power'));assert(!r.choose('power'));assert.equal(r.power,1);assert.equal(r.wave,2);
 assert(r.swap());assert.equal(r.weapon,1);assert.equal(r.power,1);assert(!r.swap());tick(r,3.1);assert(r.swap());assert.equal(r.weapon,0);
});
test('Every offered aircraft and fishing weapon can be reached; knives have three',()=>{
 for(const game of ['fishing','fleet','knife']){const r=new Run(game);const seen=new Set([0]);for(let i=0;i<4;i++){tick(r,30.1);assert(r.choose('weapon'));seen.add(r.weapon);}assert.equal(seen.size,game==='knife'?3:4);}
});
test('A paused public run cannot advance rounds or time out, even after an hour',()=>{
 const r=new Run('knife');r.tick(3600,false);assert.equal(r.phase,'play');assert.equal(r.active,0);assert.equal(r.wave,1);
});
test('Booth wall time expires through pause and upgrade, exactly once',()=>{
 for(const inChoice of [false,true]){const r=new Run('fleet','booth');if(inChoice)tick(r,30.1);r.tick(180-r.total,false);assert.equal(r.phase,'over');assert.equal(r.reason,'time');assert.equal(r.total,180);assert.equal(r.finish('defeat'),false);assert.equal(r.reason,'time');assert.equal(r.tick(10),null);assert(!r.choose('power'));assert(!r.swap());}
});
test('Public challenges continue beyond six rounds with bounded choice history',()=>{
 const r=new Run('fleet','web','challenge');for(let i=0;i<110;i++){tick(r,30.1);assert(r.choose('power'));}assert.equal(r.wave,111);assert.equal(r.phase,'play');assert.equal(r.choices.length,100);
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
test('New aircraft fire straight, lasers pierce and missiles home; weapon switching retains strength',()=>{
 for(let kind=0;kind<4;kind++){const s=C.createState({arcade:true,seed:1});s.spawnTime=100;s.weaponKind=kind;s.power=2;C.tick(s,.05);C.tick(s,.05);C.tick(s,.05);const bullets=s.entities.filter(e=>e.type==='torpedo');assert(bullets.length>0);assert(bullets.every(e=>e.damage>=18));if(kind===2)assert(bullets.some(e=>e.pierce===4));if(kind===3)assert(bullets.every(e=>e.homing===3));assert.equal(s.hero.position.r,-Math.PI/2);}
});
test('Arcade round control replaces kill farming and bosses occur every third wave',()=>{
 const s=C.createState({arcade:true,seed:3});s.waveKills=999;C.tick(s,.016);assert.equal(s.wave,1);s.wave=3;C.tick(s,.016);assert.equal(s.entities.filter(e=>e.kind==='boss').length,1);C.tick(s,.016);assert.equal(s.entities.filter(e=>e.kind==='boss').length,1);
});
test('Paid aircraft upgrades add real damage without spending score',()=>{
 const s=C.createState({arcade:true,seed:1});s.cash=500;s.score=1234;s.spawnTime=100;
 assert(C.buy(s,'weapon'));assert.equal(s.power,1.18);assert.equal(s.paidPower,.18);assert.equal(s.score,1234);
 for(let i=0;i<4;i++)C.tick(s,.05);assert(s.entities.filter(e=>e.type==='torpedo').every(e=>Math.abs(e.damage-16*1.18)<1e-9));
});
test('Aircraft boss second phase emits a wider, bounded pattern',()=>{
 for(const [health,count] of [[1,7],[.4,11]]){const s=C.createState({arcade:true,seed:1});s.spawnTime=100;s.fireTime=100;const boss=C.spawnEnemy(s,'boss');C.maintainWorld(s);boss.position.y=100;boss.hp=boss.maxHp*health;boss.strategy.remainingBeforeAttack=0;C.tick(s,.016);assert.equal(s.entities.filter(e=>e.type==='torpedo'&&e.collision.group===C.ENEMY).length,count);}
});
test('Published shared files exactly match the authored runtime',()=>{
 assert.equal(fs.readFileSync(new URL('../site/arcade/journey.js',import.meta.url),'utf8'),shared);
 for(const name of ['fishing','fleet']){const html=fs.readFileSync(new URL(`../site/${name}/index.html`,import.meta.url),'utf8');assert(html.includes(shared));assert(!html.includes('window.__qa'));}
});
