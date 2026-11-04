// Behavioral QA only. Test-local closure access is injected into an in-memory
// copy; no test API or setup cheats are included in the shipped HTML game.
import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
import test from 'node:test';

// Exercise the exact self-contained HTML published by the Pages workflow.
const html = fs.readFileSync(new URL('../site/fishing/index.html', import.meta.url), 'utf8');
const scripts = [...html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/g)].map(match => match[1]);
const source = scripts.find(script => script.includes('/* FuLam Catch'));
const formations = scripts.find(script => script.includes('window.FuLamFormations'));
const arcade = scripts.find(script => script.includes('class Effects'));
assert(source, 'Shipped fishing game script is present');
assert(formations, 'Shipped fish formation script is present');
assert(!html.includes('window.__qa'), 'Test setup access is never shipped');
const injectionPoint = '\nresize();syncSound();showWelcome();requestAnimationFrame(loop);';
assert(source.includes(injectionPoint), 'Game initialization marker is present');
const instrumented = source.replace('const journey=', 'let journey=').replace(injectionPoint, '\nwindow.__qa={run:code=>eval(code)};' + injectionPoint);
function harness(width = 1000, height = 600, options = {}) {
  let now = 1, raf = [], writes = 0, rng = 165706, drawTexts = [];
  const nodes = new Map(), storage = new Map(Object.entries(options.storage || {}));
  const winHandlers = {}, docHandlers = {}, accessedIds = new Set();
  const no = () => {};
  const gradient = {addColorStop:no};
  const ctx = new Proxy({createLinearGradient:()=>gradient,createRadialGradient:()=>gradient,fillText:(text,...args)=>drawTexts.push({text:String(text),args})}, {get: (o,k) => k in o ? o[k] : no, set: (o,k,v) => (o[k]=v, true)});
  const math = Object.create(Math);
  math.random = () => { rng = (rng * 1664525 + 1013904223) >>> 0; return rng / 4294967296; };
  let doc;
  class Element {
    constructor(id, tag = 'BUTTON') {
      this.id=id; this.tagName=tag; this.dataset={}; this.style={setProperty(k,v){this[k]=v;}}; this.hidden=false; this.disabled=false;
      this.attrs={}; this.events={}; this.children=[]; this._html=''; this.textContent='';
      const classes=new Set();
      this.classList={add:(...xs)=>xs.forEach(x=>classes.add(x)),remove:(...xs)=>xs.forEach(x=>classes.delete(x)),contains:x=>classes.has(x),toggle:(x,on)=>{const next=on===undefined?!classes.has(x):on;next?classes.add(x):classes.delete(x);return next;}};
    }
    get innerHTML(){return this._html;}
    set innerHTML(s){
      this._html=s;this.children=[];
      for(const m of s.matchAll(/<(button|a|input)\b([^>]*)>/g)){
        const attr=m[2],id=attr.match(/\bid="([^"]+)"/)?.[1]||'anonymous-'+this.children.length;
        const e=new Element(id,m[1].toUpperCase());
        for(const d of attr.matchAll(/data-([\w-]+)="([^"]+)"/g))e.dataset[d[1]]=d[2];
        e.autofocus=attr.includes('data-autofocus');e.disabled=attr.includes(' disabled');
        this.children.push(e);if(!id.startsWith('anonymous'))nodes.set(id,e);
      }
    }
    querySelectorAll(s){if(s==='[data-diff]')return this.children.filter(e=>e.dataset.diff);return this.children.filter(e=>!e.disabled);}
    querySelector(s){return s==='[data-autofocus]'?this.children.find(e=>e.autofocus):this.children[0];}
    setAttribute(k,v){this.attrs[k]=v;}
    getAttribute(k){return this.attrs[k]??null;}
    addEventListener(k,v){(this.events[k]??=[]).push(v);}
    focus(){doc.activeElement=this;}
    getContext(){return ctx;}
    getBoundingClientRect(){return {width,height,left:0,top:0};}
    setPointerCapture(){}
  }
  const el=id=>{if(!nodes.has(id))nodes.set(id,new Element(id,id==='game'?'CANVAS':'BUTTON'));return nodes.get(id);};
  doc={getElementById:id=>{accessedIds.add(id);return el(id);},body:new Element('body','BODY'),activeElement:null,hidden:false,addEventListener(k,v){(docHandlers[k]??=[]).push(v);}};
  const sandbox={document:doc,devicePixelRatio:1,Math:math,console,UPSTREAM_LICENSE:'MIT QA fixture',ResizeObserver:class{constructor(cb){this.cb=cb;}observe(){}},localStorage:{getItem:k=>storage.get(k)??null,setItem:(k,v)=>{if(options.storageThrows)throw new Error('Storage blocked');storage.set(k,v);writes++;}},setTimeout:()=>1,clearTimeout:no,requestAnimationFrame:cb=>raf.push(cb),matchMedia:q=>({matches:q.includes('pointer: coarse')&&!!options.touch}),FuLamArt:{drawBackground:no,drawFish:no,drawCannon:no,drawCoin:no},addEventListener(k,v){(winHandlers[k]??=[]).push(v);}};
  sandbox.window=sandbox;vm.createContext(sandbox);
  vm.runInContext(arcade,sandbox);
  vm.runInContext(formations,sandbox);
  vm.runInContext(instrumented,sandbox);
  const frame=ms=>{now+=ms;drawTexts=[];const calls=raf;raf=[];for(const cb of calls)cb(now);};
  frame(1);
  const advance=(seconds,fps=60)=>{let left=seconds*1000;while(left>1e-7){const ms=Math.min(left,1000/fps);frame(ms);left-=ms;}};
  const click=id=>{const e=el(id);assert(!e.disabled,id+' is enabled');assert.equal(typeof e.onclick,'function',id+' has UI handler');e.onclick({preventDefault:no});};
  const pointer=(type,x,y,options={},id='game')=>{for(const fn of el(id).events[type]||[])fn({type,clientX:x,clientY:y,pointerType:'mouse',pointerId:1,button:0,preventDefault:no,...options});};
  const emit=(scope,type,event={})=>{for(const fn of (scope==='window'?winHandlers:docHandlers)[type]||[])fn({preventDefault:no,...event});};
  return {installEvolution:()=>vm.runInContext(fs.readFileSync(new URL('../sources/arcade/journey.js',import.meta.url),'utf8'),sandbox),state:()=>sandbox.FuLamGame.getState(),run:code=>sandbox.__qa.run(code),click,advance,pointer,storage,el,doc,accessedIds,writes:()=>writes,drawTexts:()=>drawTexts,emit,resize:(nextWidth,nextHeight)=>{width=nextWidth;height=nextHeight;sandbox.__qa.run('resize()');}};
}
test('Shipped fishing fire supports all twelve evolution stages and preserves trajectory upgrades',()=>{
 const g=harness();g.click('start');g.installEvolution();
 g.run("journey={run:{weapon:0,rate:2,trajectory:2,wave:1,phase:'play'},name:()=> 'QA'}");
 for(let weapon=0;weapon<12;weapon++){
  g.run(`journey.run.weapon=${weapon};bullets=[];beams=[];fish=[];fire()`);
  const p=g.run('currentCannon()'),bullets=g.run('bullets'),beams=g.run('beams');
  assert.equal(p.tier,weapon+1);assert.equal(p.count,weapon?4:3);
  if(weapon===6||weapon===7){assert.equal(beams.length,p.count);assert.equal(bullets.length,0);}
  else {assert.equal(bullets.length,p.count);assert(bullets.every(b=>b.damage>0&&Number.isFinite(b.vx)));if(weapon>=8)assert(bullets.every(b=>b.homing>0));if(weapon>=10)assert(bullets.every(b=>b.chain>0));}
 }
});
const near=(a,b,tol=.0001)=>assert(Math.abs(a-b)<tol,`${a} != ${b}`);
const clone = value => JSON.parse(JSON.stringify(value));

