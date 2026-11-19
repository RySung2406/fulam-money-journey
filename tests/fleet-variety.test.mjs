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
test('round 2 and 4 strengthen enemy armour, early rounds spawn denser, and round 4 has a boss',()=>{
 const make=w=>{const s=C.createState({arcade:true,mode:'booth',seed:3});s.wave=w;s.spawnTime=0;s.fireTime=100;const e=C.spawnEnemy(s,'fee');C.tick(s,1/60);return {s,e}};
 const two=make(2),three=make(3),four=make(4);assert(two.e.hp>make(1).e.hp);assert(four.e.hp>three.e.hp);assert(two.s.spawnTime<three.s.spawnTime);assert(four.s.spawnTime>three.s.spawnTime);assert(four.s.entities.some(e=>e.kind==='boss'));
});
test('later booth weapons and wingmen deal 20% less damage, with a further 20% laser reduction in round two',()=>{
  for(const wave of [1,2,3,4]){
    const s=C.createState({arcade:true,mode:'booth',seed:1});
    s.wave=wave;s.evolution.weapon=s.evolution.trajectory=wave-1;
    s.spawnTime=100;s.fireTime=0;s.escort=1;s.escortTime=0;s.ultimate=wave===4;s.ultimateBossSpawned=s.bossSpawned=true;
    C.tick(s,.01);
    const shots=s.entities.filter(e=>e.type==='torpedo'&&e.collision.group===C.FRIEND&&e.style!=='escort');
    assert.equal(shots.length,wave+1);
    const p=ctx.FuLamJourney.weaponProfile('fleet',s.evolution);
    assert(Math.abs(p.interval-.2/1.45)<1e-8);
    assert.equal(p.damage,24*(1+.35*(wave-1)+.04*(wave-1)**2));
    const lateDamage=wave===1?1:.8;
    const laserDamage=wave===2?.8:1;
    const expected=p.damage*.8*.72*(wave===2?.65:.75)*(s.ultimate?1.2:1)*lateDamage*laserDamage;
    assert(Math.abs(shots[0].damage-expected)<1e-8);
    if(wave===2)assert(shots.every(shot=>shot.ray&&Math.abs(shot.damage-expected)<1e-8));
    assert(Math.abs(s.fireTime+.01-p.interval/(s.ultimate?2.25:1))<1e-8);
    assert.equal(s.entities.find(e=>e.style==='escort').damage,21*lateDamage);
    assert(Math.abs(s.escortTime+.01-.7/1.45/(s.ultimate?1.5:1))<1e-8);
  }
});

test('round two introduces rumour aircraft',()=>{
 const s=C.createState({arcade:true,mode:'booth',seed:3});s.wave=2;s.fireTime=100;s.spawnTime=0;C.tick(s,.05);
 const kinds=[];for(let i=0;i<30;i++){s.entities=[];s.raised=[];s.spawnTime=0;C.tick(s,.05);kinds.push(...s.entities.filter(e=>e.type==='ship').map(e=>e.kind));}assert(kinds.includes('rumor'));
});

test('all four booth rounds add 30% to the reinforced arrival rate and active aircraft cap',()=>{
  for(const [wave,ultimate,oldInterval,oldCap] of [
    [1,false,1.25*.72,8], [2,false,1.13*.62,9], [3,false,1.01,7],
    [4,false,.89*1.375,6], [4,true,.89*1.375/2.35,10]
  ]){
    const s=C.createState({arcade:true,mode:'booth',seed:3});
    s.wave=wave;s.ultimate=ultimate;s.ultimateBossSpawned=s.bossSpawned=true;s.fireTime=100;
    const rate=wave===1?1:1.2, extra=wave===2||wave===4?1.2:1;
    const expected=oldInterval/1.12/rate/extra/1.30;
    for(let i=0;i<20;i++){
      s.spawnTime=0;C.tick(s,.01);
      assert(Math.abs(s.spawnTime+.01-expected)<1e-9);
    }
    const previousCap=Math.round(Math.round(oldCap*rate)*extra);
    assert.equal(s.entities.filter(e=>e.type==='ship').length,Math.round(previousCap*1.30));
  }
});

