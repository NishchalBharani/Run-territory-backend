const mongoose = require('mongoose');

const TerritorySchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  city: { type: String, required: true },
  gridId: { type: String, required: true }, // unique 1km² identifier
  coverage: { type: Number, default: 0 }, // 0-100%
  lastCapturedAt: { type: Date, default: Date.now }
});

TerritorySchema.index({ city: 1, gridId: 1 }, { unique: true }); // ensures fast upserts
TerritorySchema.index({ city: 1, user: 1 }); // fast aggregation for leaderboard
TerritorySchema.index({ user: 1 }); 

module.exports = mongoose.model('Territory', TerritorySchema);
