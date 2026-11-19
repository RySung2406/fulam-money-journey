'use strict';
(function(root){
  const GAME_RULES=Object.freeze({version:'continuous-v1',sprintTarget:20,wrongPenaltySeconds:3});
  const shuffle = (list,random=Math.random) => { const a=[...list]; for(let i=a.length-1;i>0;i--){const j=Math.floor(random()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a; };
  function shuffleBoothOptions(options,random){
    const matches=shuffle(options.filter(option=>option.good),random);
    const decoys=shuffle(options.filter(option=>!option.good),random);
    if(!matches.length||!decoys.length)return matches.concat(decoys);

    // An odd deck ends in a trio. Reserve its extra bag before pairing the rest.
    const largerPool=matches.length>decoys.length?matches:decoys;
    const extra=options.length%2?largerPool.pop():null;
    const possibleMixed=Math.min(matches.length,decoys.length);
    // Exchange two mixed pairs for one quick-cut opportunity and one decoy pair.
    const mixedCount=possibleMixed-2*Math.floor(possibleMixed/4);
    const playable=[];
    for(let i=0;i<mixedCount;i++)playable.push([matches.pop(),decoys.pop()]);
    while(matches.length)playable.push([matches.pop(),matches.pop()]);

    const waves=shuffle(playable,random).map(pair=>[pair]);
    // Give each playable throw at most one decoy-only follower before reusing a gap.
    const gaps=shuffle(waves,random);
    for(let i=0;decoys.length;i++)gaps[i%gaps.length].push([decoys.pop(),decoys.pop()]);
    const groups=waves.flat();
    if(extra)groups[groups.length-1].push(extra);
    return groups.flatMap(group=>shuffle(group,random));
  }
  function createOptionDeck(options,random=Math.random,once=false){
    if(!options.length)throw new Error('A topic needs answer options.');
    let deck=[],recent=[],drawn=false;
    return {
      next(){
        if(!deck.length){if(once&&drawn)return null;deck=once?shuffleBoothOptions(options,random):shuffle(options,random);drawn=true;}
        if(once)return deck.shift();
        const eligible=deck.findIndex(option=>!recent.includes(option.id));
        const option=deck.splice(eligible<0?0:eligible,1)[0];
        if(!option)return null;
        recent.push(option.id);if(recent.length>2)recent.shift();
        return option;
      },
      get remaining(){return deck.length;}
    };
  }
  function createSession(){return {score:0,combo:0,bestCombo:0,correct:0,wrong:0,missed:0,avoided:0,quickCutAt:null,records:[],seen:new Set()};}
  // A bag can belong to one quick-cut pair. Use active play time so pauses cost nothing.
  function quickCutBonus(session,seconds){
    const gap=seconds-session.quickCutAt;
    const paired=session.quickCutAt!==null && gap>=0 && gap<=.65+1e-9;
    session.quickCutAt=paired?null:seconds;
    return paired?80:0;
  }
  function remember(session,key){
    if(session.seen.has(key))return false;
    session.seen.add(key);
    // Only recent instance IDs are needed: expired targets cannot be hit again.
    if(session.seen.size>512)session.seen.delete(session.seen.values().next().value);
    return true;
  }
  function recordHit(session,questionId,option,instanceId){
    const key=instanceId===undefined?questionId+':'+option.id:'instance:'+instanceId;
    if(!remember(session,key))return null;
    let delta;
    if(option.good){session.correct++;session.combo++;session.bestCombo=Math.max(session.bestCombo,session.combo);delta=100+Math.min(30,(session.combo-1)*10);}else{session.wrong++;session.combo=0;session.quickCutAt=null;delta=-150;}
    session.score+=delta;return {delta,combo:session.combo};
  }
  function recordMiss(session,instanceId,option){
    if(!remember(session,'instance:'+instanceId))return null;
    const status=option.good?'missed':'avoided';session[status]++;
    if(option.good){session.combo=0;session.quickCutAt=null;}
    return {status};
  }
  function sprintTimeMs(elapsedSeconds,wrong){
    return Math.ceil((Math.max(0,elapsedSeconds)+Math.max(0,wrong)*GAME_RULES.wrongPenaltySeconds)*1000);
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
    medium:{label:'Medium',description:'Find your rhythm',min:3.5,max:3.9/0.9,spread:.4,spin:20,pauseMin:.45,pauseMax:1.03},
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
  // Adapted from Physics.pickLaunchAngle in an1kens/fruit-blade (MIT).
  // See OPEN_SOURCE.md and fruit-blade-LICENSE.txt for the pinned source.
  function pickLaunchAngle(x,random){
    const upRight=40+random()*28,upLeft=112+random()*36;
    if(x<.22)return upRight;
    if(x>.78)return upLeft;
    return random()<.5?upRight:upLeft;
  }
  function nextSpawnDelay(mode,random=Math.random){
    const c=DIFFICULTIES[mode]||DIFFICULTIES.easy;
    return c.pauseMin+random()*(c.pauseMax-c.pauseMin);
  }
  function boothLaunchGaps(optionCount,deliveryWindow,random=Math.random){
    const gaps=[];
    const gapCount=Math.floor(optionCount/2)-1;
    const beat=deliveryWindow/Math.max(1,gapCount);
    let previous=0;
    for(let i=1;i<=gapCount;i++){
      // Shift each interior beat up to 18%. The first and last launches stay anchored.
      const offset=i===gapCount?0:(random()-.5)*.36;
      const at=(i+offset)*beat;
      gaps.push(at-previous);
      previous=at;
    }
    return gaps;
  }
  function spawnGroupSize(available,remaining=Infinity){
    if(remaining<2)return 0;
    // Keep the last three together when a stage has an odd number of choices.
    const count=remaining===3?3:2;
    return available>=count?count:0;
  }
  // Continuous positions, angle bands and velocities replace the old six slots.
  // Each trajectory is sampled once and evaluated analytically at any frame rate.
  function createLaunches(count,mode,random=Math.random){
    const config=DIFFICULTIES[mode]||DIFFICULTIES.easy;
    return Array.from({length:count},(_,lane)=>{
      const startX=.04+random()*.92;
      const radians=pickLaunchAngle(startX,random)*Math.PI/180;
      const velocity=(.65+random()*.5)*Math.cos(radians);
      const endX=Math.max(.02,Math.min(.98,startX+velocity));
      return {startX,endX,depth:random()*.18,
        duration:config.min+random()*(config.max-config.min),
        lane,lanes:count,delay:0,rotation:(random()-.5)*config.spin*2};
    });
  }
  function arcadePosition(plan,progress,width,height,bagWidth,bagHeight,ceiling){
    const span=Math.max(0,width-bagWidth-16),startX=8+span*plan.startX,endX=8+span*plan.endX;
    const top=Math.max(24,Math.min(ceiling,height-bagHeight-85));
    const room=Math.max(0,height-bagHeight-85-top);
    return flightPosition(progress,startX,endX,height+24,top+room*Math.min(.9,plan.depth));
  }
  root.GameEngine={GAME_RULES,createOptionDeck,nextSpawnDelay,boothLaunchGaps,spawnGroupSize,sprintTimeMs,recordMiss,shuffle,createSession,recordHit,quickCutBonus,decisions,summarise,segmentIntersectsRect,flightPosition,DIFFICULTIES,createWaves,createLaunches,arcadePosition};
})(typeof window==='undefined'?globalThis:window);

