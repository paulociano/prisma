# Prisma — pré-render 3D / piloto 1-1

Direção: sprites 2D de modelos tridimensionais, estilo de produção de jogos como Donkey Kong Country, sem migrar Phaser Arcade Physics nem perder a identidade cromática existente. Não é um filtro de pixel art nem migração para SNES físico.

## Piloto publicado

`scripts/prerender-islands.mjs`: malha tridimensional procedural fechada por anéis e tampas; câmera ortográfica fixa, iluminação difusa, z-buffer, supersampling 2x e materiais verdes/minerais. Três seeds fixas geram três sprites RGBA 448×240. Contato registrado y=48, núcleo x=32..415. O gerador usa JavaScript puro; Sharp apenas escreve o PNG no pipeline existente. Não requer Blender, GPU ou serviços pagos. Não converte literalmente as pinturas originais: é reconstrução estilizada inicial.

`npm run assets` gera e otimiza sprites no pipeline de build, com chaves `w1_prerender_island_0..2`. Não sobrescreve PNGs de origem. `npm run test:prerender` verifica dimensões, opacidade do núcleo, cantos transparentes, variações e determinismo. Os testes de render puro foram executados no momento da implementação; CI/build e validação em navegador ainda devem ser conferidos.

## Como comparar

- Abra a fase 1-1 normalmente: mantém o renderer anterior.
- Abra com `?prerender=1`: plataformas solid/ledge/mover atendidas por PlatformVolume usam o sprite pré-renderizado, escolhido por seed da posição. A flag respeita organic/plates/platforms existentes e preserva pivô, largura, máscara de proteção, colisões e trajetória. Se textura faltar, usa o sprite anterior. `?prerender=0` ou sem flag restaura a arte anterior.
- A prévia pode continuar passando pela adaptação de profundidade e iluminação 2D já existente. Não é render 3D em tempo real.
- Conferir imagem em jogo, pouso, deslocamento e mover; comparar contraste/paleta com cenário. Só promover ao padrão quando QA visual e gameplay aceitarem.

## Migração incremental

1. Plataformas do Vale (piloto gerado e ligado por flag).
2. Terreno contínuo: construir malhas a partir de grupos de polígonos de ArtGeometry, renderizar uma massa inteira por grupo e cortar em placas somente depois; sem costuras de iluminação, sem cobrir vãos/perigos e sem alterar LevelData. Não simplesmente repetir sprite de ilha no chão.
3. Rampas, paredes e estruturas especiais: encaixes, pivôs e registro de contato; preservar áreas protegidas e arte original como fallback.
4. Props, portais e objetos: modelos reutilizáveis com câmera/iluminação fixas; paleta por mundo.
5. Íris, Faísca, inimigos e chefes: modelos/rigs e sprite sheets com pivô, timing, hitbox e enquadramento invariáveis; não converter em massa sem uma animação aprovada.
6. Expandir por mundo após comparação visual, playtest e budget de memória. Sem exigência de emular resolução/paletas do SNES real.

Skills: ai-3d-asset-factory, sprite-sheet-pipeline. Limite: protótipo low-poly de plataformas, não substituição completa dos 28 níveis; sem backend neural ou Blender instalado.
