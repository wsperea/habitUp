import { inicializarApp } from './comun.js';
inicializarApp();

document.getElementById('btn-cerrar-sesion').addEventListener('click', () => window.cerrarSesion());

async function cargarEstadisticas() {
  try {
    // 1. Cargar datos semanales
    const resSemana = await fetch('/api/registros/semana');
    if (!resSemana.ok) throw new Error('Error al cargar semana');
    const dataSemana = await resSemana.json();
    
    const contenedor = document.getElementById('grafico-semana');
    contenedor.innerHTML = ''; 

    const nombresDias = { 1: 'Lu', 2: 'Ma', 3: 'Mi', 4: 'Ju', 5: 'Vi', 6: 'Sá', 0: 'Do' };
    const dataOrdenada = [...dataSemana].sort((a, b) => {
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
    
    // Actualizar la tarjeta de "Hábitos completados" (la de las 3 tarjetas de abajo)
    const statCompleted = document.querySelector('[data-ui="stat-completed"]');
    if (statCompleted) statCompleted.textContent = `${totalCompletados}`;

    // 2. Cargar Racha
    const resRacha = await fetch('/api/registros/racha');
    const dataRacha = await resRacha.json();
    const statStreak = document.querySelector('[data-ui="stat-streak"]');
    if (statStreak) statStreak.textContent = `${dataRacha.racha} ${dataRacha.racha === 1 ? 'día' : 'días'}`;

    // 3. Cargar XP
    const resNivel = await fetch('/api/registros/nivel');
    const dataNivel = await resNivel.json();
    const statXp = document.querySelector('[data-ui="stat-xp"]');
    if (statXp) statXp.textContent = dataNivel.xpTotal;

    // 4. Calcular el progreso semanal (Anillo)
    const resHabitos = await fetch('/api/habitos');
    const habitos = await resHabitos.json();
    const habitosActivos = habitos.filter(h => h.activo !== false);

    let esperados = 0;
    const nombresDiasCompletos = ['domingo', 'lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado'];
    
    dataSemana.forEach(dia => {
      const nombreDia = nombresDiasCompletos[new Date(dia.fecha + 'T12:00:00Z').getDay()];
      esperados += habitosActivos.filter(h => {
        if (!h.frecuencia || !h.frecuencia.dias || h.frecuencia.dias.length === 0) return true;
        return h.frecuencia.dias.includes(nombreDia);
      }).length;
    });

    const porcentaje = esperados === 0 ? 0 : Math.min(100, Math.round((totalCompletados / esperados) * 100));

    // Buscamos por data-ui, que es como están en tu HTML
    const summaryEl = document.querySelector('[data-ui="progress-summary"]');
    const textEl = document.querySelector('[data-ui="progress-ring-text"]');
    const arcEl = document.querySelector('[data-ui="progress-ring-arc"]');

    if (summaryEl) summaryEl.textContent = `${totalCompletados} de ${esperados} hábitos esta semana`;
    if (textEl) textEl.textContent = `${porcentaje}%`;
    
    if (arcEl) {
      arcEl.setAttribute('stroke-dasharray', `${porcentaje} 100`);
      if (porcentaje < 30) arcEl.setAttribute('stroke', '#FF6B6B'); // Rojo
      else if (porcentaje < 70) arcEl.setAttribute('stroke', '#FFB547'); // Naranja
      else arcEl.setAttribute('stroke', '#3DDC97'); // Verde
    }

  } catch (error) {
    console.error("Error cargando estadísticas:", error);
    const cont = document.getElementById('grafico-semana');
    if (cont) cont.innerHTML = '<p class="mu">Error al cargar la gráfica</p>';
  }
}

cargarEstadisticas();