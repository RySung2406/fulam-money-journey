'use strict';
// Lightweight canvas effects share the game's animation clock, including pause.
(function(root){
  const rewards = ['coin', 'ribbon', 'star', 'ribbon', 'coin', 'snow'];
  const ribbonColors = ['#7ee3bd', '#ee7680', '#e7bd65'];

  function drawRibbon(ctx, r, spin, color) {
    ctx.rotate(spin);
    ctx.scale(1, .55 + Math.abs(Math.cos(spin)) * .45);
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(-r, -r * .27);
    ctx.quadraticCurveTo(-r * .15, r * .6, r, -r * .3);
    ctx.lineTo(r * .7, r * .45);
    ctx.quadraticCurveTo(0, r, -r, r * .18);
    ctx.fill();
  }

  function drawSnow(ctx, r, spin) {
    ctx.rotate(spin * .28);
    ctx.strokeStyle = '#c2f9ff';
    ctx.lineWidth = Math.max(1, r * .18);
    ctx.lineCap = 'round';
    ctx.beginPath();
    for (let arm = 0; arm < 6; arm++) {
      ctx.moveTo(0, 0);
      ctx.lineTo(0, -r);
      ctx.moveTo(-r * .2, -r * .75);
      ctx.lineTo(0, -r * .55);
      ctx.lineTo(r * .2, -r * .75);
      ctx.rotate(Math.PI / 3);
    }
    ctx.stroke();
  }

  function drawDoubleCut(ctx, cue, progress) {
    const reach = cue.reduced ? 24 : 27 + 43 * (1 - (1 - progress) ** 2);
    ctx.save();
    ctx.translate(cue.x, cue.y);
    ctx.rotate(-.48);
    ctx.globalAlpha = Math.min(1, (1 - progress) * 1.8);
    ctx.lineCap = 'round';
    for (let side = -1; side <= 1; side += 2) {
      ctx.strokeStyle = side === 1 ? '#ffe394' : '#91f1d1';
      ctx.lineWidth = cue.reduced ? 2 : 1.5 + (1 - progress) * 2.5;
      ctx.beginPath();
      ctx.moveTo(-side * reach, side * 9);
      ctx.quadraticCurveTo(0, side * 15, side * reach, -side * 2);
      ctx.stroke();
      ctx.fillStyle = '#fff7d9';
      const x = side * reach, y = -side * 2, r = cue.reduced ? 3 : 5;
      ctx.beginPath();
      ctx.moveTo(x, y - r); ctx.lineTo(x + r * .5, y);
      ctx.lineTo(x, y + r); ctx.lineTo(x - r * .5, y);
      ctx.closePath(); ctx.fill();
    }
    ctx.restore();
  }

  class MoneyEffects {
    constructor(reducedMotion=false){this.reducedMotion=reducedMotion;this.particles=[];this.flashes=[];this.shake=0;}
    clear(){this.particles=[];this.flashes=[];this.shake=0;}
    bump(amount=.35){if(!this.reducedMotion)this.shake=Math.min(1.25,this.shake+amount);}
    tickShake(dt){this.shake=Math.max(0,this.shake-dt*3.4);return this.shake;}
    doubleCut(x,y){
      this.flashes.push({kind:'doubleCut',x,y,age:0,life:this.reducedMotion?.18:.45,reduced:this.reducedMotion});
      this.flashes=this.flashes.slice(-5);
    }
    burst(x,y,good=true,scale=1){
      const count=this.reducedMotion?3:(good?Math.round(17*Math.min(1.45,scale)):7);
      this.flashes.push({x,y,good,age:0,life:this.reducedMotion?.12:.32,scale});
      for(let i=0;i<count;i++){
        const angle=Math.PI*2*(i/count)+(Math.random()-.5)*.24;
        const speed=(85+Math.random()*155)*scale*(this.reducedMotion?.25:1);
        const kind=good?rewards[i%rewards.length]:'ribbon';
        this.particles.push({x,y,vx:Math.cos(angle)*speed,vy:Math.sin(angle)*speed-(this.reducedMotion?12:85)*scale,
          age:0,life:this.reducedMotion?.23:.48+Math.random()*.32,r:(4+Math.random()*4.5)*scale,
          spin:Math.random()*Math.PI*2,turn:(Math.random()>.5?1:-1)*(5+Math.random()*8),
          kind,color:good?ribbonColors[i%ribbonColors.length]:'#d39c91',gravity:(kind==='ribbon'?170:320)*scale});
      }
      this.particles=this.particles.slice(-100);this.flashes=this.flashes.slice(-5);
    }
    draw(ctx,dt){
      for(const f of this.flashes){
        f.age+=dt;const p=Math.min(1,f.age/f.life);
        if(f.kind==='doubleCut'){drawDoubleCut(ctx,f,p);continue;}
        const r=(14+p*(this.reducedMotion?14:47))*f.scale;
        ctx.save();ctx.globalAlpha=(1-p)*.8;
        const glow=ctx.createRadialGradient(f.x,f.y,0,f.x,f.y,r);
        glow.addColorStop(0,f.good?'#fff4c9':'#ffe0d1');glow.addColorStop(.25,f.good?'#ffc95c99':'#f88f6b88');glow.addColorStop(1,'#ffb52b00');
        ctx.fillStyle=glow;ctx.beginPath();ctx.arc(f.x,f.y,r,0,Math.PI*2);ctx.fill();
        ctx.globalAlpha=(1-p)*.75;ctx.strokeStyle=f.good?'#fff0b0':'#ffad93';ctx.lineWidth=2*(1-p)+.5;
        ctx.translate(f.x,f.y);
        ctx.rotate(-.55);
        ctx.beginPath();ctx.ellipse(0,0,r*1.2,r*.3,0,Math.PI*.08,Math.PI*.96);ctx.stroke();
        ctx.beginPath();ctx.ellipse(0,0,r,r*.28,0,Math.PI*1.09,Math.PI*1.9);ctx.stroke();
        ctx.restore();
      }
      this.flashes=this.flashes.filter(f=>f.age<f.life);
      for(const p of this.particles){
        p.age+=dt;p.vy+=p.gravity*dt;p.x+=p.vx*dt;p.y+=p.vy*dt;p.spin+=p.turn*dt;
        const fade=Math.max(0,Math.min(1,(p.life-p.age)/.35));
        ctx.save();ctx.globalAlpha=fade;ctx.translate(p.x,p.y);
        if(p.kind==='ribbon'){
          drawRibbon(ctx,p.r,p.spin,p.color);
        }else if(p.kind==='snow'){
          drawSnow(ctx,p.r,p.spin);
        }else if(p.kind==='star'){
          ctx.rotate(p.spin*.3);ctx.fillStyle='#fff5c4';
          const r=p.r*.6;ctx.beginPath();ctx.moveTo(0,-r);ctx.lineTo(r*.22,-r*.22);ctx.lineTo(r,0);ctx.lineTo(r*.22,r*.22);ctx.lineTo(0,r);ctx.lineTo(-r*.22,r*.22);ctx.lineTo(-r,0);ctx.lineTo(-r*.22,-r*.22);ctx.closePath();ctx.fill();
        }else{
          ctx.rotate(Math.sin(p.spin*.28)*.65);ctx.scale(.18+Math.abs(Math.cos(p.spin))*.82,1);
          const r=p.r;
          ctx.fillStyle='#87501a';ctx.beginPath();ctx.ellipse(1.4,1.8,r,r,0,0,Math.PI*2);ctx.fill();
          ctx.fillStyle='#f3c358';ctx.beginPath();ctx.arc(0,0,r,0,Math.PI*2);ctx.fill();
          ctx.strokeStyle='#ffed9d';ctx.lineWidth=1.2;ctx.stroke();
          ctx.strokeStyle='#b87916';ctx.lineWidth=.8;ctx.beginPath();ctx.arc(0,0,r*.7,0,Math.PI*2);ctx.stroke();
          ctx.strokeStyle='#fff8dd';ctx.globalAlpha=fade*.8;ctx.lineWidth=1.6;ctx.beginPath();ctx.arc(0,0,r*.88,Math.PI*1.08,Math.PI*1.58);ctx.stroke();
        }
        ctx.restore();
      }
      this.particles=this.particles.filter(p=>p.age<p.life);
    }
  }
  root.MoneyEffects=MoneyEffects;
})(typeof window==='undefined'?globalThis:window);
