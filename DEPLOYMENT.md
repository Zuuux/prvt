# 🚀 Guide de Déploiement - Pet Alert France

## 📋 Prérequis

- Serveur Ubuntu 22.04 LTS
- Nom de domaine configuré (petalertefrance.fr)
- Accès SSH au serveur
- Droits sudo

## 🔧 Installation Automatique

### 1. Préparation du serveur

```bash
# Se connecter au serveur
ssh utilisateur@votre-serveur

# Rendre le script exécutable
chmod +x deploy.sh

# Exécuter le script de déploiement
./deploy.sh
```

### 2. Configuration manuelle post-déploiement

#### Modifier les mots de passe
```bash
# Éditer le fichier .env du backend
nano /var/www/petalertfrance/backend/.env

# Changer les mots de passe :
# DB_PASSWORD=VotreNouveauMotDePasseSecurise123!
# JWT_SECRET=VotreNouveauJWTSecretTresSecurise123!
```

#### Configurer l'email pour SSL
```bash
# Éditer le script de déploiement
nano deploy.sh

# Remplacer votre-email@example.com par votre vrai email
sudo certbot --nginx -d $DOMAIN -d www.$DOMAIN --non-interactive --agree-tos --email votre-vrai-email@example.com
```

## 🔄 Déploiement Manuel

### 1. Installation des dépendances système

```bash
# Mise à jour du système
sudo apt update && sudo apt upgrade -y

# Installation des packages nécessaires
sudo apt install -y curl wget git nginx certbot python3-certbot-nginx mysql-server

# Installation de Node.js 18.x
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Installation de PM2
sudo npm install -g pm2
```

### 2. Configuration de MySQL

```bash
# Sécuriser MySQL
sudo mysql_secure_installation

# Créer la base de données et l'utilisateur
sudo mysql -e "CREATE DATABASE IF NOT EXISTS petalertfrance CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
sudo mysql -e "CREATE USER IF NOT EXISTS 'petalertfrance'@'localhost' IDENTIFIED BY 'VotreMotDePasseSecurise123!';"
sudo mysql -e "GRANT ALL PRIVILEGES ON petalertfrance.* TO 'petalertfrance'@'localhost';"
sudo mysql -e "FLUSH PRIVILEGES;"
```

### 3. Déploiement de l'application

```bash
# Créer le répertoire de l'application
sudo mkdir -p /var/www/petalertfrance
sudo chown $USER:$USER /var/www/petalertfrance

# Copier les fichiers de l'application
# (via Git, SCP, ou autre méthode)

# Installer les dépendances
cd /var/www/petalertfrance/backend
npm install

cd /var/www/petalertfrance
npm install

# Build du frontend
npm run build
```

### 4. Configuration de l'environnement

```bash
# Backend .env
cat > /var/www/petalertfrance/backend/.env << EOF
NODE_ENV=production
PORT=3001
DB_HOST=localhost
DB_USER=petalertfrance
DB_PASSWORD=VotreMotDePasseSecurise123!
DB_NAME=petalertfrance
JWT_SECRET=VotreJWTSecretTresSecurise123!
CORS_ORIGIN=https://petalertefrance.fr
EOF

# Frontend .env.production
cat > /var/www/petalertfrance/.env.production << EOF
VITE_API_URL=https://petalertefrance.fr/api
EOF
```

### 5. Configuration PM2

```bash
# Créer le fichier ecosystem.config.js
cat > /var/www/petalertfrance/ecosystem.config.js << EOF
module.exports = {
  apps: [{
    name: 'petalertfrance-backend',
    script: './backend/server.js',
    cwd: '/var/www/petalertfrance',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'production',
      PORT: 3001
    }
  }]
};
EOF

# Démarrer l'application
cd /var/www/petalertfrance
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

### 6. Configuration Nginx

```bash
# Créer la configuration Nginx
sudo tee /etc/nginx/sites-available/petalertfrance.fr > /dev/null << EOF
server {
    listen 80;
    server_name petalertefrance.fr www.petalertfrance.fr;
    return 301 https://\$server_name\$request_uri;
}

