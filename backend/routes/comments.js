const express = require('express');
const router = express.Router({ mergeParams: true });
const { protect } = require('../middleware/auth');
const { addComment, getComments } = require('../controllers/commentController');

router.use(protect);

router.route('/')
  .get(getComments)
  .post(addComment);

module.exports = router;
