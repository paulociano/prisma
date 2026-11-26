# PRISMA 2.0 — Organic World Engine

Status: fases 01–03 implementadas, checks puros e build aprovados nos runs 45833152944, 45833699163 e 45834300027; gates visuais ainda em curso na última consulta. Fase 04 iniciada na main, com manifesto de profundidade no Vale; aprovação visual pendente.
Motor: Phaser 3.90, TypeScript, Vite, Arcade Physics. Alvo inicial: navegador desktop e controles existentes. Não migrar engine, saves, LevelData ou hitboxes durante o piloto. A referência aprovada pelo jogador é a paisagem pictórica lateral com rocha, raízes, musgo, ilhas naturais e ausência de props fantasma, não um screenshot a ser simplesmente sobreposto.

## Decisão de arquitetura

LevelData continua autoridade de simulação. Um adaptador puro converte a grade existente para contatos no espaço do mundo. Renderizadores consultam esse contrato e adicionam silhueta, material, profundidade e luz sem criar corpos físicos. Arte em chunks é detalhe de transporte, não identidade visual. Não usar máscara de colisão como máscara artística final. Manter áreas perigosas e contatos legíveis. Separar volume decorativo da superfície pisável; usar contornos aprovados, não suavizar fisicamente o chão sem projeto de gameplay.

## Fases e gates

| Fase | Escopo | Gate para avançar |
|---|---|---|
| 01 | Contrato VisualGeometry: contatos, superfícies, paredes, rampas e plataformas; adaptadores de renderer; diagnóstico | Testes puros, paridade estática e de rampas, dados de runtime, sem mudanças de LevelData |
| 02 | Contornos vetoriais contínuos, curvas e envelopes de silhueta; composição das massas sem emendas; piloto 1-1 | Teste de continuidade, contato legível, ausência de vazamento em perigos, screenshot antes/depois |
| 03 | Ilhas e plataformas com identidade de região, pivôs e contato preciso; movimentos preservados | Pulo/aterrissagem, colisão one-way, movimento, sombra e validação em jogo |
| 04 | Manifesto de profundidade, parallax, oclusão e escala; sem duplicação fantasma | Pan/zoom e inspeção de cenas; HUD e personagens legíveis |
| 05 | Albedo existente + normal maps seletivos, materiais emissivos e oclusão pintada | Validar iluminação com e sem mapas; fallback WebGL e qualidade baixa |
| 06 | Iluminação local de lanternas, cristais e poderes; sombras de contato | Teste de luz em movimento, contraste, preservação de ColorRestore |
| 07 | Folhas, raízes, partículas, cachoeiras e neblina com planos coerentes | Sem cobertura de perigos, redução de movimento e flashes respeitada |
| 08 | Direção de câmera e transições por regiões, sem mudar controle do jogador | Câmera acompanha saltos, respawn, acessibilidade e limites |
| 09 | Vertical slice Vale do Coração (1-1) completo | CI, percurso humano, screenshot inicial e restaurado, aprovação visual explícita |
| 10 | Expandir 1-2, 1-3 e demais mundos por identidade regional | Gates 01–09 repetidos por mundo; arenas e assets especiais protegidos |
| 11 | Medir frame time, memória, carregamento, cache e texturas; otimizar gargalos | Medições reproduzíveis, objetivo inicial 60 fps desktop de referência a definir; qualidade baixa sem regressão física |

## Implementação inicial

src/world/VisualGeometry.ts é módulo puro, sem Phaser, com coordenadas em pixels, schema 1 e dados somente leitura por contrato. PlateFinish consome planos de superfície, paredão, rampa e ledge no lugar de redescobrir esses runs dentro do desenho. A grade ainda alimenta o adaptador e a função de acabamento de profundidade; a fase 02 retirará a dependência restante do desenho e introduzirá envelopes curvos reais. A alteração inicial mantém o comportamento visual da etapa 43; não é um novo renderer 2,5D completo. A opção ?geometry=1 mostra contatos dos acabamentos aceitos e ledges livres (não todos os colisores), em verde, laranja, azul e lilás antes da dessaturação de cenário. ?plates=0 e ?organic=0 mantêm as comparações anteriores. Nenhum novo asset nesta fase. Testes: npm run test:visual-geometry; validação de runtime integrada em Validate Organic Terrain. Não iniciar produção em massa até aprovação de 1-1.

