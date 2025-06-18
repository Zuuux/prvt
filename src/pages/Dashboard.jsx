import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';

const Dashboard = () => {
  const { user } = useAuth();
  const [pets, setPets] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUserData();
  }, []);

  const fetchUserData = async () => {
    try {
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };

      const [petsResponse, alertsResponse] = await Promise.all([
        axios.get('http://localhost:3001/api/pets/my-pets', { headers }),
        axios.get('http://localhost:3001/api/alerts/my-alerts', { headers })
      ]);

      setPets(petsResponse.data);
      setAlerts(alertsResponse.data);
    } catch (error) {
      console.error('Erreur lors du chargement des données:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeletePet = async (petId) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer cet animal ?')) {
      try {
        const token = localStorage.getItem('token');
        await axios.delete(`http://localhost:3001/api/pets/${petId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setPets(pets.filter(pet => pet.id !== petId));
      } catch (error) {
        console.error('Erreur lors de la suppression:', error);
      }
    }
  };

  const handleCloseAlert = async (alertId) => {
    if (window.confirm('Êtes-vous sûr de vouloir fermer cette alerte ?')) {
      try {
        const token = localStorage.getItem('token');
        await axios.put(`http://localhost:3001/api/alerts/${alertId}/close`, {}, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setAlerts(alerts.filter(alert => alert.id !== alertId));
      } catch (error) {
        console.error('Erreur lors de la fermeture de l\'alerte:', error);
      }
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 sm:space-y-8 px-4 sm:px-6 lg:px-8">
      <div className="bg-white rounded-lg shadow-lg p-4 sm:p-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-2">
          Tableau de bord
        </h1>
        <p className="text-sm sm:text-base text-gray-600">
          Bienvenue, {user?.name} ! Gérez vos animaux et vos alertes depuis cet espace.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8">
        {/* Section Animaux */}
        <div className="bg-white rounded-lg shadow-lg p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 space-y-3 sm:space-y-0">
            <h2 className="text-xl sm:text-2xl font-semibold text-gray-800">
              Mes animaux ({pets.length})
            </h2>
            <Link
              to="/add-pet"
              className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md transition-colors text-center text-sm sm:text-base"
            >
              Ajouter un animal
            </Link>
          </div>

          {pets.length === 0 ? (
            <div className="text-center py-8">
              <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-6 h-6 sm:w-8 sm:h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
              </div>
              <p className="text-sm sm:text-base text-gray-500 mb-4">Aucun animal enregistré</p>
              <Link
                to="/add-pet"
                className="text-blue-600 hover:text-blue-500 font-medium text-sm sm:text-base"
              >
                Ajouter votre premier animal
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {pets.map((pet) => (
                <div key={pet.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h3 className="font-semibold text-base sm:text-lg text-gray-800">{pet.name}</h3>
                      <p className="text-sm sm:text-base text-gray-600">{pet.type} • {pet.breed}</p>
                      <p className="text-xs sm:text-sm text-gray-500">
                        {pet.age} ans • {pet.color}
                      </p>
                    </div>
                    <button
                      onClick={() => handleDeletePet(pet.id)}
                      className="text-red-600 hover:text-red-800 text-xs sm:text-sm ml-4"
                    >
                      Supprimer
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Section Alertes */}
        <div className="bg-white rounded-lg shadow-lg p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 space-y-3 sm:space-y-0">
            <h2 className="text-xl sm:text-2xl font-semibold text-gray-800">
              Mes alertes ({alerts.length})
            </h2>
            <Link
              to="/create-alert"
              className="w-full sm:w-auto bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md transition-colors text-center text-sm sm:text-base"
            >
              Créer une alerte
            </Link>
          </div>

          {alerts.length === 0 ? (
            <div className="text-center py-8">
              <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-6 h-6 sm:w-8 sm:h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <p className="text-sm sm:text-base text-gray-500 mb-4">Aucune alerte active</p>
              <Link
                to="/create-alert"
                className="text-red-600 hover:text-red-500 font-medium text-sm sm:text-base"
              >
                Créer votre première alerte
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {alerts.map((alert) => (
                <div key={alert.id} className="border border-red-200 rounded-lg p-4 bg-red-50">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h3 className="font-semibold text-base sm:text-lg text-gray-800">{alert.pet_name}</h3>
                      <p className="text-sm sm:text-base text-gray-600">Perdu le {new Date(alert.lost_date).toLocaleDateString('fr-FR')}</p>
                      <p className="text-xs sm:text-sm text-gray-500">{alert.location}</p>
                      <div className="mt-2">
                        <span className="inline-block bg-red-100 text-red-800 text-xs px-2 py-1 rounded-full">
                          ALERTE ACTIVE
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={() => handleCloseAlert(alert.id)}
                      className="text-green-600 hover:text-green-800 text-xs sm:text-sm ml-4"
                    >
                      Fermer
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Actions rapides */}
      <div className="bg-white rounded-lg shadow-lg p-4 sm:p-6">
        <h2 className="text-xl sm:text-2xl font-semibold text-gray-800 mb-6">
          Actions rapides
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <Link
            to="/add-pet"
            className="bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg p-4 text-center transition-colors"
          >
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <svg className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
            </div>
            <h3 className="font-semibold text-gray-800 text-sm sm:text-base">Ajouter un animal</h3>
            <p className="text-xs sm:text-sm text-gray-600">Enregistrez un nouvel animal</p>
          </Link>

          <Link
            to="/create-alert"
            className="bg-red-50 hover:bg-red-100 border border-red-200 rounded-lg p-4 text-center transition-colors"
          >
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <svg className="w-5 h-5 sm:w-6 sm:h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <h3 className="font-semibold text-gray-800 text-sm sm:text-base">Créer une alerte</h3>
            <p className="text-xs sm:text-sm text-gray-600">Signaler un animal perdu</p>
          </Link>

          <Link
            to="/"
            className="bg-green-50 hover:bg-green-100 border border-green-200 rounded-lg p-4 text-center transition-colors sm:col-span-2 lg:col-span-1"
          >
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <svg className="w-5 h-5 sm:w-6 sm:h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <h3 className="font-semibold text-gray-800 text-sm sm:text-base">Voir la carte</h3>
            <p className="text-xs sm:text-sm text-gray-600">Consulter toutes les alertes</p>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Dashboard; 