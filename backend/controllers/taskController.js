const Task = require('../models/Task');
const User = require('../models/User');
const path = require('path');
const fs = require('fs');
const { sendTaskAssignedEmail, sendTaskSubmittedEmail } = require('../utils/email');
const { createNotification } = require('../utils/notifier');
const logActivity = require('../utils/logger');


// Create task
exports.createTask = async (req, res) => {
  try {
    const { title, description, assignedTo, deadline, priority, tags, project, checklists } = req.body;
    const employee = await User.findById(assignedTo);
    if (!employee || employee.role !== 'employee') {
      return res.status(400).json({ message: 'Can only assign tasks to employees' });
    }
    const task = await Task.create({
      title, description, assignedTo, deadline, priority, tags, checklists,
      assignedBy: req.user._id,
      ...(project && { project }),
    });
    const populated = await Task.findById(task._id).populate('assignedBy', 'name email').populate('assignedTo', 'name email');
    
    // Activity log
    await logActivity({
      task: task._id,
      user: req.user._id,
      action: 'task_created',
      details: `Task "${task.title}" created and assigned to ${employee.name}`,
    });

    // Send email notification
    sendTaskAssignedEmail(employee.email, employee.name, task, req.user.name);
    
    // Create real-time notification
    await createNotification({
      recipient: employee._id,
      sender: req.user._id,
      type: 'task_assigned',
      task: task._id,
      message: `You have been assigned a new task: ${task.title}`
    });

    res.status(201).json(populated);
  } catch (error) {
    console.error('Create task error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get all tasks with filters, pagination
exports.getTasks = async (req, res) => {
  try {
    const { page = 1, limit = 10, status, assignedTo, search, deadline, sortBy = 'createdAt', order = 'desc' } = req.query;
    const query = {};
    // Role-based filtering
    if (req.user.role === 'employee') {
      query.assignedTo = req.user._id;
    }
    if (status) query.status = status;
    if (assignedTo) query.assignedTo = assignedTo;
    if (deadline) {
      query.deadline = { $lte: new Date(deadline) };
    }
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
      ];
    }
    const total = await Task.countDocuments(query);
    const tasks = await Task.find(query)
      .populate('assignedBy', 'name email')
      .populate('assignedTo', 'name email')
      .sort({ [sortBy]: order === 'asc' ? 1 : -1 })
      .skip((parseInt(page) - 1) * parseInt(limit))
      .limit(parseInt(limit));
    res.json({ tasks, total, page: parseInt(page), pages: Math.ceil(total / parseInt(limit)) });
  } catch (error) {
    console.error('Get tasks error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get task by ID
exports.getTaskById = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id)
      .populate('assignedBy', 'name email')
      .populate('assignedTo', 'name email');
    if (!task) return res.status(404).json({ message: 'Task not found' });
    // Employees can only see their own tasks
    if (req.user.role === 'employee' && task.assignedTo._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to view this task' });
    }
    res.json(task);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

// Update task (admin/manager only - for editing title, desc, deadline, assignee)
exports.updateTask = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ message: 'Task not found' });
    if (req.user.role === 'manager' && task.assignedBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to update this task' });
    }
    const { title, description, assignedTo, deadline } = req.body;
    if (title) task.title = title;
    if (description) task.description = description;
    if (assignedTo) task.assignedTo = assignedTo;
    if (deadline) task.deadline = deadline;
    await task.save();
    const populated = await Task.findById(task._id).populate('assignedBy', 'name email').populate('assignedTo', 'name email');
    res.json(populated);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

// Update task status (employee: pending -> in-progress -> completed)
exports.updateTaskStatus = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ message: 'Task not found' });
    if (req.user.role === 'employee' && task.assignedTo.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to update this task' });
    }
    const { status } = req.body;
    const validTransitions = {
      'pending': ['in-progress'],
      'in-progress': ['completed'],
      'completed': ['reviewed'],
    };
    if (!validTransitions[task.status] || !validTransitions[task.status].includes(status)) {
      return res.status(400).json({ message: `Cannot change status from '${task.status}' to '${status}'` });
    }
    // Only admin/manager can set to 'reviewed'
    if (status === 'reviewed' && req.user.role === 'employee') {
      return res.status(403).json({ message: 'Only assigners can mark tasks as reviewed' });
    }
    task.status = status;
    if (status === 'completed') task.submittedAt = new Date();
    await task.save();

    // Activity log
    await logActivity({
      task: task._id,
      user: req.user._id,
      action: 'status_updated',
      details: `Status updated to ${status}`,
      metadata: { oldStatus: task.status, newStatus: status }
    });

    const populated = await Task.findById(task._id).populate('assignedBy', 'name email').populate('assignedTo', 'name email');
    res.json(populated);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

