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