server {
    listen 443 ssl http2;
    server_name petalertefrance.fr www.petalertfrance.fr;
    
    # Frontend
    location / {
        root /var/www/petalertfrance/dist;
        try_files \$uri \$uri/ /index.html;
        
        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
        }
    }
    
    # API Backend
    location /api/ {
        proxy_pass http://localhost:3001/;
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
    
    # Gzip
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_proxied expired no-cache no-store private must-revalidate auth;
    gzip_types text/plain text/css text/xml text/javascript application/x-javascript application/xml+rss;
}
EOF

# Activer le site
sudo ln -sf /etc/nginx/sites-available/petalertfrance.fr /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default

# Tester et redémarrer Nginx
sudo nginx -t
sudo systemctl restart nginx
sudo systemctl enable nginx
```

### 7. Configuration SSL

```bash
# Obtenir le certificat SSL
sudo certbot --nginx -d petalertefrance.fr -d www.petalertfrance.fr --non-interactive --agree-tos --email votre-email@example.com

# Configurer le renouvellement automatique
sudo crontab -l 2>/dev/null | { cat; echo "0 12 * * * /usr/bin/certbot renew --quiet"; } | sudo crontab -
```

### 8. Configuration du firewall

```bash
sudo ufw allow ssh
sudo ufw allow 'Nginx Full'
sudo ufw --force enable
```

## 🔧 Maintenance

### Sauvegardes automatiques

```bash
# Rendre le script exécutable
chmod +x backup.sh

# Ajouter au crontab pour une sauvegarde quotidienne
crontab -e
# Ajouter cette ligne :
0 2 * * * /chemin/vers/backup.sh >> /var/log/backup.log 2>&1
```

### Commandes utiles

```bash
# Vérifier le statut de l'application
pm2 status
pm2 logs petalertfrance-backend

# Redémarrer l'application
pm2 restart petalertfrance-backend

# Vérifier les logs Nginx
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log

# Vérifier l'espace disque
df -h

# Vérifier l'utilisation mémoire
free -h

# Vérifier les processus
htop
```

### Mise à jour de l'application

```bash
# Arrêter l'application
pm2 stop petalertfrance-backend

# Sauvegarder la base de données
./backup.sh

# Mettre à jour le code
cd /var/www/petalertfrance
git pull origin main

# Installer les nouvelles dépendances
cd backend && npm install
cd .. && npm install

# Build du frontend
npm run build

# Redémarrer l'application
pm2 start petalertfrance-backend
pm2 save
```

## 🔍 Monitoring

### Vérification de la santé de l'application

```bash
# Vérifier l'API
curl https://petalertefrance.fr/api/health

# Vérifier le frontend
curl -I https://petalertefrance.fr

# Vérifier la base de données
mysql -u petalertfrance -p petalertfrance -e "SELECT COUNT(*) as alerts_count FROM alerts WHERE status = 'active';"
```

### Alertes et notifications

Configurez des alertes pour :
- Espace disque > 80%
- Mémoire utilisée > 90%
- CPU > 80%
- Erreurs dans les logs
- Certificat SSL expirant

## 🛠️ Dépannage

### Problèmes courants

1. **Application ne démarre pas**
   ```bash
   pm2 logs petalertfrance-backend
   # Vérifier les erreurs dans les logs
   ```

2. **Erreurs de base de données**
   ```bash
   sudo systemctl status mysql
   sudo tail -f /var/log/mysql/error.log
   ```

3. **Problèmes Nginx**
   ```bash
   sudo nginx -t
   sudo systemctl status nginx
   sudo tail -f /var/log/nginx/error.log
   ```

4. **Certificat SSL expiré**
   ```bash
   sudo certbot renew --dry-run
   sudo certbot renew
   ```

## 📞 Support

En cas de problème :
1. Vérifiez les logs : `pm2 logs` et `sudo tail -f /var/log/nginx/error.log`
2. Vérifiez l'espace disque : `df -h`
3. Vérifiez la mémoire : `free -h`
4. Vérifiez les processus : `htop`

## 🔒 Sécurité

- Changez tous les mots de passe par défaut
- Maintenez le système à jour : `sudo apt update && sudo apt upgrade`
- Surveillez les logs pour des activités suspectes
- Configurez des sauvegardes régulières
- Utilisez un firewall : `sudo ufw status` 