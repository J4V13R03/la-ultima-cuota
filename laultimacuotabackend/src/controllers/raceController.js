const Race = require('../models/Race');
const Caballo = require('../models/Caballo');
const User = require('../models/User');
const Transaccion = require('../models/Transaccion');
const db = require('../config/db');

const getAll = async (req, res) => {
  try {
    const { estado } = req.query;
    const races = await Race.findAll(estado ? { estado } : {});
    res.json({ success: true, data: { races } });
  } catch (err) {
    console.error('[Race] GetAll error:', err.message);
    res.status(500).json({ success: false, error: 'Error interno del servidor' });
  }
};

const getById = async (req, res) => {
  try {
    const { id } = req.params;
    const race = await Race.findById(id);

    if (!race) {
      return res.status(404).json({ success: false, error: 'Carrera no encontrada' });
    }

    race.inscripciones = await Race.findInscriptions(id);
    res.json({ success: true, data: { race } });
  } catch (err) {
    console.error('[Race] GetById error:', err.message);
    res.status(500).json({ success: false, error: 'Error interno del servidor' });
  }
};

const inscription = async (req, res) => {
  const client = await db.getClient();
  try {
    await client.query('BEGIN');

    const { id } = req.params;
    const { caballo_id } = req.body;

    if (!caballo_id) {
      await client.query('ROLLBACK');
      return res.status(400).json({ success: false, error: 'Debes seleccionar un caballo' });
    }

    const race = await Race.findById(id);
    if (!race) {
      await client.query('ROLLBACK');
      return res.status(404).json({ success: false, error: 'Carrera no encontrada' });
    }

    if (race.estado !== 'programada') {
      await client.query('ROLLBACK');
      return res.status(400).json({ success: false, error: 'Solo puedes inscribirte en carreras programadas' });
    }

    if (race.participantes_actuales >= race.cupo_maximo) {
      await client.query('ROLLBACK');
      return res.status(400).json({ success: false, error: 'La carrera está llena' });
    }

    const horse = await Caballo.findById(caballo_id);
    if (!horse || horse.propietario_id !== req.user.id) {
      await client.query('ROLLBACK');
      return res.status(404).json({ success: false, error: 'Caballo no encontrado en tu establo' });
    }

    if (horse.fatiga >= 80) {
      await client.query('ROLLBACK');
      return res.status(400).json({ success: false, error: 'El caballo está demasiado fatigado para competir' });
    }

    const inscriptions = await Race.findInscriptions(id);
    const alreadyInscribed = inscriptions.some((i) => i.caballo_id === Number(caballo_id));
    if (alreadyInscribed) {
      await client.query('ROLLBACK');
      return res.status(400).json({ success: false, error: 'Este caballo ya está inscrito en esta carrera' });
    }

    const maxResult = await client.query(
      'SELECT COALESCE(MAX(numero_carril), 0) + 1 AS next_lane FROM inscripciones WHERE carrera_id = $1',
      [id]
    );
    const numero_carril = maxResult.rows[0].next_lane;

    await Race.insertInscription({
      carrera_id: id,
      caballo_id: Number(caballo_id),
      usuario_id: req.user.id,
      numero_carril,
    }, client);

    await Race.markHumanInteraction(id, client);

    await client.query('COMMIT');

    res.status(201).json({
      success: true,
      data: { message: 'Inscripción exitosa', numero_carril },
    });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('[Race] Inscription error:', err.message);
    res.status(500).json({ success: false, error: 'Error interno del servidor' });
  } finally {
    client.release();
  }
};

