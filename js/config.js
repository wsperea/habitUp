// Configuración global de HabitUp.
// MODE 'demo'  → usa datos de prueba (js/data/seed.js) guardados en su propio espacio.
// MODE 'real'  → empieza vacío y guarda en otro espacio distinto. Nunca se mezclan.
export const CONFIG = Object.freeze({
  MODE: 'demo',            // 'demo' | 'real'
  SCHEMA_VERSION: 1,       // súbelo cuando cambie la forma del estado (y agrega una migración)
  STORAGE_PREFIX: 'habitup',
  EXPOSE_DEBUG: true,      // expone window.HabitUp en la consola (desactívalo en producción)
});

export function storageKey(mode = CONFIG.MODE) {
  if (mode !== 'demo' && mode !== 'real') {
    throw new Error(`CONFIG.MODE inválido: "${mode}". Usa 'demo' o 'real'.`);
  }
  return `${CONFIG.STORAGE_PREFIX}:${mode}:v${CONFIG.SCHEMA_VERSION}`;
}
