// routes/decisionRoutes.js
const express = require('express');
const router = express.Router(); // Mstari huu ni muhimu utangazwe hivi herufi ndogo!
const decisionController = require('../controllers/decisionController');
const { protect, restrictTo } = require('../middlewares/authMiddleware');

// 1. Toa Hukumu / Funga Kesi (POST)
router.post('/submit', protect, restrictTo('Admin', 'Manager', 'Investigator', 'Legal_Unit'), decisionController.createDecision);
router.post('/', protect, restrictTo('Admin', 'Manager', 'Investigator', 'Legal_Unit'), decisionController.createDecision);

// 2. Kuona Hukumu ya Kesi Maalum (GET)
router.get('/case/:case_id', protect, restrictTo('Admin', 'Manager', 'Investigator', 'DG', 'Legal_Unit'), decisionController.getCaseDecision);

// 3. Kuona Maamuzi Yote Yaliyowasilishwa (GET ALL)
router.get('/', protect, restrictTo('Admin', 'Manager', 'DG', 'Legal_Unit'), decisionController.getAllDecisions);

// 4. Kuhariri Maamuzi/Hukumu (PUT)
router.put('/:id', protect, restrictTo('Admin', 'Manager'), decisionController.updateDecision);

// 5. Kufuta Maamuzi (DELETE)
router.delete('/:id', protect, restrictTo('Admin', 'Manager'), decisionController.deleteDecision);

module.exports = router;
