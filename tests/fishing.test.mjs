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
assert(source, 'Shipped fishing game script is present');
assert(formations, 'Shipped fish formation script is present');
assert(!html.includes('window.__qa'), 'Test setup access is never shipped');
const injectionPoint = '\nresize();syncSound();showWelcome();requestAnimationFrame(loop);';
assert(source.includes(injectionPoint), 'Game initialization marker is present');
const instrumented = source.replace(injectionPoint, '\nwindow.__qa={run:code=>eval(code)};' + injectionPoint);
function harness(width = 1000, height = 600, options = {}) {
  let now = 1, raf = [], writes = 0, rng = 165706;
  const nodes = new Map(), storage = new Map(Object.entries(options.storage || {}));
  const winHandlers = {}, docHandlers = {}, accessedIds = new Set();
  const no = () => {};
  const ctx = new Proxy({}, {get: (o,k) => k in o ? o[k] : no, set: (o,k,v) => (o[k]=v, true)});
  const math = Object.create(Math);
  math.random = () => { rng = (rng * 1664525 + 1013904223) >>> 0; return rng / 4294967296; };
  let doc;
  class Element {
    constructor(id, tag = 'BUTTON') {
      this.id=id; this.tagName=tag; this.dataset={}; this.style={}; this.hidden=false; this.disabled=false;
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
  const sandbox={document:doc,devicePixelRatio:1,Math:math,console,UPSTREAM_LICENSE:'MIT QA fixture',ResizeObserver:class{constructor(cb){this.cb=cb;}observe(){}},localStorage:{getItem:k=>storage.get(k)??null,setItem:(k,v)=>{if(options.storageThrows)throw new Error('Storage blocked');storage.set(k,v);writes++;}},setTimeout:()=>1,clearTimeout:no,requestAnimationFrame:cb=>raf.push(cb),matchMedia:()=>({matches:false}),FuLamArt:{drawBackground:no,drawFish:no,drawCannon:no,drawCoin:no},addEventListener(k,v){(winHandlers[k]??=[]).push(v);}};
  sandbox.window=sandbox;vm.createContext(sandbox);
  vm.runInContext(formations,sandbox);
  vm.runInContext(instrumented,sandbox);
  const frame=ms=>{now+=ms;const calls=raf;raf=[];for(const cb of calls)cb(now);};
  frame(1);
  const advance=(seconds,fps=60)=>{let left=seconds*1000;while(left>1e-7){const ms=Math.min(left,1000/fps);frame(ms);left-=ms;}};
  const click=id=>{const e=el(id);assert(!e.disabled,id+' is enabled');assert.equal(typeof e.onclick,'function',id+' has UI handler');e.onclick({preventDefault:no});};
  const pointer=(type,x,y)=>{for(const fn of el('game').events[type]||[])fn({clientX:x,clientY:y,pointerType:'mouse',pointerId:1,button:0,preventDefault:no});};
  const emit=(scope,type,event={})=>{for(const fn of (scope==='window'?winHandlers:docHandlers)[type]||[])fn({preventDefault:no,...event});};
  return {state:()=>sandbox.FuLamGame.getState(),run:code=>sandbox.__qa.run(code),click,advance,pointer,storage,el,doc,accessedIds,writes:()=>writes,emit,resize:(nextWidth,nextHeight)=>{width=nextWidth;height=nextHeight;sandbox.__qa.run('resize()');}};
}
const near=(a,b,tol=.0001)=>assert(Math.abs(a-b)<tol,`${a} != ${b}`);
const clone = value => JSON.parse(JSON.stringify(value));

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
  const g=harness();g.click('start');g.run('level=9;updateHud()');g.click('freeze');g.click('rapid');g.click('double');g.click('net');g.advance(2,15);
  g.click('pause');const paused=JSON.stringify(g.state());g.advance(20,15);assert.equal(JSON.stringify(g.state()),paused);
  g.click('help');g.advance(20,15);g.click('helpClose');assert.equal(g.state().mode,'paused');assert.equal(JSON.stringify(g.state()),paused);
  g.click('resume');const before=g.state().round;g.advance(1,15);near(g.state().round,before+1);
  assert(g.run('freezeTime')>0);assert(g.run('rapidTime')>0);assert(g.run('doubleTime')>0);
});

test('All 12 cannon levels purchase once and increase usable firepower',()=>{
  const g=harness();g.click('start');const table=clone(g.run('cannons'));assert.equal(table.length,12);
  let previousDps=0;
  for(let current=1;current<=12;current++){
    assert.equal(g.state().level,current);g.run('bullets=[];fire()');
    const bullets=g.run('bullets');assert(bullets.length>=1&&bullets.length<=8);
    assert(bullets.every(b=>Number.isFinite(b.vx)&&Number.isFinite(b.vy)&&b.damage>0));
    const cannon=table[current-1],dps=cannon.damage*bullets.length/cannon.interval;
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
  const g=harness();g.click('start');const skills=[['rapid',3,'useRapid()'],['double',5,'useDouble()'],['bomb',7,'useBomb()'],['lure',9,'useLure()']];
  for(const [id,unlock,call]of skills){g.run(`level=${unlock-1};updateHud()`);assert(g.el(id).disabled,id+' is locked');const before=JSON.stringify(g.state());g.run(call);assert.equal(JSON.stringify(g.state()),before,id+' rejects locked invocation');g.run(`level=${unlock};updateHud()`);assert(!g.el(id).disabled,id+' unlocks');}
});

test('Net captures within its area while distant fish survive',()=>{
  const g=harness();g.click('start');g.run("fish=[];aim={x:250,y:250};spawn('coin',{x:250,y:250});spawn('coin',{x:800,y:250});");g.click('net');
  assert.equal(g.state().caught,1);assert(g.run('fish.some(f=>!f.dead&&f.x===800)'));assert(g.el('net').disabled);
  const before=g.state().score;g.run('useNet()');assert.equal(g.state().score,before);g.advance(17);assert(!g.el('net').disabled);
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

test('Double coins affects capture income without charging total score on upgrades',()=>{
  const g=harness();g.click('start');g.run('level=5;fish=[];updateHud()');g.click('double');g.run("spawn('coin',{x:300,y:250});capture(fish[0]);updateHud()");
  assert.equal(g.state().score,20);assert.equal(g.state().wallet,20);assert.equal(g.state().caught,1);
  g.advance(10);near(g.run('doubleTime'),0);g.run("fish=[];spawn('coin',{x:300,y:250});capture(fish[0]);updateHud()");assert.equal(g.state().score,30);
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

test('Keyboard 1–6 trigger the six corresponding skills',()=>{
  const g=harness();g.click('start');g.run('level=12;updateHud()');
  for(const key of ['1','2','3','4','5','6'])g.emit('window','keydown',{key,repeat:false});
  for(const id of ['net','freeze','rapid','double','bomb','lure'])assert(g.run(`${id}Cooldown`)>0,id+' responds to key');
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

// Rendering, sound output, and touch interaction are additionally checked in-browser.
