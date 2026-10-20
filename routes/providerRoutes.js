const express = require('express');
const router = express.Router();
const providerController = require('../controllers/providerController');
const { protect } = require('../middlewares/authMiddleware');

router.get('/', protect, providerController.getAllProviders);
router.post('/', protect, providerController.createProvider);

module.exports = router;
