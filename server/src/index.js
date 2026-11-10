import { config } from './config.js';
import { connectDb, disconnectDb, describeDbError, redactUri } from './db.js';
import './models/index.js';
import { createApp } from './app.js';

async function main() {
  console.log(`[habitup] conectando a ${redactUri(config.mongoUri)} …`);
  try {
    await connectDb();
  } catch (err) {
    console.error(`[habitup] ${describeDbError(err)}`);
    process.exit(1);
  }

  const server = createApp().listen(config.port, () => {
    console.log(`[habitup] conectado. Sitio y API en http://localhost:${config.port}`);
  });
  server.on('error', (err) => {
    console.error(err.code === 'EADDRINUSE'
      ? `[habitup] El puerto ${config.port} ya está en uso. Cierra el otro proceso o cambia PORT en .env.`
      : `[habitup] ${err.message}`);
    process.exit(1);
  });

  const stop = async () => { server.close(); await disconnectDb(); process.exit(0); };
  process.on('SIGINT', stop);
  process.on('SIGTERM', stop);
}

main();
