const { Router } = require('express');
const { getOnSale, buyHorse } = require('../controllers/marketController');
const { authenticate } = require('../middleware/auth');

const router = Router();

router.get('/', getOnSale);
router.post('/:id/buy', authenticate, buyHorse);

module.exports = router;
