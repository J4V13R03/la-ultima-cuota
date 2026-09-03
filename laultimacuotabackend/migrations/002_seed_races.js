/* eslint-disable no-unused-vars */

/**
 * @param {import('node-pg-migrate').MigrationBuilder} pgl
 */
exports.up = (pgl) => {
  pgl.sql(`
    INSERT INTO carreras (nombre, estado, fecha_programada, cupo_maximo)
    VALUES
      ('Gran Premio del Valle', 'programada', NOW() + INTERVAL '3 days', 12),
      ('Copa Estrella del Sur', 'programada', NOW() + INTERVAL '5 days', 10),
      ('Desafío del Trueno', 'programada', NOW() + INTERVAL '8 days', 8),
      ('Trofeo Montaña Azul', 'programada', NOW() + INTERVAL '12 days', 12),
      ('Clásico Rio Negro', 'programada', NOW() + INTERVAL '15 days', 10),
      ('Carrera de la Victoria', 'en_curso', NOW() - INTERVAL '1 hour', 8),
      ('Gran Derby de Otoño', 'finalizada', NOW() - INTERVAL '2 days', 12),
      ('Copa Sol Naciente', 'programada', NOW() + INTERVAL '20 days', 10)
    ON CONFLICT DO NOTHING;
  `);
};

/**
 * @param {import('node-pg-migrate').MigrationBuilder} pgl
 */
exports.down = (pgl) => {
  pgl.sql(`DELETE FROM carreras WHERE nombre IN (
    'Gran Premio del Valle',
    'Copa Estrella del Sur',
    'Desafío del Trueno',
    'Trofeo Montaña Azul',
    'Clásico Rio Negro',
    'Carrera de la Victoria',
    'Gran Derby de Otoño',
    'Copa Sol Naciente'
  );`);
};
