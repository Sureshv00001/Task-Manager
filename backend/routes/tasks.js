const express = require('express');
const router = express.Router();
const commentRoutes = require('./comments');

// Re-route into other resource routers
router.use('/:taskId/comments', commentRoutes);
const { protect, authorize } = require('../middleware/auth');
const { upload } = require('../middleware/upload');
const {
  createTask, getTasks, getTaskById, updateTask, updateTaskStatus,
  uploadTaskFile, submitTask, reviewTask, deleteTask, getDashboardStats, downloadTaskFile,
  getActivityLogs, getPerformanceStats, updateChecklist,
  startTimer, stopTimer, getTimesheets
} = require('../controllers/taskController');

router.use(protect);
router.get('/stats', getDashboardStats);
router.get('/performance', authorize('admin', 'manager'), getPerformanceStats);
router.get('/timesheets', authorize('admin', 'manager'), getTimesheets);
router.get('/:id/download', downloadTaskFile);
router.get('/:id/activity', getActivityLogs);
router.route('/')
  .get(getTasks)
  .post(authorize('admin', 'manager'), createTask);
router.route('/:id')
  .get(getTaskById)
  .put(authorize('admin', 'manager'), updateTask)
  .delete(authorize('admin', 'manager'), deleteTask);
router.put('/:id/status', updateTaskStatus);
router.put('/:id/checklist', updateChecklist);
router.post('/:id/upload', upload.single('file'), uploadTaskFile);
router.put('/:id/submit', authorize('employee'), submitTask);
router.put('/:id/review', authorize('admin', 'manager'), reviewTask);
router.put('/:id/timer/start', authorize('employee'), startTimer);
router.put('/:id/timer/stop', authorize('employee'), stopTimer);

module.exports = router;
