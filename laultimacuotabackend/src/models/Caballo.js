const db = require('../config/db');

const Caballo = {
  create: async ({ propietario_id, nombre, edad, velocidad, resistencia, corazon }) => {
    const result = await db.query(
      `INSERT INTO caballos (propietario_id, nombre, edad, velocidad, resistencia, corazon)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id, propietario_id, nombre, edad, fatiga, carreras_totales, victorias, en_venta, created_at`,
      [propietario_id, nombre, edad, velocidad, resistencia, corazon]
    );
    return result.rows[0];
  },

  findById: async (id) => {
    const result = await db.query(
      `SELECT id, propietario_id, nombre, edad, fatiga, carreras_totales, victorias,
              posicion_promedio, en_venta, precio_venta, es_bot, created_at
       FROM caballos WHERE id = $1`,
      [id]
    );
    return result.rows[0] || null;
  },

  findByOwner: async (usuarioId) => {
    const result = await db.query(
      `SELECT id, nombre, edad, fatiga, carreras_totales, victorias, posicion_promedio,
              en_venta, precio_venta, created_at
       FROM caballos WHERE propietario_id = $1 ORDER BY created_at DESC`,
      [usuarioId]
    );
    return result.rows;
  },

  findOnSale: async () => {
    const result = await db.query(
      `SELECT c.id, c.nombre, c.edad, c.fatiga, c.carreras_totales, c.victorias,
              c.posicion_promedio, c.precio_venta, c.created_at,
              u.username AS dueno_username
       FROM caballos c
       JOIN usuarios u ON u.id = c.propietario_id
       WHERE c.en_venta = TRUE AND c.propietario_id IS NOT NULL
       ORDER BY c.precio_venta ASC`
    );
    return result.rows;
  },

  findOnSaleWithSearch: async (search, sort) => {
    let query = `
      SELECT c.id, c.nombre, c.edad, c.fatiga, c.carreras_totales, c.victorias,
             c.posicion_promedio, c.precio_venta, c.created_at,
             u.username AS dueno_username
      FROM caballos c
      JOIN usuarios u ON u.id = c.propietario_id
      WHERE c.en_venta = TRUE AND c.propietario_id IS NOT NULL
    `;
    const params = [];
    let paramIndex = 1;

    if (search && search.trim()) {
      query += ` AND c.nombre ILIKE $${paramIndex}`;
      params.push(`%${search.trim()}%`);
      paramIndex++;
    }

    switch (sort) {
      case 'price_desc':
        query += ' ORDER BY c.precio_venta DESC';
        break;
      case 'wins':
        query += ' ORDER BY c.victorias DESC';
        break;
      case 'price_asc':
      default:
        query += ' ORDER BY c.precio_venta ASC';
        break;
    }

    const result = await db.query(query, params);
    return result.rows;
  },

  updateName: async (id, nombre, propietario_id) => {
    const result = await db.query(
      `UPDATE caballos SET nombre = $1, updated_at = NOW()
       WHERE id = $2 AND propietario_id = $3
       RETURNING id, nombre`,
      [nombre, id, propietario_id]
    );
    return result.rows[0] || null;
  },

  setForSale: async (id, precio, propietario_id) => {
    const result = await db.query(
      `UPDATE caballos SET en_venta = TRUE, precio_venta = $1, updated_at = NOW()
       WHERE id = $2 AND propietario_id = $3 AND es_bot = FALSE
       RETURNING id, en_venta, precio_venta`,
      [precio, id, propietario_id]
    );
    return result.rows[0] || null;
  },

  removeFromSale: async (id, propietario_id) => {
    const result = await db.query(
      `UPDATE caballos SET en_venta = FALSE, precio_venta = NULL, updated_at = NOW()
       WHERE id = $1 AND propietario_id = $2
       RETURNING id`,
      [id, propietario_id]
    );
    return result.rows[0] || null;
  },

  transfer: async (id, newOwnerId, client) => {
    const q = client || db;
    const result = await q.query(
      `UPDATE caballos SET propietario_id = $1, en_venta = FALSE, precio_venta = NULL, updated_at = NOW()
       WHERE id = $2
       RETURNING id, propietario_id`,
      [newOwnerId, id]
    );
    return result.rows[0] || null;
  },

  delete: async (id, propietario_id) => {
    const result = await db.query(
      `DELETE FROM caballos WHERE id = $1 AND propietario_id = $2q
       RETURNING id`,
      [id, propietario_id]
    );
    return result.rows[0] || null;
  },

  getStatsForRace: async (id) => {
    const result = await db.query(
      'SELECT velocidad, resistencia, corazon FROM caballos WHERE id = $1',
      [id]
    );
    return result.rows[0] || null;
  },

  isInscribedInActiveRace: async (caballo_id) => {
    const result = await db.query(
      `SELECT i.id FROM inscripciones i
       JOIN carreras cr ON cr.id = i.carrera_id
       WHERE i.caballo_id = $1 AND cr.estado IN ('programada', 'en_curso')`,
      [caballo_id]
    );
    return result.rows.length > 0;
  },

  incrementStats: async (id, wins, races, avgPos, client) => {
    const q = client || db;
    await q.query(
      `UPDATE caballos SET
         carreras_totales = carreras_totales + $1,
         victorias = victorias + $2,
         posicion_promedio = CASE
           WHEN posicion_promedio IS NULL THEN $3
           ELSE ROUND((posicion_promedio * (carreras_totales) + $3) / (carreras_totales + 1), 2)
         END,
         fatiga = LEAST(fatiga + 15, 100),
         updated_at = NOW()
       WHERE id = $4`,
      [races, wins, avgPos, id]
    );
  },

  reduceFatigue: async (usuarioId) => {
    await db.query(
      `UPDATE caballos SET fatiga = GREATEST(fatiga - 10, 0), updated_at = NOW()
       WHERE propietario_id = $1 AND es_bot = FALSE`,
      [usuarioId]
    );
  },

  findBotHorsesForRace: async (excludeIds, limit) => {
    const result = await db.query(
      `SELECT id, nombre FROM caballos
       WHERE es_bot = TRUE AND id != ALL($1::int[])
       ORDER BY RANDOM()
       LIMIT $2`,
      [excludeIds, limit]
    );
    return result.rows;
  },
};

module.exports = Caballo;
