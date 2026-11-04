/* FuLam arcade feedback. Kenney audio (CC0); see CREDITS.md and licenses/. */
(function (root) {
  'use strict';
  const TAU = Math.PI * 2;
  const clamp = (n, a, b) => Math.max(a, Math.min(b, n));
  const random = (a, b) => a + Math.random() * (b - a);
  const cues = {
    fire: ['shot', .18, 1.1, .09], hit: ['hit', .24, 1.3, .07],
    coin: ['coin', .45, 1.35, .10], net: ['net', .8, .8, .2],
    laser: ['shot', .12, 1.65, .14], pierce: ['heavy', .16, 1.5, .20],
    burstShot: ['shot', .16, .85, .14],
    blast: ['blast', .38, 1, .22], sink: ['blast', .42, 1.2, .12],
    heavy: ['heavy', .65, .85, .4], death: ['heavy', .8, .72, .8],
    crack: ['crack', .38, 1.15, .1], shield: ['shield', .55, 1, .25],
    freeze: ['crack', .45, 1.7, .2], rapid: ['shot', .5, .7, .2],
    lure: ['shield', .5, 1.7, .2], double: ['coin', .6, .8, .2],
    upgrade: ['shield', .45, 1.35, .2], repair: ['shield', .45, .8, .2]
  };
  class Audio {
    constructor(enabled = true) {
      this.enabled = enabled; this.context = null; this.buffers = {};
      this.voices = new Set(); this.last = {}; this.failures = 0; this.loading = null;
    }
    unlock() {
      if (!this.enabled) return Promise.resolve();
      try {
        if (!this.context) {
          const Context = root.AudioContext || root.webkitAudioContext;
          if (!Context) return Promise.resolve();
          this.context = new Context();
          this.bus = this.context.createGain(); this.bus.gain.value = .55;
          this.compressor = this.context.createDynamicsCompressor();
          this.compressor.threshold.value = -16; this.compressor.knee.value = 18;
          this.compressor.ratio.value = 6; this.compressor.attack.value = .004;
          this.compressor.release.value = .16;
          this.bus.connect(this.compressor); this.compressor.connect(this.context.destination);
        }
        if (this.context.state === 'suspended') void this.context.resume().catch(() => {});
        if (!this.loading) this.loading = Promise.all(Object.entries(root.FuLamArcadeAssets || {}).map(async ([name, encoded]) => {
          try {
            const bytes = Uint8Array.from(atob(encoded), c => c.charCodeAt(0));
            this.buffers[name] = await this.context.decodeAudioData(bytes.buffer);
          } catch { this.failures++; }
        }));
        return this.loading;
      } catch { return Promise.resolve(); }
    }
    setEnabled(value) {
      this.enabled = Boolean(value);
      if (!this.enabled) this.stop(); else void this.unlock();
    }
    stop() {
      for (const voice of this.voices) { try { voice.stop(); } catch { /* already stopped */ } }
      this.voices.clear();
    }
    attach(source, gain, end) {
      source.connect(gain); gain.connect(this.bus); this.voices.add(source);
      source.onended = () => { this.voices.delete(source); source.disconnect(); gain.disconnect(); };
      source.start(); source.stop(end);
    }
    note(frequency, duration = .13, delay = 0, volume = .12, endFrequency = frequency) {
      const c = this.context;
      if (!this.enabled || !c || c.state !== 'running' || this.voices.size >= 12) return;
      const osc = c.createOscillator(), gain = c.createGain(), at = c.currentTime + delay;
      osc.type = 'sine'; osc.frequency.setValueAtTime(frequency, at);
      osc.frequency.exponentialRampToValueAtTime(Math.max(25, endFrequency), at + duration);
      gain.gain.setValueAtTime(0, c.currentTime); gain.gain.setValueAtTime(0, at);
      gain.gain.linearRampToValueAtTime(volume, at + .012);
      gain.gain.exponentialRampToValueAtTime(.0001, at + duration);
      this.attach(osc, gain, at + duration + .02);
    }
    play(kind) {
      const c = this.context;
      if (!this.enabled || !c || c.state !== 'running') return false;
      const spec = cues[kind];
      const interval = spec?.[3] ?? (kind === 'warning' ? 4 : .4);
      if (c.currentTime - (this.last[kind] ?? -100) < interval) return false;
      this.last[kind] = c.currentTime;
      // Important warnings displace shot tails; no sound may grow the mix unbounded.
      if (['death', 'boss', 'warning', 'end', 'upgrade'].includes(kind)) this.stop();
      if (this.voices.size >= 12) return false;
      const buffer = spec && this.buffers[spec[0]];
      try {
        if (buffer) {
          const source = c.createBufferSource(), gain = c.createGain();
          source.buffer = buffer; source.playbackRate.value = spec[2] * random(.97, 1.03);
          gain.gain.value = spec[1];
          this.attach(source, gain, c.currentTime + buffer.duration / source.playbackRate.value + .03);
        } else if (spec) {
          // First-tap / decode failure fallback: gameplay never waits for audio.
          this.note(kind === 'coin' ? 900 : kind === 'fire' ? 220 : 120, .09, 0, .07, 80);
        }
        if (kind === 'boss') [140, 210, 140].forEach((n, i) => this.note(n, .25, i * .22, .22));
        if (kind === 'warning') [660, 440].forEach((n, i) => this.note(n, .13, i * .2, .16));
        if (kind === 'upgrade' || kind === 'end') [440, 554, 659, 880].forEach((n, i) => this.note(n, .2, i * .08, .12));
        if (kind === 'freeze') [1400, 1800].forEach((n, i) => this.note(n, .17, i * .08, .08));
        if (kind === 'lure') [520, 780, 1040].forEach((n, i) => this.note(n, .2, i * .1, .1));
        if (kind === 'rapid') [0, .08, .16].forEach(d => this.note(280, .06, d, .1, 560));
        if (kind === 'laser') this.note(850, .08, 0, .035, 330);
        if (kind === 'combo') [659, 880, 1175].forEach((n,i)=>this.note(n,.12,i*.06,.10));
        return true;
      } catch { return false; }
    }
  }

  // Bounded Canvas effects, scaled in game-world coordinates. No renderer dependency.
  class Effects {
    constructor(reduced = false) { this.reduced = reduced; this.items = []; }
    clear() { this.items.length = 0; }
    add(item) {
      if (this.items.length >= (this.reduced ? 45 : 240)) this.items.shift();
      this.items.push({ age: 0, vx: 0, vy: 0, angle: 0, spin: 0, ...item });
    }
    burst(x, y, { color = '#ffca7e', size = 32, water = false, heavy = false } = {}) {
      this.add({ type: 'ring', x, y, color, size: size * 2.6, life: .6 });
      this.add({ type: 'glow', x, y, color, size: size * 2.1, life: .3 });
      const count = this.reduced ? 4 : heavy ? 28 : 14;
      for (let i = 0; i < count; i++) {
        const angle = random(0, TAU), velocity = random(35, heavy ? 220 : 145);
        this.add({ type: water ? 'bubble' : 'spark', x, y, color: i % 3 ? color : '#fff4d5',
          size: random(2, water ? 6 : 4), vx: Math.cos(angle) * velocity, vy: Math.sin(angle) * velocity,
          life: random(.35, .85), angle });
      }
      if (!water && !this.reduced) for (let i = 0; i < (heavy ? 9 : 5); i++) {
        this.add({ type: 'smoke', x: x + random(-size / 2, size / 2), y: y + random(-size / 2, size / 2),
          color: '#48616b', size: random(size * .3, size * .65), vx: random(-18, 18), vy: random(-30, -8), life: random(.7, 1.3) });
      }
    }
    shatter(x, y, color, size = 25) {
      // Angular hull / crystal pieces rotate apart; never a full-screen flash.
      for (let i = 0; i < (this.reduced ? 3 : 7); i++) {
        const a = i / 7 * TAU + random(-.2, .2);
        this.add({ type: 'shard', x, y, color, size: size * random(.22, .55),
          vx: Math.cos(a) * random(35, 95), vy: Math.sin(a) * random(35, 95),
          angle: a, spin: random(-4, 4), life: random(.65, 1.2) });
      }
    }
    hit(x, y, color = '#fff1c4') {
      this.add({ type: 'glow', x, y, color, size: 23, life: .16 });
      for (let i = 0; i < (this.reduced ? 2 : 4); i++) {
        const a = random(0, TAU);
        this.add({ type: 'spark', x, y, color, size: 2, vx: Math.cos(a) * 90, vy: Math.sin(a) * 90, life: .23 });
      }
    }
    update(dt) {
      dt = clamp(dt, 0, .1);
      for (const p of this.items) {
        p.age += dt; p.x += p.vx * dt; p.y += p.vy * dt; p.angle += p.spin * dt;
        if (p.type === 'shard') { p.vy += dt * 60; p.vx *= Math.exp(-dt * 1.8); }
        if (p.type === 'bubble') p.vy -= dt * 110;
      }
      this.items = this.items.filter(p => p.age < p.life);
    }
    draw(ctx) {
      for (const p of this.items) {
        const t = clamp(p.age / p.life, 0, 1);
        ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.angle);
        ctx.globalAlpha = Math.min(1, (1 - t) * 2);
        ctx.fillStyle = p.color; ctx.strokeStyle = p.color;
        if (p.type === 'ring') {
          ctx.globalAlpha = (1 - t) * .7; ctx.lineWidth = 2 * (1 - t) + .5;
          ctx.beginPath(); ctx.arc(0, 0, p.size * (1 - (1 - t) ** 3), 0, TAU); ctx.stroke();
        } else if (p.type === 'glow' || p.type === 'smoke') {
          const r = p.size * (p.type === 'smoke' ? .7 + t : .3 + t * .7);
          const g = ctx.createRadialGradient(0, 0, 0, 0, 0, r);
          g.addColorStop(0, p.type === 'glow' ? '#fff5d6' : p.color);
          g.addColorStop(.25, p.color); g.addColorStop(1, p.color + '00');
          ctx.globalAlpha = (1 - t) * (p.type === 'smoke' ? .45 : .7);
          ctx.globalCompositeOperation = p.type === 'glow' ? 'lighter' : 'source-over';
          ctx.fillStyle = g; ctx.fillRect(-r, -r, r * 2, r * 2);
        } else if (p.type === 'shard') {
          ctx.beginPath(); ctx.moveTo(-p.size, -p.size * .4); ctx.lineTo(p.size * .6, -p.size * .65);
          ctx.lineTo(p.size, p.size * .15); ctx.lineTo(-p.size * .3, p.size * .55); ctx.closePath();
          ctx.fill(); ctx.strokeStyle = '#f8eed6'; ctx.lineWidth = .6; ctx.stroke();
        } else if (p.type === 'bubble') {
          ctx.lineWidth = 1; ctx.beginPath(); ctx.arc(0, 0, p.size * (1 + t * .4), 0, TAU); ctx.stroke();
          ctx.globalAlpha *= .25; ctx.fill();
        } else {
          ctx.lineWidth = p.size; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(0, 0);
          ctx.lineTo(-p.vx * .045, -p.vy * .045); ctx.stroke();
        }
        ctx.restore();
      }
    }
  }
  // Secondary touches do not reliably produce a click. Activate combat controls
  // on touch/pen press, while keeping mouse, keyboard and assistive clicks intact.
  function bindAction(button, action, { onRelease = false } = {}) {
    let touchPress = false;
    const pending = new Set();
    button.style.touchAction = 'none';
    button.style.userSelect = 'none';
    button.style.webkitTouchCallout = 'none';
    button.addEventListener('pointerdown', event => {
      touchPress = event.pointerType === 'touch' || event.pointerType === 'pen';
      if (!touchPress || button.disabled) return;
      event.preventDefault();
      if (onRelease) pending.add(event.pointerId); else action(event);
    });
    button.addEventListener('pointerup', event => {
      if (pending.delete(event.pointerId) && !button.disabled) action(event);
    });
    for (const type of ['pointercancel', 'lostpointercapture']) {
      button.addEventListener(type, event => pending.delete(event.pointerId));
    }
    button.onclick = event => {
      if (button.disabled) return;
      // Some browsers also send a compatibility click after the touch releases.
      if (event?.pointerType === 'touch' || event?.pointerType === 'pen' || (touchPress && event?.detail > 0)) {
        event?.preventDefault(); return;
      }
      action(event);
    };
  }
  class Pointers {
    constructor() { this.points = new Map(); this.primary = null; }
    get size() { return this.points.size; }
    get current() { return this.points.get(this.primary); }
    press(event) {
      this.points.set(event.pointerId, { clientX: event.clientX, clientY: event.clientY });
      if (this.primary === null) this.primary = event.pointerId;
    }
    move(event) {
      if (!this.points.has(event.pointerId)) return false;
      this.points.set(event.pointerId, { clientX: event.clientX, clientY: event.clientY });
      return this.primary === event.pointerId;
    }
    release(event) {
      if (!this.points.delete(event.pointerId)) return false;
      if (this.primary === event.pointerId) this.primary = this.points.keys().next().value ?? null;
      return true;
    }
    clear() { this.points.clear(); this.primary = null; }
  }
  root.FuLamArcade = { Audio, Effects, bindAction, Pointers };
})(globalThis);
