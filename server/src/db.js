import mongoose from 'mongoose';
import dns from 'node:dns/promises';

// Forzar a Node.js a usar los DNS de Google
dns.setServers(['8.8.8.8', '8.8.4.4']);

export async function connectDb() {
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      family: 4 // Forzar IPv4, que a veces ayuda en Render
    });
    console.log('[habitup] MongoDB conectado exitosamente.');
  } catch (error) {
    console.error('[habitup] Error de conexión a MongoDB:', error.message);
    throw error;
  }
}

export async function disconnectDb() {
  await mongoose.disconnect();
}

export function describeDbError(err) {
  return err.message || 'Error desconocido en la base de datos';
}

export function redactUri(uri) {
  if (!uri) return 'URI no definida';
  return uri.replace(/:([^:@]+)@/, ':****@');
}