test('Booth fishing stages are bullets, a full-screen laser, a piercing shot, then a wide blast',()=>{
 const g=harness();g.click('start');g.installEvolution();
 const aim=weapon=>{
  g.run(`journey={run:{weapon:${weapon},rate:0,trajectory:0,wave:${weapon+1},phase:'play',scene:'booth'},text:zh=>zh,name:()=>'n'};bullets=[];beams=[];fish=[];angle=-Math.PI/2;fire()`);
  return {cannon:g.run('currentCannon()'),bullets:g.run('bullets'),beams:g.run('beams')};
 };
 const open=aim(0);
 assert.equal(open.cannon.name,'普通子彈');assert.equal(open.beams.length,0);assert.equal(open.bullets.length,1);assert.equal(open.bullets[0].blast,0);
 const laser=aim(1);
 assert.equal(laser.cannon.kind,'beam');assert.equal(laser.cannon.name,'雙聯激光');
 assert.equal(laser.beams.length,2);assert.equal(laser.bullets.length,0);
 assert(laser.beams.every(b=>b.width<=8&&b.color==='#8cf4ff'));
 const reach=Math.hypot(laser.beams[0].ex-laser.beams[0].x,laser.beams[0].ey-laser.beams[0].y);
 assert(reach>600&&Math.min(laser.beams[0].y,laser.beams[0].ey)<0,`laser reach ${reach}`);
 const pierce=aim(2);
 assert.equal(pierce.cannon.name,'穿透巨彈');assert.equal(pierce.beams.length,0);assert.equal(pierce.bullets.length,1);
 assert(pierce.bullets[0].pierce>=8&&pierce.bullets[0].r>=14&&pierce.bullets[0].blast===0);
 const boom=aim(3);
 assert.equal(boom.cannon.name,'爆裂彈');assert.equal(boom.bullets.length,1);
 assert(boom.bullets[0].blast>=84&&boom.bullets[0].blast<=112);
 const kept=weapon=>{
  g.run(`journey={run:{weapon:${weapon},rate:0,trajectory:2,wave:1,phase:'play',scene:'booth'},text:zh=>zh,name:()=>'n'};bullets=[];beams=[];fish=[];angle=-Math.PI/2;fire()`);
  const cannon=g.run('currentCannon()');
  return {cannon,shots:cannon.kind==='beam'?g.run('beams').length:g.run('bullets').length};
 };
 for(const weapon of [0,2,3]){const shot=kept(weapon);assert.equal(shot.cannon.spread.length,3);assert.equal(shot.shots,3);}
 const lasers=kept(1);assert.equal(lasers.cannon.spread.length,4);assert.equal(lasers.shots,4);assert(lasers.cannon.beamWidth<=8);
});
test('Fishing protection lowers actual idle drain, and catches respect expanded energy capacity',()=>{
 const losses=[];
 for(const protection of [0,1,3]){
  const g=harness();g.click('start');g.installEvolution();
  g.run(`journey={run:Object.assign(new FuLamJourney.Run('fishing','web','standard',1),{life:1,protection:${protection}}),name:()=> 'QA'};energy=120;fish=[]`);
  g.run('hudClock=100;spawnClock=100;step(.05,.05)');losses.push(120-g.state().energy);
  assert.equal(g.state().maxEnergy,120);
  near(120-g.state().energy,.85*.05/(1+.15*protection));
  g.run("energy=119.9;spawn('coin',{x:300,y:200});capture(fish[fish.length-1])");
  near(g.state().energy,120);
 }
 assert(losses[0]>losses[1]&&losses[1]>losses[2]);
});

