// Pruebas automáticas de la Fase 1. No tocan localStorage ni el HTML de la app:
// usan un adaptador en memoria. Se ejecutan abriendo tests/phase1.html con Live Server.
import { CONFIG, storageKey } from '../js/config.js';
import { toDateKey, fromDateKey, isValidDateKey, shiftDateKey, dayLetterOf } from '../js/core/date.js';
import { createEmptyState, validateState, migrate } from '../js/core/state.js';
import { createStore } from '../js/core/store.js';
import { buildSeedState } from '../js/data/seed.js';

const TODAY = '2026-11-06'; // viernes

function memoryAdapter(initial = null) {
  let data = initial ? structuredClone(initial) : null;
  const subs = new Set();
  return {
    backups: [],
    peek: () => data,
    async load() { return data ? structuredClone(data) : null; },
    async save(s) { data = structuredClone(s); },
    async backup(raw) { this.backups.push(raw); },
    subscribeExternal(cb) { subs.add(cb); return () => subs.delete(cb); },
    emitExternal(s) { subs.forEach((cb) => cb(structuredClone(s))); },
  };
}
const seedStore = (adapter = memoryAdapter()) =>
  createStore({ adapter, createInitialState: () => buildSeedState(TODAY) });

function assert(cond, msg) { if (!cond) throw new Error(msg || 'aserción falsa'); }
function eq(a, b, msg) {
  if (JSON.stringify(a) !== JSON.stringify(b)) throw new Error(`${msg || 'no son iguales'}: ${JSON.stringify(a)} ≠ ${JSON.stringify(b)}`);
}

