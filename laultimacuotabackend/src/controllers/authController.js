const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { hashPassword, comparePassword } = require('../utils/hash');

const generateToken = (user) => {
  return jwt.sign(
    { id: user.id, username: user.username, email: user.email },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
};

const sanitizeUser = (row) => ({
  id: row.id,
  username: row.username,
  email: row.email,
  saldo: row.saldo,
  created_at: row.created_at,
});

const register = async (req, res) => {
  try {
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({ success: false, error: 'Todos los campos son obligatorios' });
    }

    if (password.length < 6) {
      return res.status(400).json({ success: false, error: 'La contraseña debe tener al menos 6 caracteres' });
    }

    const existing = await User.findByEmailOrUsername(email, username);
    if (existing.length > 0) {
      return res.status(409).json({ success: false, error: 'El email o nombre de usuario ya está registrado' });
    }

    const password_hash = await hashPassword(password);
    const user = await User.create({ username, email, password_hash });
    const token = generateToken(user);

    res.status(201).json({ success: true, data: { token, user: sanitizeUser(user) } });
  } catch (err) {
    console.error('[Auth] Register error:', err.message);
    res.status(500).json({ success: false, error: 'Error interno del servidor' });
  }
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, error: 'Email y contraseña son obligatorios' });
    }

    const user = await User.findByEmail(email);
    if (!user) {
      return res.status(401).json({ success: false, error: 'Credenciales inválidas' });
    }

    const valid = await comparePassword(password, user.password_hash);
    if (!valid) {
      return res.status(401).json({ success: false, error: 'Credenciales inválidas' });
    }

    const token = generateToken(user);
    res.json({ success: true, data: { token, user: sanitizeUser(user) } });
  } catch (err) {
    console.error('[Auth] Login error:', err.message);
    res.status(500).json({ success: false, error: 'Error interno del servidor' });
  }
};

const me = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, error: 'Usuario no encontrado' });
    }
    res.json({ success: true, data: { user: sanitizeUser(user) } });
  } catch (err) {
    console.error('[Auth] Me error:', err.message);
    res.status(500).json({ success: false, error: 'Error interno del servidor' });
  }
};

module.exports = { register, login, me };
