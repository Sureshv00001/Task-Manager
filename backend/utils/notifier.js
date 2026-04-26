const Notification = require('../models/Notification');
const { emitToUser } = require('./socket');

const createNotification = async ({ recipient, sender, type, task, message }) => {
  try {
    const notification = await Notification.create({
      recipient,
      sender,
      type,
      task,
      message,
    });

    const populatedNotification = await Notification.findById(notification._id)
      .populate('sender', 'name')
      .populate('task', 'title');

    emitToUser(recipient, 'notification', populatedNotification);
    
    return populatedNotification;
  } catch (error) {
    console.error('Notification creation error:', error);
  }
};

module.exports = { createNotification };
