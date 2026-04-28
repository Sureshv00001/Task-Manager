const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const { memoryUpload } = require('../middleware/upload');
const {
  createUser, getUsers, getUserById, updateUser, deleteUser, getEmployees, getManagers, getPerformance,
  updateProfile, updatePassword, uploadAvatar
} = require('../controllers/userController');

router.use(protect);
router.get('/employees', authorize('admin', 'manager'), getEmployees);
router.get('/managers', authorize('admin', 'manager'), getManagers);
router.get('/performance', authorize('admin', 'manager'), getPerformance);
router.put('/profile', updateProfile);
router.put('/update-password', updatePassword);
router.post('/upload-avatar', memoryUpload.single('avatar'), uploadAvatar);
router.route('/')
  .get(authorize('admin', 'manager'), getUsers)
  .post(authorize('admin', 'manager'), createUser);
router.route('/:id')
  .get(authorize('admin', 'manager'), getUserById)
  .put(authorize('admin', 'manager'), updateUser)
  .delete(authorize('admin', 'manager'), deleteUser);

module.exports = router;
