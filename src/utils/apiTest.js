import api from '../config/api';

// Fonction pour tester la connexion à l'API
export const testApiConnection = async () => {
  try {
    const response = await api.get('/test');
    console.log('✅ API connectée:', response.data);
    return { success: true, data: response.data };
  } catch (error) {
    console.error('❌ Erreur de connexion API:', error.message);
    return { success: false, error: error.message };
  }
};

// Fonction pour tester l'authentification
export const testAuth = async (email, password) => {
  try {
    const response = await api.post('/auth/login', { email, password });
    console.log('✅ Authentification réussie:', response.data);
    return { success: true, data: response.data };
  } catch (error) {
    console.error('❌ Erreur d\'authentification:', error.response?.data || error.message);
    return { success: false, error: error.response?.data?.message || error.message };
  }
};

// Fonction pour tester la récupération des alertes
export const testAlerts = async () => {
  try {
    const response = await api.get('/alerts');
    console.log('✅ Alertes récupérées:', response.data);
    return { success: true, data: response.data };
  } catch (error) {
    console.error('❌ Erreur récupération alertes:', error.response?.data || error.message);
    return { success: false, error: error.response?.data?.message || error.message };
  }
};

// Fonction pour tester la récupération des animaux (avec authentification)
export const testPets = async () => {
  try {
    const response = await api.get('/pets/my-pets');
    console.log('✅ Animaux récupérés:', response.data);
    return { success: true, data: response.data };
  } catch (error) {
    console.error('❌ Erreur récupération animaux:', error.response?.data || error.message);
    return { success: false, error: error.response?.data?.message || error.message };
  }
}; 