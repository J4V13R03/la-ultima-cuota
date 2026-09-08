const db = require('../config/db');

const Configuracion = {
  get: async (clave, client) => {
    const q = client || db;
    const result = await q.query(
      'SELECT valor FROM configuracion WHERE clave = $1',
      [clave]
    );
    if (result.rows.length === 0) return null;
    return result.rows[0].valor;
  },

  getAll: async () => {
    const result = await db.query('SELECT clave, valor, descripcion FROM configuracion ORDER BY id ASC');
    return result.rows;
  },

  update: async (clave, valor) => {
    const result = await db.query(
      `UPDATE configuracion SET valor = $1, updated_at = NOW() WHERE clave = $2 RETURNING clave, valor`,
      [valor, clave]
    );
    return result.rows[0] || null;
  },

  getNumeric: async (clave, client) => {
    const val = await Configuracion.get(clave, client);
    return val !== null ? Number(val) : null;
  },
};

module.exports = Configuracion;
