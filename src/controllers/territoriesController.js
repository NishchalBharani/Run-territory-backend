// src/controllers/territoriesController.js
const Territory = require('../models/Territory');
const User = require('../models/User');
const { applyTerritoryDecay } = require('../utils/territoryUtils');

/**
 * Convert grid numeric indexes to bounding polygon.
 * Uses same grid steps as captureTerritories:
 * lat step = 0.009, lng step = 0.011
 */
const latStep = 0.009;
const lngStep = 0.011;

function gridToBounds(latGrid, lngGrid) {
    const south = latGrid * latStep;
    const west = lngGrid * lngStep;
    const north = south + latStep;
    const east = west + lngStep;

    return {
        south,
        west,
        north,
        east,
        polygon: [
            { latitude: south, longitude: west },
            { latitude: south, longitude: east },
            { latitude: north, longitude: east },
            { latitude: north, longitude: west }
        ]
    };
}

/**
 * Given a bounding box (minLat, maxLat, minLng, maxLng),
 * compute arrays of latGrid and lngGrid integers to cover the range.
 */
function computeGridRanges(minLat, maxLat, minLng, maxLng) {
    const latGridMin = Math.floor(minLat / latStep);
    const latGridMax = Math.floor(maxLat / latStep);
    const lngGridMin = Math.floor(minLng / lngStep);
    const lngGridMax = Math.floor(maxLng / lngStep);

    const gridIds = [];
    for (let lg = latGridMin; lg <= latGridMax; lg++) {
        for (let mg = lngGridMin; mg <= lngGridMax; mg++) {
            gridIds.push(`${lg}_${mg}`);
        }
    }
    return gridIds;
}

/**
 * GET /api/territories?city=Mumbai&minLat=...&maxLat=...&minLng=...&maxLng=...
 * Returns territories inside the bbox.
 */
exports.getTerritories = async (req, res) => {
    try {
        const city = req.query.city;
        if (!city) return res.status(400).json({ message: 'City is required' });

        // ✅ Apply decay first
        await applyTerritoryDecay(city);

        // parse bbox params, fallback to wide range if missing
        const minLat = parseFloat(req.query.minLat ?? '-90');
        const maxLat = parseFloat(req.query.maxLat ?? '90');
        const minLng = parseFloat(req.query.minLng ?? '-180');
        const maxLng = parseFloat(req.query.maxLng ?? '180');

        // Defensive: clamp values
        if (Number.isNaN(minLat) || Number.isNaN(maxLat) || Number.isNaN(minLng) || Number.isNaN(maxLng)) {
            return res.status(400).json({ message: 'Invalid bounding box parameters' });
        }

        // compute gridIds that overlap bbox
        const gridIds = computeGridRanges(minLat, maxLat, minLng, maxLng);

        // Add some dummy rival data for testing (only if no real territories exist)
        if (territories.length === 0) {
            const dummy = [
                {
                    gridId: "dummy1",
                    city,
                    coverage: 100,
                    lastCapturedAt: new Date(),
                    user: null,
                    ownerName: "Rival Clan",
                    polygon: [
                        { latitude: currentLat - 0.01, longitude: currentLng - 0.01 },
                        { latitude: currentLat - 0.01, longitude: currentLng + 0.01 },
                        { latitude: currentLat + 0.01, longitude: currentLng + 0.01 },
                        { latitude: currentLat + 0.01, longitude: currentLng - 0.01 },
                    ],
                    bbox: { south: currentLat - 0.01, west: currentLng - 0.01, north: currentLat + 0.01, east: currentLng + 0.01 },
                },
            ];
            return res.json({ territories: dummy });
        }

        // Query only those gridIds
        const territories = await Territory.find({
            city,
            gridId: { $in: gridIds }
        }).lean();

        // collect unique user ids to fetch owner names
        const ownerIds = [...new Set(territories.filter(t => t.user).map(t => t.user.toString()))];
        let usersMap = {};
        if (ownerIds.length > 0) {
            const users = await User.find({ _id: { $in: ownerIds } }, { name: 1 }).lean();
            usersMap = users.reduce((acc, u) => {
                acc[u._id.toString()] = { name: u.name };
                return acc;
            }, {});
        }

        // transform result to include polygon and bbox
        const result = territories.map(t => {
            const [latGridStr, lngGridStr] = t.gridId.split('_');
            const latGrid = parseInt(latGridStr, 10);
            const lngGrid = parseInt(lngGridStr, 10);
            const bounds = gridToBounds(latGrid, lngGrid);

            return {
                gridId: t.gridId,
                city: t.city,
                coverage: t.coverage,
                lastCapturedAt: t.lastCapturedAt,
                user: t.user ? t.user.toString() : null,
                ownerName: t.user ? (usersMap[t.user.toString()]?.name || null) : null,
                polygon: bounds.polygon,
                bbox: { south: bounds.south, west: bounds.west, north: bounds.north, east: bounds.east }
            };
        });

        return res.json({ territories: result });
    } catch (err) {
        console.error('territoriesController.getTerritories error:', err);
        return res.status(500).json({ message: 'Server error' });
    }
};

