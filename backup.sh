#!/bin/bash

# Script de sauvegarde pour Pet Alert France
# Sauvegarde automatique de la base de données

set -e

# Configuration
DB_NAME="petalertfrance"
DB_USER="petalertfrance"
DB_PASSWORD="VotreMotDePasseSecurise123!"
BACKUP_DIR="/var/backups/petalertfrance"
RETENTION_DAYS=30

# Créer le répertoire de sauvegarde
sudo mkdir -p $BACKUP_DIR
sudo chown $USER:$USER $BACKUP_DIR

# Nom du fichier de sauvegarde avec timestamp
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILE="$BACKUP_DIR/petalertfrance_$TIMESTAMP.sql"

echo "🔄 Début de la sauvegarde de la base de données..."

# Sauvegarde de la base de données
mysqldump -u$DB_USER -p$DB_PASSWORD $DB_NAME > $BACKUP_FILE

# Compression de la sauvegarde
gzip $BACKUP_FILE

echo "✅ Sauvegarde créée: $BACKUP_FILE.gz"

# Nettoyage des anciennes sauvegardes
echo "🧹 Nettoyage des anciennes sauvegardes..."
find $BACKUP_DIR -name "*.sql.gz" -mtime +$RETENTION_DAYS -delete

echo "🎉 Sauvegarde terminée avec succès !"

# Vérification de l'espace disque
DISK_USAGE=$(df -h $BACKUP_DIR | tail -1 | awk '{print $5}' | sed 's/%//')
if [ $DISK_USAGE -gt 80 ]; then
    echo "⚠️  Attention: L'espace disque est utilisé à $DISK_USAGE%"
fi 