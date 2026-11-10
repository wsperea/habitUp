import { inicializarApp } from './comun.js';
import { iniciarAvatar, avatarReaccionar } from './avatar.js';

inicializarApp();
iniciarAvatar();

console.log('[index.js] versión con data-ui y avatar cargada');

// No falla si el botón no existe
document.getElementById('btn-cerrar-sesion')?.addEventListener('click', () => window.cerrarSesion());

// Busca por data-ui y, si no está, por id
const $ui = (nombre, id) =>
  document.querySelector(`[data-ui="${nombre}"]`) || document.getElementById(id);

async function pedirJson(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`${url} respondió ${res.status}`);
  return res.json();
}

// ===== TUS FUNCIONES ACTUALES =====
async function cargarHabitosHoy() {
  try {
    const resH = await fetch('/api/habitos');
    const habitos = await resH.json();
    const resR = await fetch('/api/registros/hoy');
    const registros = await resR.json();

    const contenedor = document.getElementById('lista-habitos-hoy');
    contenedor.innerHTML = '';

    const diasSemana = ['domingo', 'lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado'];
    const nombreDiaHoy = diasSemana[new Date().getDay()];

    const habitosDeHoy = habitos.filter(h => {
      if (h.activo === false) return false;
      if (!h.frecuencia || !h.frecuencia.dias || h.frecuencia.dias.length === 0) return true;
      return h.frecuencia.dias.includes(nombreDiaHoy);
    });

    if (habitosDeHoy.length === 0) {
      contenedor.innerHTML = '<p class="mu">No tienes hábitos programados para hoy. ¡Disfruta tu descanso!</p>';
      actualizarProgreso(0, 0);
      return;
    }

    let completados = 0;
    habitosDeHoy.forEach(habito => {
      const estaCompletado = registros.some(r => r.habito_id === habito._id);
      if (estaCompletado) completados++;

      const label = document.createElement('label');
      label.className = 'r';
      label.style.gap = '12px';
      label.innerHTML = `<input type="checkbox" class="toggle-habito" data-id="${habito._id}" ${estaCompletado ? 'checked' : ''}> ${habito.nombre}`;
      contenedor.appendChild(label);
    });

    document.querySelectorAll('.toggle-habito').forEach(chk => {
      chk.addEventListener('change', (e) => toggleHabitoHoy(e.target.dataset.id, e.target));
    });

    actualizarProgreso(completados, habitosDeHoy.length);
  } catch (error) { console.error("Error:", error); }
}

async function toggleHabitoHoy(habitoId, checkbox) {
  try {
    await fetch('/api/registros/toggle', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ habito_id: habitoId })
    });
    cargarHabitosHoy();
    cargarRacha();
    cargarNivel();
    cargarSemanaIndex();
  } catch (error) {
    console.error(error);
    checkbox.checked = !checkbox.checked;
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
  
  // ¡NUEVO! Reaccionar del avatar
  avatarReaccionar(porcentaje);
}

// ===== FUNCIONES DE CARGA =====
async function cargarRacha() {
  try {
    const data = await pedirJson('/api/registros/racha');
    const valor = document.getElementById('racha-valor');
    const mensaje = document.getElementById('racha-mensaje');
    if (valor) valor.textContent = `${data.racha} ${data.racha === 1 ? 'día' : 'días'}`;
    if (mensaje) mensaje.textContent = data.mensaje;
  } catch (error) {
    console.error('Error cargando racha:', error);
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

    // Tarjeta "Mi Nivel"
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

    // Barra lateral
    const sNivel = document.getElementById('sidebar-nivel');
    const sXp = document.getElementById('sidebar-xp');
    const sBar = document.getElementById('sidebar-xpbar');
    if (sNivel) sNivel.textContent = `Nivel ${nivel}`;
    if (sXp) sXp.textContent = `${xpTotal} / ${nivel * 500} XP`;
    if (sBar) sBar.style.width = `${pct}%`;
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
    if (!contenedor) { console.warn('No se encontró week-bars'); return; }

    const ordenada = [...data].sort((a, b) => a.fecha.localeCompare(b.fecha));
    const max = Math.max(...ordenada.map((d) => d.completados || 0), 1);
    let total = 0;

    contenedor.innerHTML = '';
    for (const dia of ordenada) {
      const n = dia.completados || 0;
      total += n;
      const i = document.createElement('i');
      i.style.height = `${Math.max((n / max) * 100, 8)}%`;
      i.style.background = n > 0 ? '#7FA2FF' : '#22305E';
      i.title = `${dia.dia}: ${n} hábito${n === 1 ? '' : 's'}`;
      contenedor.appendChild(i);
    }
    if (resumen) {
      resumen.textContent = `${total} hábito${total === 1 ? '' : 's'} esta semana`;
    }
  } catch (error) {
    console.error('Error cargando semana:', error);
  }
}

// Iniciar todas las cargas
cargarHabitosHoy();
cargarRacha();
cargarNivel();
cargarSemanaIndex();