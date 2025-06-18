require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3002;

// Middleware de sécurité
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      imgSrc: ["'self'", "data:", "https:"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      connectSrc: ["'self'", "https://nominatim.openstreetmap.org"]
    }
  }
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limite chaque IP à 100 requêtes par fenêtre
  message: {
    error: 'Trop de requêtes depuis cette IP, veuillez réessayer plus tard.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

app.use('/api/', limiter);

// Configuration CORS pour la production
const corsOptions = {
  origin: process.env.NODE_ENV === 'production' 
    ? [process.env.CORS_ORIGIN || 'https://petalertefrance.fr']
    : ['http://localhost:5173', 'http://localhost:5174'],
  credentials: true,
  optionsSuccessStatus: 200
};

app.use(cors(corsOptions));

// Middleware pour parser le JSON
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Middleware pour les logs
app.use((req, res, next) => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${req.method} ${req.path} - ${req.ip}`);
  next();
});

// Routes API
app.use('/api/auth', require('./routes/auth'));
app.use('/api/pets', require('./routes/pets'));
app.use('/api/alerts', require('./routes/alerts'));
app.use('/api/geocoding', require('./routes/geocoding'));

// Route de santé pour les vérifications
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// Gestion des erreurs 404
app.use('/api/*', (req, res) => {
  res.status(404).json({ 
    error: 'Route API non trouvée',
    path: req.path
  });
});

// Middleware de gestion d'erreurs global
app.use((err, req, res, next) => {
  console.error('Erreur serveur:', err);
  
  // Ne pas exposer les détails d'erreur en production
  const errorMessage = process.env.NODE_ENV === 'production' 
    ? 'Erreur interne du serveur' 
    : err.message;
  
  res.status(err.status || 500).json({
    error: errorMessage,
    ...(process.env.NODE_ENV !== 'production' && { stack: err.stack })
  });
});

// Démarrage du serveur
app.listen(PORT, () => {
  console.log(`🚀 Serveur Pet Alert France démarré sur le port ${PORT}`);
  console.log(`📊 Environnement: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🌐 API disponible sur: http://localhost:${PORT}/api`);
  
  if (process.env.NODE_ENV === 'production') {
    console.log(`🔒 Mode production activé`);
    console.log(`🌍 CORS autorisé pour: ${process.env.CORS_ORIGIN}`);
  }
});

// Gestion gracieuse de l'arrêt
process.on('SIGTERM', () => {
  console.log('🛑 Signal SIGTERM reçu, arrêt gracieux du serveur...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('🛑 Signal SIGINT reçu, arrêt gracieux du serveur...');
  process.exit(0);
});

module.exports = app; 