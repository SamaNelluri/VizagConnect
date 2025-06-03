const express = require('express');
const router = express.Router();
const Request = require('../models/Request');
const User = require('../models/User');
const nodemailer = require('nodemailer');
const cron = require('node-cron');
const mongoose = require('mongoose');

// Email transporter setup
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'vizagconnect.notification@gmail.com',
    pass: 'napheydtyjzlpfwd',
  },
});

// Helper function to send emails
async function sendEmail(to, subject, text) {
  try {
    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to,
      subject,
      text,
    });
  } catch (error) {
    console.error('Failed to send email:', error);
  }
}

// POST /api/requests/raise - Create new request
router.post('/raise', async (req, res) => {
  const { assignBy, assignTo, unit, description } = req.body;

  // Validate required fields
  if (!assignBy || !assignTo || !unit || !description) {
    return res.status(400).json({ msg: 'All fields (assignBy, assignTo, unit, description) are required' });
  }

  // Validate description length
  if (description.length > 100) {
    return res.status(400).json({ msg: 'Description max length is 100 chars' });
  }

  // Validate Mongo ObjectIds
  if (!mongoose.Types.ObjectId.isValid(assignBy) || !mongoose.Types.ObjectId.isValid(assignTo)) {
    return res.status(400).json({ msg: 'Invalid user ID format' });
  }

  try {
    // Find assignor and assignee users
    const assignor = await User.findById(assignBy);
    const assignee = await User.findById(assignTo);

    if (!assignor || !assignee) {
      return res.status(404).json({ msg: 'Assignor or assignee not found' });
    }

    // Create new request
    const newRequest = new Request({
      assignBy,
      assignTo,
      unit,
      description,
    });

    await newRequest.save();

    // Prepare email content
    const emailText = `New Task Assigned:
Description: ${description}
Assigned By: ${assignor.firstName} ${assignor.lastName}
Assigned To: ${assignee.firstName} ${assignee.lastName}`;

    // Send notification emails
    await sendEmail(assignor.email, 'Task Raised Successfully', emailText);
    await sendEmail(assignee.email, 'New Task Assigned to You', emailText);

    return res.status(201).json({ msg: 'Request raised successfully', request: newRequest });
  } catch (err) {
    console.error('Error raising request:', err);
    return res.status(500).json({ error: err.message });
  }
});

// GET requests raised by a user
router.get('/raised-by/:userId', async (req, res) => {
  try {
    const userId = req.params.userId;
    const requests = await Request.find({ assignBy: userId })
      .populate('assignTo', 'firstName lastName email')
      .sort({ createdAt: -1 });

    const enhanced = requests.map(r => {
      const age = Math.floor((Date.now() - r.createdAt.getTime()) / (1000 * 60 * 60 * 24));
      return {
        _id: r._id,
        assignBy: r.assignBy,
        assignTo: r.assignTo,
        unit: r.unit,
        description: r.description,
        status: r.status,
        createdAt: r.createdAt,
        age,
      };
    });

    return res.json(enhanced);
  } catch (err) {
    console.error('Error fetching requests raised by user:', err);
    return res.status(500).json({ error: err.message });
  }
});

// GET requests assigned to a user
router.get('/assigned-to/:userId', async (req, res) => {
  try {
    const userId = req.params.userId;
    const requests = await Request.find({ assignTo: userId })
      .populate('assignBy', 'firstName lastName email')
      .sort({ createdAt: -1 });

    const enhanced = requests.map(r => {
      const age = Math.floor((Date.now() - r.createdAt.getTime()) / (1000 * 60 * 60 * 24));
      return {
        _id: r._id,
        assignBy: r.assignBy,
        assignTo: r.assignTo,
        unit: r.unit,
        description: r.description,
        status: r.status,
        createdAt: r.createdAt,
        age,
      };
    });

    return res.json(enhanced);
  } catch (err) {
    console.error('Error fetching requests assigned to user:', err);
    return res.status(500).json({ error: err.message });
  }
});

