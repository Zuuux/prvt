// Configuration de l'API selon l'environnement
const API_BASE_URL = import.meta.env.VITE_API_URL || 
  (import.meta.env.DEV ? 'http://localhost:3002/api' : 'https://petalertefrance.fr/api');

// Configuration Axios avec intercepteurs
import axios from 'axios';

// Créer l'instance axios
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Intercepteur pour ajouter le token d'authentification
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Intercepteur pour gérer les erreurs de réponse
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    // Si le token est expiré, rediriger vers la page de connexion
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    
    // Gérer les erreurs de réseau
    if (!error.response) {
      console.error('Erreur de réseau:', error.message);
      return Promise.reject(new Error('Erreur de connexion au serveur'));
    }
    
    return Promise.reject(error);
  }
);

export default api;
export { API_BASE_URL }; 