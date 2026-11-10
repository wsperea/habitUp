import { Router } from 'express';
import mongoose from 'mongoose';
import { dbState, isDbReady } from '../db.js';
import { isProd } from '../config.js';
import { Usuario, Habito, Registro } from '../models/index.js';

export const healthRouter = Router();

healthRouter.get('/', async (req, res, next) => {
  try {
    const up = isDbReady();
    const body = {
      ok: up,
      uptime: Math.round(process.uptime()),
      db: { state: dbState(), name: up ? mongoose.connection.name : null },
    };
    if (up && !isProd) {
      const [usuarios, habitos, registros] = await Promise.all([
        Usuario.countDocuments(), Habito.countDocuments(), Registro.countDocuments(),
      ]);
      body.counts = { usuarios, habitos, registros };
    }
    res.status(up ? 200 : 503).json(body);
  } catch (err) { next(err); }
});
