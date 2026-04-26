const mongoose = require('mongoose');

const taskSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Task title is required'],
      trim: true,
      maxlength: 200,
    },
    description: {
      type: String,
      required: [true, 'Task description is required'],
      maxlength: 5000,
    },
    assignedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    status: {
      type: String,
      enum: ['pending', 'in-progress', 'completed', 'reviewed'],
      default: 'pending',
    },
    deadline: {
      type: Date,
      required: [true, 'Deadline is required'],
    },
    priority: {
      type: String,
      enum: ['low', 'medium', 'high'],
      default: 'medium',
    },
    tags: [
      {
        type: String,
        trim: true,
      },
    ],
    attachments: [
      {
        url: String,
        name: String,
        fileType: String,
        uploadedAt: { type: Date, default: Date.now },
        uploadedByRole: String,
        uploadedByName: String,
      },
    ],
    rating: { type: Number, min: 1, max: 5, default: null },
    marks: { type: Number, min: 0, max: 100, default: null },
    feedback: { type: String, default: null, maxlength: 2000 },
    submittedAt: { type: Date, default: null },
    reviewedAt: { type: Date, default: null },
    project: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Project',
      default: null,
    },
    checklists: [
      {
        text: { type: String, required: true },
        completed: { type: Boolean, default: false }
      }
    ],
    timeLogs: [
      {
        startTime: { type: Date, required: true },
        endTime: { type: Date },
        duration: { type: Number, default: 0 }, // in seconds
        user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
      }
    ],
    totalTimeSpent: { type: Number, default: 0 }, // in seconds
    isTimerRunning: { type: Boolean, default: false },
    timerStartedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Task', taskSchema);
