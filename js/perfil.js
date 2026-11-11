import { inicializarApp, cambiarTema } from './comun.js';
inicializarApp();

const modal = document.getElementById('modalPerfil');
const formPerfil = document.getElementById('formPerfil');
const inputNombre = document.getElementById('inputNombre');
const inputCorreo = document.getElementById('inputCorreo');
const errorEl = document.getElementById('perfil-error');

document.getElementById('btn-cerrar-sesion')?.addEventListener('click', () => window.cerrarSesion());
document.getElementById('btn-cerrar-sesion-perfil')?.addEventListener('click', (e) => { e.preventDefault(); window.cerrarSesion(); });
document.getElementById('btn-cambiar-tema')?.addEventListener('click', (e) => { e.preventDefault(); cambiarTema(); });
document.getElementById('btn-abrir-modal')?.addEventListener('click', () => { limpiarError(); modal.classList.add('active'); });
document.getElementById('btn-cerrar-modal')?.addEventListener('click', () => modal.classList.remove('active'));

function mostrarError(msg) { errorEl.textContent = msg; errorEl.hidden = false; }
function limpiarError() { errorEl.textContent = ''; errorEl.hidden = true; }
inputNombre?.addEventListener('input', limpiarError);
inputCorreo?.addEventListener('input', limpiarError);

async function cargarPerfil() {
  try {
    const res = await fetch('/api/auth/perfil');
    if (!res.ok) throw new Error('Error en la petición: ' + res.status);

    const user = await res.json();
    document.querySelector('[data-ui="profile-name"]').textContent = user.nombre;
    document.querySelector('[data-ui="profile-email"]').textContent = user.correo;

    const fecha = new Date(user.fecha_registro);
    document.querySelector('[data-ui="profile-date"]').textContent =
      'Miembro desde: ' + fecha.toLocaleDateString('es-ES', { year: 'numeric', month: 'long' });

    const iniciales = user.nombre ? user.nombre.substring(0, 2).toUpperCase() : 'US';
    document.querySelector('[data-ui="profile-avatar"]').textContent = iniciales;
    const avatarHeader = document.querySelector('header [data-ui="user-avatar"]');
    if (avatarHeader) avatarHeader.textContent = iniciales;

    inputNombre.value = user.nombre;
    inputCorreo.value = user.correo;

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
    console.error('ERROR AL CARGAR PERFIL:', error);
  }
}

formPerfil?.addEventListener('submit', async (e) => {
  e.preventDefault();
  limpiarError();

  const nombre = inputNombre.value.trim();
  const correo = inputCorreo.value.trim();
  if (!nombre || !correo) { mostrarError('Completa el nombre y el correo'); return; }

  const boton = formPerfil.querySelector('button[type="submit"]');
  const textoOriginal = boton.textContent;
  boton.disabled = true;
  boton.textContent = 'Guardando...';

  try {
    const res = await fetch('/api/auth/perfil', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nombre, correo })
    });
    const data = await res.json().catch(() => ({}));

    if (res.ok) {
      modal.classList.remove('active');
      await cargarPerfil();
    } else {
      mostrarError(data.error || 'No se pudo actualizar el perfil');
    }
  } catch (error) {
    console.error(error);
    mostrarError('Error de conexión con el servidor');
  } finally {
    boton.disabled = false;
    boton.textContent = textoOriginal;
  }
});

cargarPerfil();

import('./notificaciones.js')
  .then((m) => m.vincularControles({
    enlace: document.getElementById('btn-notificaciones'),
    etiqueta: document.getElementById('notif-etiqueta'),
    hora: document.getElementById('notif-hora'),
    probar: document.getElementById('notif-probar'),
    estado: document.getElementById('notif-estado')
  }))
  .catch((e) => console.warn('Notificaciones no disponibles:', e));