test('A secondary touch casts a skill while the first finger keeps firing',()=>{
  const g=harness();g.click('start');
  g.pointer('pointerdown',300,200,{pointerType:'touch',pointerId:11});g.advance(.3);
  const before=g.state().shots;
  g.pointer('pointerdown',700,650,{pointerType:'touch',pointerId:22},'freeze');
  assert(g.state().freezeCooldown>0);near(g.run('aim.x'),300);
  g.pointer('pointerup',700,650,{pointerType:'touch',pointerId:22},'freeze');g.advance(.5);
  assert(g.state().shots>before,'lifting the skill finger does not stop firing');
  g.pointer('pointerup',300,200,{pointerType:'touch',pointerId:11});
  const stopped=g.state().shots;g.advance(.5);assert.equal(g.state().shots,stopped);
});

test('Multiple aiming fingers release independently and pause clears all touches',()=>{
  const g=harness();g.click('start');
  const touch=id=>({pointerType:'touch',pointerId:id});
  g.pointer('pointerdown',250,180,touch(1));g.pointer('pointerdown',700,220,touch(2));
  g.pointer('pointermove',720,230,touch(2));near(g.run('aim.x'),250);
  g.pointer('pointerup',250,180,touch(1));g.pointer('lostpointercapture',250,180,touch(1));
  near(g.run('aim.x'),720);assert(g.run('pointerDown'));
  g.advance(.3);const before=g.state().shots;g.pointer('pointercancel',0,0,touch(99));g.advance(.3);
  assert(g.state().shots>before,'an unrelated cancellation does not release the active finger');
  g.click('pause');g.click('resume');assert(!g.run('pointerDown'));assert.equal(g.run('canvasPointers.size'),0);
  g.pointer('pointermove',800,200,touch(2));const stopped=g.state().shots;g.advance(.5);assert.equal(g.state().shots,stopped);
});

for(const fps of [60,15])test(`No automatic timeout after 120 seconds at ${fps} fps`,()=>{
  const g=harness();g.click('start');g.advance(120,fps);
  assert.equal(g.state().mode,'playing');near(g.state().round,120);assert.equal(g.el('timer').textContent,'∞');
});

