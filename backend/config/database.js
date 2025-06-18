const mysql = require('mysql2/promise');
require('dotenv').config();

// Configuration de la base de données avec support des variables d'environnement
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'petalertfrance',
  charset: 'utf8mb4',
  timezone: '+01:00', // Fuseau horaire français
  // Configuration pour la production
  connectionLimit: 10,
  acquireTimeout: 60000,
  timeout: 60000,
  reconnect: true
};

// Créer le pool de connexions
const pool = mysql.createPool(dbConfig);

// Test de connexion
pool.getConnection()
  .then(connection => {
    console.log('✅ Connexion à la base de données établie');
    connection.release();
  })
  .catch(err => {
    console.error('❌ Erreur de connexion à la base de données:', err.message);
    if (process.env.NODE_ENV === 'production') {
      process.exit(1);
    }
  });

module.exports = pool; 