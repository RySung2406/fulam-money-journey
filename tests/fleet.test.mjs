import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

// Test the exact combat code embedded in the delivered, self-contained HTML.
const html = readFileSync(new URL('../site/fleet/index.html', import.meta.url), 'utf8');
const scripts = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].map(x => x[1]);
const context = vm.createContext({ console });
vm.runInContext(scripts[0], context);
const C = context.FleetCore;
const steps = (s, seconds, input = {}) => { for (let i = 0; i < Math.round(seconds * 60); i++) C.tick(s, 1/60, input); };

test('Swept shells hit a target between two rendered positions', () => {
  assert.equal(C.segmentCircleHit({x:0,y:100},{x:100,y:100},{x:50,y:100},10), true);
  assert.equal(C.segmentCircleHit({x:0,y:100},{x:100,y:100},{x:50,y:125},10), false);
});
test('Homing turns take the short path across the +/-180 degree boundary', () => {
  const vector = d => ({x:Math.cos(d*Math.PI/180), y:Math.sin(d*Math.PI/180)});
  assert(Math.abs(C.angleDifference2DVectors(vector(179),vector(-179))-2*Math.PI/180)<1e-10);
});
test('Buying uses cash, respects upgrade limits and cannot spend below zero', () => {
  const s = C.createState({seed:1});
  assert.equal(C.buy(s,'weapon'), false); assert.equal(s.cash,35);
  s.cash=1000;
  for (let i=0;i<4;i++) assert(C.buy(s,'weapon'));
  assert.equal(s.weapon,5); assert.equal(C.upgradeCost(s,'weapon'),null);
  const remaining=s.cash; assert.equal(C.buy(s,'weapon'),false);assert.equal(s.cash,remaining);
  assert.equal(C.buy(s,'unknown'),false);
});
test('Emergency shields require reserves and respect cooldown', () => {
  const s=C.createState({seed:1}); s.cash=19;
  assert.equal(C.activateShield(s),false);s.cash=20;
  assert(C.activateShield(s));assert.equal(s.cash,0);assert(s.shield>0);
  s.cash=100;assert.equal(C.activateShield(s),false);assert.equal(s.cash,100);
});
test('Armour repair caps at maximum and never charges for a full hull', () => {
  const s=C.createState({seed:1});s.cash=100;
  assert.equal(C.buy(s,'repair'),false);assert.equal(s.cash,100);
  s.hero.hp=90;assert(C.buy(s,'repair'));assert.equal(s.hero.hp,100);assert.equal(s.cash,65);
});
test('Reserve income is earned on remaining cash, not on already spent coins', () => {
  const s=C.createState({seed:2});s.spawnTime=100;s.fireTime=100;s.cash=100;
  steps(s,15.02);assert.equal(s.cash,106);assert.equal(s.income,6);
  const q=C.createState({seed:2});q.spawnTime=100;q.fireTime=100;q.cash=100;C.buy(q,'weapon');
  steps(q,15.02);assert.equal(q.cash,58);assert.equal(q.income,3);
});
test('Shield blocks hostile fire; one hit cannot repeatedly drain the hull', () => {
  const s=C.createState({seed:3});s.spawnTime=100;s.fireTime=100;s.invulnerable=0;
  const add=()=>{for(let i=0;i<8;i++)C.fireTorpedo(s,s.hero.position,0,C.ENEMY,{speed:0,damage:12});C.maintainWorld(s);};
  C.activateShield(s);add();C.tick(s,1/60);assert.equal(s.hero.hp,100);
  s.shield=0;s.invulnerable=0;add();C.tick(s,1/60);assert.equal(s.hero.hp,88);
});
test('Pointer movement is speed limited, reaches its destination and never overshoots', () => {
  const s=C.createState({seed:1});s.spawnTime=100;s.fireTime=100;
  const start={...s.hero.position}, target={x:80,y:200};
  C.tick(s,1/60,{target});
  assert(Math.abs(Math.hypot(s.hero.position.x-start.x,s.hero.position.y-start.y)-230/60)<1e-6);
  assert.notEqual(s.hero.position.x,target.x);
  steps(s,3,{target});assert(Math.abs(s.hero.position.x-target.x)<1e-6);assert(Math.abs(s.hero.position.y-target.y)<1e-6);
  C.tick(s,1/60,{x:1});assert(Math.abs(s.hero.position.x-(target.x+230/60))<1e-6);
});
test('Both routes stay inside the same playfield for keyboard and touch movement', () => {
  for(const mode of ['standard','storm']){
    const s=C.createState({seed:3,mode});s.spawnTime=100;s.fireTime=100;
    steps(s,5,{x:-1,y:-1});assert(s.hero.position.x>=22);assert(s.hero.position.y>=48);
    steps(s,5,{target:{x:999,y:999}});assert(s.hero.position.x<=C.W-22);assert(s.hero.position.y<=C.H-27);
  }
});
test('A lethal shot ends the run exactly once and prevents further spending', () => {
  const s=C.createState({seed:3});s.spawnTime=100;s.fireTime=100;s.invulnerable=0;s.hero.hp=10;s.cash=100;
  C.fireTorpedo(s,s.hero.position,0,C.ENEMY,{speed:0,damage:12});C.maintainWorld(s);C.tick(s,1/60);
  assert.equal(s.hero.hp,0);assert.equal(s.running,false);assert.equal(s.events.filter(e=>e.type==='over').length,1);
  C.tick(s,1/60);assert.equal(s.events.filter(e=>e.type==='over').length,1);
  assert.equal(C.buy(s,'weapon'),false);assert.equal(C.activateShield(s),false);assert.equal(s.cash,100);
});
test('Kills continuously advance sectors and introduce a boss every fourth sector', () => {
  const s=C.createState({seed:4});s.spawnTime=100;s.fireTime=100;
  for(let wave=1;wave<4;wave++){s.waveKills=s.goal;C.tick(s,1/60);assert.equal(s.wave,wave+1);}
  assert.equal(s.entities.filter(e=>e.kind==='boss').length,1);
  s.waveKills=s.goal;C.tick(s,1/60);assert.equal(s.wave,4);
  s.entities.find(e=>e.kind==='boss').dead=true;C.tick(s,1/60);assert.equal(s.wave,5);
});
test('Best record retains one result instead of a session history', () => {
  const s=C.createState({seed:4});s.score=1000;s.wave=3;s.kills=20;
  const first=C.bestRecord(null,s);s.score=400;assert.equal(C.bestRecord(first,s),first);
  s.score=1200;const next=C.bestRecord(first,s);assert.equal(next.score,1200);
  assert.deepEqual(Object.keys(next).sort(),['kills','mode','score','version','wave']);
});
test('Ten minutes of endless combat has no automatic timeout and keeps entity counts bounded', () => {
  const s=C.createState({seed:19});s.invulnerable=Infinity;s.weapon=5;s.escort=3;
  let peak=0;
  for(let i=0;i<36000;i++){
    const time=i/60;
    C.tick(s,1/60,{target:{x:230+Math.sin(time*.7)*140,y:495+Math.sin(time*.4)*65}});
    s.events.length=0;peak=Math.max(peak,s.entities.length);
  }
  assert.equal(s.running,true);assert(s.time>599);assert(s.wave>=8,`Reached sector ${s.wave}`);assert(peak<350,`Peak entities: ${peak}`);
});
test('Delivered HTML is standalone and includes the upstream licence', () => {
  assert(html.includes('Copyright (c) 2017 Jerome Lecomte'));
  assert(!html.match(/<(?:script|link)\b[^>]*(?:src|href)=/));
  assert(!html.includes('/* FLEET_'));assert.equal(scripts.length,3);
});
