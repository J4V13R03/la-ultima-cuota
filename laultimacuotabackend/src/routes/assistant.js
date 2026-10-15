const { Router } = require('express');
const { chatWithAssistant } = require('../controllers/assistantController');
const { authenticate } = require('../middleware/auth');

const router = Router();

router.post('/chat', authenticate, chatWithAssistant);

module.exports = router;
