import { Router } from 'express';
import { Habito } from '../models/index.js';
import { verificarToken } from '../middlewares/authMiddleware.js';

const router = Router();

// Obtener hábitos del usuario
router.get('/', verificarToken, async (req, res) => {
  try {
    const habitos = await Habito.find({ usuario_id: req.usuario.id });
    res.json(habitos);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al obtener los hábitos' });
  }
});

// Crear un nuevo hábito
router.post('/', verificarToken, async (req, res) => {
  try {
    const { nombre, categoria, descripcion, frecuencia } = req.body;

    if (!nombre) return res.status(400).json({ error: 'El nombre del hábito es obligatorio' });

    const nuevoHabito = new Habito({
      usuario_id: req.usuario.id,
      nombre,
      categoria,
      descripcion,
      frecuencia
    });

    await nuevoHabito.save();
    res.status(201).json({ mensaje: 'Hábito creado', habito: nuevoHabito });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al crear el hábito' });
  }
});

// Actualizar un hábito (solo el estado activo/inactivo)
router.put('/:id', verificarToken, async (req, res) => {
  try {
    const { activo } = req.body;
    
    const habito = await Habito.findOneAndUpdate(
      { _id: req.params.id, usuario_id: req.usuario.id },
      { activo },
      { new: true }
    );

    if (!habito) return res.status(404).json({ error: 'Hábito no encontrado' });
    res.json({ mensaje: 'Hábito actualizado', habito });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al actualizar el hábito' });
  }
});

// Eliminar un hábito
router.delete('/:id', verificarToken, async (req, res) => {
  try {
    const habito = await Habito.findOneAndDelete({ 
      _id: req.params.id, 
      usuario_id: req.usuario.id 
    });

    if (!habito) return res.status(404).json({ error: 'Hábito no encontrado' });
    res.json({ mensaje: 'Hábito eliminado' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al eliminar el hábito' });
  }
});

export default router;