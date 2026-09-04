const { Router } = require('express');
const { getMyBets, getMyWins, getStats } = require('../controllers/historyController');
const { authenticate } = require('../middleware/auth');

const router = Router();

router.get('/bets', authenticate, getMyBets);
router.get('/wins', authenticate, getMyWins);
router.get('/stats', authenticate, getStats);

module.exports = router;