test('Long session repeats bosses and caps active entities',()=>{
  const g=harness();g.click('start');g.advance(900,15);
  const s=g.state();assert.equal(s.mode,'playing');near(s.round,900);assert(s.bossSpawned>10,'bosses keep arriving after the original three');
  assert(g.run('fish.length')<=60,'bounded active fish');assert(g.run('bullets.length')<=250,'bounded bullets');
  for(const f of g.run('fish'))for(const k of ['x','y','hp','size','age'])assert(Number.isFinite(f[k]),`fish ${k} finite`);
});

test('Pause and help freeze elapsed time, fish, effects and cooldowns',()=>{
  const g=harness();g.click('start');g.run('level=9;updateHud()');g.click('freeze');g.click('rapid');g.advance(2,15);
  g.click('pause');const paused=JSON.stringify(g.state());g.advance(20,15);assert.equal(JSON.stringify(g.state()),paused);
  g.click('help');g.advance(20,15);g.click('helpClose');assert.equal(g.state().mode,'paused');assert.equal(JSON.stringify(g.state()),paused);
  g.click('resume');const before=g.state().round;g.advance(1,15);near(g.state().round,before+1);
  assert(g.run('freezeTime')>0);assert(g.run('rapidTime')>0);
});

test('All 12 cannon levels purchase once and increase usable firepower',()=>{
  const g=harness();g.click('start');const table=clone(g.run('cannons'));assert.equal(table.length,12);
  let previousDps=0;
  for(let current=1;current<=12;current++){
    assert.equal(g.state().level,current);g.run('bullets=[];beams=[];fire()');
    const bullets=g.run('bullets'),beams=g.run('beams'),cannon=table[current-1];
    assert.equal(beams.length,['beam','hybrid'].includes(cannon.kind)?1:0);
    assert.equal(bullets.length,cannon.kind==='beam'?0:cannon.spread.length);
    assert(bullets.every(b=>Number.isFinite(b.vx)&&Number.isFinite(b.vy)&&b.damage>0));
    const dps=(cannon.damage*bullets.length+(cannon.beamDamage||cannon.damage)*beams.length)/cannon.interval;
    assert(dps>=previousDps,'each level has at least prior firepower');previousDps=dps;
    if(current<12){
      const price=table[current].cost;
      g.run(`wallet=${price-1};updateHud()`);assert(g.el('upgrade').disabled);g.run('upgrade()');assert.equal(g.state().level,current);
      g.run(`wallet=${price+7};updateHud()`);g.click('upgrade');assert.equal(g.state().level,current+1);assert.equal(g.state().wallet,7);
    }
  }
  assert(g.el('upgrade').disabled);g.run('wallet=999999;upgrade()');assert.equal(g.state().level,12);assert.equal(g.state().wallet,999999);
});

test('Skill unlocks match progression and direct calls cannot bypass locks',()=>{
  const g=harness();g.click('start');const skills=[['rapid',3,'useRapid()'],['bomb',7,'useBomb()'],['lure',9,'useLure()']];
  for(const [id,unlock,call]of skills){g.run(`level=${unlock-1};updateHud()`);assert(g.el(id).disabled,id+' is locked');const before=JSON.stringify(g.state());g.run(call);assert.equal(JSON.stringify(g.state()),before,id+' rejects locked invocation');g.run(`level=${unlock};updateHud()`);assert(!g.el(id).disabled,id+' unlocks');}
});

test('Freeze slows fish motion and expires without removing cooldown',()=>{
  const control=harness(),g=harness();for(const h of[control,g]){h.click('start');h.run("fish=[];spawn('stock',{x:250,y:250,dir:1,speed:80});");}
  g.click('freeze');control.advance(2);g.advance(2);
  const normal=control.run('fish[0].x-250'),frozen=g.run('fish[0].x-250');assert(frozen>0&&frozen<normal*.3);
  g.advance(4);near(g.run('freezeTime'),0);assert(g.el('freeze').disabled);g.advance(15);assert(!g.el('freeze').disabled);
});

test('Rapid skill increases shots during the buff and stops after expiry',()=>{
  const g=harness();g.click('start');g.run('level=3;fish=[];spawnClock=999;nextBossAt=999;updateHud()');g.pointer('pointerdown',500,200);g.advance(2);g.pointer('pointerup',500,200);const base=g.state().shots;
  g.click('rapid');g.pointer('pointerdown',500,200);g.advance(2);g.pointer('pointerup',500,200);assert(g.state().shots-base>base*1.3);
  g.advance(10);near(g.run('rapidTime'),0);assert(g.run('rapidCooldown')>0);
});

