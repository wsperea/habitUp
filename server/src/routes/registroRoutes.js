import { Router } from 'express';
import mongoose from 'mongoose';
import { Registro, Habito } from '../models/index.js';
import { verificarToken } from '../middlewares/authMiddleware.js';

const router = Router();

const TZ = 'America/Bogota'; // UTC-5, sin horario de verano
const fmtDia = (d) => d.toLocaleDateString('en-CA', { timeZone: TZ }); // YYYY-MM-DD
const DIA_MS = 24 * 60 * 60 * 1000;

// Obtener los registros de HOY
router.get('/hoy', verificarToken, async (req, res) => {
  try {
    const inicioDia = new Date(`${fmtDia(new Date())}T00:00:00-05:00`);
    const finDia = new Date(inicioDia.getTime() + DIA_MS - 1);
    
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
    
    const inicioDia = new Date(`${fmtDia(new Date())}T00:00:00-05:00`);
    const finDia = new Date(inicioDia.getTime() + DIA_MS - 1);

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

// Calcular la racha de días consecutivos (con zona horaria)
router.get('/racha', verificarToken, async (req, res) => {
  try {
    const registros = await Registro.find({ usuario_id: req.usuario.id }).sort({ fecha: -1 });
    if (registros.length === 0) return res.json({ racha: 0, mensaje: '¡Empieza hoy!' });

    // Extraer fechas únicas en la zona horaria de Bogotá
    const fechasUnicas = [...new Set(registros.map(r => fmtDia(r.fecha)))];

    let racha = 0;
    let fechaActual = new Date();
    
    const hoyStr = fmtDia(fechaActual);
    // Si no hay registro hoy, empezamos a contar desde ayer
    if (!fechasUnicas.includes(hoyStr)) {
      fechaActual = new Date(fechaActual.getTime() - DIA_MS);
    }

    while (true) {
      const diaStr = fmtDia(fechaActual);
      if (fechasUnicas.includes(diaStr)) {
        racha++;
        fechaActual = new Date(fechaActual.getTime() - DIA_MS);
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

// Obtener las estadísticas de los últimos 7 días (con zona horaria y filtro)
router.get('/semana', verificarToken, async (req, res) => {
  try {
    const desde = new Date(Date.now() - 8 * DIA_MS); // margen de seguridad

    const stats = await Registro.aggregate([
      {
        $match: {
          usuario_id: new mongoose.Types.ObjectId(req.usuario.id),
          completado: true,
          fecha: { $gte: desde }
        }
      },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$fecha', timezone: TZ } },
          completados: { $sum: 1 }
        }
      }
    ]);

    const diasSemana = ['Do', 'Lu', 'Ma', 'Mi', 'Ju', 'Vi', 'Sá'];
    const resultado = [];
    
    for (let i = 6; i >= 0; i--) {
      const fechaStr = fmtDia(new Date(Date.now() - i * DIA_MS));
      const encontrado = stats.find((s) => s._id === fechaStr);
      
      resultado.push({
        dia: diasSemana[new Date(`${fechaStr}T12:00:00Z`).getUTCDay()],
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

export default router;