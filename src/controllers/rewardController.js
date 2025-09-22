const Reward = require('../models/Reward');

// Get current user’s points and history
exports.getMyRewards = async (req, res) => {
  try {
    const rewards = await Reward.findOne({ user: req.user.id });
    res.json(rewards || { points: 0, history: [] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};
