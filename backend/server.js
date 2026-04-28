const express = require('express');
const path = require('path');
const cors = require('cors');
const dotenv = require('dotenv');
const connectDB = require('./config/db');
const http = require('http');
const { initSocket } = require('./utils/socket');
const setupReminders = require('./utils/reminders');

dotenv.config();

const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const taskRoutes = require('./routes/tasks');
const notificationRoutes = require('./routes/notifications');
const projectRoutes = require('./routes/projects');
const aiRoutes = require('./routes/ai');
const reportRoutes = require('./routes/reports');

const app = express();
const server = http.createServer(app);

// Initialize Socket.io
initSocket(server);

// Setup Cron Jobs
setupReminders();

// Middleware
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:3000',
  process.env.FRONTEND_URL,
].filter(Boolean);

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (mobile apps, curl, etc.)
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    return callback(null, false);
  },
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/reports', reportRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Serve frontend in production
if (process.env.NODE_ENV === 'production') {
  // Set static folder
  app.use(express.static(path.join(__dirname, '../frontend/dist')));

  app.get('*', (req, res) => {
    res.sendFile(path.resolve(__dirname, '../frontend', 'dist', 'index.html'));
  });
}

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  if (err.name === 'MulterError') {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ message: 'File size exceeds 20MB limit' });
    }
    return res.status(400).json({ message: err.message });
  }
  res.status(500).json({ message: 'Internal server error' });
});

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    // 1. Connect to MongoDB
    await connectDB();
    console.log('✅ Database connected successfully');

    // 2. Auto-seed Admin
    const User = require('./models/User');
    console.log('🔍 Checking for admin account...');
    const adminExists = await User.findOne({ role: 'admin' });
    
    if (!adminExists) {
      console.log('⚡ No admin found. Creating default admin...');
      await User.create({
        name: 'Admin',
        email: 'admin@taskmanager.com',
        password: 'admin123',
        role: 'admin',
      });
      console.log('✨ Default admin created: admin@taskmanager.com / admin123');
    } else {
      console.log('✅ Admin account already exists:', adminExists.email);
    }

    // 3. Start Listening
    server.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`🌐 Environment: ${process.env.NODE_ENV || 'development'}`);
    });
  } catch (error) {
    console.error('❌ CRITICAL: Server failed to start:', error.message);
    process.exit(1);
  }
};

startServer();
