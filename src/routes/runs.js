const express = require('express');
const { body } = require('express-validator');
const router = express.Router();
const auth = require('../middleware/auth');
const runController = require('../controllers/runController');

// Create run
router.post(
  '/',
  auth,
  [
    body('distance').isNumeric().withMessage('Distance required'),
    body('path').isArray({ min: 1 }).withMessage('Path required'),
    body('startTime').notEmpty(),
    body('endTime').notEmpty()
  ],
  runController.createRun
);

// Get all runs of the logged-in user
router.get('/', auth, runController.getMyRuns);

// POST /api/runs/batch
router.post('/batch', auth, async (req, res) => {
    const runs = req.body.runs; // array of run objects
  
    if (!runs || !Array.isArray(runs) || runs.length === 0)
      return res.status(400).json({ message: 'Runs array is required' });
  
    try {
      const createdRuns = await Promise.all(
        runs.map(async runData => {
          const { distance, path, startTime, endTime, calories, city } = runData;
          const run = await Run.create({
            user: req.user.id,
            distance,
            path,
            startTime,
            endTime,
            calories
          });
  
          // Capture territories asynchronously (non-blocking)
          captureTerritories(req.user.id, city || 'Unknown', path)
            .catch(err => console.error('Territory capture failed:', err));
  
          return run;
        })
      );
  
      res.status(201).json({ runs: createdRuns });
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: 'Server error' });
    }
  });
  

module.exports = router;
