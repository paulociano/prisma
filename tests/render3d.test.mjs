import test from 'node:test';
import assert from 'node:assert/strict';
import { CAMERA, PLANE_H, cameraPose, toUnits, toWorld } from '../.debug/render3d.mjs';

const close = (a, b) => assert.ok(Math.abs(a - b) < 1e-9, `${a} ≈ ${b}`);

test('one tile is one 3D unit and Y points up', () => {
  assert.equal(toUnits(64), 1);
  assert.deepEqual(toWorld(128, 640), { x: 2, y: -10 });
});

test('camera shows the same world height as the 2D view on the play plane', () => {
  const { position, target } = cameraPose(640, 360);
  const dist = position.z - target.z;
  close(2 * dist * Math.tan(((CAMERA.fov / 2) * Math.PI) / 180), PLANE_H);
});

test('camera follows the 2D center and aims below it', () => {
  const { position, target } = cameraPose(3712, 384);
  assert.equal(position.x, 58);
  assert.equal(target.x, 58);
  close(position.y, -6 + CAMERA.lift);
  close(target.y, -6 + CAMERA.aim);
  assert.ok(target.y < position.y);
});
