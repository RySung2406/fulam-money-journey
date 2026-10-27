'use strict';
window.startMoneyGame = () => {
const $=s=>document.querySelector(s), app=$('#app'), modal=$('#modal'), E=window.GameEngine;
const icon=(name,cls='')=>`<svg class="${cls}" aria-hidden="true"><use href="#i-${name}"/></svg>`;
const bag=(cls='')=>`<svg class="${cls}" aria-hidden="true" viewBox="0 0 200 210"><use href="#bag-art"/></svg>`;
const escape=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const prefs={get(k,f){try{return localStorage.getItem('fulam-'+k)??f;}catch{return f;}},set(k,v){try{localStorage.setItem('fulam-'+k,String(v));}catch{}}};
let mode=prefs.get('mode','easy'), sound=prefs.get('sound','true')==='true', phase='home', session=E.createSession(), questionIndex=0;
let arena=null, targets=[], wave=0, order=[], hitIds=new Set(), elapsed=0, lastTime=0, raf=0, paused=false, waveComplete=false, waveScore=0, allCutAt=null;
let trail=[], pointer=null, canvas=null, ctx=null, arenaWidth=0, arenaHeight=0, arenaCeiling=0, tutorial=false, audioCtx=null, cleanupTimers=[], savedPhase=null;
const reducedMotion=matchMedia('(prefers-reduced-motion: reduce)').matches;
const effects=new MoneyEffects(reducedMotion),coinAudio=new CoinAudio();
let waves=[];
if(!E.DIFFICULTIES[mode])mode=mode==='standard'?'medium':'easy';
const difficulty=()=>E.DIFFICULTIES[mode];
const choicesPerQuestion=q=>q.options.length;
let knife=null;
const waveDuration=()=>Math.max(0,...targets.map(t=>t.launch.delay+t.launch.duration));
const statusLabels={correct:'✓ Correct slice',avoided:'✓ Correctly avoided',wrong:'× Wrong slice',missed:'○ Missed'};
const totalChoices=()=>QUESTIONS.reduce((sum,q)=>sum+choicesPerQuestion(q),0);
const waveCount=()=>waves.length;
function later(fn,ms){const t=setTimeout(fn,ms);cleanupTimers.push(t);return t;}
function announce(text){$('#announcer').textContent=text;}
function toast(text){document.querySelector('.toast')?.remove();const el=document.createElement('div');el.className='toast';el.textContent=text;document.body.append(el);setTimeout(()=>el.remove(),3000);}
function playSound(kind){
 if(!sound)return;
 try{
  audioCtx??=new (window.AudioContext||window.webkitAudioContext)();
  if(audioCtx.state==='suspended')audioCtx.resume();
  const t=audioCtx.currentTime;
  if(kind==='good'){coinAudio.play(audioCtx);return;}
  if(kind==='slice'){
   const length=Math.ceil(audioCtx.sampleRate*.13),buffer=audioCtx.createBuffer(1,length,audioCtx.sampleRate),data=buffer.getChannelData(0);
   for(let i=0;i<length;i++)data[i]=(Math.random()*2-1)*(1-i/length);
   const source=audioCtx.createBufferSource(),filter=audioCtx.createBiquadFilter(),gain=audioCtx.createGain();
   source.buffer=buffer;filter.type='bandpass';filter.Q.value=.7;filter.frequency.setValueAtTime(3200,t);filter.frequency.exponentialRampToValueAtTime(650,t+.12);
   gain.gain.setValueAtTime(0,t);gain.gain.linearRampToValueAtTime(.13,t+.015);gain.gain.exponentialRampToValueAtTime(.001,t+.13);
   source.connect(filter);filter.connect(gain);gain.connect(audioCtx.destination);source.start(t);source.stop(t+.14);
   source.onended=()=>{source.disconnect();filter.disconnect();gain.disconnect();};return;
  }
  const notes=kind==='bad'?[180,115]:[440,660,880];
  notes.forEach((n,i)=>{
   const o=audioCtx.createOscillator(),g=audioCtx.createGain(),at=t+i*.065;
   o.type=kind==='bad'?'triangle':'sine';o.frequency.setValueAtTime(n,at);
   g.gain.setValueAtTime(0,at);g.gain.linearRampToValueAtTime(.055,at+.004);g.gain.exponentialRampToValueAtTime(.001,at+.23);
   o.connect(g);g.connect(audioCtx.destination);o.start(at);o.stop(at+.25);o.onended=()=>{o.disconnect();g.disconnect();};
  });
 }catch{}
}
function updateSound(){const b=$('#sound-toggle');b.innerHTML=icon(sound?'volume':'muted');b.setAttribute('aria-label',sound?'Mute sound':'Enable sound');b.setAttribute('aria-pressed',String(sound));const gameButton=$('#game-sound');if(gameButton){gameButton.innerHTML=icon(sound?'volume':'muted');gameButton.setAttribute('aria-label',sound?'Mute sound':'Enable sound');gameButton.setAttribute('aria-pressed',String(sound));}}
$('#sound-toggle').addEventListener('click',()=>{sound=!sound;prefs.set('sound',sound);updateSound();if(sound)playSound('good');});updateSound();
$('#fullscreen').addEventListener('click',async()=>{try{if(document.fullscreenElement)await document.exitFullscreen();else if(document.documentElement.requestFullscreen)await document.documentElement.requestFullscreen();else toast('Fullscreen is unavailable in this browser. You can keep playing here.');}catch{toast('Could not open fullscreen. You can keep playing here.');}});
function stopAnimation(){cancelAnimationFrame(raf);raf=0;cleanupTimers.forEach(clearTimeout);cleanupTimers=[];pointer=null;trail=[];targets=[];effects.clear();knife=null;arena=null;ctx=null;canvas=null;}
function render(markup){stopAnimation();document.body.classList.toggle('immersive-game',['ready','playing','tutorial'].includes(phase));app.innerHTML=markup;window.scrollTo({top:0,behavior:'instant'});}
function showModal(title,body,buttons){if(paused){arena?.classList.add('is-paused');hideKnife();}$('#modal-content').innerHTML=`<h2 id="modal-title">${title}</h2>${body}${buttons}`;if(!modal.open)modal.showModal();}
function closeModal(){modal.close();}
function about(){const wasPlaying=phase==='playing'||phase==='tutorial';if(wasPlaying){paused=true;pointer=null;}showModal('Every slice is a choice.',`<p>FuLam One Slice is The Money Journey’s finance arcade game. Explore financial tools, investing, insurance, borrowing and scam awareness through five rounds.</p><p>Your score reflects slicing and combos, not overall financial ability. Read the explanations after each round to learn from your choices.</p><p>Your verified HKU account is managed by The Money Journey. Game answers and scores stay in memory for this session; sound and difficulty preferences stay in this browser. Explanations link to official learning resources. This is general financial education; real decisions depend on your circumstances and product terms.</p>`,`<button class="primary" id="close-modal">Got it</button>`);$('#close-modal').onclick=closeModal;}
$('#about-button').onclick=about;
modal.addEventListener('close',()=>{arena?.classList.remove('is-paused');if(phase==='playing'||phase==='tutorial'){paused=false;lastTime=performance.now();}savedPhase=null;});
function home(){closeModal();phase='home';paused=false;render(`<section class="hero page-in"><div class="hero-copy"><div class="eyebrow"><span class="live-dot"></span> THE MONEY CHOICE CHALLENGE</div><h1>Every slice.<br>A smarter <span class="gold">choice.</span></h1><p class="hero-desc">Saving, investing, insurance and borrowing.<br>How would you choose?<br><strong>Slice the right bags. Build your money skills.</strong></p><div class="mode-picker" aria-label="Game difficulty">${Object.entries(E.DIFFICULTIES).map(([key,d])=>`<button data-mode="${key}" aria-pressed="${mode===key}">${d.label}<span>${d.description}</span></button>`).join('')}</div><div class="hero-actions"><button class="primary" id="start-game">Start challenge ${icon('arrow')}</button><button class="text-button" id="how-to">How to play ↗</button></div><div class="hero-meta"><span>Five short rounds</span><span>Phone or desktop</span><span>HKU member access</span></div></div><div class="hero-art" aria-hidden="true"><div class="art-glow"></div><div class="orbit"></div><div class="orbit two"></div><div class="small-bag one">${bag()}</div><div class="small-bag two">${bag()}</div><div class="hero-bag">${bag()}</div><div class="art-label">Stocks</div><div class="art-slice"></div><div class="floating-label top">Financial tools ↗</div><div class="floating-label bottom">✦ GOOD CHOICE +100</div><span class="art-number">YOUR NEXT MOVE</span><span class="spark s1">✦</span><span class="spark s2">✧</span><span class="spark s3">✦</span></div></section><section class="bottom-strip" aria-label="Game features"><div class="strip-item"><span class="strip-number">05</span><div><strong>Finance topics</strong><small>Tools · Investing · Insurance · Loans · Scams</small></div></div><div class="strip-item"><span class="strip-number">${totalChoices()}</span><div><strong>Money bag choices</strong><small>Read carefully. Slice wisely.</small></div></div><div class="strip-item"><span class="strip-number">01</span><div><strong>One habit to take away</strong><small>Put your learning into practice.</small></div></div></section>`);
app.querySelectorAll('[data-mode]').forEach(b=>b.onclick=()=>{mode=b.dataset.mode;prefs.set('mode',mode);app.querySelectorAll('[data-mode]').forEach(x=>x.setAttribute('aria-pressed',String(x===b)));});$('#start-game').onclick=startGame;$('#how-to').onclick=rules;
}
function rules(){showModal('Read. Choose. Slice.',`<ol><li><strong>Read first: </strong>Understand the question, then start when ready.</li><li><strong>Slice your answers: </strong>Drag with the mouse button held down, or swipe with a finger. Slice every correct bag and let the others pass.</li><li><strong>Expect variety: </strong>One, two or three bags fly along different arcs. Each round has 12 choices and several correct answers.</li><li><strong>Learn from the review: </strong>Wrong or missed choices show you what to practise next.</li></ol><div class="rule-points"><span>Correct +100</span><span>Wrong −150</span><span>Combo bonus</span></div><p>Difficulty changes the flight speed. Start on Easy to warm up. Keyboard players can Tab to an active bag and press Enter or Space to slice.</p>`,`<button class="primary" id="close-modal">Got it—ready to slice ${icon('slice')}</button>`);$('#close-modal').onclick=closeModal;}
$('#brand-home').onclick=()=>{if(['playing','ready','tutorial','review'].includes(phase)){paused=true;showModal('Return to the game menu?','<p>Your current game will be reset.</p>','<button class="primary" id="continue-game">Keep playing</button><button class="text-button" id="leave-game">Game menu</button>');$('#continue-game').onclick=closeModal;$('#leave-game').onclick=home;}else home();};
function startGame(){session=E.createSession();questionIndex=0;tutorial=true;playSound('start');renderGame(true);startTutorial();}
function renderGame(isTutorial=false){const q=QUESTIONS[questionIndex];phase=isTutorial?'tutorial':'ready';tutorial=isTutorial;paused=false;
render(`<section class="game-wrap"><div class="game-topline"><div class="progress-steps">${QUESTIONS.map((_,i)=>`<span class="step-dot ${!isTutorial&&i<questionIndex?'done':''} ${!isTutorial&&i===questionIndex?'current':''}"></span>`).join('')}<span class="round-number">${isTutorial?'Practice':`${String(questionIndex+1).padStart(2,'0')} / 05`}</span></div><div class="game-tools"><span class="mode-label">${difficulty().label} · 1–3 bags at a time</span><button class="icon-button" id="game-sound" aria-label="Sound">${icon(sound?'volume':'muted')}</button><button class="icon-button" id="game-fullscreen" aria-label="Toggle fullscreen">${icon('expand')}</button><button class="icon-button" id="pause-game" aria-label="Pause game">${icon('pause')}</button></div></div><div class="game-panel"><div class="question-bar"><div class="eyebrow">${isTutorial?'HOW TO SLICE / UNSCORED PRACTICE':q.eyebrow}</div><h1>${isTutorial?'Try your first slice.':q.question}</h1><p class="question-context">${isTutorial?'The knife follows your finger or mouse. Hold and swipe through a bag. Take your time—the practice bag keeps coming back.':q.context}</p></div><div class="game-hud"><div class="score-block"><span>SCORE</span><strong class="score-value" id="score">${session.score}</strong><span class="combo-block" id="combo"></span></div><div class="wave-progress"><span id="wave-label">${isTutorial?'PRACTICE':'GET READY'}</span><span class="wave-line"><i id="wave-meter" ></i></span></div></div><div class="arena" id="arena" role="group" aria-label="Money bag slicing arena"><span class="arena-caption">SLICE THE RIGHT CHOICES</span><span class="arena-watermark">FuLam One Slice</span><canvas class="trail" id="trail" aria-hidden="true"></canvas><span class="knife-cursor" id="knife-cursor" aria-hidden="true"><img src="knife.svg" alt="" draggable="false"></span>${isTutorial?'<div class="tutorial-hint">Swipe through a bag to try your first slice ↗</div>':`<div class="arena-overlay" id="ready-overlay"><div class="ready-card"><div class="ready-icon">${icon('slice')}</div><h2>${q.chapter}</h2><p>Read the question above.<br>Slice every correct choice.<br>One to three bags fly at a time.<br>${difficulty().label} · ${choicesPerQuestion(q)} choices.</p><button class="primary" id="ready-button">Ready to slice ${icon('arrow')}</button></div></div>`}</div><div class="arena-footer"><span>${isTutorial?'Swipe with your finger or drag with your mouse':'Correct +100 · Wrong −150 · Missed +0'}</span><button class="skip-wave" id="skip-wave">${isTutorial?'Skip practice →':'Pass this wave →'}</button></div></div><p class="small-note">${isTutorial?'Keyboard: Tab to a bag, then press Enter or Space.':'Several choices are correct · Reading time does not affect your score'}</p></section>`);
arena=$('#arena');canvas=$('#trail');ctx=canvas.getContext('2d');knife=$('#knife-cursor');resizeArena();bindPointer();$('#pause-game').onclick=pauseGame;$('#game-sound').onclick=()=>$('#sound-toggle').click();$('#game-fullscreen').onclick=()=>$('#fullscreen').click();updateSound();
$('#skip-wave').onclick=()=>{if(tutorial){renderGame();return;}if(phase==='playing'&&!paused&&!waveComplete)finishWave();};
if(!isTutorial){$('#skip-wave').disabled=true;$('#ready-button').onclick=()=>{$('#ready-overlay').remove();startQuestion();};}
}
function resizeArena(){if(!arena)return;const r=arena.getBoundingClientRect();arenaWidth=r.width;arenaHeight=r.height;arenaCeiling=Math.max(70,($('.question-bar')?.getBoundingClientRect().bottom??r.top+160)-r.top+20);arena.style.setProperty('--flight-ceiling',arenaCeiling+'px');if(canvas&&ctx){const dpr=Math.min(devicePixelRatio||1,2);canvas.width=Math.round(arenaWidth*dpr);canvas.height=Math.round(arenaHeight*dpr);canvas.style.width=arenaWidth+'px';canvas.style.height=arenaHeight+'px';ctx.setTransform(dpr,0,0,dpr,0,0);}}
window.addEventListener('resize',resizeArena);
function startTutorial(){phase='tutorial';arena.classList.add('knife-enabled');elapsed=0;lastTime=performance.now();makeTargets([{id:'practice',text:'Slice me!',good:true}],true);loop(lastTime);}
function startQuestion(){phase='playing';arena.classList.add('knife-enabled');waveScore=session.score;order=E.shuffle(QUESTIONS[questionIndex].options).slice(0,choicesPerQuestion(QUESTIONS[questionIndex]));hitIds=new Set();waves=E.createWaves(order);wave=0;playSound('start');startWave();}
function makeTargets(opts,isTutorial=false){targets.forEach(t=>t.el.remove());targets=[];const launches=E.createLaunches(opts.length,mode);opts.forEach((option,i)=>{const el=document.createElement('button');el.className='target '+(isTutorial?'practice-target':'choice-target');el.setAttribute('aria-label','Slice: '+option.text);el.style.visibility='hidden';el.disabled=true;el.innerHTML=bag('bag-svg')+`<span class="option-label">${option.text}</span>`;arena.append(el);const t={option,el,index:i,hit:false,active:false,x:0,y:0,isTutorial,launch:isTutorial?{startX:.2,endX:.8,depth:.2,duration:5.5,delay:0,rotation:12}:launches[i]};targets.push(t);el.addEventListener('click',ev=>{if(ev.detail===0)cutTarget(t);});});}
function startWave(){waveComplete=false;allCutAt=null;elapsed=0;lastTime=performance.now();trail=[];makeTargets(waves[wave]);$('#wave-label').textContent=`WAVE ${wave+1} / ${waveCount()} · ${targets.length} ${targets.length===1?'bag':'bags'}`;$('#skip-wave').disabled=false;cancelAnimationFrame(raf);loop(lastTime);}
function positionTargets(){
 if(!arena)return;
 for(const t of targets){
  const duration=t.launch.duration;
  const localTime=tutorial?elapsed%duration:elapsed-t.launch.delay;
  t.active=!t.hit&&localTime>=0&&localTime<duration;
  t.el.style.visibility=t.active?'visible':'hidden';t.el.disabled=!t.active;
  if(!t.active)continue;
  const progress=localTime/duration,width=t.el.offsetWidth,height=t.el.offsetHeight;
  const pos=E.arcadePosition(t.launch,progress,arenaWidth,arenaHeight,width,height,arenaCeiling);
  t.x=pos.x;t.y=pos.y;t.el.style.transform=`translate(${pos.x}px,${pos.y}px)`;
  t.el.style.setProperty('--bag-rotation',reducedMotion?'0deg':((progress-.5)*t.launch.rotation*2)+'deg');
 }
}
function loop(now){if(!['playing','tutorial'].includes(phase))return;const dt=Math.min((now-lastTime)/1000,.05);lastTime=now;if(!paused){elapsed+=dt;positionTargets();drawTrail(now,dt);const duration=waveDuration();if(!tutorial&&!waveComplete){$('#wave-meter').style.transform=`scaleX(${Math.max(0,1-elapsed/duration)})`;if(targets.every(t=>t.hit)){allCutAt??=elapsed;}if(elapsed>=duration||(allCutAt!==null&&elapsed-allCutAt>1.1)){finishWave();return;}}}raf=requestAnimationFrame(loop);}
function finishWave(){if(waveComplete||tutorial||phase!=='playing')return;waveComplete=true;cancelAnimationFrame(raf);targets.filter(t=>!t.hit&&t.option.good).forEach(()=>{session.combo=0;});updateHUD();targets.forEach(t=>t.el.remove());targets=[];trail=[];ctx?.clearRect(0,0,arenaWidth,arenaHeight);$('#skip-wave').disabled=true;pointer=null;hideKnife();
if(wave<waveCount()-1){wave++;startWave();}else finishQuestion();}
function updateHUD(){if($('#score'))$('#score').textContent=session.score;const c=$('#combo');if(c)c.textContent=session.combo>1?`${session.combo} COMBO`:'';}
function cutTarget(t){if(t.hit||!t.active||paused||!['playing','tutorial'].includes(phase))return;t.hit=true;t.el.disabled=true;t.el.classList.add(t.option.good?'cut-good':'cut-bad');playSound(t.option.good?'good':'bad');const centerX=t.x+t.el.offsetWidth/2,centerY=t.y+t.el.offsetHeight*.48;splitBag(t);
if(tutorial){burst(centerX,centerY,true);feedback(centerX,centerY,'Nice slice!','Get ready for five finance rounds',true);announce('Practice complete');later(()=>{if(phase==='tutorial'){renderGame();}},1400);return;}
hitIds.add(t.option.id);const result=E.recordHit(session,QUESTIONS[questionIndex].id,t.option);if(!result)return;updateHUD();burst(centerX,centerY,t.option.good);feedback(centerX,centerY,result.delta>0?'+'+result.delta:String(result.delta),t.option.good?(result.combo>1?result.combo+' COMBO':'Good choice!'):'Think this one through',t.option.good);announce(t.option.text+': '+(t.option.good?'Correct slice':'Wrong slice'));}
function feedback(x,y,text,sub,good){const el=document.createElement('div');el.className='feedback-tag'+(good?'':' bad');el.style.left=x+'px';el.style.top=y+'px';el.innerHTML=escape(text)+`<small>${escape(sub)}</small>`;arena.append(el);later(()=>el.remove(),1000);}
function burst(x,y,good){effects.burst(x,y,good,arenaWidth<650?.8:1);}
function splitBag(t){
 const art=t.el.querySelector('.bag-svg').getBoundingClientRect(),bounds=arena.getBoundingClientRect();
 for(const side of ['left','right']){
  const part=document.createElement('div');part.className='bag-fragment '+side;
  part.style.left=(art.left-bounds.left)+'px';part.style.top=(art.top-bounds.top)+'px';
  part.style.width=art.width+'px';part.style.height=art.height+'px';
  part.innerHTML=bag();arena.append(part);later(()=>part.remove(),700);
 }
}
function hideKnife(){knife?.classList.remove('visible','slicing');}
function moveKnife(p,active,dx=0){
 if(!knife)return;knife.style.left=p.x+'px';knife.style.top=p.y+'px';
 knife.style.setProperty('--tilt',Math.max(-28,Math.min(28,dx*.7))+'deg');
 knife.classList.add('visible');knife.classList.toggle('slicing',active);
}
function bindPointer(){
 const getPoint=ev=>{const r=arena.getBoundingClientRect();return{x:ev.clientX-r.left,y:ev.clientY-r.top,t:performance.now()};};
 const canSlice=()=>!paused&&['playing','tutorial'].includes(phase);
 arena.addEventListener('pointerdown',ev=>{
  if(!canSlice()||ev.button>0||pointer)return;ev.preventDefault();
  const p=getPoint(ev);pointer={id:ev.pointerId,point:p};trail.push(p);moveKnife(p,true);playSound('slice');
  arena.setPointerCapture(ev.pointerId);
 });
 arena.addEventListener('pointermove',ev=>{
  if(!canSlice()){hideKnife();return;}
  const p=getPoint(ev);
  if(!pointer){if(ev.pointerType!=='touch')moveKnife(p,false);return;}
  if(pointer.id!==ev.pointerId)return;ev.preventDefault();
  const prev=pointer.point;moveKnife(p,true,p.x-prev.x);
  if(Math.hypot(p.x-prev.x,p.y-prev.y)<2)return;
  for(const t of targets){
   if(t.hit||!t.active)continue;const w=t.el.offsetWidth,h=t.el.offsetHeight;
   const r={left:t.x+12,right:t.x+w-12,top:t.y+18,bottom:t.y+h-10};
   if(E.segmentIntersectsRect(prev,p,r))cutTarget(t);
  }
  trail.push(p);pointer.point=p;
 });
 const end=ev=>{
  if(pointer?.id!==ev.pointerId)return;pointer=null;
  if(ev.type==='pointerup'&&ev.pointerType==='mouse'&&canSlice())knife?.classList.remove('slicing');else hideKnife();
 };
 arena.addEventListener('pointerup',end);arena.addEventListener('pointercancel',end);arena.addEventListener('lostpointercapture',end);
 arena.addEventListener('pointerleave',()=>{if(!pointer)hideKnife();});
}
function drawTrail(now,dt){
 if(!ctx)return;ctx.clearRect(0,0,arenaWidth,arenaHeight);effects.draw(ctx,dt);
 trail=trail.filter(p=>now-p.t<180);if(trail.length<2)return;
 ctx.save();ctx.lineCap='round';ctx.lineJoin='round';
 for(let i=1;i<trail.length;i++){
  const alpha=Math.max(0,1-(now-trail[i].t)/180);
  ctx.beginPath();ctx.moveTo(trail[i-1].x,trail[i-1].y);ctx.lineTo(trail[i].x,trail[i].y);
  ctx.strokeStyle=`rgba(120,214,255,${alpha*.12})`;ctx.lineWidth=20;ctx.stroke();
  ctx.strokeStyle=`rgba(184,236,255,${alpha*.4})`;ctx.lineWidth=8;ctx.stroke();
  ctx.strokeStyle=`rgba(255,251,224,${alpha})`;ctx.lineWidth=2.5;ctx.stroke();
 }
 ctx.restore();
}
function pauseGame(){if(!['playing','tutorial'].includes(phase)){toast('There is no countdown on the ready screen. Take your time to read.');return;}paused=true;pointer=null;hideKnife();showModal('Take a moment.','<p>The clock is paused. Continue when you are ready.</p>','<button class="primary" id="resume">Resume challenge '+icon('arrow')+'</button><button class="text-button" id="pause-home">Game menu</button><a class="account-return" href="../">Exit to my account</a>');$('#resume').onclick=closeModal;$('#pause-home').onclick=()=>{showModal('Return to the game menu?','<p>Your current game will be reset.</p>','<button class="primary" id="resume">Keep playing</button><button class="text-button" id="confirm-home">Game menu</button>');$('#resume').onclick=closeModal;$('#confirm-home').onclick=home;};}
document.addEventListener('visibilitychange',()=>{if(document.hidden&&['playing','tutorial'].includes(phase)&&!paused)pauseGame();});
function sourceLinks(q){return q.sources?.length?`<details class="source-links"><summary>Official learning resources ↗</summary>${q.sources.map(s=>`<a href="${escape(s.url)}" target="_blank" rel="noopener noreferrer">${escape(s.title)} ↗</a>`).join('')}</details>`:'';}
function decisionCards(list){return list.map(d=>`<article class="decision-card ${d.status}"><div class="decision-top"><span class="decision-title">${d.text}</span><span class="status-pill">${statusLabels[d.status]}</span></div><p>${d.why}</p></article>`).join('');}
function finishQuestion(){const q=QUESTIONS[questionIndex];const rec={id:q.id,index:questionIndex,score:session.score-waveScore,decisions:E.decisions(order,hitIds)};session.records.push(rec);phase='review';const s=E.summarise([rec]);render(`<section class="review-page page-in"><div class="review-header"><div><div class="eyebrow">ROUND ${String(questionIndex+1).padStart(2,'0')} COMPLETE</div><h1>Learn from every slice.</h1><p>${q.chapter} · ${s.correct+s.avoided} / ${rec.decisions.length} choices judged correctly</p></div><div class="round-score">${rec.score>0?'+':''}${rec.score}<small>ROUND SCORE</small></div></div><div class="takeaway"><span class="take-icon">✦</span><div><small>TAKEAWAY</small><p>${q.takeaway}</p></div></div><div class="decisions-grid">${decisionCards(rec.decisions)}</div>${sourceLinks(q)}<div class="review-bottom"><span>Every mistake is a chance to make a better choice.</span><button class="primary" id="next-question">${questionIndex===4?'See my results':'Next round'} ${icon('arrow')}</button></div></section>`);$('#next-question').onclick=()=>{if(questionIndex===4)showResults();else{questionIndex++;renderGame();}};announce(q.chapter+' complete, '+(s.correct+s.avoided)+' choices judged correctly.');}
function showResults(){phase='results';const s=E.summarise(session.records);const weakest=[...session.records].sort((a,b)=>a.decisions.filter(d=>d.status==='correct'||d.status==='avoided').length-b.decisions.filter(d=>d.status==='correct'||d.status==='avoided').length)[0];const q=QUESTIONS[weakest?.index??0];const mistakes=session.records.flatMap(r=>r.decisions.filter(d=>['wrong','missed'].includes(d.status)));render(`<section class="results-page page-in"><div class="result-top"><div class="result-emblem">${icon('slice')}</div><div class="eyebrow">CHALLENGE COMPLETE / FIVE ROUNDS COMPLETE</div><h1>Take your next good choice into real life.</h1><p>${totalChoices()} choices completed · Best ${session.bestCombo} COMBO</p><div class="big-score">${session.score.toLocaleString()}<small>points</small></div></div><div class="results-stats"><div class="result-stat"><strong>${s.correct}</strong><small>Correct bags sliced</small></div><div class="result-stat"><strong>${s.avoided}</strong><small>Wrong bags avoided</small></div><div class="result-stat needs-work"><strong>${s.wrong}</strong><small>Wrong bags sliced</small></div><div class="result-stat needs-work"><strong>${s.missed}</strong><small>Correct bags missed</small></div></div><div class="action-card"><div class="action-number">01</div><div><div class="eyebrow">FROM THE GAME TO REAL LIFE</div><p>${q.action}</p></div></div><div class="result-actions"><button class="primary" id="replay">Play again ${icon('arrow')}</button><button class="secondary" id="review-mistakes">Review mistakes${mistakes.length?' · '+mistakes.length:''}</button><button class="text-button" id="copy-result">Copy results ↗</button></div><p class="result-caption">Scores reflect slicing and combos, not overall financial ability. Every replay reshuffles the choices.</p><div class="result-review" id="result-review" hidden><h2>Review now. Choose better next time.</h2>${mistakes.length?session.records.map(r=>{const ds=r.decisions.filter(d=>['wrong','missed'].includes(d.status));return ds.length?`<details open><summary>${QUESTIONS[r.index].chapter} · ${ds.length} choices to revisit</summary><div class="decisions-grid">${decisionCards(ds)}</div>${sourceLinks(QUESTIONS[r.index])}</details>`:'';}).join(''):'<p class="empty-review">Every choice was correct this time. Keep practising these habits in everyday life.</p>'}</div></section>`);$('#replay').onclick=()=>{session=E.createSession();questionIndex=0;renderGame();};$('#review-mistakes').onclick=()=>{const box=$('#result-review');box.hidden=!box.hidden;if(!box.hidden)box.scrollIntoView({behavior:reducedMotion?'instant':'smooth',block:'start'});};$('#copy-result').onclick=async()=>{const text=`I completed FuLam One Slice!\n${session.score} points · Best ${session.bestCombo} Combo\nSliced ${s.correct} correct bags and avoided ${s.avoided} wrong choices.\nToday’s small step: ${q.action}\nThe Money Journey · FuLam`;try{await navigator.clipboard.writeText(text);toast('Results copied!');}catch{showModal('Your results',`<p class="copyable-result">${escape(text)}</p>`,'<button class="primary" id="close-modal">Done</button>');$('#close-modal').onclick=closeModal;}};announce('Five rounds complete. Total score '+session.score+'.');}
home();
};
