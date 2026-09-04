const db = require('../config/db');

const Transaccion = {
  create: async ({ usuario_id, tipo, monto, saldo_resultante, referencia_tabla, referencia_id }, client) => {
    const q = client || db;
    const result = await q.query(
      `INSERT INTO transacciones_saldo (usuario_id, tipo, monto, saldo_resultante, referencia_tabla, referencia_id)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id, tipo, monto, saldo_resultante, created_at`,
      [usuario_id, tipo, monto, saldo_resultante, referencia_tabla || null, referencia_id || null]
    );
    return result.rows[0];
  },

  getRecentWins: async (userId, limit = 5) => {
    const result = await db.query(
      `SELECT ts.monto AS ganancia, ts.created_at, c.nombre AS carrera_nombre, c.id AS carrera_id
       FROM transacciones_saldo ts
       JOIN carreras c ON c.id = ts.referencia_id
       WHERE ts.usuario_id = $1 AND ts.tipo = 'apuesta_ganada'
       ORDER BY ts.created_at DESC
       LIMIT $2`,
      [userId, limit]
    );
    return result.rows;
  },
};

module.exports = Transaccion;
