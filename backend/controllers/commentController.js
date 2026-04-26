const Comment = require('../models/Comment');
const Task = require('../models/Task');
const User = require('../models/User');
const { createNotification } = require('../utils/notifier');
const logActivity = require('../utils/logger');

exports.addComment = async (req, res) => {
  try {
    const { content } = req.body;
    const task = await Task.findById(req.params.taskId);
    
    if (!task) return res.status(404).json({ message: 'Task not found' });

    const comment = await Comment.create({
      task: task._id,
      user: req.user._id,
      content,
    });

    const populatedComment = await Comment.findById(comment._id).populate('user', 'name avatar');

    // Log activity
    await logActivity({
      task: task._id,
      user: req.user._id,
      action: 'comment_added',
      details: 'Added a new comment',
    });

    // Notify other parties
    const recipient = req.user._id.toString() === task.assignedTo.toString() 
      ? task.assignedBy 
      : task.assignedTo;

    await createNotification({
      recipient,
      sender: req.user._id,
      type: 'comment_added',
      task: task._id,
      message: `${req.user.name} commented on task: ${task.title}`
    });

    // Handle @mentions
    const mentionRegex = /@(\w+)/g;
    const mentions = content.match(mentionRegex);
    if (mentions) {
      for (const mention of mentions) {
        const userName = mention.substring(1);
        const mentionedUser = await User.findOne({ name: { $regex: new RegExp(`^${userName}$`, 'i') } });
        
        if (mentionedUser && mentionedUser._id.toString() !== req.user._id.toString()) {
          await createNotification({
            recipient: mentionedUser._id,
            sender: req.user._id,
            type: 'mention',
            task: task._id,
            message: `${req.user.name} mentioned you in a comment on task: ${task.title}`
          });
        }
      }
    }

    res.status(201).json(populatedComment);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.getComments = async (req, res) => {
  try {
    const comments = await Comment.find({ task: req.params.taskId })
      .populate('user', 'name avatar')
      .sort({ createdAt: 1 });
    res.json(comments);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};
