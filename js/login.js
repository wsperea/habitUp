document.getElementById('loginForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  
  const correo = document.getElementById('em').value;
  const password = document.getElementById('pw').value;

  try {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ correo, password })
    });
    
    const data = await res.json();
    
    if (res.ok) {
      window.location.href = '/index.html'; 
    } else {
      alert("Error: " + data.error); 
    }
  } catch (error) {
    console.error(error);
    alert("Error de conexión con el servidor");
  }
});