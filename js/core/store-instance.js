// Instancia única del store que usa toda la app.
// Aquí (y solo aquí) se decide: datos de prueba vs. reales, y localStorage vs. (luego) API/MongoDB.
import { CONFIG, storageKey } from '../config.js';
import { createStore } from './store.js';
import { createLocalStorageAdapter } from './storage-local.js';
import { createEmptyState } from './state.js';

async function createInitialState() {
  if (CONFIG.MODE === 'demo') {
    // Los datos de prueba solo se cargan en modo demo.
    const { buildSeedState } = await import('../data/seed.js');
    return buildSeedState();
  }
  return createEmptyState({ source: 'real' });
}

export const store = createStore({
  adapter: createLocalStorageAdapter(storageKey()), // MongoDB: cambia SOLO esta línea por un adaptador de API
  createInitialState,
});
