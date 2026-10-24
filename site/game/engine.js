'use strict';
(function(root){
  const shuffle = list => { const a=[...list]; for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a; };
  function createSession(){return {score:0,combo:0,bestCombo:0,records:[],seen:new Set()};}
  function recordHit(session,questionId,option){
    const key=questionId+':'+option.id;if(session.seen.has(key))return null;session.seen.add(key);
    let delta;
    if(option.good){session.combo++;session.bestCombo=Math.max(session.bestCombo,session.combo);delta=100+Math.min(30,(session.combo-1)*10);}else{session.combo=0;delta=-150;}
    session.score+=delta;return {delta,combo:session.combo};
  }
  function decisions(options,hitIds){return options.map(o=>({...o,hit:hitIds.has(o.id),status:o.good?(hitIds.has(o.id)?'correct':'missed'):(hitIds.has(o.id)?'wrong':'avoided')}));}
  function summarise(records){const all=records.flatMap(r=>r.decisions);return {correct:all.filter(x=>x.status==='correct').length,avoided:all.filter(x=>x.status==='avoided').length,wrong:all.filter(x=>x.status==='wrong').length,missed:all.filter(x=>x.status==='missed').length,total:all.length};}
  function segmentIntersectsRect(a,b,r){let t0=0,t1=1;const dx=b.x-a.x,dy=b.y-a.y;for(const [p,q] of [[-dx,a.x-r.left],[dx,r.right-a.x],[-dy,a.y-r.top],[dy,r.bottom-a.y]]){if(p===0){if(q<0)return false;}else{const t=q/p;if(p<0)t0=Math.max(t0,t);else t1=Math.min(t1,t);if(t0>t1)return false;}}return true;}
  // One continuous ballistic arc; horizontal drift continues through the apex.
  function flightPosition(progress,startX,endX,startY,apexY){
    const p=Math.max(0,Math.min(1,progress));
    return {x:startX+(endX-startX)*p,y:startY-4*(startY-apexY)*p*(1-p)};
  }
  const DIFFICULTIES={
    easy:{label:'Easy',description:'A gentle warm-up',min:4.8,max:6.2,spread:.55,spin:14,pauseMin:.7,pauseMax:1.5},
    medium:{label:'Medium',description:'Find your rhythm',min:3.8,max:4.8,spread:.4,spin:20,pauseMin:.55,pauseMax:1.25},
    hard:{label:'Hard',description:'Test your reflexes',min:3,max:3.8,spread:.3,spin:26,pauseMin:.4,pauseMax:1}
  };
  // Vary group sizes without losing or repeating any question options.
  function createWaves(options,random=Math.random){
    const initial=[1,2,3];
    for(let i=2;i>0;i--){const j=Math.floor(random()*(i+1));[initial[i],initial[j]]=[initial[j],initial[i]];}
    const groups=[];let cursor=0;
    while(cursor<options.length){
      const count=initial.length?initial.shift():1+Math.floor(random()*3);
      groups.push(options.slice(cursor,cursor+count));cursor+=count;
    }
    return groups;
  }
  // Pick from the entire stage even for a single bag. Direction, arc height,
  // interval and group rhythm are sampled once, never re-randomized per frame.
  function createLaunches(count,mode,random=Math.random){
    const config=DIFFICULTIES[mode]||DIFFICULTIES.easy;
    const slots=Array.from({length:Math.max(6,count)},(_,i)=>i);
    for(let i=slots.length-1;i>0;i--){const j=Math.floor(random()*(i+1));[slots[i],slots[j]]=[slots[j],slots[i]];}
    const together=random()<.5,base=config.pauseMin+random()*(config.pauseMax-config.pauseMin);
    return slots.slice(0,count).map((slot,i)=>{
      const peakX=(slot%3+.5)/3+(random()-.5)*.055;
      const span=Math.min(peakX,1-peakX)*2*(.8+random()*.16);
      const direction=random()<.5?1:-1;
      return {startX:peakX-direction*span/2,endX:peakX+direction*span/2,
        depth:Math.floor(slot/3)*.58+.04+random()*.13,
        duration:config.min+random()*(config.max-config.min),
        delay:base+(together?random()*.12:i*config.spread*(.5+random()*.5)),
        rotation:(random()-.5)*config.spin*2};
    });
  }
  function arcadePosition(plan,progress,width,height,bagWidth,bagHeight,ceiling){
    const span=Math.max(0,width-bagWidth-16),startX=8+span*plan.startX,endX=8+span*plan.endX;
    const top=Math.max(24,Math.min(ceiling,height-bagHeight-85));
    const room=Math.max(0,height-bagHeight-85-top);
    return flightPosition(progress,startX,endX,height+24,top+room*Math.min(.9,plan.depth));
  }
  root.GameEngine={shuffle,createSession,recordHit,decisions,summarise,segmentIntersectsRect,flightPosition,DIFFICULTIES,createWaves,createLaunches,arcadePosition};
})(typeof window==='undefined'?globalThis:window);