test('Bomb damages fish and lure creates additional fish once per cooldown',()=>{
  const g=harness();g.click('start');g.run("level=9;fish=[];spawn('coin',{x:300,y:250});spawn('save',{x:350,y:250});aim={x:330,y:250};updateHud()");g.click('bomb');assert(g.state().caught>=1,'bomb has actual damage');
  const prior=g.run('fish.filter(f=>!f.dead).length');g.click('lure');const after=g.run('fish.filter(f=>!f.dead).length');assert(after>prior,'lure creates a school');
  g.run('useLure()');assert.equal(g.run('fish.filter(f=>!f.dead).length'),after);assert(g.el('lure').disabled);assert(g.el('bomb').disabled);
});

test('Capture missions continue beyond the original 100-fish goal',()=>{
  const g=harness();g.click('start');let previousBonus=0;
  for(let i=0;i<8;i++){
    const m=clone(g.run('mission()'));assert(m&&m.n>0,'mission exists');g.run(`caught=${m.n-1};fish=[];spawn('coin',{x:300,y:250});capture(fish[0]);updateHud()`);
    assert.equal(g.run('missionIndex'),i+1);assert(g.run('mission().n')>m.n);assert(m.bonus>=previousBonus);previousBonus=m.bonus;
  }
  assert(g.state().caught>100);
});

for(const dimensions of [[1000,600],[390,530],[320,480],[640,300]])test(`Larger fish stay within vertical playfield at ${dimensions.join('x')}`,()=>{
  const g=harness(...dimensions);g.click('start');g.run("fish=[];for(const type of Object.keys(defs)){spawn(type,{x:w/2,y:-999});spawn(type,{x:w/2,y:9999});}");
  assert(g.run("fish.find(f=>f.type==='coin').size")>(dimensions[0]<600?16:20)*1.35);
  for(const f of g.run('fish')){const bounds=g.run(`swimBounds(${f.size})`);assert(f.baseY>=bounds[0]-.01&&f.baseY<=bounds[1]+.01,`${f.type} center is bounded`);}
  g.resize(320,380);for(const f of g.run('fish')){assert(Number.isFinite(f.x)&&Number.isFinite(f.y));const bounds=g.run(`swimBounds(${f.size})`);assert(f.baseY>=bounds[0]-.01&&f.baseY<=bounds[1]+.01);}
});

for(const enabled of [true,false])test(`Manual settlement is the only finish and keeps saved record, sound=${enabled}`,()=>{
  const g=harness();if(!enabled)g.click('sound');g.click('start');g.run("fish=[];spawn('coin',{x:300,y:250});capture(fish[0]);updateHud()");g.advance(125,15);assert.equal(g.state().mode,'playing');
  g.click('pause');g.click('finishSession');assert.equal(g.state().mode,'ended');const result=g.el('overlay').innerHTML;assert(result.includes('刷新個人最佳'));
  const saved=g.storage.get('fulam-catch-v1'),writes=g.writes();assert.equal(JSON.parse(saved).sound,enabled);assert(JSON.parse(saved).best.normal>=10);
  g.click('help');g.advance(2,15);g.click('helpClose');assert.equal(g.state().mode,'ended');assert.equal(g.storage.get('fulam-catch-v1'),saved);assert.equal(g.writes(),writes);
  g.click('credits');g.click('creditsClose');assert.equal(g.storage.get('fulam-catch-v1'),saved);assert.equal(g.writes(),writes);assert(g.el('overlay').innerHTML.includes('刷新個人最佳'));
});

test('Keyboard shortcuts trigger the remaining skills',()=>{
  const g=harness();g.click('start');g.run('level=12;updateHud()');
  for(const key of ['1','2','3','4'])g.emit('window','keydown',{key,repeat:false});
  for(const id of ['freeze','rapid','bomb','lure'])assert(g.run(`${id}Cooldown`)>0,id+' responds to key');
  g.emit('window','keydown',{key:'q',repeat:false});g.emit('window','keydown',{key:'1',repeat:false});
  assert.equal(g.run('typeof useNet'),'undefined');
});

test('Existing sound and best records survive the upgrade to endless mode',()=>{
  const saved=JSON.stringify({sound:false,best:{easy:120,normal:220,hard:320}});
  const g=harness(1000,600,{storage:{'fulam-catch-v1':saved}});
  assert.equal(g.el('best').textContent,'220');assert.equal(g.el('sound').attrs['aria-pressed'],'false');
  g.click('start');g.run("fish=[];spawn('coin',{x:300,y:250});capture(fish[0]);updateHud()");g.click('pause');g.click('finishSession');
  const next=JSON.parse(g.storage.get('fulam-catch-v1'));assert.equal(next.sound,false);assert.deepEqual(next.best,{easy:120,normal:220,hard:320});
});

