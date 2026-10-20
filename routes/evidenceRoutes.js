// routes/evidenceRoutes.js
const express = require('express');
const router = express.Router();
const multer = require('multer');
const evidenceController = require('../controllers/evidenceController');
const { protect, restrictTo } = require('../middlewares/authMiddleware'); // Leta ulinzi wa JWT na Matrix hapa

// Kusanidi jinsi multer itakavyohifadhi faili kwenye server
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/'); // Faili zitaenda kwenye folder la uploads
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + '-' + file.originalname);
    }
});

const upload = multer({ storage: storage });

// 1. Kupandisha Ushahidi: Admin, Manager, Investigator, Intake_Officer
router.post('/upload', protect, restrictTo('Admin', 'Manager', 'Investigator', 'Intake_Officer'), upload.single('file'), evidenceController.uploadEvidence);
router.post('/', protect, restrictTo('Admin', 'Manager', 'Investigator', 'Intake_Officer'), upload.single('file'), evidenceController.uploadEvidence);

// 2. Kuona Ushahidi wa Kesi Maalum
router.get('/case/:case_id', protect, restrictTo('Admin', 'Manager', 'Investigator', 'DG', 'Legal_Unit', 'Intake_Officer'), evidenceController.getEvidenceByCase);

// 3. Kuona Ushahidi Wote
router.get('/', protect, restrictTo('Admin', 'Manager', 'Investigator', 'DG', 'Legal_Unit', 'Intake_Officer'), evidenceController.getAllEvidence);

// 4. Kufuta Ushahidi
router.delete('/:id', protect, restrictTo('Admin', 'Manager', 'Investigator'), evidenceController.deleteEvidence);

module.exports = router;
