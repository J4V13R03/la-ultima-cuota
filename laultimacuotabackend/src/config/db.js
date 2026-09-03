const { Pool } = require('pg');

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432', 10),
  user: process.env.DB_USER || 'horseadmin',
  password: process.env.DB_PASSWORD || 'horsepass123',
  database: process.env.DB_NAME || 'horse_betting',
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
});

pool.on('error', (err) => {
  console.error('[DB] Error inesperado en cliente idle:', err.message);
});

const testConnection = async () => {
  try {
    const client = await pool.connect();
    console.log('[DB] Conexión a PostgreSQL establecida correctamente');
    client.release();
  } catch (err) {
    console.error('[DB] No se pudo conectar a PostgreSQL:', err.message);
    process.exit(1);
  }
};

module.exports = {
  query: (text, params) => pool.query(text, params),
  getClient: () => pool.connect(),
  pool,
  testConnection,
};
