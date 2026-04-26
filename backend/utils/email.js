const nodemailer = require('nodemailer');

const createTransporter = () => {
  return nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: parseInt(process.env.EMAIL_PORT),
    secure: false,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });
};

const sendTaskAssignedEmail = async (employeeEmail, employeeName, task, assignerName) => {
  try {
    const transporter = createTransporter();
    const deadlineDate = new Date(task.deadline).toLocaleDateString('en-US', {
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
    });
    await transporter.sendMail({
      from: `"Task Manager" <${process.env.EMAIL_FROM}>`,
      to: employeeEmail,
      subject: `New Task Assigned: ${task.title}`,
      html: `
        <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px;background:#f8fafc;border-radius:12px;">
          <h2 style="color:#4f46e5;">New Task Assigned</h2>
          <p>Hi <strong>${employeeName}</strong>,</p>
          <p>You have been assigned a new task by <strong>${assignerName}</strong>.</p>
          <div style="background:#fff;padding:16px;border-radius:8px;border-left:4px solid #4f46e5;margin:16px 0;">
            <h3 style="margin:0 0 8px;">${task.title}</h3>
            <p style="color:#64748b;margin:0 0 8px;">${task.description}</p>
            <p style="margin:0;"><strong>Deadline:</strong> ${deadlineDate}</p>
          </div>
          <p>Please log in to your dashboard to view and start working on this task.</p>
        </div>
      `,
    });
    console.log(`Task assigned email sent to ${employeeEmail}`);
  } catch (error) {
    console.error('Email send error (task assigned):', error.message);
  }
};

const sendTaskSubmittedEmail = async (assignerEmail, assignerName, task, employeeName) => {
  try {
    const transporter = createTransporter();
    await transporter.sendMail({
      from: `"Task Manager" <${process.env.EMAIL_FROM}>`,
      to: assignerEmail,
      subject: `Task Submitted for Review: ${task.title}`,
      html: `
        <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px;background:#f8fafc;border-radius:12px;">
          <h2 style="color:#059669;">Task Submitted for Review</h2>
          <p>Hi <strong>${assignerName}</strong>,</p>
          <p><strong>${employeeName}</strong> has submitted the following task for your review:</p>
          <div style="background:#fff;padding:16px;border-radius:8px;border-left:4px solid #059669;margin:16px 0;">
            <h3 style="margin:0 0 8px;">${task.title}</h3>
            <p style="color:#64748b;margin:0;">${task.description}</p>
          </div>
          <p>Please log in to your dashboard to review and rate this task.</p>
        </div>
      `,
    });
    console.log(`Task submitted email sent to ${assignerEmail}`);
  } catch (error) {
    console.error('Email send error (task submitted):', error.message);
  }
};

const sendEmail = async (options) => {
  try {
    const transporter = createTransporter();
    await transporter.sendMail({
      from: `"Task Manager" <${process.env.EMAIL_FROM}>`,
      ...options
    });
  } catch (error) {
    console.error('Email send error:', error.message);
  }
};

module.exports = { sendTaskAssignedEmail, sendTaskSubmittedEmail, sendEmail };
