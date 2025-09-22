const mongoose = require('mongoose');

const RunSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  distance: { type: Number, required: true }, // in kilometers
  path: [
    {
      lat: { type: Number, required: true },
      lng: { type: Number, required: true },
      timestamp: { type: Date, default: Date.now }
    }
  ],
  startTime: { type: Date, required: true },
  endTime: { type: Date, required: true },
  calories: { type: Number },
  createdAt: { type: Date, default: Date.now }
});

RunSchema.index({ user: 1, startTime: -1 }); 

module.exports = mongoose.model('Run', RunSchema);
