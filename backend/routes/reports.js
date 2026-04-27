const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const { submitReport, getReports, markAsRead } = require('../controllers/reportController');

router.use(protect);

router.post('/', authorize('employee'), submitReport);
router.get('/', getReports);
router.put('/:id/read', authorize('manager', 'admin'), markAsRead);

module.exports = router;
