// src/routes/territories.js
const express = require('express');
const router = express.Router();
const territoriesController = require('../controllers/territoriesController');
// Public read endpoint (no auth required). If you want to require auth, add your auth middleware.
router.get('/', territoriesController.getTerritories);
module.exports = router;