const placeBet = async (req, res) => {
  const client = await db.getClient();
  try {
    await client.query('BEGIN');

    const { id } = req.params;
    const { caballo_id, monto } = req.body;

    if (!caballo_id || !monto || Number(monto) <= 0) {
      await client.query('ROLLBACK');
      return res.status(400).json({ success: false, error: 'Datos de apuesta inválidos' });
    }

    const race = await Race.findById(id);
    if (!race) {
      await client.query('ROLLBACK');
      return res.status(404).json({ success: false, error: 'Carrera no encontrada' });
    }

    if (race.estado !== 'programada') {
      await client.query('ROLLBACK');
      return res.status(400).json({ success: false, error: 'Solo puedes apostar en carreras programadas' });
    }

    const inscriptions = await Race.findInscriptions(id);
    const horseInscribed = inscriptions.some((i) => i.caballo_id === Number(caballo_id));
    if (!horseInscribed) {
      await client.query('ROLLBACK');
      return res.status(400).json({ success: false, error: 'El caballo no está inscrito en esta carrera' });
    }

    const saldoResult = await client.query('SELECT saldo FROM usuarios WHERE id = $1 FOR UPDATE', [req.user.id]);
    const userSaldo = saldoResult.rows[0]?.saldo;
    if (userSaldo === undefined || Number(userSaldo) < Number(monto)) {
      await client.query('ROLLBACK');
      return res.status(400).json({ success: false, error: 'Saldo insuficiente para esta apuesta' });
    }

    const allBets = await db.query(
      `SELECT caballo_id, SUM(monto) AS total
       FROM apuestas WHERE carrera_id = $1 AND estado = 'pendiente'
       GROUP BY caballo_id`,
      [id]
    );

    const betTotals = {};
    allBets.rows.forEach((row) => {
      betTotals[row.caballo_id] = Number(row.total);
    });

    betTotals[caballo_id] = (betTotals[caballo_id] || 0) + Number(monto);
    const poolTotal = Object.values(betTotals).reduce((sum, v) => sum + v, 0);
    const horsePool = betTotals[caballo_id];
    const cuota = horsePool > 0 ? (poolTotal / horsePool).toFixed(2) : '1.00';

    const updatedUser = await User.updateSaldo(req.user.id, -Number(monto), client);

    await client.query(
      `INSERT INTO apuestas (usuario_id, carrera_id, caballo_id, monto, cuota, estado)
       VALUES ($1, $2, $3, $4, $5, 'pendiente')`,
      [req.user.id, id, caballo_id, Number(monto), cuota]
    );

    await Transaccion.create({
      usuario_id: req.user.id,
      tipo: 'apuesta_realizada',
      monto: -Number(monto),
      saldo_resultante: updatedUser.saldo,
      referencia_tabla: 'carreras',
      referencia_id: Number(id),
    }, client);

    await Race.markHumanInteraction(id, client);

    await client.query('COMMIT');

    res.status(201).json({
      success: true,
      data: {
        cuota: Number(cuota),
        monto: Number(monto),
        saldo: updatedUser.saldo,
      },
    });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('[Race] PlaceBet error:', err.message);
    res.status(500).json({ success: false, error: 'Error interno del servidor' });
  } finally {
    client.release();
  }
};

const getOdds = async (req, res) => {
  try {
    const { id } = req.params;
    const odds = await Race.getOdds(id);

    const totalPool = odds.reduce((sum, o) => sum + Number(o.total_apuestas), 0);

    const result = odds.map((o) => ({
      caballo_id: o.id,
      nombre: o.nombre,
      total_apuestas: Number(o.total_apuestas),
      cuota: Number(o.total_apuestas) > 0
        ? (totalPool / Number(o.total_apuestas)).toFixed(2)
        : '1.00',
    }));

    res.json({ success: true, data: { odds: result, pool_total: totalPool } });
  } catch (err) {
    console.error('[Race] GetOdds error:', err.message);
    res.status(500).json({ success: false, error: 'Error interno del servidor' });
  }
};

const getResults = async (req, res) => {
  try {
    const { id } = req.params;
    const race = await Race.findById(id);

    if (!race) {
      return res.status(404).json({ success: false, error: 'Carrera no encontrada' });
    }

    if (race.estado !== 'finalizada') {
      return res.status(400).json({ success: false, error: 'La carrera aún no ha finalizado' });
    }

    const results = await Race.getResults(id);
    res.json({ success: true, data: { results } });
  } catch (err) {
    console.error('[Race] GetResults error:', err.message);
    res.status(500).json({ success: false, error: 'Error interno del servidor' });
  }
};

module.exports = { getAll, getById, inscription, placeBet, getOdds, getResults };
