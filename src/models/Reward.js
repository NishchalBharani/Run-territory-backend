const mongoose = require('mongoose');

const RewardSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  points: { type: Number, default: 0 },
  history: [
    {
      type: { type: String, enum: ['capture', 'redeem'], required: true },
      amount: { type: Number, required: true },
      timestamp: { type: Date, default: Date.now }
    }
  ],
  lastUpdated: { type: Date, default: Date.now }
});

RewardSchema.index({ user: 1 });

module.exports = mongoose.model('Reward', RewardSchema);
