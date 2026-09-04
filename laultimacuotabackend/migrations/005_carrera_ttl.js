/* eslint-disable no-unused-vars */

/**
 * @param {import('node-pg-migrate').MigrationBuilder} pgl
 */
exports.up = (pgl) => {
  pgl.sql(`ALTER TABLE carreras ADD COLUMN tiene_interaccion_humana BOOLEAN DEFAULT FALSE NOT NULL;`);
  pgl.sql(`ALTER TABLE carreras ALTER COLUMN nombre DROP NOT NULL;`);
};

/**
 * @param {import('node-pg-migrate').MigrationBuilder} pgl
 */
exports.down = (pgl) => {
  pgl.sql(`UPDATE carreras SET nombre = 'Carrera #' || id WHERE nombre IS NULL;`);
  pgl.sql(`ALTER TABLE carreras ALTER COLUMN nombre SET NOT NULL;`);
  pgl.sql(`ALTER TABLE carreras DROP COLUMN tiene_interaccion_humana;`);
};
