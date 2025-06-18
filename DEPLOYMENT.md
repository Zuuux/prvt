# 🚀 Guide de Déploiement - Pet Alert France

## 🚀 Déploiement sur Ubuntu 22.04 LTS

Ce guide vous accompagne pour déployer Pet Alert France sur un serveur Ubuntu 22.04 avec Nginx, PM2, MySQL et SSL.

### 📋 Prérequis

- Serveur Ubuntu 22.04 LTS
- Accès SSH avec privilèges sudo
- Nom de domaine configuré (ex: petalertefrance.fr)
- Clé SSH configurée pour GitHub

### 🔧 Installation Automatique

1. **Connectez-vous à votre serveur :**
   ```bash
   ssh utilisateur@votre-serveur
   ```

2. **Téléchargez et exécutez le script de déploiement :**
   ```bash
   wget https://raw.githubusercontent.com/Zuuux/prvt/main/deploy.sh
   chmod +x deploy.sh
   ./deploy.sh
   ```

### 📝 Configuration Manuelle

Si vous préférez une installation manuelle ou si le script automatique échoue :

#### 1. Mise à jour du système
```bash
sudo apt update && sudo apt upgrade -y
```

#### 2. Installation des dépendances
```bash
sudo apt install -y curl wget git nginx certbot python3-certbot-nginx mysql-server
```

#### 3. Installation de Node.js 18.x
```bash
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs
sudo npm install -g pm2
```

#### 4. Configuration de MySQL
```bash
sudo mysql_secure_installation
sudo mysql -e "CREATE DATABASE IF NOT EXISTS petalertfrance CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
sudo mysql -e "CREATE USER IF NOT EXISTS 'petalertfrance'@'localhost' IDENTIFIED BY 'VotreMotDePasseSecurise123!';"
sudo mysql -e "GRANT ALL PRIVILEGES ON petalertfrance.* TO 'petalertfrance'@'localhost';"
sudo mysql -e "FLUSH PRIVILEGES;"
```

#### 5. Clonage du code
```bash
sudo mkdir -p /var/www/petalertfrance
sudo chown $USER:$USER /var/www/petalertfrance
git clone git@github.com:Zuuux/prvt.git /var/www/petalertfrance
cd /var/www/petalertfrance
```

#### 6. Configuration des variables d'environnement
```bash
# Backend
cat > backend/.env << EOF
NODE_ENV=production
PORT=3002
DB_HOST=localhost
DB_USER=petalertfrance
DB_PASSWORD=VotreMotDePasseSecurise123!
DB_NAME=petalertfrance
JWT_SECRET=VotreJWTSecretTresSecurise123!
CORS_ORIGIN=https://petalertefrance.fr
EOF

# Frontend
cat > .env.production << EOF
VITE_API_URL=https://petalertefrance.fr/api
EOF
```

#### 7. Installation des dépendances et build
```bash
# Backend
cd backend
npm install
cd ..

# Frontend
npm install
npm run build
```

#### 8. Configuration PM2
```bash
cat > ecosystem.config.js << EOF
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
      PORT: 3002
    }
  }]
};
EOF

pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

#### 9. Configuration Nginx
```bash
sudo tee /etc/nginx/sites-available/petalertefrance.fr > /dev/null << EOF
server {
    listen 80;
    server_name petalertefrance.fr www.petalertefrance.fr;
    return 301 https://\$server_name\$request_uri;
}

server {
    listen 443 ssl http2;
    server_name petalertefrance.fr www.petalertefrance.fr;
    
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
        proxy_pass http://localhost:3002/;
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
    gzip_proxied expired no-cache no-store private must-revalidate auth;
    gzip_types text/plain text/css text/xml text/javascript application/x-javascript application/xml+rss;
}
EOF

sudo ln -sf /etc/nginx/sites-available/petalertefrance.fr /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl restart nginx
sudo systemctl enable nginx
```

#### 10. Configuration SSL
```bash
sudo certbot --nginx -d petalertefrance.fr -d www.petalertefrance.fr --non-interactive --agree-tos --email votre-email@example.com
sudo crontab -l 2>/dev/null | { cat; echo "0 12 * * * /usr/bin/certbot renew --quiet"; } | sudo crontab -
```

#### 11. Configuration du firewall
```bash
sudo ufw allow ssh
sudo ufw allow 'Nginx Full'
sudo ufw --force enable
```

### 🔄 Mises à jour

Pour mettre à jour l'application :

```bash
# Utiliser le script automatique
./update.sh

# Ou manuellement
cd /var/www/petalertfrance
git pull origin main
npm install
cd backend && npm install && cd ..
npm run build
pm2 restart petalertfrance-backend
```

### 💾 Sauvegardes

Le script de sauvegarde automatique est configuré pour :
- Sauvegarder la base de données quotidiennement
- Conserver 7 jours d'historique
- Compresser les sauvegardes

```bash
# Sauvegarde manuelle
./backup.sh

# Vérifier les sauvegardes
ls -la /var/backups/petalertfrance/
```

### 🔍 Surveillance

#### Logs
```bash
# Logs de l'application
pm2 logs petalertfrance-backend

# Logs Nginx
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log

# Logs MySQL
sudo tail -f /var/log/mysql/error.log
```

#### Statut des services
```bash
# Statut PM2
pm2 status

# Statut Nginx
sudo systemctl status nginx

# Statut MySQL
sudo systemctl status mysql
```

### 🛠️ Dépannage

#### Problèmes courants

1. **Backend ne démarre pas :**
   ```bash
   pm2 logs petalertfrance-backend
   cd /var/www/petalertfrance/backend
   node server.js
   ```

2. **Erreurs de base de données :**
   ```bash
   sudo mysql -u petalertfrance -p petalertfrance
   ```

3. **Problèmes SSL :**
   ```bash
   sudo certbot certificates
   sudo certbot renew --dry-run
   ```

4. **Problèmes Nginx :**
   ```bash
   sudo nginx -t
   sudo systemctl restart nginx
   ```

### 🔐 Sécurité

- Changez tous les mots de passe par défaut
- Configurez un firewall approprié
- Surveillez régulièrement les logs
- Maintenez le système à jour
- Utilisez des certificats SSL valides

### 📞 Support

En cas de problème :
1. Vérifiez les logs
2. Consultez ce guide
3. Testez les fonctionnalités une par une
4. Restaurez une sauvegarde si nécessaire

---

**Note :** Remplacez `petalertefrance.fr` par votre nom de domaine et `votre-email@example.com` par votre email pour les notifications SSL.

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