'use strict';
(function(root){
 // Money-bag cues only: prefer warm coin samples. No metallic multi-ring synth.
 const CUES = {
  good: { file: 'coin.mp3', rate: 1, gain: .72 },
  bad: { file: 'bad.mp3', rate: .92, gain: .36 },
  slice: { file: 'slice.mp3', rate: 1.02, gain: .16 },
  swoosh: { file: 'swoosh.mp3', rate: 1.15, gain: .08 },
  combo: { file: 'combo.mp3', rate: 1.05, gain: .28 },
  start: { file: 'combo.mp3', rate: .88, gain: .22 }
 };
 class CoinAudio {
  constructor(baseUrl='./audio/'){
   this.baseUrl=baseUrl.endsWith('/')?baseUrl:baseUrl+'/';
   this.buffers=Object.create(null);
   this.context=null;
   this.loadPromise=null;
  }
  ensure(ctx){
   if(this.context!==ctx){this.context=ctx;this.buffers=Object.create(null);this.loadPromise=null;}
   if(this.loadPromise)return this.loadPromise;
   this.loadPromise=(async()=>{
    const files=[...new Set(Object.values(CUES).map(cue=>cue.file))];
    await Promise.all(files.map(async file=>{
     try{
      const response=await fetch(this.baseUrl+file,{cache:'force-cache'});
      if(!response.ok)return;
      const data=await response.arrayBuffer();
      this.buffers[file]=await ctx.decodeAudioData(data.slice(0));
     }catch{ /* Soft money plink remains as fallback. */ }
    }));
   })();
   return this.loadPromise;
  }
  playBuffer(ctx,buffer,{rate=1,gain=.35,when=0}={}){
   if(!buffer)return false;
   const source=ctx.createBufferSource(),amp=ctx.createGain(),t=ctx.currentTime+when;
   source.buffer=buffer;source.playbackRate.value=rate*(.98+Math.random()*.04);
   amp.gain.setValueAtTime(0,t);amp.gain.linearRampToValueAtTime(gain,t+.006);amp.gain.exponentialRampToValueAtTime(.001,t+Math.max(.14,buffer.duration/rate+.04));
   source.connect(amp);amp.connect(ctx.destination);source.start(t);
   source.onended=()=>{try{source.disconnect();amp.disconnect();}catch{}};
   return true;
  }
  // Warm money plink — low and short, not metallic.
  playMoneyPlink(ctx,{rate=1,gain=.28}={}){
   try{
    const t=ctx.currentTime;
    const make=(hz,vol,delay,dur)=>{
     const o=ctx.createOscillator(),g=ctx.createGain(),at=t+delay;
     o.type='triangle';o.frequency.setValueAtTime(hz*rate,at);o.frequency.exponentialRampToValueAtTime(Math.max(80,hz*rate*.72),at+dur);
     g.gain.setValueAtTime(0,at);g.gain.linearRampToValueAtTime(vol,at+.008);g.gain.exponentialRampToValueAtTime(.001,at+dur);
     o.connect(g);g.connect(ctx.destination);o.start(at);o.stop(at+dur+.02);
     o.onended=()=>{try{o.disconnect();g.disconnect();}catch{}};
    };
    make(420,gain,0,.16);make(630,gain*.45,.02,.12);
    return true;
   }catch{return false;}
  }
  play(ctx,kind='good',extra={}){
   if(kind==null||kind==='good'){
    const cue=CUES.good,buffer=this.buffers[cue.file];
    const gain=extra.gain??cue.gain;
    if(buffer)return this.playBuffer(ctx,buffer,{rate:extra.rate||cue.rate,gain,when:extra.when||0});
    return this.playMoneyPlink(ctx,{rate:extra.rate||1,gain:Math.min(.4,gain*.55)});
   }
   if(kind==='combo'){
    // Louder coin first, then a quieter sparkle if available.
    const coin=this.buffers[CUES.good.file];
    const sparkle=this.buffers[CUES.combo.file];
    const rate=extra.rate||1;
    if(coin)this.playBuffer(ctx,coin,{rate:1.04*rate,gain:extra.gain??.78,when:0});
    else this.playMoneyPlink(ctx,{rate:1.08*rate,gain:.34});
    if(sparkle)this.playBuffer(ctx,sparkle,{rate:CUES.combo.rate*rate,gain:.18,when:.015});
    return true;
   }
   const cue=CUES[kind];
   if(cue&&this.buffers[cue.file]){
    this.playBuffer(ctx,this.buffers[cue.file],{rate:extra.rate||cue.rate,gain:extra.gain??cue.gain,when:extra.when||0});
    return true;
   }
   if(kind==='start')return this.playMoneyPlink(ctx,{rate:.92,gain:.2});
   return false;
  }
 }
 root.CoinAudio=CoinAudio;
})(typeof window==='undefined'?globalThis:window);