test('Changing tabs pauses gameplay and does not spend buffs off-screen',()=>{
  const g=harness();g.click('start');g.click('freeze');g.advance(1);g.doc.hidden=true;g.emit('document','visibilitychange');
  assert.equal(g.state().mode,'paused');const snapshot=JSON.stringify(g.state());g.advance(60,15);assert.equal(JSON.stringify(g.state()),snapshot);
});

test('Blocked local storage never prevents starting or settling',()=>{
  const g=harness(1000,600,{storageThrows:true});g.click('start');g.run("fish=[];spawn('coin',{x:300,y:250});capture(fish[0]);updateHud()");g.click('pause');g.click('finishSession');assert.equal(g.state().mode,'ended');
});

test('Spread upgrades create distinct multi-angle projectiles rather than cosmetic barrels',()=>{
  const g=harness();g.click('start');
  for(const [level,count] of [[1,1],[2,2],[3,3],[7,5],[10,7]]){
    g.run(`level=${level};fish=[];bullets=[];beams=[];angle=-Math.PI/2;fire();`);
    const bullets=g.run('bullets');assert.equal(bullets.length,count);
    assert.equal(new Set(bullets.map(b=>b.vx.toFixed(6))).size,count,'each barrel has a distinct trajectory');
    assert(bullets.every(b=>b.kind==='bullet'&&b.vy<0&&b.pierce===1));
  }
});

test('Beam pierces aligned fish immediately, ignores off-axis fish and damages once per shot',()=>{
  const g=harness();g.click('start');
  g.run("level=6;fish=[];bullets=[];beams=[];spawnClock=999;nextBossAt=999;spawn('coin',{x:500,y:350,speed:0});spawn('coin',{x:500,y:240,speed:0});spawn('coin',{x:750,y:300,speed:0});for(const f of fish)f.hp=f.maxHp=1000;angle=-Math.PI/2;fire();");
  const after=clone(g.run('fish.map(f=>f.hp)'));assert.deepEqual(after,[982,982,1000]);
  assert.equal(g.run('bullets.length'),0);assert.equal(g.run('beams.length'),1);assert.equal(g.state().shots,1);
  g.click('pause');const beam=JSON.stringify(g.run('beams'));g.advance(2,15);assert.equal(JSON.stringify(g.run('beams')),beam,'beam animation pauses');
  g.click('resume');g.advance(.4);assert.equal(g.run('beams.length'),0);assert.deepEqual(clone(g.run('fish.map(f=>f.hp)')),after,'beam visual does not apply damage each frame');
});

for(const fps of [60,15])test(`Large orb pierces separate fish once and damages nearby fish with its blast at ${fps} fps`,()=>{
  const g=harness();g.click('start');
  g.run("level=5;fish=[];bullets=[];beams=[];spawnClock=999;nextBossAt=999;spawn('coin',{x:500,y:350,speed:0,phase:0});spawn('coin',{x:500,y:220,speed:0,phase:0});spawn('coin',{x:565,y:375,speed:0,phase:0});spawn('coin',{x:800,y:350,speed:0,phase:0});for(const f of fish)f.hp=f.maxHp=1000;angle=-Math.PI/2;fire();");
  const bullet=g.run('bullets[0]');assert.equal(bullet.kind,'orb');assert(bullet.r>10);assert.equal(bullet.pierce,3);
  g.advance(.8,fps);const health=clone(g.run('fish.map(f=>f.hp)'));
  near(health[0],989);near(health[1],989);near(health[2],1000-11*.45);near(health[3],1000);
  g.advance(.5,fps);assert.deepEqual(clone(g.run('fish.map(f=>f.hp)')),health,'same orb cannot repeatedly damage one body');
});

test('Top-level hybrid combines a penetrating beam with three large projectiles',()=>{
  const g=harness();g.click('start');g.run('level=12;fish=[];bullets=[];beams=[];fire()');
  assert.equal(g.run('beams.length'),1);assert.equal(g.run('bullets.length'),3);assert(g.run("bullets.every(b=>b.kind==='orb'&&b.pierce===4&&b.blast>0)"));
  assert.equal(g.state().shots,4);assert.equal(g.state().cannon.kind,'hybrid');
  g.run('level=9;bullets=[];beams=[];for(let i=0;i<50;i++)fire()');assert(g.run('beams.length')<=12,'beam effects are bounded');
});

