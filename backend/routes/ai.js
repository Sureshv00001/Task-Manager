const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const {
  generateTask,
  summarizeProjectStatus,
  getRiskAlerts
} = require('../controllers/aiController');

router.use(protect);

// Generate task content from title
router.post('/generate-task', authorize('admin', 'manager'), generateTask);

// Summarize a project's status
router.get('/summarize-project/:projectId', authorize('admin', 'manager'), summarizeProjectStatus);

// Get smart risk alerts
router.get('/risk-alerts', getRiskAlerts);

module.exports = router;
