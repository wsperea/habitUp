import dns from 'node:dns/promises';
dns.setServers(['8.8.8.8', '8.8.4.4']); // Forzar DNS de Google para Render

import { config } from './config.js';
import { connectDb, disconnectDb, describeDbError, redactUri } from './db.js';
import './models/index.js';
import { createApp } from './app.js';

async function main() {
  console.log(`[habitup] conectando a ${redactUri(config.mongoUri)} …`);
  try {
    await connectDb();
    console.log('[habitup] MongoDB conectado exitosamente.');
  } catch (err) {
    console.error(`[habitup] ${describeDbError(err)}`);
    process.exit(1);
  }

  // Usar el puerto de Render (process.env.PORT) o el de config (para local)
  const PORT = process.env.PORT || config.port;

  const server = createApp().listen(PORT, '0.0.0.0', () => {
    console.log(`[habitup] conectado. Sitio y API en el puerto ${PORT}`);
  });
  
  server.on('error', (err) => {
    console.error(err.code === 'EADDRINUSE'
      ? `[habitup] El puerto ${PORT} ya está en uso.`
      : `[habitup] ${err.message}`);
    process.exit(1);
  });

  const stop = async () => { server.close(); await disconnectDb(); process.exit(0); };
  process.on('SIGINT', stop);
  process.on('SIGTERM', stop);
}

main();