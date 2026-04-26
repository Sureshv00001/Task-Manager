const { generateTaskContent, summarizeProject, analyzeRisks } = require('../utils/ai');
const Task = require('../models/Task');
const Project = require('../models/Project');

// Generate task description and checklist from title
exports.generateTask = async (req, res) => {
  try {
    const { title } = req.body;
    if (!title || !title.trim()) {
      return res.status(400).json({ message: 'Title is required' });
    }

    const content = await generateTaskContent(title);
    res.json(content);
  } catch (error) {
    console.error('AI Generate Error:', error.message);
    res.status(500).json({ message: 'AI generation failed. Please try again.' });
  }
};

// Summarize a project for managers
exports.summarizeProjectStatus = async (req, res) => {
  try {
    const project = await Project.findById(req.params.projectId)
      .populate('manager', 'name email')
      .populate('members', 'name email')
      .populate({
        path: 'tasks',
        populate: { path: 'assignedTo', select: 'name' }
      });

    if (!project) return res.status(404).json({ message: 'Project not found' });

    const totalTasks = project.tasks.length;
    const completedTasks = project.tasks.filter(t => t.status === 'completed' || t.status === 'reviewed').length;
    const progress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

    const projectData = {
      ...project.toObject(),
      progress,
      taskCount: totalTasks,
      completedCount: completedTasks
    };

    const summary = await summarizeProject(projectData);
    res.json({ summary });
  } catch (error) {
    console.error('AI Summary Error:', error.message);
    res.status(500).json({ message: 'AI summary failed. Please try again.' });
  }
};

// Smart risk analysis for all active tasks
exports.getRiskAlerts = async (req, res) => {
  try {
    const query = { status: { $in: ['pending', 'in-progress'] } };

    // Role-based filtering
    if (req.user.role === 'employee') {
      query.assignedTo = req.user._id;
    }

    const tasks = await Task.find(query)
      .populate('assignedTo', 'name email')
      .populate('assignedBy', 'name')
      .sort({ deadline: 1 });

    if (tasks.length === 0) {
      return res.json([]);
    }

    const risks = await analyzeRisks(tasks);
    res.json(risks);
  } catch (error) {
    console.error('AI Risk Error:', error.message);
    res.status(500).json({ message: 'AI risk analysis failed. Please try again.' });
  }
};
