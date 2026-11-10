import mongoose from 'mongoose';

mongoose.set('strictQuery', true);

export function redactUri(uri) {
  if (!uri) return 'URI no definida';
  return uri.replace(/\/\/([^:@/]+):([^@]+)@/, '//$1:****@');
}

export function describeDbError(err) {
  if (!err) return 'Error desconocido';
  const parts = [err.name, err.code, err.message].filter(Boolean);
  return parts.join(' | ') || 'Error desconocido';
}

export async function connectDb(uri = process.env.MONGODB_URI) {
  if (!uri) throw new Error('MONGODB_URI no está definida en las variables de entorno');
  await mongoose.connect(uri, {
    family: 4,
    serverSelectionTimeoutMS: 15000,
    connectTimeoutMS: 15000,
    maxPoolSize: 5
  });
}

export async function disconnectDb() {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
  }
}

export function dbState() {
  const states = ['disconnected', 'connected', 'connecting', 'disconnecting'];
  return states[mongoose.connection.readyState] || 'unknown';
}

export function isDbReady() {
  return mongoose.connection.readyState === 1;
}