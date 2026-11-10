// DATOS DE PRUEBA. Solo se usan con CONFIG.MODE = 'demo'. Son deterministas (sin azar)
// y relativos a "hoy", así que siempre hay una racha visible.
import { WEEK_ORDER, todayKey, shiftDateKey, dayLetterOf } from '../core/date.js';

const ALL = [...WEEK_ORDER];
const WORKDAYS = ['L', 'M', 'X', 'J', 'V'];

const SEED_HABITS = [
  { id: 'h-meditar',   name: 'Meditar 10 min',        category: 'Bienestar mental',            days: ALL,      active: true },
  { id: 'h-leer',      name: 'Leer 20 páginas',       category: 'Aprendizaje y conocimiento',  days: ALL,      active: true },
  { id: 'h-caminar',   name: 'Caminar 30 min',        category: 'Salud y bienestar',           days: ALL,      active: true },
  { id: 'h-ejercicio', name: 'Hacer ejercicio',       category: 'Salud y bienestar',           days: WORKDAYS, active: true },
  { id: 'h-estirar',   name: 'Estirar 10 min',        category: 'Salud y bienestar',           days: ALL,      active: true },
  { id: 'h-diario',    name: 'Escribir en mi diario', category: 'Bienestar mental',            days: ALL,      active: true },
  { id: 'h-dormir',    name: 'Dormir 8 horas',        category: 'Salud y bienestar',           days: ALL,      active: true },
  { id: 'h-agua',      name: 'Tomar agua',            category: 'Salud y bienestar',           days: ALL,      active: false }, // pausado
];

// idx = posición del hábito entre los programados ese día.
function isCompleted(offset, idx) {
  if (offset === 0) return idx < 4;          // hoy: avance parcial
  if (offset <= 14) return true;             // 14 días perfectos → racha
  if (offset === 15) return false;           // día fallado: corta la racha
  return (offset + idx) % 3 !== 0;           // historial anterior con huecos
}

export function buildSeedState(today = todayKey()) {
  const createdAt = `${shiftDateKey(today, -45)}T08:00:00.000Z`;
  const habits = SEED_HABITS.map((h) => ({ ...h, days: [...h.days], createdAt }));
  const completions = [];

  for (let offset = 0; offset < 30; offset++) {
    const date = shiftDateKey(today, -offset);
    const letter = dayLetterOf(date);
    habits
      .filter((h) => h.active && h.days.includes(letter))
      .forEach((h, idx) => { if (isCompleted(offset, idx)) completions.push({ habitId: h.id, date }); });
  }

  return {
    version: 1,
    meta: { source: 'demo', createdAt },
    user: { id: 'u-demo', name: 'Lucía Martínez', email: 'lucia@example.com', createdAt },
    settings: { theme: 'dark', notifications: true },
    habits,
    completions,
  };
}
