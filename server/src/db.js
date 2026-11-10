import mongoose from 'mongoose';

mongoose.set('strictQuery', true);

export function redactUri(uri) {
  if (!uri) return 'URI no definida';
  return uri.replace(/\/\/([^:@/]+):([^@]+)@/, '//$1:****@');
}

export function describeDbError(err) {
  if (!err) return 'Error desconocido';
  const base = [err.name, err.code, err.message].filter(Boolean).join(' | ');
  const servers = err.reason?.servers;
  if (!servers) return base;
  const detalles = [];
  for (const [host, desc] of servers) {
    detalles.push(`${host} -> ${desc.error?.message || desc.type || 'sin detalle'}`);
  }
  return `${base}\nDetalle por servidor:\n  ${detalles.join('\n  ')}`;
}

export async function connectDb(uri = process.env.MONGODB_URI) {
  if (!uri) throw new Error('MONGODB_URI no está definida');
  await mongoose.connect(uri, {
    family: 4,
    serverSelectionTimeoutMS: 20000,
    connectTimeoutMS: 15000,
    maxPoolSize: 5
  });
}

export async function disconnectDb() {
  if (mongoose.connection.readyState !== 0) await mongoose.disconnect();
}

export function dbState() {
  const states = ['disconnected', 'connected', 'connecting', 'disconnecting'];
  return states[mongoose.connection.readyState] || 'unknown';
}

export function isDbReady() {
  return mongoose.connection.readyState === 1;
}