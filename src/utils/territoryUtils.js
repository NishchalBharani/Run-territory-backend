const Territory = require('../models/Territory');
const Reward = require('../models/Reward');

/**
 * Converts a latitude/longitude point to a unique 1km² grid ID
 */
const getGridId = (lat, lng) => {
  const latGrid = Math.floor(lat / 0.009);
  const lngGrid = Math.floor(lng / 0.011);
  return `${latGrid}_${lngGrid}`;
};

/**
 * Capture territories based on run path
 */
const captureTerritories = async (userId, city, path) => {
  if (!path || path.length === 0) return;

  // Map gridId => number of points touched
  const gridPointsMap = {};
  path.forEach(point => {
    const gridId = getGridId(point.lat, point.lng);
    gridPointsMap[gridId] = (gridPointsMap[gridId] || 0) + 1;
  });

  // MAX_POINTS per grid to calculate coverage
  const MAX_POINTS = 5;

  // ✅ Bulk operations go here
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
        await Territory.findOneAndUpdate(
          { city, gridId },
          { user: userId, coverage, lastCapturedAt: new Date() },
          { new: true }
        );

        // Award Raj Points
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
};

module.exports = { captureTerritories };
