// Importa los JSON de server/data a MongoDB. Se puede ejecutar varias veces (actualiza por _id).
//   npm run import:dry   → solo valida, no toca la base de datos
//   npm run import       → valida e importa
//   npm run import -- --dir "C:\ruta\a\los\json"
import path from 'node:path';
import { config } from '../src/config.js';
import { connectDb, disconnectDb, describeDbError, redactUri } from '../src/db.js';
import { Usuario, Habito, Registro } from '../src/models/index.js';
import { loadDataset, validateDataset } from '../src/import/dataset.js';
import { toNoonUtc } from '../src/util/dates.js';

const args = process.argv.slice(2);
const dry = args.includes('--dry-run');
const dirIdx = args.indexOf('--dir');
const dir = dirIdx >= 0 ? path.resolve(args[dirIdx + 1]) : config.dataDir;

async function upsertAll(Model, docs) {
  let n = 0;
  for (const doc of docs) {
    await Model.collection.replaceOne({ _id: doc._id }, doc, { upsert: true });
    n++;
  }
  return n;
}

async function main() {
  console.log(`Leyendo JSON desde: ${dir}`);
  const data = loadDataset(dir);
  console.log(`Encontrados → usuarios: ${data.usuarios.length}, hábitos: ${data.habitos.length}, registros: ${data.registros.length}`);

  const { errors, warnings } = validateDataset(data);
  warnings.forEach((w) => console.warn(`  ⚠ ${w}`));
  if (errors.length) {
    errors.forEach((e) => console.error(`  ✘ ${e}`));
    console.error(`\nSe encontraron ${errors.length} error(es). No se importó nada.`);
    process.exit(1);
  }
  console.log('Validación correcta.');
  if (dry) return console.log('Modo --dry-run: no se escribió nada en la base de datos.');

  data.registros.forEach((r) => { r.fecha = toNoonUtc(r.fecha); });

  console.log(`\nConectando a ${redactUri(config.mongoUri)} …`);
  await connectDb();
  const u = await upsertAll(Usuario, data.usuarios);
  const h = await upsertAll(Habito, data.habitos);
  const r = await upsertAll(Registro, data.registros);
  await Promise.all([Usuario.syncIndexes(), Habito.syncIndexes(), Registro.syncIndexes()]);
  console.log(`Importados → usuarios: ${u}, hábitos: ${h}, registros: ${r}`);
  console.log(`En la base ahora → usuarios: ${await Usuario.countDocuments()}, hábitos: ${await Habito.countDocuments()}, registros: ${await Registro.countDocuments()}`);
}

main()
  .catch((err) => { console.error(describeDbError(err)); process.exitCode = 1; })
  .finally(() => disconnectDb());
