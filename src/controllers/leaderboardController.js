
exports.getLeaderboard = async (req, res) => {
  try {
    const city = req.query.city;
    if (!city) return res.status(400).json({ message: 'City is required' });

    // Check cache first
    const cached = await redisClient.get(`leaderboard:${city}`);
    if (cached) return res.json({ leaderboard: JSON.parse(cached) });

    const leaderboard = await Territory.aggregate([
      { $match: { city, user: { $ne: null } } },
      { $group: { _id: '$user', territories: { $sum: 1 } } },
      { $sort: { territories: -1 } },
      { $limit: 10 },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'userInfo'
        }
      },
      { $unwind: '$userInfo' },
      {
        $project: {
          _id: 0,
          userId: '$userInfo._id',
          name: '$userInfo.name',
          city: '$userInfo.city',
          territories: 1
        }
      }
    ]);

    res.json({ leaderboard });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: 'Server error' });
  }
};
