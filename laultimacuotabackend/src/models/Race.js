const db = require('../config/db');

const Race = {
  findAll: async (filters = {}) => {
    let query = `
      SELECT c.*,
        (SELECT COUNT(*) FROM inscripciones WHERE carrera_id = c.id) AS participantes_actuales
      FROM carreras c
    `;
    const params = [];

    if (filters.estado) {
      params.push(filters.estado);
      query += ' WHERE c.estado = $1';
    }

    query += ' ORDER BY c.fecha_programada ASC';
    const result = await db.query(query, params);
    return result.rows;
  },

  findById: async (id) => {
    const result = await db.query(
      `SELECT c.*,
        (SELECT COUNT(*) FROM inscripciones WHERE carrera_id = c.id) AS participantes_actuales
       FROM carreras c WHERE c.id = $1`,
      [id]
    );
    return result.rows[0] || null;
  },

  findInscriptions: async (raceId) => {
    const result = await db.query(
      `SELECT i.*, c.nombre AS caballo_nombre, c.edad, c.fatiga,
              c.carreras_totales, c.victorias, c.velocidad, c.resistencia, c.corazon, c.es_bot,
              u.username AS dueno_username
       FROM inscripciones i
       JOIN caballos c ON c.id = i.caballo_id
       LEFT JOIN usuarios u ON u.id = i.usuario_id
       WHERE i.carrera_id = $1
       ORDER BY i.numero_carril ASC NULLS LAST`,
      [raceId]
    );
    return result.rows;
  },

  create: async ({ nombre = null, fecha_programada, cupo_maximo = 12 }, client) => {
    const q = client || db;
    const result = await q.query(
      `INSERT INTO carreras (nombre, estado, fecha_programada, cupo_maximo)
       VALUES ($1, 'programada', $2, $3)
       RETURNING *`,
      [nombre, fecha_programada, cupo_maximo]
    );
    return result.rows[0];
  },

  updateEstado: async (id, estado, client) => {
    const q = client || db;
    const timestampField = estado === 'en_curso' ? 'fecha_inicio_real' : 'fecha_fin_real';
    const result = await q.query(
      `UPDATE carreras SET estado = $1, ${timestampField} = NOW(), updated_at = NOW()
       WHERE id = $2 RETURNING *`,
      [estado, id]
    );
    return result.rows[0] || null;
  },

  insertInscription: async ({ carrera_id, caballo_id, usuario_id, numero_carril }, client) => {
    const q = client || db;
    const result = await q.query(
      `INSERT INTO inscripciones (carrera_id, caballo_id, usuario_id, numero_carril)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [carrera_id, caballo_id, usuario_id, numero_carril]
    );
    return result.rows[0];
  },

  getOdds: async (raceId) => {
    const result = await db.query(
      `SELECT h.id, h.nombre, i.numero_carril, COALESCE(SUM(a.monto), 0) AS total_apuestas
       FROM inscripciones i
       JOIN caballos h ON h.id = i.caballo_id
       LEFT JOIN apuestas a ON a.caballo_id = h.id AND a.carrera_id = $1 AND a.estado = 'pendiente'
       WHERE i.carrera_id = $1
       GROUP BY h.id, h.nombre, i.numero_carril
       ORDER BY i.numero_carril ASC`,
      [raceId]
    );
    return result.rows;
  },

  getPendingBets: async (raceId) => {
    const result = await db.query(
      `SELECT a.*, u.username, h.nombre AS caballo_nombre
       FROM apuestas a
       LEFT JOIN usuarios u ON u.id = a.usuario_id
       JOIN caballos h ON h.id = a.caballo_id
       WHERE a.carrera_id = $1 AND a.estado = 'pendiente'`,
      [raceId]
    );
    return result.rows;
  },

  finishRace: async (raceId, results, client) => {
    const q = client || db;

    for (const r of results) {
      await q.query(
        `INSERT INTO resultados_carrera (carrera_id, caballo_id, posicion_final, tiempo_final)
         VALUES ($1, $2, $3, $4)`,
        [raceId, r.caballo_id, r.posicion, r.tiempo]
      );
    }
  },

  getResults: async (raceId) => {
    const result = await db.query(
      `SELECT rc.posicion_final, rc.tiempo_final,
              c.id AS caballo_id, c.nombre AS caballo_nombre,
              c.edad, c.fatiga, c.carreras_totales, c.victorias,
              u.username AS dueno_username
       FROM resultados_carrera rc
       JOIN caballos c ON c.id = rc.caballo_id
       LEFT JOIN usuarios u ON u.id = c.propietario_id
       WHERE rc.carrera_id = $1
       ORDER BY rc.posicion_final ASC`,
      [raceId]
    );
    return result.rows;
  },

  deleteRace: async (raceId, client) => {
    const q = client || db;
    await q.query(`DELETE FROM carreras WHERE id = $1`, [raceId]);
  },

  markHumanInteraction: async (raceId, client) => {
    const q = client || db;
    await q.query(
      `UPDATE carreras SET tiene_interaccion_humana = true, updated_at = NOW() WHERE id = $1`,
      [raceId]
    );
  },
};

module.exports = Race;
