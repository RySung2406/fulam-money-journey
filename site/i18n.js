'use strict';
// A shared language preference follows visitors across the public website and games.
(function(){
 const key='fulam-language', dict=new Map(), patterns=[];
 const nodes=new WeakMap(), attrs=new WeakMap();
 let language='zh-Hant', toggle;
 try {language=localStorage.getItem(key)==='en'?'en':'zh-Hant';} catch {}
 const translate=s=>{if(language!=='en')return s;const lead=s.match(/^\s*/)[0],tail=s.match(/\s*$/)[0],core=s.trim();if(!core)return s;let value=dict.get(core);if(value===undefined){for(const [regex,replacement] of patterns){regex.lastIndex=0;if(regex.test(core)){regex.lastIndex=0;value=core.replace(regex,replacement);break}}}return value===undefined?s:lead+value+tail};
 function textNode(node,external=false){
  if(node.parentElement?.closest('[data-no-i18n]') || ['SCRIPT','STYLE','TEXTAREA','CODE','PRE'].includes(node.parentElement?.tagName))return;
  let info=nodes.get(node);if(!info){info={original:node.data,last:node.data};nodes.set(node,info)}
  else if(external&&node.data!==info.last){info.original=node.data}
  const next=translate(info.original);info.last=next;if(node.data!==next)node.data=next;
 }
 const translatedAttributes=['aria-label','aria-valuetext','placeholder','title','content'];
 function attribute(el,name,external=false){
  if(el.closest('[data-no-i18n]')||!el.hasAttribute(name)||(name==='content'&&!el.matches('meta[name=description]')))return;
  let map=attrs.get(el);if(!map){map={};attrs.set(el,map)}
  let info=map[name],value=el.getAttribute(name);
  if(!info){info=map[name]={original:value,last:value}}
  else if(external&&value!==info.last){info.original=value}
  const next=translate(info.original);info.last=next;if(value!==next)el.setAttribute(name,next);
 }
 function walk(node){
  if(node.nodeType===3){textNode(node,true);return}
  if(node.nodeType!==1&&node.nodeType!==9&&node.nodeType!==11)return;
  if(node.nodeType===1){if(node.closest('[data-no-i18n]'))return;translatedAttributes.forEach(name=>attribute(node,name,true))}
  node.childNodes.forEach(walk);
 }
 function refresh(){document.documentElement.lang=language;walk(document.head);walk(document.body);if(toggle){toggle.textContent=language==='en'?'繁中':'EN';toggle.setAttribute('aria-label',language==='en'?'Switch to Traditional Chinese':'Switch to English');toggle.title=language==='en'?'繁體中文':'English'}document.dispatchEvent(new CustomEvent('fulam-language-change',{detail:{language}}));}
 function switchLanguage(){language=language==='en'?'zh-Hant':'en';try{localStorage.setItem(key,language)}catch{}refresh()}
 window.FuLamI18n={register(map){Object.entries(map).forEach(([a,b])=>dict.set(a,b));if(document.body)refresh()},registerPatterns(list){patterns.push(...list);if(document.body)refresh()},getLanguage:()=>language,setLanguage(value){if(value!=='en'&&value!=='zh-Hant')return;if(value!==language)switchLanguage()}};
 function init(){
  toggle=document.createElement('button');toggle.className='language-toggle';toggle.type='button';toggle.dataset.noI18n='';toggle.addEventListener('click',switchLanguage);
  const header=document.querySelector('.header-inner')||document.querySelector('.account-header');if(header)header.append(toggle);else document.body.prepend(toggle);
  new MutationObserver(changes=>{for(const change of changes){if(change.type==='characterData')textNode(change.target,true);else if(change.type==='attributes')attribute(change.target,change.attributeName,true);else change.addedNodes.forEach(walk)}}).observe(document.documentElement,{subtree:true,childList:true,characterData:true,attributes:true,attributeFilter:translatedAttributes});
  refresh();
 }
 window.addEventListener('storage',event=>{if(event.key===key){language=event.newValue==='en'?'en':'zh-Hant';if(document.body)refresh()}});
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();
