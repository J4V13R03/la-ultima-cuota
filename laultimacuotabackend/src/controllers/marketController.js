const Caballo = require('../models/Caballo');
const User = require('../models/User');
const Transaccion = require('../models/Transaccion');
const db = require('../config/db');

const getOnSale = async (req, res) => {
  try {
    const { search, sort } = req.query;
    const horses = await Caballo.findOnSaleWithSearch(search, sort);
    res.json({ success: true, data: { horses } });
  } catch (err) {
    console.error('[Market] GetOnSale error:', err.message);
    res.status(500).json({ success: false, error: 'Error interno del servidor' });
  }
};

const buyHorse = async (req, res) => {
  const client = await db.getClient();
  try {
    await client.query('BEGIN');

    const { id } = req.params;
    const horse = await Caballo.findById(id);

    if (!horse) {
      await client.query('ROLLBACK');
      return res.status(404).json({ success: false, error: 'Caballo no encontrado' });
    }

    if (!horse.en_venta || !horse.precio_venta) {
      await client.query('ROLLBACK');
      return res.status(400).json({ success: false, error: 'Este caballo no está en venta' });
    }

    if (horse.propietario_id === req.user.id) {
      await client.query('ROLLBACK');
      return res.status(400).json({ success: false, error: 'No puedes comprar tu propio caballo' });
    }

    const saldoResult = await client.query('SELECT saldo FROM usuarios WHERE id = $1 FOR UPDATE', [req.user.id]);
    const buyerSaldo = saldoResult.rows[0]?.saldo;
    if (buyerSaldo === undefined || Number(buyerSaldo) < Number(horse.precio_venta)) {
      await client.query('ROLLBACK');
      return res.status(400).json({
        success: false,
        error: `Saldo insuficiente. Necesitas $${Number(horse.precio_venta).toLocaleString('es-CL')} CC`,
      });
    }

    const sellerId = horse.propietario_id;
    const price = Number(horse.precio_venta);

    const buyerUpdated = await User.updateSaldo(req.user.id, -price, client);
    const sellerUpdated = await User.updateSaldo(sellerId, price, client);

    await Caballo.transfer(id, req.user.id, client);

    await Transaccion.create({
      usuario_id: req.user.id,
      tipo: 'compra_caballo',
      monto: -price,
      saldo_resultante: buyerUpdated.saldo,
      referencia_tabla: 'caballos',
      referencia_id: id,
    }, client);

    await Transaccion.create({
      usuario_id: sellerId,
      tipo: 'venta_caballo',
      monto: price,
      saldo_resultante: sellerUpdated.saldo,
      referencia_tabla: 'caballos',
      referencia_id: id,
    }, client);

    await client.query('COMMIT');

    res.json({
      success: true,
      data: {
        message: 'Caballo comprado exitosamente',
        saldo: buyerUpdated.saldo,
      },
    });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('[Market] Buy error:', err.message);
    res.status(500).json({ success: false, error: 'Error interno del servidor' });
  } finally {
    client.release();
  }
};

module.exports = { getOnSale, buyHorse };
