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
    boss: { hp: 470, radius: 43, speed: 28, value: 130, attack: 1.7 }
  };
  const MAX = { weapon: 5, escort: 3, reserve: 3 };
  const COSTS = { weapon: [0, 45, 85, 145, 220], escort: [65, 120, 190], reserve: [50, 90, 140] };
  const MODE_RULES = {
    standard: { armour: 100, enemy: 1, bullet: 1 },
    booth: { armour: 88, enemy: 1.1, bullet: 1.08 },
    storm: { armour: 75, enemy: 1.2, bullet: 1.16 }
  };
  function createState({ seed = Date.now(), mode = 'standard', arcade = false } = {}) {
    mode = Object.hasOwn(MODE_RULES, mode) ? mode : 'standard';
    const state = {
      arcade, evolution:{weapon:0,rate:0,trajectory:0}, weaponKind: 0, power: 1, paidPower: 0, spawnCount:0,
      mode, random: rng(seed), time: 0, wave: 1, waveKills: 0,
      goal: 8, kills: 0, score: 0, cash: 35, income: 0, dividend: 0, combo: 0, comboTime: 0,
      weapon: 1, escort: 0, reserve: 0, shield: 0, shieldCooldown: 0, invulnerable: 1.5,
      fireTime: 0.1, escortTime: 0.5, shots: 0, spawnTime: 0.45, bossSpawned: false,
      entities: [], raised: [], events: [], running: true, lastReason: null,
      hero: createEntity('player', { position: new Position(W / 2, H - 100, -Math.PI / 2), velocity: new Velocity(230), collision: new Collision(true, true, 13, FRIEND), hp: MODE_RULES[mode].armour, maxHp: MODE_RULES[mode].armour })
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
  function spawnEnemy(s, kind) {
    const r = s.random, spec = SPECS[kind];
    const threat=s.arcade&&root.FuLamJourney?root.FuLamJourney.threatProfile(s.wave):null;
    const growth = threat?threat.health:1+(s.wave-1)*.14;
    const elite=!!(threat?.elite&&kind!=='boss'&&++s.spawnCount%4===0);
    const hp = Math.round(spec.hp * growth * MODE_RULES[s.mode].enemy * (elite?1.6:1) * (threat&&kind==='boss'?2+s.wave*.15:1));
    const x = kind === 'boss' ? W / 2 : 38 + r() * (W - 76);
    const entity = createEntity('ship', {
      kind, elite, position: new Position(x, -65, Math.PI / 2), velocity: new Velocity(spec.speed * MODE_RULES[s.mode].enemy*(threat?.speed||1)),
      collision: new Collision(true, true, spec.radius, ENEMY), strategy: new Strategy(kind, spec.attack / Math.min(2, 1 + s.wave * 0.035)),
      hp, maxHp: hp, value: spec.value, age: 0, phase: r() * TAU, originX: x, flash: 0
    });
    s.raised.push(entity); return entity;
  }
  function fireTorpedo(s, position, angle, group, { damage = 12, speed = 340, radius = 4, homing = 0, pierce = 0, style = 'shell', color = '', blast = 0, chain = 0 } = {}) {
    if (s.entities.length + s.raised.length > 310) return null;
    const entity = createEntity('torpedo', {
      position: new Position(position.x, position.y, angle), previous: { x: position.x, y: position.y },
      velocity: new Velocity(speed, Math.cos(angle), Math.sin(angle)),
      collision: new Collision(true, true, radius, group), strategy: new Strategy(homing ? 'cruise' : 'straight'),
      ttl: new Ttl(group === FRIEND ? 2.8 : 6), damage, homing, pierce, style, color, blast, chain, hit: new Set(), grazed: false
    });
    s.raised.push(entity); return entity;
  }
  function refreshStrategy(s, entity) {
    const strategy = entity.strategy;
    if (!entity.homing) return;
    if (strategy.target && (strategy.target.dead || !strategy.target.online)) { strategy.target = null; strategy.type = 'cruise'; }
    if (strategy.type === 'cruise') {
      const targets = entity.collision.group === FRIEND ? getEnemiesSortedByDistance(s, entity) : [s.hero];
      const found = targets.find(e => inRange(entity.position, e.position, 430) && Math.abs(angleDifference2DVectors({ x: entity.velocity.dx, y: entity.velocity.dy }, { x: e.position.x - entity.position.x, y: e.position.y - entity.position.y })) < Math.PI / 2);
      if (found) { strategy.target = found; strategy.type = 'lockon'; }
    }
  }
  function applyStrategy(s, entity, dt) {
    const target = entity.strategy.target;
    if (!entity.homing || !target) return;
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
      for(const off of p.spread)fireTorpedo(s,{x:s.hero.position.x,y:s.hero.position.y-26},-Math.PI/2+off,FRIEND,{damage:p.damage*(1+s.paidPower)*(p.count===2?.65:off!==0?.55:1),speed:p.speed,radius:p.kind==='orb'?7:p.kind==='missile'?5:3.5,homing:p.homing,pierce:p.pierce,style:p.kind==='orb'?'orb':p.kind==='beam'?'beam':p.kind==='missile'?'missile':p.kind==='arc'?'arc':'shell',color:p.color,blast:p.blast,chain:p.chain});
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
    const targets = getEnemiesSortedByDistance(s, s.hero).filter(e => e.position.y > 0);
    sides.forEach((side, index) => {
      const p = { x: clamp(s.hero.position.x + side * 32, 12, W - 12), y: s.hero.position.y + 18 };
      const t = targets[index % Math.max(1, targets.length)];
      const a = t ? Math.atan2(t.position.y - p.y, t.position.x - p.x) : -Math.PI / 2;
      fireTorpedo(s, p, a, FRIEND, { damage: 11 + s.escort * 3, speed: 340, radius: 4, homing: 2.2, style: 'escort' });
    });
  }
  function enemyFire(s, entity) {
    const p = entity.position, h = s.hero.position;
    const a = Math.atan2(h.y - p.y, h.x - p.x);
    const threat = MODE_RULES[s.mode].bullet * Math.min(1.7, 1 + s.wave * 0.025)*(s.arcade&&root.FuLamJourney?root.FuLamJourney.threatProfile(s.wave).bullet:1);
    let angles = entity.elite?[a-.16,a,a+.16]:[a];
    if (entity.kind === 'inflation') angles = [a - 0.28, a, a + 0.28];
    if (entity.kind === 'boss') angles = Array.from({ length: 9 }, (_, i) => a + (i - 4) * 0.21);
    if(s.arcade&&entity.kind==='boss'){
      const second=entity.hp<entity.maxHp*.5, count=second?11:7;
      angles=Array.from({length:count},(_,i)=>a+Math.sin(entity.age*.6)*.25+(i-(count-1)/2)*(second?.23:.25));
    }
    for (const angle of angles) fireTorpedo(s, p, angle, ENEMY, { damage: entity.kind === 'boss' ? 20 : entity.kind === 'debt' ? 18 : 12,
      speed: (entity.kind === 'debt' ? 90 : 113) * threat, radius: entity.kind === 'debt' ? 6 : 4.8,
      homing: entity.kind === 'debt' ? 0.36 : 0, style: entity.kind === 'debt' ? 'debt' : 'hostile' });
  }
  function destroy(s, entity) {
    if (entity.dead) return;
    entity.dead = true; s.kills++; s.waveKills++; s.combo = Math.min(25, s.combo + 1); s.comboTime = 4;
    s.score += Math.round(entity.value * 10 * (1 + Math.floor(s.combo / 5) * 0.25));
    emit(s, 'sink', { x: entity.position.x, y: entity.position.y, kind: entity.kind });
    const parts = entity.kind === 'boss' ? 8 : 2;
    for (let i = 0; i < parts; i++) {
      const value = Math.floor(entity.value / parts) + (i < entity.value % parts ? 1 : 0);
      s.raised.push(createEntity('coin', { position: new Position(clamp(entity.position.x + (s.random() - 0.5) * 35, 12, W - 12), clamp(entity.position.y + (s.random() - 0.5) * 25, 10, H - 20)), value, ttl: new Ttl(11), collision: new Collision(false, false, 6, FRIEND) }));
    }
  }
  function damageHero(s, amount, reason) {
    if (!s.running || s.shield > 0 || s.invulnerable > 0) return false;
    s.hero.hp = Math.max(0, s.hero.hp - amount); s.invulnerable = 0.9; s.combo = 0;
    emit(s, 'damage', { amount, x: s.hero.position.x, y: s.hero.position.y });
    if (s.hero.hp === 0) { s.running = false; s.lastReason = reason; emit(s, 'over'); }
    return true;
  }
  function shieldCost(s) { return Math.max(10, 20 - s.reserve * 3); }
  function activateShield(s) {
    if (!s.running || s.shieldCooldown > 0 || s.cash < shieldCost(s)) return false;
    s.cash -= shieldCost(s); s.shield = 2.8 + s.reserve * 0.8; s.shieldCooldown = 11 - s.reserve;
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
  function tick(s, dt, input = {}) {
    if (!s.running || dt <= 0) return;
    // Fixed-step physics is driven by the renderer; ignore unreasonable callers.
    dt = Math.min(dt, 0.05); s.time += dt;
    for (const key of ['shield', 'shieldCooldown', 'invulnerable', 'comboTime']) s[key] = Math.max(0, s[key] - dt);
    if (s.comboTime === 0) s.combo = 0;
    const h = s.hero.position; let dx = input.x || 0, dy = input.y || 0;
    if (input.target) {
      const tx = input.target.x - h.x, ty = input.target.y - h.y, d = Math.hypot(tx, ty);
      const travel = s.hero.velocity.speed * dt;
      if (d > 2) { dx = tx / Math.max(d, travel); dy = ty / Math.max(d, travel); }
    }
    const length = Math.max(1, Math.hypot(dx, dy));
    h.x = clamp(h.x + dx / length * s.hero.velocity.speed * dt, 22, W - 22);
    h.y = clamp(h.y + dy / length * s.hero.velocity.speed * dt, 48, H - 27);
    s.hero.echo = { ...h };
    s.fireTime -= dt; if (s.fireTime <= 0) { s.fireTime += (s.arcade ? (root.FuLamJourney?root.FuLamJourney.weaponProfile('fleet',s.evolution).interval:(s.weaponKind===3?.65:s.weaponKind===2?.42:s.weaponKind===1?.32:.20)) : Math.max(0.17, 0.34 - s.weapon * 0.025)); weaponFire(s); }
    s.escortTime -= dt; if (s.escortTime <= 0) { s.escortTime += s.escort === 3 ? 0.32 : 0.7; escortFire(s); }
    s.dividend += dt;
    if (s.dividend >= 15) {
      s.dividend -= 15;
      const amount = Math.min(22, Math.floor(s.cash * (0.06 + s.reserve * 0.02)));
      s.cash += amount; s.income += amount;
      if (amount > 0) emit(s, 'dividend', { amount });
    }
    const ships = s.entities.filter(e => e.type === 'ship' && !e.dead);
    if (!s.arcade && s.waveKills >= s.goal && !ships.some(e => e.kind === 'boss')) {
      s.wave++; s.waveKills = 0; s.goal = 7 + s.wave * 2; s.bossSpawned = false;
      emit(s, 'wave', { wave: s.wave });
    }
    if (s.wave % (s.arcade ? 3 : 4) === 0 && !s.bossSpawned) { spawnEnemy(s, 'boss'); s.bossSpawned = true; emit(s, 'boss'); }
    s.spawnTime -= dt;
    if (s.spawnTime <= 0) {
      s.spawnTime += Math.max(0.42, 1.5 - s.wave * 0.1) / MODE_RULES[s.mode].enemy / (s.arcade&&root.FuLamJourney?root.FuLamJourney.threatProfile(s.wave).density:1);
      if (ships.length < Math.min(14, 4 + s.wave * 2)) {
        const types = s.wave === 1 ? ['fee', 'fee', 'scam'] : s.wave === 2 ? ['fee', 'scam', 'inflation'] : ['fee', 'scam', 'inflation', 'debt'];
        spawnEnemy(s, types[Math.floor(s.random() * types.length)]);
      }
    }
    for (const e of s.entities) {
      if (e.dead) continue;
      if (e.ttl) { e.ttl.timeLeft -= dt; if (e.ttl.timeLeft <= 0) { e.dead = true; continue; } }
      if (e.type === 'ship') {
        e.age += dt; e.flash = Math.max(0, e.flash - dt);
        e.position.y += e.velocity.speed * dt;
        const sway = e.kind === 'scam' ? 65 : 22;
        e.position.x = clamp(e.originX + Math.sin(e.age * (e.kind === 'scam' ? 2 : 0.8) + e.phase) * sway, 26, W - 26);
        if (e.kind === 'boss') { e.position.y = Math.min(110, e.position.y); e.position.x = W / 2 + Math.sin(e.age * 0.55) * 125; }
        e.echo = { ...e.position };
        e.strategy.remainingBeforeAttack -= dt;
        if (e.position.y > 15 && e.position.y < H - 70 && e.strategy.remainingBeforeAttack <= 0) {
          e.strategy.remainingBeforeAttack = e.strategy.nextAttack; enemyFire(s, e);
        }
        if (testCircleCollision(e, s.hero)) damageHero(s, e.kind === 'boss' ? 30 : 18, e.kind);
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
          if (segmentCircleHit(bullet.previous, bullet.position, ship.position, bullet.collision.radius + ship.collision.radius)) {
            ship.hp -= bullet.damage; ship.flash = 0.1; bullet.hit.add(ship);
            if(bullet.blast||bullet.chain){let arcs=bullet.chain;for(const other of ships){if(other===ship||other.dead)continue;const distance=Math.sqrt(distanceSquare(ship.position,other.position));if(distance<bullet.blast||(arcs>0&&distance<150)){if(distance>=bullet.blast)arcs--;other.hp-=bullet.damage*.25;other.flash=.1;if(other.hp<=0)destroy(s,other);else emit(s,'impact',{x:other.position.x,y:other.position.y});}}emit(s,'impact',{x:ship.position.x,y:ship.position.y});bullet.blast=bullet.chain=0;}
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
  root.FleetCore = { W, H, FRIEND, ENEMY, SPECS, MAX, createState, tick, buy, upgradeCost, activateShield, shieldCost, spawnEnemy,
    maintainWorld, fireTorpedo, testCircleCollision, segmentCircleHit, angleDifference2DVectors, bestRecord, Position, Velocity, Collision, Strategy, Ttl, createEntity };
})(typeof globalThis !== 'undefined' ? globalThis : this);
