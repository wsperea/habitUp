import { inicializarApp } from './comun.js';
inicializarApp();

document.getElementById('btn-cerrar-sesion').addEventListener('click', () => window.cerrarSesion());
document.getElementById('btn-abrir-modal').addEventListener('click', () => document.getElementById('modalHabito').classList.add('active'));
document.getElementById('btn-cerrar-modal').addEventListener('click', () => {
  document.getElementById('modalHabito').classList.remove('active');
  document.getElementById('formHabito').reset();
});

function renderDias(diasActivos) {
  const letras = [
    { id: 'lunes', label: 'L' }, { id: 'martes', label: 'M' }, { id: 'miercoles', label: 'X' },
    { id: 'jueves', label: 'J' }, { id: 'viernes', label: 'V' }, { id: 'sabado', label: 'S' }, { id: 'domingo', label: 'D' }
  ];
  return letras.map(d => {
    const activo = diasActivos && diasActivos.includes(d.id) ? 'on' : '';
    return `<span class="d ${activo}" data-day="${d.label}">${d.label}</span>`;
  }).join('');
}

async function cargarHabitos() {
  try {
    const res = await fetch('/api/habitos');
    const habitos = await res.json();
    const contenedor = document.getElementById('lista-habitos');
    contenedor.innerHTML = ''; 

    if (habitos.length === 0) {
      contenedor.innerHTML = '<p class="mu">Aún no tienes hábitos. ¡Crea uno nuevo!</p>';
      return;
    }

    habitos.forEach(habito => {
      const div = document.createElement('div');
      div.className = 'c r'; 
      div.style.padding = '18px 24px';
      const dias = habito.frecuencia && habito.frecuencia.dias ? habito.frecuencia.dias : [];
      const estaActivo = habito.activo !== false; 

      div.innerHTML = `
        <div style="flex:1; ${estaActivo ? '' : 'opacity: 0.5;'}">
          <b>${habito.nombre}</b>
          <div class="mu" style="font-size:13px">${habito.categoria || 'General'}</div>
          ${habito.descripcion ? `<div class="mu" style="font-size:11px; margin-top:4px;">${habito.descripcion}</div>` : ''}
        </div>
        <div class="r" style="gap:6px; ${estaActivo ? '' : 'opacity: 0.5;'}">${renderDias(dias)}</div>
        <button class="btn-eliminar" data-id="${habito._id}" style="background:transparent; border:none; color:#ff6b6b; cursor:pointer; font-size:18px; padding: 0 10px;">🗑️</button>
        <label class="tg"><input type="checkbox" class="toggle-habito" data-id="${habito._id}" ${estaActivo ? 'checked' : ''}><i></i></label>
      `;
      contenedor.appendChild(div);
    });

    document.querySelectorAll('.btn-eliminar').forEach(btn => {
      btn.addEventListener('click', (e) => eliminarHabito(e.target.dataset.id));
    });
    
    document.querySelectorAll('.toggle-habito').forEach(chk => {
      chk.addEventListener('change', (e) => toggleHabito(e.target.dataset.id, e.target.checked));
    });

  } catch (error) { console.error("Error cargando hábitos:", error); }
}

async function toggleHabito(id, activo) {
  await fetch('/api/habitos/' + id, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ activo })
  });
  cargarHabitos(); 
}

async function eliminarHabito(id) {
  if (!confirm('¿Estás seguro de que quieres eliminar este hábito?')) return;
  await fetch('/api/habitos/' + id, { method: 'DELETE' });
  cargarHabitos(); 
}

document.getElementById('formHabito').addEventListener('submit', async (e) => {
  e.preventDefault();
  const diasSeleccionados = [];
  ['lunes','martes','miercoles','jueves','viernes','sabado','domingo'].forEach(dia => {
    if(document.getElementById('d-' + dia).checked) diasSeleccionados.push(dia);
  });

  const nuevoHabito = {
    nombre: document.getElementById('habitoNombre').value,
    categoria: document.getElementById('habitoCategoria').value,
    descripcion: document.getElementById('habitoDescripcion').value,
    frecuencia: { dias: diasSeleccionados }
  };

  await fetch('/api/habitos', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(nuevoHabito)
  });
  
  document.getElementById('modalHabito').classList.remove('active');
  document.getElementById('formHabito').reset();
  cargarHabitos(); 
});

cargarHabitos();