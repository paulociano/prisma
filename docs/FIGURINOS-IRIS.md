# Figurinos de Íris — jornada das sete cores

## Identidade fixa
Íris mantém pele morena, sardas, olhos âmbar, cabelo lilás com mecha branca, proporção 3,5 cabeças, echarpe iridescente, luvas sem dedos e silhueta reconhecível. Não alterar hitbox, altura nominal, direção, poses ou timing. A recompensa é cosmética, poderes seguem a história existente.

| Mundo concluído | Item | Figurino no próximo mundo (direção para arte autoral) |
|---|---|---|
| 1 Vale do Coração | Broche do Coração | Jaqueta de viajante rubi, broche de cristal no peito |
| 2 Cânion do Entardecer | Faixa do Entardecer | Casaco curto cobre, faixa laranja no cinto |
| 3 Cidade Solar | Insígnia Solar | Traje ocre com detalhes solares e ombreira leve |
| 4 Selva Esmeralda | Manto Esmeralda | Manto curto verde de folhas, preserva echarpe de ataque |
| 5 Recife Turquesa | Bracelete das Marés | Traje leve turquesa, bracelete cristalino |
| 6 Ilhas do Céu Anil | Botas Estelares | Casaco índigo e botas de viagem com pequenas estrelas |
| 7 Cidadela Cinza | Emblema da Plenitude | Traje violeta final com as sete marcas |

## Implementação inicial
A conclusão de cada chefão é derivada do save existente (completed), sem migração. Figurino desbloqueado ao concluir o mundo e usado no seguinte, com recompensa na tela de conclusão. Último traje disponível ao revisitar mundo 7 após final. Revisitas aos mundos anteriores usam o figurino daquela etapa narrativa; itens permanecem conquistados. Acesso de debug sem chefes anteriores completos mantém traje original. Subfases e arenas usam o figurino do mundo pai.

O build gera variantes provisórias dos atlas existentes: recolorimento seletivo de regiões amarelas da jaqueta e bordados representando até sete recompensas. Não cria novas silhuetas de botas, mantos ou acessórios; seleção de cor heurística pode não detectar tecido em certas poses ou atingir outra área amarela. Teste sintético preserva alfa, pele de referência e registro; ainda exige inspeção real. Sem alteração dos sprites originais, animações, física ou câmera. Variantes carregam junto do respectivo mundo.

## Arte autoral completa
Coloque todos os 12 sheets de origem de um estágio na pasta `assets/raw/personagens/figurinos/stage_N/` (N=1..7), com os mesmos nomes originais em personagens/: iris_idle.png, iris_run.png, iris_jump.png, iris_attack.png, iris_hurt_win.png, iris_doublejump.png, iris_dash.png, iris_glide.png, iris_wall.png, iris_swim.png, iris_shoot.png, iris_pound.png. Os dois atlas do mergulho são recortados do mesmo sheet. Preserve grades, ordem, poses, direção e altura do pipeline em scripts/process-assets.mjs. Use o mesmo modelo base da ficha de Íris, com as peças acumuladas. Cada pasta só é adotada se completa e com todos os frame counts iguais aos originais; caso contrário é gerada a variante provisória para todo o estágio. Conferir pivôs e poses visualmente antes de publicar arte autoral. Retratos, HUD e cutscenes continuam originais nesta etapa.

Teste: npm run test:wardrobe; npm run assets; npm run build; revisão in-game de cada fase e habilidade. Não afirmar que a arte final está aprovada até comparação real.
