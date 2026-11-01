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

test('normal levels begin with a safe learning zone', () => {
  LEVELS.forEach((build) => {
    const l = build();
    if (l.arena) return;
    const players = l.entities.filter(e => e.type === 'player');
    assert.equal(players.length, 1, `${l.id}: expected one player spawn`);
    const spawn = players[0];
    assert.ok(spawn.col >= 0 && spawn.col < l.cols, `${l.id}: invalid spawn`);
    const early = l.entities.filter(e => ['blot','moth','padlock','beetle','scorpion','drone','snapper','searchlight','puffer','comet','sentinel','megaphone'].includes(e.type) && Math.abs(e.col - spawn.col) < 7);
    assert.equal(early.length, 0, `${l.id}: enemy too close to spawn`);
  });
});
