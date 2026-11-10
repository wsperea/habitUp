// Configuración del servidor. Los valores salen de server/.env (ver .env.example).
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';

const here = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(here, '../.env') });

const port = Number(process.env.PORT ?? 3000);
if (!Number.isInteger(port) || port < 1 || port > 65535) {
  throw new Error(`PORT inválido: "${process.env.PORT}"`);
}

export const config = Object.freeze({
  env: process.env.NODE_ENV ?? 'development',
  port,
  mongoUri: process.env.MONGODB_URI ?? 'mongodb://127.0.0.1:27017/habitUp',
  siteDir: path.resolve(here, '../..'), // carpeta habitUp, donde están los HTML
  dataDir: path.resolve(here, '../data'),
});

export const isProd = config.env === 'production';
