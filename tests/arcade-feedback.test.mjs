import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

const source = readFileSync(new URL('../sources/arcade/feedback.js', import.meta.url), 'utf8');
function load(extra = {}) {
  const sandbox = { console, atob, ...extra };
  vm.createContext(sandbox); vm.runInContext(source, sandbox);
  return sandbox.FuLamArcade;
}
test('Repeated explosions are bounded and all debris expires', () => {
  const { Effects } = load(), fx = new Effects();
  for (let i = 0; i < 100; i++) { fx.burst(100, 100, { heavy: true }); fx.shatter(100, 100, '#ffffff'); }
  assert(fx.items.length <= 240);
  for (let i = 0; i < 20; i++) fx.update(.1);
  assert.equal(fx.items.length, 0);
});
test('Reduced motion produces fewer particles with no smoke', () => {
  const { Effects } = load(), regular = new Effects(), reduced = new Effects(true);
  regular.burst(10, 10, { heavy: true }); reduced.burst(10, 10, { heavy: true });
  assert(reduced.items.length < regular.items.length);
  assert(!reduced.items.some(p => p.type === 'smoke'));
  reduced.clear(); assert.equal(reduced.items.length, 0);
});
test('Audio unavailable does not prevent gameplay or throw', async () => {
  const { Audio } = load(), a = new Audio();
  await a.unlock(); assert.equal(a.play('blast'), false); a.stop(); a.setEnabled(false);
});
function fakeAudio(failDecode = false) {
  const param = () => ({ value: 0, setValueAtTime() {}, exponentialRampToValueAtTime() {}, linearRampToValueAtTime() {} });
  const node = () => ({ connect() {}, disconnect() {}, start() {}, stop() {}, gain: param(), frequency: param(), playbackRate: param() });
  return class {
    constructor() { this.currentTime = 2; this.state = 'running'; this.destination = {}; }
    createGain() { return node(); }
    createDynamicsCompressor() { return { ...node(), threshold: param(), knee: param(), ratio: param(), attack: param(), release: param() }; }
    createOscillator() { return node(); }
    createBufferSource() { return node(); }
    async decodeAudioData() { if (failDecode) throw Error('Unsupported audio'); return { duration: .3 }; }
  };
}
test('Bad audio decodes fall back to a cue; mute stops every voice', async () => {
  const { Audio } = load({ AudioContext: fakeAudio(true), FuLamArcadeAssets: { blast: 'AA==' } }), a = new Audio();
  await a.unlock(); assert.equal(a.failures, 1); assert(a.play('blast')); assert(a.voices.size > 0);
  a.setEnabled(false); assert.equal(a.voices.size, 0); assert.equal(a.play('blast'), false);
});
test('Rapid inputs cannot stack unlimited sound voices and warnings take priority', async () => {
  const { Audio } = load({ AudioContext: fakeAudio(), FuLamArcadeAssets: { shot: 'AA==' } }), a = new Audio();
  await a.unlock(); assert(a.play('fire')); assert.equal(a.play('fire'), false);
  for (let i = 0; i < 100; i++) { a.context.currentTime += .2; a.play('fire'); }
  assert(a.voices.size <= 12); a.play('warning'); assert.equal(a.voices.size, 2);
});
test('Both deployed games carry audio and complete asset attribution without a remote loader', () => {
  for (const game of ['fleet', 'fishing']) {
    const html = readFileSync(new URL(`../site/${game}/index.html`, import.meta.url), 'utf8');
    assert(html.includes('window.FuLamArcadeAssets=')); assert(html.includes('Creative Commons Zero'));
    assert(html.includes('Lucide')); assert(!html.includes('window.__fleetQA')); assert(!html.includes('window.__fishQA'));
  }
});
