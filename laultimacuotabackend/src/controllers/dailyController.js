const User = require('../models/User');
const Configuracion = require('../models/Configuracion');
const Transaccion = require('../models/Transaccion');
const db = require('../config/db');

const HOURS_24_MS = 24 * 60 * 60 * 1000;

const claimDaily = async (req, res) => {
  const client = await db.getClient();
  try {
    await client.query('BEGIN');

    const user = await User.findById(req.user.id);
    if (!user) {
      await client.query('ROLLBACK');
      return res.status(404).json({ success: false, error: 'Usuario no encontrado' });
    }

    const now = new Date();
    if (user.ultima_recompensa_diaria) {
      const lastClaim = new Date(user.ultima_recompensa_diaria);
      const diff = now.getTime() - lastClaim.getTime();
      if (diff < HOURS_24_MS) {
        const retryAfter = Math.ceil((HOURS_24_MS - diff) / 1000);
        await client.query('ROLLBACK');
        return res.status(409).json({
          success: false,
          error: 'Debes esperar 24 horas entre reclamos',
          retryAfter,
        });
      }
    }

    const amount = await Configuracion.getNumeric('daily_reward_amount');
    if (!amount || amount <= 0) {
      await client.query('ROLLBACK');
      return res.status(500).json({ success: false, error: 'Error en la configuracion del sistema' });
    }

    const updatedUser = await User.updateSaldo(req.user.id, amount, client);
    await User.updateDailyClaim(req.user.id, client);

    await Transaccion.create({
      usuario_id: req.user.id,
      tipo: 'moneda_diaria',
      monto: amount,
      saldo_resultante: updatedUser.saldo,
    }, client);

    await client.query('COMMIT');

    res.json({
      success: true,
      data: {
        monto: amount,
        saldo: updatedUser.saldo,
      },
    });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('[Daily] Claim error:', err.message);
    res.status(500).json({ success: false, error: 'Error interno del servidor' });
  } finally {
    client.release();
  }
};

const getStatus = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, error: 'Usuario no encontrado' });
    }

    const amount = await Configuracion.getNumeric('daily_reward_amount');
    const now = new Date();

    if (!user.ultima_recompensa_diaria) {
      return res.json({
        success: true,
        data: { available: true, retryAfter: 0, amount: amount || 500 },
      });
    }

    const lastClaim = new Date(user.ultima_recompensa_diaria);
    const diff = now.getTime() - lastClaim.getTime();

    if (diff >= HOURS_24_MS) {
      return res.json({
        success: true,
        data: { available: true, retryAfter: 0, amount: amount || 500 },
      });
    }

    const retryAfter = Math.ceil((HOURS_24_MS - diff) / 1000);
    res.json({
      success: true,
      data: { available: false, retryAfter, amount: amount || 500 },
    });
  } catch (err) {
    console.error('[Daily] Status error:', err.message);
    res.status(500).json({ success: false, error: 'Error interno del servidor' });
  }
};

module.exports = { claimDaily, getStatus };
