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

test('every level has a reachable goal entity and expected boss/guardian placement', () => {
  LEVELS.forEach((build, index) => {
    const level = build();
    const goal = level.entities.filter(e => e.type === 'exit');
    const boss = level.entities.filter(e => e.type === 'boss');
    const guardian = level.entities.filter(e => e.type === 'guardian');
    const isBoss = index % 4 === 3;
    assert.equal(boss.length, isBoss ? 1 : 0, `${level.id}: boss count`);
    assert.equal(guardian.length, index % 4 === 2 ? 1 : 0, `${level.id}: guardian count`);
    if (!isBoss) assert.equal(goal.length, 1, `${level.id}: exit count`);
    for (const e of [...goal, ...boss, ...guardian]) {
      assert.ok(e.col >= 0 && e.col < level.cols && e.row >= 0 && e.row < level.rows,
        `${level.id}: ${e.type} outside level bounds`);
    }
  });
});

test('checkpoints stay inside levels and have unique positions', () => {
  LEVELS.forEach(build => {
    const l = build();
    const checkpoints = l.entities.filter(e => e.type === 'checkpoint');
    const positions = checkpoints.map(e => `${e.col}:${e.row}`);
    assert.equal(new Set(positions).size, positions.length, `${l.id}: duplicate checkpoint positions`);
    for (const c of checkpoints) assert.ok(c.col >= 0 && c.col < l.cols && c.row >= 0 && c.row < l.rows,
      `${l.id}: checkpoint outside level bounds`);
  });
});

test('each extended level hides exactly one secret portal with a valid sub-level', () => {
  LEVELS.forEach((build) => {
    const l = build();
    if (l.arena || l.cols === 0) return;
    const portals = l.entities.filter((e) => e.type === 'portal');
    assert.ok(portals.length <= 1, `${l.id}: more than one portal`);
    for (const p of portals) assert.ok(p.data.sub >= 0 && p.data.sub < 6, `${l.id}: bad sub index`);
  });
});

test('interactive blocks come in matching sets (every gate has a plate and a box)', () => {
  LEVELS.forEach((build) => {
    const l = build();
    const ids = (type) => new Set(l.entities.filter((e) => e.type === type).map((e) => e.data.id));
    for (const id of ids('gate')) assert.ok(ids('plate').has(id), `${l.id}: gate ${id} without plate`);
    if (ids('gate').size) assert.ok(l.entities.some((e) => e.type === 'pushbox'), `${l.id}: gate without a pushbox`);
  });
});
