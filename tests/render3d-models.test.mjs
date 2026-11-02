import test from 'node:test';
import assert from 'node:assert/strict';
import { animName, clipFor, modelKey } from '../.debug/render3d-models.mjs';

test('model file names follow the entity kind and variant', () => {
  assert.equal(modelKey({ kind: 'player' }), 'iris');
  assert.equal(modelKey({ kind: 'spark' }), 'faisca');
  assert.equal(modelKey({ kind: 'enemy', variant: 'beetle' }), 'enemy-beetle');
  assert.equal(modelKey({ kind: 'boss', variant: '3' }), 'boss-3');
  assert.equal(modelKey({ kind: 'pickup', variant: 'coin' }), 'pickup-coin');
  assert.equal(modelKey({ kind: 'prop', variant: 'checkpoint' }), 'prop-checkpoint');
  assert.equal(modelKey({ kind: 'crate' }), 'crate');
});

test('2D animation keys map to clip names', () => {
  assert.equal(animName('iris-run'), 'run');
  assert.equal(animName('beetle-move'), 'move');
  assert.equal(animName(undefined), undefined);
});

test('missing clips fall back to the closest one', () => {
  const basic = ['idle', 'run', 'jump'];
  assert.equal(clipFor('run', basic), 'run');
  assert.equal(clipFor('doublejump', basic), 'jump');
  assert.equal(clipFor('dash', basic), 'run');
  assert.equal(clipFor('attack', basic), 'idle');
  assert.equal(clipFor(undefined, basic), 'idle');
  assert.equal(clipFor('move', ['walk']), 'walk');
  assert.equal(clipFor('swim', ['Take 001']), 'Take 001');
  assert.equal(clipFor('run', []), undefined);
});
