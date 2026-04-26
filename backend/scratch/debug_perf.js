const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });
const User = require('../models/User');
const Task = require('../models/Task');
const { getOnlineUsers } = require('../utils/socket');

async function test() {
  try {
    await mongoose.connect('mongodb://localhost:27017/taskmanager');
    console.log('Connected to DB');

    const employees = await User.find({ role: 'employee' });
    console.log('Found employees:', employees.length);

    const performance = await Promise.all(
      employees.map(async (emp) => {
        console.log('Processing emp:', emp.name);
        const reviewedTasks = await Task.find({ assignedTo: emp._id, status: 'reviewed' });
        const totalTasks = await Task.countDocuments({ assignedTo: emp._id });
        const activeTasks = await Task.countDocuments({ 
          assignedTo: emp._id, 
          status: { $in: ['pending', 'in-progress'] } 
        });
        
        const completedTasks = reviewedTasks.length;
        let avgRating = 0, avgMarks = 0;
        if (completedTasks > 0) {
          avgRating = parseFloat((reviewedTasks.reduce((s, t) => s + (t.rating || 0), 0) / completedTasks).toFixed(1));
          avgMarks = parseFloat((reviewedTasks.reduce((s, t) => s + (t.marks || 0), 0) / completedTasks).toFixed(1));
        }
        
        const completionRate = totalTasks > 0 ? (completedTasks / totalTasks) : 0;
        const score = parseFloat(((avgRating * 20) + (avgMarks * 0.5) + (completionRate * 10)).toFixed(1));

        return {
          _id: emp._id, name: emp.name,
          totalTasks, completedTasks, activeTasks, avgRating, avgMarks, score,
          workload: activeTasks > 2 ? 'busy' : 'free',
        };
      })
    );
    console.log('Performance result count:', performance.length);
    process.exit(0);
  } catch (error) {
    console.error('ERROR IN SCRIPT:', error);
    process.exit(1);
  }
}

test();
