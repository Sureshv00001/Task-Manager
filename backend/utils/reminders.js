const cron = require('node-cron');
const Task = require('../models/Task');
const User = require('../models/User');
const { sendEmail } = require('./email');

const setupReminders = () => {
  // Run every day at 9 AM
  cron.schedule('0 9 * * *', async () => {
    console.log('Running daily task reminders check...');
    try {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(23, 59, 59, 999);

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      // Find tasks due within the next 24-48 hours that are not completed
      const pendingTasks = await Task.find({
        deadline: { $gte: today, $lte: tomorrow },
        status: { $in: ['pending', 'in-progress'] }
      }).populate('assignedTo', 'name email');

      for (const task of pendingTasks) {
        if (task.assignedTo && task.assignedTo.email) {
          const mailOptions = {
            from: process.env.EMAIL_USER,
            to: task.assignedTo.email,
            subject: `Reminder: Task "${task.title}" is due soon`,
            html: `
              <div style="font-family: sans-serif; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
                <h2 style="color: #2563eb;">Task Reminder</h2>
                <p>Hello ${task.assignedTo.name},</p>
                <p>This is a friendly reminder that the following task is due soon:</p>
                <div style="background: #f8fafc; padding: 15px; border-radius: 8px; margin: 20px 0;">
                  <h3 style="margin: 0; color: #1e293b;">${task.title}</h3>
                  <p style="margin: 5px 0; color: #64748b;">Due Date: ${task.deadline.toDateString()}</p>
                </div>
                <p>Please log in to the Task Manager to complete your work.</p>
                <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}" style="background: #2563eb; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">View Dashboard</a>
              </div>
            `
          };
          await sendEmail(mailOptions);
          console.log(`Reminder sent to ${task.assignedTo.email} for task ${task._id}`);
        }
      }
    } catch (error) {
      console.error('Error in task reminders cron:', error);
    }
  });
};

module.exports = setupReminders;
