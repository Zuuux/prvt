#!/bin/bash

# Script de mise à jour pour Pet Alert France
# Met à jour l'application depuis le repository Git

set -e

# Variables de configuration
APP_DIR="/var/www/petalertfrance"
BACKUP_DIR="/var/backups/petalertfrance"

# Couleurs pour les messages
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Fonction pour afficher les messages
print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

echo "🔄 Mise à jour de Pet Alert France..."

# Vérifier si on est dans le bon répertoire
if [ ! -d "$APP_DIR" ]; then
    print_error "Répertoire de l'application non trouvé: $APP_DIR"
    exit 1
fi

cd $APP_DIR

# Sauvegarder la base de données
print_status "Sauvegarde de la base de données..."
if [ -f "../backup.sh" ]; then
    bash ../backup.sh
else
    print_warning "Script de sauvegarde non trouvé, création d'une sauvegarde manuelle..."
    TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
    BACKUP_FILE="$BACKUP_DIR/petalertfrance_update_$TIMESTAMP.sql"
    sudo mkdir -p $BACKUP_DIR
    sudo chown $USER:$USER $BACKUP_DIR
    mysqldump -upetalertfrance -p'VotreMotDePasseSecurise123!' petalertfrance > $BACKUP_FILE
    gzip $BACKUP_FILE
    print_status "Sauvegarde créée: $BACKUP_FILE.gz"
fi

# Arrêter l'application
print_status "Arrêt de l'application..."
pm2 stop petalertfrance-backend

# Sauvegarder les fichiers de configuration
print_status "Sauvegarde des fichiers de configuration..."
cp backend/.env backend/.env.backup.$(date +"%Y%m%d_%H%M%S")
cp .env.production .env.production.backup.$(date +"%Y%m%d_%H%M%S")

# Mettre à jour le code depuis Git
print_status "Mise à jour du code depuis Git..."
git fetch origin
git reset --hard origin/main

# Restaurer les fichiers de configuration
print_status "Restauration des fichiers de configuration..."
if [ -f "backend/.env.backup.$(date +"%Y%m%d_%H%M%S")" ]; then
    cp backend/.env.backup.$(date +"%Y%m%d_%H%M%S") backend/.env
fi
if [ -f ".env.production.backup.$(date +"%Y%m%d_%H%M%S")" ]; then
    cp .env.production.backup.$(date +"%Y%m%d_%H%M%S") .env.production
fi

# Installer les nouvelles dépendances backend
print_status "Installation des nouvelles dépendances backend..."
cd backend
npm install
cd ..

# Installer les nouvelles dépendances frontend
print_status "Installation des nouvelles dépendances frontend..."
npm install

# Build du frontend
print_status "Build du frontend..."
npm run build

# Redémarrer l'application
print_status "Redémarrage de l'application..."
pm2 start petalertfrance-backend
pm2 save

# Vérification
print_status "Vérification de la mise à jour..."
sleep 5

# Vérifier que le backend fonctionne
if curl -s http://localhost:3002/api/health > /dev/null; then
    print_status "✅ Backend opérationnel après mise à jour"
else
    print_error "❌ Problème avec le backend après mise à jour"
    print_warning "Vérifiez les logs: pm2 logs petalertfrance-backend"
fi

# Nettoyage des sauvegardes temporaires
print_status "Nettoyage des sauvegardes temporaires..."
rm -f backend/.env.backup.*
rm -f .env.production.backup.*

print_status "🎉 Mise à jour terminée avec succès !"
print_status "Application accessible sur: https://petalertefrance.fr"
print_status "Logs: pm2 logs petalertfrance-backend" 