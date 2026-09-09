/* eslint-disable no-unused-vars */

/**
 * @param {import('node-pg-migrate').MigrationBuilder} pgl
 */
exports.up = (pgl) => {
  pgl.createTable('configuracion', {
    id: 'SERIAL PRIMARY KEY',
    clave: 'VARCHAR(100) UNIQUE NOT NULL',
    valor: 'VARCHAR(255) NOT NULL',
    descripcion: 'TEXT',
    created_at: "TIMESTAMP DEFAULT NOW()",
    updated_at: "TIMESTAMP DEFAULT NOW()",
  });

  pgl.sql(`
    INSERT INTO configuracion (clave, valor, descripcion) VALUES
      ('daily_reward_amount', '500', 'Monto del reclamo diario en $CC'),
      ('gacha_cost', '300', 'Costo de una tirada gacha en $CC'),
      ('owner_commission_pct', '10', 'Porcentaje de comision al dueno del caballo ganador'),
      ('race_duration_seconds', '30', 'Duracion de la carrera simulada en segundos'),
      ('race_interval_minutes', '30', 'Intervalo de creacion automatica de carreras en minutos')
    ON CONFLICT (clave) DO NOTHING;
  `);
};

/**
 * @param {import('node-pg-migrate').MigrationBuilder} pgl
 */
exports.down = (pgl) => {
  pgl.dropTable('configuracion');
};
