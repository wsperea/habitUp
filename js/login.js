const form = document.getElementById('loginForm');
const errorEl = document.getElementById('login-error');
const emailEl = document.getElementById('em');
const passEl = document.getElementById('pw');

function mostrarError(mensaje) {
  errorEl.textContent = mensaje;
  errorEl.hidden = false;
  passEl.classList.add('invalido');
}

function limpiarError() {
  errorEl.hidden = true;
  errorEl.textContent = '';
  passEl.classList.remove('invalido');
}

emailEl.addEventListener('input', limpiarError);
passEl.addEventListener('input', limpiarError);

form?.addEventListener('submit', async (e) => {
  e.preventDefault();
  limpiarError();

  const correo = emailEl.value.trim();
  const password = passEl.value;
  const boton = form.querySelector('button[type="submit"]');

  boton.disabled = true;
  const textoOriginal = boton.textContent;
  boton.textContent = 'Entrando...';

  try {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ correo, password })
    });

    const data = await res.json().catch(() => ({}));

    if (res.ok) {
      window.location.href = '/index.html';
      return;
    }
    mostrarError(data.error || 'No se pudo iniciar sesión');
  } catch (error) {
    console.error(error);
    mostrarError('Error de conexión con el servidor');
  } finally {
    boton.disabled = false;
    boton.textContent = textoOriginal;
  }
});