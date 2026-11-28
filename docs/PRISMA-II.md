# PRISMA II · Além do Espectro

Primeira entrega: mapa e rota piloto de Opala. O final original permanece canônico, sem w7_reward. Depois de terminar a Parte I (save.finished), a tela título e o mapa original oferecem PRISMA II. Retornar ao mapa I é possível. O progresso novo fica em prisma-part2-v1; o save original e os 28 níveis não mudam. Novo jogo limpa ambos após a confirmação existente.

Sete regiões (8–14), coleção Memórias do Espectro com as artes aprovadas, insígnias bloqueadas até a restauração real dos respectivos mundos. A rota de teste 8 é uma área independente, com duas criaturas de Opala, plataforma provisória de gelo, vento, checkpoint, combate restaurativo e saída que exige restaurar todas as criaturas. Todas as habilidades começam disponíveis; o uniforme part2 é compartilhado. A rota é explicitamente experimental e não concede insígnia nem representa a conclusão de 8-4. Os mundos 9–14 estão em desenvolvimento.

Pipeline: world_map_part2, part2_insignia_8..14, part2_iris_* e w8..14_bg_far/enemy/enemy_alt. Os assets compartilhados carregam junto de Opala, não no boot da Parte I. O mapa só libera a rota se o pack de sprites de Íris e as duas criaturas estiverem disponíveis. A presença de um atlas não prova a identidade, a continuidade do bastão ou a ordem visual dos quadros. A música map_part2 e w8, efeitos staff_* (ataque, extensão/retração, disparo, dash, planar, impacto), restauração, portal, victory_part2 e ambiente w8 foram ligados à rota; hurt é compartilhado. Trilhas de chefão por mundo registradas na seleção para integração futura. Os demais sons estão no manifest, ainda sem seus eventos finais.

Pendente: validar build/atlas e playtest real; completar inimigos restantes e arte dos cenários, terrenos, props, guardiões e chefões; implementar níveis completos, mecânicas próprias de cada mundo, cutscenes e entrega real das insígnias. A física experimental usa Player e Controls existentes, mas não substitui GameScene nem os saves da Parte I.

### Critérios de verificação
- No mapa original, o botão II não existe antes de `finished`.
- A rota só abre se todos os IDs de quadros esperados estiverem no atlas de cada animação e inimigo (não basta arquivo presente).
- Ao restaurar os quatro inimigos e alcançar a saída, `pilotCleared` persiste sem conceder medalha; voltar ao mapa I não altera o save original.
- Ao sair/reiniciar, os loops de ambiente e planar param. O HUD mantém o enquadramento fixo e os controles de toque.

## Segunda entrega: prévia de Opala
- 8-1 Trilhas da Geada: inércia em superfícies geladas, carapaças resistentes e restauração.
- 8-2 Grutas de Opala: paredes para wall jump, plataformas frágeis rompidas com pound.
- 8-3 Ponte das Rajadas: vento em sentidos alternados, dash e planar.
- 8-4 Santuário Congelado: protótipo da Coroa da Geada com aviso de rajada, ataque e janela de núcleo exposto; seis acertos válidos restauram a entidade. Forma geométrica temporária, não é a arte final.
- Cada fase de prévia concluída abre a próxima e salva em `opalPreviewCleared`. A conclusão antiga do piloto é preservada, mas não pula uma fase nova. Mesmo restaurando a Coroa no protótipo, a coleção não recebe insígnia: o encerramento definitivo com guardião e arte oficial ainda não existe.
- O pipeline aceita bg_mid/bg_near, ground_texture, tiles_kit, props, world_map e boss_arena dos mundos 8–14, sem exigir arquivos ausentes. Opala usa as camadas de fundo, textura do chão, mapa e arena quando disponíveis; tiles/props ainda não são posicionados no gameplay.
- Todos os controles e os saves da Parte I permanecem independentes. A aderência é um parâmetro por instância do Player, padrão 1.

## Produção de Opala · Niva e Coroa da Geada
Inventário confirmado em f0294e6f: os 14 inimigos da Parte II estão presentes; Opala contém bg_far, enemy, enemy_alt, insignia e guardian_ref. Ainda não constam na main bg_mid, bg_near, tiles_kit, ground_texture, props, world_map e boss_arena de Opala. A publicação do protótipo de quatro fases (e2301214) passou em Quality e Deploy.

O pipeline registra guardian_ref (8 frames, mesmo layout dos guardiões anteriores), boss_idle (4, 2x2), boss_attack (6, 3x2), boss_end (4, 2x2) e boss_projectiles (6, 3x2) para os sete novos mundos. Ausência não bloqueia o protótipo. Niva está registrada como speaker de DialogueScene; as falas e a substituição do proxy da Coroa serão ligadas ao fluxo definitivo depois de conferir as artes.

### Núcleo narrativo proposto
Niva congelou o santuário na tentativa de preservar tudo que amava. A Coroa da Geada é uma criatura cervídea de cristal opalino que materializa esse excesso de proteção, não um povo ou identidade. Seu núcleo fica protegido até liberar a rajada. Íris restaura a criatura sem destruí-la. A insígnia da Transformação é um troféu independente, não equipamento.

Antes: Niva: “Eu quis proteger tudo que amo. Mas, quando o medo tomou conta, até os caminhos deixaram de mudar.” Íris: “Cuidar também é deixar que a vida encontre novos caminhos.”
Depois: Niva: “Aprendi que mudar não significa perder quem somos.” Íris: “Podemos levar nossas memórias conosco, sem deixar que elas nos aprisionem.”
Legenda da insígnia: “Niva entregou a Íris a Memória da Transformação. O gelo finalmente cedeu, e a vida encontrou um novo caminho.”

## Terceira entrega: artes de Opala e encerramento
16 arquivos recebidos em 65b424e9. Renomeado boss_ending.png para boss_end.png sem modificar o blob. O pipeline anterior publicou 12 tiles, 8 frames de Niva e 6 props (esperados 9); a decoração usa somente IDs existentes. A física mantém as mesmas superfícies. Camadas de cenário, textura, tiles e props são consumidos pelo piloto; Coroa usa os atlas oficiais de idle/ataque/final quando válidos, e os efeitos usam frames 0–1 de boss_projectiles. Niva fala antes/depois do combate e a animação final precede o diálogo. O progresso e a primeira insígnia só são concedidos mediante restauração real do chefe, rotas concluídas e os atlas/ilustrações obrigatórios do encerramento presentes; prévias antigas não concedem medalha automaticamente. O encerramento usa cs_w8_outro, cs_w8_reward, cs_w8_transition, com legendas em src/story/opalStory.ts. Mundo 9 ainda em desenvolvimento. Não houve validação visual nem playtest completo nesta edição.
