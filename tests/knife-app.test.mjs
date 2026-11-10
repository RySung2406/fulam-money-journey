// Exercise the shipped app's public handlers with a deterministic clock and
// lightweight DOM. No mutation hooks or QA code are injected into the game.
import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import { readFileSync } from 'node:fs';

const sources = ['engine.js', 'questions.js', 'app.js'].map(file => readFileSync(new URL('../site/game/' + file, import.meta.url), 'utf8'));
function harness({width = 1000, height = 600, storageThrows = false, initialStorage = {}} = {}) {
  const landscape = width > height && height <= 500;
  const shortPhone = width <= 650 && height <= 650;
  // Model the final responsive CSS: labels have their own geometry, not the
  // generic full-arena height returned for unrelated DOM nodes.
  const bagWidth = landscape || shortPhone ? 150 : width <= 650 ? Math.max(150,Math.min(175,width*.44)) : 180;
  const bagHeight = landscape ? 130 : shortPhone ? 150 : bagWidth*.75+84;
  const labelTop = landscape ? 54 : shortPhone ? 74 : bagWidth*.75;
  const labelHeight = landscape || shortPhone ? 54 : width <= 650 ? 62 : 66;
  const questionBottom = landscape ? 92 : width <= 650 ? 190 : 170;
  const hudTop = height - (landscape ? 83 : width <= 650 ? 139 : 150);
  let now = 0, seed = 65537, serial = 0;
  const nodes = new Map(), elements = [], raf = new Map(), timers = new Map();
  const winEvents = {}, docEvents = {}, storage = new Map(Object.entries({'fulam-sound': 'false', ...initialStorage}));
  const no = () => {};
  const context2d = new Proxy({}, {get: (o,k) => o[k] ?? no, set: (o,k,v) => (o[k]=v, true)});
  const math = Object.create(Math);
  math.random = () => { seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0; return seed / 4294967296; };
  const camel = s => s.replace(/-([a-z])/g, (_, c) => c.toUpperCase());
  class Element {
    constructor(tag = 'div') {
      this.tagName=tag.toUpperCase();this.dataset={};this.attrs={};this.children=[];this.events={};
      this.style={setProperty:(key,value)=>{this.style[key]=value;}};this.disabled=false;this.hidden=false;this.open=false;this.connected=true;this.textContent='';this.className='';
      const classes=new Set();
      this.classList={add:(...xs)=>xs.forEach(x=>classes.add(x)),remove:(...xs)=>xs.forEach(x=>classes.delete(x)),contains:x=>classes.has(x),toggle:(x,on)=>{const next=on===undefined?!classes.has(x):on;next?classes.add(x):classes.delete(x);return next;}};
      elements.push(this);
    }
    set innerHTML(html) {
      this._html=html;this.children.forEach(child=>child.remove());this.children=[];
      for(const match of html.matchAll(/<([a-z][\w-]*)\b([^>]*)>/gi)) {
        const child=new Element(match[1]),attrs=match[2];
        for(const attr of attrs.matchAll(/([\w-]+)="([^"]*)"/g)) child.setAttribute(attr[1],attr[2]);
        child.disabled=/\sdisabled(?:\s|$)/.test(attrs);child.hidden=/\shidden(?:\s|$)/.test(attrs);
        this.children.push(child);child.parent=this;
      }
    }
    get innerHTML(){return this._html||'';}
    get offsetWidth(){return this.className.includes('target') || this.className==='option-label' ? bagWidth : width;}
    get offsetTop(){return this.className==='option-label' ? labelTop : 0;}
    get offsetHeight(){return this.className==='option-label' ? labelHeight : this.className.includes('target') ? bagHeight : height;}
    setAttribute(key,value) {
      this.attrs[key]=String(value);
      if(key==='id'){this.id=value;nodes.set(value,this);}
      if(key==='class')this.className=value;
      if(key.startsWith('data-'))this.dataset[camel(key.slice(5))]=value;
    }
    getAttribute(key){return this.attrs[key]??null;}
    matches(selector) {
      if(selector[0]==='#')return this.id===selector.slice(1);
      if(selector[0]==='.')return this.className.split(/\s+/).includes(selector.slice(1));
      const attr=selector.match(/^\[data-([\w-]+)(?:="([^"]+)")?\]$/);
      if(attr)return camel(attr[1]) in this.dataset && (attr[2]===undefined||this.dataset[camel(attr[1])]===attr[2]);
      return false;
    }
    querySelectorAll(selector){return this.children.flatMap(child=>[child,...child.querySelectorAll(selector)]).filter(child=>child.connected&&child.matches(selector));}
    querySelector(selector){return this.querySelectorAll(selector)[0]||null;}
    append(child){this.children.push(child);child.parent=this;child.connected=true;}
    remove(){this.connected=false;this.children.forEach(child=>child.remove());if(this.id&&nodes.get(this.id)===this)nodes.delete(this.id);if(this.parent)this.parent.children=this.parent.children.filter(child=>child!==this);}
    addEventListener(type,listener,options={}){(this.events[type]??=[]).push({listener,signal:options.signal});}
    dispatch(type,event={}){for(const handler of this.events[type]||[])if(!handler.signal?.aborted)handler.listener({type,preventDefault:no,...event});}
    click(){if(this.disabled)return;this.onclick?.({detail:0,preventDefault:no});this.dispatch('click',{detail:0});}
    getContext(){return context2d;}
    getBoundingClientRect(){
      // Immersive play overlays the question at the top and the HUD near the
      // bottom of the full-height arena. Non-game nodes need no layout model.
      const top=this.className==='question-bar'?(landscape?46:60):this.className==='game-hud'?hudTop:0;
      const bottom=this.className==='question-bar'?questionBottom:this.className==='game-hud'?height-(landscape?43:65):height;
      return {left:0,top,right:width,bottom,width,height:bottom-top};
    }
    showModal(){this.open=true;}
    close(){this.open=false;this.dispatch('close');}
    scrollIntoView(){}
    setPointerCapture(){}
    hasPointerCapture(){return false;}
  }
  for(const id of ['app','modal','modal-content','sound-toggle','fullscreen','about-button','brand-home','announcer']){const e=new Element();e.setAttribute('id',id);}
  const document={
    querySelector:selector=>selector[0]==='#'?nodes.get(selector.slice(1))||null:elements.find(e=>e.connected&&e.matches(selector))||null,
    createElement:tag=>new Element(tag),body:new Element('body'),documentElement:new Element('html'),hidden:false,
    addEventListener(type,fn){(docEvents[type]??=[]).push(fn);}
  };
  const sandbox={document,Math:math,console,AbortController,devicePixelRatio:1,innerWidth:width,innerHeight:height,
    performance:{now:()=>now},matchMedia:()=>({matches:true}),scrollTo:no,
    MoneyEffects:class{clear(){}draw(){}burst(){}bump(){}tickShake(){return 0;}},CoinAudio:class{play(){}},
    localStorage:{getItem:key=>storage.get(key)??null,setItem:(key,value)=>{if(storageThrows)throw new Error('Storage unavailable');storage.set(key,value);}},
    requestAnimationFrame:fn=>{const id=++serial;raf.set(id,fn);return id;},cancelAnimationFrame:id=>raf.delete(id),
    setTimeout:(fn,ms)=>{const id=++serial;timers.set(id,{fn,at:now+ms});return id;},clearTimeout:id=>timers.delete(id),
    addEventListener:(type,fn)=>{(winEvents[type]??=[]).push(fn);},navigator:{clipboard:{writeText:async()=>{}}}
  };
  sandbox.window=sandbox;vm.createContext(sandbox);sources.forEach(source=>vm.runInContext(source,sandbox));sandbox.startMoneyGame();
  const state=()=>sandbox.FuLamSlice.getState();
  const frame=ms=>{
    now+=ms;
    const calls=[...raf.entries()];raf.clear();for(const [,fn] of calls)fn(now);
    for(const [id,timer] of [...timers])if(timer.at<=now){timers.delete(id);timer.fn();}
    const s=state();assert(s.scheduled.length<=s.cap,'airborne plus pending bags stay bounded');
    for(const bag of s.active){
      assert(bag.labelTop>=questionBottom+20,'interactive label clears the question overlay');
      assert(bag.labelBottom<=hudTop-8,'interactive label clears the HUD');
      assert(bag.labelBottom>bag.labelTop,'interactive label has measurable height');
    }
  };
  const advance=(seconds,fps=60)=>{let left=seconds*1000;while(left>1e-7){const step=Math.min(left,1000/fps);frame(step);left-=step;}};
  const click=selector=>{const e=document.querySelector(selector);assert(e,'button '+selector+' exists');assert(!e.disabled,'button '+selector+' is enabled');e.click();};
  const start=(kind='practice',topic='tools',difficulty='easy')=>{click(`[data-play-kind="${kind}"]`);click(`[data-mode="${difficulty}"]`);click(`[data-topic="${topic}"]`);click('#ready-button');};
  const slice=id=>{const e=elements.find(e=>e.connected&&e.dataset.instanceId===id);assert(e,'active bag element exists');assert(!e.disabled,'active bag enabled');e.click();};
  const emit=(scope,type,event={})=>{for(const fn of (scope==='window'?winEvents:docEvents)[type]||[])fn(event);};
  return {state,advance,frame,click,start,slice,storage,document,emit,rafCount:()=>raf.size,timerCount:()=>timers.size};
}

const near=(actual,expected)=>assert(Math.abs(actual-expected)<1e-6,`${actual} != ${expected}`);
test('new bags arrive while earlier bags are still in flight',()=>{
  const game=harness();game.start();
  const original=game.state().scheduled.map(bag=>bag.id);
  game.advance(2);
  const later=game.state();near(later.elapsed,2);assert.equal(later.phase,'playing');
  assert(later.scheduled.some(bag=>original.includes(bag.id)),'first flight continues');
  assert(later.scheduled.some(bag=>!original.includes(bag.id)),'new flight overlaps it');
  assert(later.scheduled.some(bag=>bag.bornAt>0),'spawn time does not reset elapsed time');
});

for(const fps of [60,15])test(`endless practice runs for five minutes at ${fps} fps without rounds or clock drift`,()=>{
  const game=harness({width:390});game.start();game.advance(300,fps);
  const state=game.state();assert.equal(state.phase,'playing');near(state.elapsed,300);
  assert(state.spawned>100);assert.equal(state.reviewOptionCount,25);assert(state.timerCount<20);
  game.click('#finish-session');assert.equal(game.state().phase,'results');assert.equal(game.rafCount(),0);
  assert.equal([...game.storage.keys()].filter(key=>key.includes('best-')).length,0,'practice never creates a sprint record');
});

test('pause and backgrounding freeze bags and elapsed time until resumed',()=>{
  const game=harness();game.start();game.advance(2);game.click('#pause-game');
  const frozen=JSON.stringify(game.state());game.advance(15);assert.equal(JSON.stringify(game.state()),frozen);
  game.click('#resume');game.advance(1);near(game.state().elapsed,3);
  game.document.hidden=true;game.emit('document','visibilitychange');game.advance(10);near(game.state().elapsed,3);
  game.document.hidden=false;game.emit('document','visibilitychange');game.click('#resume');game.advance(1);near(game.state().elapsed,4);
});

function completeSprint(game) {
  let wrongSliced=false;
  for(let i=0;i<2000&&game.state().phase==='playing';i++) {
    game.advance(.1);
    const active=game.state().active;
    for(const bag of active) {
      if(game.state().phase!=='playing')break;
      if(bag.option.good)game.slice(bag.id);
      else if(!wrongSliced){game.slice(bag.id);wrongSliced=true;}
    }
  }
  const state=game.state();assert.equal(state.phase,'results');assert.equal(state.correct,20);assert.equal(state.wrong,1);
  assert.equal(state.finalTimeMs,Math.ceil((state.elapsed+3)*1000));assert.equal(game.rafCount(),0);
  return state;
}

test('a completed sprint stores its best, while a slower or unfinished run cannot replace it',()=>{
  const key='fulam-best-continuous-v1-tools-easy';
  const game=harness();game.start('sprint');const first=completeSprint(game);
  assert.equal(JSON.parse(game.storage.get(key)).timeMs,first.finalTimeMs);
  game.click('#replay');game.click('#ready-button');game.advance(1);game.click('#finish-session');
  assert.equal(JSON.parse(game.storage.get(key)).timeMs,first.finalTimeMs,'unfinished sprint preserves best');
  game.storage.set(key,JSON.stringify({timeMs:1,wrong:0,score:2000}));
  game.click('#replay');game.click('#ready-button');completeSprint(game);
  assert.equal(JSON.parse(game.storage.get(key)).timeMs,1,'slower completed sprint preserves best');
});

test('sprint completion remains playable when local storage is blocked',()=>{
  const game=harness({storageThrows:true});game.start('sprint','insurance','hard');completeSprint(game);
  assert.equal([...game.storage.keys()].filter(key=>key.includes('best-')).length,0);
});

for (const [width,height] of [[320,568],[390,844],[844,390],[740,320]]) {
  test(`large labels become cuttable without crossing overlays at ${width}x${height}`,()=>{
    const game=harness({width,height});game.start('practice','borrowing','hard');
    const launched=new Map(), readable=new Set();
    for(let frame=0;frame<450;frame++){
      game.frame(1000/15);
      const state=game.state();
      state.scheduled.forEach(bag=>launched.set(bag.id,bag));
      state.active.forEach(bag=>readable.add(bag.id));
    }
    const elapsed=game.state().elapsed;
    const expired=[...launched.values()].filter(bag=>bag.bornAt+bag.launch.delay+bag.launch.duration<elapsed);
    assert(expired.length>8,'the short screen was exercised across repeated flights');
    for(const bag of expired)assert(readable.has(bag.id),`answer ${bag.id} has a visible, cuttable interval even at 15 fps`);
  });
}
