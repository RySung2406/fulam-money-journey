/* Original FuLam vector artwork. No third-party image or audio assets. */
window.FuLamArt = (() => {
  'use strict';
  const sprites = new Map();
  const backgrounds = new Map();
  const palettes = {
    coin: ['#fff6d4', '#edb579', '#a85a2a', '#fff2c8'],
    save: ['#d9ffe8', '#3db87a', '#1f5a3f', '#edb579'],
    fund: ['#ffe4ef', '#d47aa8', '#7a2d55', '#edb579'],
    stock: ['#ffe6dc', '#e85a4a', '#8b2430', '#fff2c8'],
    whale: ['#dff7ef', '#2a8f88', '#0a4a52', '#edb579'],
    shark: ['#e8f6ff', '#7ab8d9', '#2a4f6e', '#c23b3b'],
    ray: ['#e6fff4', '#4ec4a8', '#1a5d5a', '#edb579'],
    bond: ['#f2edd4', '#7aaa5e', '#2f5a38', '#c23b3b'],
    crypto: ['#ffe8fb', '#d070d0', '#6a3080', '#edb579'],
    gold: ['#fff6c8', '#efbf4b', '#ad632a', '#c23b3b'],
    lantern: ['#b9ffe7', '#228c95', '#173351', '#70ffd3'],
    puffer: ['#f0fcff', '#67bbdf', '#264a74', '#c3f3ff'],
    midas: ['#fff8d6', '#f0d878', '#c4892a', '#c23b3b']
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
  // Small Christmas props drawn in sprite space (origin at fish centre).
  const santaHat = (c, x, y, sc = 1) => {
    c.save(); c.translate(x, y); c.scale(sc, sc);
    path(c, 'M -20 8 L -15 -24 Q 2 -44 24 -12 L 18 10 Z', '#c23b3b', '#fff2c8', 1.4);
    path(c, 'M -22 8 Q 0 16 20 8 L 18 14 Q 0 20 -20 14 Z', '#fffef9', '#edb579', 1.1);
    ellipse(c, 22, -14, 7, 7, '#fffef9', '#edb579', 1.1);
    c.restore();
  };
  const holly = (c, x, y, sc = 1) => {
    c.save(); c.translate(x, y); c.scale(sc, sc);
    path(c, 'M -8 0 Q -14 -10 -2 -12 Q 0 -4 -8 0 Z', '#2f8f5b');
    path(c, 'M 8 0 Q 14 -10 2 -12 Q 0 -4 8 0 Z', '#1f5a3f');
    ellipse(c, 0, 1, 2.4, 2.4, '#c23b3b');
    ellipse(c, -3.5, 3, 1.8, 1.8, '#c23b3b');
    ellipse(c, 3.5, 3, 1.8, 1.8, '#c23b3b');
    c.restore();
  };
  const scarf = (c, x, y, sc = 1, a = '#c23b3b', b = '#fffef9') => {
    c.save(); c.translate(x, y); c.scale(sc, sc);
    c.strokeStyle = a; c.lineWidth = 5; c.lineCap = 'round';
    c.beginPath(); c.moveTo(-18, -2); c.quadraticCurveTo(0, 10, 18, -1); c.stroke();
    c.strokeStyle = b; c.lineWidth = 2; c.setLineDash([4, 5]);
    c.beginPath(); c.moveTo(-16, -1); c.quadraticCurveTo(0, 8, 16, 0); c.stroke(); c.setLineDash([]);
    path(c, 'M 14 0 L 22 14 L 10 10 Z', a);
    path(c, 'M 16 4 L 20 12', null, b, 1.4);
    c.restore();
  };
  const giftBow = (c, x, y, sc = 1) => {
    c.save(); c.translate(x, y); c.scale(sc, sc);
    path(c, 'M 0 0 Q -14 -10 -16 2 Q -8 6 0 0 Q 8 6 16 2 Q 14 -10 0 0 Z', '#c23b3b', '#fff2c8', 1);
    ellipse(c, 0, 1, 3.2, 3.2, '#edb579');
    c.restore();
  };
  const candyCane = (c, x, y, sc = 1, tilt = -.35) => {
    c.save(); c.translate(x, y); c.rotate(tilt); c.scale(sc, sc); c.lineCap = 'round';
    c.strokeStyle = '#fffef9'; c.lineWidth = 7;
    c.beginPath(); c.moveTo(0, 22); c.lineTo(0, -6); c.quadraticCurveTo(0, -22, 14, -22); c.stroke();
    c.strokeStyle = '#c23b3b'; c.lineWidth = 7; c.setLineDash([5, 5]); c.lineDashOffset = 2;
    c.beginPath(); c.moveTo(0, 22); c.lineTo(0, -6); c.quadraticCurveTo(0, -22, 14, -22); c.stroke();
    c.setLineDash([]); c.restore();
  };
  const miniTree = (c, x, y, sc = 1) => {
    c.save(); c.translate(x, y); c.scale(sc, sc);
    path(c, 'M 0 -28 L 16 0 L -16 0 Z', '#1f5a3f');
    path(c, 'M 0 -18 L 12 6 L -12 6 Z', '#2f8f5b');
    path(c, 'M 0 -8 L 9 14 L -9 14 Z', '#3db87a');
    c.fillStyle = '#6b4423'; c.fillRect(-2.5, 14, 5, 8);
    for (const [ox, oy, col] of [[-6, -6, '#c23b3b'], [5, -14, '#edb579'], [0, -22, '#fff2c8'], [-4, 4, '#edb579'], [6, 2, '#c23b3b']]) {
      ellipse(c, ox, oy, 2.2, 2.2, col);
    }
    path(c, 'M 0 -30 L 2 -24 L -2 -24 Z', '#edb579');
    c.restore();
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
      if (type === 'whale' || type === 'midas') {
        path(c,'M -38 -2 C -52 -7 -62 -21 -83 -24 Q -78 -3 -60 1 Q -77 7 -83 25 C -61 23 -50 9 -38 7 Z',fin,p[2],1.5);
        path(c,'M -48 3 Q -63 -2 -76 -17 M -48 4 Q -64 10 -76 20',null,type==='midas'?'#ffe08a66':'#d4fff055',1.5);
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
    if (type === 'lantern') {
      path(c,'M -41 -5 Q -22 -37 16 -29 Q 47 -26 57 1 L 41 1 L 51 13 Q 25 36 -4 29 Q -29 25 -41 7 Z',body,p[2],2);
      c.shadowColor='transparent';
      path(c,'M -12 -27 Q -23 -48 -38 -39 L -33 -25 Z',fin,p[2],2);
      path(c,'M -24 9 Q -33 32 -5 23 L 5 10 Z',fin,p[2],2);
      path(c,'M 11 -26 C 17 -66 56 -65 61 -39',null,p[2],5);
      path(c,'M 11 -26 C 17 -66 56 -65 61 -39',null,p[3],2.2);
      ellipse(c,61,-36,7,9,'#caffd4','#22af97',2);
      for(let i=0;i<5;i++)ellipse(c,-25+i*10,12+Math.sin(i*.7)*4,2.6,2,p[3]);
      path(c,'M 36 4 L 39 8 L 42 4 M 42 1 L 45 5 L 48 1',null,'#e9ffdf',1.5);
    } else if (type === 'puffer') {
      for(let i=0;i<12;i++){
        const a=i*TAU/12;
        c.save();c.rotate(a);
        path(c,'M 31 -8 L 52 -3 L 33 5 Z','#d0f5ff',p[2],1.5);
        c.restore();
      }
      ellipse(c,1,0,44,38,body,p[2],2);
      c.shadowColor='transparent';
      path(c,'M -37 9 Q -9 37 37 9 Q 24 37 3 37 Q -22 37 -37 9 Z','#d9f7ff');
      path(c,'M -12 -4 Q -34 -18 -29 0 Q -22 12 -10 6 Z',fin,p[2],1.5);
      for(const [x,y] of [[-18,-15],[-7,-22],[4,-14],[14,-22],[-5,11]])ellipse(c,x,y,3,2.7,'#256381');
      path(c,'M 34 9 Q 42 13 46 6',null,p[2],2);
      santaHat(c,7,-28,.62);
    } else if (type === 'ray') {
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
    } else if (type === 'whale' || type === 'midas') {
      path(c,'M -42 -9 Q -25 -27 8 -32 Q 55 -38 72 -13 Q 83 5 67 24 Q 48 42 6 34 Q -26 30 -42 9 Z',body,p[2],1.6);
      c.shadowColor='transparent';
      path(c,'M -30 17 Q 5 38 54 25 Q 71 21 75 9 Q 64 35 26 36 Q -9 35 -30 17 Z',type==='midas'?'#ffe9a899':'#c5efce99');
      path(c,'M -13 5 Q 9 17 9 47 Q -13 40 -23 17 Z',fin,p[2],1);
      path(c,'M -12 -28 L 4 -44 Q 13 -43 21 -30',p[2]);
      for (let i = 0; i < 4; i++) path(c,`M ${17+i*9} 25 Q ${20+i*8} 30 ${26+i*8} 30`,null,type==='midas'?'#c4892a90':'#256a7190',1);
      if(type==='midas'){
        santaHat(c,31,-34,.58);
        path(c,'M 52 12 Q 62 14 72 5',null,'#99642d',2);
        path(c,'M -30 -9 Q -15 -27 9 -28',null,'#fff2ad',2.1);
      }else santaHat(c,42,-36,1.45);
      ellipse(c,8,-1,20,21,type==='midas'?'#7a4a1866':'#103f5366','#e5bf70',2.2);
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
    const ex=({fund:35,whale:53,midas:53,shark:46,ray:40,bond:53,crypto:43,gold:30,lantern:30,puffer:26})[type]??45;
    const ey=({fund:-8,whale:-1,midas:-1,shark:-4,ray:-9,bond:-5,crypto:-10,gold:-38,lantern:-10,puffer:-7})[type]??-6;
    ellipse(c,ex,ey,5.8,6.8,'#faffed',p[2],0.8);
    ellipse(c,ex+1.5,ey+0.6,3.3,4.3,'#153749');
    ellipse(c,ex+2.1,ey-1.4,1.5,1.7,'#ffffff');
    if(type==='shark') path(c,`M ${ex-6} ${ey-9} L ${ex+5} ${ey-6}`,null,'#5f315c',3);
    // Bigger Christmas dress-up: every fish gets a santa hat + one prop.
    if(type==='coin'){santaHat(c, 20, -30, 1.05); candyCane(c, -10, 6, .75, .4);}
    else if(type==='save'){santaHat(c, 22, -28, 1); miniTree(c, -14, 4, .7); candyCane(c, 28, 8, .65, .35);}
    else if(type==='fund'){santaHat(c, 24, -28, 1.05); candyCane(c, -14, 2, .75, .5);}
    else if(type==='stock'){santaHat(c, 22, -30, 1.05); candyCane(c, 24, -4, .9, -.2); candyCane(c, -12, 8, .7, .55);}
    else if(type==='shark'){santaHat(c, 30, -32, 1.25); candyCane(c, -20, 6, 1.05, .5);}
    else if(type==='ray'){santaHat(c, 18, -22, 1.1); miniTree(c, -14, -6, .7); candyCane(c, 32, 2, .75, -.15);}
    else if(type==='bond'){santaHat(c, 28, -22, 1.05); miniTree(c, -16, -6, .85); giftBow(c, 10, 8, .7);}
    else if(type==='crypto'){santaHat(c, 28, -24, 1.05); candyCane(c, 38, -2, .75, -.25); for(let i=0;i<3;i++)ellipse(c,-48-i*10, -18+i*12, 2.8, 2.8, i%2?'#c23b3b':'#edb579');}
    else if(type==='gold'){santaHat(c, 22, -48, 1); miniTree(c, 34, -18, .6); candyCane(c, -10, 4, .7, .4);}
    else if(type==='whale'){scarf(c, 10, 18, 1.2, '#c23b3b', '#fffef9'); miniTree(c, -12, -4, .75); candyCane(c, 60, 8, .95, -.15);}
    sprites.set(key,canvas); return canvas;
  }

  function drawFish(c,f,time) {
    const type=palettes[f.type]?f.type:'coin', s=(f.size||25)/54;
    const wave=Math.sin(time*(type==='shark'?10:type==='ray'?3:type==='midas'?4:6)+(f.phase||0));
    if(f.tide?.phase==='charge'){
      const remaining=Math.max(0,f.tide.left/f.tide.duration);
      const broken=Math.min(1,f.tide.damage/f.tide.target);
      c.save();c.translate(f.x,f.y);
      // Gold brackets contract towards the whale. The mint arc fills with player hits.
      c.lineCap='round';c.lineWidth=3;
      const rx=f.size*(1.12+.3*remaining),ry=f.size*(.7+.2*remaining);
      for(const start of [-.65,Math.PI-.65]){
        c.beginPath();c.ellipse(0,0,rx,ry,0,start,start+1.3);c.strokeStyle='#241e28';c.lineWidth=7;c.stroke();
        c.strokeStyle='#ffae70';c.lineWidth=3;c.stroke();
      }
      c.beginPath();c.ellipse(0,0,rx*.95,ry*.94,0,.55,Math.PI-.55);c.strokeStyle='#18433c';c.lineWidth=5;c.stroke();
      if(broken){c.beginPath();c.ellipse(0,0,rx*.95,ry*.94,0,.55,.55+(Math.PI-1.1)*broken);c.strokeStyle='#94ffda';c.lineWidth=4;c.stroke();}
      c.restore();
    }
    c.save();c.translate(f.x,f.y);c.rotate(f.angle||0);
    // Flip the image vertically for leftward swimmers so their fins stay upright.
    const a=((f.angle||0)%TAU+TAU)%TAU;
    if(a>Math.PI/2&&a<Math.PI*1.5)c.scale(1,-1);
    c.scale(s,s);
    if(type==='ray')c.scale(1,1+wave*.055);
    if(type==='crypto')c.scale(1+wave*.045,1-wave*.035);
    if(type==='puffer')c.scale(1+(f.puff||0)*.13,1+(f.puff||0)*.3);
    if(f.tide?.phase==='surge'){
      c.lineCap='round';
      for(const yy of [-14,0,14]){
        c.beginPath();c.moveTo(-48,yy);c.quadraticCurveTo(-85,yy*1.5,-112,yy*1.2);
        c.strokeStyle='#ffdc91aa';c.lineWidth=2.5;c.stroke();
      }
    }
    if(type==='shark'){
      c.save();c.globalAlpha=.18;c.strokeStyle='#b6edff';c.lineWidth=1.4;
      for(let i=0;i<3;i++){c.beginPath();c.moveTo(-65,-16+i*16);c.lineTo(-88-(i%2)*5,-16+i*16);c.stroke();}c.restore();
    }
    if(f.hit>0){c.shadowColor='#fff8c8';c.shadowBlur=18;}
    const tailLift=f.tide?.phase==='charge'?(1-f.tide.left/f.tide.duration)*.75:f.tide?.phase==='surge'?-.4:0;
    c.save();c.translate(-36,0);c.rotate(wave*(type==='whale'?.09:.15)+tailLift);c.translate(36,0);
    c.drawImage(makeSprite(type,true),-96,-72,192,144);c.restore();
    c.drawImage(makeSprite(type,false),-96,-72,192,144);
    if(type==='lantern'){
      const charge=f.beacon||0;
      ellipse(c,61,-36,14+charge*10,14+charge*10,'#72ffc821');
      ellipse(c,61,-36,7+charge*2,7+charge*2,'#76ffd7cc');
      ellipse(c,61,-36,3+charge*2,3+charge*2,'#f3fff0');
      if(f.luring)ellipse(c,61,-36,19+charge*9,19+charge*9,null,'#a4ffccaa',1.7);
    }
    if(f.tide?.phase==='charge'){
      ellipse(c,0,0,18,18,'#6a402bcc','#ffd197',2.2);
      path(c,'M 0 -14 L 3 -4 L 12 0 L 3 4 L 0 14 L -3 4 L -12 0 L -3 -4 Z','#fff3b7');
    }
    if(f.hit>0){c.globalAlpha=Math.min(.35,f.hit*3);ellipse(c,0,0,46,27,'#fff8d6');}
    c.restore();
  }

  function buildBackground(w,h) {
    const canvas=document.createElement('canvas');canvas.width=w;canvas.height=h;
    const c=canvas.getContext('2d');
    // Christmas harbour depths: winter teal water, warm gold glow, festive seabed.
    c.fillStyle=gradient(c,0,0,0,h,[[0,'#163a55'],[.28,'#0b2a3a'],[.7,'#082430'],[1,'#061820']]);c.fillRect(0,0,w,h);
    const glow=c.createRadialGradient(w*.55,-h*.06,0,w*.55,h*.12,w*.7);glow.addColorStop(0,'#edb57933');glow.addColorStop(.45,'#2f8f5b18');glow.addColorStop(1,'#05263300');c.fillStyle=glow;c.fillRect(0,0,w,h);
    c.fillStyle='#0a3340';
    for(let i=0;i<19;i++){
      const x=i*w/18,hh=(.05+((i*17)%9)/70)*h,bw=w/23;
      c.beginPath();c.roundRect(x-bw/2,h-hh,bw,hh+10,[7,7,0,0]);c.fill();
      if(i%3===0){c.fillStyle='#155354';c.fillRect(x-bw*.18,h-hh+12,3,hh*.5);c.fillStyle='#0a3340';}
    }
    path(c,`M 0 ${h*.88} Q ${w*.19} ${h*.83} ${w*.34} ${h*.94} Q ${w*.65} ${h*.86} ${w} ${h*.9} L ${w} ${h} L 0 ${h} Z`,'#0a343a');
    path(c,`M 0 ${h*.96} Q ${w*.28} ${h*.86} ${w*.49} ${h*.99} Q ${w*.79} ${h*.9} ${w} ${h*.98} L ${w} ${h} L 0 ${h} Z`,'#12484f');
    const plant=(x,y,height,col,seed)=>{
      c.save();c.translate(x,y);c.strokeStyle=col;c.lineCap='round';
      for(let j=-2;j<=2;j++){
        const xx=j*height*.19,top=-height*(.55+(j+seed+5)%3*.2);
        c.lineWidth=height*.055;
        c.beginPath();c.moveTo(0,5);c.bezierCurveTo(xx*.4,-height*.3,xx*1.3,top*.7,xx,top);c.stroke();
        for(let k=1;k<4;k++){const yy=top*k/4;c.lineWidth=height*.025;c.beginPath();c.moveTo(xx*k/4,yy);c.quadraticCurveTo(xx*k/4+(j>0?9:-9),yy-6,xx*k/4+(j>0?13:-13),yy-15);c.stroke();}
      } c.restore();
    };
    plant(w*.04,h*.99,h*.16,'#2f8f5b',1);plant(w*.94,h*.99,h*.2,'#1f5a3f',2);plant(w*.13,h*1.04,h*.12,'#34825a',3);plant(w*.83,h*1.05,h*.11,'#2a6f4d',1);
    // Festive seabed props: gifts + Christmas trees.
    for(let i=0;i<5;i++){
      const x=w*(.12+i*.18),y=h*.93,bw=22+(i%2)*5,bh=16+(i%3)*3,fill=['#c23b3b','#2f8f5b','#edb579'][i%3];
      c.fillStyle=fill;c.beginPath();c.roundRect(x-bw/2,y-bh,bw,bh,3);c.fill();
      c.fillStyle='#fff2c8cc';c.fillRect(x-bw/2,y-bh/2-2,bw,5);c.fillRect(x-2.5,y-bh,5,bh);
    }
    const xmasTree=(tx,ty,sc)=>{
      c.fillStyle='#1f5a3f';c.beginPath();c.moveTo(tx,ty-72*sc);c.lineTo(tx+34*sc,ty);c.lineTo(tx-34*sc,ty);c.closePath();c.fill();
      c.fillStyle='#2a6f4d';c.beginPath();c.moveTo(tx,ty-56*sc);c.lineTo(tx+26*sc,ty-10*sc);c.lineTo(tx-26*sc,ty-10*sc);c.closePath();c.fill();
      c.fillStyle='#6b4423';c.fillRect(tx-5*sc,ty,10*sc,14*sc);
      for(const [ox,oy,col] of [[-12,-28,'#c23b3b'],[10,-36,'#edb579'],[0,-48,'#fff2c8'],[-8,-16,'#edb579'],[12,-20,'#c23b3b']]){
        c.fillStyle=col;c.beginPath();c.arc(tx+ox*sc,ty+oy*sc,3.5*sc,0,TAU);c.fill();
      }
    };
    xmasTree(w*.08,h*.9,1.1);xmasTree(w*.92,h*.88,1.25);xmasTree(w*.5,h*.95,.7);
    for(const [cx,cy,sc,tilt] of [[w*.22,h*.9,.9,.15],[w*.38,h*.92,.7,-.2],[w*.62,h*.91,.85,.25],[w*.78,h*.89,.75,-.1]]){
      candyCane(c,cx,cy,sc,tilt);
    }
    c.save();c.globalAlpha=.42;c.translate(w*.06,h*.87);c.rotate(-.22);
    ellipse(c,0,0,25,19,'#756044','#edb579',3);ellipse(c,0,0,17,12,'#143e43','#fff2c8',2);c.restore();
    for(let i=0;i<34;i++){
      const x=((i*137.17)%997)/997*w,y=h*.94+((i*47)%83)/83*h*.06;
      ellipse(c,x,y,1.7+(i%3),.8,'#edb57933');
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
    const count=quality<.7?14:28;
    for(let i=0;i<count;i++){
      const speed=10+(i*13%17),x=((i*151.7)%991)/991*w+Math.sin(time*.34+i*2.7)*7;
      const y=h-((time*speed+i*71.1)%(h+25)),r=1.2+(i%4)*.7;
      ellipse(c,x,y,r,r,'#ffffff2e');
      if(i%3===0)ellipse(c,x-r*.2,y-r*.25,r*.28,r*.28,'#fff4d255');
    }
    c.restore();
  }

  // Cache the enamel, metal and engraved detail at double resolution. Only the
  // barrel rotation, recoil, lamps and water flash change from frame to frame.
  function cannonSprite(key, paint) {
    if (!sprites.has(key)) {
      const icon = document.createElement('canvas');
      icon.width = icon.height = 352;
      const c = icon.getContext('2d');
      c.scale(2, 2);
      c.translate(88, 88);
      c.lineJoin = 'round';
      c.lineCap = 'round';
      paint(c);
      sprites.set(key, icon);
    }
    return sprites.get(key);
  }

  function paintPedestal(c) {
    const brass = gradient(c, 0, -24, 0, 42, [[0,'#fff2bf'],[.28,'#e8bd70'],[.56,'#9d6937'],[.8,'#f6d391'],[1,'#65482f']]);
    const enamel = gradient(c, -10, -26, 8, 35, [[0,'#87c7b7'],[.2,'#417d79'],[.49,'#225a5a'],[.7,'#12393f'],[1,'#102e37']]);
    ellipse(c, 0, 25, 63, 18, '#03182199');
    path(c, 'M -59 3 Q -61 -6 -49 -12 L -37 -17 Q 0 -32 37 -17 L 49 -12 Q 61 -6 59 3 L 58 18 Q 43 36 15 39 L -15 39 Q -43 36 -58 18 Z', brass, '#102932', 2.5);
    path(c, 'M -58 1 Q -52 -17 -27 -23 Q 0 -28 27 -23 Q 52 -17 58 1 L 53 14 Q 38 28 12 31 L -12 31 Q -38 28 -53 14 Z', enamel, '#d8bf86', 1.5);
    path(c, 'M -48 17 Q 0 44 48 17 M -42 25 Q 0 44 42 25', null, '#142f35', 2);
    for (const side of [-1, 1]) {
      c.save();
      c.scale(side, 1);
      path(c, 'M 35 -16 L 47 -14 L 61 0 L 61 13 L 51 21 L 41 21 L 42 9 L 35 3 Z', brass, '#17393c', 1.6);
      path(c, 'M 39 -11 L 47 -9 L 56 2 L 56 10 L 48 15 L 46 7 L 40 0 Z', '#205153', '#ffe3a8', 1);
      path(c, 'M 45 -4 L 50 2 M 46 1 L 51 7', null, '#97e9dd', 1.5);
      ellipse(c, 52, 13, 2, 2, '#1c3438', '#cdad78');
      c.restore();
    }
    ellipse(c, 0, 2, 36, 26, '#102f33', '#ead391', 2.5);
    ellipse(c, 0, 0, 31, 21, enamel, '#315e5d', 2.5);
    for (let i = 0; i < 11; i++) {
      const a = Math.PI * (1.07 + i * .086);
      path(c, `M ${Math.cos(a)*35} ${Math.sin(a)*25+2} L ${Math.cos(a)*40} ${Math.sin(a)*29+2}`, null, '#dfc28a', 1.4);
    }
  }

  const cannonForms = {
    single: 'barrel', bullet: 'barrel', snowflake: 'frost', double: 'twin',
    spread: 'fan', missile: 'fan', orb: 'resonator', bell: 'chime',
    beam: 'prism', candycane: 'candyRail', arc: 'prism', jelly: 'mortar', hybrid: 'carousel'
  };
  const cannonLight = {barrel:'#9ee7ce', twin:'#8beaff', fan:'#8ce9b5', resonator:'#ffd16b', prism:'#ff9d91', carousel:'#f8a4da',
    frost:'#b8f7ff', candyRail:'#ffafa7', chime:'#ffe088', mortar:'#ffa4cb'};

  function paintEmitter(c, form) {
    const glow = cannonLight[form];
    const metal = gradient(c, 0, -16, 0, 16, [[0,'#fcf3cb'],[.18,'#d8b777'],[.37,'#a67d4c'],[.48,'#ffe4a3'],[.68,'#bb8f56'],[1,'#614a36']]);
    const enamel = gradient(c, 0, -14, 0, 14, [[0,'#80aea3'],[.26,'#386d70'],[.5,'#214e53'],[.8,'#12383f'],[1,'#112f35']]);
    function tube(length, width, offset = 0, yaw = 0) {
      c.save();
      c.rotate(yaw);
      c.translate(0, offset);
      c.scale(1, width/18);
      path(c, `M 9 -8 L 21 -11 L 30 -8 L ${length-10} -7 L ${length-5} -10 L ${length} -8 L ${length} 8 L ${length-5} 10 L ${length-10} 7 L 30 8 L 21 11 L 9 8 Z`, metal, '#173038', 1.8);
      path(c, `M 24 -5 L ${length-11} -5 L ${length-15} 4 L 29 6 L 23 3 Z`, enamel, '#e1c291', 1);
      path(c, `M 28 -2 L ${length-14} -2`, null, glow, 2);
      path(c, `M ${length-5} -5 L ${length-5} 5`, null, '#ffe4aa', 2);
      c.fillStyle='#10363c';c.fillRect(length-2,-5,3,10);
      c.restore();
    }
    if (form === 'frost') {
      for (const side of [-1,1]) {
        c.save();c.scale(1,side);
        // Two slim ice lances, with swept cooling fins outside each barrel.
        path(c,'M 9 5 L 23 12 L 17 25 L 39 15 L 51 9 L 33 7 Z','#347786','#bfe7db',1.5);
        path(c,'M 21 19 L 34 12',null,'#baf5ff',1.7);
        path(c,'M 13 2 L 36 3 L 42 5 L 65 3 L 74 7 L 65 11 L 39 10 L 33 13 L 14 12 Z',enamel,'#e2c68a',1.6);
        path(c,'M 38 7 L 62 4 L 74 7 L 62 10 Z','#94e4f2','#efffff',1.2);
        path(c,'M 40 7 L 67 7',null,'#4b9abc',1.3);
        c.restore();
      }
    } else if (form === 'candyRail') {
      // Curved rails leave daylight between the two ruby laser lenses.
      for (const side of [-1,1]) {
        c.save();c.scale(1,side);
        const rail='M 7 4 Q 26 3 40 13 Q 50 21 61 14 L 71 7 L 75 9 L 75 14 L 64 22 Q 48 31 32 20 L 17 13 L 7 13 Z';
        path(c,rail,'#fae7cd','#744840',2.2);
        c.save();c.clip(new Path2D(rail));
        for (const x of [27,42,57,72]) path(c,`M ${x} 1 l 8 0 -18 28 -8 0 Z`,'#cb4751');
        c.restore();
        path(c,'M 19 6 Q 31 7 41 15 Q 51 22 62 15 L 70 10',null,'#fff9d9',1.5);
        ellipse(c,73,11,3.1,4.5,'#a12548','#ffdaa3',1.6);
        ellipse(c,74,11,1.8,2.6,'#fff2e0');
        c.restore();
      }
      path(c,'M 15 0 L 31 -7 L 46 0 L 31 7 Z','#ab3e4e','#ebc995',1.4);
      path(c,'M 24 0 L 32 -3 L 41 0 L 32 2 Z','#ffe9c5');
    } else if (form === 'chime') {
      // The bell skirt opens forward so its lip spans the piercing volley.
      path(c,'M 9 -7 L 29 -8 C 46 -8 55 -11 65 -20 L 72 -21 L 73 21 L 65 20 C 53 12 45 9 29 8 L 9 7 Z',metal,'#503f32',2.2);
      path(c,'M 33 -4 Q 53 -4 66 -14 L 69 -13 Q 52 -2 34 -1 Z','#fff1b2');
      for (const [x,r] of [[24,9],[31,9],[55,14]]) ellipse(c,x,0,2.3,r,null,'#b27d44',1.7);
      ellipse(c,71,0,5,21,'#6d4936','#ffdc88',2.3);
      ellipse(c,72,0,2.8,16,'#362e30','#bd8349',1.2);
      path(c,'M 67 -1 L 75 -1 L 77 1 L 67 2 Z','#e6bd69');
      ellipse(c,77,0,3.3,4.3,'#ffd78b','#9b6a3c',1);
    } else if (form === 'mortar') {
      // A broad, braced blast tube with a visible revolving candy magazine.
      path(c,'M 8 -12 L 18 -24 L 38 -25 L 49 -16 L 63 -15 L 67 -22 L 75 -22 L 75 22 L 66 22 L 61 15 L 45 17 L 35 23 L 18 22 L 8 12 Z',metal,'#44383c',2.4);
      path(c,'M 37 -14 L 63 -12 L 63 12 L 37 15 Z','#793f51','#be8a68',1.5);
      for (const x of [45,51,57]) path(c,`M ${x} -8 l 2 0 -1 16 -2 0 Z`,'#3c3442');
      ellipse(c,31,-5,15,16,'#382f3e','#e3b77b',2.3);
      for (const [x,y,col] of [[25,-12,'#ffa2b1'],[36,-12,'#f8d477'],[36,0,'#9ddcba'],[25,0,'#eaa6dc']]) {
        ellipse(c,x,y,3.8,4.7,col);
        ellipse(c,x-.9,y-1.6,1.3,1.6,'#fff1df');
      }
      ellipse(c,31,-6,2.1,2.1,'#efd29b');
      ellipse(c,72,0,5.3,21,'#a16c64','#ffdb9d',2.1);
      ellipse(c,73,0,3.5,16,'#3a303e','#ed9ab5',1.4);
    } else if (form === 'twin' || form === 'fan') {
      for (const side of [-1, 1]) tube(form==='fan'?66:74, 13, side*5, side*(form==='fan'?.19:.055));
      if (form==='fan') tube(74, 14);
      else {
        path(c, 'M 20 0 L 38 -5 L 52 0 L 38 5 Z', '#75a9b5', '#cce9dc', 1);
        path(c, 'M 31 0 L 40 0', null, glow, 2.5);
      }
    } else if (form === 'prism') {
      for (const side of [-1, 1]) {
        c.save();c.scale(1,side);
        path(c, 'M 9 3 L 28 11 L 43 19 L 66 15 L 75 6 L 66 6 L 51 10 L 41 10 L 24 2 Z', metal, '#183139', 2);
        path(c, 'M 31 9 L 43 15 L 65 11 L 69 8', null, '#bc685c', 3.5);
        path(c, 'M 34 8 L 44 12 L 60 10', null, '#ffe1bd', 1.2);
        c.restore();
      }
      path(c, 'M 16 0 L 44 -6 L 62 0 L 44 6 Z', '#a64f55', '#ffcbae', 1.3);
      path(c, 'M 31 0 L 70 0', null, '#ffb9a3', 2.4);
      path(c, 'M 38 0 L 65 0', null, '#fff9d8', 1.2);
    } else if (form === 'resonator' || form === 'carousel') {
      path(c,'M 7 -13 L 23 -18 L 48 -16 L 61 -12 L 70 -13 L 74 -9 L 74 9 L 70 13 L 61 12 L 48 16 L 23 18 L 7 13 Z',metal,'#173238',2);
      path(c,'M 23 -14 Q 43 -18 60 -9 L 65 -3 L 63 7 Q 44 16 24 13 L 17 7 L 17 -7 Z',enamel,'#847454',1.4);
      if (form === 'resonator') {
        for (const [cx,ry] of [[28,14],[40,15],[52,12]]) {
          ellipse(c,cx,0,4.5,ry,'#754d30','#f9d38d',2.3);
          path(c,`M ${cx-1} ${-ry+3} Q ${cx+5} -1 ${cx} ${ry-2}`,null,'#ffe8a0',1.2);
        }
      } else {
        for (const [cx,cy,col] of [[27,-7,'#a9f0dc'],[40,-7,'#ec9ac8'],[53,-5,'#ffce80'],[29,6,'#ffce80'],[43,6,'#8de8d4']]) {
          path(c,`M ${cx-5} ${cy} l 3 -4 h 5 l 2 4 l -3 4 h -5 Z`,col,'#123440',1.2);
        }
        path(c,'M 20 0 L 58 0',null,'#ceb67c',2);
      }
      ellipse(c,68,0,5,12,metal,'#ffe4a2',1.3);
      ellipse(c,71,0,3,7,'#264449',glow,1.4);
    } else {
      tube(74, 26);
      path(c, 'M 28 -12 L 40 -19 L 54 -14 L 42 -7 Z', enamel, '#d7b571', 1.4);
    }
    path(c, 'M -16 -10 L -5 -17 L 14 -18 L 27 -11 L 28 11 L 14 18 L -5 17 L -16 10 Z', enamel, '#bda06b', 2);
    for (const side of [-1,1]) {
      c.save();c.scale(1,side);
      path(c,'M 8 13 L 17 13 L 23 9',null,glow,2.2);
      c.restore();
    }
  }

  function paintCompass(c) {
    ellipse(c,0,0,21,21,'#314c4c','#edce88',2.6);
    ellipse(c,0,0,16,16,'#102e37','#97b5aa',1.4);
    for (let i=0;i<8;i++) {
      const a=i*Math.PI/4;
      path(c,`M ${Math.cos(a)*11} ${Math.sin(a)*11} L ${Math.cos(a)*14} ${Math.sin(a)*14}`,null,i%2?'#698a87':'#f3dba2',1.4);
    }
  }
  const defaultCannonForms = ['single','single','double','spread','orb','beam','spread','orb','beam','spread','orb','hybrid'];
  function drawDischarge(c, form, kick) {
    const accent = cannonLight[form];
    c.save();
    c.translate(74,0);
    c.globalAlpha=kick*.85;
    if (form === 'frost') {
      for (const side of [-1,1]) {
        c.save();c.translate(0,side*7);c.scale(.45+kick*.55,1);
        path(c,'M -1 0 L 6 -2 L 11 -1 L 18 0 L 8 2 Z','#d5fbff');
        path(c,'M 8 -1 L 12 -5 M 8 1 L 12 5',null,'#86e8ff',1.3);
        c.restore();
      }
    } else if (form === 'candyRail') {
      for (const side of [-1,1]) {
        ellipse(c,0,side*11,6,5,'#ff637b80');
        ellipse(c,0,side*11,3.5,2.5,'#fff3dd');
      }
      path(c,'M 0 -10 Q -8 -5 -3 0 Q -8 6 0 10',null,'#ffafb0',1.8);
    } else if (form === 'chime') {
      const travel=(1-kick)*16;
      c.translate(travel,0);
      path(c,'M 0 -16 Q 9 0 0 16 M 6 -11 Q 12 0 6 11',null,accent,2);
    } else if (form === 'mortar') {
      c.scale(.5+kick*.7,.8+kick*.2);
      path(c,'M -1 -9 Q 6 -7 11 -12 L 9 -5 L 21 -2 L 13 1 L 19 7 L 9 5 L 9 11 Q 3 6 -1 8 Z','#ffb07e');
      path(c,'M -1 -5 Q 5 -3 12 -3 L 8 0 L 12 3 Q 5 3 -1 5 Z','#fff0bf');
    } else {
      c.scale(.5+kick,.5+kick*.5);
      path(c,'M -1 -4 Q 4 -3 13 -5 L 8 -1 L 19 0 L 7 2 L 11 5 Q 4 3 -1 4 Z',accent);
      path(c,'M 0 -2 L 11 0 L 0 2 Z','#fff8df');
    }
    c.restore();
  }
  function drawCannon(c,x,y,angle,level=1,recoil=0,time=0,weaponKind,reducedMotion=false) {
    const form = cannonForms[weaponKind || defaultCannonForms[level-1]] || 'barrel';
    const accent = cannonLight[form];
    const kick = Math.max(0,Math.min(1,recoil));
    const recoilTravel = {mortar:7, chime:5, candyRail:1.5}[form] || 4;
    c.save();c.translate(x,y);
    c.drawImage(cannonSprite('cannon:pedestal',paintPedestal),-88,-88,176,176);
    c.save();c.rotate(angle);c.translate(-kick*recoilTravel*(reducedMotion ? .25 : 1),0);
    c.drawImage(cannonSprite('cannon:'+form,layer=>paintEmitter(layer,form)),-88,-88,176,176);
    if (!reducedMotion && kick>.15) drawDischarge(c,form,kick);
    c.restore();
    // Fixed compass bezel and a needle which points along the actual shot.
    c.drawImage(cannonSprite('cannon:compass',paintCompass),-88,-88,176,176);
    c.save();c.rotate(angle);
    path(c,'M -11 0 L -1 -3 L 13 0 L -1 3 Z','#daaa71');
    path(c,'M 0 -3 L 13 0 L 0 3 Z',accent);
    c.restore();
    ellipse(c,0,0,2.5,2.5,'#fff3c7');
    // Four inset deck lamps correspond to the four booth upgrades.
    for (let i=0;i<4;i++) {
      const xLamp=(i-1.5)*8,yLamp=33-Math.abs(i-1.5)*1.3;
      c.fillStyle=i<level?accent:'#3f5655';c.fillRect(xLamp-2.4,yLamp,4.8,2.5);
    }
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
  const supplyColors = {freeze:'#b7f5ff', rapid:'#ffe38a', bomb:'#d9c9ff', lure:'#a5f5d5'};
  function drawSupply(c,x,y,kind) {
    const key='supply:'+kind;
    if (!sprites.has(key)) {
      const icon=document.createElement('canvas');icon.width=icon.height=72;
      const b=icon.getContext('2d');b.translate(36,36);b.scale(2,2);
      b.lineJoin='round';b.lineCap='round';
      const edge=supplyColors[kind]||'#fff0cb';
      ellipse(b,0,0,17,17,edge+'2b');
      if (kind==='freeze') {
        path(b,'M 0 -14 L 12 -7 L 12 7 L 0 14 L -12 7 L -12 -7 Z','#194f63',edge,1.8);
        for(let i=0;i<3;i++) {
          b.save();b.rotate(Math.PI*i/3);
          path(b,'M -8 0 L 8 0 M -6 -2 L -4 0 L -6 2 M 6 -2 L 4 0 L 6 2',null,'#eeffff',1.5);b.restore();
        }
      } else if (kind==='rapid') {
        ellipse(b,0,0,13,13,'#164e43',edge,1.8);
        ellipse(b,0,0,8.5,8.5,null,'#6ab7a1',.9);
        ellipse(b,0,0,4,4,null,'#6ab7a1',.9);
        path(b,'M 0 0 L 7 -9 L 11 -2 Z','#7df8b8aa');
        path(b,'M 0 0 L 7 -9',null,'#edffdb',1.7);
        ellipse(b,-5,3,1.7,1.7,'#fff4ac');
      } else if (kind==='bomb') {
        path(b,'M -8 -12 L 8 -12 L 14 0 L 8 12 L -8 12 L -14 0 Z','#493463',edge,1.8);
        path(b,'M -8 6 L 0 -5 L 7 4 M 3 4 L 7 4 L 8 0',null,'#ffedff',1.8);
        path(b,'M -5 -8 L 5 -8',null,edge,2);
      } else {
        path(b,'M 0 -14 L 8 -10 L 12 -3 L 11 5 L 5 12 L -5 12 L -11 5 L -12 -3 L -8 -10 Z','#5a462d',edge,1.8);
        path(b,'M 9 -1 C 8 -9 -7 -10 -8 -1 C -9 7 3 10 5 3 C 7 -3 -1 -5 -3 -1 Q -4 3 0 2',null,'#fff0c6',1.75);
      }
      sprites.set(key,icon);
    }
    c.drawImage(sprites.get(key),x-18,y-18,36,36);
  }
  return { drawFish, drawBackground, drawCannon, drawCoin, drawSupply };
})();
