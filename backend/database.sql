-- Création de la base de données
CREATE DATABASE IF NOT EXISTS petalertfrance CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

USE petalertfrance;

-- Table des utilisateurs
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Table des animaux
CREATE TABLE IF NOT EXISTS pets (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    name VARCHAR(255) NOT NULL,
    type ENUM('dog', 'cat', 'bird', 'rabbit', 'hamster', 'fish', 'other') NOT NULL,
    breed VARCHAR(255),
    age INT,
    color VARCHAR(100),
    description TEXT,
    microchip VARCHAR(50),
    photo VARCHAR(500),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Table des alertes
CREATE TABLE IF NOT EXISTS alerts (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    pet_id INT NOT NULL,
    lost_date DATE NOT NULL,
    location VARCHAR(500),
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    description TEXT,
    contact_phone VARCHAR(20),
    contact_email VARCHAR(255),
    status ENUM('active', 'closed', 'found') DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (pet_id) REFERENCES pets(id) ON DELETE CASCADE
);

-- Index pour améliorer les performances
CREATE INDEX idx_pets_user_id ON pets(user_id);
CREATE INDEX idx_alerts_user_id ON alerts(user_id);
CREATE INDEX idx_alerts_pet_id ON alerts(pet_id);
CREATE INDEX idx_alerts_status ON alerts(status);
CREATE INDEX idx_alerts_location ON alerts(latitude, longitude);

-- Insertion de données de test (optionnel)
INSERT INTO users (name, email, password, phone) VALUES 
('Test User', 'test@example.com', '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj4tbQJ5JQe', '0123456789');

-- Récupérer l'ID de l'utilisateur de test
SET @test_user_id = LAST_INSERT_ID();

-- Insérer des animaux de test
INSERT INTO pets (user_id, name, type, breed, age, color, description) VALUES 
(@test_user_id, 'Max', 'dog', 'Golden Retriever', 3, 'Doré', 'Chien très sociable et joueur'),
(@test_user_id, 'Misty', 'cat', 'Persan', 2, 'Blanc', 'Chat calme et affectueux');

-- Récupérer l'ID du premier animal
SET @test_pet_id = LAST_INSERT_ID();

-- Insérer une alerte de test
INSERT INTO alerts (user_id, pet_id, lost_date, location, latitude, longitude, description, contact_phone, contact_email) VALUES 
(@test_user_id, @test_pet_id, '2024-01-15', 'Parc de la Tête d\'Or, Lyon', 45.7640, 4.8357, 'Perdu dans le parc, très sociable', '0123456789', 'test@example.com'); 