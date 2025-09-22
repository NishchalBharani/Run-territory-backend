const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const sosController = require('../controllers/sosController');

router.post('/', auth, sosController.sendSOS);

module.exports = router;
