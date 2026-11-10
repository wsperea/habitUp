import { MongoClient } from 'mongodb';

const uri = process.env.MONGODB_URI;
if (!uri) { console.error('Falta MONGODB_URI'); process.exit(1); }

const client = new MongoClient(uri, {
  family: 4,
  serverSelectionTimeoutMS: 20000,
  connectTimeoutMS: 15000
});

client.on('serverHeartbeatFailed', (e) => {
  console.log(`[diag] HEARTBEAT FALLIDO ${e.connectionId}:`, e.failure?.message || e.failure);
});
client.on('serverHeartbeatSucceeded', (e) => {
  console.log(`[diag] HEARTBEAT OK ${e.connectionId}`);
});

try {
  await client.connect();
  const res = await client.db('admin').command({ ping: 1 });
  console.log('[diag] CONEXIÓN OK, ping:', res);
} catch (err) {
  console.log('[diag] FALLO:', err.name, err.message);
  for (const [host, desc] of err.reason?.servers ?? []) {
    console.log(`[diag]   ${host} -> ${desc.error?.message || desc.type}`);
  }
} finally {
  await client.close();
  process.exit(0);
}