// Upload file for task (employee)
exports.uploadTaskFile = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ message: 'Task not found' });
    const isAssignee = task.assignedTo.toString() === req.user._id.toString();
    const isAssigner = task.assignedBy.toString() === req.user._id.toString();
    const isAdmin = req.user.role === 'admin';
    
    if (!isAssignee && !isAssigner && !isAdmin) {
      return res.status(403).json({ message: 'Not authorized' });
    }
    if (!req.file) return res.status(400).json({ message: 'No file uploaded' });
    // Store the local file path in attachments array
    task.attachments.push({
      url: req.file.path,
      name: req.file.originalname,
      fileType: req.file.mimetype,
      uploadedByRole: req.user.role,
      uploadedByName: req.user.name
    });
    
    await task.save();
    const populated = await Task.findById(task._id).populate('assignedBy', 'name email').populate('assignedTo', 'name email');
    res.json(populated);
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ message: 'File upload failed' });
  }
};

// Submit task (employee marks completed and notifies assigner)
exports.submitTask = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id).populate('assignedBy', 'name email').populate('assignedTo', 'name email');
    if (!task) return res.status(404).json({ message: 'Task not found' });
    if (task.assignedTo._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }
    if (task.status !== 'in-progress' && task.status !== 'pending') {
      return res.status(400).json({ message: 'Task must be in-progress to submit' });
    }
    task.status = 'completed';
    task.submittedAt = new Date();
    await task.save();

    // Activity log
    await logActivity({
      task: task._id,
      user: req.user._id,
      action: 'task_submitted',
      details: `Task submitted for review`,
    });

    // Notify assigner
    sendTaskSubmittedEmail(task.assignedBy.email, task.assignedBy.name, task, task.assignedTo.name);
    
    // Create real-time notification
    await createNotification({
      recipient: task.assignedBy._id,
      sender: req.user._id,
      type: 'task_submitted',
      task: task._id,
      message: `${req.user.name} has submitted the task: ${task.title}`
    });

    res.json(task);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

// Review task (admin/manager rates and gives feedback)
exports.reviewTask = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ message: 'Task not found' });
    if (req.user.role === 'manager' && task.assignedBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to review this task' });
    }
    if (task.status !== 'completed') {
      return res.status(400).json({ message: 'Task must be completed before review' });
    }
    const { rating, marks, feedback } = req.body;
    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ message: 'Rating must be between 1 and 5' });
    }
    if (marks === undefined || marks < 0 || marks > 100) {
      return res.status(400).json({ message: 'Marks must be between 0 and 100' });
    }
    task.rating = rating;
    task.marks = marks;
    task.feedback = feedback || '';
    task.status = 'reviewed';
    task.reviewedAt = new Date();
    await task.save();

    // Activity log
    await logActivity({
      task: task._id,
      user: req.user._id,
      action: 'task_reviewed',
      details: `Task reviewed with rating ${rating} and marks ${marks}`,
      metadata: { rating, marks, feedback }
    });

    const populated = await Task.findById(task._id).populate('assignedBy', 'name email').populate('assignedTo', 'name email');
    
    // Create real-time notification
    await createNotification({
      recipient: task.assignedTo._id,
      sender: req.user._id,
      type: 'task_reviewed',
      task: task._id,
      message: `Your task "${task.title}" has been reviewed by ${req.user.name}`
    });

    res.json(populated);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

