/* eslint-disable no-unused-vars */

/**
 * @param {import('node-pg-migrate').MigrationBuilder} pgl
 */
exports.up = (pgl) => {
  pgl.sql(`ALTER TABLE transacciones_saldo DROP CONSTRAINT transacciones_saldo_tipo_check;`);
  pgl.sql(`ALTER TABLE transacciones_saldo ADD CONSTRAINT transacciones_saldo_tipo_check
    CHECK (tipo IN ('compra_caballo','venta_caballo','apuesta_realizada','apuesta_ganada','moneda_diaria','ajuste_admin','comision_dueno'));`);
};

/**
 * @param {import('node-pg-migrate').MigrationBuilder} pgl
 */
exports.down = (pgl) => {
  pgl.sql(`ALTER TABLE transacciones_saldo DROP CONSTRAINT transacciones_saldo_tipo_check;`);
  pgl.sql(`ALTER TABLE transacciones_saldo ADD CONSTRAINT transacciones_saldo_tipo_check
    CHECK (tipo IN ('compra_caballo','venta_caballo','apuesta_realizada','apuesta_ganada','moneda_diaria','ajuste_admin'));`);
};
