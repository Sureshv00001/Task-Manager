const User = require('../models/User');
const Task = require('../models/Task');
const { getOnlineUsers } = require('../utils/socket');

// Create user
exports.createUser = async (req, res) => {
  try {
    const { name, email, password, role, manager } = req.body;
    if (req.user.role === 'manager' && role !== 'employee') {
      return res.status(403).json({ message: 'Managers can only create Employee accounts' });
    }
    if (role === 'admin') {
      return res.status(403).json({ message: 'Cannot create Admin accounts via this form' });
    }
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'User with this email already exists' });
    }
    const user = await User.create({
      name, email, password,
      role: role || 'employee',
      createdBy: req.user._id,
      manager: role === 'employee' ? manager : null,
    });
    res.status(201).json({
      _id: user._id, name: user.name, email: user.email,
      role: user.role, createdBy: user.createdBy, createdAt: user.createdAt,
    });
  } catch (error) {
    console.error('Create user error:', error);
    if (error.code === 11000) return res.status(400).json({ message: 'Email already in use' });
    res.status(500).json({ message: 'Server error' });
  }
};

// Get all users with pagination & search
exports.getUsers = async (req, res) => {
  try {
    const { page = 1, limit = 10, search = '', role = '' } = req.query;
    const query = {};
    if (req.user.role === 'manager') {
      query.role = 'employee';
    }
    if (role) {
      if (req.user.role === 'admin') {
        query.role = role;
      }
    }
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
      ];
    }
    const total = await User.countDocuments(query);
    const onlineUsers = getOnlineUsers();
    
    const users = await Promise.all((await User.find(query)
      .populate('createdBy', 'name email')
      .populate('manager', 'name email')
      .sort({ createdAt: -1 })
      .skip((parseInt(page) - 1) * parseInt(limit))
      .limit(parseInt(limit))).map(async (u) => {
        const activeTasks = await Task.countDocuments({ 
          assignedTo: u._id, 
          status: { $in: ['pending', 'in-progress'] } 
        });
        
        return {
          ...u.toObject(),
          isOnline: onlineUsers.includes(u._id.toString()),
          workload: activeTasks > 2 ? 'busy' : 'free',
          activeTasks
        };
      }));
    res.json({
      users, total,
      page: parseInt(page),
      pages: Math.ceil(total / parseInt(limit)),
    });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get user by ID
exports.getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).populate('createdBy', 'name email');
    if (!user) return res.status(404).json({ message: 'User not found' });
    if (req.user.role === 'manager' && user.role !== 'employee') {
      return res.status(403).json({ message: 'Not authorized to view this user' });
    }
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

// Update user
exports.updateUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    if (req.user.role === 'manager' && user.role !== 'employee') {
      return res.status(403).json({ message: 'Managers can only edit Employee accounts' });
    }
    if (req.user.role === 'manager' && req.body.role && req.body.role !== 'employee') {
      return res.status(403).json({ message: 'Managers can only assign Employee role' });
    }
    const { name, email, password, role, manager } = req.body;
    if (name) user.name = name;
    if (email) user.email = email;
    if (password) user.password = password;
    
    // Only allow role updates if not setting to admin
    if (role && req.user.role === 'admin' && role !== 'admin') {
      user.role = role;
    } else if (role && role === 'admin' && user.role !== 'admin') {
      return res.status(403).json({ message: 'Cannot promote user to Admin' });
    }

    if (manager !== undefined) user.manager = role === 'employee' ? manager : null;
    await user.save();
    res.json({ _id: user._id, name: user.name, email: user.email, role: user.role, createdAt: user.createdAt });
  } catch (error) {
    if (error.code === 11000) return res.status(400).json({ message: 'Email already in use' });
    res.status(500).json({ message: 'Server error' });
  }
};

// Delete user
exports.deleteUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    if (user._id.toString() === req.user._id.toString()) {
      return res.status(400).json({ message: 'Cannot delete your own account' });
    }
    if (req.user.role === 'manager' && user.role !== 'employee') {
      return res.status(403).json({ message: 'Managers can only delete Employee accounts' });
    }
    await User.findByIdAndDelete(req.params.id);
    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

// Get employees list for task assignment dropdown
exports.getEmployees = async (req, res) => {
  try {
    const employees = await User.find({ role: 'employee' }).select('name email').sort({ name: 1 });
    res.json(employees);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

// Get managers list for user creation dropdown
exports.getManagers = async (req, res) => {
  try {
    const managers = await User.find({ role: 'manager' }).select('name email role').sort({ name: 1 });
    res.json(managers);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

// Get employee performance data
exports.getPerformance = async (req, res) => {
  try {
    const onlineUsers = getOnlineUsers();
    const employees = await User.find({ role: 'employee' });
    const performance = await Promise.all(
      employees.map(async (emp) => {
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
        
        // Gamification Score: Weighted average of ratings and completion rate
        const completionRate = totalTasks > 0 ? (completedTasks / totalTasks) : 0;
        const score = parseFloat(((avgRating * 20) + (avgMarks * 0.5) + (completionRate * 10)).toFixed(1));

        return {
          _id: emp._id, name: emp.name, email: emp.email,
          totalTasks, completedTasks, activeTasks, avgRating, avgMarks, score,
          isOnline: onlineUsers.includes(emp._id.toString()),
          workload: activeTasks > 2 ? 'busy' : 'free',
        };
      })
    );
    // Sort by score for leaderboard
    performance.sort((a, b) => b.score - a.score);
    res.json(performance);
  } catch (error) {
    console.error('getPerformance error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Update personal profile
exports.updateProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    const { name, avatar, bio, phone, department } = req.body;
    if (name) user.name = name;
    if (avatar) user.avatar = avatar;
    if (bio) user.bio = bio;
    if (phone) user.phone = phone;
    if (department) user.department = department;

    await user.save();
    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      avatar: user.avatar,
      bio: user.bio,
      phone: user.phone,
      department: user.department,
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

// Update password
exports.updatePassword = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('+password');
    if (!user) return res.status(404).json({ message: 'User not found' });

    const { currentPassword, newPassword } = req.body;
    
    // Check current password
    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(400).json({ message: 'Incorrect current password' });
    }

    user.password = newPassword;
    await user.save();

    res.json({ message: 'Password updated successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};
