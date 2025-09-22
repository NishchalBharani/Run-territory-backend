const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const rewardController = require('../controllers/rewardController');

router.get('/', auth, rewardController.getMyRewards);

module.exports = router;