test('Longer seas increase fish health and movement but growth has a finite cap',()=>{
  const g=harness();g.click('start');
  const sample=round=>{g.run(`round=${round};fish=[];spawn('stock',{x:300,y:250});`);return clone(g.run('({hp:fish[0].maxHp,speed:fish[0].speed})'));};
  const start=sample(0),later=sample(180),cap=sample(3600),veryLate=sample(3600000);
  assert(later.hp>start.hp&&later.speed>start.speed);assert.deepEqual(cap,veryLate);
});

test('All ten fish have visible health and lose health before being captured',()=>{
  const g=harness();g.click('start');
  const types=clone(g.run('Object.keys(defs)'));assert.equal(types.length,10);
  for(const type of types){
    g.run(`fish=[];spawnClock=999;nextBossAt=999;spawn(${JSON.stringify(type)},{x:w/2,y:h/2,speed:0,phase:0});`);
    const fresh=clone(g.run('fish[0]'));
    assert(Number.isFinite(fresh.hp)&&fresh.hp>1,`${type} takes multiple starter hits`);
    assert.equal(fresh.hp,fresh.maxHp);
    g.advance(1/60);assert(g.drawTexts().some(item=>item.text===`${fresh.hp}/${fresh.maxHp}`),'full health is displayed before the first hit');
    g.run('damage(fish[0],1)');const damaged=clone(g.run('fish[0]'));
    assert.equal(damaged.hp,fresh.hp-1);assert.equal(damaged.maxHp,fresh.maxHp);assert(!damaged.dead);
    g.advance(1/60);assert(g.drawTexts().some(item=>item.text===`${damaged.hp}/${fresh.maxHp}`),'damaged health label updates');
    const caughtBefore=g.state().caught;
    g.run('damage(fish[0],fish[0].hp)');assert.equal(g.state().caught,caughtBefore+1);
    g.run('damage(fish[0],99);capture(fish[0])');assert.equal(g.state().caught,caughtBefore+1,'capture is idempotent');
  }
});

for(const fps of [60,15])test(`All ten fish stay bounded through movement, freeze and pause at ${fps} fps`,()=>{
  const g=harness(390,530);g.click('start');
  g.run('fish=[];spawnClock=999;nextBossAt=999;for(const type of Object.keys(defs)){spawn(type,{x:w/2,y:-999,dir:1,speed:10,phase:0});spawn(type,{x:w/2,y:9999,dir:-1,speed:10,phase:1});}');
  assert.equal(g.run('fish.length'),20);assert(g.run('new Set(Object.values(defs).map(d=>d.swim)).size')>=6,'different movement profiles');
  const verify=()=>{
    for(const f of g.run('fish')){
      for(const key of ['x','y','angle','hp','maxHp','swimTime'])assert(Number.isFinite(f[key]),`${f.type} ${key} finite`);
      const [lo,hi]=g.run(`swimBounds(${f.size})`);
      assert(f.y>=lo-.01&&f.y<=hi+.01,`${f.type} rendered center stays bounded`);
    }
  };
  for(let second=0;second<8;second++){g.advance(1,fps);verify();}
  const beforeFreeze=clone(g.run('fish.map(f=>f.swimTime)'));g.click('freeze');g.advance(1,fps);verify();
  const afterFreeze=clone(g.run('fish.map(f=>f.swimTime)'));
  assert(afterFreeze.every((value,i)=>value>beforeFreeze[i]&&value-beforeFreeze[i]<.25),'freeze slows swim-phase clocks too');
  g.click('pause');const paused=JSON.stringify(g.run('fish'));g.advance(5,fps);assert.equal(JSON.stringify(g.run('fish')),paused,'pause freezes full trajectory state');
  g.click('resume');g.advance(.5,fps);verify();
});

test('Low frame rates preserve swim speed and trajectory for all ten fish',()=>{
  const sample=fps=>{
    const g=harness();g.click('start');
    g.run('fish=[];spawnClock=999;nextBossAt=999;for(const type of Object.keys(defs))spawn(type,{x:400,y:300,dir:1,speed:10,phase:0});');
    g.advance(3,fps);return clone(g.run('fish.map(f=>({type:f.type,x:f.x,y:f.y,swimTime:f.swimTime}))'));
  };
  const fast=sample(60),slow=sample(15);assert.equal(fast.length,10);assert.equal(slow.length,10);
  for(let i=0;i<fast.length;i++){assert.equal(slow[i].type,fast[i].type);near(slow[i].swimTime,fast[i].swimTime);near(slow[i].x,fast[i].x,.25);near(slow[i].y,fast[i].y,.25);}
});

