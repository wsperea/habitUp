import { inicializarApp } from './comun.js';
inicializarApp();

document.getElementById('btn-cerrar-sesion').addEventListener('click', () => window.cerrarSesion());

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
  } catch (error) {
    console.error("Error:", error);
  }
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
  document.querySelector('[data-ui="daily-count"]').textContent = `${completados} de ${total}`;
  document.querySelector('[data-ui="daily-ring-text"]').textContent = `${porcentaje}%`;
  document.querySelector('[data-ui="daily-ring-arc"]').setAttribute('stroke-dasharray', `${porcentaje} 100`);
}

async function cargarRacha() {
  try {
    const res = await fetch('/api/registros/racha');
    const data = await res.json();
    document.getElementById('racha-valor').textContent = `${data.racha} ${data.racha === 1 ? 'día' : 'días'}`;
    document.getElementById('racha-mensaje').textContent = data.mensaje;
  } catch (error) {
    console.error("Error cargando la racha:", error);
  }
}

async function cargarNivel() {
  try {
    const res = await fetch('/api/registros/nivel');
    const data = await res.json();
    
    // Datos para la barra lateral
    const sidebarNivel = document.getElementById('sidebar-nivel');
    const sidebarXp = document.getElementById('sidebar-xp');
    const sidebarBar = document.getElementById('sidebar-xpbar');
    
    if (sidebarNivel) sidebarNivel.textContent = `Nivel ${data.nivel}`;
    if (sidebarXp) sidebarXp.textContent = `${data.xpTotal} / ${data.nivel * 500} XP`;
    if (sidebarBar) sidebarBar.style.width = `${(data.xpActualNivel / data.xpSiguienteNivel) * 100}%`;

    // Datos para la tarjeta central "Mi Nivel"
    const mainXpTotal = document.getElementById('main-xp-total');
    const mainLevelBar = document.getElementById('main-level-bar');
    const mainLevelRemaining = document.getElementById('main-level-remaining');

    if (mainXpTotal) mainXpTotal.textContent = `${data.xpTotal} XP`;
    if (mainLevelBar) mainLevelBar.style.width = `${(data.xpActualNivel / data.xpSiguienteNivel) * 100}%`;
    if (mainLevelRemaining) {
      if (data.nivel === 1 && data.xpTotal === 0) {
        mainLevelRemaining.textContent = '¡Completa un hábito para empezar!';
      } else {
        mainLevelRemaining.textContent = `Faltan ${data.xpSiguienteNivel - data.xpActualNivel} XP para el nivel ${data.nivel + 1}`;
      }
    }
  } catch (error) {
    console.error("Error cargando nivel:", error);
  }
}

async function cargarSemanaIndex() {
  try {
    const res = await fetch('/api/registros/semana');
    const data = await res.json();
    
    const contenedor = document.querySelector('[data-ui="week-bars"]');
    const resumen = document.querySelector('[data-ui="week-summary"]');
    
    if (!contenedor) return;
    
    contenedor.innerHTML = '';
    let totalCompletados = 0;
    const maxCompletados = Math.max(...data.map(d => d.completados), 1);

    // Ordenar para que empiece en Lunes
    const dataOrdenada = [...data].sort((a, b) => {
      const diaA = new Date(a.fecha + 'T12:00:00Z').getDay();
      const diaB = new Date(b.fecha + 'T12:00:00Z').getDay();
      return (diaA === 0 ? 7 : diaA) - (diaB === 0 ? 7 : diaB);
    });

    dataOrdenada.forEach(dia => {
      totalCompletados += dia.completados;
      const altura = (dia.completados / maxCompletados) * 100;
      const esActivo = dia.completados > 0;
      
      contenedor.innerHTML += `
        <i style="height: ${Math.max(altura, 5)}%; background: ${esActivo ? '#7FA2FF' : '#22305E'};" title="${dia.completados} hábitos"></i>
      `;
    });

    if (resumen) {
      resumen.textContent = `${totalCompletados} hábitos esta semana`;
    }
  } catch (error) {
    console.error("Error cargando semana:", error);
  }
}

// Iniciar todas las cargas
cargarHabitosHoy();
cargarRacha();
cargarNivel();
cargarSemanaIndex();