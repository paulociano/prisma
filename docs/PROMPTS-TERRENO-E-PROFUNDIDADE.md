# Prompts: terreno ampliado e primeiro plano

Arte que falta para as próximas etapas do plano visual (kit ampliado, paredes, rampas e
primeiro plano). Mesmo fluxo de `docs/PROMPTS.md`: cole antes o **guia de estilo** (seção 0) e o
**briefing do mundo** (seção 3), gere uma imagem por prompt e salve em `assets/raw/wN/` com o
nome indicado. Nada aqui é obrigatório para o jogo rodar: enquanto um arquivo não existe, o
jogo segue com o desenho atual.

O que o jogo já faz sem arte nova (ver `src/gfx/Terrain.ts`): interior do chão sem repetição
visível, grama fora de ritmo, ilhas com raízes, sombras de volume e sombras projetadas.

## T.1 Kit de terreno, parte 2: paredes e parte de baixo

Paisagem · 💾 `tiles_kit2.png`

```
Landscape 1536x1024. Platformer TERRAIN KIT, PART 2, for the same world and in exactly the
same style, scale and lighting as the first terrain kit (each ground block is a perfect
square, roughly 180x180 px). Isolated pieces on a transparent background, side view, wide
gaps, never touching:
row 1: a LEFT WALL block (the exposed left side of a cliff: rounded rock face with a few
hanging plants, seamless top/bottom), a RIGHT WALL block (mirrored design, not a flip),
an INNER CORNER block top-left (where a floor meets a rising wall), an INNER CORNER block
top-right;
row 2: an UNDERSIDE block (the bottom of a floating landmass: rock tapering down with roots
and stalactites, seamless left/right), an UNDERSIDE LEFT END, an UNDERSIDE RIGHT END,
a second variation of the UNDERSIDE block;
row 3: two more variations of the ground TOP-MIDDLE block (seamless left/right, same
height as the original, different flowers/stones), a gentle SLOPE going up to the right
(1 block up over 2 blocks), a gentle SLOPE going down to the right. No text.
```

## T.2 Textura do interior, versão larga

Paisagem · 💾 `ground_texture_wide.png`

```
Landscape 2048x1024. Perfectly SEAMLESS TILEABLE texture (tiles on all four sides) of the
ground interior of this world seen from the side. Irregular geological layers that wander
up and down instead of straight horizontal bands: packed soil, pockets of large stones,
veins of sand or crystal, buried roots, a few fossils or relics typical of the world.
No element repeats inside the image. Stylized 3D render, no top surface, no text, opaque.
```

## T.3 Decalques do interior

Paisagem · 💾 `ground_decals.png`

```
Landscape 1536x1024. Set of 8 isolated DECALS to place on top of the ground interior
texture of the same world, transparent background, wide gaps, never touching, soft edges
that blend into soil: a big boulder, a cluster of three stones, a tangle of roots, a moss
patch, a crystal vein, a small buried relic typical of the world, a burrow hole, a crack.
Side view, same lighting as the terrain kit. No text.
```

## T.4 Primeiro plano

Paisagem · 💾 `fg_near.png`

```
Landscape 2880x720. FOREGROUND layer for the same world, meant to scroll in FRONT of the
gameplay, very close to the camera. Only two things, everything else fully TRANSPARENT:
(1) along the TOP edge, hanging branches, leaves or architectural fragments typical of the
world, never reaching lower than 20% of the image height; (2) at the far left and far
right thirds, a few tall plants or posts rising from the bottom edge, never taller than
30% of the image height. The whole middle band (20% to 70% of the height) stays EMPTY.
Dark, slightly out-of-focus silhouettes with a rim of light in the world color.
Horizontally seamless. No characters, no text.
```

O meio vazio é o que protege a jogabilidade: buracos, espinhos e inimigos nunca ficam cobertos.

## T.5 Marco de cada fase

Retrato ou paisagem · 💾 `landmark_1.png`, `landmark_2.png`, `landmark_3.png`

```
One isolated LANDMARK for the middle background layer of the same world, transparent
background, about 900 px tall, soft atmospheric haze at its base so it blends into a
painted background: [descreva o marco, por exemplo "a giant heart-shaped tree with a
swing" / "a ruined bell tower wrapped in vines" / "a stone bridge with lanterns"].
Same painting style and lighting as the middle background layer. No characters, no text.
```

Um marco diferente por fase de exploração (3 por mundo): é o que faz a 1-1 não se parecer com a 1-3.
