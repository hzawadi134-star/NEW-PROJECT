// routes/authRoutes.js
const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { protect, restrictTo } = require('../middlewares/authMiddleware'); // Hapa tunaleta ulinzi wetu wa JWT

// Njia zilizo wazi (Kila mtu anaweza kusajili au kuingia bila token)
router.post('/register', protect,restrictTo('Admin'), authController.register);
router.post('/login', authController.login);

// Njia zilizolindwa (Ni lazima uwe umeingia mfumo na uwe na jukumu husika)
router.get('/users', protect, restrictTo('Admin', 'Manager'), authController.getAllUsers);
router.put('/users/:id', protect, restrictTo('Admin'), authController.updateUser);
router.delete('/users/:id', protect, restrictTo('Admin'), authController.deleteUser);

module.exports = router;