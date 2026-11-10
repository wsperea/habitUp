import { inicializarApp } from './comun.js';
inicializarApp();

document.getElementById('btn-cerrar-sesion').addEventListener('click', () => window.cerrarSesion());

async function cargarEstadisticas() {
  try {
    const res = await fetch('/api/registros/semana');
    const data = await res.json();
    const contenedor = document.getElementById('grafico-semana');
    contenedor.innerHTML = ''; 

    const nombresDias = { 1: 'Lu', 2: 'Ma', 3: 'Mi', 4: 'Ju', 5: 'Vi', 6: 'Sá', 0: 'Do' };
    const dataOrdenada = [...data].sort((a, b) => {
      const diaA = new Date(a.fecha + 'T12:00:00Z').getDay();
      const diaB = new Date(b.fecha + 'T12:00:00Z').getDay();
      return (diaA === 0 ? 7 : diaA) - (diaB === 0 ? 7 : diaB);
    });

    let totalCompletados = 0;
    const maxCompletados = Math.max(...dataOrdenada.map(d => d.completados), 1);

    dataOrdenada.forEach(dia => {
      totalCompletados += dia.completados;
      const altura = (dia.completados / maxCompletados) * 100;
      const esActivo = dia.completados > 0;
      const diaNum = new Date(dia.fecha + 'T12:00:00Z').getDay();
      const nombreDia = nombresDias[diaNum];

      contenedor.innerHTML += `
        <div style="flex:1; display:flex; flex-direction:column; align-items:center; justify-content:flex-end; height:100%;">
          <span style="font-size:12px; color:#fff; margin-bottom:5px;">${dia.completados}</span>
          <div style="height: ${Math.max(altura, 5)}%; width: 100%; max-width: 40px; background: ${esActivo ? '#7FA2FF' : '#22305E'}; border-radius: 6px 6px 0 0; transition: height 0.3s;"></div>
          <div style="font-size:13px; font-weight: 600; color:#8892B0; margin-top:8px;">${nombreDia}</div>
        </div>
      `;
    });

    document.getElementById('resumen-semana').textContent = `Total de la semana: ${totalCompletados} hábitos completados`;
    document.querySelector('[data-ui="stat-completed"]').textContent = `${totalCompletados}`;

    const resRacha = await fetch('/api/registros/racha');
    const dataRacha = await resRacha.json();
    document.querySelector('[data-ui="stat-streak"]').textContent = `${dataRacha.racha} ${dataRacha.racha === 1 ? 'día' : 'días'}`;

    const resNivel = await fetch('/api/registros/nivel');
    const dataNivel = await resNivel.json();
    document.querySelector('[data-ui="stat-xp"]').textContent = dataNivel.xpTotal;

  } catch (error) {
    console.error(error);
    document.getElementById('grafico-semana').innerHTML = '<p class="mu">Error al cargar la gráfica</p>';
  }
}

async function cargarExito() {
  try {
    const res = await fetch('/api/registros/exito');
    const data = await res.json();
    
    document.querySelector('[data-ui="progress-summary"]').textContent = `${data.completados} de ${data.totalEsperado} hábitos esta semana`;
    const porcentaje = data.porcentaje;
    document.querySelector('[data-ui="progress-ring-text"]').textContent = `${porcentaje}%`;
    document.querySelector('[data-ui="progress-ring-arc"]').setAttribute('stroke-dasharray', `${porcentaje} 100`);
    
    const arc = document.querySelector('[data-ui="progress-ring-arc"]');
    if (porcentaje < 30) arc.setAttribute('stroke', '#FF6B6B');
    else if (porcentaje < 70) arc.setAttribute('stroke', '#FFB547');
    else arc.setAttribute('stroke', '#3DDC97');
  } catch (error) {
    console.error("Error cargando el éxito:", error);
  }
}

cargarEstadisticas();
cargarExito();