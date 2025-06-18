import { useState } from 'react';
import { testApiConnection, testAuth, testAlerts, testPets } from '../utils/apiTest';

const ApiTest = () => {
  const [results, setResults] = useState({});
  const [loading, setLoading] = useState(false);

  const runTests = async () => {
    setLoading(true);
    setResults({});

    // Test 1: Connexion API
    const apiTest = await testApiConnection();
    setResults(prev => ({ ...prev, api: apiTest }));

    // Test 2: Récupération des alertes (publique)
    const alertsTest = await testAlerts();
    setResults(prev => ({ ...prev, alerts: alertsTest }));

    // Test 3: Authentification avec compte de test
    const authTest = await testAuth('test@example.com', 'password123');
    setResults(prev => ({ ...prev, auth: authTest }));

    // Test 4: Récupération des animaux (si authentifié)
    if (authTest.success) {
      const petsTest = await testPets();
      setResults(prev => ({ ...prev, pets: petsTest }));
    }

    setLoading(false);
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 max-w-2xl mx-auto">
      <h2 className="text-2xl font-bold text-gray-800 mb-4">
        Test de communication API
      </h2>
      
      <button
        onClick={runTests}
        disabled={loading}
        className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-md transition-colors disabled:opacity-50 mb-6"
      >
        {loading ? 'Tests en cours...' : 'Lancer les tests'}
      </button>

      <div className="space-y-4">
        {/* Test API */}
        <div className="border rounded-lg p-4">
          <h3 className="font-semibold text-lg mb-2">Test de connexion API</h3>
          {results.api ? (
            <div className={results.api.success ? 'text-green-600' : 'text-red-600'}>
              {results.api.success ? '✅ Succès' : '❌ Échec'}: {results.api.error || results.api.data?.message}
            </div>
          ) : (
            <div className="text-gray-500">En attente...</div>
          )}
        </div>

        {/* Test Alertes */}
        <div className="border rounded-lg p-4">
          <h3 className="font-semibold text-lg mb-2">Test récupération alertes</h3>
          {results.alerts ? (
            <div className={results.alerts.success ? 'text-green-600' : 'text-red-600'}>
              {results.alerts.success ? '✅ Succès' : '❌ Échec'}: {results.alerts.error || `${results.alerts.data?.length || 0} alertes récupérées`}
            </div>
          ) : (
            <div className="text-gray-500">En attente...</div>
          )}
        </div>

        {/* Test Authentification */}
        <div className="border rounded-lg p-4">
          <h3 className="font-semibold text-lg mb-2">Test authentification</h3>
          {results.auth ? (
            <div className={results.auth.success ? 'text-green-600' : 'text-red-600'}>
              {results.auth.success ? '✅ Succès' : '❌ Échec'}: {results.auth.error || 'Utilisateur connecté'}
            </div>
          ) : (
            <div className="text-gray-500">En attente...</div>
          )}
        </div>

        {/* Test Animaux */}
        <div className="border rounded-lg p-4">
          <h3 className="font-semibold text-lg mb-2">Test récupération animaux</h3>
          {results.pets ? (
            <div className={results.pets.success ? 'text-green-600' : 'text-red-600'}>
              {results.pets.success ? '✅ Succès' : '❌ Échec'}: {results.pets.error || `${results.pets.data?.length || 0} animaux récupérés`}
            </div>
          ) : results.auth && !results.auth.success ? (
            <div className="text-gray-500">Authentification requise</div>
          ) : (
            <div className="text-gray-500">En attente...</div>
          )}
        </div>
      </div>

      <div className="mt-6 p-4 bg-gray-50 rounded-lg">
        <h4 className="font-semibold mb-2">Instructions :</h4>
        <ul className="text-sm text-gray-600 space-y-1">
          <li>• Assurez-vous que le backend est démarré sur le port 3002</li>
          <li>• Vérifiez que la base de données MySQL est configurée</li>
          <li>• Le compte de test est : test@example.com / password123</li>
        </ul>
      </div>
    </div>
  );
};

export default ApiTest; 