test('all four booth rounds give every enemy, including elites and bosses, 25% more whole-number hull',()=>{
  for(const [kind,spec] of Object.entries(C.SPECS)){
    const base=spec.hp;
    const s=C.createState({mode:'standard',seed:1});
    assert.equal(C.spawnEnemy(s,kind).maxHp,Math.round(Math.round(base*1.15)*.9));
    const bossFactor=kind==='boss'?1.35:kind==='overlord'?1.15:1;
    for(const wave of [1,2,3,4]){
      const stage=C.createState({arcade:true,mode:'booth',seed:1});stage.wave=wave;
      const threat=ctx.FuLamJourney.threatProfile(wave);
      const earlierGrowth=[1,1.34,1,1.18][wave-1], armour=[1,1.20,1.38,1.55][wave-1];
      for(const elite of threat.elite&&!C.isBossKind(kind)?[false,true]:[false]){
        stage.spawnCount=elite?3:0;
        const prior=Math.round(base*threat.health*1.12*1.2*(elite?1.6:1)*earlierGrowth*bossFactor);
        const baseHull=Math.round(Math.round(prior*1.15*armour)*.9);
        const boss=C.isBossKind(kind);
        const gain=wave===1?1:boss?1.20:1.15;
        const lateHull=Math.round(baseHull*gain), previousHull=wave===4&&!boss?Math.round(lateHull*1.10):lateHull;
        const expectedHull=Math.round(previousHull*1.25);
        const ship=C.spawnEnemy(stage,kind);
        assert.equal(ship.elite,elite);assert.equal(ship.hp,expectedHull);assert.equal(ship.maxHp,ship.hp);
      }
    }
  }
});

test('direct and splash strikes, tiny hits, and protected pilot hits leave whole, nonnegative HP',()=>{
  const s=C.createState({arcade:true,mode:'booth',seed:4});
  s.wave=2;s.spawnTime=s.fireTime=100;s.invulnerable=0;s.evolution.protection=1;
  const primary=C.spawnEnemy(s,'fee'),near=C.spawnEnemy(s,'inflation');
  for(const [ship,x] of [[primary,180],[near,230]]){
    ship.originX=x;ship.position.x=x;ship.position.y=240;ship.phase=0;
  }
  C.fireTorpedo(s,primary.position,0,C.FRIEND,{speed:0,damage:10.6,blast:62});
  C.fireTorpedo(s,s.hero.position,0,C.ENEMY,{speed:0,damage:12.4});C.maintainWorld(s);C.tick(s,.01);
  assert.equal(primary.maxHp-primary.hp,8);assert.equal(near.maxHp-near.hp,2);
  assert.equal(s.hero.maxHp-s.hero.hp,9);
  C.fireTorpedo(s,primary.position,0,C.FRIEND,{speed:0,damage:.12});
  C.maintainWorld(s);C.tick(s,.01);assert.equal(primary.maxHp-primary.hp,9);
  C.fireTorpedo(s,primary.position,0,C.FRIEND,{speed:0,damage:100000,blast:62});
  C.maintainWorld(s);C.tick(s,.01);assert.equal(primary.hp,0);assert.equal(near.hp,0);
});

