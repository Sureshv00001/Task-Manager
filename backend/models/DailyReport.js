const mongoose = require('mongoose');

const dailyReportSchema = new mongoose.Schema(
  {
    employee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    manager: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    content: {
      type: String,
      required: [true, 'Report content is required'],
      maxlength: 5000,
    },
    attachments: [
      {
        url: String,
        name: String,
        fileType: String,
        uploadedAt: { type: Date, default: Date.now },
      },
    ],
    status: {
      type: String,
      enum: ['submitted', 'read'],
      default: 'submitted',
    },
    date: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

// Ensure only one report per employee per day (approximate date check)
dailyReportSchema.index({ employee: 1, date: 1 }, { unique: false });

module.exports = mongoose.model('DailyReport', dailyReportSchema);
