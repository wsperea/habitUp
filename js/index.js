import { inicializarApp } from './comun.js';
inicializarApp();

console.log('[index.js] v4 cargado');

// El avatar es opcional: si falla, el resto de la página sigue funcionando
let avatarReaccionar = () => {};
let avatarSaltar = () => {};
import('./avatar.js')
  .then((m) => {
    m.iniciarAvatar();
    avatarReaccionar = m.avatarReaccionar;
    avatarSaltar = m.saltar ?? (() => {});
  })
  .catch((e) => console.warn('Avatar no disponible:', e));

document.getElementById('btn-cerrar-sesion')?.addEventListener('click', () => window.cerrarSesion());

const $ui = (nombre, id) =>
  document.querySelector(`[data-ui="${nombre}"]`) || document.getElementById(id);

async function pedirJson(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`${url} respondió ${res.status}`);
  return res.json();
}

function mensaje(contenedor, texto) {
  contenedor.replaceChildren();
  const p = document.createElement('p');
  p.className = 'mu';
  p.textContent = texto;
  contenedor.appendChild(p);
}

let nivelAnterior = null;

async function cargarHabitosHoy() {
  const contenedor = document.getElementById('lista-habitos-hoy');
  try {
    const [habitos, registros] = await Promise.all([
      pedirJson('/api/habitos'),
      pedirJson('/api/registros/hoy')
    ]);

    const diasSemana = ['domingo', 'lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado'];
    const nombreDiaHoy = diasSemana[new Date().getDay()];

    const habitosDeHoy = habitos.filter((h) => {
      if (h.activo === false) return false;
      const dias = h.frecuencia?.dias;
      return !dias || dias.length === 0 || dias.includes(nombreDiaHoy);
    });

    if (habitosDeHoy.length === 0) {
      mensaje(contenedor, 'No tienes hábitos programados para hoy. ¡Disfruta tu descanso!');
      actualizarProgreso(0, 0);
      return;
    }

    contenedor.replaceChildren();
    let completados = 0;

    for (const habito of habitosDeHoy) {
      const hecho = registros.some((r) => String(r.habito_id) === String(habito._id));
      if (hecho) completados++;

      const label = document.createElement('label');
      label.className = 'r';
      label.style.gap = '12px';

      const chk = document.createElement('input');
      chk.type = 'checkbox';
      chk.className = 'toggle-habito';
      chk.checked = hecho;
      chk.addEventListener('change', () => toggleHabitoHoy(habito._id, chk));

      const nombre = document.createElement('span');
      nombre.textContent = habito.nombre; // textContent: no interpreta HTML

      label.append(chk, nombre);
      contenedor.appendChild(label);
    }

    actualizarProgreso(completados, habitosDeHoy.length);
  } catch (error) {
    console.error('Error cargando hábitos:', error);
    mensaje(contenedor, 'No se pudieron cargar tus hábitos. Recarga la página.');
  }
}

async function toggleHabitoHoy(habitoId, checkbox) {
  checkbox.disabled = true;
  try {
    const res = await fetch('/api/registros/toggle', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ habito_id: habitoId })
    });
    if (!res.ok) throw new Error(`toggle respondió ${res.status}`);
    await Promise.all([cargarHabitosHoy(), cargarRacha(), cargarNivel(), cargarSemanaIndex()]);
  } catch (error) {
    console.error(error);
    checkbox.checked = !checkbox.checked;
    checkbox.disabled = false;
  }
}

function actualizarProgreso(completados, total) {
  const porcentaje = total === 0 ? 0 : Math.round((completados / total) * 100);
  const conteo = document.querySelector('[data-ui="daily-count"]');
  const texto = document.querySelector('[data-ui="daily-ring-text"]');
  const arco = document.querySelector('[data-ui="daily-ring-arc"]');
  if (conteo) conteo.textContent = `${completados} de ${total}`;
  if (texto) texto.textContent = `${porcentaje}%`;
  if (arco) arco.setAttribute('stroke-dasharray', `${porcentaje} 100`);
  avatarReaccionar(porcentaje);
}

async function cargarRacha() {
  try {
    const data = await pedirJson('/api/registros/racha');
    const valor = document.getElementById('racha-valor');
    const mensajeEl = document.getElementById('racha-mensaje');
    if (valor) valor.textContent = `${data.racha} ${data.racha === 1 ? 'día' : 'días'}`;
    if (mensajeEl) mensajeEl.textContent = data.mensaje;
  } catch (error) {
    console.error('Error cargando la racha:', error);
  }
}

async function cargarNivel() {
  try {
    const data = await pedirJson('/api/registros/nivel');
    const xpTotal = Number(data.xpTotal ?? 0);
    const nivel = Number(data.nivel ?? 1);
    const actual = Number(data.xpActualNivel ?? 0);
    const siguiente = Number(data.xpSiguienteNivel ?? 500) || 500;
    const pct = Math.min(100, Math.max(0, (actual / siguiente) * 100));

    const xp = $ui('xp-total', 'main-xp-total');
    const barra = $ui('level-bar', 'main-level-bar');
    const resto = $ui('level-remaining', 'main-level-remaining');
    if (xp) xp.textContent = `${xpTotal} XP`;
    if (barra) barra.style.width = `${pct}%`;
    if (resto) {
      resto.textContent = xpTotal === 0
        ? '¡Completa un hábito para empezar!'
        : `Faltan ${siguiente - actual} XP para el nivel ${nivel + 1}`;
    }

    const sNivel = document.getElementById('sidebar-nivel');
    const sXp = document.getElementById('sidebar-xp');
    const sBar = document.getElementById('sidebar-xpbar');
    if (sNivel) sNivel.textContent = `Nivel ${nivel}`;
    if (sXp) sXp.textContent = `${xpTotal} / ${nivel * 500} XP`;
    if (sBar) sBar.style.width = `${pct}%`;

    // Celebrar al subir de nivel (no en la primera carga)
    if (nivelAnterior !== null && nivel > nivelAnterior) avatarSaltar();
    nivelAnterior = nivel;
  } catch (error) {
    console.error('Error cargando nivel:', error);
  }
}

async function cargarSemanaIndex() {
  try {
    const data = await pedirJson('/api/registros/semana');
    if (!Array.isArray(data)) throw new Error('La respuesta no es un array');

    const contenedor = $ui('week-bars', 'main-week-bars');
    const resumen = $ui('week-summary', 'main-week-summary');
    if (!contenedor) return;

    const ordenada = [...data].sort((a, b) => a.fecha.localeCompare(b.fecha));
    const max = Math.max(...ordenada.map((d) => d.completados || 0), 1);
    let total = 0;

    contenedor.replaceChildren();
    for (const dia of ordenada) {
      const n = dia.completados || 0;
      total += n;
      const i = document.createElement('i');
      i.style.height = `${Math.max((n / max) * 100, 8)}%`;
      i.style.background = n > 0 ? '#7FA2FF' : '#22305E';
      i.title = `${dia.dia}: ${n} hábito${n === 1 ? '' : 's'}`;
      contenedor.appendChild(i);
    }
    if (resumen) resumen.textContent = `${total} hábito${total === 1 ? '' : 's'} esta semana`;
  } catch (error) {
    console.error('Error cargando semana:', error);
  }
}

cargarHabitosHoy();
cargarRacha();
cargarNivel();
cargarSemanaIndex();