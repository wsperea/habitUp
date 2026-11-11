async function pedirJson(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`${url} respondió ${res.status}`);
  return res.json();
}

function vincularNavegacion() {
  const ir = (el, destino, etiqueta) => {
    if (!el) return;
    el.style.cursor = 'pointer';
    el.setAttribute('role', 'link');
    el.setAttribute('tabindex', '0');
    el.setAttribute('aria-label', etiqueta);
    el.addEventListener('click', () => { window.location.href = destino; });
    el.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); window.location.href = destino; }
    });
  };
  ir(document.querySelector('.sb .lg'), 'index.html', 'Ir al inicio');
  ir(document.querySelector('header [data-ui="user-avatar"]'), 'perfil.html', 'Ir a mi perfil');
}

export async function cargarSidebarNivel() {
  try {
    const d = await pedirJson('/api/registros/nivel');
    const xpTotal = Number(d.xpTotal ?? 0);
    const nivel = Number(d.nivel ?? 1);
    const actual = Number(d.xpActualNivel ?? 0);
    const siguiente = Number(d.xpSiguienteNivel ?? 500) || 500;
    const pct = Math.min(100, Math.max(0, (actual / siguiente) * 100));

    const nivelEl = document.getElementById('sidebar-nivel');
    const xpEl = document.getElementById('sidebar-xp');
    const barEl = document.getElementById('sidebar-xpbar');
    if (nivelEl) nivelEl.textContent = `Nivel ${nivel}`;
    if (xpEl) xpEl.textContent = `${xpTotal} / ${nivel * 500} XP`;
    if (barEl) barEl.style.width = `${pct}%`;
  } catch (error) {
    console.error('Error cargando nivel del sidebar:', error);
  }
}

export async function inicializarApp() {
  vincularNavegacion();

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
  if (greeting) {
    const h = new Date().getHours();
    const nombre = data.usuario.nombre;
    const saludo =
      h < 12 ? `Buenos días, ${nombre}` :
      h < 19 ? `Buenas tardes, ${nombre}` :
               `Buenas noches, ${nombre}`;
    greeting.textContent = saludo;
  }

  await cargarSidebarNivel();
}

export async function cerrarSesion() {
  await fetch('/api/auth/logout', { method: 'POST' });
  window.location.href = '/login.html';
}

export function cambiarTema() {
  const esClaro = document.body.classList.toggle('light-mode');
  const themeLabel = document.querySelector('[data-ui="theme-label"]');
  localStorage.setItem('tema', esClaro ? 'claro' : 'oscuro');
  if (themeLabel) themeLabel.textContent = esClaro ? 'Modo claro ›' : 'Modo oscuro ›';
}

window.cerrarSesion = cerrarSesion;
window.cambiarTema = cambiarTema;