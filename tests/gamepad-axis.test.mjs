import test from 'node:test';
import assert from 'node:assert/strict';
import { readAxis } from '../.debug/gamepad-axis.mjs';

test('neutralizes stick drift and deadzone boundary', () => {
  for (const x of [-0.4, -0.2, 0, 0.2, 0.4]) assert.equal(readAxis(x), 0);
});
test('preserves directional input outside deadzone', () => {
  assert.equal(readAxis(-0.8), -0.8);
  assert.equal(readAxis(0.9), 0.9);
});
test('clamps unexpected values and rejects NaN', () => {
  assert.equal(readAxis(2), 1);
  assert.equal(readAxis(-2), -1);
  assert.equal(readAxis(NaN), 0);
});
