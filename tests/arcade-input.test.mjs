import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

const sandbox = {};
vm.createContext(sandbox);
vm.runInContext(readFileSync(new URL('../sources/arcade/feedback.js', import.meta.url), 'utf8'), sandbox);
const { bindAction, Pointers } = sandbox.FuLamArcade;
function button() {
  const listeners = {};
  return {
    style: {}, disabled: false,
    addEventListener(type, fn) { (listeners[type] ??= []).push(fn); },
    emit(type, event = {}) {
      const e = { type, preventDefault() {}, ...event };
      for (const fn of listeners[type] ?? []) fn(e);
      if (type === 'click') this.onclick(e);
    }
  };
}
test('Secondary touch and pen presses work without click and never double-activate', () => {
  const b = button(); let count = 0;
  bindAction(b, () => count++);
  b.emit('pointerdown', { pointerType: 'touch', pointerId: 2, isPrimary: false });
  assert.equal(count, 1);
  b.emit('pointerup', { pointerType: 'touch', pointerId: 2 });
  b.emit('click', { pointerType: 'touch', detail: 1 });
  b.emit('click', { detail: 1 }); // Older Safari compatibility MouseEvent.
  assert.equal(count, 1);
  b.emit('pointerdown', { pointerType: 'pen', pointerId: 3 });
  b.emit('click', { pointerType: 'pen', detail: 0 });
  assert.equal(count, 2);
});
test('Mouse and keyboard activation still work after touch; disabled controls do nothing', () => {
  const b = button(); let count = 0;
  bindAction(b, () => count++);
  b.emit('pointerdown', { pointerType: 'touch', pointerId: 1 });
  b.emit('click', { detail: 0 }); // Keyboard or assistive activation.
  b.emit('pointerdown', { pointerType: 'mouse', pointerId: 2 });
  assert.equal(count, 2);
  b.emit('click', { pointerType: 'mouse', detail: 1 });
  assert.equal(count, 3);
  b.disabled = true;
  b.emit('pointerdown', { pointerType: 'touch', pointerId: 3 });
  b.emit('click', { detail: 0 });
  assert.equal(count, 3);
});
test('Fullscreen-style actions use touch release and cancellation cannot activate them', () => {
  const b = button(); let count = 0;
  bindAction(b, () => count++, { onRelease: true });
  b.emit('pointerdown', { pointerType: 'touch', pointerId: 1 });
  assert.equal(count, 0);
  b.emit('pointercancel', { pointerId: 1 }); b.emit('pointerup', { pointerId: 1 });
  assert.equal(count, 0);
  b.emit('pointerdown', { pointerType: 'touch', pointerId: 2 });
  b.emit('pointerup', { pointerId: 2 }); b.emit('click', { pointerType: 'touch', detail: 1 });
  assert.equal(count, 1);
});
test('Each pointer retains ownership, with handoff only when the aiming finger leaves', () => {
  const p = new Pointers();
  p.press({ pointerId: 1, clientX: 10, clientY: 20 });
  p.press({ pointerId: 2, clientX: 50, clientY: 60 });
  assert.equal(p.move({ pointerId: 2, clientX: 70, clientY: 80 }), false);
  assert.equal(p.current.clientX, 10);
  assert.equal(p.release({ pointerId: 99 }), false); assert.equal(p.size, 2);
  p.release({ pointerId: 1 }); assert.equal(p.current.clientX, 70);
  p.release({ pointerId: 1 }); assert.equal(p.size, 1);
  p.clear(); assert.equal(p.size, 0); assert.equal(p.current, undefined);
});
