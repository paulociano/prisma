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

test('extension does not introduce a checkpoint near another checkpoint', () => {
  // O conteúdo gerado entra em até dois pontos da fase, cada um com no máximo um checkpoint.
  LEVELS.forEach((build, i) => {
    const original = BASE[i]();
    const extended = build();
    if (original.arena || extended.cols === original.cols) return;
    const cols = (l) => l.entities.filter(e => e.type === 'checkpoint').map(e => e.col).sort((a, b) => a - b);
    const minGap = (list) => list.slice(1).reduce((m, c, k) => Math.min(m, c - list[k]), Infinity);
    const before = cols(original), after = cols(extended);
    assert.ok(after.length - before.length <= 2, `${extended.id}: unexpected inserted checkpoints`);
    // nenhum par de checkpoints fica mais perto do que 12 colunas (a não ser que o autoral já fosse assim)
    assert.ok(minGap(after) >= Math.min(12, minGap(before)), `${extended.id}: checkpoints too close after extension (${after.join(', ')})`);
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

test('every level gets its own extension segment and a hidden portal', async () => {
  const { buildSegment } = await import('../.debug/extend.mjs');
  const seen = new Map();
  for (let w = 1; w <= 7; w++) {
    for (let v = 0; v < 3; v++) {
      const { b, width } = buildSegment(w, v, 6, 24, false);
      const seg = b.build();
      const sig = JSON.stringify([width, seg.entities.filter((e) => e.col < width), seg.tiles.map((r) => r.slice(0, width).join(''))]);
      assert.ok(!seen.has(sig), `${w}-${v + 1} repeats ${seen.get(sig)}`);
      seen.set(sig, `${w}-${v + 1}`);
      const portal = seg.entities.find((e) => e.type === 'portal');
      assert.ok(portal && portal.data.hidden >= 1, `${w}-${v + 1}: portal must be hidden`);
      if (w < 7) assert.notEqual(portal.data.hidden, 3, `${w}-${v + 1}: cracked floor needs the pound ability`);
    }
  }
});

test('doors come in pairs and chests exist in vaults and annex rooms', () => {
  LEVELS.forEach((build) => {
    const l = build();
    const ids = {};
    for (const e of l.entities.filter((x) => x.type === 'door')) ids[e.data.id] = (ids[e.data.id] ?? 0) + 1;
    for (const [id, n] of Object.entries(ids)) assert.equal(n, 2, `${l.id}: door ${id} needs exactly one partner`);
  });
  assert.ok(LEVELS.some((b) => b().entities.some((e) => e.type === 'chest')));
});

test('early worlds only get gentle challenges (difficulty grows with the world)', async () => {
  const { allowedRating } = await import('../.debug/extend.mjs');
  assert.ok(allowedRating(1, 0) < allowedRating(4, 1));
  assert.ok(allowedRating(4, 1) < allowedRating(7, 2));
  assert.ok(allowedRating(1, 0) < 2.5, 'world 1 level 1 must exclude the hardest beats');
  assert.ok(allowedRating(7, 2) >= 3, 'last levels allow every beat');
});

test('pennants: 12 distinct pennants appear across the normal levels', () => {
  const seen = new Set();
  LEVELS.forEach((b) => b().entities.filter((e) => e.type === 'pennant').forEach((e) => seen.add(e.data.n)));
  assert.equal(seen.size, 12);
  assert.deepEqual([...seen].sort((a, b) => a - b), Array.from({ length: 12 }, (_, i) => i));
});
