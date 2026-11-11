import { Router } from 'express';
import { Usuario } from '../models/index.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { verificarToken } from '../middlewares/authMiddleware.js';

const router = Router();

// Ruta: Registro
router.post('/register', async (req, res) => {
  try {
    const { nombre, correo, password } = req.body;
    if (!nombre || !correo || !password) return res.status(400).json({ error: 'Todos los campos son obligatorios' });
    if (password.length < 8) return res.status(400).json({ error: 'La contraseña debe tener al menos 8 caracteres' });
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(correo)) return res.status(400).json({ error: 'El formato del correo no es válido' });

    const existe = await Usuario.findOne({ correo });
    if (existe) return res.status(400).json({ error: 'El correo ya está registrado' });

    const salt = await bcrypt.genSalt(10);
    const hashPassword = await bcrypt.hash(password, salt);

    const nuevoUsuario = new Usuario({ nombre, correo, password: hashPassword });
    await nuevoUsuario.save();

    res.status(201).json({ mensaje: 'Usuario creado correctamente' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al registrar usuario' });
  }
});

// Ruta: Login
router.post('/login', async (req, res) => {
  try {
    const { correo, password } = req.body;
    const usuario = await Usuario.findOne({ correo });
    if (!usuario) return res.status(400).json({ error: 'Credenciales incorrectas' });

    const passwordValida = await bcrypt.compare(password, usuario.password);
    if (!passwordValida) return res.status(400).json({ error: 'Credenciales incorrectas' });

    const token = jwt.sign(
      { id: usuario._id, nombre: usuario.nombre }, 
      process.env.JWT_SECRET, 
      { expiresIn: process.env.JWT_EXPIRES || '7d' }
    );

    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 7 * 24 * 60 * 60 * 1000
    });

    res.json({ mensaje: 'Login exitoso', usuario: { nombre: usuario.nombre } });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al iniciar sesión' });
  }
});

// Ruta: Logout
router.post('/logout', (req, res) => {
  res.clearCookie('token');
  res.json({ mensaje: 'Sesión cerrada' });
});

// Ruta: Verificar sesión actual
router.get('/me', verificarToken, (req, res) => {
  res.json({ logueado: true, usuario: req.usuario });
});

// Ruta: Obtener datos del perfil
router.get('/perfil', verificarToken, async (req, res) => {
  try {
    const usuario = await Usuario.findById(req.usuario.id).select('-password');
    if (!usuario) return res.status(404).json({ error: 'Usuario no encontrado' });
    res.json(usuario);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al obtener el perfil' });
  }
});

// Ruta: Actualizar perfil (nombre y correo)
router.put('/perfil', verificarToken, async (req, res) => {
  try {
    const nombre = String(req.body.nombre ?? '').trim();
    const correo = String(req.body.correo ?? '').trim();

    if (!nombre) return res.status(400).json({ error: 'El nombre es obligatorio' });
    if (!correo) return res.status(400).json({ error: 'El correo es obligatorio' });

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(correo)) {
      return res.status(400).json({ error: 'El formato del correo no es válido' });
    }

    const existe = await Usuario.findOne({ correo, _id: { $ne: req.usuario.id } });
    if (existe) return res.status(409).json({ error: 'Ese correo ya está en uso' });

    const usuarioActualizado = await Usuario.findByIdAndUpdate(
      req.usuario.id,
      { nombre, correo },
      { new: true, runValidators: true }
    ).select('-password');

    if (!usuarioActualizado) return res.status(404).json({ error: 'Usuario no encontrado' });

    // Reemitir el token para que /me devuelva el nombre nuevo
    const token = jwt.sign(
      { id: usuarioActualizado._id, nombre: usuarioActualizado.nombre },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES || '7d' }
    );
    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 7 * 24 * 60 * 60 * 1000
    });

    res.json({ mensaje: 'Perfil actualizado', usuario: usuarioActualizado });
  } catch (error) {
    console.error(error);
    if (error.code === 11000) return res.status(409).json({ error: 'Ese correo ya está en uso' });
    res.status(500).json({ error: 'Error al actualizar el perfil' });
  }
});

export default router;