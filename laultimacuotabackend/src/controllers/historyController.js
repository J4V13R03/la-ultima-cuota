const db = require('../config/db');

const getMyBets = async (req, res) => {
  try {
    const { estado, page = 1, limit = 20 } = req.query;
    const offset = (Number(page) - 1) * Number(limit);

    let query = `
      SELECT a.id, a.monto, a.cuota, a.estado, a.monto_ganado, a.created_at,
             c.nombre AS carrera_nombre, c.estado AS carrera_estado,
             h.nombre AS caballo_nombre
      FROM apuestas a
      JOIN carreras c ON c.id = a.carrera_id
      JOIN caballos h ON h.id = a.caballo_id
      WHERE a.usuario_id = $1
    `;
    const params = [req.user.id];
    let paramIndex = 2;

    if (estado) {
      query += ` AND a.estado = $${paramIndex}`;
      params.push(estado);
      paramIndex++;
    }

    query += ` ORDER BY a.created_at DESC`;
    query += ` LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    params.push(Number(limit), offset);

    const result = await db.query(query, params);

    let countQuery = 'SELECT COUNT(*) FROM apuestas WHERE usuario_id = $1';
    const countParams = [req.user.id];
    if (estado) {
      countQuery += ' AND estado = $2';
      countParams.push(estado);
    }
    const countResult = await db.query(countQuery, countParams);
    const total = Number(countResult.rows[0].count);

    res.json({
      success: true,
      data: {
        bets: result.rows,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          pages: Math.ceil(total / Number(limit)),
        },
      },
    });
  } catch (err) {
    console.error('[History] GetMyBets error:', err.message);
    res.status(500).json({ success: false, error: 'Error interno del servidor' });
  }
};

const getMyWins = async (req, res) => {
  try {
    const result = await db.query(
      `SELECT ts.monto AS ganancia, ts.created_at, c.nombre AS carrera_nombre, c.id AS carrera_id
       FROM transacciones_saldo ts
       JOIN carreras c ON c.id = ts.referencia_id
       WHERE ts.usuario_id = $1 AND ts.tipo = 'apuesta_ganada'
       ORDER BY ts.created_at DESC
       LIMIT 5`,
      [req.user.id]
    );

    res.json({ success: true, data: { wins: result.rows } });
  } catch (err) {
    console.error('[History] GetMyWins error:', err.message);
    res.status(500).json({ success: false, error: 'Error interno del servidor' });
  }
};

const getStats = async (req, res) => {
  try {
    const result = await db.query(
      `SELECT
         COUNT(*) AS total_apuestas,
         COUNT(*) FILTER (WHERE estado = 'ganada') AS apuestas_ganadas,
         COALESCE(SUM(monto_ganado) FILTER (WHERE estado = 'ganada'), 0) AS total_ganado,
         COALESCE(SUM(monto) FILTER (WHERE estado = 'perdida'), 0) AS total_perdido
       FROM apuestas WHERE usuario_id = $1`,
      [req.user.id]
    );

    res.json({ success: true, data: { stats: result.rows[0] } });
  } catch (err) {
    console.error('[History] GetStats error:', err.message);
    res.status(500).json({ success: false, error: 'Error interno del servidor' });
  }
};

module.exports = { getMyBets, getMyWins, getStats };
