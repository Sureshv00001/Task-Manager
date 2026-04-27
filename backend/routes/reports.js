const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const { submitReport, getReports, markAsRead, uploadReportFile } = require('../controllers/reportController');
const upload = require('../middleware/upload');

router.use(protect);

router.post('/', authorize('employee'), submitReport);
router.post('/upload', authorize('employee'), upload.single('file'), uploadReportFile);
router.get('/', getReports);
router.put('/:id/read', authorize('manager', 'admin'), markAsRead);

module.exports = router;
