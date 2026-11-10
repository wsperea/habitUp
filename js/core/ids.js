// Identificadores únicos. Más adelante MongoDB puede generar los suyos sin cambiar el resto.
export function newId(prefix = 'id') {
  const raw = globalThis.crypto?.randomUUID?.()
    ?? `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
  return `${prefix}_${raw}`;
}
