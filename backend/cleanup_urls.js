const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();

const Task = mongoose.model('Task', new mongoose.Schema({ fileUrl: String }));

mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/task-manager')
  .then(async () => {
    const tasks = await Task.find({ fileUrl: { $regex: /fl_attachment/ } });
    console.log(`Found ${tasks.length} tasks with fl_attachment in URL.`);
    for (let task of tasks) {
      task.fileUrl = task.fileUrl.replace('fl_attachment/', '');
      await task.save();
      console.log(`Cleaned URL for task: ${task._id}`);
    }
    console.log('Cleanup complete.');
    process.exit(0);
  })
  .catch(err => {
    console.error(err);
    process.exit(1);
  });
