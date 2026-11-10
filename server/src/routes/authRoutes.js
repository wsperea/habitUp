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
    
    // Validaciones de servidor
    if (!nombre || !correo || !password) {
      return res.status(400).json({ error: 'Todos los campos son obligatorios' });
    }
    if (password.length < 8) {
      return res.status(400).json({ error: 'La contraseña debe tener al menos 8 caracteres' });
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(correo)) {
      return res.status(400).json({ error: 'El formato del correo no es válido' });
    }

    // Validar que no exista
    const existe = await Usuario.findOne({ correo });
    if (existe) return res.status(400).json({ error: 'El correo ya está registrado' });

    // Encriptar contraseña
    const salt = await bcrypt.genSalt(10);
    const hashPassword = await bcrypt.hash(password, salt);

    // Guardar usuario
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
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 días
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

// Ruta: Actualizar nombre del perfil
router.put('/perfil', verificarToken, async (req, res) => {
  try {
    const { nombre } = req.body;
    if (!nombre) return res.status(400).json({ error: 'El nombre es obligatorio' });

    const usuarioActualizado = await Usuario.findByIdAndUpdate(
      req.usuario.id,
      { nombre },
      { new: true }
    ).select('-password');

    res.json({ mensaje: 'Perfil actualizado', usuario: usuarioActualizado });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al actualizar el perfil' });
  }
});

export default router;