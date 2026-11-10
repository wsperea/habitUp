document.getElementById('registroForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  
  const nombre = document.getElementById('nm').value;
  const correo = document.getElementById('em').value;
  const password = document.getElementById('pw').value;

  try {
    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nombre, correo, password })
    });
    
    const data = await res.json();
    
    if (res.ok) {
      alert("¡Cuenta creada con éxito! Ahora inicia sesión.");
      window.location.href = '/login.html'; 
    } else {
      alert("Error: " + data.error); 
    }
  } catch (error) {
    console.error(error);
    alert("Error de conexión con el servidor");
  }
});