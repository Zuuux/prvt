const axios = require('axios');

// Configuration pour l'API Nominatim (OpenStreetMap)
const NOMINATIM_BASE_URL = 'https://nominatim.openstreetmap.org';

// Fonction pour géocoder une adresse avec Nominatim
const geocodeAddress = async (address) => {
  try {
    if (!address || address.trim() === '') {
      return { success: false, error: 'Adresse vide' };
    }

    // Paramètres pour l'API Nominatim
    const params = {
      q: address,
      format: 'json',
      limit: 5,
      countrycodes: 'fr', // Limiter à la France
      addressdetails: 1,
      'accept-language': 'fr'
    };

    // Ajouter un délai pour respecter les limites de taux (1 requête par seconde)
    await new Promise(resolve => setTimeout(resolve, 1000));

    const response = await axios.get(`${NOMINATIM_BASE_URL}/search`, {
      params,
      headers: {
        'User-Agent': 'PetAlertFrance/1.0 (https://petalertefrance.fr; contact@petalertefrance.fr)',
        'Accept': 'application/json'
      },
      timeout: 10000 // 10 secondes de timeout
    });

    if (response.data && response.data.length > 0) {
      const result = response.data[0];
      return {
        success: true,
        latitude: parseFloat(result.lat),
        longitude: parseFloat(result.lon),
        formattedAddress: result.display_name,
        street: result.address?.road || result.address?.street || '',
        city: result.address?.city || result.address?.town || result.address?.village || '',
        postalCode: result.address?.postcode || '',
        country: result.address?.country || 'France'
      };
    } else {
      return { success: false, error: 'Adresse non trouvée' };
    }
  } catch (error) {
    console.error('Erreur de géocodage:', error.message);
    
    // Gestion des erreurs spécifiques
    if (error.response?.status === 429) {
      return { 
        success: false, 
        error: 'Trop de requêtes. Veuillez réessayer dans quelques secondes.' 
      };
    }
    
    if (error.code === 'ECONNABORTED' || error.code === 'ETIMEDOUT') {
      return { 
        success: false, 
        error: 'Délai d\'attente dépassé. Veuillez réessayer.' 
      };
    }
    
    if (error.response?.status >= 500) {
      return { 
        success: false, 
        error: 'Service temporairement indisponible. Veuillez utiliser la carte pour sélectionner manuellement l\'emplacement.' 
      };
    }
    
    return { success: false, error: 'Erreur lors de la recherche de l\'adresse' };
  }
};

// Fonction pour la géocodage inverse (coordonnées vers adresse)
const reverseGeocode = async (latitude, longitude) => {
  try {
    const params = {
      lat: latitude,
      lon: longitude,
      format: 'json',
      addressdetails: 1,
      'accept-language': 'fr'
    };

    // Ajouter un délai pour respecter les limites de taux
    await new Promise(resolve => setTimeout(resolve, 1000));

    const response = await axios.get(`${NOMINATIM_BASE_URL}/reverse`, {
      params,
      headers: {
        'User-Agent': 'PetAlertFrance/1.0 (https://petalertefrance.fr; contact@petalertefrance.fr)',
        'Accept': 'application/json'
      },
      timeout: 10000
    });

    if (response.data) {
      const result = response.data;
      return {
        success: true,
        latitude: parseFloat(result.lat),
        longitude: parseFloat(result.lon),
        formattedAddress: result.display_name,
        street: result.address?.road || result.address?.street || '',
        city: result.address?.city || result.address?.town || result.address?.village || '',
        postalCode: result.address?.postcode || '',
        country: result.address?.country || 'France'
      };
    } else {
      return { success: false, error: 'Adresse non trouvée' };
    }
  } catch (error) {
    console.error('Erreur de géocodage inverse:', error.message);
    return { success: false, error: 'Erreur lors de la récupération de l\'adresse' };
  }
};

module.exports = {
  geocodeAddress,
  reverseGeocode
}; 