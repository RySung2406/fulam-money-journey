'use strict';
(function(root){
 // Original metallic collision sound: inharmonic ringing, impact clicks and
 // irregular rebounds. Generated locally once; no downloads or music samples.
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
  constructor(){this.buffer=null;this.context=null;}
  play(ctx){
   if(this.context!==ctx){this.context=ctx;this.buffer=null;}
   if(!this.buffer){const data=synthesize(ctx.sampleRate);this.buffer=ctx.createBuffer(1,data.length,ctx.sampleRate);this.buffer.getChannelData(0).set(data);}
   const source=ctx.createBufferSource(),gain=ctx.createGain();source.buffer=this.buffer;
   source.playbackRate.value=.96+Math.random()*.08;gain.gain.value=.32;
   source.connect(gain);gain.connect(ctx.destination);source.start();
   source.onended=()=>{source.disconnect();gain.disconnect();};
  }
 }
 CoinAudio.synthesize=synthesize;root.CoinAudio=CoinAudio;
})(typeof window==='undefined'?globalThis:window);
