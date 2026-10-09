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

// Njia za API Zilizolindwa kulingana na Matrix
// 1. Kupandisha Ushahidi: Manager na Investigator pekee ndio wenye mamlaka
router.post('/upload', protect, restrictTo('Admin', 'Manager', 'Investigator'), upload.single('file'), evidenceController.uploadEvidence);

// 2. Kuona Ushahidi: DG, Legal Unit, Manager, na Investigator wanaweza kuona ushahidi wa kesi
router.get('/case/:case_id', protect, restrictTo('Admin', 'Manager', 'Investigator', 'DG', 'Legal_Unit'), evidenceController.getEvidenceByCase);

module.exports = router;
