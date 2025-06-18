const express = require('express');
const router = express.Router();
const db = require('../config/database');
const auth = require('../middleware/auth');

// Récupérer toutes les alertes actives (publiques)
router.get('/', async (req, res) => {
  try {
    const [alerts] = await db.execute(`
      SELECT a.*, p.name as pet_name, p.type as pet_type, p.breed as pet_breed, p.color as pet_color, p.photo as pet_photo
      FROM alerts a
      JOIN pets p ON a.pet_id = p.id
      WHERE a.status = 'active'
      ORDER BY a.created_at DESC
    `);

    res.json(alerts);
  } catch (error) {
    console.error('Erreur lors de la récupération des alertes:', error);
    res.status(500).json({ message: 'Erreur lors de la récupération des alertes' });
  }
});

// Récupérer les alertes de l'utilisateur connecté
router.get('/my-alerts', auth, async (req, res) => {
  try {
    const [alerts] = await db.execute(`
      SELECT a.*, p.name as pet_name, p.type as pet_type, p.breed as pet_breed, p.color as pet_color, p.photo as pet_photo
      FROM alerts a
      JOIN pets p ON a.pet_id = p.id
      WHERE a.user_id = ?
      ORDER BY a.created_at DESC
    `, [req.user.userId]);

    res.json(alerts);
  } catch (error) {
    console.error('Erreur lors de la récupération des alertes:', error);
    res.status(500).json({ message: 'Erreur lors de la récupération des alertes' });
  }
});

// Récupérer une alerte spécifique
router.get('/:id', async (req, res) => {
  try {
    const [alerts] = await db.execute(`
      SELECT a.*, p.name as pet_name, p.type as pet_type, p.breed as pet_breed, p.color as pet_color, p.photo as pet_photo
      FROM alerts a
      JOIN pets p ON a.pet_id = p.id
      WHERE a.id = ? AND a.status = 'active'
    `, [req.params.id]);

    if (alerts.length === 0) {
      return res.status(404).json({ message: 'Alerte non trouvée' });
    }

    res.json(alerts[0]);
  } catch (error) {
    console.error('Erreur lors de la récupération de l\'alerte:', error);
    res.status(500).json({ message: 'Erreur lors de la récupération de l\'alerte' });
  }
});

// Créer une nouvelle alerte
router.post('/', auth, async (req, res) => {
  try {
    const {
      pet_id,
      lost_date,
      location,
      latitude,
      longitude,
      description,
      contact_phone,
      contact_email
    } = req.body;

    // Vérifier que l'animal appartient à l'utilisateur
    const [pets] = await db.execute(
      'SELECT id FROM pets WHERE id = ? AND user_id = ?',
      [pet_id, req.user.userId]
    );

    if (pets.length === 0) {
      return res.status(400).json({ message: 'Animal non trouvé ou non autorisé' });
    }

    // Vérifier qu'il n'y a pas déjà une alerte active pour cet animal
    const [existingAlerts] = await db.execute(
      'SELECT id FROM alerts WHERE pet_id = ? AND status = "active"',
      [pet_id]
    );

    if (existingAlerts.length > 0) {
      return res.status(400).json({ message: 'Une alerte active existe déjà pour cet animal' });
    }

    const [result] = await db.execute(`
      INSERT INTO alerts (user_id, pet_id, lost_date, location, latitude, longitude, description, contact_phone, contact_email, status, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'active', NOW())
    `, [req.user.userId, pet_id, lost_date, location, latitude, longitude, description, contact_phone, contact_email]);

    const [newAlert] = await db.execute(`
      SELECT a.*, p.name as pet_name, p.type as pet_type, p.breed as pet_breed, p.color as pet_color, p.photo as pet_photo
      FROM alerts a
      JOIN pets p ON a.pet_id = p.id
      WHERE a.id = ?
    `, [result.insertId]);

    res.status(201).json({
      message: 'Alerte créée avec succès',
      alert: newAlert[0]
    });
  } catch (error) {
    console.error('Erreur lors de la création de l\'alerte:', error);
    res.status(500).json({ message: 'Erreur lors de la création de l\'alerte' });
  }
});

// Fermer une alerte (changer le statut)
router.put('/:id/close', auth, async (req, res) => {
  try {
    const alertId = req.params.id;

    // Vérifier que l'alerte appartient à l'utilisateur
    const [alerts] = await db.execute(
      'SELECT * FROM alerts WHERE id = ? AND user_id = ?',
      [alertId, req.user.userId]
    );

    if (alerts.length === 0) {
      return res.status(404).json({ message: 'Alerte non trouvée' });
    }

    await db.execute(
      'UPDATE alerts SET status = "closed", updated_at = NOW() WHERE id = ? AND user_id = ?',
      [alertId, req.user.userId]
    );

    res.json({ message: 'Alerte fermée avec succès' });
  } catch (error) {
    console.error('Erreur lors de la fermeture de l\'alerte:', error);
    res.status(500).json({ message: 'Erreur lors de la fermeture de l\'alerte' });
  }
});

// Mettre à jour une alerte
router.put('/:id', auth, async (req, res) => {
  try {
    const alertId = req.params.id;
    const {
      lost_date,
      location,
      latitude,
      longitude,
      description,
      contact_phone,
      contact_email
    } = req.body;

    // Vérifier que l'alerte appartient à l'utilisateur
    const [alerts] = await db.execute(
      'SELECT * FROM alerts WHERE id = ? AND user_id = ?',
      [alertId, req.user.userId]
    );

    if (alerts.length === 0) {
      return res.status(404).json({ message: 'Alerte non trouvée' });
    }

    await db.execute(`
      UPDATE alerts SET 
        lost_date = ?, 
        location = ?, 
        latitude = ?, 
        longitude = ?, 
        description = ?, 
        contact_phone = ?, 
        contact_email = ?, 
        updated_at = NOW()
      WHERE id = ? AND user_id = ?
    `, [lost_date, location, latitude, longitude, description, contact_phone, contact_email, alertId, req.user.userId]);

    const [updatedAlert] = await db.execute(`
      SELECT a.*, p.name as pet_name, p.type as pet_type, p.breed as pet_breed, p.color as pet_color, p.photo as pet_photo
      FROM alerts a
      JOIN pets p ON a.pet_id = p.id
      WHERE a.id = ?
    `, [alertId]);

    res.json({
      message: 'Alerte mise à jour avec succès',
      alert: updatedAlert[0]
    });
  } catch (error) {
    console.error('Erreur lors de la mise à jour de l\'alerte:', error);
    res.status(500).json({ message: 'Erreur lors de la mise à jour de l\'alerte' });
  }
});

// Supprimer une alerte
router.delete('/:id', auth, async (req, res) => {
  try {
    const alertId = req.params.id;

    // Vérifier que l'alerte appartient à l'utilisateur
    const [alerts] = await db.execute(
      'SELECT * FROM alerts WHERE id = ? AND user_id = ?',
      [alertId, req.user.userId]
    );

    if (alerts.length === 0) {
      return res.status(404).json({ message: 'Alerte non trouvée' });
    }

    await db.execute(
      'DELETE FROM alerts WHERE id = ? AND user_id = ?',
      [alertId, req.user.userId]
    );

    res.json({ message: 'Alerte supprimée avec succès' });
  } catch (error) {
    console.error('Erreur lors de la suppression de l\'alerte:', error);
    res.status(500).json({ message: 'Erreur lors de la suppression de l\'alerte' });
  }
});

module.exports = router; 