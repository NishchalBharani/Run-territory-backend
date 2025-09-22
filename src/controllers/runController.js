const Run = require('../models/Run');
const { validationResult } = require('express-validator');
const { captureTerritories } = require('../utils/territoryUtils');

// Create a new run
exports.createRun = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  const { distance, path, startTime, endTime, calories, city } = req.body;

  try {
    // Create run in MongoDB
    Run.create({
      user: req.user.id,
      distance,
      path,
      startTime,
      endTime,
      calories
    }).then(run => {
      // Send response immediately
      res.status(201).json({ run });

      // Capture territories asynchronously (non-blocking)
      captureTerritories(req.user.id, city || 'Unknown', path)
        .catch(err => console.error('Territory capture failed:', err));
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get all runs of a user
exports.getMyRuns = async (req, res) => {
  try {
    const runs = await Run.find({ user: req.user.id }).sort({ startTime: -1 });
    res.json({ runs });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: 'Server error' });
  }
};
