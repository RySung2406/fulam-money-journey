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
    boss: { hp: 470, radius: 43, speed: 28, value: 130, attack: 1.7 },
    overlord: { hp: 980, radius: 52, speed: 24, value: 420, attack: 1.45 }
  };
  const MAX = { weapon: 5, escort: 3, reserve: 3 };
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
      goal: 8, kills: 0, score: 0, cash: 35, income: 0, dividend: 0, combo: 0, comboTime: 0,
      weapon: 1, escort: 0, reserve: 0, shield: 0, shieldCooldown: 0, invulnerable: 1.5,
      fireTime: 0.1, escortTime: 0.5, shots: 0, spawnTime: 0.45, bossSpawned: false, nextVolleyAt: 0,
      ultimate: false, ultimateBossSpawned: false,
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
  function spawnEnemy(s, kind) {
    const r = s.random, spec = SPECS[kind];
    const threat=s.arcade&&root.FuLamJourney?root.FuLamJourney.threatProfile(s.wave):null;
    const growth = threat?threat.health:1+(s.wave-1)*.14;
    const elite=!!(threat?.elite&&!isBossKind(kind)&&++s.spawnCount%4===0);
    const hp = Math.round(spec.hp * growth * MODE_RULES[s.mode].enemy * (s.mode==='booth'?(s.arcade?1.2:1.7):1) * (elite?1.6:1) * (s.arcade?(s.wave===2?1.34:s.wave===4?1.18:1):1) * (threat&&isBossKind(kind)?(kind==='overlord'?1.15:(s.wave<=4?1.35:2+s.wave*.15)):1));
    const x = isBossKind(kind) ? W / 2 : 38 + r() * (W - 76);
    const entity = createEntity('ship', {
      kind, elite, position: new Position(x, -65, Math.PI / 2), velocity: new Velocity(spec.speed * MODE_RULES[s.mode].enemy*(threat?.speed||1)),
      collision: new Collision(true, true, spec.radius, ENEMY), strategy: new Strategy(kind, s.arcade ? Math.max(isBossKind(kind)?2.1:2.7,spec.attack/(1+Math.min(6,s.wave-1)*.035)) : spec.attack / Math.min(2, 1 + s.wave * 0.035) / (s.mode==='booth'?1.45:1)),
      hp, maxHp: hp, value: spec.value, age: 0, phase: r() * TAU, originX: x, flash: 0
    });
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
    const entity = createEntity('torpedo', {
      position: new Position(position.x, position.y, angle), previous: { x: position.x, y: position.y },
      velocity: new Velocity(ray ? 0 : speed, Math.cos(angle), Math.sin(angle)),
      collision: new Collision(true, true, radius, group), strategy: new Strategy(homing ? 'cruise' : 'straight'),
      ttl: new Ttl(ray ? 0.18 : group === FRIEND ? 2.8 : 6), damage, homing, pierce, style, color, blast, chain, ray, hit: new Set(), grazed: false
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
      const forms={bullet:{style:'shell',spread:fan(1,.1),radius:3.6,color:'#ffe39b',blast:0,pierce:0,speed:p.speed,homing:0},laser:{style:'beam',count:Math.min(7,2+traj),radius:2.8,color:'#8cf4ff',blast:0,pierce:24,speed:0,homing:0},bomb:{style:'bomb',spread:fan(1,.12),radius:6.2,color:'#ffb07a',blast:18,pierce:0,speed:480,homing:0},plane:{style:'missile',spread:fan(1,.1),radius:4.6,color:'#ffd27a',blast:24,pierce:4,speed:640,homing:0}};
      if(form){const spec=forms[form];if(form==='laser'){const n=spec.count,gap=18;for(let i=0;i<n;i++){const from={x:s.hero.position.x+(i-(n-1)/2)*gap,y:s.hero.position.y-26},aim=-Math.PI/2;fireTorpedo(s,from,aim,FRIEND,{damage:p.damage*(1+s.paidPower)*hurt*.72*.65,speed:0,radius:spec.radius,homing:0,pierce:spec.pierce,style:spec.style,color:spec.color,blast:0,chain:0,ray:screenRay(from.x,from.y,aim)});}}else for(const off of spec.spread){const aim=-Math.PI/2+off,from={x:s.hero.position.x,y:s.hero.position.y-26};fireTorpedo(s,from,aim,FRIEND,{damage:p.damage*(1+s.paidPower)*hurt*.72*(off===0?1:.75)*(s.ultimate&&form==='plane'?1.2:1),speed:spec.speed*(s.ultimate?1.12:1),radius:spec.radius,homing:spec.homing||0,pierce:spec.pierce,style:spec.style,color:spec.color,blast:spec.blast*(s.ultimate?1.25:1),chain:0,ray:null});}}
      else {const style=p.kind==='orb'?'orb':p.kind==='beam'?'beam':p.kind==='missile'?'missile':p.kind==='arc'?'arc':'shell';for(const off of p.spread)fireTorpedo(s,{x:s.hero.position.x,y:s.hero.position.y-26},-Math.PI/2+off,FRIEND,{damage:p.damage*(1+s.paidPower)*.72*(p.count===2?.65:off!==0?.55:1),speed:p.speed,radius:(p.kind==='orb'?7:p.kind==='missile'?8:3.5)*reach,homing:p.homing,pierce:p.pierce,style,color:p.color,blast:(p.blast||(booth?42:0))*reach,chain:p.chain});}
      s.shots++;emit(s,'fire');return;
    }
    if(s.arcade){
      const kind=s.weaponKind, a=-Math.PI/2;
      s.hero.position.r=a;
      const offsets=kind===1?[-.25,-.125,0,.125,.25]:kind===3?[-.08,.08]:level>=3?[-.035,.035]:[0];
      for(const off of offsets)fireTorpedo(s,{x:s.hero.position.x,y:s.hero.position.y-26},a+off,FRIEND,{damage:(kind===1?9:kind===3?22:kind===2?28:16)*s.power,speed:kind===3?265:kind===2?850:520,radius:kind===3?5:3.5,homing:kind===3?3:0,pierce:kind===2?4:kind===0&&level>=4?1:0,style:kind===3?'orb':'beam'});
      s.shots++;emit(s,'fire');return;
    }
    const angles = level === 1 ? [0] : level === 2 ? [-0.055, 0.055] : [-0.18, 0, 0.18];
    const orb = level === 5 && s.shots % 3 === 0;
    for (const offset of angles) {
      fireTorpedo(s, { x: s.hero.position.x + Math.cos(angle) * 24, y: s.hero.position.y + Math.sin(angle) * 24 }, angle + offset, FRIEND,
        { damage: orb ? 42 : 12 + level * 2, speed: orb ? 300 : 440, radius: orb ? 11 : 3.7,
          homing: level >= 3 ? 0.8 : 1.2, pierce: level >= 4 ? (orb ? 4 : 2) : 0, style: orb ? 'orb' : level >= 4 ? 'beam' : 'shell' });
    }
    s.shots++; emit(s, 'fire');
  }
  function escortFire(s) {
    if (!s.escort) return;
    const sides = s.escort === 1 ? [-1] : [-1, 1];
    const targets = getEnemiesSortedByDistance(s, s.hero).filter(e => aboveJet(s, e));
    sides.forEach((side, index) => {
      const p = { x: clamp(s.hero.position.x + side * 32, 12, W - 12), y: s.hero.position.y + 18 };
      const t = targets[index % Math.max(1, targets.length)];
      const a = t ? Math.atan2(t.position.y - p.y, t.position.x - p.x) : -Math.PI / 2;
      fireTorpedo(s, p, a, FRIEND, { damage: 11 + s.escort * 3, speed: 340, radius: 4, homing: 2.2, style: 'escort' });
    });
  }
  function spawnUltimateBoss(s) {
    if (s.ultimateBossSpawned || s.entities.some(e => !e.dead && e.type === 'ship' && (e.kind === 'overlord' || e.kind === 'boss'))) return false;
    spawnEnemy(s, 'overlord');
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
  function prepareVolley(s,e) {
    if(!canAimAtHero(s,e)||s.time<s.nextVolleyAt)return false;
    const occupied=[...s.entities,...s.raised].filter(b=>!b.dead&&b.type==='torpedo'&&b.collision.group===ENEMY).length;
    const reserved=s.entities.reduce((n,ship)=>n+(ship.attack?.angles.length||0),0);
    const a=Math.atan2(s.hero.position.y-e.position.y,s.hero.position.x-e.position.x);
    let offsets=e.kind==='inflation'||e.elite?[-.32,0,.32]:e.kind==='scam'?[-.24,.24]:e.kind==='debt'?[-.42,0,.42]:[0];
    if(e.kind==='trap') offsets=e.age%6<3?[-.48,0,.48]:[-.32,.32];
    if(e.kind==='myth') offsets=e.age%6<3?[-.38,-.12,.12,.38]:[-.24,.24];
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
    if(lockedAngles)angles=lockedAngles;
    // Only high-interest debt ships fire seekers; other enemies keep fixed volleys.
    const seek=entity.kind==='debt'?(s.arcade?(s.ultimate?1.35:1.15):0.36):0;
    for (const angle of angles) fireTorpedo(s, p, angle, ENEMY, { damage: isBossKind(entity.kind) ? (entity.kind==='overlord'?24:20) : entity.kind === 'debt' ? 18 : 12,
      speed: s.arcade?Math.min(145,(entity.kind==='debt'?90:104)*threat):(entity.kind === 'debt' ? 90 : 113) * threat, radius: entity.kind === 'debt' ? 6 : 4.8,
      homing: seek, style: entity.kind === 'debt' ? 'debt' : 'hostile' });
  }
  function destroy(s, entity) {
    if (entity.dead) return;
    entity.dead = true; s.kills++; s.waveKills++; s.combo = Math.min(25, s.combo + 1); s.comboTime = 4;
    s.score += Math.round(entity.value * 10 * (1 + Math.floor(s.combo / 5) * 0.25));
    emit(s, 'sink', { x: entity.position.x, y: entity.position.y, kind: entity.kind });
    const loot = Math.round(entity.value * (entity.kind==='overlord'?2.4:entity.kind==='boss'?1.8:entity.kind==='debt'?1.45:entity.kind==='inflation'||entity.kind==='trap'?1.2:1));
    const parts = entity.kind==='overlord'?18:entity.kind==='boss'?12:entity.kind==='debt'?6:entity.kind==='inflation'||entity.kind==='trap'?4:2;
    for (let i = 0; i < parts; i++) {
      const value = Math.max(1, Math.floor(loot / parts) + (i < loot % parts ? 1 : 0));
      s.raised.push(createEntity('coin', { position: new Position(clamp(entity.position.x + (s.random() - 0.5) * (isBossKind(entity.kind)?55:35), 12, W - 12), clamp(entity.position.y + (s.random() - 0.5) * (isBossKind(entity.kind)?40:25), 10, H - 20)), value, ttl: new Ttl(11), collision: new Collision(false, false, 6, FRIEND) }));
    }
  }
  function applyRoundUpgrade(s, run, kind) {
    s.evolution={weapon:run.weapon,rate:run.rate,trajectory:run.trajectory,escort:run.escort||0,life:run.life||0,protection:run.protection||0};
    s.escort=run.escort||0;
    const p=root.FuLamJourney.survivalProfile('fleet',s.evolution,MODE_RULES[s.mode].armour);
    s.hero.maxHp=p.max;s.hero.hp=Math.min(p.max,s.hero.hp+(s.arcade&&s.mode==='booth'?20:12)+(kind==='life'?35:0));
  }
  function defence(s){return s.arcade&&root.FuLamJourney?root.FuLamJourney.survivalProfile('fleet',s.evolution,MODE_RULES[s.mode].armour):{multiplier:1,shieldBonus:0};}
  function damageHero(s, amount, reason) {
    if (!s.running || s.shield > 0 || s.invulnerable > 0) return false;
    // Opening rounds forgive a few mistakes; the final round keeps full pressure.
    const opening=s.arcade&&s.mode==='booth'?[.65,.8,.9,1][Math.min(3,Math.max(0,s.wave-1))]:1;
    amount*=defence(s).multiplier*opening;
    s.hero.hp = Math.max(0, s.hero.hp - amount); s.invulnerable = s.arcade ? 1.2 : .9; s.combo = 0;
    emit(s, 'damage', { amount, x: s.hero.position.x, y: s.hero.position.y });
    if (s.hero.hp === 0) { s.running = false; s.lastReason = reason; emit(s, 'over'); }
    return true;
  }
  function shieldCost(s) { return Math.max(10, 20 - s.reserve * 3); }
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
    for (const key of ['shield', 'shieldCooldown', 'invulnerable', 'comboTime']) s[key] = Math.max(0, s[key] - dt);
    if (s.comboTime === 0) s.combo = 0;
    const h = s.hero.position;
    if (input.target) {
      // Move towards the pointer at the same bounded speed as keyboard input.
      const dx=input.target.x-h.x, dy=input.target.y-h.y, distance=Math.hypot(dx,dy);
      if(distance>0){const step=Math.min(distance,s.hero.velocity.speed*dt);placeHero(s,h.x+dx/distance*step,h.y+dy/distance*step);}
    } else {
      const dx = input.x || 0, dy = input.y || 0, length = Math.max(1, Math.hypot(dx, dy));
      h.x = clamp(h.x + dx / length * s.hero.velocity.speed * dt, 22, W - 22);
      h.y = clamp(h.y + dy / length * s.hero.velocity.speed * dt, 48, H - 27);
    }
    s.hero.echo = { ...h };
    const fireBase = s.arcade ? (root.FuLamJourney?root.FuLamJourney.weaponProfile('fleet',s.evolution).interval:(s.weaponKind===3?.65:s.weaponKind===2?.42:s.weaponKind===1?.32:.20)) : Math.max(0.17, 0.34 - s.weapon * 0.025);
    s.fireTime -= dt; if (s.fireTime <= 0) { s.fireTime += fireBase / (s.ultimate ? 2.25 : 1); weaponFire(s); }
    s.escortTime -= dt; if (s.escortTime <= 0) { s.escortTime += (s.escort >= 3 ? 0.32 : 0.7) / (s.ultimate ? 1.5 : 1); escortFire(s); }
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
      s.spawnTime += (s.arcade?Math.max(.58,1.25-(s.wave-1)*.12)*(s.wave===1?.72:s.wave===2?.62:s.wave===4?1.375:1)/MODE_RULES[s.mode].enemy:(s.mode==='booth'?spawnBase*0.55:spawnBase)/MODE_RULES[s.mode].enemy)/(s.ultimate?2.35:1);
      const cap=s.arcade?Math.min(s.ultimate?18:14,Math.round((4+s.wave+(s.wave<=2?3:s.wave===4?2:0)+(s.ultimate?6:0))*(s.wave===4?.64:1))):s.mode==='booth'?Math.min(22, 8 + s.wave * 3):Math.min(14, 4 + s.wave * 2);
      if (ships.length < cap) {
        const types = s.wave === 1 ? ['fee', 'fee', 'scam', 'debt'] : s.wave === 2 ? ['fee', 'scam', 'inflation', 'trap', 'myth', 'debt'] : ['fee', 'scam', 'inflation', 'debt', 'trap', 'myth'];
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
        e.position.y += e.velocity.speed * dt;
        const sway = e.kind === 'scam' ? 65 : e.kind==='myth'?48:e.kind==='trap'?32:22;
        e.position.x = clamp(e.originX + Math.sin(e.age * (e.kind === 'scam' ? 2 : 0.8) + e.phase) * sway, 26, W - 26);
        if (isBossKind(e.kind)) { e.position.y = Math.min(e.kind==='overlord'?128:110, e.position.y); e.position.x = W / 2 + Math.sin(e.age * (e.kind==='overlord'?.42:.55)) * (e.kind==='overlord'?150:125); }
        e.echo = { ...e.position };
        e.strategy.remainingBeforeAttack -= dt;
        if(s.arcade){
          if(e.attack){
            e.attack.remaining-=dt;
            if(!canAimAtHero(s,e)){e.attack=null;e.strategy.remainingBeforeAttack=.8;}
            else if(e.attack.remaining<=0){enemyFire(s,e,e.attack.angles);e.attack=null;e.strategy.remainingBeforeAttack=e.strategy.nextAttack;}
          }else if(e.strategy.remainingBeforeAttack<=0&&prepareVolley(s,e))e.strategy.remainingBeforeAttack=e.strategy.nextAttack;
        }else if (e.position.y > 15 && e.position.y < H - 70 && e.strategy.remainingBeforeAttack <= 0) {
          e.strategy.remainingBeforeAttack = e.strategy.nextAttack; enemyFire(s, e);
        }
        if (testCircleCollision(e, s.hero)) damageHero(s, isBossKind(e.kind) ? (e.kind==='overlord'?34:30) : 18, e.kind);
        if (e.position.y > H + 70) e.dead = true;
      } else if (e.type === 'torpedo') {
        e.previous = { ...e.position }; refreshStrategy(s, e); applyStrategy(s, e, dt); applyVelocityToPosition(e, dt);
        if (e.position.x < -40 || e.position.x > W + 40 || e.position.y < -100 || e.position.y > H + 70) e.dead = true;
      } else if (e.type === 'coin') {
        const range = 95 + s.reserve * 23;
        if (inRange(e.position, h, range)) {
          const d = Math.hypot(h.x - e.position.x, h.y - e.position.y);
          const travel = Math.min(d, 310 * dt);
          if (d > 0) { e.position.x += (h.x - e.position.x) / d * travel; e.position.y += (h.y - e.position.y) / d * travel; }
        } else e.position.y += 38 * dt;
        if (inRange(e.position, h, 23)) { s.cash += e.value; e.dead = true; emit(s, 'coin', { amount: e.value, x: h.x, y: h.y }); }
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
            ship.hp -= bullet.damage; ship.flash = 0.1; bullet.hit.add(ship);
            if(bullet.blast||bullet.chain){if(bullet.blast)emit(s,'blast',{x:ship.position.x,y:ship.position.y,radius:bullet.blast});let arcs=bullet.chain;for(const other of ships){if(other===ship||other.dead)continue;const distance=Math.sqrt(distanceSquare(ship.position,other.position));if(distance<bullet.blast||(arcs>0&&distance<150)){if(distance>=bullet.blast)arcs--;other.hp-=bullet.damage*.25;other.flash=.1;if(other.hp<=0)destroy(s,other);else emit(s,'impact',{x:other.position.x,y:other.position.y});}}emit(s,'impact',{x:ship.position.x,y:ship.position.y});bullet.blast=bullet.chain=0;}
            if (ship.hp <= 0) destroy(s, ship);
            else emit(s, 'impact', { x: ship.position.x, y: ship.position.y });
            if (bullet.pierce <= 0) { bullet.dead = true; break; }
            bullet.pierce--;
          }
        }
      } else {
        const collision = segmentCircleHit(bullet.previous, bullet.position, h, bullet.collision.radius + s.hero.collision.radius + (s.shield > 0 ? 17 : 0));
        if (collision) { bullet.dead = true; if (s.shield <= 0) damageHero(s, bullet.damage, bullet.style === 'debt' ? 'debt' : 'torpedo'); else emit(s, 'block', { x: bullet.position.x, y: bullet.position.y }); }
        else if (!bullet.grazed && s.shield <= 0 && inRange(bullet.position, h, 33)) { bullet.grazed = true; s.score += 20; emit(s, 'graze', { x: h.x, y: h.y }); }
      }
    }
    maintainWorld(s);
  }
  function bestRecord(oldRecord, current) {
    const previous = oldRecord && Number.isFinite(oldRecord.score) && oldRecord.score >= 0 ? oldRecord : null;
    if (previous && previous.score >= current.score) return previous;
    return { score: Math.floor(current.score), wave: current.wave, kills: current.kills, mode: current.mode, version: 1 };
  }
  root.FleetCore = { W, H, FRIEND, ENEMY, SPECS, MAX, createState, applyRoundUpgrade, tick, placeHero, buy, upgradeCost, activateShield, shieldCost, spawnEnemy, spawnUltimateBoss, isBossKind,
    maintainWorld, fireTorpedo, testCircleCollision, segmentCircleHit, angleDifference2DVectors, bestRecord, Position, Velocity, Collision, Strategy, Ttl, createEntity };
})(typeof globalThis !== 'undefined' ? globalThis : this);
