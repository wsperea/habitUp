const form = document.getElementById('registroForm');
const msgEl = document.getElementById('registro-msg');
const nombreEl = document.getElementById('nm');
const correoEl = document.getElementById('em');
const passEl = document.getElementById('pw');

function mostrarError(mensaje) {
  msgEl.textContent = mensaje;
  msgEl.classList.remove('form-ok');
  msgEl.hidden = false;
  passEl.classList.add('invalido');
}

function mostrarExito(mensaje) {
  msgEl.textContent = mensaje;
  msgEl.classList.add('form-ok');
  msgEl.hidden = false;
  passEl.classList.remove('invalido');
}

function limpiarMensaje() {
  msgEl.hidden = true;
  msgEl.textContent = '';
  msgEl.classList.remove('form-ok');
  passEl.classList.remove('invalido');
}

[nombreEl, correoEl, passEl].forEach((el) => el.addEventListener('input', limpiarMensaje));

form?.addEventListener('submit', async (e) => {
  e.preventDefault();
  limpiarMensaje();

  const nombre = nombreEl.value.trim();
  const correo = correoEl.value.trim();
  const password = passEl.value;

  if (password.length < 8) {
    mostrarError('La contraseña debe tener al menos 8 caracteres');
    return;
  }

  const boton = form.querySelector('button[type="submit"]');
  const textoOriginal = boton.textContent;
  boton.disabled = true;
  boton.textContent = 'Creando cuenta...';

  try {
    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nombre, correo, password })
    });

    const data = await res.json().catch(() => ({}));

    if (res.ok) {
      mostrarExito('¡Cuenta creada con éxito! Redirigiendo al inicio de sesión...');
      setTimeout(() => { window.location.href = '/login.html'; }, 1500);
      return; // el botón queda bloqueado mientras redirige
    }
    mostrarError(data.error || 'No se pudo crear la cuenta');
  } catch (error) {
    console.error(error);
    mostrarError('Error de conexión con el servidor');
  }

  boton.disabled = false;
  boton.textContent = textoOriginal;
});