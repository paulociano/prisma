import fs from 'node:fs';
import { defineConfig, type Plugin } from 'vite';

// Só em desenvolvimento: recebe uma captura da tela do jogo (POST /__snap) e salva em .debug/,
// para inspecionar a arte em resolução cheia durante os testes.
function snapshotEndpoint(): Plugin {
  return {
    name: 'prisma-snapshot',
    apply: 'serve',
    configureServer(server) {
      server.middlewares.use('/__snap', (req, res) => {
        if (req.method !== 'POST') return res.end();
        const chunks: Buffer[] = [];
        req.on('data', (c: Buffer) => chunks.push(c));
        req.on('end', () => {
          const name = (new URL(req.url ?? '', 'http://x').searchParams.get('name') ?? 'snap').replace(/[^\w-]/g, '');
          const data = Buffer.concat(chunks).toString().replace(/^data:image\/\w+;base64,/, '');
          fs.mkdirSync('.debug', { recursive: true });
          fs.writeFileSync(`.debug/${name}.png`, Buffer.from(data, 'base64'));
          res.end('ok');
        });
      });
    },
  };
}

export default defineConfig({
  // caminhos relativos para o build funcionar no itch.io
  base: './',
  server: { port: 5173 },
  build: { chunkSizeWarningLimit: 2000 },
  plugins: [snapshotEndpoint()],
});
