'use strict';
(function(root){
 // Original metallic collision sound: inharmonic ringing, impact clicks and
 // irregular rebounds. Generated locally once; no downloads or music samples.
 // Optional Kenney CC0 samples under ./audio/ enrich slice / miss when present.
 const CUES = {
  good: { file: 'coin.mp3', rate: 1, gain: .36 },
  bad: { file: 'bad.mp3', rate: .92, gain: .42 },
  slice: { file: 'slice.mp3', rate: 1.08, gain: .28 },
  swoosh: { file: 'swoosh.mp3', rate: 1.25, gain: .18 },
  combo: { file: 'combo.mp3', rate: 1.05, gain: .34 },
  start: { file: 'combo.mp3', rate: .88, gain: .3 }
 };
 function synthesize(sampleRate){
  const samples=new Float32Array(Math.ceil(sampleRate*1.05));
  const times=[0,.028,.073,.128,.191,.267,.354,.451,.558,.675];
  const frequencies=[2680,3290,2410,3060,2260,3450,2840,2520,3180,2340];
  const ratios=[1,1.472,2.091,2.763],weights=[1,.6,.32,.15];
  let seed=7411;
  const noise=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/2147483648-1;};
  times.forEach((start,k)=>{
   const offset=Math.floor(start*sampleRate),amplitude=.7*Math.exp(-k*.16),duration=.29;
   const phases=ratios.map(()=>noise()*Math.PI);let previous=0;
   for(let i=0;i<Math.floor(duration*sampleRate);i++){
    const t=i/sampleRate,attack=Math.min(1,t/.0007);let ring=0;
    for(let j=0;j<ratios.length;j++){
     const hz=frequencies[k]*ratios[j];if(hz>=sampleRate*.46)continue;
     ring+=weights[j]*Math.sin(2*Math.PI*hz*t+phases[j])*Math.exp(-t/(.048-j*.009));
    }
    const n=noise(),click=(n-previous)*.22*Math.exp(-t/.003);previous=n;
    samples[offset+i]+=amplitude*attack*(ring+click);
   }
  });
  let peak=0;for(const x of samples)peak=Math.max(peak,Math.abs(x));
  if(peak)for(let i=0;i<samples.length;i++)samples[i]*=.8/peak;
  return samples;
 }
 class CoinAudio {
  constructor(baseUrl='./audio/'){
   this.baseUrl=baseUrl.endsWith('/')?baseUrl:baseUrl+'/';
   this.buffers=Object.create(null);
   this.synthBuffer=null;
   this.context=null;
   this.loadPromise=null;
  }
  ensure(ctx){
   if(this.context!==ctx){this.context=ctx;this.buffers=Object.create(null);this.synthBuffer=null;this.loadPromise=null;}
   if(this.loadPromise)return this.loadPromise;
   this.loadPromise=(async()=>{
    const files=[...new Set(Object.values(CUES).map(cue=>cue.file))];
    await Promise.all(files.map(async file=>{
     try{
      const response=await fetch(this.baseUrl+file,{cache:'force-cache'});
      if(!response.ok)return;
      const data=await response.arrayBuffer();
      this.buffers[file]=await ctx.decodeAudioData(data.slice(0));
     }catch{ /* Synthesised fallbacks remain. */ }
    }));
   })();
   return this.loadPromise;
  }
  playBuffer(ctx,buffer,{rate=1,gain=.35,when=0}={}){
   if(!buffer)return false;
   const source=ctx.createBufferSource(),amp=ctx.createGain(),t=ctx.currentTime+when;
   source.buffer=buffer;source.playbackRate.value=rate*(.97+Math.random()*.06);
   amp.gain.setValueAtTime(0,t);amp.gain.linearRampToValueAtTime(gain,t+.008);amp.gain.exponentialRampToValueAtTime(.001,t+Math.max(.12,buffer.duration/rate+.05));
   source.connect(amp);amp.connect(ctx.destination);source.start(t);
   source.onended=()=>{try{source.disconnect();amp.disconnect();}catch{}};
   return true;
  }
  playSynthCoin(ctx,extra={}){
   if(!this.synthBuffer){
    const data=synthesize(ctx.sampleRate);
    this.synthBuffer=ctx.createBuffer(1,data.length,ctx.sampleRate);
    this.synthBuffer.getChannelData(0).set(data);
   }
   return this.playBuffer(ctx,this.synthBuffer,{
    rate:(extra.rate||1)*(.96+Math.random()*.08),
    gain:extra.gain??.32,
    when:extra.when||0
   });
  }
  // Back-compat: CoinAudio.play(ctx) still plays the original metallic coin.
  play(ctx,kind='good',extra={}){
   if(kind==null||kind==='good'){
    // Prefer the original synthesised metallic coin for correct cuts.
    return this.playSynthCoin(ctx,extra);
   }
   if(kind==='combo'){
    // Original coin, pitched up, plus optional Kenney sparkle if available.
    this.playSynthCoin(ctx,{rate:1.08+Math.min(.35,(extra.rate||1)-1),gain:extra.gain??.36});
    const cue=CUES.combo,buffer=this.buffers[cue.file];
    if(buffer)this.playBuffer(ctx,buffer,{rate:cue.rate*(extra.rate||1),gain:.22,when:.02});
    return true;
   }
   const cue=CUES[kind];
   if(cue&&this.buffers[cue.file]){
    this.playBuffer(ctx,this.buffers[cue.file],{rate:extra.rate||cue.rate,gain:extra.gain??cue.gain,when:extra.when||0});
    if(kind==='slice'&&this.buffers[CUES.swoosh.file])this.playBuffer(ctx,this.buffers[CUES.swoosh.file],{rate:1.2+Math.random()*.15,gain:.14});
    return true;
   }
   return false;
  }
 }
 CoinAudio.synthesize=synthesize;root.CoinAudio=CoinAudio;
})(typeof window==='undefined'?globalThis:window);
