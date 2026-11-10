import { inicializarApp } from './comun.js';
inicializarApp();

console.log('[seguimiento.js] v2 cargado');

document.getElementById('btn-cerrar-sesion')?.addEventListener('click', () => window.cerrarSesion());

async function pedirJson(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`${url} respondió ${res.status}`);
  return res.json();
}

const NOMBRES_CORTOS = ['Do', 'Lu', 'Ma', 'Mi', 'Ju', 'Vi', 'Sá'];
const NOMBRES_LARGOS = ['domingo', 'lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado'];
const diaDeFecha = (fecha) => new Date(`${fecha}T12:00:00Z`).getUTCDay();

async function cargarEstadisticas() {
  try {
    const dataSemana = await pedirJson('/api/registros/semana');
    if (!Array.isArray(dataSemana)) throw new Error('/semana no devolvió un array');

    const ordenada = [...dataSemana].sort((a, b) => a.fecha.localeCompare(b.fecha));
    const max = Math.max(...ordenada.map((d) => d.completados || 0), 1);
    let totalCompletados = 0;

    const contenedor = document.getElementById('grafico-semana');
    if (contenedor) {
      contenedor.innerHTML = '';
      for (const dia of ordenada) {
        const n = dia.completados || 0;
        totalCompletados += n;
        const altura = Math.max((n / max) * 100, 5);
        const col = document.createElement('div');
        col.style.cssText = 'flex:1; display:flex; flex-direction:column; align-items:center; justify-content:flex-end; height:100%;';
        col.innerHTML = `
          <span style="font-size:12px; color:#fff; margin-bottom:5px;">${n}</span>
          <div style="height:${altura}%; width:100%; max-width:40px; background:${n > 0 ? '#7FA2FF' : '#22305E'}; border-radius:6px 6px 0 0; transition:height 0.3s;"></div>
          <div style="font-size:13px; font-weight:600; color:#8892B0; margin-top:8px;">${NOMBRES_CORTOS[diaDeFecha(dia.fecha)]}</div>
        `;
        contenedor.appendChild(col);
      }
    } else {
      totalCompletados = ordenada.reduce((s, d) => s + (d.completados || 0), 0);
    }

    const resumen = document.getElementById('resumen-semana');
    if (resumen) resumen.textContent = `Total de la semana: ${totalCompletados} hábitos completados`;
    const statCompleted = document.querySelector('[data-ui="stat-completed"]');
    if (statCompleted) statCompleted.textContent = `${totalCompletados}`;

    try {
      const r = await pedirJson('/api/registros/racha');
      const el = document.querySelector('[data-ui="stat-streak"]');
      if (el) el.textContent = `${r.racha} ${r.racha === 1 ? 'día' : 'días'}`;
    } catch (e) { console.error('Error cargando racha:', e); }

    try {
      const n = await pedirJson('/api/registros/nivel');
      const el = document.querySelector('[data-ui="stat-xp"]');
      if (el) el.textContent = n.xpTotal;
    } catch (e) { console.error('Error cargando XP:', e); }

    const habitos = await pedirJson('/api/habitos');
    const activos = habitos.filter((h) => h.activo !== false);
    let esperados = 0;
    for (const dia of ordenada) {
      const nombreDia = NOMBRES_LARGOS[diaDeFecha(dia.fecha)];
      esperados += activos.filter((h) => {
        const dias = h.frecuencia?.dias;
        return !dias || dias.length === 0 || dias.includes(nombreDia);
      }).length;
    }

    const porcentaje = esperados === 0 ? 0 : Math.min(100, Math.round((totalCompletados / esperados) * 100));
    const summaryEl = document.querySelector('[data-ui="progress-summary"]');
    const textEl = document.querySelector('[data-ui="progress-ring-text"]');
    const arcEl = document.querySelector('[data-ui="progress-ring-arc"]');
    if (summaryEl) summaryEl.textContent = `${totalCompletados} de ${esperados} hábitos esta semana`;
    if (textEl) textEl.textContent = `${porcentaje}%`;
    if (arcEl) {
      arcEl.setAttribute('stroke-dasharray', `${porcentaje} 100`);
      arcEl.setAttribute('stroke', porcentaje < 30 ? '#FF6B6B' : porcentaje < 70 ? '#FFB547' : '#3DDC97');
    }
  } catch (error) {
    console.error('Error cargando estadísticas:', error);
    const cont = document.getElementById('grafico-semana');
    if (cont) cont.innerHTML = '<p class="mu">Error al cargar la gráfica</p>';
  }
}

cargarEstadisticas();