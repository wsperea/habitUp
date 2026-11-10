export async function inicializarApp() {
  // 1. Aplicar tema guardado
  const temaGuardado = localStorage.getItem('tema');
  if (temaGuardado === 'claro') {
    document.body.classList.add('light-mode');
    const themeLabel = document.querySelector('[data-ui="theme-label"]');
    if (themeLabel) themeLabel.textContent = 'Modo claro ›';
  }

  try {
    const res = await fetch('/api/auth/me');
    if (!res.ok) throw new Error('No autorizado');
    const data = await res.json();
    
    const avatar = document.querySelector('[data-ui="user-avatar"]');
    if (avatar) avatar.textContent = data.usuario.nombre.substring(0, 2).toUpperCase();

    const greeting = document.querySelector('[data-ui="greeting"]');
    if (greeting) greeting.textContent = `Buenos días, ${data.usuario.nombre}`;

    const resNivel = await fetch('/api/registros/nivel');
    if (resNivel.ok) {
      const nivelData = await resNivel.json();
      const nivelEl = document.getElementById('sidebar-nivel');
      const xpEl = document.getElementById('sidebar-xp');
      const xpBar = document.getElementById('sidebar-xpbar');
      
      if (nivelEl) nivelEl.textContent = `Nivel ${nivelData.nivel}`;
      if (xpEl) xpEl.textContent = `${nivelData.xpTotal} / ${nivelData.nivel * 500} XP`;
      if (xpBar) xpBar.style.width = `${(nivelData.xpActualNivel / nivelData.xpSiguienteNivel) * 100}%`;
    }

  } catch (error) {
    window.location.href = '/login.html';
  }
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