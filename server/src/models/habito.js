import mongoose from 'mongoose';

const habitoSchema = new mongoose.Schema({
  usuario_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Usuario', required: true },
  nombre: { type: String, required: true },
  categoria: { type: String, required: true },
  descripcion: { type: String },
  frecuencia: {
    dias: [{ type: String }]
  },
  activo: { type: Boolean, default: true },
  fecha_creacion: { type: Date, default: Date.now }
});

export const Habito = mongoose.model('Habito', habitoSchema);