// Conexión a MongoDB. Para pasar a Atlas solo cambia MONGODB_URI en server/.env.
import mongoose from 'mongoose';
import { config } from './config.js';

mongoose.set('strictQuery', true);

export async function connectDb(uri = config.mongoUri) {
  await mongoose.connect(uri, { serverSelectionTimeoutMS: 5000 });
  return mongoose.connection;
}

export const disconnectDb = () => mongoose.disconnect();
export const isDbReady = () => mongoose.connection.readyState === 1;
export const dbState = () =>
  ['desconectado', 'conectado', 'conectando', 'desconectando'][mongoose.connection.readyState] ?? 'desconocido';

// Oculta usuario y clave al mostrar la URI en consola.
export const redactUri = (uri) => uri.replace(/\/\/[^@/]+@/, '//***@');

export function describeDbError(err) {
  if (err?.name === 'MongooseServerSelectionError' || err?.name === 'MongoServerSelectionError') {
    return [
      `No se pudo conectar a MongoDB (${redactUri(config.mongoUri)}).`,
      '  • Local: verifica que el servicio "MongoDB Server" esté iniciado (Windows: services.msc).',
      '  • Atlas: revisa usuario, clave y que tu IP esté en Network Access.',
      '  • Revisa MONGODB_URI en server/.env.',
    ].join('\n');
  }
  if (err?.code === 18 || /auth/i.test(err?.message ?? '')) {
    return 'MongoDB rechazó las credenciales. Revisa usuario y clave en MONGODB_URI.';
  }
  return `Error de base de datos: ${err?.message ?? err}`;
}
