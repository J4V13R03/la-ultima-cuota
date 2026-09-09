/* eslint-disable no-unused-vars */

/**
 * @param {import('node-pg-migrate').MigrationBuilder} pgl
 */
exports.up = (pgl) => {
  pgl.sql(`ALTER TABLE caballos ADD COLUMN IF NOT EXISTS es_bot BOOLEAN DEFAULT FALSE;`);

  pgl.sql(`
    INSERT INTO caballos (nombre, edad, velocidad, resistencia, corazon, es_bot) VALUES
      ('Huaso del Sur', 4, 72, 65, 58, true),
      ('Poncho Rojo', 3, 55, 78, 62, true),
      ('Chacarero Veloz', 5, 81, 45, 70, true),
      ('Diablo del Ranco', 6, 68, 72, 55, true),
      ('Puma Andino', 3, 75, 60, 80, true),
      ('Condor de la Frontera', 7, 60, 85, 50, true),
      ('Machaqmara', 4, 70, 55, 75, true),
      ('Trauco Legendario', 5, 82, 68, 42, true),
      ('Boroniol del Bosque', 3, 50, 70, 85, true),
      ('Chiflon del Norte', 6, 78, 62, 58, true),
      ('Trentrenlevu', 4, 65, 80, 48, true),
      ('Pinen el Indomable', 5, 73, 52, 77, true),
      ('Lonco Pilcha', 3, 58, 75, 65, true),
      ('Caluquin Relampago', 7, 85, 48, 60, true),
      ('Nizca del Valle', 4, 62, 70, 72, true),
      ('Cheuque el Veloz', 5, 77, 58, 68, true),
      ('Pillan de Fuego', 6, 68, 82, 45, true),
      ('Huechun Misterioso', 3, 55, 65, 80, true),
      ('Tralka del Cielo', 4, 80, 55, 62, true),
      ('Ruetru Tormenta', 5, 63, 78, 57, true)
    ON CONFLICT DO NOTHING;
  `);
};

/**
 * @param {import('node-pg-migrate').MigrationBuilder} pgl
 */
exports.down = (pgl) => {
  pgl.sql(`DELETE FROM caballos WHERE es_bot = TRUE;`);
  pgl.sql(`ALTER TABLE caballos DROP COLUMN IF EXISTS es_bot;`);
};
