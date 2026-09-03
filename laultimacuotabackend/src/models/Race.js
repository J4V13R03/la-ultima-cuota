const db = require('../config/db');

const Race = {
  findAll: async (filters = {}) => {
    let query = 'SELECT * FROM carreras';
    const params = [];

    if (filters.estado) {
      params.push(filters.estado);
      query += ' WHERE estado = $1';
    }

    query += ' ORDER BY fecha_programada ASC';
    const result = await db.query(query, params);
    return result.rows;
  },

  findById: async (id) => {
    const result = await db.query('SELECT * FROM carreras WHERE id = $1', [id]);
    return result.rows[0] || null;
  },

  findInscriptions: async (raceId) => {
    const result = await db.query(
      `SELECT i.*, c.nombre AS caballo_nombre, c.edad, c.velocidad, c.resistencia, c.corazon,
              u.username AS dueno_username
       FROM inscripciones i
       JOIN caballos c ON c.id = i.caballo_id
       JOIN usuarios u ON u.id = i.usuario_id
       WHERE i.carrera_id = $1
       ORDER BY i.numero_carril ASC NULLS LAST`,
      [raceId]
    );
    return result.rows;
  },
};

module.exports = Race;
