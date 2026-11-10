import express from 'express';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { config, isProd } from './config.js';
import { healthRouter } from './routes/health.js';
import authRoutes from './routes/authRoutes.js';
import habitoRoutes from './routes/habitoRoutes.js';
import registroRoutes from './routes/registroRoutes.js';

const PRIVATE_ROOTS = new Set(['server', 'node_modules']);

function blockPrivatePaths(req, res, next) {
  let p;
  try { p = decodeURIComponent(req.path).replace(/\\/g, '/'); } catch { return res.sendStatus(400); }
  const segments = p.split('/').filter(Boolean).map((s) => s.toLowerCase());
  const blocked = segments.some((s) => s.startsWith('.')) || PRIVATE_ROOTS.has(segments[0]);
  return blocked ? res.sendStatus(404) : next();
}

export function createApp() {
  const app = express();
  app.disable('x-powered-by');
  
  // Seguridad
  app.use(helmet());
  const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutos
    max: 100, // Límite de 100 peticiones por IP
    message: { error: 'Demasiadas peticiones, intenta más tarde.' }
  });
  app.use('/api/auth/login', limiter); // Evita fuerza bruta en el login

  app.use(express.json({ limit: '100kb' }));
  app.use(cookieParser());

  // Rutas de la API
  app.use('/api/health', healthRouter);
  app.use('/api/auth', authRoutes);
  app.use('/api/habitos', habitoRoutes);
  app.use('/api/registros', registroRoutes);

  // Catch-all para API
  app.use('/api', (req, res) => res.status(404).json({ error: 'Ruta de API no encontrada' }));

  // Archivos estáticos
  app.use(blockPrivatePaths);
  app.use(express.static(config.siteDir, { dotfiles: 'deny', extensions: ['html'] }));

  // Manejo de errores global
  // eslint-disable-next-line no-unused-vars
  app.use((err, req, res, next) => {
    console.error('[habitup] error:', err);
    const body = { error: 'Error interno del servidor' };
    if (!isProd) body.detalle = err.message;
    res.status(500).json(body);
  });

  return app;
}