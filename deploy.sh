#!/bin/bash

# Script de déploiement pour Pet Alert France
# Ubuntu 22.04 LTS avec Nginx, PM2 et SSL

set -e

echo "🚀 Déploiement de Pet Alert France sur Ubuntu 22.04..."

# Variables de configuration
DOMAIN="petalertefrance.fr"
APP_DIR="/var/www/petalertfrance"
BACKEND_PORT=3002
FRONTEND_PORT=5174
GIT_REPO="https://github.com/Zuuux/prvt.git"

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


# Créer le répertoire de l'application
print_status "Création du répertoire de l'application..."
sudo mkdir -p $APP_DIR
sudo chown $USER:$USER $APP_DIR

# Cloner le code depuis GitHub
print_status "Clonage du code depuis GitHub..."
if [ -d "$APP_DIR/.git" ]; then
    print_status "Repository existant détecté, mise à jour..."
    cd $APP_DIR
    git pull origin main
else
    print_status "Clonage du repository..."
    git clone $GIT_REPO $APP_DIR
    cd $APP_DIR
fi

# Installer les dépendances du backend
print_status "Installation des dépendances backend..."
cd $APP_DIR/backend
npm install

# Installer les dépendances du frontend
print_status "Installation des dépendances frontend..."
cd $APP_DIR
npm install

# Configuration de la base de données
print_status "Configuration de la base de données..."
sudo mysql -e "CREATE DATABASE IF NOT EXISTS petalertfrance CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
sudo mysql -e "CREATE USER IF NOT EXISTS 'petalertfrance'@'localhost' IDENTIFIED BY '07Enz@Gang08';"
sudo mysql -e "GRANT ALL PRIVILEGES ON petalertfrance.* TO 'petalertfrance'@'localhost';"
sudo mysql -e "FLUSH PRIVILEGES;"

# Importer le schéma de base de données
print_status "Import du schéma de base de données..."
sudo mysql petalertfrance < $APP_DIR/backend/database.sql 2>/dev/null || {
    print_warning "Certains éléments de la base de données existent déjà, continuation..."
}

# Configuration du backend
print_status "Configuration du backend..."
cat > $APP_DIR/backend/.env << EOF
NODE_ENV=production
PORT=$BACKEND_PORT
DB_HOST=localhost
DB_USER=petalertfrance
DB_PASSWORD=07Enz@Gang08
DB_NAME=petalertfrance
JWT_SECRET=VotreJWTSecretTresSecurise123!
CORS_ORIGIN=https://$DOMAIN
EOF

# Configuration du frontend pour la production
print_status "Configuration du frontend..."
cat > $APP_DIR/.env.production << EOF
VITE_API_URL=https://$DOMAIN/api
EOF

# Build du frontend
print_status "Build du frontend..."
cd $APP_DIR
npm run build

# Démarrer le backend avec PM2
print_status "Démarrage du backend avec PM2..."
cd $APP_DIR

# Arrêter l'ancienne instance si elle existe
pm2 stop petalertfrance-backend 2>/dev/null || true
pm2 delete petalertfrance-backend 2>/dev/null || true

# Démarrer la nouvelle instance
pm2 start backend/server.js --name "petalertfrance-backend" --cwd $APP_DIR
pm2 save
pm2 startup

# Configuration Nginx
print_status "Configuration de Nginx..."
sudo tee /etc/nginx/sites-available/$DOMAIN > /dev/null << EOF
server {
    listen 80;
    server_name $DOMAIN www.$DOMAIN;
    
    # Redirection vers HTTPS
    return 301 https://\$server_name\$request_uri;
}

server {
    listen 443 ssl http2;
    server_name $DOMAIN www.$DOMAIN;
    
    # SSL sera configuré par Certbot
    
    # Frontend (React)
    location / {
        root $APP_DIR/dist;
        try_files \$uri \$uri/ /index.html;
        
        # Cache statique
        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
        }
    }
    
    # API Backend
    location /api/ {
        proxy_pass http://localhost:$BACKEND_PORT/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
    }
    
    # Sécurité
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;
    add_header Content-Security-Policy "default-src 'self' http: https: data: blob: 'unsafe-inline'" always;
    
    # Gzip
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_proxied expired no-cache no-store private;
    gzip_types text/plain text/css text/xml text/javascript application/x-javascript application/xml+rss;
}
EOF

# Activer le site
sudo ln -sf /etc/nginx/sites-available/$DOMAIN /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default

# Tester la configuration Nginx
sudo nginx -t

# Redémarrer Nginx
sudo systemctl restart nginx
sudo systemctl enable nginx

# Obtenir le certificat SSL
print_status "Configuration du certificat SSL..."
sudo certbot --nginx -d $DOMAIN -d www.$DOMAIN --non-interactive --agree-tos --email votre-email@example.com

# Configuration du renouvellement automatique SSL
sudo crontab -l 2>/dev/null | { cat; echo "0 12 * * * /usr/bin/certbot renew --quiet"; } | sudo crontab -

# Configuration du firewall
print_status "Configuration du firewall..."
sudo ufw allow ssh
sudo ufw allow 'Nginx Full'
sudo ufw --force enable

# Vérification finale
print_status "Vérification du déploiement..."
sleep 5

# Vérifier que le backend fonctionne
if curl -s http://localhost:$BACKEND_PORT/api/health > /dev/null; then
    print_status "✅ Backend opérationnel"
else
    print_error "❌ Problème avec le backend"
fi

# Vérifier que Nginx fonctionne
if sudo systemctl is-active --quiet nginx; then
    print_status "✅ Nginx opérationnel"
else
    print_error "❌ Problème avec Nginx"
fi

# Vérifier que PM2 fonctionne
if pm2 list | grep -q "petalertfrance-backend"; then
    print_status "✅ PM2 opérationnel"
else
    print_error "❌ Problème avec PM2"
fi

print_status "🎉 Déploiement terminé !"
print_status "Votre application est accessible sur : https://$DOMAIN"
print_status "Backend API : https://$DOMAIN/api"
print_status "PM2 Status : pm2 status"
print_status "Logs Nginx : sudo tail -f /var/log/nginx/access.log"
print_status "Logs Backend : pm2 logs petalertfrance-backend"

# Instructions post-déploiement
echo ""
print_warning "📋 Instructions post-déploiement :"
echo "1. Modifiez les mots de passe dans le fichier .env"
echo "2. Configurez votre email dans le script pour les notifications SSL"
echo "3. Testez toutes les fonctionnalités de l'application"
echo "4. Configurez les sauvegardes de la base de données"
echo "5. Surveillez les logs : pm2 logs et sudo tail -f /var/log/nginx/error.log"
echo ""
print_warning "🔑 Pour les mises à jour futures :"
echo "cd $APP_DIR && git pull origin main && npm install && npm run build && pm2 restart petalertfrance-backend"