import mongoose from 'mongoose';
import dns from 'node:dns/promises';

dns.setServers(['8.8.8.8', '8.8.4.4']);

export async function connectDb() {
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      family: 4,
      serverSelectionTimeoutMS: 15000,
      maxPoolSize: 1, // <-- IMPORTANTE: Evita que Render se quede sin memoria
      minPoolSize: 0,
      socketTimeoutMS: 45000
    });
    console.log('[habitup] MongoDB conectado exitosamente.');
  } catch (error) {
    console.error('[habitup] ERROR DETALLADO DE MONGODB:', error);
    throw error;
  }
}

export async function disconnectDb() {
  await mongoose.disconnect();
}

export function dbState() {
  const states = ['disconnected', 'connected', 'connecting', 'disconnecting'];
  return states[mongoose.connection.readyState] || 'unknown';
}

export function isDbReady() {
  return mongoose.connection.readyState === 1;
}

export function describeDbError(err) {
  return err.message || 'Error desconocido en la base de datos';
}

export function redactUri(uri) {
  if (!uri) return 'URI no definida';
  return uri.replace(/:([^:@]+)@/, ':****@');
}