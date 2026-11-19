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
  const sandbox={document:doc,devicePixelRatio:1,Math:math,console,UPSTREAM_LICENSE:'MIT QA fixture',ResizeObserver:class{constructor(cb){this.cb=cb;}observe(){}},localStorage:{getItem:k=>storage.get(k)??null,setItem:(k,v)=>{if(options.storageThrows)throw new Error('Storage blocked');storage.set(k,v);writes++;}},setTimeout:()=>1,clearTimeout:no,requestAnimationFrame:cb=>raf.push(cb),matchMedia:q=>({matches:q.includes('pointer: coarse')&&!!options.touch}),FuLamArt:{drawBackground:no,drawFish:no,drawCannon:no,drawCoin:no,drawSupply:no},addEventListener(k,v){(winHandlers[k]??=[]).push(v);}};
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

test('Booth fishing stages are all multi-shot trajectory cannons',()=>{
 const g=harness();g.click('start');g.installEvolution();
 const aim=weapon=>{
  g.run(`journey={run:{weapon:${weapon},rate:0,trajectory:0,wave:${weapon+1},phase:'play',scene:'booth'},text:zh=>zh,name:()=>'n'};bullets=[];beams=[];fish=[];angle=-Math.PI/2;fire()`);
  return {cannon:g.run('currentCannon()'),bullets:g.run('bullets'),beams:g.run('beams')};
 };
 const open=aim(0);
 assert.equal(open.cannon.name,'雙管雪花');assert.equal(open.beams.length,0);assert.equal(open.bullets.length,2);assert.equal(open.bullets[0].blast,0);
 near(open.bullets[1].x-open.bullets[0].x,14);
 const laser=aim(1);
 assert.equal(laser.cannon.kind,'beam');assert.equal(laser.cannon.name,'糖杖雙聯');
 assert.equal(laser.beams.length,2);assert.equal(laser.bullets.length,0);
 near(laser.beams[1].x-laser.beams[0].x,22);
 assert(laser.beams.every(b=>b.width<=8&&b.color==='#c23b3b'));
 const reach=Math.hypot(laser.beams[0].ex-laser.beams[0].x,laser.beams[0].ey-laser.beams[0].y);
 assert(reach>600&&Math.min(laser.beams[0].y,laser.beams[0].ey)<0,`laser reach ${reach}`);
 const pierce=aim(2);
 assert.equal(pierce.cannon.name,'聖誕鈴鐺');assert.equal(pierce.beams.length,0);assert.equal(pierce.bullets.length,2);
 near(pierce.bullets[0].x,pierce.bullets[1].x);
 assert(pierce.bullets[0].pierce>=8&&pierce.bullets[0].r>=14&&pierce.bullets[0].blast===0);
 const boom=aim(3);
 assert.equal(boom.cannon.name,'爆炸聖誕糖豆');assert.equal(boom.bullets.length,2);
 near(boom.bullets[0].blast,168*.70);
 const kept=weapon=>{
  g.run(`journey={run:{weapon:${weapon},rate:0,trajectory:2,wave:1,phase:'play',scene:'booth'},text:zh=>zh,name:()=>'n'};bullets=[];beams=[];fish=[];angle=-Math.PI/2;fire()`);
  const cannon=g.run('currentCannon()');
  return {cannon,shots:cannon.kind==='beam'?g.run('beams').length:g.run('bullets').length};
 };
 for(const weapon of [0,1,2,3]){const shot=kept(weapon);assert.equal(shot.cannon.spread.length,4);assert.equal(shot.shots,4);}
 assert(kept(1).cannon.beamWidth<=8);
});
test('Fishing protection lowers actual idle drain, and catches respect expanded energy capacity',()=>{
 const losses=[];
 for(const protection of [0,1,3]){
  const g=harness();g.click('start');g.installEvolution();
  g.run(`journey={run:Object.assign(new FuLamJourney.Run('fishing','web','standard',1),{life:1,protection:${protection}}),name:()=> 'QA'};energy=120;fish=[]`);
  g.run('hudClock=100;spawnClock=100;step(.05,.05)');losses.push(120-g.run('energy'));
  assert.equal(g.state().maxEnergy,120);
  assert.equal(g.state().energy,120);near(120-g.run('energy'),.85*.05/(1+.15*protection));
  g.run("energy=119.9;spawn('coin',{x:300,y:200});capture(fish[fish.length-1])");
  near(g.state().energy,120);
 }
 assert(losses[0]>losses[1]&&losses[1]>losses[2]);
});

