# Figurinos ambientais de Íris

O mundo define o traje diretamente. Mundo 1 usa os sprites originais em `assets/raw/personagens/`. Mundos 2–7 usam `assets/raw/personagens/figurinos/stage_N/`, com N igual ao número do mundo. Arenas, subfases e revisitas usam o mesmo traje ambiental. O jogo termina no mundo 7: não existe traje pós-final.

| Mundo | Traje | Recompensa anterior incorporada |
|---|---|---|
| 1 Vale do Coração | Original | — |
| 2 Cânion do Entardecer | Expedição desértica | Broche do Coração |
| 3 Cidade Solar | Parkour urbano | Faixa do Entardecer |
| 4 Selva Esmeralda | Expedição tropical | Insígnia Solar |
| 5 Recife Turquesa | Anfíbio | Manto Esmeralda |
| 6 Ilhas do Céu Anil | Altitude | Bracelete das Marés |
| 7 Cidadela Cinza | Guardião do Prisma | Botas Estelares |

Os seis presentes anteriores permanecem integrados aos figurinos autorais. A recompensa da conclusão de cada mundo 1–6 aparece no resultado; poderes, saves e câmera não mudam. A seleção por mundo não depende de um save completo (inclui acesso de debug).

## Contrato dos arquivos
Cada stage 2–7 usa 11 sheets: iris_idle.png, iris_run.png, iris_jump.png, iris_attack.png, iris_hurt_win.png, iris_doublejump.png, iris_dash.png, iris_glide.png, iris_wall.png, iris_shoot.png, iris_pound.png. Somente stage 5 também usa iris_swim.png. O mergulho estelar gera dois atlas do mesmo sheet. Total: 67 arquivos autorais. Preservar a grade, poses, escala e pivôs dos originais. Natação original permanece para compatibilidade, sem versões personalizadas fora do mundo 5.

O build processa cada sheet válido independentemente. Exige região transparente e opaca não trivial e número de frames do contrato original. Arquivo ausente, ilegível, sem alpha útil ou quantidade incorreta de frames usa a animação original correspondente com aviso no log; não bloqueia as demais artes. Não gera recolorimentos procedurais nem atlas pós-final. A validação automática não prova identidade, ordem visual, proporções, direção ou recorte: revisão no navegador é necessária. Retratos, HUD e cutscenes continuam originais.

Em 27/11/2026 foram localizados 65/67 arquivos; faltavam apenas stage_7/iris_hurt_win.png e stage_7/iris_wall.png. Quando incluídos, entram no próximo build automaticamente se válidos.

Testes: npm run test:wardrobe; npm run assets; npm run build; playtest dos sete mundos.

## Ajuste de recorte e escala
Idle e pulo autorais usam leitura por células ocupadas e detecção de grades alternativas; ilhas separadas podem ser recuperadas quando cruzam uma divisão nominal. Idle com duas ou três poses separadas pode repetir poses para manter quatro frames; não inventa uma animação. O recorte registra a grade e contagem no log. Natação tem altura nominal de 110 px (antes 62), mantendo zoom normal de 1,636× e câmera original nas arenas. `node scripts/check-wardrobe-assets.mjs` verifica que os atlas idle/jump de todos os mundos e swim normalizado foram publicados; impede deploy silencioso com fallback nesses estados. Revisão visual e jogo real ainda necessários.