## Critérios gerais

- Preservar input, progressão, colisões, hitboxes, perigos, entidades, acessibilidade e saves.
- Não confundir aprovação de CI com aprovação artística ou playtest humano.
- Usar desenhos opacos ancorados; transparência apenas em efeitos ou elementos atmosféricos intencionais.
- Commit pequeno e reversível por intervenção; registrar decisões e limitações.
- Ativar tecnologias de materiais e luz somente após protótipo, medição e fallback.

## Fase 02 — primeiro renderer de contorno (piloto 1-1)

OrganicContours planeja curvas de topo e parede em pixels globais com interpolação cúbica determinística, união de trechos de paredão contíguos e taper em extremidades reais. CurvedPlate altera a silhueta da pintura validada (não uma nova camada decorativa independente): cria um canvas com margem de 18 px, preserva o núcleo e amostra a pintura para prolongar a borda até 7 px no topo e 18 px nos lados. Só escreve em células Empty, nunca em espinhos, plataformas, outros sólidos ou fora do mapa. Ilhas já substituídas são excluídas. O perfil de um grupo permanece igual em todos os recortes; se o raster falhar, usa a pintura original e registra falha. Não modifica colisão nem altera PNGs originais. Ativo por padrão apenas em 1-1 com plates; `?contours=0` compara com fase 01. Rampas ainda usam a arte existente; não há curva física, recorte interno dos cantos ou malha 3D. A etapa 02 ainda requer inspeção de continuidade real, acabamento de materiais e aprovação estética. Testes puros cobrem continuidade, limites, merge e determinismo; CI exige raster ativo, rollback e paridade física e gera capturas A/B em quatro posições.

## Fase 03 — volumes e pivôs de plataformas (piloto 1-1)

PlatformProfile define dimensões em pixels, margem lateral máxima de 10 px, alturas e variação contínua de profundidade por tipo solid/ledge/mover. PlatformVolume reprojeta a arte existente w1_organic_island (448×240, núcleo 384, contato y=48), mantendo o pivô de contato e a largura física, com silhueta de rocha assimétrica e reflexões determinísticas. Ilhas sólidas e ledges estáticos respeitam células ocupadas, espinhos e limite de espaço inferior. Móveis conservam a zona, trajetória, velocidade e colisões; seu visual sincroniza no topo físico zone.y−10. Não há alteração nas pontes especiais ou demais mundos. A opção ?platforms=0 compara com a etapa anterior. QA verifica perfis, presença de volumes, pivô, pixels visíveis, ausência de alfa sobre espinhos estáticos, sincronização dos movers existentes, paridade de corpos e capturas A/B por tipo quando disponível. Não é um teste de salto/aterrissagem humano, nem produz nova arte; art direction, plataformas de outros tipos (crumble/bloom/fadeplat) e validação da trajetória completa de movers permanecem pendentes.

## Fase 04 — composição pictórica em planos (piloto 1-1)

DepthComposition centraliza sete planos lógicos: distante (.08), intermediário (.27), próximo (.66), arquitetura ancorada no mundo (1), terreno (1), primeiro plano superior (1.12) e inferior (1.24). São reutilizadas as três pinturas de fundo, não sete novos assets. GameScene consome o manifesto e preserva os efeitos presos às texturas, a compensação de zoom, o marco único e ColorRestore. A vegetação frontal fica em bandas de 48/44 px e é ocultada integralmente quando ameaça cobrir Íris ou espinhos estáticos visíveis. Não há fade de props. Remove a segunda camada de haze redundante somente nesse piloto; mantém atmosfera entre planos. Qualidade baixa, redução de movimento e outras fases mantêm os caminhos existentes. `?depth=0` desativa apenas a nova composição. Testes puros verificam projeção, paralaxe e oclusão; CI inspeciona os valores dos TileSprites em dois pontos de câmera e zoom, opacidade, limites e ordem de planos. Ainda não há malha 3D, oclusão por pixel, composição inédita de cada região, nem validação de legibilidade de todos os objetos dinâmicos. Os fatores são escolhas artísticas iniciais, sujeitos a playtest.
