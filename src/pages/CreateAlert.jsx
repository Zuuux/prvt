import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import { Icon } from 'leaflet';
import api from '../config/api';
import AddressAutocomplete from '../components/AddressAutocomplete';
import 'leaflet/dist/leaflet.css';

// Fix pour les icônes Leaflet
delete Icon.Default.prototype._getIconUrl;
Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Composant pour capturer les clics sur la carte
function LocationMarker({ position, setPosition }) {
  useMapEvents({
    click(e) {
      setPosition([e.latlng.lat, e.latlng.lng]);
    },
  });

  return position === null ? null : (
    <Marker position={position} />
  );
}

const CreateAlert = () => {
  const [pets, setPets] = useState([]);
  const [formData, setFormData] = useState({
    pet_id: '',
    lost_date: '',
    location: '',
    latitude: null,
    longitude: null,
    description: '',
    contact_phone: '',
    contact_email: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [mapPosition, setMapPosition] = useState([46.603354, 1.888334]); // Centre de la France
  const [selectedPosition, setSelectedPosition] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchUserPets();
  }, []);

  const fetchUserPets = async () => {
    try {
      const response = await api.get('/pets/my-pets');
      setPets(response.data);
    } catch (error) {
      console.error('Erreur lors du chargement des animaux:', error);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  const handleMapClick = (latlng) => {
    setSelectedPosition([latlng.lat, latlng.lng]);
    setFormData({
      ...formData,
      latitude: latlng.lat,
      longitude: latlng.lng
    });
  };

  // Gestion de la sélection d'adresse depuis l'autocomplétion
  const handleLocationSelect = (locationData) => {
    setSelectedPosition([locationData.latitude, locationData.longitude]);
    setMapPosition([locationData.latitude, locationData.longitude]);
    setFormData({
      ...formData,
      location: locationData.address,
      latitude: locationData.latitude,
      longitude: locationData.longitude
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!formData.pet_id) {
      setError('Veuillez sélectionner un animal');
      return;
    }

    if (!formData.lost_date) {
      setError('Veuillez indiquer la date de disparition');
      return;
    }

    if (!formData.latitude || !formData.longitude) {
      setError('Veuillez sélectionner un emplacement sur la carte ou saisir une adresse');
      return;
    }

    setLoading(true);

    try {
      await api.post('/alerts', formData);
      navigate('/dashboard');
    } catch (error) {
      setError(error.response?.data?.message || 'Erreur lors de la création de l\'alerte');
    } finally {
      setLoading(false);
    }
  };

  if (pets.length === 0) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-6 text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-4">
            Aucun animal enregistré
          </h2>
          <p className="text-gray-600 mb-6">
            Vous devez d'abord ajouter un animal à votre compte avant de pouvoir créer une alerte.
          </p>
          <button
            onClick={() => navigate('/add-pet')}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-md transition-colors"
          >
            Ajouter un animal
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="bg-white rounded-lg shadow-lg p-4 sm:p-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-6">
          Créer une alerte
        </h1>

        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md text-sm sm:text-base">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
            <div>
              <label htmlFor="pet_id" className="block text-sm font-medium text-gray-700 mb-2">
                Animal perdu *
              </label>
              <select
                id="pet_id"
                name="pet_id"
                required
                value={formData.pet_id}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm sm:text-base"
              >
                <option value="">Sélectionnez un animal</option>
                {pets.map((pet) => (
                  <option key={pet.id} value={pet.id}>
                    {pet.name} ({pet.type} - {pet.breed})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="lost_date" className="block text-sm font-medium text-gray-700 mb-2">
                Date de disparition *
              </label>
              <input
                type="date"
                id="lost_date"
                name="lost_date"
                required
                value={formData.lost_date}
                onChange={handleChange}
                max={new Date().toISOString().split('T')[0]}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm sm:text-base"
              />
            </div>

            <div>
              <label htmlFor="contact_phone" className="block text-sm font-medium text-gray-700 mb-2">
                Téléphone de contact
              </label>
              <input
                type="tel"
                id="contact_phone"
                name="contact_phone"
                value={formData.contact_phone}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm sm:text-base"
                placeholder="06 12 34 56 78"
              />
            </div>

            <div>
              <label htmlFor="contact_email" className="block text-sm font-medium text-gray-700 mb-2">
                Email de contact
              </label>
              <input
                type="email"
                id="contact_email"
                name="contact_email"
                value={formData.contact_email}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm sm:text-base"
                placeholder="contact@email.com"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Adresse ou lieu de disparition *
            </label>
            <AddressAutocomplete
              value={formData.location}
              onChange={(value) => setFormData({ ...formData, location: value })}
              onLocationSelect={handleLocationSelect}
              placeholder="Ex: Paris, Lyon, Marseille..."
            />
            <p className="text-xs sm:text-sm text-gray-500 mt-1">
              Tapez le nom d'une ville française et sélectionnez-la dans la liste, ou cliquez sur le bouton de recherche pour géocoder directement.
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Localisation précise sur la carte *
            </label>
            <p className="text-xs sm:text-sm text-gray-500 mb-2">
              L'emplacement sera automatiquement placé sur la carte quand vous sélectionnez une ville. 
              Vous pouvez aussi cliquer directement sur la carte pour ajuster la position.
            </p>
            <div className="h-64 sm:h-80 lg:h-96 rounded-lg overflow-hidden border border-gray-300">
              <MapContainer
                center={mapPosition}
                zoom={6}
                style={{ height: '100%', width: '100%' }}
                onClick={handleMapClick}
              >
                <TileLayer
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                />
                {selectedPosition && (
                  <Marker position={selectedPosition} />
                )}
              </MapContainer>
            </div>
            {selectedPosition && (
              <p className="text-xs sm:text-sm text-green-600 mt-2">
                ✓ Position sélectionnée: {selectedPosition[0].toFixed(6)}, {selectedPosition[1].toFixed(6)}
              </p>
            )}
          </div>

          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
              Description supplémentaire
            </label>
            <textarea
              id="description"
              name="description"
              rows="4"
              value={formData.description}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm sm:text-base"
              placeholder="Décrivez les circonstances de la disparition, les derniers moments vus, etc."
            />
          </div>

          <div className="flex flex-col sm:flex-row justify-end space-y-3 sm:space-y-0 sm:space-x-4">
            <button
              type="button"
              onClick={() => navigate('/dashboard')}
              className="w-full sm:w-auto px-6 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors text-sm sm:text-base"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={loading}
              className="w-full sm:w-auto px-6 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base"
            >
              {loading ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Création en cours...
                </div>
              ) : (
                'Créer l\'alerte'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateAlert; 