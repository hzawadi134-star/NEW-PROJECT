const express = require('express');
const router = express.Router();
const caseController = require('../controllers/caseController');
const { protect, restrictTo } = require('../middlewares/authMiddleware'); // Leta ulinzi wa JWT hapa

// 1. Kufanya Triage na Kutengeneza Kesi (POST)
// Mamlaka: Manager pekee ndiye mwenye uwezo wa kuidhinisha lalamiko liwe kesi na kupiga risk score (Admin anaruhusiwa pia kwa msaada wa kiufundi)
router.post('/triage', protect, restrictTo('Admin', 'Manager'), caseController.createCaseFromIntake);

// 2. Kuona Kesi Zote (GET)
// Mamlaka: DG, Legal_Unit, Manager, na Investigator (hawa wote wanapaswa kuona kesi kulingana na majukumu yao)
router.get('/', protect, restrictTo('Admin', 'Manager', 'Investigator', 'DG', 'Legal_Unit', 'Intake_Officer'), caseController.getAllCases);

// 3. Kuona Kesi Moja (GET /:id)
router.get('/:id', protect, caseController.getCaseById);

// 4. Kugawa Kesi (PUT /:id/assign)
router.put('/:id/assign', protect, restrictTo('Admin', 'Manager'), caseController.assignCase);

// 5. Kuboresha Kesi (PUT /:id)
router.put('/:id', protect, restrictTo('Admin', 'Manager', 'Investigator'), caseController.updateCase);

module.exports = router;