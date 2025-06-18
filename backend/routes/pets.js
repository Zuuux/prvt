const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const router = express.Router();
const db = require('../config/database');
const auth = require('../middleware/auth');

// Configuration de multer pour l'upload d'images
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'pet-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB max
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Seuls les fichiers image sont autorisés'));
    }
  }
});

// Récupérer tous les animaux de l'utilisateur
router.get('/my-pets', auth, async (req, res) => {
  try {
    const [pets] = await db.execute(
      'SELECT * FROM pets WHERE user_id = ? ORDER BY created_at DESC',
      [req.user.userId]
    );

    res.json(pets);
  } catch (error) {
    console.error('Erreur lors de la récupération des animaux:', error);
    res.status(500).json({ message: 'Erreur lors de la récupération des animaux' });
  }
});

// Récupérer un animal spécifique
router.get('/:id', auth, async (req, res) => {
  try {
    const [pets] = await db.execute(
      'SELECT * FROM pets WHERE id = ? AND user_id = ?',
      [req.params.id, req.user.userId]
    );

    if (pets.length === 0) {
      return res.status(404).json({ message: 'Animal non trouvé' });
    }

    res.json(pets[0]);
  } catch (error) {
    console.error('Erreur lors de la récupération de l\'animal:', error);
    res.status(500).json({ message: 'Erreur lors de la récupération de l\'animal' });
  }
});

// Ajouter un nouvel animal
router.post('/', auth, upload.single('photo'), async (req, res) => {
  try {
    const {
      name,
      type,
      breed,
      age,
      color,
      description,
      microchip
    } = req.body;

    let photoPath = null;
    if (req.file) {
      photoPath = `/uploads/${req.file.filename}`;
    }

    const [result] = await db.execute(
      `INSERT INTO pets (user_id, name, type, breed, age, color, description, microchip, photo, created_at) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
      [req.user.userId, name, type, breed, age || null, color, description, microchip, photoPath]
    );

    const [newPet] = await db.execute(
      'SELECT * FROM pets WHERE id = ?',
      [result.insertId]
    );

    res.status(201).json({
      message: 'Animal ajouté avec succès',
      pet: newPet[0]
    });
  } catch (error) {
    console.error('Erreur lors de l\'ajout de l\'animal:', error);
    res.status(500).json({ message: 'Erreur lors de l\'ajout de l\'animal' });
  }
});

// Mettre à jour un animal
router.put('/:id', auth, upload.single('photo'), async (req, res) => {
  try {
    const petId = req.params.id;
    const {
      name,
      type,
      breed,
      age,
      color,
      description,
      microchip
    } = req.body;

    // Vérifier que l'animal appartient à l'utilisateur
    const [existingPets] = await db.execute(
      'SELECT * FROM pets WHERE id = ? AND user_id = ?',
      [petId, req.user.userId]
    );

    if (existingPets.length === 0) {
      return res.status(404).json({ message: 'Animal non trouvé' });
    }

    let photoPath = existingPets[0].photo;
    if (req.file) {
      // Supprimer l'ancienne photo si elle existe
      if (existingPets[0].photo) {
        const oldPhotoPath = path.join(__dirname, '..', existingPets[0].photo);
        if (fs.existsSync(oldPhotoPath)) {
          fs.unlinkSync(oldPhotoPath);
        }
      }
      photoPath = `/uploads/${req.file.filename}`;
    }

    await db.execute(
      `UPDATE pets SET name = ?, type = ?, breed = ?, age = ?, color = ?, 
       description = ?, microchip = ?, photo = ?, updated_at = NOW() 
       WHERE id = ? AND user_id = ?`,
      [name, type, breed, age || null, color, description, microchip, photoPath, petId, req.user.userId]
    );

    const [updatedPet] = await db.execute(
      'SELECT * FROM pets WHERE id = ?',
      [petId]
    );

    res.json({
      message: 'Animal mis à jour avec succès',
      pet: updatedPet[0]
    });
  } catch (error) {
    console.error('Erreur lors de la mise à jour de l\'animal:', error);
    res.status(500).json({ message: 'Erreur lors de la mise à jour de l\'animal' });
  }
});

// Supprimer un animal
router.delete('/:id', auth, async (req, res) => {
  try {
    const petId = req.params.id;

    // Vérifier que l'animal appartient à l'utilisateur
    const [existingPets] = await db.execute(
      'SELECT * FROM pets WHERE id = ? AND user_id = ?',
      [petId, req.user.userId]
    );

    if (existingPets.length === 0) {
      return res.status(404).json({ message: 'Animal non trouvé' });
    }

    // Supprimer la photo si elle existe
    if (existingPets[0].photo) {
      const photoPath = path.join(__dirname, '..', existingPets[0].photo);
      if (fs.existsSync(photoPath)) {
        fs.unlinkSync(photoPath);
      }
    }

    await db.execute(
      'DELETE FROM pets WHERE id = ? AND user_id = ?',
      [petId, req.user.userId]
    );

    res.json({ message: 'Animal supprimé avec succès' });
  } catch (error) {
    console.error('Erreur lors de la suppression de l\'animal:', error);
    res.status(500).json({ message: 'Erreur lors de la suppression de l\'animal' });
  }
});

module.exports = router; 