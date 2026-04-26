const Project = require('../models/Project');
const Task = require('../models/Task');
const User = require('../models/User');

// Create Project
exports.createProject = async (req, res) => {
  try {
    const { name, description, deadline, members } = req.body;
    const project = await Project.create({
      name,
      description,
      deadline,
      members: members || [],
      manager: req.user._id,
    });
    res.status(201).json(project);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

// Get all projects with progress calculation
exports.getProjects = async (req, res) => {
  try {
    const query = {};
    if (req.user.role === 'employee') {
      query.members = req.user._id;
    }

    const projects = await Project.find(query)
      .populate('manager', 'name email')
      .populate('members', 'name email avatar')
      .sort({ createdAt: -1 });

    const projectsWithProgress = await Promise.all(
      projects.map(async (project) => {
        const tasks = await Task.find({ project: project._id });
        const totalTasks = tasks.length;
        const completedTasks = tasks.filter(t => t.status === 'completed' || t.status === 'reviewed').length;
        
        const progress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
        
        return {
          ...project.toObject(),
          progress,
          taskCount: totalTasks,
          completedCount: completedTasks
        };
      })
    );

    res.json(projectsWithProgress);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

// Get single project
exports.getProjectById = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id)
      .populate('manager', 'name email')
      .populate('members', 'name email avatar')
      .populate({
        path: 'tasks',
        populate: { path: 'assignedTo', select: 'name avatar' }
      });

    if (!project) return res.status(404).json({ message: 'Project not found' });

    const totalTasks = project.tasks.length;
    const completedTasks = project.tasks.filter(t => t.status === 'completed' || t.status === 'reviewed').length;
    const progress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

    res.json({
      ...project.toObject(),
      progress,
      taskCount: totalTasks,
      completedCount: completedTasks
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

// Update project
exports.updateProject = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ message: 'Project not found' });
    
    if (req.user.role !== 'admin' && project.manager.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const { name, description, deadline, status, members } = req.body;
    if (name) project.name = name;
    if (description) project.description = description;
    if (deadline) project.deadline = deadline;
    if (status) project.status = status;
    if (members) project.members = members;

    await project.save();
    res.json(project);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

// Delete project
exports.deleteProject = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ message: 'Project not found' });
    
    if (req.user.role !== 'admin' && project.manager.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    // Unlink tasks
    await Task.updateMany({ project: project._id }, { project: null });
    
    await Project.findByIdAndDelete(req.params.id);
    res.json({ message: 'Project deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};
