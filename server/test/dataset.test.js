// Pruebas de lectura/validación de los JSON (no necesitan MongoDB).
import test from 'node:test';
import assert from 'node:assert/strict';
import { config } from '../src/config.js';
import { loadDataset, validateDataset } from '../src/import/dataset.js';

const fresh = () => loadDataset(config.dataDir);
const errorsOf = (mutate) => { const d = fresh(); mutate(d); return validateDataset(d).errors; };

test('tus 3 JSON reales son válidos y se leen con $oid/$date', () => {
  const d = fresh();
  assert.equal(d.usuarios.length, 1);
  assert.equal(d.habitos[0].nombre, 'Leer 10 páginas');
  assert.ok(d.registros[0].fecha instanceof Date);
  const { errors, warnings } = validateDataset(d);
  assert.deepEqual(errors, []);
  assert.ok(warnings.some((w) => w.includes('marcador')), 'avisa de la contraseña pendiente');
});
test('detecta referencias rotas', () => {
  assert.ok(errorsOf((d) => { d.habitos[0].usuario_id = d.habitos[0]._id; }).some((e) => e.includes('usuario_id')));
  assert.ok(errorsOf((d) => { d.registros[0].habito_id = d.usuarios[0]._id; }).some((e) => e.includes('habito_id')));
});
test('detecta contraseña en texto plano', () => {
  assert.ok(errorsOf((d) => { d.usuarios[0].password = '123456'; }).some((e) => e.includes('texto plano')));
});
test('acepta un hash bcrypt', () => {
  assert.deepEqual(errorsOf((d) => { d.usuarios[0].password = '$2b$10$' + 'a'.repeat(53); }), []);
});
test('detecta días inválidos, correos duplicados y registros repetidos', () => {
  assert.ok(errorsOf((d) => { d.habitos[0].frecuencia.dias = ['lunes', 'domingos']; }).some((e) => e.includes('dias')));
  assert.ok(errorsOf((d) => { d.usuarios.push({ ...d.usuarios[0], _id: d.habitos[0]._id }); }).some((e) => e.includes('duplicado')));
  assert.ok(errorsOf((d) => { d.registros.push({ ...d.registros[0], _id: d.usuarios[0]._id }); }).some((e) => e.includes('ya existe')));
});
test('detecta registro de un hábito de otro usuario', () => {
  const e = errorsOf((d) => {
    const otro = { ...d.usuarios[0], _id: d.registros[0]._id, correo: 'otro@example.com' };
    d.usuarios.push(otro);
    d.registros[0].usuario_id = otro._id;
  });
  assert.ok(e.some((m) => m.includes('otro usuario')));
});
