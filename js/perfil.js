import { inicializarApp, cambiarTema } from './comun.js';
inicializarApp();

document.getElementById('btn-cerrar-sesion').addEventListener('click', () => window.cerrarSesion());
document.getElementById('btn-cerrar-sesion-perfil').addEventListener('click', (e) => { e.preventDefault(); window.cerrarSesion(); });
document.getElementById('btn-cambiar-tema').addEventListener('click', (e) => { e.preventDefault(); cambiarTema(); });
document.getElementById('btn-abrir-modal').addEventListener('click', () => document.getElementById('modalPerfil').classList.add('active'));
document.getElementById('btn-cerrar-modal').addEventListener('click', () => document.getElementById('modalPerfil').classList.remove('active'));

async function cargarPerfil() {
  try {
    const res = await fetch('/api/auth/perfil');
    if (!res.ok) throw new Error("Error en la petición: " + res.status);
    
    const user = await res.json();
    document.querySelector('[data-ui="profile-name"]').textContent = user.nombre;
    document.querySelector('[data-ui="profile-email"]').textContent = user.correo;
    
    const fecha = new Date(user.fecha_registro);
    document.querySelector('[data-ui="profile-date"]').textContent = "Miembro desde: " + fecha.toLocaleDateString('es-ES', { year: 'numeric', month: 'long' });
    
    const iniciales = user.nombre ? user.nombre.substring(0, 2).toUpperCase() : 'US';
    document.querySelector('[data-ui="profile-avatar"]').textContent = iniciales;
    document.getElementById('inputNombre').value = user.nombre;

    const resRacha = await fetch('/api/registros/racha');
    const dataRacha = await resRacha.json();
    document.querySelector('[data-ui="stat-streak"]').textContent = dataRacha.racha;

    const resNivel = await fetch('/api/registros/nivel');
    const dataNivel = await resNivel.json();
    document.querySelector('[data-ui="stat-xp"]').textContent = dataNivel.xpTotal;

    const resSemana = await fetch('/api/registros/semana');
    const dataSemana = await resSemana.json();
    const totalCompletados = dataSemana.reduce((acc, curr) => acc + curr.completados, 0);
    document.querySelector('[data-ui="stat-completed"]').textContent = totalCompletados;

  } catch (error) {
    console.error("ERROR AL CARGAR PERFIL:", error);
  }
}

document.getElementById('formPerfil').addEventListener('submit', async (e) => {
  e.preventDefault();
  const nuevoNombre = document.getElementById('inputNombre').value;
  
  try {
    const res = await fetch('/api/auth/perfil', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nombre: nuevoNombre })
    });
    
    if (res.ok) {
      document.getElementById('modalPerfil').classList.remove('active');
      cargarPerfil(); 
    } else {
      alert("Error al actualizar el perfil");
    }
  } catch (error) {
    console.error(error);
  }
});

cargarPerfil();