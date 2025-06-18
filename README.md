# Pet Alert France 🐾

Une application web moderne pour signaler et retrouver les animaux perdus en France. L'application utilise React avec Vite pour le frontend et Node.js avec Express et MySQL pour le backend.

## 🚀 Fonctionnalités

- **Carte interactive** : Visualisez toutes les alertes d'animaux perdus sur une carte de France
- **Gestion de compte** : Inscription, connexion et gestion de profil utilisateur
- **Gestion des animaux** : Ajoutez et gérez vos animaux de compagnie
- **Système d'alertes** : Créez des alertes pour vos animaux perdus avec localisation précise
- **Interface moderne** : Design responsive avec Tailwind CSS

## 🛠️ Technologies utilisées

### Frontend
- React 18
- Vite
- Tailwind CSS
- React Router DOM
- Axios
- Leaflet (cartes interactives)

### Backend
- Node.js
- Express.js
- MySQL
- JWT (authentification)
- bcryptjs (hachage des mots de passe)
- Multer (upload de fichiers)

## 📋 Prérequis

- Node.js (version 18 ou supérieure)
- MySQL (version 8.0 ou supérieure)
- npm ou yarn

## 🚀 Installation

### 1. Cloner le repository

```bash
git clone <url-du-repo>
cd PetAlertFRANCE
```

### 2. Configuration de la base de données

1. Ouvrez phpMyAdmin ou votre client MySQL
2. Créez une nouvelle base de données nommée `petalertfrance`
3. Importez le fichier `backend/database.sql` pour créer les tables

### 3. Configuration du backend

```bash
cd backend
npm install
```

Créez un fichier `.env` dans le dossier `backend` avec le contenu suivant :

```env
# Configuration de la base de données MySQL
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=votre_mot_de_passe_mysql
DB_NAME=petalertfrance
DB_PORT=3306

# Configuration JWT
JWT_SECRET=votre-super-secret-jwt-key-change-this-in-production

# Configuration du serveur
PORT=3001

# Configuration CORS
CORS_ORIGIN=http://localhost:5173
```

### 4. Configuration du frontend

```bash
cd ..
npm install
```

### 5. Démarrage de l'application

#### Terminal 1 - Backend
```bash
cd backend
npm run dev
```

#### Terminal 2 - Frontend
```bash
npm run dev
```

L'application sera accessible sur `http://localhost:5173`

## 📁 Structure du projet

```
PetAlertFRANCE/
├── src/                    # Code source React
│   ├── components/         # Composants réutilisables
│   ├── pages/             # Pages de l'application
│   ├── contexts/          # Contextes React
│   └── index.css          # Styles globaux
├── backend/               # Serveur Node.js
│   ├── config/           # Configuration
│   ├── middleware/       # Middlewares Express
│   ├── routes/           # Routes API
│   ├── uploads/          # Images uploadées
│   └── server.js         # Point d'entrée du serveur
├── database.sql          # Script de création de la base de données
└── README.md             # Ce fichier
```

## 🔧 API Endpoints

### Authentification
- `POST /api/auth/register` - Inscription
- `POST /api/auth/login` - Connexion
- `GET /api/auth/me` - Informations utilisateur

### Animaux
- `GET /api/pets/my-pets` - Animaux de l'utilisateur
- `POST /api/pets` - Ajouter un animal
- `PUT /api/pets/:id` - Modifier un animal
- `DELETE /api/pets/:id` - Supprimer un animal

### Alertes
- `GET /api/alerts` - Toutes les alertes actives
- `GET /api/alerts/my-alerts` - Alertes de l'utilisateur
- `POST /api/alerts` - Créer une alerte
- `PUT /api/alerts/:id/close` - Fermer une alerte
- `DELETE /api/alerts/:id` - Supprimer une alerte

## 🎯 Utilisation

1. **Inscription/Connexion** : Créez un compte ou connectez-vous
2. **Ajouter des animaux** : Enregistrez vos animaux de compagnie
3. **Créer une alerte** : Si un animal est perdu, créez une alerte avec localisation
4. **Consulter la carte** : Visualisez toutes les alertes actives sur la carte

## 🔒 Sécurité

- Mots de passe hachés avec bcrypt
- Authentification JWT
- Validation des données côté serveur
- Protection CSRF avec CORS
- Upload de fichiers sécurisé

## 🐛 Dépannage

### Problèmes de connexion à la base de données
- Vérifiez que MySQL est démarré
- Vérifiez les paramètres de connexion dans le fichier `.env`
- Assurez-vous que la base de données `petalertfrance` existe

### Problèmes de CORS
- Vérifiez que l'URL du frontend est correcte dans `CORS_ORIGIN`
- Assurez-vous que le backend et le frontend utilisent les bons ports

### Problèmes d'upload d'images
- Vérifiez que le dossier `backend/uploads` existe
- Vérifiez les permissions du dossier

## 📝 Licence

Ce projet est sous licence ISC.

## 🤝 Contribution

Les contributions sont les bienvenues ! N'hésitez pas à :
1. Fork le projet
2. Créer une branche pour votre fonctionnalité
3. Commiter vos changements
4. Pousser vers la branche
5. Ouvrir une Pull Request

## 📞 Support

Pour toute question ou problème, n'hésitez pas à ouvrir une issue sur GitHub.
