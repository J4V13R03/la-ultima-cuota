const db = require('../config/db');

const User = {
  findByEmail: async (email) => {
    const result = await db.query(
      'SELECT id, username, email, password_hash, saldo, created_at FROM usuarios WHERE email = $1',
      [email]
    );
    return result.rows[0] || null;
  },

  findByEmailOrUsername: async (email, username) => {
    const result = await db.query(
      'SELECT id FROM usuarios WHERE email = $1 OR username = $2',
      [email, username]
    );
    return result.rows;
  },

  findById: async (id) => {
    const result = await db.query(
      'SELECT id, username, email, saldo, ultima_recompensa_diaria, created_at FROM usuarios WHERE id = $1',
      [id]
    );
    return result.rows[0] || null;
  },

  create: async ({ username, email, password_hash }) => {
    const result = await db.query(
      `INSERT INTO usuarios (username, email, password_hash)
       VALUES ($1, $2, $3)
       RETURNING id, username, email, saldo, created_at`,
      [username, email, password_hash]
    );
    return result.rows[0];
  },

  updateSaldo: async (userId, amount, client) => {
    const q = client || db;
    const result = await q.query(
      `UPDATE usuarios SET saldo = saldo + $1, updated_at = NOW()
       WHERE id = $2
       RETURNING id, saldo`,
      [amount, userId]
    );
    return result.rows[0] || null;
  },

  updateDailyClaim: async (userId, client) => {
    const q = client || db;
    const result = await q.query(
      `UPDATE usuarios SET ultima_recompensa_diaria = NOW(), updated_at = NOW()
       WHERE id = $1
       RETURNING id, ultima_recompensa_diaria`,
      [userId]
    );
    return result.rows[0] || null;
  },

  getSaldo: async (userId) => {
    const result = await db.query('SELECT saldo FROM usuarios WHERE id = $1', [userId]);
    return result.rows[0] ? result.rows[0].saldo : null;
  },
};

module.exports = User;