// PUT /status/:requestId - Update request status
router.put('/status/:requestId', async (req, res) => {
  const { status } = req.body;
  const validStatuses = ['Yet to Start', 'In Progress', 'Completed'];

  if (!validStatuses.includes(status)) {
    return res.status(400).json({ msg: 'Invalid status value' });
  }

  try {
    const request = await Request.findById(req.params.requestId)
      .populate('assignBy assignTo');

    if (!request) {
      return res.status(404).json({ msg: 'Request not found' });
    }

    request.status = status;
    await request.save();

    const emailText = `Task Status Updated:
Description: ${request.description}
Status: ${status}
Assignor: ${request.assignBy.firstName} ${request.assignBy.lastName}
Assignee: ${request.assignTo.firstName} ${request.assignTo.lastName}`;

    await sendEmail(request.assignBy.email, 'Task Status Updated', emailText);
    await sendEmail(request.assignTo.email, 'Task Status Updated', emailText);

    return res.json({ msg: 'Status updated', request });
  } catch (err) {
    console.error('Error updating status:', err);
    return res.status(500).json({ error: err.message });
  }
});

// Daily CRON job at 9 AM to remind about pending tasks older than 3 days (summary emails)
cron.schedule('0 9 * * *', async () => {
  try {
    const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000);

    // Fetch all requests pending and older than 3 days
    const oldRequests = await Request.find({
      createdAt: { $lte: threeDaysAgo },
      status: { $ne: 'Completed' }
    }).populate('assignBy assignTo');

    if (oldRequests.length === 0) {
      console.log('No pending tasks older than 3 days.');
      return;
    }

    // Prepare maps to group tasks by assignBy and assignTo
    const assignByMap = new Map();
    const assignToMap = new Map();

    for (const req of oldRequests) {
      const age = Math.floor((Date.now() - req.createdAt.getTime()) / (1000 * 60 * 60 * 24));
      const taskForAssignBy = `- "${req.description}" (Assigned to: ${req.assignTo.firstName} ${req.assignTo.lastName}, Age: ${age} day(s), Status: ${req.status})`;
      const taskForAssignTo = `- "${req.description}" (Assigned by: ${req.assignBy.firstName} ${req.assignBy.lastName}, Age: ${age} day(s), Status: ${req.status})`;

      // Group by assignBy user
      const assignById = req.assignBy._id.toString();
      if (!assignByMap.has(assignById)) {
        assignByMap.set(assignById, { user: req.assignBy, tasks: [] });
      }
      assignByMap.get(assignById).tasks.push(taskForAssignBy);

      // Group by assignTo user
      const assignToId = req.assignTo._id.toString();
      if (!assignToMap.has(assignToId)) {
        assignToMap.set(assignToId, { user: req.assignTo, tasks: [] });
      }
      assignToMap.get(assignToId).tasks.push(taskForAssignTo);
    }

    // Send one email per assignBy user with all their pending tasks
    for (const { user, tasks } of assignByMap.values()) {
      const emailText = `Hello ${user.firstName},\n\nYou have the following pending tasks you raised (older than 3 days):\n\n${tasks.join('\n')}\n\nPlease follow up accordingly.\n\nRegards,\nTask Management System`;
      await sendEmail(user.email, 'Pending Tasks Summary (Tasks You Raised)', emailText);
      console.log(`Summary email sent to assignBy: ${user.email}`);
    }

    // Send one email per assignTo user with all tasks assigned to them
    for (const { user, tasks } of assignToMap.values()) {
      const emailText = `Hello ${user.firstName},\n\nYou have the following pending tasks assigned to you (older than 3 days):\n\n${tasks.join('\n')}\n\nPlease take necessary action.\n\nRegards,\nTask Management System`;
      await sendEmail(user.email, 'Pending Tasks Summary (Tasks Assigned to You)', emailText);
      console.log(`Summary email sent to assignTo: ${user.email}`);
    }

  } catch (error) {
    console.error('Cron job error:', error);
  }
});

module.exports = router;
