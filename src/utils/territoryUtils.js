const Territory = require('../models/Territory');
const Reward = require('../models/Reward');

const DECAY_DAYS = 7;        // start decaying after 7 days
const DECAY_RATE = 10;       // % per day

/**
 * Apply decay to all territories for a city
 */
const applyTerritoryDecay = async (city) => {
  const DECAY_PERCENT = 20; // Reduce coverage by 20%
  const now = new Date();
  const threshold = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000); // 7 days ago

  // Find territories to decay
  const territories = await Territory.find({
    city,
    lastCapturedAt: { $lt: threshold },
    coverage: { $gt: 0 },
  });

  const bulkOps = territories.map(t => {
    const newCoverage = Math.max(0, t.coverage - DECAY_PERCENT);
    return {
      updateOne: {
        filter: { _id: t._id },
        update: { coverage: newCoverage, user: newCoverage === 0 ? null : t.user },
      },
    };
  });

  if (bulkOps.length > 0) {
    await Territory.bulkWrite(bulkOps);
    console.log(`Territory decay applied for city ${city}: ${bulkOps.length} territories updated.`);
  }
};

/**
 * Capture or update territories based on run path
 */
const captureTerritories = async (userId, city, path) => {
  if (!path || path.length === 0) return;

  const gridPointsMap = {};
  const MAX_POINTS = 5;

  path.forEach(point => {
    const latGrid = Math.floor(point.lat / 0.009);
    const lngGrid = Math.floor(point.lng / 0.011);
    const gridId = `${latGrid}_${lngGrid}`;
    gridPointsMap[gridId] = (gridPointsMap[gridId] || 0) + 1;
  });

  const bulkOps = Object.keys(gridPointsMap).map(gridId => {
    const coverage = Math.min(100, (gridPointsMap[gridId] / MAX_POINTS) * 100);

    return {
      updateOne: {
        filter: { city, gridId },
        update: {
          $setOnInsert: { user: null },
          $max: { coverage },
          $set: { lastCapturedAt: new Date() }
        },
        upsert: true
      }
    };
  });

  if (bulkOps.length > 0) {
    await Territory.bulkWrite(bulkOps);

    // Assign ownership & award Raj Points
    for (const gridId of Object.keys(gridPointsMap)) {
      const coverage = Math.min(100, (gridPointsMap[gridId] / MAX_POINTS) * 100);
      if (coverage >= 80) {
        const territory = await Territory.findOneAndUpdate(
          { city, gridId },
          { user: userId, coverage, lastCapturedAt: new Date() },
          { new: true }
        );

        if (territory) {
          await Reward.findOneAndUpdate(
            { user: userId },
            {
              $inc: { points: 10 },
              $push: { history: { type: 'capture', amount: 10 } },
              $set: { lastUpdated: new Date() }
            },
            { upsert: true }
          );
        }
      }
    }
  }
};

module.exports = { captureTerritories, applyTerritoryDecay };
