const express = require('express');
const router = express.Router();
const { geocodeAddress, reverseGeocode } = require('../services/geocoder');

// Recherche d'adresses (autocomplétion)
router.get('/search', async (req, res) => {
  try {
    const { query } = req.query;

    if (!query || query.trim().length < 3) {
      return res.json({
        success: false,
        error: 'Requête trop courte (minimum 3 caractères)'
      });
    }

    // Utiliser Nominatim pour la recherche
    const axios = require('axios');
    const NOMINATIM_BASE_URL = 'https://nominatim.openstreetmap.org';

    const params = {
      q: query,
      format: 'json',
      limit: 10,
      countrycodes: 'fr',
      addressdetails: 1,
      'accept-language': 'fr'
    };

    const response = await axios.get(`${NOMINATIM_BASE_URL}/search`, {
      params,
      headers: {
        'User-Agent': 'PetAlertFrance/1.0 (https://petalertefrance.fr; contact@petalertefrance.fr)',
        'Accept': 'application/json'
      },
      timeout: 10000
    });

    if (response.data && response.data.length > 0) {
      const suggestions = response.data.map(result => ({
        display_name: result.display_name,
        lat: parseFloat(result.lat),
        lon: parseFloat(result.lon),
        address: result.address
      }));

      res.json({
        success: true,
        suggestions
      });
    } else {
      res.json({
        success: false,
        suggestions: [],
        error: 'Aucune adresse trouvée'
      });
    }
  } catch (error) {
    console.error('Erreur lors de la recherche d\'adresses:', error);
    
    if (error.response?.status === 429) {
      return res.status(429).json({
        success: false,
        error: 'Trop de requêtes. Veuillez réessayer dans quelques secondes.'
      });
    }
    
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la recherche d\'adresses'
    });
  }
});

// Géocodage d'une adresse
router.post('/geocode', async (req, res) => {
  try {
    const { address } = req.body;

    if (!address || address.trim() === '') {
      return res.status(400).json({
        success: false,
        error: 'Adresse requise'
      });
    }

    const result = await geocodeAddress(address);

    if (result.success) {
      res.json({
        success: true,
        latitude: result.latitude,
        longitude: result.longitude,
        formattedAddress: result.formattedAddress,
        street: result.street,
        city: result.city,
        postalCode: result.postalCode,
        country: result.country
      });
    } else {
      res.status(404).json({
        success: false,
        error: result.error
      });
    }
  } catch (error) {
    console.error('Erreur lors du géocodage:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors du géocodage'
    });
  }
});

// Géocodage inverse (coordonnées vers adresse)
router.post('/reverse', async (req, res) => {
  try {
    const { latitude, longitude } = req.body;

    if (!latitude || !longitude) {
      return res.status(400).json({
        success: false,
        error: 'Latitude et longitude requises'
      });
    }

    const result = await reverseGeocode(latitude, longitude);

    if (result.success) {
      res.json({
        success: true,
        latitude: result.latitude,
        longitude: result.longitude,
        formattedAddress: result.formattedAddress,
        street: result.street,
        city: result.city,
        postalCode: result.postalCode,
        country: result.country
      });
    } else {
      res.status(404).json({
        success: false,
        error: result.error
      });
    }
  } catch (error) {
    console.error('Erreur lors du géocodage inverse:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors du géocodage inverse'
    });
  }
});

module.exports = router; 