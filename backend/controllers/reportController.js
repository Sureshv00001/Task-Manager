const DailyReport = require('../models/DailyReport');
const User = require('../models/User');
const { createNotification } = require('../utils/notifier');

// Submit daily report
exports.submitReport = async (req, res) => {
  try {
    const { content, attachments } = req.body;
    
    // Get the user submitting the report
    const sender = await User.findById(req.user._id);
    let recipientId = sender.manager;

    // If a manager is submitting, they report to an admin
    if (req.user.role === 'manager') {
      const admin = await User.findOne({ role: 'admin' });
      if (admin) recipientId = admin._id;
    }

    if (!recipientId && req.user.role !== 'admin') {
      return res.status(400).json({ message: 'No recipient (Manager/Admin) found for your report. Please contact admin.' });
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

    let report;
    if (existingReport) {
      // Update existing report
      existingReport.content = content;
      existingReport.attachments = attachments || existingReport.attachments;
      existingReport.status = 'submitted'; 
      report = await existingReport.save();
    } else {
      // Create new report
      report = await DailyReport.create({
        employee: req.user._id,
        manager: recipientId,
        content,
        attachments: attachments || [],
      });
    }

    // Notify recipient
    await createNotification({
      recipient: recipientId,
      sender: req.user._id,
      type: 'report_submitted',
      message: `${req.user.name} (${req.user.role}) has submitted their daily report.`,
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

// Upload file for report
exports.uploadReportFile = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const fileData = {
      name: req.file.originalname,
      url: `/uploads/${req.file.filename}`,
      fileType: req.file.mimetype,
    };

    res.status(200).json(fileData);
  } catch (error) {
    console.error('Upload report file error:', error);
    res.status(500).json({ message: 'Server error during upload' });
  }
};

// Delete report
exports.deleteReport = async (req, res) => {
  try {
    const report = await DailyReport.findById(req.params.id);
    if (!report) return res.status(404).json({ message: 'Report not found' });
    
    // Auth check: Only the employee who created it or an Admin can delete it
    if (report.employee.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to delete this report' });
    }

    await DailyReport.findByIdAndDelete(req.params.id);
    res.json({ message: 'Report deleted successfully' });
  } catch (error) {
    console.error('Delete report error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};
