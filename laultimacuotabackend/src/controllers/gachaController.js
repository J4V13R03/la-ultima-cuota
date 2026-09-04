const Caballo = require('../models/Caballo');
const User = require('../models/User');
const Configuracion = require('../models/Configuracion');
const Transaccion = require('../models/Transaccion');
const db = require('../config/db');

const CHILEAN_NAMES = [
  'Huasito', 'Cuequita', 'Chorito', 'Papayero', 'Lonca',
  'Ñusta', 'Paliacay', 'Quimey', 'Rucumán', 'Tilcara',
  'Boquerón', 'Caranquil', 'Desaguadero', 'Epuyen', 'Futaleufú',
  'Gualata', 'Hualpén', 'Icalma', 'Llanquihue', 'Maitencillo',
];

const pickRandomName = () => {
  const idx = Math.floor(Math.random() * CHILEAN_NAMES.length);
  return CHILEAN_NAMES[idx];
};

const pullHorse = async (req, res) => {
  const client = await db.getClient();
  try {
    await client.query('BEGIN');

    const gachaCost = await Configuracion.getNumeric('gacha_cost');
    if (!gachaCost || gachaCost <= 0) {
      await client.query('ROLLBACK');
      return res.status(500).json({ success: false, error: 'Error en la configuracion del sistema' });
    }

    const saldoResult = await client.query('SELECT saldo FROM usuarios WHERE id = $1 FOR UPDATE', [req.user.id]);
    const userSaldo = saldoResult.rows[0]?.saldo;
    if (userSaldo === undefined) {
      await client.query('ROLLBACK');
      return res.status(404).json({ success: false, error: 'Usuario no encontrado' });
    }

    if (Number(userSaldo) < gachaCost) {
      await client.query('ROLLBACK');
      return res.status(400).json({
        success: false,
        error: `Saldo insuficiente. Necesitas $${gachaCost.toLocaleString('es-CL')} CC, tienes $${Number(userSaldo).toLocaleString('es-CL')} CC`,
      });
    }

    const updatedUser = await User.updateSaldo(req.user.id, -gachaCost, client);

    const nombre = pickRandomName();
    const edad = Math.floor(Math.random() * 6) + 2;
    const velocidad = Math.floor(Math.random() * 101);
    const resistencia = Math.floor(Math.random() * 101);
    const corazon = Math.floor(Math.random() * 101);

    const horse = await Caballo.create({
      propietario_id: req.user.id,
      nombre,
      edad,
      velocidad,
      resistencia,
      corazon,
    });

    await Transaccion.create({
      usuario_id: req.user.id,
      tipo: 'compra_caballo',
      monto: -gachaCost,
      saldo_resultante: updatedUser.saldo,
      referencia_tabla: 'caballos',
      referencia_id: horse.id,
    }, client);

    await client.query('COMMIT');

    res.status(201).json({
      success: true,
      data: {
        caballo: {
          id: horse.id,
          nombre: horse.nombre,
          edad: horse.edad,
        },
        saldo: updatedUser.saldo,
      },
    });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('[Gacha] Pull error:', err.message);
    res.status(500).json({ success: false, error: 'Error interno del servidor' });
  } finally {
    client.release();
  }
};

module.exports = { pullHorse };