function shootCarrier(s, kind, roll) {
  s.random=()=>roll;s.spawnTime=s.fireTime=100;s.bossSpawned=true;
  const e=C.spawnEnemy(s,kind);e.originX=220;e.phase=0;
  Object.assign(e.position,{x:e.originX,y:kind==='overlord'?12:270});e.echo={...e.position};
  C.fireTorpedo(s,e.position,0,C.FRIEND,{damage:1000000,speed:0});C.maintainWorld(s);C.tick(s,.01);
  return s.entities.filter(v=>v.type==='supply'&&!v.dead).at(-1);
}
test('booth kills respect the five-second timer and can host a supply only once at its deadline',()=>{
  for(const wave of [1,2,3,4]){
    const s=C.createState({arcade:true,mode:'booth',seed:3});s.wave=wave;s.time=4.98;
    assert(!shootCarrier(s,'flash',0));
    assert.equal(s.chipCount,0);
    const drop=shootCarrier(s,'flash',.75);assert.equal(drop.kind,'course');
    assert.equal(s.lastSupplyAt,5);
    assert(s.course,'the effect activates as soon as its deadline is reached');
    assert.equal(shootCarrier(s,'bubble',0),drop);
    assert.equal(s.chipCount,1);
    s.time=9.99;assert.equal(shootCarrier(s,'bubble',.3).kind,'echo');
    assert.equal(s.lastSupplyAt,10);assert(s.decoy);
    assert.equal(s.chipCount,2);
  }
});
test('a motionless pilot gets regular deployments and scored relay flights with no enemies, firing or kills',()=>{
  const s=C.createState({arcade:true,mode:'booth',seed:1});s.spawnTime=s.fireTime=200;
  s.random=()=>.8;
  const initial={...s.hero.position},deployments=[],scores=[];
  for(let frame=0;frame<17*60;frame++){
    C.tick(s,1/60);
    for(const e of s.events){if(e.type==='deploy')deployments.push([s.time,e.kind]);if(e.type==='gate')scores.push(e.amount);}
    s.events.length=0;
  }
  assert.equal(s.kills,0);assert.equal(s.shots,0);assert.equal(s.hero.position.x,initial.x);assert.equal(s.hero.position.y,initial.y);
  assert.deepEqual(deployments.map(e=>e[1]),['course','course','course']);
  assert.deepEqual(deployments.map(e=>Number(e[0].toFixed(6))),[5,10,15]);
  assert.deepEqual(scores,[40,70,140,40,70,140,40,70,140]);assert.equal(s.relayScore,750);assert.equal(s.score,750);
  const before=s.chipCount;C.tick(s,0);s.running=false;C.tick(s,1);assert.equal(s.chipCount,before);
  const reset=C.createState({arcade:true,mode:'booth'});assert.equal(reset.chipCount,0);assert.equal(reset.relayScore,0);assert.equal(reset.course,null);
});
test('booth supply rolls give wingmen 5%, boosts 20%, interceptors 25% and drones 50%',()=>{
  for(const [roll,kind] of [[0,'wingman'],[.0499,'wingman'],[.05,'boost'],[.2499,'boost'],[.25,'echo'],[.4999,'echo'],[.50,'course'],[.9999,'course']]){
    const s=C.createState({arcade:true,mode:'booth'});
    s.random=()=>roll;s.time=4.99;s.spawnTime=s.fireTime=100;
    C.tick(s,.01);
    assert.equal(s.lastSupplyKind,kind);
    assert.equal(s.events.filter(e=>e.type==='deploy').length,1);
  }
});
test('a boost accelerates both keyboard and touch steering by 25% and expires in four seconds',()=>{
  for(const input of [{x:1},{target:{x:400,y:530}}]){
    const s=C.createState({arcade:true,mode:'booth'});
    s.random=()=>.1;s.time=4.99;s.spawnTime=s.fireTime=100;
    C.placeHero(s,160,530);
    C.tick(s,.01);assert.equal(s.boostTime,4);
    C.tick(s,.05,input);
    assert(Math.abs(s.hero.position.x-160-s.hero.velocity.speed*1.25*.05)<1e-8);
    for(let frame=0;frame<79;frame++)C.tick(s,.05);
    C.tick(s,.05,input);assert.equal(s.boostTime,0);
    assert(Math.abs(s.hero.position.x-160-s.hero.velocity.speed*2.25*.05)<1e-8);
  }
});
test('rare wingman flies and fires for the rest of the run, alongside the round-three escort',()=>{
  const s=C.createState({arcade:true,mode:'booth'});
  s.random=()=>.01;s.time=4.99;s.fireTime=s.spawnTime=100;
  C.tick(s,.01);assert.equal(s.hasSupportWingman,true);assert.equal(s.escort,0);
  C.tick(s,.01);
  assert(s.entities.some(e=>e.style==='escort'),'fires without pilot input');
  for(const wave of [2,3,4]){
    s.wave=wave;s.bossSpawned=true;
    C.applyRoundUpgrade(s,{escort:wave>=3?1:0,weapon:wave-1,rate:0,trajectory:wave-1},'trajectory');
    for(let i=0;i<200;i++)C.tick(s,.05);
    assert.equal(s.hasSupportWingman,true);
    assert.equal(s.lastSupplyKind,'boost','later supply continues alongside the permanent wingman');
    assert.equal(C.activeEscorts(s),wave>=3?2:1);
    C.placeHero(s,wave===3?22:C.W-22,C.H-27);
    s.entities=[];s.escortTime=0;C.tick(s,.01);
    const wings=C.escortFormation(s),shots=s.entities.filter(e=>e.style==='escort');
    assert.equal(shots.length,wings.length);
    assert.equal(wings.filter(w=>w.support).length,1);
    wings.forEach((wing,i)=>{
      assert(wing.x>=17&&wing.x<=C.W-17&&wing.muzzleY>=0&&wing.y+20<=C.H);
      assert.equal(shots[i].previous.x,wing.x);assert.equal(shots[i].previous.y,wing.muzzleY);
    });
  }
  const next=C.createState({arcade:true,mode:'booth'});
  assert.equal(next.hasSupportWingman,false);assert.equal(C.activeEscorts(next),0);
});
test('the drone flies each beacon independently and the echo draws fire from a stationary jet',()=>{
  const s=C.createState({arcade:true,mode:'booth',seed:3});s.spawnTime=s.fireTime=100;s.time=4.99;
  C.placeHero(s,125,525);
  shootCarrier(s,'flash',.75);for(let i=0;i<30;i++)C.tick(s,1/60);
  assert(s.course);assert.notEqual(s.course.x,s.hero.position.x);
  for(let i=0;i<100;i++)C.tick(s,1/60);
  assert.equal(s.relayScore,250);
  assert.equal(s.course,null);
  s.time=9.99;shootCarrier(s,'bubble',.3);
  for(let i=0;i<30;i++)C.tick(s,1/60);const echo=s.decoy;assert.equal(echo.kind,'echo');
  const enemy=C.spawnEnemy(s,'fee');enemy.originX=echo.x;enemy.position.y=50;enemy.phase=0;enemy.strategy.remainingBeforeAttack=0;
  C.maintainWorld(s);C.tick(s,.01);assert(Math.abs(enemy.attack.angles[0]-Math.PI/2)<.01);
  const score=s.score;C.fireTorpedo(s,echo,Math.PI/2,C.ENEMY,{speed:1});C.maintainWorld(s);C.tick(s,.01);
  assert.equal(s.score,score+35);assert.equal(s.shield,0);
  C.fireTorpedo(s,echo,Math.PI/2,C.ENEMY,{speed:1,style:'storm'});C.maintainWorld(s);C.tick(s,.01);
  assert(s.entities.some(e=>e.style==='storm'),'flagship patterns remain live');
});

