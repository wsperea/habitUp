const form = document.getElementById('loginForm');

form?.addEventListener('submit', async (e) => {
  e.preventDefault();

  const correo = document.getElementById('em').value.trim();
  const password = document.getElementById('pw').value;
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
    } else {
      alert('Error: ' + (data.error || 'No se pudo iniciar sesión'));
    }
  } catch (error) {
    console.error(error);
    alert('Error de conexión con el servidor');
  } finally {
    boton.disabled = false;
    boton.textContent = textoOriginal;
  }
});