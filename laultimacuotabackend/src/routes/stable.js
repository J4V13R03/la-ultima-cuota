const { Router } = require('express');
const {
  getMyHorses,
  getHorseHistory,
  renameHorse,
  deleteHorse,
  putForSale,
  removeFromSale,
} = require('../controllers/stableController');
const { authenticate } = require('../middleware/auth');

const router = Router();

router.get('/', authenticate, getMyHorses);
router.get('/:id/history', authenticate, getHorseHistory);
router.patch('/:id/rename', authenticate, renameHorse);
router.delete('/:id', authenticate, deleteHorse);
router.patch('/:id/sell', authenticate, putForSale);
router.patch('/:id/unsell', authenticate, removeFromSale);

module.exports = router;
