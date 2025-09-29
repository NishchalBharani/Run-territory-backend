require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');
const authRoutes = require('./routes/auth');
const auth = require('./middleware/auth');
const runRoutes = require('./routes/runs');
const leaderboardRoutes = require('./routes/leaderboard');
const rewardRoutes = require('./routes/rewards');
const sosRoutes = require('./routes/sos');
const territoriesRoutes = require('./routes/territories');

// Connect to MongoDB
connectDB();

const app = express();

// Middleware
app.use(express.json());
app.use(cors());

// Test route
app.get('/api/protected', auth, (req, res) => {
    res.json({ message: `Hello user ${req.user.id}, you accessed a protected route!` });
  });
app.get('/', (req, res) => {
  res.json({ message: 'RunRaj backend is live!' });
});
//App Routes
app.use('/api/auth', authRoutes);
app.use('/api/runs', runRoutes);
app.use('/api/leaderboard', leaderboardRoutes);
app.use('/api/rewards', rewardRoutes);
app.use('/api/sos', sosRoutes);
app.use('/api/territories', territoriesRoutes);

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
