import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
const ctx=vm.createContext({});
vm.runInContext(fs.readFileSync('sources/arcade/journey.js','utf8'),ctx);
vm.runInContext(fs.readFileSync('sources/fleet/core.js','utf8'),ctx);
const C=ctx.FleetCore;
test('new threats warn before distinct bounded volleys and never home in arcade',()=>{
 for(const [kind,counts] of [['trap',[2,3]],['myth',[2,4]]]){
  const s=C.createState({arcade:true,mode:'booth',seed:1});s.spawnTime=s.fireTime=100;
  const e=C.spawnEnemy(s,kind);C.maintainWorld(s);e.position.y=200;e.strategy.remainingBeforeAttack=0;
  C.tick(s,1/60);assert(e.attack);assert(counts.includes(e.attack.angles.length));
  for(let i=0;i<30;i++)C.tick(s,1/60);assert.equal(s.entities.filter(e=>e.type==='torpedo').length,0);
  for(let i=0;i<20;i++)C.tick(s,1/60);
  const shots=s.entities.filter(e=>e.type==='torpedo'&&e.collision.group===C.ENEMY);
  assert(counts.includes(shots.length));assert(shots.every(x=>x.homing===0&&x.velocity.speed<=145));
 }
});
test('round 2 and 4 strengthen enemy armour, spawn faster and round 4 has a boss',()=>{
 const make=w=>{const s=C.createState({arcade:true,mode:'booth',seed:3});s.wave=w;s.spawnTime=0;s.fireTime=100;const e=C.spawnEnemy(s,'fee');C.tick(s,1/60);return {s,e}};
 const two=make(2),three=make(3),four=make(4);assert(two.e.hp>make(1).e.hp);assert(four.e.hp>three.e.hp);assert(four.s.spawnTime<three.s.spawnTime);assert(four.s.entities.some(e=>e.kind==='boss'));
});
test('round two lasers do less damage than the prior balance',()=>{
 const s=C.createState({arcade:true,mode:'booth',seed:1});s.wave=2;s.evolution.weapon=1;s.spawnTime=100;s.fireTime=0;C.tick(s,.05);
 const beams=s.entities.filter(e=>e.type==='torpedo'&&e.ray);assert(beams.length>0);
 const profile=ctx.FuLamJourney.weaponProfile('fleet',s.evolution);assert(beams.every(e=>Math.abs(e.damage-profile.damage*.8*.72*.65)<1e-8));
});

test('round two increases spawn rate by 15 percent and introduces rumour aircraft',()=>{
 const s=C.createState({arcade:true,mode:'booth',seed:3});s.wave=2;s.fireTime=100;s.spawnTime=0;C.tick(s,.05);
 const expected=Math.max(.72,1.25-.12)*.88/1.15/1.12-.05;assert(Math.abs(s.spawnTime-expected)<1e-8);
 const kinds=[];for(let i=0;i<30;i++){s.entities=[];s.raised=[];s.spawnTime=0;C.tick(s,.05);kinds.push(...s.entities.filter(e=>e.type==='ship').map(e=>e.kind));}assert(kinds.includes('rumor'));
});
