// Store: única fuente de verdad. No sabe nada de localStorage, del DOM ni de los datos de prueba:
// recibe un adaptador y una función que crea el estado inicial (createStore es fácil de probar).
//
// Reglas:
//  - El estado es inmutable (congelado). Se cambia SOLO con store.update(mutator).
//  - update() es síncrono: la interfaz se actualiza al instante; el guardado va en cola.
import { validateState, migrate } from './state.js';

function deepFreeze(obj) {
  if (obj && typeof obj === 'object' && !Object.isFrozen(obj)) {
    Object.freeze(obj);
    Object.values(obj).forEach(deepFreeze);
  }
  return obj;
}

export function createStore({ adapter, createInitialState }) {
  let state = null;
  let pending = Promise.resolve();
  const listeners = new Set();
  const saveErrorListeners = new Set();

  const assertReady = () => {
    if (!state) throw new Error('Store no inicializado: espera a store.init()');
  };

  function notify(meta) {
    for (const fn of [...listeners]) {
      try { fn(state, meta); } catch (err) { console.error('[store] error en un suscriptor', err); }
    }
  }

  function persist() {
    const snapshot = state;
    pending = pending
      .then(() => adapter.save(snapshot))
      .catch((err) => {
        console.error('[store] no se pudo guardar', err);
        saveErrorListeners.forEach((fn) => fn(err));
      });
    return pending;
  }

  async function buildInitial() {
    const initial = await createInitialState();
    const errors = validateState(initial);
    if (errors.length) throw new Error(`Estado inicial inválido: ${errors.join('; ')}`);
    return deepFreeze(initial);
  }

  function onExternal(incoming) {
    const migrated = migrate(incoming);
    if (!migrated || validateState(migrated).length) return;
    state = deepFreeze(migrated);
    notify({ type: 'external' });
  }

  async function init() {
    if (state) return state;
    const stored = await adapter.load();
    if (stored) {
      const migrated = migrate(stored);
      const errors = migrated ? validateState(migrated) : ['versión no soportada'];
      if (errors.length === 0) state = deepFreeze(migrated);
      else {
        console.warn('[store] datos guardados inválidos; se respaldan y se reinicia', errors);
        await adapter.backup?.(stored);
      }
    }
    if (!state) {
      state = await buildInitial();
      await persist();
    }
    adapter.subscribeExternal?.(onExternal);
    return state;
  }

  function getState() {
    assertReady();
    return state;
  }

  // mutator(draft) modifica una copia; si el resultado es inválido, no se aplica nada.
  function update(mutator, meta = {}) {
    assertReady();
    const draft = structuredClone(state);
    const result = mutator(draft);
    if (result instanceof Promise) throw new Error('El mutator de update() debe ser síncrono');
    const errors = validateState(draft);
    if (errors.length) throw new Error(`Cambio rechazado, estado inválido: ${errors.join('; ')}`);
    state = deepFreeze(draft);
    persist();
    notify({ type: 'update', ...meta });
    return result;
  }

  function subscribe(listener) {
    listeners.add(listener);
    return () => listeners.delete(listener);
  }

  async function reset() {
    state = await buildInitial();
    await persist();
    notify({ type: 'reset' });
    return state;
  }

  return {
    init, getState, update, subscribe, reset,
    flush: () => pending,
    onSaveError: (fn) => { saveErrorListeners.add(fn); return () => saveErrorListeners.delete(fn); },
    get ready() { return state !== null; },
  };
}
