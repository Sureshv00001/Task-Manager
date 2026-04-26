const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const {
  createProject,
  getProjects,
  getProjectById,
  updateProject,
  deleteProject
} = require('../controllers/projectController');

router.use(protect);

router.route('/')
  .get(getProjects)
  .post(authorize('admin', 'manager'), createProject);

router.route('/:id')
  .get(getProjectById)
  .put(authorize('admin', 'manager'), updateProject)
  .delete(authorize('admin', 'manager'), deleteProject);

module.exports = router;
