const DailyReport = require('../models/DailyReport');
const User = require('../models/User');
const { createNotification } = require('../utils/notifier');

// Submit daily report
exports.submitReport = async (req, res) => {
  try {
    const { content, attachments } = req.body;
    
    // Get the employee's tagged manager
    const employee = await User.findById(req.user._id);
    if (!employee.manager) {
      return res.status(400).json({ message: 'No tagged manager found. Please contact admin.' });
    }

    // Check if report for today already exists
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    const existingReport = await DailyReport.findOne({
      employee: req.user._id,
      createdAt: { $gte: startOfDay, $lte: endOfDay }
    });

    if (existingReport) {
      return res.status(400).json({ message: 'You have already submitted a report for today.' });
    }

    const report = await DailyReport.create({
      employee: req.user._id,
      manager: employee.manager,
      content,
      attachments: attachments || [],
    });

    // Notify manager
    await createNotification({
      recipient: employee.manager,
      sender: req.user._id,
      type: 'report_submitted',
      message: `${req.user.name} has submitted their daily report.`,
    });

    res.status(201).json(report);
  } catch (error) {
    console.error('Submit report error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get reports for the logged in user (Manager sees tagged employees, Employee sees own)
exports.getReports = async (req, res) => {
  try {
    const { startDate, endDate, employeeId } = req.query;
    const query = {};

    if (req.user.role === 'employee') {
      query.employee = req.user._id;
    } else if (req.user.role === 'manager') {
      query.manager = req.user._id;
      if (employeeId) query.employee = employeeId;
    } else if (req.user.role === 'admin') {
      if (employeeId) query.employee = employeeId;
    }

    if (startDate && endDate) {
      query.createdAt = { 
        $gte: new Date(startDate), 
        $lte: new Date(endDate) 
      };
    }

    const reports = await DailyReport.find(query)
      .populate('employee', 'name email avatar')
      .populate('manager', 'name email')
      .sort({ createdAt: -1 });

    res.json(reports);
  } catch (error) {
    console.error('Get reports error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Mark report as read
exports.markAsRead = async (req, res) => {
  try {
    const report = await DailyReport.findById(req.params.id);
    if (!report) return res.status(404).json({ message: 'Report not found' });
    
    if (report.manager.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized' });
    }

    report.status = 'read';
    await report.save();
    res.json(report);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};
