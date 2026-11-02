import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

function setup() {
 const buttons=[],listeners={};
 class Element {
  constructor(type='div'){this.nodeType=1;this.type=type;this.childNodes=[];this.attributes={};this.parentElement=null;this._text='';}
  append(child){child.parentElement=this;this.childNodes.push(child);return child;}
  closest(selector){if(selector==='.language-switch'&&this.type==='language-switch')return this;if(selector==='script,style,svg,.language-switch'&&this.type==='language-switch')return this;return this.parentElement?.closest(selector)||null;}
  matches(selector){return selector==='script,style,svg,.language-switch'&&this.type==='language-switch';}
  hasAttribute(name){return Object.hasOwn(this.attributes,name)}
  getAttribute(name){return this.attributes[name]??null}
  setAttribute(name,value){this.attributes[name]=value}
  get textContent(){return this._text} set textContent(value){this._text=value}
 }
 class Text {constructor(value){this.nodeType=3;this.nodeValue=value;this.parentElement=null}}
 const body=new Element(), heading=body.append(new Element()), text=heading.append(new Text('PICK YOUR TOPIC'));
 const answer=body.append(new Element()).append(new Text('Stocks'));
 const button=body.append(new Element('language-switch'));buttons.push(button);
 const store=new Map(),document={body,documentElement:{},title:'',querySelectorAll:s=>s==='.language-switch'?buttons:[],addEventListener:(name,fn)=>{listeners[name]=fn}};
 const localStorage={getItem:key=>store.get(key)??null,setItem:(key,value)=>store.set(key,value)};
 let observer;
 class MutationObserver {constructor(fn){observer=fn}observe(){}}
 const window={addEventListener(){}};
 const context=vm.createContext({window,document,localStorage,MutationObserver});
 vm.runInContext(fs.readFileSync(new URL('../site/game/questions.js',import.meta.url),'utf8'),context);
 vm.runInContext(fs.readFileSync(new URL('../site/game/i18n.js',import.meta.url),'utf8'),context);
 return {text,answer,button,store,document,window,click:()=>listeners.click({target:button}),appendAnswer:value=>{const node=body.append(new Element()).append(new Text(value));observer([{type:'childList',addedNodes:[node]}]);return node;}};
}
test('one-slice changes languages live and keeps new answers in selected language',()=>{
 const t=setup();assert.equal(t.text.nodeValue,'選擇主題');assert.equal(t.answer.nodeValue,'股票');assert.equal(t.button.textContent,'English');
 t.click();assert.equal(t.store.get('fulam-language'),'en');assert.equal(t.text.nodeValue,'PICK YOUR TOPIC');assert.equal(t.answer.nodeValue,'Stocks');
 const next=t.appendAnswer('Bonds');assert.equal(next.nodeValue,'Bonds');t.click();assert.equal(t.store.get('fulam-language'),'zh-Hant');assert.equal(next.nodeValue,'債券');assert.equal(t.button.textContent,'English');
});
