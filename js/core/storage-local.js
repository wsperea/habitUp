// Adaptador de almacenamiento sobre localStorage.
// Contrato que debe cumplir cualquier adaptador (el de MongoDB/API también):
//   load()                 → Promise<estado | null>
//   save(estado)           → Promise<void>
//   backup(datos)          → Promise<void>      (opcional) guarda datos inválidos antes de reiniciar
//   subscribeExternal(cb)  → función para cancelar (opcional) avisa de cambios hechos fuera de esta pestaña
export function createLocalStorageAdapter(key) {
  return {
    async load() {
      const raw = localStorage.getItem(key);
      if (raw === null) return null;
      try {
        return JSON.parse(raw);
      } catch {
        console.warn('[storage] JSON corrupto, se respalda');
        localStorage.setItem(`${key}:backup:${Date.now()}`, raw);
        return null;
      }
    },
    async save(state) {
      localStorage.setItem(key, JSON.stringify(state));
    },
    async backup(data) {
      localStorage.setItem(`${key}:backup:${Date.now()}`, JSON.stringify(data));
    },
    subscribeExternal(callback) {
      const handler = (event) => {
        if (event.key !== key || event.newValue === null) return;
        try { callback(JSON.parse(event.newValue)); } catch { /* ignorar JSON roto */ }
      };
      window.addEventListener('storage', handler); // se dispara en las OTRAS pestañas
      return () => window.removeEventListener('storage', handler);
    },
  };
}