test('Auto-fire continues after aiming touch is released',()=>{
 const g=harness();g.click('start');g.advance(.5);assert(g.state().shots>0);
 g.pointer('pointerdown',300,200,{pointerType:'touch',pointerId:11});g.advance(.3);
 const before=g.state().shots;g.pointer('pointerup',300,200,{pointerType:'touch',pointerId:11});g.advance(.5);
 assert(g.state().shots>before);near(g.run('aim.x'),300);
});

test('The finale gains fifteen percent over the previous device-scaled golden whale',()=>{
 for(const [touch,oldHp] of [[false,203],[true,224]]){
  const g=harness(390,844,{touch});g.click('start');g.installEvolution();
  g.run("difficulty='booth';journey={run:Object.assign(new FuLamJourney.Run('fishing','booth'),{wave:4,total:76}),best:()=>0,text:zh=>zh,name:()=>'QA'};fish=[];energy=0;hudClock=100;step(.01,.01)");
  const whale=g.run("fish.find(f=>f.type==='midas')");
  const previousHp=Math.round(Math.ceil(Math.ceil(Math.ceil(oldHp*1.5)*1.15)*1.105)*.9);
  assert.equal(whale.maxHp,Math.round(previousHp*1.15));assert.equal(whale.hp,whale.maxHp);
  assert.equal(g.state().mode,'playing');assert(g.state().energy>0);
 }
});

test('Golden whale telegraphs a wave, rewards a timely interrupt and surges faster in the final six seconds',()=>{
 const g=harness(390,844,{touch:true});g.click('start');g.installEvolution();
 g.run("difficulty='booth';journey={run:Object.assign(new FuLamJourney.Run('fishing','booth'),{wave:4,total:76}),text:zh=>zh,name:()=>'QA'};fish=[];energy=70;spawnCarnivalBoss()");
 const swim=seconds=>g.run(`for(let i=0;i<${Math.round(seconds*120)};i++)moveFish(1/120)`);
 const tide=()=>clone(g.run('fish[0].tide'));
 assert.equal(tide().phase,'wait');
 swim(1.55);
 assert.equal(tide().phase,'charge');assert.equal(tide().duration,2.5);
 g.run("damage(fish[0],10,'splash');damage(fish[0],10,'direct',-Math.PI/2)");
 assert.equal(tide().damage,0,'splash and off-axis glancing shots cannot interrupt');
 g.run("angle=Math.atan2(fish[0].y-origin().y,fish[0].x-origin().x);damage(fish[0],6)");assert.equal(tide().damage,6);
 g.run('damage(fish[0],10)');assert.equal(tide().phase,'wait');
 assert.equal(g.run('score'),60);assert.equal(g.run('energy'),70);
 g.run('journey.run.total=85;combo=5');swim(.8);
 assert.equal(tide().phase,'charge');assert.equal(tide().duration,1.85);
 swim(1.9);assert.equal(tide().phase,'surge');assert.equal(g.run('energy'),46);
 assert.equal(g.run('combo'),0);assert.equal(g.run('score'),60);
 swim(.95);assert.equal(tide().phase,'wait');assert.equal(g.run('energy'),46);
 g.run("journey.run.total=78;fish=[];carnivalBossSpawned=false;spawn('shark');spawnCarnivalBoss();damage(fish[0],fish[0].maxHp*.57,'bomb')");
 assert.equal(g.run("fish.some(f=>f.type==='shark')||spawnRoundBoss()"),false);
 swim(.8);assert.equal(tide().phase,'charge');assert.equal(tide().duration,1.85,'a skilled player also triggers rage with damage');
 g.run("damage(fish[0],fish[0].hp,'bomb')");
 assert(g.run('rings.some(r=>r.stars&&r.max>1)'),'capturing the finale displays its golden star reward');
});

test('On touch, tracking the whale across its flanks earns the catch; leaving the cannon centred does not',()=>{
 for(const width of [320,390,768]){
  const g=harness(width,700,{touch:true});
  assert(g.run("whaleFlank(-1,fishSize('midas'))-1.65*fishSize('midas')>=2"));
  assert(g.run("whaleFlank(1,fishSize('midas'))+1.65*fishSize('midas')<=w-2"));
 }
 const simulate=follow=>{
  const g=harness(390,700,{touch:true});g.click('start');g.installEvolution();
  g.run("difficulty='booth';journey={run:Object.assign(new FuLamJourney.Run('fishing','booth'),{wave:4,total:75.01,weapon:3,trajectory:3}),text:zh=>zh,name:()=>'QA'};fish=[];energy=100;level=4;spawnClock=999;nextBossAt=999;hudClock=999;spawnCarnivalBoss()");
  return g.run(`(()=>{const whale=fish[0];for(let i=0;i<1795&&!whale.dead;i++){if(${follow}&&i%24===0)aim={x:whale.x,y:whale.y};step(1/120,1/120);journey.run.total+=1/120;}return {caught:whale.dead,hp:whale.hp};})()`);
 };
 assert.equal(simulate(false).caught,false);
 assert.equal(simulate(true).caught,true);
});

