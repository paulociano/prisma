# PRISMA 2.0 — Organic World Engine

Status: fase 01 iniciada na main; aprovação visual e CI do novo commit pendentes.
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
