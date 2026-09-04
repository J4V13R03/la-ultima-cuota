const Caballo = require('../models/Caballo');
const db = require('../config/db');

const getMyHorses = async (req, res) => {
  try {
    const horses = await Caballo.findByOwner(req.user.id);
    res.json({ success: true, data: { horses } });
  } catch (err) {
    console.error('[Stable] GetMyHorses error:', err.message);
    res.status(500).json({ success: false, error: 'Error interno del servidor' });
  }
};

const getHorseHistory = async (req, res) => {
  try {
    const { id } = req.params;
    const horse = await Caballo.findById(id);
    if (!horse || horse.propietario_id !== req.user.id) {
      return res.status(404).json({ success: false, error: 'Caballo no encontrado' });
    }

    const result = await db.query(
      `SELECT c.id AS carrera_id, c.nombre AS carrera_nombre, c.fecha_programada, c.estado,
              rc.posicion_final, rc.tiempo_final
       FROM inscripciones i
       JOIN carreras c ON c.id = i.carrera_id
       LEFT JOIN resultados_carrera rc ON rc.carrera_id = c.id AND rc.caballo_id = i.caballo_id
       WHERE i.caballo_id = $1
       ORDER BY c.fecha_programada DESC`,
      [id]
    );

    res.json({ success: true, data: { history: result.rows } });
  } catch (err) {
    console.error('[Stable] HorseHistory error:', err.message);
    res.status(500).json({ success: false, error: 'Error interno del servidor' });
  }
};

const renameHorse = async (req, res) => {
  try {
    const { id } = req.params;
    const { nombre } = req.body;

    if (!nombre || !nombre.trim()) {
      return res.status(400).json({ success: false, error: 'El nombre es obligatorio' });
    }

    if (nombre.trim().length > 100) {
      return res.status(400).json({ success: false, error: 'El nombre no puede exceder 100 caracteres' });
    }

    const updated = await Caballo.updateName(id, nombre.trim(), req.user.id);
    if (!updated) {
      return res.status(404).json({ success: false, error: 'Caballo no encontrado' });
    }

    res.json({ success: true, data: { caballo: updated } });
  } catch (err) {
    console.error('[Stable] Rename error:', err.message);
    res.status(500).json({ success: false, error: 'Error interno del servidor' });
  }
};

const deleteHorse = async (req, res) => {
  try {
    const { id } = req.params;
    const horse = await Caballo.findById(id);

    if (!horse || horse.propietario_id !== req.user.id) {
      return res.status(404).json({ success: false, error: 'Caballo no encontrado' });
    }

    const inActiveRace = await Caballo.isInscribedInActiveRace(id);
    if (inActiveRace) {
      return res.status(400).json({
        success: false,
        error: 'No puedes eliminar un caballo inscrito en una carrera activa',
      });
    }

    await Caballo.delete(id, req.user.id);
    res.json({ success: true, data: { message: 'Caballo eliminado del establo' } });
  } catch (err) {
    console.error('[Stable] Delete error:', err.message);
    res.status(500).json({ success: false, error: 'Error interno del servidor' });
  }
};

const putForSale = async (req, res) => {
  try {
    const { id } = req.params;
    const { precio } = req.body;

    if (!precio || Number(precio) <= 0) {
      return res.status(400).json({ success: false, error: 'El precio debe ser mayor a 0' });
    }

    const horse = await Caballo.findById(id);
    if (!horse || horse.propietario_id !== req.user.id) {
      return res.status(404).json({ success: false, error: 'Caballo no encontrado' });
    }

    if (horse.es_bot) {
      return res.status(400).json({ success: false, error: 'Los caballos bot no se pueden vender' });
    }

    const inActiveRace = await Caballo.isInscribedInActiveRace(id);
    if (inActiveRace) {
      return res.status(400).json({
        success: false,
        error: 'No puedes vender un caballo inscrito en una carrera activa',
      });
    }

    const updated = await Caballo.setForSale(id, Number(precio), req.user.id);
    res.json({ success: true, data: { caballo: updated } });
  } catch (err) {
    console.error('[Stable] PutForSale error:', err.message);
    res.status(500).json({ success: false, error: 'Error interno del servidor' });
  }
};

const removeFromSale = async (req, res) => {
  try {
    const { id } = req.params;
    const updated = await Caballo.removeFromSale(id, req.user.id);
    if (!updated) {
      return res.status(404).json({ success: false, error: 'Caballo no encontrado' });
    }
    res.json({ success: true, data: { message: 'Caballo removido de la venta' } });
  } catch (err) {
    console.error('[Stable] RemoveFromSale error:', err.message);
    res.status(500).json({ success: false, error: 'Error interno del servidor' });
  }
};

module.exports = {
  getMyHorses,
  getHorseHistory,
  renameHorse,
  deleteHorse,
  putForSale,
  removeFromSale,
};
