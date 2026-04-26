const ActivityLog = require('../models/ActivityLog');

const logActivity = async ({ task, user, action, details, metadata = {} }) => {
  try {
    await ActivityLog.create({
      task,
      user,
      action,
      details,
      metadata,
    });
  } catch (error) {
    console.error('Activity logging error:', error);
  }
};

module.exports = logActivity;