// Delete task
exports.deleteTask = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ message: 'Task not found' });
    if (req.user.role === 'manager' && task.assignedBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to delete this task' });
    }
    
    // Delete local files if they exist
    if (task.attachments && task.attachments.length > 0) {
      task.attachments.forEach(attachment => {
        if (attachment.url && !attachment.url.startsWith('http')) {
          const filePath = path.resolve(attachment.url);
          if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
          }
        }
      });
    }

    await Task.findByIdAndDelete(req.params.id);
    res.json({ message: 'Task deleted successfully' });
  } catch (error) {
    console.error('Delete task error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get dashboard stats
exports.getDashboardStats = async (req, res) => {
  try {
    const query = {};
    if (req.user.role === 'employee') {
      query.assignedTo = req.user._id;
    }
    const total = await Task.countDocuments(query);
    const pending = await Task.countDocuments({ ...query, status: 'pending' });
    const inProgress = await Task.countDocuments({ ...query, status: 'in-progress' });
    const completed = await Task.countDocuments({ ...query, status: 'completed' });
    const reviewed = await Task.countDocuments({ ...query, status: 'reviewed' });
    const stats = { total, pending, inProgress, completed, reviewed };
    if (req.user.role !== 'employee') {
      stats.totalEmployees = await User.countDocuments({ role: 'employee' });
      stats.totalUsers = await User.countDocuments();
    }
    res.json(stats);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

// Local file download
exports.downloadTaskFile = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task || !task.attachments || task.attachments.length === 0) return res.status(404).json({ message: 'File not found' });
    
    // Auth check
    if (req.user.role === 'employee' && task.assignedTo.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const attachmentIndex = req.query.index || task.attachments.length - 1;
    const attachment = task.attachments[attachmentIndex];

    if (!attachment) return res.status(404).json({ message: 'Attachment not found' });

    // Check if it's an old Cloudinary link
    if (attachment.url.startsWith('http')) {
      return res.status(400).json({ 
        message: 'This file is on Cloudinary (Blocked). Please "Replace File" to upload it locally.' 
      });
    }

    const filePath = path.resolve(attachment.url);
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ message: 'File not found on server. Please re-upload.' });
    }

    // res.download handles headers and streaming automatically
    res.download(filePath, attachment.name || 'download');
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

// Get activity logs for a task
exports.getActivityLogs = async (req, res) => {
  try {
    const ActivityLog = require('../models/ActivityLog');
    const logs = await ActivityLog.find({ task: req.params.id })
      .populate('user', 'name avatar')
      .sort({ createdAt: -1 });
    res.json(logs);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};
// Get detailed performance stats for charts
exports.getPerformanceStats = async (req, res) => {
  try {
    // 1. Task Status Distribution
    const statusData = [
      { name: 'Pending', value: await Task.countDocuments({ status: 'pending' }) },
      { name: 'In Progress', value: await Task.countDocuments({ status: 'in-progress' }) },
      { name: 'Completed', value: await Task.countDocuments({ status: 'completed' }) },
      { name: 'Reviewed', value: await Task.countDocuments({ status: 'reviewed' }) },
    ];

    // 2. Task Priority Distribution
    const priorityData = [
      { name: 'High', value: await Task.countDocuments({ priority: 'high' }) },
      { name: 'Medium', value: await Task.countDocuments({ priority: 'medium' }) },
      { name: 'Low', value: await Task.countDocuments({ priority: 'low' }) },
    ];

    // 3. Employee Productivity (Tasks completed/reviewed per user)
    const employees = await User.find({ role: 'employee' }).select('name');
    const productivityData = await Promise.all(employees.map(async (emp) => {
      const completedCount = await Task.countDocuments({ 
        assignedTo: emp._id, 
        status: { $in: ['completed', 'reviewed'] } 
      });
      return { name: emp.name, completed: completedCount };
    }));

    // 4. Last 7 days task creation trend (simplified)
    const last7Days = [...Array(7)].map((_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - i);
      d.setHours(0, 0, 0, 0);
      return d;
    }).reverse();

    const trendData = await Promise.all(last7Days.map(async (date) => {
      const nextDay = new Date(date);
      nextDay.setDate(nextDay.getDate() + 1);
      const count = await Task.countDocuments({
        createdAt: { $gte: date, $lt: nextDay }
      });
      return { 
        date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }), 
        tasks: count 
      };
    }));

    res.json({
      statusData,
      priorityData,
      productivityData,
      trendData
    });
  } catch (error) {
    console.error('Performance stats error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Update task checklist
exports.updateChecklist = async (req, res) => {
  try {
    const { checklists } = req.body;
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ message: 'Task not found' });

    task.checklists = checklists;
    await task.save();

    res.json(task);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};
// Start timer for a task
exports.startTimer = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ message: 'Task not found' });
    if (task.assignedTo.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }
    if (task.isTimerRunning) {
      return res.status(400).json({ message: 'Timer is already running' });
    }

    task.isTimerRunning = true;
    task.timerStartedAt = new Date();
    
    // Auto-update status to in-progress if it's pending
    if (task.status === 'pending') {
      task.status = 'in-progress';
    }

    await task.save();
    res.json(task);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

// Stop timer for a task
exports.stopTimer = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ message: 'Task not found' });
    if (task.assignedTo.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }
    if (!task.isTimerRunning) {
      return res.status(400).json({ message: 'Timer is not running' });
    }

    const endTime = new Date();
    const startTime = task.timerStartedAt;
    const durationInSeconds = Math.floor((endTime - startTime) / 1000);

    task.timeLogs.push({
      startTime,
      endTime,
      duration: durationInSeconds,
      user: req.user._id
    });

    task.totalTimeSpent = (task.totalTimeSpent || 0) + durationInSeconds;
    task.isTimerRunning = false;
    task.timerStartedAt = null;

    await task.save();
    res.json(task);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

// Get weekly timesheet for managers/admin
exports.getTimesheets = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const query = {
      'timeLogs.startTime': { 
        $gte: new Date(startDate || new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)),
        $lte: new Date(endDate || new Date())
      }
    };

    if (req.user.role === 'employee') {
      query.assignedTo = req.user._id;
    }

    const tasks = await Task.find(query)
      .populate('assignedTo', 'name email avatar')
      .select('title timeLogs assignedTo');

    // Group logs by user and day
    const timesheet = {};
    
    tasks.forEach(task => {
      task.timeLogs.forEach(log => {
        const userId = task.assignedTo._id.toString();
        const date = log.startTime.toISOString().split('T')[0];
        
        if (!timesheet[userId]) {
          timesheet[userId] = {
            user: task.assignedTo,
            days: {},
            totalTime: 0
          };
        }
        
        if (!timesheet[userId].days[date]) {
          timesheet[userId].days[date] = 0;
        }
        
        timesheet[userId].days[date] += log.duration;
        timesheet[userId].totalTime += log.duration;
      });
    });

    res.json(Object.values(timesheet));
  } catch (error) {
    console.error('Timesheet error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

