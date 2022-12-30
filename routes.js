const express = require('express');
const router = express.Router();

const dbOperations = require('./db/db-operations');

router.get('/student.html', (req, res) => {
    res.render('student.html', {
        userId: req.query.userId
    });
});

router.get('/cops.html', (req, res) => {
    res.render('cops.html', {
        userId: req.query.userId
    });
});

router.get('/cops', async (req, res) => {
    /*
        Get latitude and longitude info from request and find nearest cops using MongoDB's geospatial queries
    */
    const latitude = Number(req.query.lat);
    const longitude = Number(req.query.lng);
    const nearestCops = await dbOperations.fetchNearestCops([longitude, latitude], 2000);

    res.json({
        cops: nearestCops
    });
});

router.get('/cops/info', async (req, res) => {
    const userId = req.query.userId // xtract userId from query params
    const copDetails = await dbOperations.fetchCopDetails(userId);

    res.json({
        copDetails: copDetails
    });
});

// fetch all requests
router.get('/requests/info', async (req, res) => {
    const results = await dbOperations.fetchRequests();
    const features = [];

    for (let i = 0; i < results.length; i++) {
        features.push({
            type: 'Feature',
            geometry: {
                type: 'Point',
                coordinates: results[i].location.coordinates
            },
            properties: {
                status: results[i].status,
                requestTime: results[i].requestTime,
                address: results[i].location.address
            }
        });
    }

    const geoJsonData = {
        type: 'FeatureCollection',
        features: features
    }

    res.json(geoJsonData);
});

module.exports = router;
