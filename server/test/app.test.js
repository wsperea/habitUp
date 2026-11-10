// Pruebas del servidor que NO necesitan MongoDB.
import test from 'node:test';
import assert from 'node:assert/strict';
import { createApp } from '../src/app.js';

let server, base;
test.before(async () => {
  server = createApp().listen(0);
  await new Promise((r) => server.once('listening', r));
  base = `http://127.0.0.1:${server.address().port}`;
});
test.after(() => server.close());

const get = (p) => fetch(base + p, { redirect: 'manual' });

test('sirve el sitio: index.html, css y js', async () => {
  for (const p of ['/index.html', '/styles.css', '/js/app.js', '/login.html']) {
    assert.equal((await get(p)).status, 200, p);
  }
});
test('no expone archivos privados del servidor', async () => {
  for (const p of ['/server/.env', '/server/.env.example', '/server/package.json', '/server/src/config.js',
    '/server/data/habitUp_usuarios.json', '/SERVER/package.json', '/node_modules/x', '/%2e%2e/etc/passwd', '/.git/config']) {
    const s = (await get(p)).status;
    assert.ok([400, 404].includes(s), `${p} devolvió ${s}`);
  }
});
test('/api/health responde 503 y JSON si no hay base de datos', async () => {
  const res = await get('/api/health');
  assert.equal(res.status, 503);
  const body = await res.json();
  assert.equal(body.ok, false);
  assert.equal(body.db.state, 'desconectado');
});
test('rutas de API inexistentes devuelven JSON 404', async () => {
  const res = await get('/api/no-existe');
  assert.equal(res.status, 404);
  assert.ok((await res.json()).error);
});
