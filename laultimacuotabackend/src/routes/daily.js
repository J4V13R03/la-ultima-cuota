const { Router } = require('express');
const { claimDaily, getStatus } = require('../controllers/dailyController');
const { authenticate } = require('../middleware/auth');

const router = Router();

router.get('/status', authenticate, getStatus);
router.post('/claim', authenticate, claimDaily);

module.exports = router;
