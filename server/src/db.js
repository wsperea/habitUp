import mongoose from 'mongoose';
import dns from 'node:dns/promises'; // Importar DNS

// Forzar el uso de los DNS de Google para que Render encuentre el clúster
dns.setServers(['8.8.8.8', '8.8.4.4']);

export async function connectDb() {
  try {
    // Conectamos usando la variable de entorno y forzando IPv4
    await mongoose.connect(process.env.MONGODB_URI, {
      family: 4, 
      serverSelectionTimeoutMS: 5000
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

// Funciones auxiliares que tenías (describeDbError, redactUri, etc.)
export function describeDbError(err) {
  return err.message || 'Error desconocido en la base de datos';
}

export function redactUri(uri) {
  if (!uri) return 'URI no definida';
  return uri.replace(/:([^:@]+)@/, ':****@');
}