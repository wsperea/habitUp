const wrap = () => document.getElementById('avatar');

function saltar() {
  const el = wrap();
  if (!el) return;
  el.classList.remove('jump');
  void el.offsetWidth; // reinicia la animación
  el.classList.add('jump');
}

let ultimoPct = null;

export function iniciarAvatar() {
  wrap()?.addEventListener('click', saltar);
}

// Llamar cada vez que cambie el progreso diario
export function avatarReaccionar(porcentaje) {
  // Salta solo cuando el avatar pasa a 100 % (no en la primera carga)
  if (ultimoPct !== null && ultimoPct < 100 && porcentaje === 100) saltar();
  ultimoPct = porcentaje;
}