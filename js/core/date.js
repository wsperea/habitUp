// Utilidades de fecha. Trabajan con "claves" de día locales: 'YYYY-MM-DD'.
export const WEEK_ORDER = Object.freeze(['L', 'M', 'X', 'J', 'V', 'S', 'D']);
const BY_GET_DAY = ['D', 'L', 'M', 'X', 'J', 'V', 'S']; // índice = Date#getDay()

const pad = (n) => String(n).padStart(2, '0');

export function toDateKey(date = new Date()) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

export function fromDateKey(key) {
  const [y, m, d] = key.split('-').map(Number);
  return new Date(y, m - 1, d);
}

export function isValidDateKey(key) {
  return typeof key === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(key) && toDateKey(fromDateKey(key)) === key;
}

export function shiftDateKey(key, days) {
  const d = fromDateKey(key);
  d.setDate(d.getDate() + days);
  return toDateKey(d);
}

export function dayLetterOf(key) {
  return BY_GET_DAY[fromDateKey(key).getDay()];
}

export const todayKey = () => toDateKey(new Date());
