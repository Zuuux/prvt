import { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import { Icon } from 'leaflet';
import api from '../config/api';
import ApiTest from '../components/ApiTest';
import 'leaflet/dist/leaflet.css';

// Fix pour les icônes Leaflet
delete Icon.Default.prototype._getIconUrl;
Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const Home = () => {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showApiTest, setShowApiTest] = useState(false);

  useEffect(() => {
    fetchAlerts();
  }, []);

  const fetchAlerts = async () => {
    try {
      const response = await api.get('/alerts');
      setAlerts(response.data);
    } catch (error) {
      console.error('Erreur lors du chargement des alertes:', error);
    } finally {
      setLoading(false);
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
    <div className="space-y-6 px-4 sm:px-6 lg:px-8">
      <div className="text-center">
        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-800 mb-4">
          Pet Alert France
        </h1>
        <p className="text-lg sm:text-xl text-gray-600 max-w-2xl mx-auto px-4">
          Trouvez et signalez les animaux perdus en France. 
          Consultez la carte ci-dessous pour voir les alertes actives.
        </p>
        
        {/* Bouton de test API temporaire */}
        <button
          onClick={() => setShowApiTest(!showApiTest)}
          className="mt-4 bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-md transition-colors text-sm sm:text-base"
        >
          {showApiTest ? 'Masquer' : 'Afficher'} les tests API
        </button>
      </div>

      {/* Composant de test API */}
      {showApiTest && <ApiTest />}

      <div className="bg-white rounded-lg shadow-lg p-4 sm:p-6">
        <h2 className="text-xl sm:text-2xl font-semibold text-gray-800 mb-4">
          Carte des alertes
        </h2>
        <div className="h-64 sm:h-80 lg:h-96 rounded-lg overflow-hidden">
          <MapContainer
            center={[46.603354, 1.888334]} // Centre de la France
            zoom={6}
            style={{ height: '100%', width: '100%' }}
          >
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            />
            {alerts.map((alert) => (
              <Marker
                key={alert.id}
                position={[alert.latitude, alert.longitude]}
              >
                <Popup>
                  <div className="p-2 max-w-xs">
                    <h3 className="font-semibold text-base sm:text-lg">{alert.pet_name}</h3>
                    <p className="text-xs sm:text-sm text-gray-600">{alert.pet_type}</p>
                    <p className="text-xs sm:text-sm text-gray-600">
                      Perdu le: {new Date(alert.lost_date).toLocaleDateString('fr-FR')}
                    </p>
                    <p className="text-xs sm:text-sm text-gray-600">{alert.location}</p>
                    {alert.description && (
                      <p className="text-xs sm:text-sm mt-2">{alert.description}</p>
                    )}
                    
                    {/* Informations de contact */}
                    <div className="mt-3 pt-3 border-t border-gray-200">
                      <h4 className="font-semibold text-xs sm:text-sm text-gray-800 mb-2">Contact :</h4>
                      {alert.contact_phone && (
                        <div className="flex items-center mb-1">
                          <svg className="w-3 h-3 sm:w-4 sm:h-4 text-gray-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                          </svg>
                          <a 
                            href={`tel:${alert.contact_phone}`}
                            className="text-xs sm:text-sm text-blue-600 hover:text-blue-800 underline break-all"
                          >
                            {alert.contact_phone}
                          </a>
                        </div>
                      )}
                      {alert.contact_email && (
                        <div className="flex items-center">
                          <svg className="w-3 h-3 sm:w-4 sm:h-4 text-gray-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                          </svg>
                          <a 
                            href={`mailto:${alert.contact_email}`}
                            className="text-xs sm:text-sm text-blue-600 hover:text-blue-800 underline break-all"
                          >
                            {alert.contact_email}
                          </a>
                        </div>
                      )}
                      {!alert.contact_phone && !alert.contact_email && (
                        <p className="text-xs sm:text-sm text-gray-500 italic">Aucune information de contact disponible</p>
                      )}
                    </div>
                    
                    <div className="mt-2">
                      <span className="inline-block bg-red-100 text-red-800 text-xs px-2 py-1 rounded-full">
                        ALERTE ACTIVE
                      </span>
                    </div>
                  </div>
                </Popup>
              </Marker>
            ))}
          </MapContainer>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        <div className="bg-white rounded-lg shadow-lg p-4 sm:p-6">
          <div className="text-center">
            <div className="w-12 h-12 sm:w-16 sm:h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
              <svg className="w-6 h-6 sm:w-8 sm:h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <h3 className="text-lg sm:text-xl font-semibold text-gray-800 mb-2">Localisation précise</h3>
            <p className="text-sm sm:text-base text-gray-600">
              Trouvez rapidement les animaux perdus grâce à notre carte interactive
            </p>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-4 sm:p-6">
          <div className="text-center">
            <div className="w-12 h-12 sm:w-16 sm:h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
              <svg className="w-6 h-6 sm:w-8 sm:h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-lg sm:text-xl font-semibold text-gray-800 mb-2">Alertes en temps réel</h3>
            <p className="text-sm sm:text-base text-gray-600">
              Recevez des notifications instantanées pour les nouvelles alertes
            </p>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-4 sm:p-6 sm:col-span-2 lg:col-span-1">
          <div className="text-center">
            <div className="w-12 h-12 sm:w-16 sm:h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
              <svg className="w-6 h-6 sm:w-8 sm:h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <h3 className="text-lg sm:text-xl font-semibold text-gray-800 mb-2">Communauté active</h3>
            <p className="text-sm sm:text-base text-gray-600">
              Rejoignez une communauté dédiée à retrouver les animaux perdus
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home; 