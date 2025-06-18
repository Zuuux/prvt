import { useState, useEffect, useRef } from 'react';
import api from '../config/api';

const AddressAutocomplete = ({ 
  value, 
  onChange, 
  onLocationSelect, 
  placeholder = "Entrez une adresse...",
  className = "" 
}) => {
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Recherche d'adresses via l'API
  const searchAddresses = async (query) => {
    if (!query || query.trim().length < 3) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await api.get('/geocoding/search', {
        params: { query }
      });

      if (response.data.success && response.data.suggestions) {
        setSuggestions(response.data.suggestions.slice(0, 8));
        setShowSuggestions(response.data.suggestions.length > 0);
      } else {
        setSuggestions([]);
        setShowSuggestions(false);
      }
    } catch (error) {
      console.error('Erreur lors de la recherche d\'adresses:', error);
      setError('Erreur lors de la recherche. Veuillez réessayer.');
      setSuggestions([]);
      setShowSuggestions(false);
    } finally {
      setLoading(false);
    }
  };

  // Gestion du changement de valeur avec debounce
  const handleInputChange = (e) => {
    const newValue = e.target.value;
    onChange(newValue);
    setError('');
    
    // Debounce pour éviter trop de requêtes
    clearTimeout(searchTimeout.current);
    searchTimeout.current = setTimeout(() => {
      searchAddresses(newValue);
    }, 300);
  };

  const searchTimeout = useRef(null);

  // Sélection d'une suggestion
  const handleSuggestionClick = (suggestion) => {
    onChange(suggestion.display_name);
    onLocationSelect({
      latitude: suggestion.lat,
      longitude: suggestion.lon,
      address: suggestion.display_name
    });
    setShowSuggestions(false);
    setSuggestions([]);
  };

  // Géocodage manuel
  const handleGeocodeCurrent = async () => {
    if (!value || value.trim().length < 3) {
      setError('Veuillez saisir une adresse valide (au moins 3 caractères)');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await api.post('/geocoding/geocode', {
        address: value
      });

      if (response.data.success) {
        onLocationSelect({
          latitude: response.data.latitude,
          longitude: response.data.longitude,
          address: response.data.formattedAddress
        });
        onChange(response.data.formattedAddress);
        setError('');
      } else {
        setError(response.data.error || 'Adresse non trouvée. Veuillez utiliser la carte pour sélectionner manuellement l\'emplacement.');
      }
    } catch (error) {
      console.error('Erreur de géocodage:', error);
      setError(error.response?.data?.error || 'Erreur lors du géocodage. Veuillez utiliser la carte pour sélectionner manuellement l\'emplacement.');
    } finally {
      setLoading(false);
    }
  };

  // Fermer les suggestions en cliquant ailleurs
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!event.target.closest('.address-autocomplete')) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      if (searchTimeout.current) {
        clearTimeout(searchTimeout.current);
      }
    };
  }, []);

  return (
    <div className={`address-autocomplete relative ${className}`}>
      <div className="flex">
        <input
          type="text"
          value={value}
          onChange={handleInputChange}
          onFocus={() => value && suggestions.length > 0 && setShowSuggestions(true)}
          placeholder={placeholder}
          className="flex-1 px-3 py-2 border border-gray-300 rounded-l-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm sm:text-base"
        />
        <button
          type="button"
          onClick={handleGeocodeCurrent}
          disabled={loading || !value}
          className="px-3 sm:px-4 py-2 bg-blue-600 text-white rounded-r-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {loading ? (
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
          ) : (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          )}
        </button>
      </div>

      {/* Suggestions d'adresses */}
      {showSuggestions && suggestions.length > 0 && (
        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto">
          {suggestions.map((suggestion, index) => (
            <button
              key={index}
              type="button"
              onClick={() => handleSuggestionClick(suggestion)}
              className="w-full px-3 py-2 text-left hover:bg-gray-100 focus:bg-gray-100 focus:outline-none"
            >
              <div className="font-medium text-gray-900 text-sm sm:text-base truncate">
                {suggestion.display_name}
              </div>
              {suggestion.address && (
                <div className="text-xs sm:text-sm text-gray-600 truncate">
                  {suggestion.address.city || suggestion.address.town || suggestion.address.village}
                  {suggestion.address.postcode && `, ${suggestion.address.postcode}`}
                </div>
              )}
            </button>
          ))}
        </div>
      )}

      {/* Message d'erreur */}
      {error && (
        <div className="mt-2 text-xs sm:text-sm text-red-600">
          {error}
        </div>
      )}

      {/* Indicateur de chargement */}
      {loading && !showSuggestions && (
        <div className="mt-2 text-xs sm:text-sm text-gray-500">
          Recherche en cours...
        </div>
      )}

      {/* Aide utilisateur */}
      <div className="mt-2 text-xs text-gray-500">
        💡 Tapez une adresse française ou utilisez la carte pour sélectionner manuellement l'emplacement.
      </div>
    </div>
  );
};

export default AddressAutocomplete; 