import markoExpress from '@marko/express';
import { createRsbuild, loadConfig } from '@rsbuild/core';
import express from 'express';
import example from './templates/example.js';

const CLIENT_PORT = 8000;
const SERVER_PORT = 4000;

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

  app.listen(SERVER_PORT, () => {
    console.log(`API server is running on http://localhost:${SERVER_PORT}`);
  });

  const httpServer = app.listen(CLIENT_PORT, async () => {
    await rsbuildServer.afterListen();
    console.log(`Client is running on http://localhost:${CLIENT_PORT}`);
  });

  rsbuildServer.connectWebSocket({ server: httpServer });
}

startDevServer(process.cwd());
