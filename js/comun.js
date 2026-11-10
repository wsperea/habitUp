export async function inicializarApp() {
  const temaGuardado = localStorage.getItem('tema');
  if (temaGuardado === 'claro') {
    document.body.classList.add('light-mode');
    const themeLabel = document.querySelector('[data-ui="theme-label"]');
    if (themeLabel) themeLabel.textContent = 'Modo claro ›';
  }

  let data;
  try {
    const res = await fetch('/api/auth/me');
    if (!res.ok) throw new Error('No autorizado');
    data = await res.json();
  } catch (error) {
    window.location.href = '/login.html';
    return;
  }

  const avatar = document.querySelector('[data-ui="user-avatar"]');
  if (avatar) avatar.textContent = data.usuario.nombre.substring(0, 2).toUpperCase();
  const greeting = document.querySelector('[data-ui="greeting"]');
  if (greeting) greeting.textContent = `Buenos días, ${data.usuario.nombre}`;
}

export async function cerrarSesion() {
  await fetch('/api/auth/logout', { method: 'POST' });
  window.location.href = '/login.html';
}

export function cambiarTema() {
  const body = document.body;
  const esClaro = body.classList.toggle('light-mode');
  const themeLabel = document.querySelector('[data-ui="theme-label"]');
  
  if (esClaro) {
    localStorage.setItem('tema', 'claro');
    if (themeLabel) themeLabel.textContent = 'Modo claro ›';
  } else {
    localStorage.setItem('tema', 'oscuro');
    if (themeLabel) themeLabel.textContent = 'Modo oscuro ›';
  }
}

window.cerrarSesion = cerrarSesion;
window.cambiarTema = cambiarTema;