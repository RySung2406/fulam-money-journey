/*
 * FuLam Wealth Fleet — combat adapted from SUBmersible WARship 2063.
 * Original Copyright (c) 2017 Jerome Lecomte, MIT.
 * Source: https://github.com/herebefrogs/submersible-warship-2063
 * Adapted components, entity lifecycle, targeting, homing and circle collisions.
 * The complete original MIT notice is embedded in the delivered HTML.
 */
(function (root) {
  'use strict';
  const W = 460, H = 660, FRIEND = 1, ENEMY = 2, TAU = Math.PI * 2;
  const clamp = (n, a, b) => Math.max(a, Math.min(b, n));
  const FLIGHT_DAMAGE = 1.5, FLIGHT_RATE = 1.45;
  function takeHullDamage(entity, amount) {
    const loss = Math.min(entity.hp, amount > 0 ? Math.max(1, Math.round(amount)) : 0);
    entity.hp -= loss;
    return loss;
  }
  function Position(x, y, r = 0) { this.x = x; this.y = y; this.r = r; }
  function Velocity(speed, dx = 0, dy = 0) { this.speed = speed; this.dx = dx; this.dy = dy; }
  function Collision(collide, killable, radius, group) {
    this.collide = collide; this.killable = killable; this.radius = radius; this.group = group;
  }
  function Strategy(type, nextAttack = 2) {
    this.type = type; this.target = null; this.nextAttack = nextAttack; this.remainingBeforeAttack = nextAttack;
  }
  function Ttl(time) { this.timeLeft = time; }
  function createEntity(type, components) {
    return { ...components, echo: { ...components.position }, online: true, type, dead: false };
  }
  function distanceSquare(a, b) { return (a.x - b.x) ** 2 + (a.y - b.y) ** 2; }
  function inRange(a, b, distance) { return distanceSquare(a, b) <= distance * distance; }
  function testCircleCollision(a, b) {
    return a.collision.collide && b.collision.collide && inRange(a.position, b.position, a.collision.radius + b.collision.radius);
  }
  // Swept collision keeps fast shells reliable at low display refresh rates.
  function segmentCircleHit(start, end, center, radius) {
    const dx = end.x - start.x, dy = end.y - start.y;
    const length = dx * dx + dy * dy;
    const t = length ? clamp(((center.x - start.x) * dx + (center.y - start.y) * dy) / length, 0, 1) : 0;
    return distanceSquare({ x: start.x + dx * t, y: start.y + dy * t }, center) <= radius * radius;
  }
  function angleDifference2DVectors(a, b) {
    const delta = Math.atan2(b.y, b.x) - Math.atan2(a.y, a.x);
    return Math.atan2(Math.sin(delta), Math.cos(delta));
  }
  function rng(seed) {
    return () => { let t = seed += 0x6D2B79F5; t = Math.imul(t ^ t >>> 15, t | 1); t ^= t + Math.imul(t ^ t >>> 7, t | 61); return ((t ^ t >>> 14) >>> 0) / 4294967296; };
  }
  const SPECS = {
    fee: { hp: 22, radius: 15, speed: 45, value: 10, attack: 3.2 },
    inflation: { hp: 52, radius: 20, speed: 29, value: 18, attack: 3.5 },
    scam: { hp: 26, radius: 14, speed: 86, value: 16, attack: 2.8 },
    debt: { hp: 82, radius: 23, speed: 25, value: 26, attack: 3.3 },
    trap: { hp: 46, radius: 18, speed: 38, value: 20, attack: 3.4 },
    myth: { hp: 38, radius: 16, speed: 53, value: 18, attack: 3.1 },
    rumor: { hp: 28, radius: 14, speed: 48, value: 16, attack: 3.6 },
    bubble: { hp: 60, radius: 20, speed: 34, value: 20, attack: 3.5 },
    flash: { hp: 32, radius: 13, speed: 52, value: 18, attack: Infinity },
    boss: { hp: 470, radius: 43, speed: 28, value: 130, attack: 1.7 },
    overlord: { hp: 980, radius: 52, speed: 24, value: 420, attack: 1.45 }
  };
  const MAX = { weapon: 5, escort: 3, reserve: 3 };
  const BOOTH_SUPPLY_INTERVAL = 5;
  const BOOST_DURATION = 4;
  const COSTS = { weapon: [0, 45, 85, 145, 220], escort: [65, 120, 190], reserve: [50, 90, 140] };
  const MODE_RULES = {
    standard: { armour: 100, enemy: 1, bullet: 1 },
    booth: { armour: 88, enemy: 1.12, bullet: 1.12 },
    storm: { armour: 75, enemy: 1.2, bullet: 1.16 }
  };
  function createState({ seed = Date.now(), mode = 'standard', arcade = false } = {}) {
    mode = Object.hasOwn(MODE_RULES, mode) ? mode : 'standard';
    const state = {
      arcade, evolution:{weapon:0,rate:0,trajectory:0,life:0,protection:0}, weaponKind: 0, power: 1, paidPower: 0, spawnCount:0, roundTwoSpawns:0,
      mode, random: rng(seed), time: 0, wave: 1, waveKills: 0,
      goal: 8, kills: 0, score: 0, coinsCollected: 0, cash: 35, income: 0, dividend: 0, combo: 0, comboTime: 0,
      weapon: 1, escort: 0, reserve: 0, shield: 0, shieldCooldown: 0, invulnerable: 1.5,
      fireTime: 0.1, escortTime: 0.5, lastEscortFireAt: -Infinity, shots: 0, spawnTime: 0.45, bossSpawned: false, nextVolleyAt: 0,
      ultimate: false, ultimateBossSpawned: false, seenKinds: new Set(),
      course: null, decoy: null, lastHeading: null, lastSupplyAt: 0, lastSupplyKind: null,
      boostTime: 0, hasSupportWingman: false,
      relayScore: 0, decoyScore: 0, chipCount: 0,
      entities: [], raised: [], events: [], running: true, lastReason: null,
      hero: createEntity('player', { position: new Position(W / 2, H - 100, -Math.PI / 2), velocity: new Velocity(230), collision: new Collision(true, true, arcade ? 8 : 13, FRIEND), hp: MODE_RULES[mode].armour, maxHp: MODE_RULES[mode].armour })
    };
    return state;
  }
  function emit(s, type, data = {}) { s.events.push({ type, ...data }); if (s.events.length > 80) s.events.shift(); }
  function getEnemiesSortedByDistance(s, entity) {
    return s.entities.filter(e => !e.dead && e.online && e.type === 'ship' && e.collision.group !== entity.collision.group)
      .sort((a, b) => distanceSquare(a.position, entity.position) - distanceSquare(b.position, entity.position));
  }
  function maintainWorld(s) {
    s.entities = s.entities.filter(e => !e.dead);
    s.entities.push(...s.raised); s.raised.length = 0;
  }
  function isBossKind(kind){return kind==='boss'||kind==='overlord';}
  function isBoothRound(s) {
    return s.arcade && s.mode === 'booth' && s.wave >= 1 && s.wave <= 4;
  }
  function isLateBoothRound(s) {
    return isBoothRound(s) && s.wave >= 2;
  }
  function spawnEnemy(s, kind) {
    const r = s.random, spec = SPECS[kind];
    const threat=s.arcade&&root.FuLamJourney?root.FuLamJourney.threatProfile(s.wave):null;
    const growth = threat?threat.health:1+(s.wave-1)*.14;
    const elite=!!(threat?.elite&&!isBossKind(kind)&&++s.spawnCount%4===0);
    const priorHp = Math.round(spec.hp * growth * MODE_RULES[s.mode].enemy * (s.mode==='booth'?(s.arcade?1.2:1.7):1) * (elite?1.6:1) * (s.arcade?(s.wave===2?1.34:s.wave===4?1.18:1):1) * (threat&&isBossKind(kind)?(kind==='overlord'?1.15:(s.wave<=4?1.35:2+s.wave*.15)):1));
    const lateArmour = s.arcade && s.mode === 'booth' ? [1, 1.20, 1.38, 1.55][Math.min(4, s.wave) - 1] : 1;
    const baseHull = Math.round(Math.round(priorHp * 1.15 * lateArmour) * .9);
    const lateBooth = isLateBoothRound(s);
    const boss = isBossKind(kind);
    const lateHull = lateBooth ? Math.round(baseHull * (boss ? 1.20 : 1.15)) : baseHull;
    const roundHull = lateBooth && s.wave === 4 && !boss ? Math.round(lateHull * 1.10) : lateHull;
    const hp = isBoothRound(s) ? Math.round(roundHull * 1.25) : roundHull;
    const x = isBossKind(kind) ? W / 2 : 38 + r() * (W - 76);
    const entity = createEntity('ship', {
      kind, elite, position: new Position(x, -65, Math.PI / 2), velocity: new Velocity(spec.speed * MODE_RULES[s.mode].enemy*(threat?.speed||1)),
      collision: new Collision(true, true, spec.radius, ENEMY), strategy: new Strategy(kind, s.arcade ? Math.max(isBossKind(kind)?2.1:2.7,spec.attack/(1+Math.min(6,s.wave-1)*.035)) : spec.attack / Math.min(2, 1 + s.wave * 0.035) / (s.mode==='booth'?1.45:1)),
      hp, maxHp: hp, value: spec.value, age: 0, phase: r() * TAU, originX: x, flash: 0,
      firstEncounter: !s.seenKinds.has(kind)
    });
    if(kind==='overlord'){entity.volleyIndex=0;entity.enraged=false;entity.coreOpen=0;}
    s.seenKinds.add(kind);
    s.raised.push(entity); return entity;
  }
  function screenRay(x, y, angle) {
    const dx = Math.cos(angle), dy = Math.sin(angle);
    const edges = [];
    if (dx > 1e-4) edges.push((W + 40 - x) / dx);
    if (dx < -1e-4) edges.push((-40 - x) / dx);
    if (dy > 1e-4) edges.push((H + 40 - y) / dy);
    if (dy < -1e-4) edges.push((-40 - y) / dy);
    const reach = edges.filter(t => t > 1).reduce((a, t) => Math.min(a, t), Math.hypot(W, H) * 1.25);
    return { start: { x, y }, end: { x: x + dx * reach, y: y + dy * reach } };
  }
  function fireTorpedo(s, position, angle, group, { damage = 12, speed = 340, radius = 4, homing = 0, pierce = 0, style = 'shell', color = '', blast = 0, chain = 0, ray = null } = {}) {
    if (s.entities.length + s.raised.length > 310) return null;
    if (group === FRIEND && isLateBoothRound(s)) {
      damage *= .8;
      if (s.wave === 2 && ray) damage *= .8;
    }
    const entity = createEntity('torpedo', {
      position: new Position(position.x, position.y, angle), previous: { x: position.x, y: position.y },
      velocity: new Velocity(ray ? 0 : speed, Math.cos(angle), Math.sin(angle)),
      collision: new Collision(true, true, radius, group), strategy: new Strategy(homing ? 'cruise' : 'straight'),
      ttl: new Ttl(ray ? 0.18 : group === FRIEND ? 2.8 : 6), damage, homing, pierce, style, color, blast, chain, ray, hit: new Set(), grazed: false, jellyColour:style==='jelly'?s.shots%5:0
    });
    s.raised.push(entity); return entity;
  }
  // Seekers stop chasing once they slip below the player jet and keep their
  // last heading instead of looping back for a second pass.
  function aboveJet(s, e) {
    return e && e.position && e.position.y < s.hero.position.y - 10;
  }
  function pastHero(s, entity) {
    return entity.position.y > s.hero.position.y - 8;
  }
  function refreshStrategy(s, entity) {
    const strategy = entity.strategy;
    if (!entity.homing) return;
    const friendly = entity.collision.group === FRIEND;
    if (strategy.target && (strategy.target.dead || !strategy.target.online || (friendly && !aboveJet(s, strategy.target)) || (!friendly && pastHero(s, entity)))) {
      strategy.target = null; strategy.type = 'cruise';
    }
    if (strategy.type === 'cruise') {
      if (!friendly && pastHero(s, entity)) return;
      const targets = friendly ? getEnemiesSortedByDistance(s, entity).filter(e => aboveJet(s, e)) : [s.hero];
      const found = targets.find(e => inRange(entity.position, e.position, 430) && Math.abs(angleDifference2DVectors({ x: entity.velocity.dx, y: entity.velocity.dy }, { x: e.position.x - entity.position.x, y: e.position.y - entity.position.y })) < Math.PI / 2);
      if (found) { strategy.target = found; strategy.type = 'lockon'; }
    }
  }
  function applyStrategy(s, entity, dt) {
    const target = entity.strategy.target;
    if (!entity.homing || !target) return;
    const friendly = entity.collision.group === FRIEND;
    if ((friendly && !aboveJet(s, target)) || (!friendly && pastHero(s, entity))) {
      entity.strategy.target = null; entity.strategy.type = 'cruise'; return;
    }
    const delta = angleDifference2DVectors({ x: entity.velocity.dx, y: entity.velocity.dy }, { x: target.position.x - entity.position.x, y: target.position.y - entity.position.y });
    const turn = clamp(delta, -entity.homing * dt, entity.homing * dt);
    entity.position.r += turn;
    entity.velocity.dx = Math.cos(entity.position.r); entity.velocity.dy = Math.sin(entity.position.r);
  }
  function applyVelocityToPosition(entity, dt) {
    entity.position.x += entity.velocity.dx * entity.velocity.speed * dt;
    entity.position.y += entity.velocity.dy * entity.velocity.speed * dt;
  }
  function weaponFire(s) {
    const targets = getEnemiesSortedByDistance(s, s.hero).filter(e => e.position.y > -15 && e.position.y < H + 15);
    const target = targets[0];
    const angle = target ? Math.atan2(target.position.y - s.hero.position.y, target.position.x - s.hero.position.x) : -Math.PI / 2;
    s.hero.position.r = angle;
    const level = s.weapon;
    if(s.arcade&&root.FuLamJourney){
      const p=root.FuLamJourney.weaponProfile('fleet',s.evolution);s.hero.position.r=-Math.PI/2;
      const booth=s.mode==='booth',form=!booth?null:p.tier>=4?'plane':p.tier===3?'bomb':p.tier===2?'laser':'bullet',reach=booth?1.8:1,hurt=booth?.8:1;
      const traj=Math.max(0,s.evolution.trajectory||0);
      const fan=(base,step)=>{const count=Math.min(7,base+traj);return Array.from({length:count},(_,i)=>count<=1?0:(i-(count-1)/2)*(count===2?step:.1));};
      const forms={bullet:{style:'snowflake',spread:fan(2,.1),radius:4.2,color:'#eef8ff',blast:0,pierce:0,speed:p.speed,homing:0},laser:{style:'candycane',count:Math.min(7,2+traj),radius:2.8,color:'#c23b3b',blast:0,pierce:24,speed:0,homing:0},bomb:{style:'bell',spread:fan(2,.12),radius:7.2,color:'#f0d878',blast:22,pierce:0,speed:460,homing:0},plane:{style:'jelly',spread:fan(2,.1),radius:5.4,color:'#e85a9a',blast:28,pierce:2,speed:600,homing:0}};
      if(form){const spec=forms[form];if(form==='laser'){const n=spec.count,gap=18;for(let i=0;i<n;i++){const from={x:s.hero.position.x+(i-(n-1)/2)*gap,y:s.hero.position.y-26},aim=-Math.PI/2;fireTorpedo(s,from,aim,FRIEND,{damage:p.damage*(1+s.paidPower)*hurt*.72*.65,speed:0,radius:spec.radius,homing:0,pierce:spec.pierce,style:spec.style,color:spec.color,blast:0,chain:0,ray:screenRay(from.x,from.y,aim)});}}else for(const off of spec.spread){const aim=-Math.PI/2+off,from={x:s.hero.position.x+Math.sign(off)*10,y:s.hero.position.y-26};fireTorpedo(s,from,aim,FRIEND,{damage:p.damage*(1+s.paidPower)*hurt*.72*(off===0?1:.75)*(s.ultimate&&form==='plane'?1.2:1),speed:spec.speed*(s.ultimate?1.12:1),radius:spec.radius,homing:spec.homing||0,pierce:spec.pierce,style:spec.style,color:spec.color,blast:spec.blast*(s.ultimate?1.25:1),chain:0,ray:null});}}
      else {const style=p.kind==='orb'?'orb':p.kind==='beam'?'beam':p.kind==='missile'?'missile':p.kind==='arc'?'arc':'shell';for(const off of p.spread)fireTorpedo(s,{x:s.hero.position.x,y:s.hero.position.y-26},-Math.PI/2+off,FRIEND,{damage:p.damage*(1+s.paidPower)*.72*(p.count===2?.65:off!==0?.55:1),speed:p.speed,radius:(p.kind==='orb'?7:p.kind==='missile'?8:3.5)*reach,homing:p.homing,pierce:p.pierce,style,color:p.color,blast:(p.blast||(booth?42:0))*reach,chain:p.chain});}
      s.shots++;emit(s,'fire');return;
    }
    if(s.arcade){
      const kind=s.weaponKind, a=-Math.PI/2;
      s.hero.position.r=a;
      const offsets=kind===1?[-.25,-.125,0,.125,.25]:kind===3?[-.08,.08]:level>=3?[-.035,.035]:[0];
      for(const off of offsets)fireTorpedo(s,{x:s.hero.position.x,y:s.hero.position.y-26},a+off,FRIEND,{damage:(kind===1?9:kind===3?22:kind===2?28:16)*s.power*FLIGHT_DAMAGE,speed:kind===3?265:kind===2?850:520,radius:kind===3?5:3.5,homing:kind===3?3:0,pierce:kind===2?4:kind===0&&level>=4?1:0,style:kind===3?'orb':'beam'});
      s.shots++;emit(s,'fire');return;
    }
    const angles = level === 1 ? [0] : level === 2 ? [-0.055, 0.055] : [-0.18, 0, 0.18];
    const orb = level === 5 && s.shots % 3 === 0;
    for (const offset of angles) {
      fireTorpedo(s, { x: s.hero.position.x + Math.cos(angle) * 24, y: s.hero.position.y + Math.sin(angle) * 24 }, angle + offset, FRIEND,
        { damage: (orb ? 42 : 12 + level * 2) * FLIGHT_DAMAGE, speed: orb ? 300 : 440, radius: orb ? 11 : 3.7,
          homing: level >= 3 ? 0.8 : 1.2, pierce: level >= 4 ? (orb ? 4 : 2) : 0, style: orb ? 'orb' : level >= 4 ? 'beam' : 'shell' });
    }
    s.shots++; emit(s, 'fire');
  }
  function activeEscorts(s) {
    return Math.min(MAX.escort, s.escort + Number(s.hasSupportWingman));
  }
  function escortFormation(s, count = activeEscorts(s)) {
    if (!count) return [];
    const booth = s.arcade && s.mode === 'booth';
    const sides = count > 1 ? [-1, 1] : [booth && s.hasSupportWingman ? 1 : -1];
    const hero = s.hero.position;
    return sides.map(side => {
      if (!booth) {
        const y = hero.y + 18;
        return {x: clamp(hero.x + side * 32, 12, W - 12), y, muzzleY: y};
      }
      // Slide the outer wing forward at the screen edge so its nose stays visible.
      const x = clamp(hero.x + side * 53, 19, W - 19);
      const compression = 1 - Math.abs(x - hero.x) / 53;
      const y = clamp(hero.y + 28 - 76 * compression, 20, H - 26);
      return {x, y, muzzleY: y - 17, support: side === 1 && s.hasSupportWingman};
    });
  }
  function escortFire(s, count) {
    if (!count) return;
    const targets = getEnemiesSortedByDistance(s, s.hero).filter(e => aboveJet(s, e));
    escortFormation(s, count).forEach((wing, index) => {
      const p = {x: wing.x, y: wing.muzzleY};
      const t = targets[index % Math.max(1, targets.length)];
      const a = t ? Math.atan2(t.position.y - p.y, t.position.x - p.x) : -Math.PI / 2;
      const shot = fireTorpedo(s, p, a, FRIEND, { damage: (11 + count * 3) * FLIGHT_DAMAGE, speed: 340, radius: 4, homing: 2.2, style: 'escort', color: wing.support ? '#c3a8ff' : '' });
      if (shot) s.lastEscortFireAt = s.time;
    });
  }
  function spawnUltimateBoss(s) {
    if (s.ultimateBossSpawned) return false;
    // The timed finale takes over even when a newcomer hasn't finished the miniboss.
    // Cancel its barrage so the new boss's first warning can be read in full.
    for(const e of [...s.entities,...s.raised]){
      if(e.kind==='boss'||(e.type==='torpedo'&&e.collision.group===ENEMY)) e.dead=true;
      if(e.type==='ship'){e.attack=null;e.strategy.remainingBeforeAttack=Math.max(3,e.strategy.remainingBeforeAttack);}
    }
    const boss=spawnEnemy(s, 'overlord');
    boss.position.y=12;boss.position.x=W*.20;boss.echo.x=boss.position.x;
    boss.strategy.remainingBeforeAttack=1.25;
    s.ultimateBossSpawned = true;
    s.bossSpawned = true;
    emit(s, 'ultimate');
    return true;
  }
  // Arcade volleys lock their angle before the visible wind-up. A small
  // hitbox, fixed paths and bounded density leave useful dodge corridors.
  function hostileLimit(s) { return 24 + Math.min(4,s.wave)*6; }
  function canAimAtHero(s, e) {
    return e.position.y>15 && e.position.y<s.hero.position.y-65 && !inRange(e.position,s.hero.position,160);
  }
  function volleyTarget(s, ship) {
    const echo = s.decoy;
    return echo && !isBossKind(ship.kind) && echo.y > ship.position.y + 35
      ? echo : s.hero.position;
  }
  function prepareVolley(s,e) {
    if(!canAimAtHero(s,e)||s.time<s.nextVolleyAt)return false;
    const occupied=[...s.entities,...s.raised].filter(b=>!b.dead&&b.type==='torpedo'&&b.collision.group===ENEMY).length;
    const reserved=s.entities.reduce((n,ship)=>n+(ship.attack?.angles.length||0),0);
    if(e.kind==='overlord'){
      const laneShot=e.volleyIndex%2===1;
      const windup=e.enraged?.85:1.05;
      let warning;
      if(laneShot){
        // Counter the wide fan with parallel lanes. One marked corridor stays open.
        const gap=(Math.floor(e.volleyIndex/2)%2===0?.32:.68)*W;
        const origins=[];
        for(let x=25;x<W;x+=e.enraged?30:36)if(Math.abs(x-gap)>52)origins.push(x);
        warning={origins,gap,angles:origins.map(()=>Math.PI/2)};
      }else{
        const aim=Math.atan2(s.hero.position.y-e.position.y,s.hero.position.x-e.position.x);
        const fan=e.enraged?[-1.05,-.76,-.47,-.18,.18,.47,.76,1.05]:[-.93,-.59,-.25,.25,.59,.93];
        warning={angles:fan.map(off=>aim+off)};
      }
      if(occupied+reserved+warning.angles.length>hostileLimit(s))return false;
      e.attack={...warning,remaining:windup,duration:windup};
      e.volleyIndex++;
      s.nextVolleyAt=s.time+.35;
      return true;
    }
    const target = volleyTarget(s, e);
    const a=e.kind==='bubble'?Math.PI/2:Math.atan2(target.y-e.position.y,target.x-e.position.x);
    let offsets=e.kind==='inflation'||e.elite?[-.32,0,.32]:e.kind==='scam'?[-.24,.24]:e.kind==='debt'?[-.42,0,.42]:[0];
    if(e.kind==='trap') offsets=e.age%6<3?[-.48,0,.48]:[-.32,.32];
    if(e.kind==='myth') offsets=e.age%6<3?[-.38,-.12,.12,.38]:[-.24,.24];
    if(e.kind==='bubble') offsets=[-.46,.46];
    if(isBossKind(e.kind))offsets=e.hp<e.maxHp*.5?[-1.12,-.8,-.48,-.16,.16,.48,.8,1.12]:[-.9,-.54,-.18,.18,.54,.9];
    if(occupied+reserved+offsets.length>hostileLimit(s))return false;
    const windup=isBossKind(e.kind)?.95:.7;
    e.attack={angles:offsets.map(off=>a+off),remaining:windup,duration:windup};
    s.nextVolleyAt=s.time+.22;
    return true;
  }
  function enemyFire(s, entity, lockedAngles=null) {
    const p = entity.position, h = s.hero.position;
    const a = Math.atan2(h.y - p.y, h.x - p.x);
    if(entity.kind==='overlord' && entity.attack){
      const pattern=entity.attack;
      entity.coreOpen=1.05;entity.countered=false;
      pattern.angles.forEach((angle,i)=>{
        const origin=pattern.origins?{x:pattern.origins[i],y:p.y+22}:p;
        fireTorpedo(s,origin,angle,ENEMY,{damage:24,speed:entity.enraged?196:167,radius:5,style:'storm'});
      });
      return;
    }
    const threat = MODE_RULES[s.mode].bullet * Math.min(1.7, 1 + s.wave * 0.025)*(s.arcade&&root.FuLamJourney?root.FuLamJourney.threatProfile(s.wave).bullet:1);
    let angles = entity.elite?[a-.16,a,a+.16]:[a];
    if (entity.kind === 'inflation') angles = [a - 0.28, a, a + 0.28];
    if (isBossKind(entity.kind)) angles = Array.from({ length: entity.kind==='overlord'?11:9 }, (_, i) => a + (i - (entity.kind==='overlord'?5:4)) * (entity.kind==='overlord'?.19:.21));
    if(s.arcade&&isBossKind(entity.kind)){
      const second=entity.hp<entity.maxHp*.5, count=entity.kind==='overlord'?(second?13:9):(second?11:7);
      angles=Array.from({length:count},(_,i)=>a+Math.sin(entity.age*.6)*.25+(i-(count-1)/2)*(second?.23:.25));
    }
    if(s.mode==='booth'&&!isBossKind(entity.kind)){
      if(entity.kind==='inflation')angles=[a-.42,a-.2,a,a+.2,a+.42];
      else if(entity.elite)angles=[a-.3,a-.14,a,a+.14,a+.3];
      else angles=[a-.22,a,a+.22];
    }
    if(entity.kind==='bubble')angles=[Math.PI/2-.46,Math.PI/2+.46];
    if(lockedAngles)angles=lockedAngles;
    // Only high-interest debt ships fire seekers; other enemies keep fixed volleys.
    const seek=entity.kind==='debt' && (volleyTarget(s,entity)===s.hero.position || !s.arcade) ? (s.arcade?(s.ultimate?1.35:1.15):0.36):0;
    for (const [index,angle] of angles.entries()) {
      const side=entity.kind==='bubble'?Math.sign(Math.cos(angle)):entity.kind==='debt'?(index%2===0?-1:1):0;
      const origin=side?{x:p.x+side*17,y:p.y+8}:p;
      fireTorpedo(s, origin, angle, ENEMY, { damage: isBossKind(entity.kind) ? (entity.kind==='overlord'?24:20) : entity.kind === 'debt' ? 18 : 12,
      speed: s.arcade?Math.min(145,(entity.kind==='debt'?90:104)*threat):(entity.kind === 'debt' ? 90 : 113) * threat, radius: entity.kind === 'debt' ? 6 : 4.8,
      homing: seek, style: entity.kind === 'debt' ? 'debt' : 'hostile' });
    }
  }
  function timedBoothSupplies(s) { return s.arcade && s.mode === 'booth'; }
  function boothSupplyReady(s) { return s.time + 1e-9 >= s.lastSupplyAt + BOOTH_SUPPLY_INTERVAL; }
  function boothSupplyKind(s) {
    // After recruitment, distribute drops among the remaining support types.
    const roll = s.hasSupportWingman ? .05 + .95 * s.random() : s.random();
    if (roll < .05) return 'wingman';
    if (roll < .25) return 'boost';
    return roll < .50 ? 'echo' : 'course';
  }
  function dispatchChip(s, kind, origin) {
    const immediate = timedBoothSupplies(s);
    s.lastSupplyAt = immediate ? s.lastSupplyAt + BOOTH_SUPPLY_INTERVAL : s.time;
    s.lastSupplyKind=kind;
    s.chipCount++;
    if (immediate) deployChip(s, kind);
    s.raised.push(createEntity('supply', {
      kind, position:new Position(origin.x,Math.max(10,origin.y)),
      flightTime:.45, ttl:new Ttl(2), collision:new Collision(false,false,10,FRIEND)
    }));
  }
  function destroy(s, entity) {
    if (entity.dead) return;
    const previousCombo=s.combo;
    entity.dead = true; s.kills++; s.waveKills++; s.combo = Math.min(25, s.combo + 1); s.comboTime = 4;
    const points=Math.round(entity.value * 10 * (1 + Math.floor(s.combo / 5) * 0.25));
    s.score += points;
    emit(s, 'sink', { x: entity.position.x, y: entity.position.y, kind: entity.kind,
      milestone: s.combo!==previousCombo && s.combo%5===0 ? s.combo : 0 });
    if(entity.kind==='overlord'){
      for(const e of [...s.entities,...s.raised])if(e.style==='storm')e.dead=true;
      emit(s,'flagshipDown',{x:entity.position.x,y:entity.position.y,points});
    }
    const boss = isBossKind(entity.kind);
    const supplyRate = s.wave === 1 ? .32 : .28;
    const sinceDrop = s.time-s.lastSupplyAt;
    let supply = null;
    if (timedBoothSupplies(s)) {
      if (boothSupplyReady(s)) supply = boothSupplyKind(s);
    } else if (sinceDrop >= 3 || (sinceDrop >= 1 && s.random() < supplyRate)) {
      supply = entity.kind === 'bubble' ? 'echo' : entity.kind === 'flash' ? 'course' : s.random() < .5 ? 'echo' : 'course';
    }
    if(supply){
      dispatchChip(s,supply,entity.position);
      return;
    }
    if (s.arcade && !boss && s.random() >= .22) return;
    const loot = Math.round(entity.value * (entity.kind==='overlord'?2.4:entity.kind==='boss'?1.8:entity.kind==='debt'?1.45:entity.kind==='inflation'||entity.kind==='trap'?1.2:1));
    const parts = s.arcade ? 1 : entity.kind==='overlord'?18:entity.kind==='boss'?12:entity.kind==='debt'?6:entity.kind==='inflation'||entity.kind==='trap'?4:2;
    for (let i = 0; i < parts; i++) {
      const value = Math.max(1, Math.floor(loot / parts) + (i < loot % parts ? 1 : 0));
      s.raised.push(createEntity('coin', { position: new Position(clamp(entity.position.x + (s.random() - 0.5) * (isBossKind(entity.kind)?55:35), 12, W - 12), clamp(entity.position.y + (s.random() - 0.5) * (isBossKind(entity.kind)?40:25), 10, H - 20)), value, flightTime:.45, ttl: new Ttl(11), collision: new Collision(false, false, 6, FRIEND) }));
    }
  }
  function applyRoundUpgrade(s, run, kind) {
    s.evolution={weapon:run.weapon,rate:run.rate,trajectory:run.trajectory,escort:run.escort||0,life:run.life||0,protection:run.protection||0};
    s.escort=run.escort||0;
    const p=root.FuLamJourney.survivalProfile('fleet',s.evolution,MODE_RULES[s.mode].armour);
    let recovery = 12;
    if (s.arcade && s.mode === 'booth') recovery = run.wave === 3 ? 25 : 20;
    s.hero.maxHp=p.max;s.hero.hp=Math.min(p.max,s.hero.hp+recovery+(kind==='life'?35:0));
  }
  function hitShip(s, ship, amount, style, blast = 0) {
    takeHullDamage(ship,amount);
    if (!ship.hp) { destroy(s,ship); return; }
    // A volley can land several rounds at once. Show one crisp hit at this hull.
    if (ship.flash>0) return;
    ship.flash=.09;
    if (blast) emit(s,'blast',{x:ship.position.x,y:ship.position.y,radius:blast});
    else emit(s,'impact',{x:ship.position.x,y:ship.position.y,style});
  }
  function defence(s){return s.arcade&&root.FuLamJourney?root.FuLamJourney.survivalProfile('fleet',s.evolution,MODE_RULES[s.mode].armour):{multiplier:1,shieldBonus:0};}
  function damageHero(s, amount, reason) {
    if (!s.running || s.shield > 0 || s.invulnerable > 0) return false;
    // Opening rounds forgive a few mistakes; the final round keeps full pressure.
    const opening=s.arcade&&s.mode==='booth'?[.65,.8,.9,1][Math.min(3,Math.max(0,s.wave-1))]:1;
    amount*=defence(s).multiplier*opening;
    amount = takeHullDamage(s.hero, amount); s.invulnerable = s.arcade ? 1.2 : .9; s.combo = 0;
    emit(s, 'damage', { amount, x: s.hero.position.x, y: s.hero.position.y });
    if (s.hero.hp === 0) {
      if (s.arcade && s.mode === 'booth') {
        s.hero.hp = s.hero.maxHp; s.invulnerable = 3;
        emit(s, 'rescue', {x:s.hero.position.x,y:s.hero.position.y});
      } else { s.running = false; s.lastReason = reason; emit(s, 'over'); }
    }
    return true;
  }
  function shieldCost(s) { return Math.max(10, 20 - s.reserve * 3); }
  function deployChip(s, kind) {
    const hero = s.hero.position;
    emit(s,'deploy',{kind,x:hero.x,y:hero.y});
    if (kind === 'wingman') {
      s.hasSupportWingman = true;
      s.escortTime = 0;
      return;
    }
    if (kind === 'boost') {
      s.boostTime = BOOST_DURATION;
      return;
    }
    const nearest = getEnemiesSortedByDistance(s, s.hero).find(e => e.position.y > 0 && e.position.y < hero.y);
    if (kind === 'echo') {
      // Put the echo on the closest approaching bullet's path, ahead of the jet.
      let intercept = null, closest = Infinity;
      for (const e of s.entities) {
        if (e.dead || e.type !== 'torpedo' || e.collision.group !== ENEMY || e.style === 'storm') continue;
        const dx = hero.x-e.position.x, dy = hero.y-e.position.y;
        const approach = dx*e.velocity.dx + dy*e.velocity.dy;
        if (approach < 0 || approach > 220 || Math.abs(dx*e.velocity.dy-dy*e.velocity.dx)>65) continue;
        const travel = Math.max(0,approach-54);
        const target = {x:e.position.x+e.velocity.dx*travel,y:e.position.y+e.velocity.dy*travel};
        if (approach < closest && inRange(target,hero,145)) { closest=approach; intercept=target; }
      }
      if (!intercept) {
        const toward = nearest ? nearest.position.x-hero.x : W/2-hero.x;
        intercept = {x:hero.x+Math.sign(toward || 1)*48,y:hero.y-56};
      }
      s.decoy = {kind, x:clamp(intercept.x,22,W-22), y:clamp(intercept.y,28,H-27), time:5};
    } else if (s.course) {
      s.course.queued++;
    } else {
      const towardFreeLane = nearest && Math.abs(nearest.position.x-hero.x)>10
        ? Math.sign(hero.x-nearest.position.x) : (hero.x < W/2 ? 1 : -1);
      let {x:dx,y:dy} = s.lastHeading || {x:towardFreeLane*.8,y:hero.y>H/2?-.6:.6};
      if (hero.x + dx*150 < 30 || hero.x + dx*150 > W-30) dx=-dx;
      if (hero.y + dy*150 < 46 || hero.y + dy*150 > H-30) dy=-dy;
      const gates = [[55,0],[100,24],[148,-12]].map(([along,side]) => ({
        x: clamp(hero.x + dx*along - dy*side, 30, W-30),
        y: clamp(hero.y + dy*along + dx*side, 46, H-30)
      }));
      s.course = {kind, gates, next:0, queued:0, x:hero.x, y:hero.y, angle:-Math.PI/2};
    }
  }
  function activateShield(s) {
    if (!s.running || s.shieldCooldown > 0 || s.cash < shieldCost(s)) return false;
    s.cash -= shieldCost(s); s.shield = 2.8 + s.reserve * 0.8 + defence(s).shieldBonus; s.shieldCooldown = 11 - s.reserve;
    emit(s, 'shield'); return true;
  }
  function upgradeCost(s, kind) { return kind === 'repair' ? 35 : COSTS[kind]?.[s[kind]] ?? null; }
  function buy(s, kind) {
    const cost = upgradeCost(s, kind);
    if (!s.running || cost === null || s.cash < cost || (kind === 'repair' && s.hero.hp >= s.hero.maxHp)) return false;
    s.cash -= cost;
    if (kind === 'repair') s.hero.hp = Math.min(s.hero.maxHp, s.hero.hp + 35);
    else s[kind]++;
    if(s.arcade&&kind==='weapon'){s.paidPower+=.18;s.power+=.18;}
    emit(s, 'upgrade', { kind }); return true;
  }
  function placeHero(s, x, y) {
    s.hero.position.x = clamp(x, 22, W - 22);
    s.hero.position.y = clamp(y, 48, H - 27);
  }
  function tick(s, dt, input = {}) {
    if (!s.running || dt <= 0) return;
    // Fixed-step physics is driven by the renderer; ignore unreasonable callers.
    dt = Math.min(dt, 0.05); s.time += dt;
    for (const key of ['shield', 'shieldCooldown', 'invulnerable', 'comboTime', 'boostTime']) s[key] = Math.max(0, s[key] - dt);
    if (s.comboTime === 0) s.combo = 0;
    const h = s.hero.position;
    const flightStep = s.hero.velocity.speed * (s.boostTime > 0 ? 1.25 : 1) * dt;
    if (input.target) {
      // Move towards the pointer at the same bounded speed as keyboard input.
      const dx=input.target.x-h.x, dy=input.target.y-h.y, distance=Math.hypot(dx,dy);
      if(distance>0){const step=Math.min(distance,flightStep);placeHero(s,h.x+dx/distance*step,h.y+dy/distance*step);}
    } else {
      const dx = input.x || 0, dy = input.y || 0, length = Math.max(1, Math.hypot(dx, dy));
      h.x = clamp(h.x + dx / length * flightStep, 22, W - 22);
      h.y = clamp(h.y + dy / length * flightStep, 48, H - 27);
    }
    const movedX=h.x-s.hero.echo.x, movedY=h.y-s.hero.echo.y, distance=Math.hypot(movedX,movedY);
    if (distance>.01) s.lastHeading={x:movedX/distance,y:movedY/distance};
    s.hero.echo = { ...h };
    if (s.decoy) { s.decoy.time-=dt; if(s.decoy.time<=0)s.decoy=null; }
    if (s.course) {
      const skill = s.course;
      const gate=skill.gates[skill.next], dx=gate.x-skill.x, dy=gate.y-skill.y;
      const reach=Math.hypot(dx,dy), step=170*dt;
      skill.angle=Math.atan2(dy,dx);
      if (reach<=step) {
        skill.x=gate.x;skill.y=gate.y;
        const amount = [40, 70, 140][skill.next++];
        s.score += amount;s.relayScore+=amount;
        emit(s,'gate',{x:gate.x,y:gate.y,amount});
        if (skill.next===skill.gates.length) {
          s.course=null;
          if (skill.queued) {
            deployChip(s,'course');
            s.course.queued=skill.queued-1;
          }
        }
      } else {
        skill.x+=dx/reach*step;skill.y+=dy/reach*step;
      }
    }
    const fireBase = s.arcade ? (root.FuLamJourney?root.FuLamJourney.weaponProfile('fleet',s.evolution).interval:(s.weaponKind===3?.65:s.weaponKind===2?.42:s.weaponKind===1?.32:.20)/FLIGHT_RATE) : Math.max(0.17, 0.34 - s.weapon * 0.025)/FLIGHT_RATE;
    s.fireTime -= dt; if (s.fireTime <= 0) { s.fireTime += fireBase / (s.ultimate ? 2.25 : 1); weaponFire(s); }
    const escorts = activeEscorts(s);
    s.escortTime -= dt; if (s.escortTime <= 0) { s.escortTime += (escorts >= 3 ? 0.32 : 0.7) / FLIGHT_RATE / (s.ultimate ? 1.5 : 1); escortFire(s, escorts); }
    if (s.ultimate && !s.ultimateBossSpawned) spawnUltimateBoss(s);
    s.dividend += dt;
    if (s.dividend >= 15) {
      s.dividend -= 15;
      const amount = Math.min(22, Math.floor(s.cash * (0.06 + s.reserve * 0.02)));
      s.cash += amount; s.income += amount;
      if (amount > 0) emit(s, 'dividend', { amount });
    }
    const ships = s.entities.filter(e => e.type === 'ship' && !e.dead);
    if (!s.arcade && s.waveKills >= s.goal && !ships.some(e => isBossKind(e.kind))) {
      s.wave++; s.waveKills = 0; s.goal = 7 + s.wave * 2; s.bossSpawned = false;
      emit(s, 'wave', { wave: s.wave });
    }
    if ((s.arcade ? (s.wave===3 || s.wave===4 || (s.wave>4 && s.wave%3===0)) : s.wave%4===0) && !s.bossSpawned && !s.ultimate) { spawnEnemy(s, 'boss'); s.bossSpawned = true; emit(s, 'boss'); }
    s.spawnTime -= dt;
    if (s.spawnTime <= 0) {
      const spawnBase=Math.max(0.42, 1.5 - s.wave * 0.1);
      const arrivalRate = isLateBoothRound(s) ? 1.2 : 1;
      const extraReinforcements = arrivalRate > 1 && (s.wave === 2 || s.wave === 4) ? 1.2 : 1;
      const boothDensity = isBoothRound(s) ? 1.30 : 1;
      const interval = s.arcade ? Math.max(.58,1.25-(s.wave-1)*.12)*(s.wave===1?.72:s.wave===2?.62:s.wave===4?1.375:1) : spawnBase*(s.mode==='booth'?.55:1);
      s.spawnTime += interval / MODE_RULES[s.mode].enemy / (s.ultimate?2.35:1) / (arrivalRate * extraReinforcements * boothDensity);
      const baseCap=s.arcade?Math.min(s.ultimate?18:14,Math.round((4+s.wave+(s.wave<=2?3:s.wave===4?2:0)+(s.ultimate?6:0))*(s.wave===4?.64:1))):s.mode==='booth'?Math.min(22, 8 + s.wave * 3):Math.min(14, 4 + s.wave * 2);
      const reinforcedCap = Math.round(Math.round(baseCap * arrivalRate) * extraReinforcements);
      const cap = Math.round(reinforcedCap * boothDensity);
      if (ships.length < cap) {
        const types = s.wave === 1 ? ['fee', 'fee', 'scam', 'debt', 'bubble'] : ['fee', 'scam', 'inflation', 'debt', 'trap', 'myth', 'bubble', 'flash'];
        const selected=types[Math.floor(s.random() * types.length)];
        spawnEnemy(s, s.arcade&&s.wave===2&&++s.roundTwoSpawns%6===0?'rumor':selected);
        if(s.arcade&&s.wave<=2&&ships.length+1<cap&&s.random()<(s.wave===1?.28:.36)) spawnEnemy(s, types[Math.floor(s.random()*types.length)]);
        if(s.ultimate && ships.length+1 < cap && s.random()<.55) spawnEnemy(s, types[Math.floor(s.random()*types.length)]);
      }
    }
    for (const e of s.entities) {
      if (e.dead) continue;
      if (e.ttl) { e.ttl.timeLeft -= dt; if (e.ttl.timeLeft <= 0) { e.dead = true; continue; } }
      if (e.type === 'ship') {
        e.age += dt; e.flash = Math.max(0, e.flash - dt);
        if(e.kind==='flash'){
          // The glider banks across the airflow, levels its wings, then swoops down
          // the marked lane. It has no powered engine or projectile attack.
          const cycle=e.age%3.8;
          const pass=Math.floor(e.age/3.8);
          const startOffset=pass===0?0:Math.sin(e.phase+(pass-1)*1.9)*68;
          const endOffset=Math.sin(e.phase+pass*1.9)*68;
          const t=Math.min(1,cycle/2);
          const eased=t*t*(3-2*t);
          e.position.x=clamp(e.originX+startOffset+(endOffset-startOffset)*eased,32,W-32);
          e.bank=-(endOffset-startOffset)/135*Math.sin(t*Math.PI)*.45;
          e.position.y+=e.velocity.speed*(cycle<2?.6:cycle<2.9?.18:3.1)*dt;
        }else if(e.kind==='bubble'){
          e.position.x=clamp(e.originX+54*Math.sin(e.age*.52+e.phase),32,W-32);
          e.position.y+=(e.velocity.speed+7*Math.cos(e.age*1.5+e.phase))*dt;
        }else{
          e.position.y += e.velocity.speed * dt;
          const sway = e.kind === 'scam' ? 65 : e.kind==='myth'?48:e.kind==='trap'?32:22;
          e.position.x = clamp(e.originX + Math.sin(e.age * (e.kind === 'scam' ? 2 : 0.8) + e.phase) * sway, 26, W - 26);
          if(e.kind==='scam')e.bank=-Math.cos(e.age*2+e.phase)*.35;
        }
        if(e.kind==='boss'){
          e.position.y=Math.min(110,e.position.y);
          e.position.x=W/2+Math.sin(e.age*.55)*125;
        }else if(e.kind==='overlord'){
          e.position.y=Math.min(128,12+e.age*64);
          const targetX=W/2-Math.cos(e.age*.72)*W*.32;
          const locked=e.attack && !e.attack.origins;
          e.position.x=locked?e.attack.x:e.echo.x+clamp(targetX-e.echo.x,-115*dt,115*dt);
          e.coreOpen=Math.max(0,e.coreOpen-dt);
          if(!e.enraged && (e.age>=7.5 || e.hp<=e.maxHp*.55)){
            e.enraged=true;emit(s,'stormPhase');
          }
        }
        e.echo = { ...e.position };
        e.strategy.remainingBeforeAttack -= dt;
        if(s.arcade){
          if(e.attack){
            e.attack.remaining-=dt;
            if(!canAimAtHero(s,e)){e.attack=null;e.strategy.remainingBeforeAttack=.8;}
            else if(e.attack.remaining<=0){enemyFire(s,e,e.attack.angles);e.attack=null;e.strategy.remainingBeforeAttack=e.kind==='overlord'?(e.enraged?.8:1.2):e.strategy.nextAttack;}
          }else if(e.strategy.remainingBeforeAttack<=0&&prepareVolley(s,e)){
            e.strategy.remainingBeforeAttack=e.strategy.nextAttack;
            if(e.kind==='overlord')e.attack.x=e.position.x;
          }
        }else if (e.position.y > 15 && e.position.y < H - 70 && e.strategy.remainingBeforeAttack <= 0) {
          e.strategy.remainingBeforeAttack = e.strategy.nextAttack; enemyFire(s, e);
        }
        if (testCircleCollision(e, s.hero)) damageHero(s, isBossKind(e.kind) ? (e.kind==='overlord'?34:30) : 18, e.kind);
        if (e.position.y > H + 70) e.dead = true;
      } else if (e.type === 'torpedo') {
        e.previous = { ...e.position }; refreshStrategy(s, e); applyStrategy(s, e, dt); applyVelocityToPosition(e, dt);
        if (e.position.x < -40 || e.position.x > W + 40 || e.position.y < -100 || e.position.y > H + 70) e.dead = true;
      } else if (e.type === 'coin' || e.type === 'supply') {
        const range = 95 + s.reserve * 23;
        if (e.type==='supply'||s.arcade) {
          const travel = Math.min(1,dt/e.flightTime);
          e.position.x += (h.x-e.position.x)*travel;
          e.position.y += (h.y-e.position.y)*travel;
          e.flightTime = Math.max(0,e.flightTime-dt);
        } else if (inRange(e.position, h, range)) {
          const d = Math.hypot(h.x - e.position.x, h.y - e.position.y);
          const travel = Math.min(d, 310 * dt);
          if (d > 0) { e.position.x += (h.x - e.position.x) / d * travel; e.position.y += (h.y - e.position.y) / d * travel; }
        } else e.position.y += (e.type==='coin'?38:66) * dt;
        if (inRange(e.position, h, 23)) {
          e.dead = true;
          if(e.type==='supply'){
            if (!timedBoothSupplies(s)) deployChip(s,e.kind);
          }else{
            s.cash += e.value; s.coinsCollected++;
            if(s.arcade && s.mode==='booth' && s.coinsCollected%3===0){s.score+=60;emit(s,'delivery',{x:h.x,y:h.y});}
            emit(s, 'coin', { amount: e.value, x: h.x, y: h.y });
          }
        }
        if (e.position.y > H + 10) e.dead = true;
      }
    }
    for (const bullet of s.entities) {
      if (bullet.dead || bullet.type !== 'torpedo') continue;
      if (bullet.collision.group === FRIEND) {
        for (const ship of ships) {
          if (ship.dead || bullet.hit.has(ship)) continue;
          const start=bullet.ray?bullet.ray.start:bullet.previous,end=bullet.ray?bullet.ray.end:bullet.position;
          if (segmentCircleHit(start, end, ship.position, bullet.collision.radius + ship.collision.radius)) {
            let damage=bullet.damage;
            if(ship.kind==='overlord'){
              // Crossing under the flagship exposes the nose to forward fire.
              // After each volley the cooling core is briefly worth a direct counter.
              const aligned=Math.abs(s.hero.position.x-ship.position.x)<62;
              const counter=aligned && ship.coreOpen>0;
              damage*=counter?1.85:aligned?.78:.42;
              if(counter && !ship.countered){
                ship.countered=true;s.score+=100;
                emit(s,'counter',{x:ship.position.x,y:ship.position.y+38});
              }
            }
            hitShip(s,ship,damage,bullet.style,bullet.blast);
            bullet.hit.add(ship);
            if (bullet.blast || bullet.chain) {
              let arcs=bullet.chain;
              for (const other of ships) {
                if (other===ship || other.dead) continue;
                const distance=Math.sqrt(distanceSquare(ship.position,other.position));
                if (distance>=bullet.blast) {
                  if (arcs<=0 || distance>=150) continue;
                  arcs--;
                }
                hitShip(s,other,bullet.damage*.25,bullet.style);
              }
              bullet.blast=bullet.chain=0;
            }
            if (bullet.pierce <= 0) { bullet.dead = true; break; }
            bullet.pierce--;
          }
        }
      } else {
        const echo = s.decoy;
        if (echo && bullet.style !== 'storm' &&
            segmentCircleHit(bullet.previous, bullet.position, echo, 23 + bullet.collision.radius)) {
          bullet.dead = true;
          s.score += 35;s.decoyScore+=35;
          emit(s,'decoyHit',{x:echo.x,y:echo.y,amount:35});
          continue;
        }
        const collision = segmentCircleHit(bullet.previous, bullet.position, h, bullet.collision.radius + s.hero.collision.radius + (s.shield > 0 ? 17 : 0));
        if (collision) { bullet.dead = true; if (s.shield <= 0) damageHero(s, bullet.damage, bullet.style === 'debt' ? 'debt' : 'torpedo'); else emit(s, 'block', { x: bullet.position.x, y: bullet.position.y }); }
        else if (!bullet.grazed && s.shield <= 0 && inRange(bullet.position, h, 33)) { bullet.grazed = true; s.score += 20; emit(s, 'graze', { x: h.x, y: h.y }); }
      }
    }
    if (s.arcade && s.running) {
      const booth = timedBoothSupplies(s);
      if (booth ? boothSupplyReady(s) : s.time - s.lastSupplyAt >= 2.5) {
        const kind = booth ? boothSupplyKind(s) : s.lastSupplyKind === 'course' ? 'echo' : 'course';
        dispatchChip(s, kind, {x:clamp(h.x+(h.x<W/2?104:-104),16,W-16),y:Math.max(24,h.y-85)});
      }
    }
    maintainWorld(s);
  }
  function bestRecord(oldRecord, current) {
    const previous = oldRecord && Number.isFinite(oldRecord.score) && oldRecord.score >= 0 ? oldRecord : null;
    if (previous && previous.score >= current.score) return previous;
    return { score: Math.floor(current.score), wave: current.wave, kills: current.kills, mode: current.mode, version: 1 };
  }
  root.FleetCore = { W, H, FRIEND, ENEMY, SPECS, MAX, createState, applyRoundUpgrade, tick, placeHero, activeEscorts, escortFormation, buy, upgradeCost, activateShield, shieldCost, spawnEnemy, spawnUltimateBoss, isBossKind,
    maintainWorld, fireTorpedo, testCircleCollision, segmentCircleHit, angleDifference2DVectors, bestRecord, Position, Velocity, Collision, Strategy, Ttl, createEntity };
})(typeof globalThis !== 'undefined' ? globalThis : this);
