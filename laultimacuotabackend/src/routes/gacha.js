const { Router } = require('express');
const { pullHorse } = require('../controllers/gachaController');
const { authenticate } = require('../middleware/auth');

const router = Router();

router.post('/pull', authenticate, pullHorse);

module.exports = router;
