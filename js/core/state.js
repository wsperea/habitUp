// Forma del estado, validación y migraciones.
//
// Se guarda SOLO lo esencial. Nivel, XP, rachas y porcentajes NO se guardan:
// se calculan desde habits + completions (fases 8 y 9).
//
// {
//   version, meta:{source,createdAt}, user:{id,name,email,createdAt},
//   settings:{theme,notifications},
//   habits:[{id,name,category,days,active,createdAt}],
//   completions:[{habitId,date}]            // una fila por hábito completado en un día
// }
import { CONFIG } from '../config.js';
import { WEEK_ORDER, isValidDateKey } from './date.js';

export function createEmptyState({ source = 'real', now = new Date() } = {}) {
  const iso = now.toISOString();
  return {
    version: CONFIG.SCHEMA_VERSION,
    meta: { source, createdAt: iso },
    user: { id: '', name: '', email: '', createdAt: iso },
    settings: { theme: 'dark', notifications: true },
    habits: [],
    completions: [],
  };
}

const isObj = (v) => v !== null && typeof v === 'object' && !Array.isArray(v);
const isText = (v) => typeof v === 'string';

// Devuelve una lista de errores. Lista vacía = estado válido.
export function validateState(s) {
  const e = [];
  if (!isObj(s)) return ['el estado no es un objeto'];
  if (s.version !== CONFIG.SCHEMA_VERSION) e.push(`version debe ser ${CONFIG.SCHEMA_VERSION}`);
  if (!isObj(s.meta) || !['demo', 'real'].includes(s.meta.source)) e.push('meta.source debe ser demo o real');
  if (!isObj(s.user) || !isText(s.user.id) || !isText(s.user.name) || !isText(s.user.email)) e.push('user inválido');
  if (!isObj(s.settings) || !isText(s.settings.theme) || typeof s.settings.notifications !== 'boolean') e.push('settings inválido');

  const habitIds = new Set();
  if (!Array.isArray(s.habits)) e.push('habits debe ser un arreglo');
  else s.habits.forEach((h, i) => {
    const at = `habits[${i}]`;
    if (!isObj(h)) return e.push(`${at} no es un objeto`);
    if (!isText(h.id) || !h.id) e.push(`${at}.id inválido`);
    else if (habitIds.has(h.id)) e.push(`${at}.id duplicado`);
    else habitIds.add(h.id);
    if (!isText(h.name) || !h.name.trim()) e.push(`${at}.name vacío`);
    if (!isText(h.category)) e.push(`${at}.category inválida`);
    if (!Array.isArray(h.days) || !h.days.length || new Set(h.days).size !== h.days.length
      || h.days.some((d) => !WEEK_ORDER.includes(d))) e.push(`${at}.days inválido`);
    if (typeof h.active !== 'boolean') e.push(`${at}.active debe ser booleano`);
    if (!isText(h.createdAt)) e.push(`${at}.createdAt inválido`);
  });

  const seen = new Set();
  if (!Array.isArray(s.completions)) e.push('completions debe ser un arreglo');
  else s.completions.forEach((c, i) => {
    const at = `completions[${i}]`;
    if (!isObj(c)) return e.push(`${at} no es un objeto`);
    if (!habitIds.has(c.habitId)) e.push(`${at}.habitId no existe`);
    if (!isValidDateKey(c.date)) e.push(`${at}.date inválida`);
    const k = `${c.habitId}|${c.date}`;
    if (seen.has(k)) e.push(`${at} duplicada`);
    seen.add(k);
  });
  return e;
}

// Migraciones: MIGRATIONS[n] convierte la versión n en n+1.
// Ejemplo futuro: MIGRATIONS[1] = (s) => ({ ...s, version: 2, nuevoCampo: [] });
const MIGRATIONS = {};

export function migrate(state) {
  let s = state;
  if (!isObj(s) || !Number.isInteger(s.version)) return null;
  while (s.version < CONFIG.SCHEMA_VERSION) {
    const step = MIGRATIONS[s.version];
    if (!step) return null;
    s = step(s);
  }
  return s.version === CONFIG.SCHEMA_VERSION ? s : null;
}
