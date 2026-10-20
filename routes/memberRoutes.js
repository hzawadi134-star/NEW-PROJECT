const express = require('express');
const router = express.Router();
const memberController = require('../controllers/memberController');
const { protect } = require('../middlewares/authMiddleware');

router.get('/', protect, memberController.getAllMembers);
router.post('/', protect, memberController.createMember);

module.exports = router;
