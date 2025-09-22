const express = require('express');

// POST /api/sos
exports.sendSOS = async (req, res) => {
  const { lat, lng, message } = req.body;

  if (!lat || !lng) return res.status(400).json({ message: 'Coordinates required' });

  try {
    // For MVP: log SOS to DB or console (later integrate with police API)
    console.log(`🚨 SOS from user ${req.user.id} at [${lat},${lng}] - ${message || 'No message'}`);

    // TODO: Integrate with Indian emergency services API or SMS gateway
    res.json({ message: 'SOS alert sent successfully!' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};
