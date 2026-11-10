import { Router } from 'express';
import mongoose from 'mongoose';
import { Registro, Habito } from '../models/index.js';
import { verificarToken } from '../middlewares/authMiddleware.js';

const router = Router();

// Obtener los registros de HOY
router.get('/hoy', verificarToken, async (req, res) => {
  try {
    const inicioDia = new Date();
    inicioDia.setHours(0, 0, 0, 0);
    const finDia = new Date();
    finDia.setHours(23, 59, 59, 999);

    const registros = await Registro.find({
      usuario_id: req.usuario.id,
      fecha: { $gte: inicioDia, $lte: finDia }
    });
    res.json(registros);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al obtener registros' });
  }
});

// Marcar/Desmarcar un hábito
router.post('/toggle', verificarToken, async (req, res) => {
  try {
    const { habito_id } = req.body;
    
    const inicioDia = new Date();
    inicioDia.setHours(0, 0, 0, 0);
    const finDia = new Date();
    finDia.setHours(23, 59, 59, 999);

    const registroExistente = await Registro.findOne({
      usuario_id: req.usuario.id,
      habito_id: habito_id,
      fecha: { $gte: inicioDia, $lte: finDia }
    });

    if (registroExistente) {
      await Registro.findByIdAndDelete(registroExistente._id);
      res.json({ mensaje: 'Hábito desmarcado' });
    } else {
      const nuevoRegistro = new Registro({
        usuario_id: req.usuario.id,
        habito_id: habito_id,
        fecha: new Date(),
        completado: true
      });
      await nuevoRegistro.save();
      res.json({ mensaje: 'Hábito completado', registro: nuevoRegistro });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al marcar el hábito' });
  }
});

// Calcular la racha de días consecutivos
router.get('/racha', verificarToken, async (req, res) => {
  try {
    const registros = await Registro.find({ usuario_id: req.usuario.id }).sort({ fecha: -1 });
    if (registros.length === 0) return res.json({ racha: 0, mensaje: '¡Empieza hoy!' });

    const fechasUnicas = [...new Set(registros.map(r => {
      const d = new Date(r.fecha);
      return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
    }))];

    let racha = 0;
    let fechaActual = new Date();
    fechaActual.setHours(0, 0, 0, 0);

    const hoyStr = `${fechaActual.getFullYear()}-${fechaActual.getMonth()}-${fechaActual.getDate()}`;
    if (!fechasUnicas.includes(hoyStr)) fechaActual.setDate(fechaActual.getDate() - 1);

    while (true) {
      const diaStr = `${fechaActual.getFullYear()}-${fechaActual.getMonth()}-${fechaActual.getDate()}`;
      if (fechasUnicas.includes(diaStr)) {
        racha++;
        fechaActual.setDate(fechaActual.getDate() - 1);
      } else {
        break;
      }
    }

    let mensaje = '¡Sigue así!';
    if (racha === 0) mensaje = '¡Empieza hoy!';
    if (racha >= 3) mensaje = '¡Estás en llamas! 🔥';
    if (racha >= 7) mensaje = '¡Imparable! 🚀';

    res.json({ racha, mensaje });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al calcular la racha' });
  }
});

// OPTIMIZACIÓN: Estadísticas semanales con una sola consulta a MongoDB (Aggregation)
router.get('/semana', verificarToken, async (req, res) => {
  try {
    const hoy = new Date();
    hoy.setHours(23, 59, 59, 999);
    const hace7Dias = new Date();
    hace7Dias.setDate(hace7Dias.getDate() - 6);
    hace7Dias.setHours(0, 0, 0, 0);

    const stats = await Registro.aggregate([
      {
        $match: {
          usuario_id: new mongoose.Types.ObjectId(req.usuario.id),
          fecha: { $gte: hace7Dias, $lte: hoy }
        }
      },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$fecha" } },
          completados: { $sum: 1 }
        }
      }
    ]);

    const diasSemana = ['Do', 'Lu', 'Ma', 'Mi', 'Ju', 'Vi', 'Sá'];
    const resultado = [];
    
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const fechaStr = d.toISOString().split('T')[0];
      const encontrado = stats.find(s => s._id === fechaStr);
      
      resultado.push({
        dia: diasSemana[d.getDay()],
        fecha: fechaStr,
        completados: encontrado ? encontrado.completados : 0
      });
    }

    res.json(resultado);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al obtener estadísticas' });
  }
});

// Obtener el nivel y la XP del usuario
router.get('/nivel', verificarToken, async (req, res) => {
  try {
    const totalRegistros = await Registro.countDocuments({ 
      usuario_id: req.usuario.id,
      completado: true 
    });

    const xpTotal = totalRegistros * 50;
    const nivel = Math.floor(xpTotal / 500) + 1;
    const xpActualNivel = xpTotal % 500;
    const xpSiguienteNivel = 500;

    res.json({ xpTotal, nivel, xpActualNivel, xpSiguienteNivel });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al calcular el nivel' });
  }
});

// NUEVO: Calcular el porcentaje de éxito semanal
router.get('/exito', verificarToken, async (req, res) => {
  try {
    const hoy = new Date();
    hoy.setHours(23, 59, 59, 999);
    const hace7Dias = new Date();
    hace7Dias.setDate(hace7Dias.getDate() - 6);
    hace7Dias.setHours(0, 0, 0, 0);

    // Registros completados en los últimos 7 días
    const registros = await Registro.find({
      usuario_id: req.usuario.id,
      fecha: { $gte: hace7Dias, $lte: hoy }
    });

    // Hábitos activos del usuario
    const habitosActivos = await Habito.find({ usuario_id: req.usuario.id, activo: true });

    // Cálculo del total esperado (Hábitos activos * 7 días)
    const totalEsperado = habitosActivos.length * 7;

    if (totalEsperado === 0) {
      return res.json({ porcentaje: 0, completados: 0, totalEsperado: 0 });
    }

    const totalCompletados = registros.length;
    
    let porcentaje = Math.round((totalCompletados / totalEsperado) * 100);
    if (porcentaje > 100) porcentaje = 100;

    res.json({ porcentaje, completados: totalCompletados, totalEsperado });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al calcular el éxito' });
  }
});

export default router;