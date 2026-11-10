import fs from 'node:fs';

// Escritura síncrona: garantiza que el error aparezca en los logs de Render
function logSync(...args) {
  const line = args
    .map((a) => (a instanceof Error ? `${a.stack || a.message}` : typeof a === 'string' ? a : JSON.stringify(a)))
    .join(' ');
  try { fs.writeSync(2, line + '\n'); } catch { console.error(line); }
}

// Captura cualquier fallo que antes pasaba desapercibido
process.on('uncaughtException', (err) => {
  logSync('[habitup] UNCAUGHT EXCEPTION:', err);
  process.exit(1);
});
process.on('unhandledRejection', (reason) => {
  logSync('[habitup] UNHANDLED REJECTION:', reason instanceof Error ? reason : String(reason));
  process.exit(1);
});

logSync(`[habitup] arrancando. Node ${process.version}, NODE_ENV=${process.env.NODE_ENV}`);

const { config } = await import('./config.js');
const { connectDb, disconnectDb, describeDbError, redactUri } = await import('./db.js');
await import('./models/index.js');
const { createApp } = await import('./app.js');

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function connectWithRetry(maxAttempts = 5) {
  const uri = process.env.MONGODB_URI || config.mongoUri;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      logSync(`[habitup] conectando a ${redactUri(uri)} (intento ${attempt}/${maxAttempts})`);
      await connectDb(uri);
      logSync('[habitup] MongoDB conectado.');
      return;
    } catch (err) {
      logSync(`[habitup] fallo de conexión: ${describeDbError(err)}`);
      if (attempt === maxAttempts) throw err;
      await sleep(attempt * 3000);
    }
  }
}

async function main() {
  const PORT = Number(process.env.PORT) || config.port || 10000;

  // Abrir el puerto primero para que Render detecte el servicio
  const server = createApp().listen(PORT, '0.0.0.0', () => {
    logSync(`[habitup] escuchando en el puerto ${PORT}`);
  });
  server.on('error', (err) => {
    logSync('[habitup] error del servidor:', err);
    process.exit(1);
  });

  try {
    await connectWithRetry();
  } catch (err) {
    logSync('[habitup] no se pudo conectar a MongoDB. Error completo:', err);
    process.exit(1);
  }

  const stop = async () => {
    server.close();
    await disconnectDb();
    process.exit(0);
  };
  process.on('SIGINT', stop);
  process.on('SIGTERM', stop);
}

main();