test('arcade coins travel to a stationary player from the opposite edge',()=>{
  const s=C.createState({arcade:true,mode:'booth',seed:2});s.spawnTime=s.fireTime=100;
  C.placeHero(s,30,C.H-30);
  const ship=C.spawnEnemy(s,'fee');ship.originX=400;ship.phase=0;ship.position.x=400;ship.position.y=34;s.random=()=>0;
  C.fireTorpedo(s,ship.position,0,C.FRIEND,{speed:0,damage:10000});C.maintainWorld(s);C.tick(s,.01);
  assert(s.entities.some(e=>e.type==='coin'));
  for(let frame=0;frame<30;frame++)C.tick(s,1/60);
  assert.equal(s.coinsCollected,1);assert(s.cash>35);
});

test('an auto-collected echo positions itself directly in a live incoming shot path',()=>{
  const s=C.createState({arcade:true,mode:'booth',seed:1});s.time=4.99;
  const h=s.hero.position;
  const shot=C.fireTorpedo(s,{x:h.x+28,y:h.y-135},Math.PI/2,C.ENEMY,{speed:115});
  shootCarrier(s,'bubble',.3);
  for(let i=0;i<30;i++)C.tick(s,1/60);
  assert(s.decoy);assert(Math.abs(s.decoy.x-(h.x+28))<.01);
  assert(s.decoy.y<h.y-45);
  for(let i=0;i<35;i++)C.tick(s,1/60);
  assert(shot.dead);assert(s.events.some(e=>e.type==='decoyHit'));
});

