const { Router } = require('express');
const { getAll, getById, inscription, placeBet, getOdds, getResults } = require('../controllers/raceController');
const { authenticate } = require('../middleware/auth');

const router = Router();

router.get('/', getAll);
router.get('/:id', getById);
router.get('/:id/odds', authenticate, getOdds);
router.get('/:id/results', authenticate, getResults);
router.post('/:id/inscribe', authenticate, inscription);
router.post('/:id/bet', authenticate, placeBet);

module.exports = router;
