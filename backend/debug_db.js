const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config();

const TaskSchema = new mongoose.Schema({
  fileUrl: String,
  title: String,
  createdAt: Date
});

const Task = mongoose.model('Task', TaskSchema);

mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/task-manager')
  .then(async () => {
    const task = await Task.findOne({ fileUrl: { $exists: true } }).sort({ createdAt: -1 });
    if (task) {
      console.log('--- TASK DATA ---');
      console.log('Title:', task.title);
      console.log('URL:', task.fileUrl);
      console.log('--- END ---');
    } else {
      console.log('No tasks with files found.');
    }
    process.exit(0);
  })
  .catch(err => {
    console.error(err);
    process.exit(1);
  });
