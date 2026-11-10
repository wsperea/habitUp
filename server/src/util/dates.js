// Los registros se guardan siempre a las 12:00 UTC del día. Así el día no cambia al
// convertir a la hora de Colombia (UTC-5) y el índice único (hábito + fecha) es fiable.
export function toNoonUtc(value) {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value; // deja que Mongoose reporte el error de tipo
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), 12));
}

export const isNoonUtc = (d) =>
  d.getUTCHours() === 12 && d.getUTCMinutes() === 0 && d.getUTCSeconds() === 0 && d.getUTCMilliseconds() === 0;
