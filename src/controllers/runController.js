const Run = require('../models/Run');
const { validationResult } = require('express-validator');
const { captureTerritories, applyTerritoryDecay } = require('../utils/territoryUtils');

// Create a new run
exports.createRun = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  const { distance, path, startTime, endTime, calories, city } = req.body;

  try {
    const run = await Run.create({
      user: req.user.id,
      distance,
      path,
      startTime,
      endTime,
      calories
    });

    // Respond immediately
    res.status(201).json({ run });

    // Async operations: territory capture + decay
    captureTerritories(req.user.id, city || 'Unknown', path)
      .catch(err => console.error('Territory capture failed:', err));

    // Apply decay asynchronously
    applyTerritoryDecay(city || 'Unknown')
      .catch(err => console.error('Territory decay failed:', err));

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
