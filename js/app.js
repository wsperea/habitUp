// Punto de entrada. Cada HTML lo carga con: <script type="module" src="js/app.js"></script>
// 1) inicia el store  2) detecta la página con <body data-page="...">  3) carga el módulo de esa página.
import { CONFIG } from './config.js';
import { store } from './core/store-instance.js';

// Se irá llenando fase a fase. Ejemplo (fase 2): habits: () => import('./ui/habits-page.js')
const PAGE_MODULES = {};

async function start() {
  await store.init();
  document.documentElement.dataset.mode = CONFIG.MODE;

  if (CONFIG.EXPOSE_DEBUG) window.HabitUp = { store, config: CONFIG };

  const page = document.body.dataset.page;
  const load = PAGE_MODULES[page];
  if (load) {
    const mod = await load();
    mod.init?.({ store });
  }
  document.documentElement.dataset.ready = 'true';
}

start().catch((err) => console.error('[HabitUp] error al iniciar', err));
