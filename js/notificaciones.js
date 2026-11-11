const KEY = 'habitup:notif';

function leer() {
  try { return JSON.parse(localStorage.getItem(KEY)) || {}; } catch { return {}; }
}
function guardar(cfg) {
  try { localStorage.setItem(KEY, JSON.stringify(cfg)); } catch { /* sin storage */ }
}

export const soportado = () => 'Notification' in window;
export const configuracion = () => ({ activa: false, hora: '20:00', ultimo: '', ...leer() });

export async function pedirPermiso() {
  if (!soportado()) return 'unsupported';
  if (Notification.permission === 'granted' || Notification.permission === 'denied') {
    return Notification.permission;
  }
  return Notification.requestPermission();
}

function mostrar(titulo, cuerpo) {
  try {
    new Notification(titulo, { body: cuerpo, icon: '/avatar.png' });
  } catch (e) {
    console.warn('No se pudo mostrar la notificación:', e);
  }
}

async function json(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`${url} respondió ${res.status}`);
  return res.json();
}

async function contarPendientes() {
  const [habitos, registros] = await Promise.all([
    json('/api/habitos'),
    json('/api/registros/hoy')
  ]);
  const dias = ['domingo', 'lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado'];
  const hoy = dias[new Date().getDay()];
  const deHoy = habitos.filter((h) => {
    if (h.activo === false) return false;
    const d = h.frecuencia?.dias;
    return !d || d.length === 0 || d.includes(hoy);
  });
  const hechos = new Set(registros.map((r) => String(r.habito_id)));
  return deHoy.filter((h) => !hechos.has(String(h._id))).length;
}

async function revisar() {
  const cfg = configuracion();
  if (!cfg.activa || !soportado() || Notification.permission !== 'granted') return;

  const ahora = new Date();
  const hoy = ahora.toLocaleDateString('en-CA');
  const hhmm = ahora.toTimeString().slice(0, 5);
  if (cfg.ultimo === hoy || hhmm < cfg.hora) return;

  try {
    const pendientes = await contarPendientes();
    if (pendientes > 0) {
      mostrar('HabitUp', pendientes === 1
        ? 'Te falta 1 hábito por completar hoy. ¡Tú puedes!'
        : `Te faltan ${pendientes} hábitos por completar hoy. ¡Tú puedes!`);
    }
    guardar({ ...configuracion(), ultimo: hoy });
  } catch (e) {
    console.warn('Recordatorio no disponible:', e);
  }
}

let timer = null;
export function iniciarRecordatorios() {
  if (timer || !soportado()) return;
  revisar();
  timer = setInterval(revisar, 30000);
}

export function vincularControles({ enlace, etiqueta, hora, probar, estado }) {
  const msg = (t) => { if (estado) estado.textContent = t; };
  const pintar = () => {
    const cfg = configuracion();
    const on = cfg.activa && soportado() && Notification.permission === 'granted';
    if (etiqueta) etiqueta.textContent = on ? 'Activadas ›' : 'Desactivadas ›';
    return on;
  };

  if (!soportado()) {
    if (etiqueta) etiqueta.textContent = 'No disponible ›';
    msg('Tu navegador no admite notificaciones.');
    return;
  }

  if (hora) hora.value = configuracion().hora;
  if (Notification.permission === 'denied') {
    msg('Las notificaciones están bloqueadas. Actívalas en el candado junto a la dirección.');
  }
  if (pintar()) iniciarRecordatorios();

  enlace?.addEventListener('click', async (e) => {
    e.preventDefault();
    if (pintar()) {
      guardar({ ...configuracion(), activa: false });
      pintar();
      msg('Recordatorios desactivados.');
      return;
    }
    const permiso = await pedirPermiso();
    if (permiso !== 'granted') {
      msg('No diste permiso para notificaciones.');
      return;
    }
    guardar({ ...configuracion(), activa: true, ultimo: '' });
    pintar();
    msg(`Te avisaremos a las ${configuracion().hora} si te quedan hábitos.`);
    iniciarRecordatorios();
  });

  hora?.addEventListener('change', () => {
    guardar({ ...configuracion(), hora: hora.value || '20:00', ultimo: '' });
    msg(`Recordatorio a las ${hora.value}.`);
  });

  probar?.addEventListener('click', async () => {
    const permiso = await pedirPermiso();
    if (permiso === 'granted') mostrar('HabitUp', '¡Así se verán tus recordatorios!');
    else msg('Necesitas dar permiso para probar.');
  });
}