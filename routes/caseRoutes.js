// routes/caseRoutes.js
const express = require('express');
const router = express.Router();
const caseController = require('../controllers/caseController');
const { protect, restrictTo } = require('../middlewares/authMiddleware'); // Leta ulinzi wa JWT hapa

// 1. Kufanya Triage na Kutengeneza Kesi (POST)
// Mamlaka: Manager pekee ndiye mwenye uwezo wa kuidhinisha lalamiko liwe kesi na kupiga risk score (Admin anaruhusiwa pia kwa msaada wa kiufundi)
router.post('/triage', protect, restrictTo('Admin', 'Manager'), caseController.createCaseFromIntake);

// 2. Kuona Kesi Zote (GET)
// Mamlaka: DG, Legal_Unit, Manager, na Investigator (hawa wote wanapaswa kuona kesi kulingana na majukumu yao)
router.get('/', protect, restrictTo('Admin', 'Manager', 'Investigator', 'DG', 'Legal_Unit'), caseController.getAllCases);

module.exports = router;