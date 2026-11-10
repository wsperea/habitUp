import mongoose from 'mongoose';

const registroSchema = new mongoose.Schema({
  usuario_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Usuario', required: true },
  habito_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Habito', required: true },
  fecha: { type: Date, required: true },
  completado: { type: Boolean, default: true },
  nota: { type: String }
});

export const Registro = mongoose.model('Registro', registroSchema);