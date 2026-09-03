const Race = require('../models/Race');

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

module.exports = { getAll, getById };
