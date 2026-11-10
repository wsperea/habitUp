import mongoose from 'mongoose';

const usuarioSchema = new mongoose.Schema({
  nombre: { type: String, required: true },
  correo: { type: String, required: true, unique: true },
  password: { type: String, required: true, minlength: 8 },
  fecha_registro: { type: Date, default: Date.now }
});

export const Usuario = mongoose.model('Usuario', usuarioSchema);