const TESTS = [
  ['Fechas: viernes 2026-11-06 → letra V', () => eq(dayLetterOf(TODAY), 'V')],
  ['Fechas: cambio de mes y año bisiesto', () => {
    eq(shiftDateKey('2026-03-01', -1), '2026-02-28');
    eq(shiftDateKey('2028-03-01', -1), '2028-02-29');
    eq(shiftDateKey('2026-12-31', 1), '2027-01-01');
  }],
  ['Fechas: ida y vuelta y validación', () => {
    eq(toDateKey(fromDateKey('2026-11-06')), '2026-11-06');
    assert(isValidDateKey('2026-11-06') && !isValidDateKey('2026-02-30') && !isValidDateKey('06/11/2026'));
  }],
  ['Seed: es válido según el esquema', () => eq(validateState(buildSeedState(TODAY)), [])],
  ['Seed: es determinista', () => eq(buildSeedState(TODAY), buildSeedState(TODAY))],
  ['Seed: 8 hábitos, 1 pausado, sin completados del pausado', () => {
    const s = buildSeedState(TODAY);
    eq(s.habits.length, 8);
    eq(s.habits.filter((h) => !h.active).map((h) => h.id), ['h-agua']);
    assert(!s.completions.some((c) => c.habitId === 'h-agua'));
  }],
  ['Seed: hoy 4 completados y los 14 días anteriores perfectos', () => {
    const s = buildSeedState(TODAY);
    eq(s.completions.filter((c) => c.date === TODAY).length, 4);
    for (let o = 1; o <= 14; o++) {
      const d = shiftDateKey(TODAY, -o), letter = dayLetterOf(d);
      const due = s.habits.filter((h) => h.active && h.days.includes(letter)).length;
      eq(s.completions.filter((c) => c.date === d).length, due, `día -${o}`);
    }
    eq(s.completions.filter((c) => c.date === shiftDateKey(TODAY, -15)).length, 0);
  }],
  ['Seed: ninguna fecha futura', () => assert(buildSeedState(TODAY).completions.every((c) => c.date <= TODAY))],
  ['Separación: claves demo/real distintas; real empieza vacío', () => {
    assert(storageKey('demo') !== storageKey('real'));
    const real = createEmptyState({ source: 'real' });
    eq([real.habits.length, real.completions.length, real.meta.source], [0, 0, 'real']);
    eq(buildSeedState(TODAY).meta.source, 'demo');
    eq(validateState(real), []);
  }],
  ['Validación: detecta datos rotos', () => {
    const s = buildSeedState(TODAY);
    s.habits[0].days = ['Z'];
    s.completions.push({ habitId: 'no-existe', date: '2026-13-40' });
    assert(validateState(s).length >= 3);
    eq(migrate({ version: 99 }), null);
  }],
  ['Store: primer arranque guarda el estado inicial', async () => {
    const a = memoryAdapter(), st = seedStore(a);
    await st.init();
    eq(a.peek().habits.length, 8);
  }],
  ['Store: con datos guardados los carga y no los pisa', async () => {
    const saved = buildSeedState(TODAY); saved.user.name = 'Guardado';
    const st = seedStore(memoryAdapter(saved));
    await st.init();
    eq(st.getState().user.name, 'Guardado');
  }],
  ['Store: estado congelado (inmutable)', async () => {
    const st = seedStore(); await st.init();
    assert(Object.isFrozen(st.getState()) && Object.isFrozen(st.getState().habits[0]));
    let threw = false;
    try { st.getState().user.name = 'x'; } catch { threw = true; }
    assert(threw, 'debería lanzar error al mutar');
  }],
  ['Store: update crea nuevo estado y no altera el anterior', async () => {
    const st = seedStore(); await st.init();
    const before = st.getState();
    st.update((d) => { d.user.name = 'Nuevo'; });
    eq(before.user.name, 'Lucía Martínez');
    eq(st.getState().user.name, 'Nuevo');
    assert(before !== st.getState());
  }],
  ['Store: update inválido se rechaza sin cambiar nada', async () => {
    const st = seedStore(); await st.init();
    let threw = false;
    try { st.update((d) => { d.habits[0].name = '   '; }); } catch { threw = true; }
    assert(threw);
    eq(st.getState().habits[0].name, 'Meditar 10 min');
  }],
  ['Store: update persiste en el adaptador', async () => {
    const a = memoryAdapter(), st = seedStore(a); await st.init();
    st.update((d) => { d.settings.notifications = false; });
    await st.flush();
    eq(a.peek().settings.notifications, false);
  }],
  ['Store: suscripción, meta y cancelación', async () => {
    const st = seedStore(); await st.init();
    const calls = [];
    const off = st.subscribe((s, m) => calls.push(m.type + ':' + (m.reason || '')));
    st.update((d) => { d.user.name = 'A'; }, { reason: 'x' });
    off();
    st.update((d) => { d.user.name = 'B'; });
    eq(calls, ['update:x']);
  }],
  ['Store: cambio externo (otra pestaña) actualiza y notifica', async () => {
    const a = memoryAdapter(), st = seedStore(a); await st.init();
    let notified = null;
    st.subscribe((s, m) => { notified = m.type; });
    const incoming = buildSeedState(TODAY); incoming.user.name = 'Otra pestaña';
    a.emitExternal(incoming);
    eq(notified, 'external');
    eq(st.getState().user.name, 'Otra pestaña');
  }],
  ['Store: reset vuelve al estado inicial', async () => {
    const st = seedStore(); await st.init();
    st.update((d) => { d.habits.pop(); d.completions = d.completions.filter((c) => c.habitId !== 'h-agua'); });
    await st.reset();
    eq(st.getState().habits.length, 8);
  }],
  ['Store: datos inválidos guardados → respaldo y reinicio', async () => {
    const a = memoryAdapter({ version: 1, basura: true });
    const st = seedStore(a); await st.init();
    eq(a.backups.length, 1);
    eq(st.getState().habits.length, 8);
  }],
  ['Store: usarlo antes de init() lanza error claro', () => {
    let msg = '';
    try { seedStore().getState(); } catch (e) { msg = e.message; }
    assert(msg.includes('init'));
  }],
  ['Config: versión de esquema coincide con el estado', () => eq(CONFIG.SCHEMA_VERSION, createEmptyState().version)],
];

export async function runTests() {
  const results = [];
  for (const [name, fn] of TESTS) {
    try { await fn(); results.push({ name, ok: true }); }
    catch (err) { results.push({ name, ok: false, error: err.message }); }
  }
  return results;
}
