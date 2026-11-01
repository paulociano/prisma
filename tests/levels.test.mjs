import assert from 'node:assert/strict';
import test from 'node:test';
import { BASE, LEVELS } from '../.debug/levels.mjs';

test('28 levels preserve IDs and world progression', () => {
  assert.equal(LEVELS.length, 28);
  LEVELS.forEach((build, i) => {
    const level = build();
    assert.equal(level.id, `${Math.floor(i / 4) + 1}-${(i % 4) + 1}`);
    assert.equal(level.world, Math.floor(i / 4) + 1);
  });
});

test('extension does not introduce a checkpoint near an authored checkpoint', () => {
  LEVELS.forEach((build, i) => {
    const original = BASE[i]();
    const extended = build();
    if (original.arena || extended.cols === original.cols) return;
    const addedColumns = extended.cols - original.cols;
    const originalCols = original.entities.filter(e => e.type === 'checkpoint').map(e => e.col);
    const finalCols = extended.entities.filter(e => e.type === 'checkpoint').map(e => e.col);
    const authored = originalCols.map(c => {
      // Find which side of the inserted span contains this checkpoint.
      return finalCols.includes(c) ? c : c + addedColumns;
    });
    const generated = finalCols.filter(c => !authored.includes(c));
    assert.ok(generated.length <= 1, `${extended.id}: unexpected inserted checkpoints`);
    for (const c of generated) {
      for (const originalCol of authored) {
        assert.ok(Math.abs(c - originalCol) >= 12,
          `${extended.id}: inserted checkpoint ${c} is too close to authored checkpoint ${originalCol}`);
      }
    }
  });
});
