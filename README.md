# Prisma

Jogo de plataforma 2D com temática LGBTQIA+. Íris, uma pessoa jovem não-binária, atravessa sete
mundos — um para cada cor do arco-íris — para devolver as cores roubadas por Monocromo.
Ninguém é derrotado: inimigos e chefões recuperam a própria cor.

- 7 mundos, 28 fases (21 normais + 7 chefões), mapa-múndi e mapa de cada mundo
- Habilidades ganhas dos guardiões: pulo duplo, dash, pulo na parede, planar, disparo de prisma e mergulho estelar
- Cutscenes de abertura e final, final verdadeiro com os 63 fragmentos
- Dificuldade (Tranquilo / Normal / Desafiador) e modo daltônico
- Teclado, gamepad e progresso salvo no navegador

Feito com [Phaser 3](https://phaser.io), TypeScript e Vite.

## Rodando

Precisa do [Node.js](https://nodejs.org) (versão LTS).

```bash
npm install
npm run assets   # processa as imagens e sons de assets/ para public/assets
npm run dev      # abre em http://localhost:5173
```

| Comando | O que faz |
|---|---|
| `npm run assets` | Recorta os sprite sheets, monta os atlas e copia o áudio (rode sempre que mudar algo em `assets/`) |
| `npm run dev` | Servidor de desenvolvimento |
| `npm run build` | Versão final em `dist/` (para publicar, por exemplo no itch.io) |
| `npm run check-levels` | Simula os pulos com a física do jogo e confere se todas as fases são completáveis |

## Controles

← → andar · Espaço/Z pular (segure para ir mais alto) · X golpe de echarpe · C disparo ·
Shift dash · ↓ no ar mergulho estelar · ESC pausa · M som

## Estrutura

| Pasta | Conteúdo |
|---|---|
| `assets/` | Arte e áudio originais (imagens geradas, músicas, efeitos) |
| `src/levels/` | As fases, montadas por código, e o gerador dos trechos extras |
| `src/objects/` | Íris, inimigos e os chefões |
| `src/scenes/` | Telas: carregamento, título, mapas, fase, HUD, diálogos, cutscenes, opções |
| `src/systems/` | Controles, áudio, save, configurações e restauração de cor |
| `scripts/` | Pipeline de assets e verificador de fases |
| `docs/` | Guia do projeto e todos os prompts usados para gerar a arte |
