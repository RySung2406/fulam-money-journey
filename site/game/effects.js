'use strict';
// Lightweight canvas effects share the game's animation clock, including pause.
(function(root){
  class MoneyEffects {
    constructor(reducedMotion=false){this.reducedMotion=reducedMotion;this.particles=[];this.flashes=[];}
    clear(){this.particles=[];this.flashes=[];}
    burst(x,y,good=true,scale=1){
      const count=this.reducedMotion?5:(good?24:14);
      this.flashes.push({x,y,good,age:0,life:this.reducedMotion?.2:.48,scale});
      for(let i=0;i<count;i++){
        const angle=Math.PI*2*(i/count)+(Math.random()-.5)*.24;
        const speed=(100+Math.random()*190)*scale*(this.reducedMotion?.45:1);
        this.particles.push({x,y,vx:Math.cos(angle)*speed,vy:Math.sin(angle)*speed-100*scale,
          age:0,life:this.reducedMotion?.55:.85+Math.random()*.55,r:(6+Math.random()*7)*scale,
          spin:Math.random()*Math.PI*2,turn:(Math.random()>.5?1:-1)*(5+Math.random()*8),
          good,spark:i%4===0,gravity:420*scale});
      }
      this.particles=this.particles.slice(-180);this.flashes=this.flashes.slice(-8);
    }
    draw(ctx,dt){
      for(const f of this.flashes){
        f.age+=dt;const p=Math.min(1,f.age/f.life),r=(20+p*110)*f.scale;
        ctx.save();ctx.globalAlpha=(1-p)*.8;
        const glow=ctx.createRadialGradient(f.x,f.y,0,f.x,f.y,r);
        glow.addColorStop(0,f.good?'#fff4c9':'#ffe0d1');glow.addColorStop(.25,f.good?'#ffc95c99':'#f88f6b88');glow.addColorStop(1,'#ffb52b00');
        ctx.fillStyle=glow;ctx.beginPath();ctx.arc(f.x,f.y,r,0,Math.PI*2);ctx.fill();
        ctx.globalAlpha=(1-p)*.75;ctx.strokeStyle=f.good?'#fff0b0':'#ffad93';ctx.lineWidth=2*(1-p)+.5;
        ctx.beginPath();ctx.ellipse(f.x,f.y,r*.8,r*.8,0,0,Math.PI*2);ctx.stroke();ctx.restore();
      }
      this.flashes=this.flashes.filter(f=>f.age<f.life);
      for(const p of this.particles){
        p.age+=dt;p.vy+=p.gravity*dt;p.x+=p.vx*dt;p.y+=p.vy*dt;p.spin+=p.turn*dt;
        const fade=Math.max(0,Math.min(1,(p.life-p.age)/.35));
        ctx.save();ctx.globalAlpha=fade;ctx.translate(p.x,p.y);
        if(p.spark){
          ctx.rotate(p.spin*.3);ctx.fillStyle=p.good?'#fff5c4':'#ffd2bf';
          const r=p.r*.6;ctx.beginPath();ctx.moveTo(0,-r);ctx.lineTo(r*.22,-r*.22);ctx.lineTo(r,0);ctx.lineTo(r*.22,r*.22);ctx.lineTo(0,r);ctx.lineTo(-r*.22,r*.22);ctx.lineTo(-r,0);ctx.lineTo(-r*.22,-r*.22);ctx.closePath();ctx.fill();
        }else{
          ctx.rotate(Math.sin(p.spin*.28)*.65);ctx.scale(.18+Math.abs(Math.cos(p.spin))*.82,1);
          const r=p.r,face=ctx.createLinearGradient(-r,-r,r,r);
          face.addColorStop(0,p.good?'#fff6b9':'#ffe3ca');face.addColorStop(.35,p.good?'#ffdb64':'#dba383');face.addColorStop(.55,p.good?'#e5a52e':'#a75c42');face.addColorStop(1,p.good?'#ffd66d':'#e2ad89');
          ctx.fillStyle=p.good?'#86500d':'#703526';ctx.beginPath();ctx.ellipse(1.8,2.1,r,r,0,0,Math.PI*2);ctx.fill();
          ctx.fillStyle=face;ctx.beginPath();ctx.arc(0,0,r,0,Math.PI*2);ctx.fill();
          ctx.strokeStyle=p.good?'#ffed9d':'#f8d1ac';ctx.lineWidth=1.2;ctx.stroke();
          ctx.strokeStyle=p.good?'#b87916':'#9b6449';ctx.lineWidth=.8;ctx.beginPath();ctx.arc(0,0,r*.75,0,Math.PI*2);ctx.stroke();
          ctx.fillStyle=p.good?'#986115':'#8c4d36';ctx.font=`bold ${r*1.28}px Georgia,serif`;ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText('$',0,r*.05);
          ctx.strokeStyle='#fff8dd';ctx.globalAlpha=fade*.8;ctx.lineWidth=1.6;ctx.beginPath();ctx.arc(0,0,r*.88,Math.PI*1.08,Math.PI*1.58);ctx.stroke();
        }
        ctx.restore();
      }
      this.particles=this.particles.filter(p=>p.age<p.life);
    }
  }
  root.MoneyEffects=MoneyEffects;
})(typeof window==='undefined'?globalThis:window);
