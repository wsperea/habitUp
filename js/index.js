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
    import('./comun.js').then(m => m.inicializarApp());
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

cargarHabitosHoy();
cargarRacha();