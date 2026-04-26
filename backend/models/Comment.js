const mongoose = require('mongoose');

const commentSchema = new mongoose.Schema(
  {
    task: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Task',
      required: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    content: {
      type: String,
      required: [true, 'Comment content is required'],
      maxlength: 1000,
    },
    attachments: [
      {
        url: String,
        name: String,
        fileType: String,
      },
    ],
  },
  { timestamps: true }
);

module.exports = mongoose.model('Comment', commentSchema);
