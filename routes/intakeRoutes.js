// routes/intakeRoutes.js
const express = require('express');
const router = express.Router();
const intakeController = require('../controllers/intakeController');
const { protect, restrictTo } = require('../middlewares/authMiddleware'); // Leta ulinzi wa JWT hapa

// 1. Kutuma Lalamiko Jipya (POST)
// Mamlaka: Admin, DG, Legal_Unit, Manager, na Intake_Officer
router.post('/', protect, restrictTo('Admin', 'Intake_Officer', 'Manager', 'DG', 'Legal_Unit'), intakeController.createIntake);

// 2. Kuona Malalamiko Yote (GET)
// Mamlaka: DG, Legal_Unit, Manager, na Intake_Officer wanaweza kuona orodha nzima
router.get('/', protect, restrictTo('Admin', 'Manager', 'Intake_Officer', 'DG', 'Legal_Unit'), intakeController.getAllIntakes);

// 3. Kuhariri Lalamiko (PUT)
// Mamlaka: Admin na Manager pekee ndio wanaweza kuhariri taarifa za lalamiko
router.put('/:id', protect, restrictTo('Admin', 'Manager'), intakeController.updateIntake);

// 4. Kufuta Lalamiko (DELETE)
// Mamlaka: Admin pekee ndiye mwenye uwezo wa kufuta lalamiko kabisa
router.delete('/:id', protect, restrictTo('Admin'), intakeController.deleteIntake);

module.exports = router;