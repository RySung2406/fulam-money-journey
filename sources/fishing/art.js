/* Original FuLam vector artwork. No third-party image or audio assets. */
window.FuLamArt = (() => {
  'use strict';
  const sprites = new Map();
  const backgrounds = new Map();
  const palettes = {
    coin: ['#fff2a7', '#ffcb4e', '#b66a1f', '#ffed93'],
    save: ['#c2ffe2', '#40dca3', '#087b70', '#ffe4a1'],
    fund: ['#e8d9ff', '#b39af4', '#5143a4', '#aaf7f1'],
    stock: ['#ffe4b3', '#ff8c6b', '#b54462', '#ffe1a2'],
    whale: ['#95efdf', '#269b99', '#075e73', '#ffd77e'],
    shark: ['#d9f4ff', '#78bce4', '#254b79', '#ffb98a'],
    ray: ['#b1fff2', '#38c8bb', '#185d7a', '#ffe695'],
    bond: ['#f0e5b4', '#9ecb7e', '#3c7252', '#ffe4a0'],
    crypto: ['#ffe0fb', '#c37bff', '#6039a1', '#98f4ff'],
    gold: ['#fff3a1', '#efbf4b', '#ad632a', '#ffdf86']
  };
  const TAU = Math.PI * 2;
  const ellipse = (c, x, y, rx, ry, fill, stroke, width = 1) => {
    c.beginPath(); c.ellipse(x, y, rx, ry, 0, 0, TAU);
    if (fill) { c.fillStyle = fill; c.fill(); }
    if (stroke) { c.strokeStyle = stroke; c.lineWidth = width; c.stroke(); }
  };
  const path = (c, d, fill, stroke, width = 1) => {
    const p = new Path2D(d);
    if (fill) { c.fillStyle = fill; c.fill(p); }
    if (stroke) { c.strokeStyle = stroke; c.lineWidth = width; c.stroke(p); }
  };
  const gradient = (c, x1, y1, x2, y2, stops) => {
    const g = c.createLinearGradient(x1, y1, x2, y2);
    stops.forEach(([s, col]) => g.addColorStop(s, col)); return g;
  };

  function makeSprite(type, tailOnly = false) {
    const key = `${type}:${tailOnly}`;
    if (sprites.has(key)) return sprites.get(key);
    const canvas = document.createElement('canvas');
    canvas.width = 384; canvas.height = 288;
    const c = canvas.getContext('2d');
    c.translate(192, 144); c.scale(2, 2);
    c.lineCap = c.lineJoin = 'round';
    const p = palettes[type] || palettes.coin;
    const body = gradient(c, -15, -37, 12, 42, [[0,p[0]],[0.34,p[1]],[0.8,p[2]],[1,p[1]]]);
    const fin = gradient(c,-70,-35,-24,32,[[0,p[0]],[0.38,p[1]],[1,p[2]]]);
    if (tailOnly) {
      if (type === 'whale') {
        path(c,'M -38 -2 C -52 -7 -62 -21 -83 -24 Q -78 -3 -60 1 Q -77 7 -83 25 C -61 23 -50 9 -38 7 Z',fin,p[2],1.5);
        path(c,'M -48 3 Q -63 -2 -76 -17 M -48 4 Q -64 10 -76 20',null,'#d4fff055',1.5);
      } else if (type === 'shark') {
        path(c,'M -37 0 Q -61 -16 -68 -43 Q -80 -21 -58 3 Q -75 7 -78 29 Q -57 21 -37 7 Z',fin,p[2],1.4);
      } else if (type === 'ray') {
        path(c,'M -23 0 Q -48 -8 -64 5 T -88 1',null,p[2],4);
        path(c,'M -23 0 Q -48 -8 -64 5 T -88 1',null,p[0],1.2);
      } else if (type === 'bond') {
        path(c,'M -34 -2 L -57 0 L -34 7 Z',fin,p[2],1);
      } else if (type === 'crypto' || type === 'gold') {
        // Their curled tails / tendrils are part of the body sprite.
      } else if (type === 'fund') {
        path(c,'M -35 -2 Q -60 -8 -85 -2 Q -68 1 -58 6 Q -47 7 -35 3 Z',p[2]);
        path(c,'M -42 1 Q -68 -2 -84 -2',null,p[0],1.5);
      } else {
        path(c,'M -36 -3 Q -52 -10 -75 -28 Q -82 -13 -71 0 Q -83 15 -75 29 Q -54 13 -36 5 Z',fin,p[2],1.4);
        for (let i = -2; i <= 2; i++) path(c,`M -41 1 Q -55 ${i*4} -74 ${i*10}`,null,p[0]+'88',1.1);
      }
      sprites.set(key,canvas); return canvas;
    }

    c.shadowColor='#001d31aa'; c.shadowBlur=6; c.shadowOffsetY=4;
    if (type === 'ray') {
      // Broad manta wings carry a diversified ETF basket, with a flowing whip tail.
      path(c,'M -31 0 Q -37 -17 -61 -63 Q -19 -54 7 -29 Q 26 -18 45 -14 L 59 -5 L 53 0 L 59 5 L 45 14 Q 26 18 7 29 Q -19 54 -61 63 Q -37 17 -31 0 Z',body,p[2],1.8);
      c.shadowColor='transparent';
      path(c,'M -46 -46 Q -7 -36 28 -10 M -46 46 Q -7 36 28 10',null,p[0]+'99',2);
      for(let i=0;i<3;i++) {
        path(c,`M ${-39+i*10} -${34-i*6} Q -4 -15 17 -5 M ${-39+i*10} ${34-i*6} Q -4 15 17 5`,null,'#d9fff744',1.1);
      }
      ellipse(c,0,0,29,21,'#103b6466','#e4fff4aa',1.5);
      const chart=['#ffd77d','#a6e5ff','#ddaaff'];
      for(let i=0;i<3;i++) {
        c.fillStyle=chart[i];c.beginPath();c.roundRect(-17+i*11,-9+(i===1?3:0),8,16-(i===1?3:0),2);c.fill();
      }
      c.font='bold 10px sans-serif';c.textAlign='center';c.fillStyle='#ecfff5';c.fillText('ETF',0,17);
    } else if (type === 'bond') {
      // Coupon-bond turtle: steady armour, not a risk-free guarantee.
      for(const side of [-1,1]) {
        path(c,`M -22 ${side*15} Q -48 ${side*27} -50 ${side*45} Q -27 ${side*42} -13 ${side*25} Z`,fin,p[2],1.3);
        path(c,`M 17 ${side*13} Q 39 ${side*28} 33 ${side*42} Q 17 ${side*36} 6 ${side*25} Z`,fin,p[2],1.3);
      }
      ellipse(c,47,0,22,16,fin,p[2],1.5);
      ellipse(c,-4,0,44,33,body,p[2],2);
      c.shadowColor='transparent';
      path(c,'M -31 -17 L -8 -28 L 19 -19 L 29 1 L 13 24 L -13 27 L -36 9 Z','#2d654aaa','#e7f6b3aa',1.6);
      path(c,'M -8 -28 L -7 -9 L 8 2 L 29 1 M -7 -9 L -29 -4 L -36 9 M -29 -4 L -31 -17 M 8 2 L 1 20 L 13 24 M 1 20 L -13 27',null,'#e3f5b566',1.5);
      c.fillStyle='#fff0c5';c.strokeStyle='#766637';c.lineWidth=1.2;c.beginPath();c.roundRect(-20,-13,34,25,4);c.fill();c.stroke();
      path(c,'M -14 -5 L 8 -5 M -14 0 L 3 0 M -14 5 L -4 5',null,'#67734d',1.8);
      ellipse(c,8,5,4,4,'#d3aa43','#fff2a4',1);
    } else if (type === 'crypto') {
      // Volatility jellyfish: translucent bell, jagged price path and trailing ribbons.
      for(let i=0;i<5;i++) {
        const yy=-27+i*13;
        path(c,`M -9 ${yy} C -31 ${yy-17} -39 ${yy+21} -55 ${yy+4} S -78 ${yy+9} -85 ${yy-4}`,null,i%2?'#d6a4ef':'#a7edee',2.4-i*.2);
      }
      path(c,'M -19 -37 Q 32 -55 60 -7 Q 65 0 60 7 Q 32 55 -19 37 Q -2 23 -17 12 Q -2 0 -17 -12 Q -2 -23 -19 -37 Z',body,p[2],1.8);
      c.shadowColor='transparent';
      path(c,'M -5 -29 Q 31 -35 48 -9 M -4 29 Q 31 35 48 9',null,'#ffe5ff99',2);
      ellipse(c,18,0,22,25,'#3b267c66','#edc7ff88',1.5);
      path(c,'M 0 8 L 9 -7 L 18 9 L 27 -12 L 36 -1',null,'#fff3aa',3);
      ellipse(c,18,-30,3,3,'#b9fbff');
    } else if (type === 'gold') {
      // Bullion seahorse with a coiled tail and layered gold-bar plates.
      path(c,'M 6 -50 Q 30 -61 39 -41 L 62 -34 L 58 -22 L 36 -25 Q 26 -17 28 -3 Q 31 16 15 25 Q -2 33 -6 44 Q -12 59 -27 51 Q -39 44 -31 32 Q -24 25 -17 34 Q -12 43 -22 43',body,p[2],2);
      c.shadowColor='transparent';
      path(c,'M 7 -33 L -6 -38 L -3 -21 L -17 -22 L -11 -4 L -22 -1 L -12 13 L -21 21 L -6 28',fin,p[2],1.5);
      path(c,'M 19 -11 Q 42 1 40 16 Q 23 12 15 1 Z',fin,p[2],1);
      path(c,'M 13 -40 L 17 -48 L 24 -40 M 22 -18 Q 3 -12 5 6 Q 5 23 -6 30',null,'#fff3ad99',2.2);
      for(let i=0;i<4;i++) {
        const yy=-19+i*10;
        path(c,`M 4 ${yy} L 16 ${yy-2} L 20 ${yy+4} L 7 ${yy+6} Z`,'#ffdd77','#a26c2e',1);
      }
      c.font='bold 9px sans-serif';c.fillStyle='#8b5427';c.textAlign='center';c.fillText('Au',13,9);
    } else if (type === 'fund') {
      path(c,'M -37 0 Q -21 -15 -47 -58 Q -6 -52 16 -31 Q 33 -14 56 0 Q 28 11 12 29 Q -8 50 -47 58 Q -20 13 -37 0 Z',body,p[2],1.8);
      c.shadowColor='transparent';
      path(c,'M -32 -42 Q 4 -30 39 -3 M -32 42 Q 4 30 39 3',null,p[0]+'88',2);
      path(c,'M -20 -35 Q 2 -25 27 -6 M -20 35 Q 2 25 27 6',null,p[0]+'44',1.3);
      ellipse(c,7,0,34,23,body,p[2],1);
      // A segmented portfolio wheel makes the pooled fund recognisable.
      ellipse(c,7,0,17,17,'#f1d88e','#fff5c8',1.4);
      c.beginPath();c.moveTo(7,0);c.arc(7,0,17,-Math.PI/2,Math.PI*.16);c.closePath();c.fillStyle='#88e4d2';c.fill();
      c.beginPath();c.moveTo(7,0);c.arc(7,0,17,Math.PI*.16,Math.PI);c.closePath();c.fillStyle='#d5b1fb';c.fill();
      path(c,'M 7 -17 L 7 0 L -10 0 M 7 0 L 22 8',null,'#514378',1.4);
    } else if (type === 'whale') {
      path(c,'M -42 -9 Q -25 -27 8 -32 Q 55 -38 72 -13 Q 83 5 67 24 Q 48 42 6 34 Q -26 30 -42 9 Z',body,p[2],1.6);
      c.shadowColor='transparent';
      path(c,'M -30 17 Q 5 38 54 25 Q 71 21 75 9 Q 64 35 26 36 Q -9 35 -30 17 Z','#c5efce99');
      path(c,'M -13 5 Q 9 17 9 47 Q -13 40 -23 17 Z',fin,p[2],1);
      path(c,'M -12 -28 L 4 -44 Q 13 -43 21 -30',p[2]);
      for (let i = 0; i < 4; i++) path(c,`M ${17+i*9} 25 Q ${20+i*8} 30 ${26+i*8} 30`,null,'#256a7190',1);
      // A little captain's golden crown makes the boss silhouette distinct.
      path(c,'M 25 -27 L 22 -44 L 32 -38 L 39 -48 L 45 -38 L 55 -44 L 52 -27 Z','#f7c85d','#fff1b6',1.2);
      ellipse(c,38,-32,2.2,2.2,'#26a99b');
      // Treasury vault door with gold spokes.
      ellipse(c,8,-1,20,21,'#103f5366','#e5bf70',2.2);
      ellipse(c,8,-1,13,14,null,'#ffe69a',1.2);
      ellipse(c,8,-1,4,4,'#ffe69a');
      for(let i=0;i<4;i++){const a=i*TAU/4;path(c,`M ${8+Math.cos(a)*4} ${-1+Math.sin(a)*4} L ${8+Math.cos(a)*12} ${-1+Math.sin(a)*12}`,null,'#ffe69a',2);}
    } else if (type === 'shark') {
      path(c,'M -47 -7 Q -16 -22 23 -19 L 74 -3 Q 52 22 13 22 Q -24 19 -47 7 Z',body,p[2],1.8);
      c.shadowColor='transparent';
      path(c,'M -8 -19 Q 3 -45 17 -48 L 23 -18 Z',fin,p[2],1.4);
      path(c,'M -6 12 Q 7 36 26 42 L 20 17 Z',fin,p[2],1.2);
      path(c,'M -30 9 Q 21 27 66 3 Q 49 23 9 22 Z','#f6c9df99');
      for(let i=0;i<3;i++) path(c,`M ${15-i*6} -4 Q ${11-i*6} 4 ${15-i*6} 10`,null,'#6b3b79',1.5);
      path(c,'M 46 8 Q 55 12 65 2',null,'#532847',2);
      path(c,'M 49 9 L 51 13 L 54 10 L 57 11 L 60 7','#fff0da');
      // Fast market shark: forward chevrons and a deliberately jagged price stripe.
      path(c,'M -33 -6 L -23 0 L -33 6 M -20 -7 L -10 0 L -20 7',null,'#d3f6ff99',2);
      path(c,'M -9 6 L -2 -4 L 5 4 L 12 -8 L 19 -2',null,'#ffd58d',2.3);
    } else {
      path(c,'M -24 -22 Q -21 -45 6 -41 Q 19 -34 24 -24 Z',fin,p[2],1.2);
      path(c,'M -24 22 Q -14 41 8 38 L 20 23 Z',fin,p[2],1.2);
      path(c,'M -42 -5 Q -17 -39 17 -30 Q 49 -29 64 -5 Q 69 2 61 10 Q 43 31 10 31 Q -20 33 -42 6 Z',body,p[2],1.8);
      c.shadowColor='transparent';
      // Iridescent, individually curved scales survive small sprite sizes.
      for(let row=-2;row<=2;row++) for(let col=0;col<4;col++) {
        const sx=-22+col*11+(row%2)*5,sy=row*9;
        if (sx < 3) path(c,`M ${sx-3} ${sy-4} Q ${sx+4} ${sy} ${sx-3} ${sy+4}`,null,p[0]+'42',1);
      }
      path(c,'M -8 5 Q -2 17 -19 28 Q -31 11 -8 5 Z',fin,p[0]+'77',1);
      path(c,'M -28 -12 Q -3 -30 29 -19',null,p[0]+'99',2.5);
      if(type==='coin') {
        ellipse(c,8,0,17,20,'#bd7b2c','#ffef9e',2);
        ellipse(c,8,0,12.5,16,'#eeb344','#fff1a855',1);
        c.font='bold 25px Georgia'; c.textAlign='center';c.textBaseline='middle';c.fillStyle='#fff1b4';c.fillText('$',8,1);
      } else if(type==='save') {
        path(c,'M -5 -10 L 10 -19 L 27 -10 Z','#fff0b3','#e4ffdf',1);
        for(let i=0;i<3;i++)path(c,`M ${i*10-1} -7 L ${i*10-1} 10`,null,'#fff1b9',3);
        path(c,'M -6 13 L 28 13',null,'#fff1b9',3);
      } else {
        for(const [x,top,bottom,col] of [[-5,-10,12,'#defac2'],[6,-4,16,'#7e2e4e'],[17,-16,6,'#defac2'],[28,-20,0,'#defac2']]) {
          path(c,`M ${x} ${top-4} L ${x} ${bottom+4}`,null,col,1.2);
          c.fillStyle=col;c.fillRect(x-3,top,6,bottom-top);
        }
      }
      path(c,'M 50 14 Q 56 17 60 10',null,p[2],1.5);
    }
    const ex=({fund:35,whale:53,shark:46,ray:40,bond:53,crypto:43,gold:30})[type]??45;
    const ey=({fund:-8,whale:-1,shark:-4,ray:-9,bond:-5,crypto:-10,gold:-38})[type]??-6;
    ellipse(c,ex,ey,5.8,6.8,'#faffed',p[2],0.8);
    ellipse(c,ex+1.5,ey+0.6,3.3,4.3,'#153749');
    ellipse(c,ex+2.1,ey-1.4,1.5,1.7,'#ffffff');
    if(type==='shark') path(c,`M ${ex-6} ${ey-9} L ${ex+5} ${ey-6}`,null,'#5f315c',3);
    sprites.set(key,canvas); return canvas;
  }

  function drawFish(c,f,time) {
    const type=palettes[f.type]?f.type:'coin', s=(f.size||25)/54;
    const wave=Math.sin(time*(type==='shark'?10:type==='ray'?3:6)+(f.phase||0));
    c.save();c.translate(f.x,f.y);c.rotate(f.angle||0);
    // Flip the image vertically for leftward swimmers so their fins stay upright.
    const a=((f.angle||0)%TAU+TAU)%TAU;
    if(a>Math.PI/2&&a<Math.PI*1.5)c.scale(1,-1);
    c.scale(s,s);
    if(type==='ray')c.scale(1,1+wave*.055);
    if(type==='crypto')c.scale(1+wave*.045,1-wave*.035);
    if(type==='shark'){
      c.save();c.globalAlpha=.18;c.strokeStyle='#b6edff';c.lineWidth=1.4;
      for(let i=0;i<3;i++){c.beginPath();c.moveTo(-65,-16+i*16);c.lineTo(-88-(i%2)*5,-16+i*16);c.stroke();}c.restore();
    }
    if(f.hit>0){c.shadowColor='#fff8c8';c.shadowBlur=18;}
    c.save();c.translate(-36,0);c.rotate(wave*(type==='whale'?.09:.15));c.translate(36,0);
    c.drawImage(makeSprite(type,true),-96,-72,192,144);c.restore();
    c.drawImage(makeSprite(type,false),-96,-72,192,144);
    if(f.hit>0){c.globalAlpha=Math.min(.35,f.hit*3);ellipse(c,0,0,46,27,'#fff8d6');}
    c.restore();
  }

  function buildBackground(w,h) {
    const canvas=document.createElement('canvas');canvas.width=w;canvas.height=h;
    const c=canvas.getContext('2d');
    c.fillStyle=gradient(c,0,0,0,h,[[0,'#0c565e'],[.25,'#073a48'],[.7,'#062935'],[1,'#051f29']]);c.fillRect(0,0,w,h);
    const glow=c.createRadialGradient(w*.52,-h*.08,0,w*.52,h*.1,w*.75);glow.addColorStop(0,'#4bc5b535');glow.addColorStop(.5,'#2caba515');glow.addColorStop(1,'#05263300');c.fillStyle=glow;c.fillRect(0,0,w,h);
    // Submerged skyline, rendered as soft reef-like silhouettes.
    c.fillStyle='#093c43';
    for(let i=0;i<19;i++){
      const x=i*w/18,hh=(.05+((i*17)%9)/70)*h,bw=w/23;
      c.beginPath();c.roundRect(x-bw/2,h-hh,bw,hh+10,[7,7,0,0]);c.fill();
      if(i%3===0){c.fillStyle='#155354';c.fillRect(x-bw*.18,h-hh+12,3,hh*.5);c.fillStyle='#093c43';}
    }
    path(c,`M 0 ${h*.88} Q ${w*.19} ${h*.83} ${w*.34} ${h*.94} Q ${w*.65} ${h*.86} ${w} ${h*.9} L ${w} ${h} L 0 ${h} Z`,'#0a343a');
    path(c,`M 0 ${h*.96} Q ${w*.28} ${h*.86} ${w*.49} ${h*.99} Q ${w*.79} ${h*.9} ${w} ${h*.98} L ${w} ${h} L 0 ${h} Z`,'#103d3e');
    // Coral branches and translucent aquatic fronds.
    const plant=(x,y,height,col,seed)=>{
      c.save();c.translate(x,y);c.strokeStyle=col;c.lineCap='round';
      for(let j=-2;j<=2;j++){
        const xx=j*height*.19,top=-height*(.55+(j+seed+5)%3*.2);
        c.lineWidth=height*.055;
        c.beginPath();c.moveTo(0,5);c.bezierCurveTo(xx*.4,-height*.3,xx*1.3,top*.7,xx,top);c.stroke();
        for(let k=1;k<4;k++){const yy=top*k/4;c.lineWidth=height*.025;c.beginPath();c.moveTo(xx*k/4,yy);c.quadraticCurveTo(xx*k/4+(j>0?9:-9),yy-6,xx*k/4+(j>0?13:-13),yy-15);c.stroke();}
      } c.restore();
    };
    plant(w*.04,h*.99,h*.16,'#256663',1);plant(w*.94,h*.99,h*.2,'#266260',2);plant(w*.13,h*1.04,h*.12,'#397567',3);plant(w*.83,h*1.05,h*.11,'#476b58',1);
    // Sunken golden treasury rings, subtle enough to keep gameplay readable.
    c.save();c.globalAlpha=.38;c.translate(w*.06,h*.87);c.rotate(-.22);
    ellipse(c,0,0,25,19,'#756044','#b4a16b',3);ellipse(c,0,0,17,12,'#143e43','#887a52',2);c.restore();
    for(let i=0;i<34;i++){
      const x=((i*137.17)%997)/997*w,y=h*.94+((i*47)%83)/83*h*.06;
      ellipse(c,x,y,1.7+(i%3),.8,'#6a85634d');
    }
    return canvas;
  }

  function drawBackground(c,w,h,time,quality=1){
    const key=w+'x'+h;
    if(!backgrounds.has(key)){backgrounds.clear();backgrounds.set(key,buildBackground(w,h));}
    c.drawImage(backgrounds.get(key),0,0,w,h);
    c.save();
    for(let i=0;i<4;i++){
      const x=w*(.13+i*.22)+Math.sin(time*.15+i)*w*.025;
      const g=gradient(c,x,0,x,h*.82,[[0,'#b0ffe014'],[1,'#83f8d000']]);
      path(c,`M ${x} 0 L ${x+w*.035} 0 L ${x+w*.25} ${h} L ${x-w*.12} ${h} Z`,g);
    }
    const count=quality<.7?10:22;
    for(let i=0;i<count;i++){
      const speed=8+(i*13%17),x=((i*151.7)%991)/991*w+Math.sin(time*.34+i*2.7)*7;
      const y=h-((time*speed+i*71.1)%(h+25)),r=1.1+(i%4)*.65;
      ellipse(c,x,y,r,r*1.15,null,'#9be7d330',.7);
      if(i%3===0)ellipse(c,x-r*.25,y-r*.35,r*.25,r*.25,'#cafff450');
    }
    c.restore();
  }

  function drawCannon(c,x,y,angle,level=1,recoil=0,time=0,weaponKind){
    c.save();c.translate(x,y);
    const kind=weaponKind||(['single','single','double','spread','orb','beam','spread','orb','beam','spread','orb','hybrid'][level-1]||'single');
    const accent=kind==='beam'?'#8cf4ff':kind==='orb'?'#dab7ff':kind==='hybrid'?'#ffd58c':kind==='spread'?'#9be8cf':'#ffdc85';
    if(level>=7){
      c.save();c.globalAlpha=.3;c.strokeStyle=accent;c.lineWidth=1.5;
      c.beginPath();c.ellipse(0,7,54,35,0,0,TAU);c.stroke();
      for(let i=0;i<4;i++){const a=i*TAU/4+time*.2;ellipse(c,Math.cos(a)*54,7+Math.sin(a)*35,2.5,2.5,accent);}
      c.restore();
    }
    c.shadowColor='#00141d';c.shadowBlur=20;c.shadowOffsetY=7;
    ellipse(c,0,13,49,23,'#092b36','#3c6663',2);
    ellipse(c,0,7,40,29,gradient(c,0,-24,0,38,[[0,'#ffe7a3'],[.4,'#b7904d'],[.55,'#725a35'],[1,'#c7a45c']]),'#f9d687',1.2);
    c.shadowColor='transparent';
    ellipse(c,0,5,32,23,'#113d45','#7eaf9b',2);
    for(let i=0;i<8;i++){
      const a=i*TAU/8;
      ellipse(c,Math.cos(a)*34,5+Math.sin(a)*25,2.3,2.3,'#fff1b7');
    }
    c.save();c.rotate(angle);c.translate(-Math.min(1,recoil)*6,0);
    const barrel=(yaw=0,offset=0,length=52,width=15)=>{
      c.save();c.rotate(yaw);c.translate(0,offset);
      c.fillStyle=gradient(c,0,-width/2,0,width/2,[[0,'#ffeab1'],[.32,'#b99758'],[.7,'#476261'],[1,'#b6b88e']]);
      c.strokeStyle='#e9d6a0';c.lineWidth=1.2;c.beginPath();c.roundRect(7,-width/2,length,width,4);c.fill();c.stroke();
      c.fillStyle='#123e48';c.beginPath();c.roundRect(19,-width*.27,length*.4,width*.54,2);c.fill();
      c.fillStyle=accent;c.fillRect(length-3,-width*.45,7,width*.9);
      c.fillStyle='#082c39';c.fillRect(length+3,-width*.31,3,width*.62);
      if(recoil>.2){c.shadowColor=accent;c.shadowBlur=9;ellipse(c,length+9,0,3+recoil*3,width*.3,'#e3fff2');c.shadowColor='transparent';}
      c.restore();
    };
    const coil=()=>{
      c.fillStyle='#153c56';c.strokeStyle='#c4b0e8';c.lineWidth=2;c.beginPath();c.roundRect(8,-19,49,38,12);c.fill();c.stroke();
      for(let i=0;i<4;i++)ellipse(c,20+i*10,0,5,20-i*.6,null,i%2?'#bda1f7':'#e3ccff',2.3);
      ellipse(c,56,0,12,21,'#213b60','#e6cdff',2);
      ellipse(c,60,0,8,15,'#ac8cf755','#e8d6ff',1.2);
      const pulse=5+Math.sin(time*5)*1.3+recoil*3;
      c.shadowColor='#bd9aff';c.shadowBlur=12;ellipse(c,62,0,pulse,pulse,'#ead7ff');c.shadowColor='transparent';
    };
    const beam=()=>{
      c.fillStyle='#164852';c.strokeStyle='#b2e7d9';c.lineWidth=1.8;c.beginPath();c.roundRect(7,-15,35,30,7);c.fill();c.stroke();
      for(const sy of [-1,1]){
        path(c,`M 28 ${sy*10} L 46 ${sy*20} L 67 ${sy*15} L 68 ${sy*10} L 47 ${sy*12} L 34 ${sy*5} Z`,'#b9d4bc','#e7f5d3',1.2);
        path(c,`M 39 ${sy*12} L 49 ${sy*16} L 64 ${sy*12}`,null,accent,2);
      }
      c.shadowColor='#8cf4ff';c.shadowBlur=11;
      path(c,'M 24 0 L 64 0',null,'#69e3f5',6+recoil*3);
      path(c,'M 29 0 L 66 0',null,'#e5ffff',2.2);
      ellipse(c,41,0,6,6,'#dbffff');c.shadowColor='transparent';
    };
    if(kind==='spread'){
      for(const yaw of [-.25,0,.25])barrel(yaw,0,yaw?47:58,12);
      path(c,'M 30 -25 Q 42 0 30 25',null,accent,2.8);
    }else if(kind==='double'){
      barrel(0,-11,53,14);barrel(0,11,53,14);
    }else if(kind==='orb')coil();
    else if(kind==='beam')beam();
    else if(kind==='hybrid'){
      barrel(-.28,0,58,12);barrel(.28,0,58,12);beam();
      ellipse(c,22,0,14,19,null,'#f1ca81',2.5);
    }else barrel(0,0,57,23);
    c.restore();
    ellipse(c,0,0,21,21,gradient(c,-12,-19,15,22,[[0,'#a1e1c3'],[.3,'#337d77'],[1,'#0b3c48']]),'#e9c87c',2);
    ellipse(c,0,0,13,13,'#103944','#69bda4',1);
    c.fillStyle=accent;c.font='bold 20px Georgia';c.textAlign='center';c.textBaseline='middle';c.fillText('$',0,1);
    // Ring displays cannon upgrades without requiring tiny text.
    for(let i=0;i<12;i++){const a=Math.PI*.15+i*Math.PI*.7/11;ellipse(c,Math.cos(a)*43,7+Math.sin(a)*29,1.7,1.7,i<level?accent:'#426463');}
    c.restore();
  }

  function drawCoin(c,x,y,r,spin=0){
    c.save();c.translate(x,y);c.scale(Math.max(.18,Math.abs(Math.cos(spin))),1);
    c.fillStyle=gradient(c,0,-r,0,r,[[0,'#fff6bd'],[.25,'#ffdc69'],[.65,'#d79330'],[1,'#ffca59']]);
    c.beginPath();c.arc(0,0,r,0,TAU);c.fill();c.strokeStyle='#fff0a6';c.lineWidth=Math.max(1,r*.08);c.stroke();
    ellipse(c,0,0,r*.72,r*.72,null,'#b67a2e',r*.07);
    c.fillStyle='#8e5a23';c.font=`bold ${r*1.4}px Georgia`;c.textAlign='center';c.textBaseline='middle';c.fillText('$',0,r*.08);
    c.restore();
  }
  return { drawFish, drawBackground, drawCannon, drawCoin };
})();