test('Multiple aiming fingers release independently and pause clears all touches',()=>{
  const g=harness();g.click('start');
  const touch=id=>({pointerType:'touch',pointerId:id});
  g.pointer('pointerdown',250,180,touch(1));g.pointer('pointerdown',700,220,touch(2));
  g.pointer('pointermove',720,230,touch(2));near(g.run('aim.x'),250);
  g.pointer('pointerup',250,180,touch(1));g.pointer('lostpointercapture',250,180,touch(1));
  near(g.run('aim.x'),720);assert.equal(g.run('canvasPointers.size'),1);
  g.advance(.3);const before=g.state().shots;g.pointer('pointercancel',0,0,touch(99));g.advance(.3);
  assert(g.state().shots>before,'an unrelated cancellation does not release the active finger');
  g.click('pause');const pausedShots=g.state().shots;g.advance(.5);assert.equal(g.state().shots,pausedShots);g.click('resume');assert.equal(g.run('canvasPointers.size'),0);
  g.pointer('pointermove',800,200,touch(2));near(g.run('aim.x'),720);const released=g.state().shots;g.advance(.5);assert(g.state().shots>released);
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
  const g=harness();g.click('start');g.run("deploySkill('freeze',aim);deploySkill('bomb',aim);updateHud()");g.advance(2,15);
  g.click('pause');const paused=JSON.stringify(g.state());g.advance(20,15);assert.equal(JSON.stringify(g.state()),paused);
  g.click('help');g.advance(20,15);g.click('helpClose');assert.equal(g.state().mode,'paused');assert.equal(JSON.stringify(g.state()),paused);
  g.click('resume');const before=g.state().round;g.advance(1,15);near(g.state().round,before+1);
  assert(g.state().abilities.freeze.activeRemaining>0);assert(g.state().abilities.bomb.activeRemaining>0);
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

test('Idle fishing automatically targets schools with one skill every five seconds',()=>{
 const g=harness();g.click('start');
 g.run("Math.random=()=>.99;fish=[];shotClock=spawnClock=nextBossAt=999;for(const x of [205,235,250,730]){spawn('save',{x,y:250,speed:0});fish.at(-1).hp=fish.at(-1).maxHp=500;}aim={x:940,y:300}");
 g.advance(4.99);assert.equal(g.state().suppliesTriggered,0);
 g.advance(.01);assert.equal(g.state().suppliesTriggered,1);near(g.state().lastSupplyAt,5);assert(g.state().skillTargets.lure.x<300);
 g.advance(5);near(g.state().lastSupplyAt,10);assert(g.state().skillTargets.bomb);assert(g.run('fish.some(f=>f.hp<500)'));
 g.advance(5);near(g.state().lastSupplyAt,15);assert.equal(g.state().skillTargets.rapid.length,3);assert(g.state().scanPoints>0);
 g.advance(5);near(g.state().lastSupplyAt,20);assert(g.state().skillTargets.freeze);assert.equal(g.state().suppliesTriggered,4);
 assert.equal(g.state().caught,0);assert.equal(g.state().score,g.state().scanPoints);near(g.run('aim.x'),940);
 for(const id of ['freeze','rapid','bomb','lure'])assert(!html.includes('id="'+id+'"'));
});

test('Automatic supply clock pauses for breaks and quizzes and resets on replay',()=>{
 const g=harness();g.click('start');g.run('fish=[];shotClock=spawnClock=nextBossAt=999');
 g.advance(4.5);g.click('pause');g.advance(10);assert.equal(g.state().suppliesTriggered,0);
 g.click('resume');g.run("mode='upgrading'");g.advance(7);assert.equal(g.state().suppliesTriggered,0);
 g.run("mode='playing'");g.advance(.5);assert.equal(g.state().suppliesTriggered,1);
 g.run("start();fish=[];shotClock=spawnClock=nextBossAt=999");
 assert.equal(g.state().suppliesTriggered,0);assert.equal(g.state().scanPoints,0);
 g.advance(4.99);assert.equal(g.state().suppliesTriggered,0);
});

test('A net homes onto the densest live school rather than the cannon aim',()=>{
 const g=harness();g.click('start');
 g.run("supplyAge=-100;fish=[];for(const x of [200,215,230,700])spawn('coin',{x,y:250,dir:1,speed:20});aim={x:700,y:250};deploySkill('freeze',fish.at(-1));for(let i=0;i<120;i++)moveFish(1/120)");
 assert(g.state().skillTargets.freeze.x<300);near(g.run('fish[0].swimTime'),.18);near(g.run('fish[3].swimTime'),1);
 g.advance(4);assert.equal(g.state().abilities.freeze.activeRemaining,0);
});

test('An empty sea does not waste a net, sonar or mirror drop',()=>{
 const g=harness();g.click('start');g.run("fish=[];shotClock=spawnClock=nextBossAt=999;aim={x:150,y:160};deploySkill('freeze',aim);deploySkill('rapid',aim);deploySkill('bomb',aim);spawn('save',{x:600,y:240,speed:0});fish[0].hp=20;");
 g.advance(.2);const state=g.state();assert(!state.skillTargets.freeze.seeking);assert(state.skillTargets.freeze.x>590);
 assert.equal(state.skillTargets.rapid.length,1);assert(state.skillTargets.bomb.x>590);
 assert(g.run('fish[0].hp')<20);near(g.run('aim.x'),150);near(g.run('aim.y'),160);
});

test('Sonar favours valuable catches, marks up to three and applies a bounded score window',()=>{
 const g=harness();g.click('start');g.run("fish=[];for(const x of [200,210,220,230])spawn('coin',{x,y:220,speed:0});spawn('gold',{x:700,y:210,speed:0});deploySkill('rapid',fish[0]);");
 assert.equal(g.state().skillTargets.rapid.length,3);assert(g.run('fish.at(-1).tagged>0'));
 const initial=g.state().scanPoints;assert(initial>0);assert.equal(g.state().score,initial);
 g.run('capture(fish[0])');assert.equal(g.state().score,initial+15);
 g.run('moveFish(6.1);capture(fish[0])');assert.equal(g.state().score,initial+25);
 g.run("fish=fish.filter(f=>f.scanned&&!f.dead);deploySkill('rapid',aim);");
 assert.equal(g.state().scanPoints,initial,'the same fish cannot earn repeat sonar points');
});

test('A vortex positions itself on a live school and never drags a boss',()=>{
 const g=harness();g.click('start');
 g.run("fish=[];for(const [type,x] of [['save',250],['save',305],['save',310],['whale',255]])spawn(type,{x,y:210,speed:0});deploySkill('lure',{x:320,y:220});for(let i=0;i<120;i++)moveFish(1/120)");
 assert(g.run('fish[0].x>300'));near(g.run('fish[3].x'),255);assert.equal(g.state().caught,0);
});

test('Mirror fires along a two-leg reflected path without changing a player aiming away',()=>{
 const g=harness();g.click('start');
 g.run("fish=[];spawn('save',{x:700,y:240,speed:0});fish[0].hp=100;aim={x:100,y:300};angle=-2.4;beams=[];deploySkill('bomb',fish[0]);");
 const b=g.run('beams');assert.equal(b.length,2);near(b[0].ex,1000);near(b[1].x,b[0].ex);near(b[0].ey,b[1].y);near(b[1].ex,700);near(b[1].ey,240);
 assert(g.run('fish[0].hp<100'));near(g.run('angle'),-2.4);near(g.run('aim.x'),100);
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



test('Existing sound and best records survive the upgrade to endless mode',()=>{
  const saved=JSON.stringify({sound:false,best:{easy:120,normal:220,hard:320}});
  const g=harness(1000,600,{storage:{'fulam-catch-v1':saved}});
  assert.equal(g.el('best').textContent,'220');assert.equal(g.el('sound').attrs['aria-pressed'],'false');
  g.click('start');g.run("fish=[];spawn('coin',{x:300,y:250});capture(fish[0]);updateHud()");g.click('pause');g.click('finishSession');
  const next=JSON.parse(g.storage.get('fulam-catch-v1'));assert.equal(next.sound,false);assert.deepEqual(next.best,{easy:120,normal:220,hard:320});
});

test('Changing tabs pauses gameplay and does not spend buffs off-screen',()=>{
  const g=harness();g.click('start');g.run("deploySkill('freeze',aim);updateHud()");g.advance(1);g.doc.hidden=true;g.emit('document','visibilitychange');
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
  g.run("level=6;fish=[];bullets=[];beams=[];shotClock=3;spawnClock=999;nextBossAt=999;spawn('coin',{x:500,y:350,speed:0});spawn('coin',{x:500,y:240,speed:0});spawn('coin',{x:750,y:300,speed:0});for(const f of fish)f.hp=f.maxHp=1000;angle=-Math.PI/2;fire();");
  const after=clone(g.run('fish.map(f=>f.hp)'));assert.deepEqual(after,[974,974,1000]);
  assert.equal(g.run('bullets.length'),0);assert.equal(g.run('beams.length'),1);assert.equal(g.state().shots,1);
  g.click('pause');const beam=JSON.stringify(g.run('beams'));g.advance(2,15);assert.equal(JSON.stringify(g.run('beams')),beam,'beam animation pauses');
  g.click('resume');g.advance(.4);assert.equal(g.run('beams.length'),0);assert.deepEqual(clone(g.run('fish.map(f=>f.hp)')),after,'beam visual does not apply damage each frame');
});

for(const fps of [60,15])test(`Large orb pierces separate fish once and damages nearby fish with its blast at ${fps} fps`,()=>{
  const g=harness();g.click('start');
  g.run("level=5;fish=[];bullets=[];beams=[];shotClock=3;spawnClock=999;nextBossAt=999;spawn('coin',{x:500,y:350,speed:0,phase:0});spawn('coin',{x:500,y:220,speed:0,phase:0});spawn('coin',{x:565,y:375,speed:0,phase:0});spawn('coin',{x:800,y:350,speed:0,phase:0});for(const f of fish)f.hp=f.maxHp=1000;angle=-Math.PI/2;fire();");
  const bullet=g.run('bullets[0]');assert.equal(bullet.kind,'orb');assert(bullet.r>10);assert.equal(bullet.pierce,3);
  g.advance(.8,fps);const health=clone(g.run('fish.map(f=>f.hp)'));
  near(health[0],984);near(health[1],984);near(health[2],993);near(health[3],1000);
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

test('All fish have visible health and lose health before being captured',()=>{
  const g=harness();g.click('start');
  const types=clone(g.run('Object.keys(defs)'));assert.equal(types.length,13);
  for(const type of types){
    g.run(`fish=[];shotClock=3;spawnClock=999;nextBossAt=999;spawn(${JSON.stringify(type)},{x:w/2,y:h/2,speed:0,phase:0});`);
    const fresh=clone(g.run('fish[0]'));
    assert(Number.isInteger(fresh.hp)&&fresh.hp>1,`${type} takes multiple starter hits`);
    assert.equal(fresh.hp,fresh.maxHp);
    g.advance(1/60);assert(g.drawTexts().some(item=>item.text===`${fresh.hp}/${fresh.maxHp}`),'full health is displayed before the first hit');
    g.run('damage(fish[0],1)');const damaged=clone(g.run('fish[0]'));
    assert.equal(damaged.hp,fresh.hp-1);assert.equal(damaged.maxHp,fresh.maxHp);assert(!damaged.dead);
    g.advance(1/60);assert(g.drawTexts().some(item=>item.text===`${damaged.hp}/${fresh.maxHp}`),'damaged health label updates');
    const caughtBefore=g.state().caught;
    g.run('damage(fish[0],fish[0].hp*2)');assert.equal(g.state().caught,caughtBefore+1);
    g.run('damage(fish[0],99);capture(fish[0])');assert.equal(g.state().caught,caughtBefore+1,'capture is idempotent');
  }
});

for(const fps of [60,15])test(`All fish stay bounded through movement, freeze and pause at ${fps} fps`,()=>{
  const g=harness(390,530);g.click('start');
  g.run('fish=[];bullets=[];shotClock=spawnClock=nextBossAt=999;for(const type of Object.keys(defs)){spawn(type,{x:w/2,y:-999,dir:1,speed:10,phase:0});spawn(type,{x:w/2,y:9999,dir:-1,speed:10,phase:1});}');
  assert.equal(g.run('fish.length'),26);assert(g.run('new Set(Object.values(defs).map(d=>d.swim)).size')>=8,'different movement profiles');
  const verify=()=>{
    for(const f of g.run('fish')){
      for(const key of ['x','y','angle','hp','maxHp','swimTime'])assert(Number.isFinite(f[key]),`${f.type} ${key} finite`);
      const [lo,hi]=g.run(`swimBounds(${f.size})`);
      assert(f.y>=lo-.01&&f.y<=hi+.01,`${f.type} rendered center stays bounded`);
    }
  };
  for(let second=0;second<8;second++){g.advance(1,fps);verify();}
  const beforeFreeze=clone(g.run('fish.map(f=>f.swimTime)'));g.run("deploySkill('freeze',aim);updateHud()");g.advance(1,fps);verify();
  const afterFreeze=clone(g.run('fish.map(f=>f.swimTime)'));
  assert(afterFreeze.every((value,i)=>value>beforeFreeze[i]&&value-beforeFreeze[i]<=1.001),'fish clocks remain bounded inside and outside the net');
  g.click('pause');const paused=JSON.stringify(g.run('fish'));g.advance(5,fps);assert.equal(JSON.stringify(g.run('fish')),paused,'pause freezes full trajectory state');
  g.click('resume');g.advance(.5,fps);verify();
});

test('Low frame rates preserve swim speed and trajectory for all fish',()=>{
  const sample=fps=>{
    const g=harness();g.click('start');
    g.run('fish=[];bullets=[];shotClock=spawnClock=nextBossAt=999;for(const type of Object.keys(defs))spawn(type,{x:400,y:300,dir:1,speed:10,phase:0});');
    g.advance(3,fps);return clone(g.run('fish.map(f=>({type:f.type,x:f.x,y:f.y,swimTime:f.swimTime}))'));
  };
  const fast=sample(60),slow=sample(15);assert.equal(fast.length,13);assert.equal(slow.length,13);
  for(let i=0;i<fast.length;i++){assert.equal(slow[i].type,fast[i].type);near(slow[i].swimTime,fast[i].swimTime);near(slow[i].x,fast[i].x,.25);near(slow[i].y,fast[i].y,.25);}
});



test('Shark and whale armour takes longer to defeat early, and both patrol within phone width',()=>{
 const g=harness(390,600);g.click('start');g.installEvolution();
 for(const type of ['shark','whale']){
  const times=[];
  for(let wave=1;wave<=4;wave++){
   g.run(`journey={run:{random:()=>.5,wave:${wave},weapon:${wave-1},rate:0,trajectory:${wave-1},scene:'booth'},text:zh=>zh,name:()=>'QA'};fish=[];spawn('${type}',{x:195,y:250});`);
   const p=g.run('currentCannon()');const initial=g.run('fish[0].hp');g.run('damage(fish[0],10)');
   near(initial-g.run('fish[0].hp'),wave<3?5:10);
   const multiplier=p.spread.reduce((sum,offset)=>sum+(p.count===2?.65:offset===0?1:.55),0);
   times.push(initial/(p.damage*multiplier/p.interval*(wave<3?.5:1)));
   for(let i=0;i<1200;i++)g.run('moveFish(1/60)');
   assert.equal(g.run('fish.length'),1);assert(g.run('fish[0].x>0&&fish[0].x<w'));
  }
  assert(times[0]>5&&times[1]>2,`${type} early: ${times}`);
  assert(times[2]<times[1]&&times[3]<times[2],`${type} gets approachable: ${times}`);
  assert(times[2]<6&&times[3]>.55&&times[3]<5,`${type} late fights fit a round with sustained aim: ${times}`);
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

for(const width of [390,1000])test(`Round-four explosion adds 15% damage inside its 30% smaller radius at ${width}px`,()=>{
 const g=harness(width,600);g.click('start');g.installEvolution();
 g.run("journey={run:{random:()=>.5,wave:4,weapon:3,rate:0,trajectory:3,scene:'booth'},best:()=>0,text:zh=>zh,name:()=>'QA',step:()=>{}};fish=[];bullets=[];rings=[];hudClock=100;shotClock=3;spawnClock=100;nextBossAt=Infinity;angle=-Math.PI/2;aim={x:w/2,y:250};fire();");
 const previousRadius=width<600?126:168, expectedRadius=previousRadius*.70;
 const previousDamage=g.run("FuLamJourney.weaponProfile('fishing',journey.run).damage")*.8*1.15;
 const expectedDamage=previousDamage*1.15;
 // Follow the centre shell of the actual volley so neighbouring pellets cannot double-count the splash.
 g.run(`bullets=bullets.filter(b=>Math.abs(b.vx)<.001);for(const dx of [0,${expectedRadius-4},${expectedRadius+24}]){spawn('coin',{x:bullets[0].x+dx,y:250,speed:0});const f=fish.at(-1);f.hp=f.maxHp=1000;f.phase=0;}`);
 assert.equal(g.run('bullets.length'),1);near(g.run('bullets[0].damage'),expectedDamage);near(g.run('bullets[0].blast'),expectedRadius);
 g.advance(.55);
 const hp=g.run('fish.map(f=>f.hp)');near(hp[0],1000-Math.round(expectedDamage));near(hp[1],1000-Math.round(expectedDamage*.6));near(hp[2],1000);
 const actual=g.run('fish.map(f=>1000-f.hp+f.damageCarry)');near(actual[0],expectedDamage);near(actual[1],expectedDamage*.6);near(actual[2],0);
 const blast=g.run('rings.find(r=>r.blast)');assert(blast);near(blast.end,expectedRadius);
 const outside=g.run('fish[2]');
 assert(Math.hypot(outside.x-blast.x,outside.y-blast.y)<previousRadius,'the previous blast would have reached the unharmed fish');
 g.advance(.2);near(g.run('fish[1].hp'),hp[1]);
});

// Rendering, sound output, and touch interaction are additionally checked in-browser.

test('All ordinary fish receive the ten-percent reduction after device scaling',()=>{
 for(const [width,height] of [[390,844],[844,390]]){
  const desktop=harness(width,height),phone=harness(width,height,{touch:true});
  for(const g of [desktop,phone])g.run("fish=[];spawn('whale',{x:200,y:200,speed:0});spawn('fund',{x:200,y:200,speed:0})");
  for(let i=0;i<2;i++){const a=desktop.run(`fish[${i}]`),b=phone.run(`fish[${i}]`),previousDesktop=Math.round((i===0?34:9)*1.15);near(b.size,a.size*.9);assert.equal(a.maxHp,Math.round(Math.ceil(previousDesktop*1.15)*.9));assert.equal(b.maxHp,Math.round(Math.ceil(Math.ceil(previousDesktop*1.1)*1.15)*.9));}
 }
});

test('Catches can guide scheduled supplies and leave the five-second interval intact',()=>{
 const g=harness();g.click('start');
 g.run("Math.random=()=>.99;fish=[];shotClock=spawnClock=nextBossAt=999");
 const capture=type=>g.run(`spawn('${type}',{x:250,y:240,speed:0});capture(fish.at(-1));`);
 g.advance(1);capture('whale');assert.equal(g.state().suppliesTriggered,0);
 g.advance(3.99);capture('puffer');assert.equal(g.state().suppliesTriggered,0);
 g.advance(.01);assert.equal(g.state().suppliesTriggered,1);assert(g.state().abilities.freeze.activeRemaining>0);
 g.advance(4.99);capture('lantern');assert.equal(g.state().suppliesTriggered,1);
 g.advance(.01);assert.equal(g.state().suppliesTriggered,2);assert(g.state().abilities.lure.activeRemaining>0);
 capture('whale');assert.equal(g.state().suppliesTriggered,2);
});

test('Every late-stage ordinary fish withstands a full upgraded volley on desktop and touch',()=>{
 for(const touch of [false,true]){
  const g=harness(390,690,{touch});g.click('start');g.installEvolution();
  for(const wave of [2,3,4]){
   g.run(`difficulty='booth';journey={run:{random:()=>.5,wave:${wave},weapon:${wave-1},trajectory:${wave-1},scene:'booth'},text:zh=>zh};fish=[];for(const type of Object.keys(defs).filter(k=>!defs[k].boss))spawn(type,{x:100,y:200});`);
   const p=g.run('currentCannon()');
   const volley=p.spread.reduce((total,offset)=>total+p.damage*(offset===0?1:.55),0);
   assert(g.run('fish.every(f=>f.hp>'+volley+')'),'survives all pellets of one volley');
   near(p.interval,.22/1.5);near(p.damage,.8*(wave===4?1.15**2:1)*g.run("FuLamJourney.weaponProfile('fishing',journey.run).damage"));
  }
 }
});

test('Fishing rounds two through four add one health increase to ordinary, elite and boss fish',()=>{
 for(const touch of [false,true]){
  const g=harness(390,700,{touch});g.click('start');g.installEvolution();
  function stats(scene,wave){
   return clone(g.run(`(()=>{
    difficulty='booth';journey={run:{scene:'${scene}',wave:${wave},weapon:${wave-1},random:()=>.5},text:zh=>zh,name:()=>'QA'};
    fish=[];fishSerial=0;
    for(const type of ['coin','fund','stock','bond','shark','whale'])spawn(type,{x:200,y:200});
    return {hp:fish.map(f=>f.maxHp),elite:fish[3].elite,damage:currentCannon().damage,interval:currentCannon().interval};
   })()`));
  }
  for(const wave of [1,2,3,4]){
   const previous=stats('web',wave),booth=stats('booth',wave);
   assert.equal(booth.elite,wave>=3);
   assert.deepEqual(booth.hp,previous.hp.map(hp=>wave===1?hp:Math.round(hp*1.15)));
   near(booth.damage,previous.damage*(wave===1?1:.8)*(wave===4?1.15**2:1));
   near(booth.interval,previous.interval);
  }
 }
});

test('Later booth waves put six fish into play per five normal arrivals, counting singles and whole schools',()=>{
 for(const width of [390,1000]){
  const g=harness(width,700);g.click('start');g.installEvolution();
  for(const chance of [.1,.9]){
   const perWave=chance<.24?(width<600?4:6):1;
   for(const [scene,wave,boost] of [['booth',1,false],['booth',2,true],['booth',3,true],['booth',4,true],['web',4,false]]){
    const actual=g.run(`(()=>{
     difficulty='booth';journey={run:{scene:'${scene}',wave:${wave},weapon:0,phase:'play',total:0,random:()=>${chance}},text:zh=>zh,name:()=>'QA'};
     fish=[];reinforcementCredit=0;shotClock=nextBossAt=hudClock=999;
     const start=fishSerial;
     for(let i=0;i<10;i++){fish=[];spawnClock=0;step(.01);}
     return fishSerial-start;
    })()`);
    assert.equal(actual,perWave*(boost?12:10),`${scene} R${wave} at ${width}px`);
    assert.equal(g.run('fishLimit()'),Math.round((width<600?18:28)*(boost?1.2:1)));
   }
  }
 }
});

test('The faster booth cannon earns early and late catches sooner in active simulation',()=>{
 function timeToCatch(wave,type,useOldPower){
  const g=harness(390,700,{touch:true});g.click('start');g.installEvolution();
  return g.run(`(()=>{
   difficulty='booth';journey={run:{wave:${wave},weapon:${wave-1},trajectory:${wave-1},scene:'booth',phase:'play',total:0,random:()=>.9},text:zh=>zh,name:()=>'QA'};
   if(${useOldPower}){
    const boosted=currentCannon;
    currentCannon=()=>{const c=boosted();return {...c,damage:c.damage/1.42,interval:c.interval*1.5}};
   }
   fish=[];bullets=[];shotClock=0;spawnClock=nextBossAt=hudClock=999;
   spawn('${type}',{x:w/2,y:h*.54,speed:0,phase:0});
   const target=fish[0];
   for(let frame=0;frame<1800&&!target.dead;frame++){aim={x:target.x,y:target.y};step(1/120);}
   if(!target.dead)throw Error('No catch');
   return round;
  })()`);
 }
 for(const [wave,type] of [[1,'save'],[3,'stock'],[4,'whale']]){
  const oldTime=timeToCatch(wave,type,true),newTime=timeToCatch(wave,type,false);
  assert(newTime<oldTime*.8,`R${wave} ${type}: ${newTime.toFixed(2)}s vs ${oldTime.toFixed(2)}s`);
 }
});

test('Armour and weak splash accumulate fractional damage while every displayed health value stays whole',()=>{
 const g=harness();g.click('start');g.run("fish=[];spawn('save',{x:250,y:220,speed:0});fish[0].hp=fish[0].maxHp=100;fish[0].armored=true;");
 for(let i=1;i<=80;i++){
  g.run("damage(fish[0],.17,'splash')");
  assert.equal(g.run('fish[0].hp'),100-Math.round(i*.17*.5));
 }
 g.run("shotClock=spawnClock=nextBossAt=999");g.advance(1/60);
 assert(g.drawTexts().some(entry=>entry.text==='93/100'));
});

test('Puffers inflate on hit, resist the next strike and soften again within a second',()=>{
 const g=harness();g.click('start');
 g.run("fish=[];spawn('puffer',{x:300,y:250,speed:0});fish[0].hp=100;damage(fish[0],10);moveFish(.2)");
 const puffer=()=>g.run('fish[0]');
 assert.equal(puffer().hp,90);assert.equal(puffer().puff,1);
 g.run('damage(fish[0],10)');near(puffer().hp,84);
 g.run('moveFish(1.05);damage(fish[0],10)');near(puffer().hp,74);
 assert.equal(puffer().puff,0);
});

test('The lit angler lure attracts small fish locally but does not steer larger animals',()=>{
 const g=harness();g.click('start');
 g.run("fish=[];spawn('lantern',{x:370,y:300,speed:0,phase:1.6});spawn('coin',{x:300,y:250,dir:-1,speed:12,phase:0});spawn('bond',{x:300,y:225,dir:-1,speed:12,phase:0});moveFish(.05)");
 assert.equal(g.run('fish[0].luring'),true);
 assert.equal(g.run('fish[1].dir'),1);
 assert(g.run('fish[1].baseY')>250);
 assert.equal(g.run('fish[2].dir'),-1);near(g.run('fish[2].baseY'),225);
});