test('Letter shortcuts trigger freeze, rapid fire, bomb and lure',()=>{
  const g=harness();g.click('start');g.run('level=12;updateHud()');
  for(const key of ['q','w','e','r'])g.emit('window','keydown',{key,repeat:false});
  for(const id of ['freeze','rapid','bomb','lure'])assert(g.run(`${id}Cooldown`)>0,id+' responds to its letter shortcut');
});

test('Shark and whale armour takes longer to defeat early, and both patrol within phone width',()=>{
 const g=harness(390,600);g.click('start');g.installEvolution();
 for(const type of ['shark','whale']){
  const times=[];
  for(let wave=1;wave<=4;wave++){
   g.run(`journey={run:{random:()=>.5,wave:${wave},weapon:${wave-1},rate:0,trajectory:0,scene:'booth'},text:zh=>zh,name:()=>'QA'};fish=[];spawn('${type}',{x:195,y:250});`);
   const p=g.run('currentCannon()');const initial=g.run('fish[0].hp');g.run('damage(fish[0],10)');
   near(initial-g.run('fish[0].hp'),wave<3?5:10);
   const multiplier=wave===2?1.3:1;
   times.push(initial/(p.damage*multiplier/p.interval*(wave<3?.5:1)));
   for(let i=0;i<1200;i++)g.run('moveFish(1/60)');
   assert.equal(g.run('fish.length'),1);assert(g.run('fish[0].x>0&&fish[0].x<w'));
  }
  assert(times[0]>12&&times[1]>8,`${type} early: ${times}`);
  assert(times[2]<times[1]&&times[3]<times[2],`${type} gets approachable: ${times}`);
  assert(times[2]<10&&times[3]<9,`${type} late fights fit a round: ${times}`);
 }
});

test('Every round schedules its named boss, never duplicates a live boss and replaces it after a catch',()=>{
 const g=harness();g.click('start');g.installEvolution();
 for(const wave of [1,2,3,4]){
  g.run(`journey={run:{random:()=>.5,wave:${wave},weapon:${wave-1},scene:'booth'},text:zh=>zh,name:()=>'QA'};fish=[];spawnRoundBoss();`);
  assert.equal(g.run('fish[0].type'),wave%2?'shark':'whale');
  assert.equal(g.run('spawnRoundBoss()'),false);assert.equal(g.run('fish.length'),1);
  g.run('fish[0].dead=true');assert.equal(g.run('spawnRoundBoss()'),true);
 }
});

for(const width of [390,1000])test(`Round-four explosion damages nearby fish once and displays the actual radius at ${width}px`,()=>{
 const g=harness(width,600);g.click('start');g.installEvolution();
 g.run("journey={run:{random:()=>.5,wave:4,weapon:3,rate:0,trajectory:0,scene:'booth'},best:()=>0,text:zh=>zh,name:()=>'QA',step:()=>{}};fish=[];bullets=[];rings=[];hudClock=100;spawnClock=100;nextBossAt=Infinity;angle=-Math.PI/2;aim={x:w/2,y:250};");
 g.run("for(const dx of [0,70,190]){spawn('coin',{x:w/2+dx,y:250,speed:0});const f=fish.at(-1);f.hp=f.maxHp=1000;f.phase=0;}fire()");
 const damage=g.run('bullets[0].damage');g.advance(.55);
 const hp=g.run('fish.map(f=>f.hp)');near(hp[0],1000-damage);near(hp[1],1000-damage*.6);near(hp[2],1000);
 const blast=g.run('rings.find(r=>r.blast)');assert(blast);assert.equal(blast.end,g.run('currentCannon().blast'));
 g.advance(.2);near(g.run('fish[1].hp'),hp[1]);
});

// Rendering, sound output, and touch interaction are additionally checked in-browser.

test('touch-first fishing scales fish down and adds health while desktop stats remain unchanged',()=>{
 for(const [width,height] of [[390,844],[844,390]]){
  const desktop=harness(width,height),phone=harness(width,height,{touch:true});
  for(const g of [desktop,phone])g.run("fish=[];spawn('whale',{x:200,y:200,speed:0});spawn('fund',{x:200,y:200,speed:0})");
  for(let i=0;i<2;i++){const a=desktop.run(`fish[${i}]`),b=phone.run(`fish[${i}]`);near(b.size,a.size*.9);assert.equal(b.maxHp,Math.ceil(a.maxHp*1.1));}
 }
});
