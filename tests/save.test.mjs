import assert from 'node:assert/strict';
import test from 'node:test';
import { normalizeSave, loadSave, writeSave, hasSave, clearSave } from '../.debug/save.mjs';

const data = new Map();
globalThis.localStorage = {
  getItem: key => data.get(key) ?? null,
  setItem: (key, value) => data.set(key, value),
  removeItem: key => data.delete(key),
};

test('defaults to fresh progress on empty storage', () => {
  data.clear();
  assert.equal(loadSave().level, 0);
  assert.equal(hasSave(), false);
});

test('normalizes malformed and legacy save fields', () => {
  const save = normalizeSave({
    level: 999,
    completed: ['1-1', '1-1', 'invalid', 42],
    dash: true, glide: 'yes', finished: false,
    shards: { '1-1': [true, 'yes', true, true], 'fake': [true, true, true] },
  });
  assert.equal(save.level, 27);
  assert.deepEqual(save.completed, ['1-1']);
  assert.equal(save.dash, true);
  assert.equal(save.glide, false);
  assert.deepEqual(save.shards['1-1'], [true, false, true]);
  assert.equal(save.shards.fake, undefined);
});

test('invalid JSON does not crash and is not offered as progress', () => {
  data.set('prisma-save-v1', '{broken');
  assert.equal(loadSave().level, 0);
  assert.equal(hasSave(), false);
});

test('writes, restores and clears valid data', () => {
  data.clear();
  const save = normalizeSave({ level: 3, completed: ['1-1'], shards: { '1-1': [true, false, true] } });
  assert.equal(writeSave(save), true);
  assert.equal(hasSave(), true);
  assert.deepEqual(loadSave(), save);
  assert.equal(clearSave(), true);
  assert.equal(hasSave(), false);
});

test('blocked storage returns failure without throwing', () => {
  const old = globalThis.localStorage;
  globalThis.localStorage = {
    getItem() { throw new Error('blocked'); },
    setItem() { throw new Error('blocked'); },
    removeItem() { throw new Error('blocked'); },
  };
  try {
    assert.equal(loadSave().level, 0);
    assert.equal(writeSave(normalizeSave(null)), false);
    assert.equal(hasSave(), false);
    assert.equal(clearSave(), false);
  } finally {
    globalThis.localStorage = old;
  }
});

test('secrets are validated and kept', () => {
  const s = normalizeSave({ secrets: { '1-1': true, '9-9': true, '2-3': 'x' } });
  assert.deepEqual(s.secrets, { '1-1': true });
  assert.deepEqual(normalizeSave(null).secrets, {});
});
