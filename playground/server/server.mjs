import markoExpress from '@marko/express';
import { createRsbuild, loadConfig } from '@rsbuild/core';
import express from 'express';
import example from './templates/example.js';

const PORT = 4000;

async function startDevServer() {
  const { content } = await loadConfig({});
  const rsbuild = await createRsbuild({
    rsbuildConfig: content,
  });

  const app = express();
  const rsbuildServer = await rsbuild.createDevServer();

  app.use(markoExpress());

  app.get('/', (req, res) => {
    const template = example.default.default || example.default;
    const result = template.render({});
    res.send(String(result));
  });

  app.use(rsbuildServer.middlewares);

  const httpServer = app.listen(PORT, async () => {
    await rsbuildServer.afterListen();
    console.log(`Server is running on http://localhost:${PORT}`);
  });

  rsbuildServer.connectWebSocket({ server: httpServer });
}

startDevServer(process.cwd());
