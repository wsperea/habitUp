// Lectura y validación de los JSON exportados de MongoDB (Extended JSON: {"$oid":…}, {"$date":…}).
import fs from 'node:fs';
import path from 'node:path';
import mongoose from 'mongoose';
import { DIAS } from '../constants.js';
import { isNoonUtc } from '../util/dates.js';

const { EJSON } = mongoose.mongo.BSON;
export const PASSWORD_PLACEHOLDER = 'pendiente_de_hash';

// Busca el archivo cuyo nombre contenga la palabra (p. ej. "habitUp_habitos.json" o "habitUp.habitos.json").
export function readCollection(dir, name) {
  const file = fs.readdirSync(dir).find((f) => f.toLowerCase().endsWith('.json') && f.toLowerCase().includes(name));
  if (!file) throw new Error(`No encontré un archivo JSON de "${name}" en ${dir}`);
  const docs = EJSON.parse(fs.readFileSync(path.join(dir, file), 'utf8'));
  if (!Array.isArray(docs)) throw new Error(`${file} debe contener un arreglo de documentos`);
  return docs;
}

export const loadDataset = (dir) => ({
  usuarios: readCollection(dir, 'usuarios'),
  habitos: readCollection(dir, 'habitos'),
  registros: readCollection(dir, 'registros'),
});

const isOid = (v) => v?._bsontype === 'ObjectId';
const isDate = (v) => v instanceof Date && !Number.isNaN(v.getTime());
const isText = (v) => typeof v === 'string' && v.trim().length > 0;
const looksHashed = (v) => /^\$2[aby]\$\d{2}\$/.test(v);

export function validateDataset({ usuarios, habitos, registros }) {
  const errors = [];
  const warnings = [];
  const err = (m) => errors.push(m);

  const ids = (docs, label) => {
    const seen = new Set();
    docs.forEach((d, i) => {
      if (!isOid(d._id)) return err(`${label}[${i}]: _id inválido`);
      const k = String(d._id);
      if (seen.has(k)) err(`${label}[${i}]: _id duplicado`);
      seen.add(k);
    });
    return seen;
  };
  const userIds = ids(usuarios, 'usuarios');
  const habitIds = ids(habitos, 'habitos');
  ids(registros, 'registros');

  const emails = new Set();
  usuarios.forEach((u, i) => {
    const at = `usuarios[${i}]`;
    if (!isText(u.nombre)) err(`${at}: nombre vacío`);
    if (!isText(u.correo) || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(u.correo)) err(`${at}: correo inválido`);
    else {
      const e = u.correo.trim().toLowerCase();
      if (emails.has(e)) err(`${at}: correo duplicado (${e})`);
      emails.add(e);
    }
    if (!isText(u.password)) err(`${at}: falta password`);
    else if (u.password === PASSWORD_PLACEHOLDER) {
      warnings.push(`${at} (${u.correo}): la contraseña es un marcador; no podrá iniciar sesión hasta asignarle una con hash (paso 2).`);
    } else if (!looksHashed(u.password)) err(`${at}: la contraseña está en texto plano; debe ser un hash bcrypt`);
    if (u.fecha_registro !== undefined && !isDate(u.fecha_registro)) err(`${at}: fecha_registro inválida`);
  });

  const owner = new Map();
  habitos.forEach((h, i) => {
    const at = `habitos[${i}]`;
    if (!userIds.has(String(h.usuario_id))) err(`${at}: usuario_id no existe en usuarios`);
    owner.set(String(h._id), String(h.usuario_id));
    if (!isText(h.nombre)) err(`${at}: nombre vacío`);
    const dias = h.frecuencia?.dias;
    if (!Array.isArray(dias) || !dias.length || new Set(dias).size !== dias.length || dias.some((d) => !DIAS.includes(d))) {
      err(`${at}: frecuencia.dias inválido (usa: ${DIAS.join(', ')})`);
    }
    if (typeof h.activo !== 'boolean') err(`${at}: activo debe ser true o false`);
    if (h.fecha_creacion !== undefined && !isDate(h.fecha_creacion)) err(`${at}: fecha_creacion inválida`);
  });

  const seen = new Set();
  registros.forEach((r, i) => {
    const at = `registros[${i}]`;
    if (!habitIds.has(String(r.habito_id))) err(`${at}: habito_id no existe en habitos`);
    if (!userIds.has(String(r.usuario_id))) err(`${at}: usuario_id no existe en usuarios`);
    else if (owner.has(String(r.habito_id)) && owner.get(String(r.habito_id)) !== String(r.usuario_id)) {
      err(`${at}: el hábito pertenece a otro usuario`);
    }
    if (!isDate(r.fecha)) err(`${at}: fecha inválida`);
    else {
      if (!isNoonUtc(r.fecha)) warnings.push(`${at}: la fecha no está a las 12:00 UTC; se normalizará al importar.`);
      const k = `${r.habito_id}|${r.fecha.toISOString().slice(0, 10)}`;
      if (seen.has(k)) err(`${at}: ya existe un registro de ese hábito en ese día`);
      seen.add(k);
    }
    if (typeof r.completado !== 'boolean') err(`${at}: completado debe ser true o false`);
  });

  return { errors, warnings };
}