test('gliders bank, level and dive without firing; heavy airships drift and fire from both sides',()=>{
  const s=C.createState({arcade:true,mode:'booth',seed:2});
  s.fireTime=s.spawnTime=100;
  const glider=C.spawnEnemy(s,'flash');glider.originX=200;glider.phase=Math.PI/2;
  glider.position.y=25;glider.age=.8;C.maintainWorld(s);
  C.tick(s,.04);const banking=glider.position.x;
  assert(Math.abs(glider.bank)>.1);C.tick(s,.04);assert(glider.position.x>banking);
  glider.age=2.1;C.tick(s,.04);
  const lane=glider.position.x,levelY=glider.position.y;C.tick(s,.04);
  const levelDrop=glider.position.y-levelY;
  glider.age=3.05;const beforeDive=glider.position.y;C.tick(s,.04);
  assert.equal(glider.position.x,lane);assert(glider.position.y-beforeDive>8*levelDrop);
  assert(!glider.attack);
  assert(!s.entities.some(e=>e.type==='torpedo'));
  const airship=C.spawnEnemy(s,'bubble');C.maintainWorld(s);
  airship.position.y=160;airship.strategy.remainingBeforeAttack=0;
  assert(airship.maxHp>glider.maxHp && airship.velocity.speed<glider.velocity.speed);
  C.tick(s,.05);assert.equal(airship.attack.angles.length,2);
  for(let frame=0;frame<45;frame++)C.tick(s,1/60);
  const shots=s.entities.filter(e=>e.type==='torpedo'&&e.collision.group===C.ENEMY);
  assert.equal(shots.length,2);
  const left=shots.find(e=>e.velocity.dx<0),right=shots.find(e=>e.velocity.dx>0);
  assert(left && right && right.position.x-left.position.x>32);
});

test('final flagship displaces an undefeated miniboss, warns before each pattern and escalates before timeout',()=>{
  const s=C.createState({arcade:true,mode:'booth',seed:4});
  s.wave=4;s.spawnTime=s.fireTime=100;s.ultimate=true;
  const mini=C.spawnEnemy(s,'boss');
  C.fireTorpedo(s,s.hero.position,0,C.ENEMY,{speed:0});
  C.maintainWorld(s);C.tick(s,1/60);
  assert(mini.dead);assert(!s.entities.some(e=>e.collision.group===C.ENEMY&&e.type==='torpedo'));
  const boss=s.entities.find(e=>e.kind==='overlord');
  assert(boss.position.y>=0);assert.equal(C.spawnUltimateBoss(s),false);
  const patterns=[];let lastAttack=null,firstShot=0,charged=false;
  for(let i=0;i<60*14;i++){
    C.tick(s,1/60);
    if(boss.attack && boss.attack!==lastAttack){
      const attack=boss.attack;lastAttack=attack;const lanes=!!attack.origins;
      assert(attack.duration>=.8);
      if(lanes)assert(attack.origins.every(x=>Math.abs(x-attack.gap)>52));
      patterns.push(lanes?'lanes':'fan');
    }
    if(!firstShot && s.entities.some(e=>e.style==='storm'))firstShot=s.time;
    if(s.events.some(e=>e.type==='stormPhase'))charged=true;
    s.events.length=0;
  }
  assert.deepEqual(patterns.slice(0,4),['fan','lanes','fan','lanes']);
  assert(firstShot>2 && firstShot<3);assert(charged);assert(s.running);
  assert(s.entities.some(e=>e.style==='storm'&&e.velocity.speed>180));
});

test('following the open flagship core earns counters and beats parking at centre',()=>{
  const fly=tracking=>{
    const s=C.createState({arcade:true,mode:'booth',seed:20261104});
    s.wave=4;s.ultimate=true;
    C.applyRoundUpgrade(s,{weapon:3,trajectory:3,escort:1,rate:0},'trajectory');
    C.spawnUltimateBoss(s);C.maintainWorld(s);
    const boss=s.entities.find(e=>e.kind==='overlord');
    const target={x:C.W/2,y:C.H*.84};C.placeHero(s,target.x,target.y);
    let counters=0,finish=0;
    for(let frame=0;frame<900&&!boss.dead;frame++){
      if(tracking&&frame>=60&&frame%15===0)target.x=boss.position.x+28*Math.sin((frame+1)/60*2.6);
      C.tick(s,1/60,{target});
      counters+=s.events.filter(e=>e.type==='counter').length;
      finish+=s.events.filter(e=>e.type==='flagshipDown').length;
      s.events.length=0;
    }
    assert(s.running);
    if(boss.dead){
      assert.equal(finish,1);
      assert(!s.entities.some(e=>!e.dead && e.style==='storm'));
    }
    return {time:s.time,counters,defeated:boss.dead};
  };
  const pilot=fly(true),idle=fly(false);
  assert(pilot.defeated && pilot.counters>0 && pilot.time<15);
  assert(idle.time>pilot.time+2);
});
