const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const nodemailer = require('nodemailer');
const cron = require('node-cron');

const Request = require('../models/Request');
const User = require('../models/User'); // ✅ Correct model import

// ---------------------- Email Setup ----------------------
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER || 'vizagconnect.notification@gmail.com',
    pass: process.env.EMAIL_PASS || 'napheydtyjzlpfwd',
  },
});

async function sendEmail(to, subject, text) {
  try {
    await transporter.sendMail({
      from: process.env.EMAIL_USER || 'vizagconnect.notification@gmail.com',
      to,
      subject,
      text,
    });
  } catch (error) {
    console.error('Failed to send email:', error);
  }
}

// ---------------------- GET: All Unique Units ----------------------
router.get('/units', async (req, res) => {
  try {
    const units = await User.distinct('unit');
    res.json(units);
  } catch (error) {
    console.error('Error fetching units:', error);
    res.status(500).json({ error: 'Failed to fetch units' });
  }
});

// ---------------------- GET: Assign-To List by Unit ----------------------
router.get('/assign-to/:unit', async (req, res) => {
  try {
    const unitParam = req.params.unit.trim().toLowerCase();

    const validUnits = ['VIIT', 'VIEW', 'VIPT', 'WOS', 'VSCPS', 'City Office'];
    const matchedUnit = validUnits.find(u => u.toLowerCase() === unitParam);

    if (!matchedUnit) {
      return res.status(400).json({ error: 'Invalid unit name' });
    }

    let filter = { unit: new RegExp('^' + matchedUnit + '$', 'i') };

    if (matchedUnit.toLowerCase() === 'city office') {
      filter.role = 'Principal';
    }

    const Users = await User.find(filter)
      .select('_id firstName lastName email unit role')
      .sort({ firstName: 1, lastName: 1 });

    res.json(Users);
  } catch (error) {
    console.error('Error fetching Users by unit:', error);
    res.status(500).json({ error: error.message });
  }
});


// ---------------------- GET: Search Users by Name Prefix ----------------------
router.get('/assign-to/search/:name', async (req, res) => {
  try {
    const { name } = req.params;
    const { unit } = req.query;

    if (!unit) {
      return res.status(400).json({ msg: 'Unit is required for search' });
    }

    const nameRegex = new RegExp('^' + name, 'i');
    const unitRegex = new RegExp('^' + unit + '$', 'i');

    const filter = {
      $and: [
        { unit: unitRegex },
        {
          $or: [{ firstName: nameRegex }, { lastName: nameRegex }],
        },
      ],
    };

    const Users = await User.find(filter)
      .select('_id firstName lastName email unit')
      .sort({ firstName: 1, lastName: 1 });

    res.json(Users);
  } catch (error) {
    console.error('Error searching assign-to Users by name + unit:', error);
    res.status(500).json({ error: error.message });
  }
});


// ---------------------- POST: Raise a New Request ----------------------
router.post('/raise', async (req, res) => {
  const { assignBy, assignTo, unit, description } = req.body;

 if (!assignBy || !assignTo || !unit || !description) {
    console.log('Missing fields:', { assignBy, assignTo, unit, description });
    return res.status(400).json({ msg: 'All fields are required' });
  }


  if (description.length > 100) {
    return res.status(400).json({ msg: 'Description max length is 100 chars' });
  }

  if (
    !mongoose.Types.ObjectId.isValid(assignBy) ||
    !mongoose.Types.ObjectId.isValid(assignTo)
  ) {
    return res.status(400).json({ msg: 'Invalid user ID format' });
  }

  try {
    const assignor = await User.findById(assignBy);
    const assignee = await User.findById(assignTo);

    if (!assignor || !assignee) {
      return res.status(404).json({ msg: 'Assignor or assignee not found' });
    }

    const newRequest = new Request({ assignBy, assignTo, unit, description });
    await newRequest.save();

    const emailText = `New Task Assigned:\nDescription: ${description}\nAssigned By: ${assignor.firstName} ${assignor.lastName}\nAssigned To: ${assignee.firstName} ${assignee.lastName}`;

    await sendEmail(assignor.email, 'Task Raised Successfully', emailText);
    await sendEmail(assignee.email, 'New Task Assigned to You', emailText);

    res.status(201).json({ msg: 'Request raised successfully', request: newRequest });
  } catch (err) {
    console.error('Error raising request:', err);
    res.status(500).json({ error: err.message });
  }
});

// ---------------------- GET: Requests Raised by a User ----------------------
router.get('/raised-by/:userId', async (req, res) => {
  try {
    const requests = await Request.find({ assignBy: req.params.userId })
      .populate('assignTo', 'firstName lastName email')
      .sort({ createdAt: -1 });

    const enhanced = requests.map((r) => ({
      ...r.toObject(),
      age: Math.floor((Date.now() - new Date(r.createdAt)) / (1000 * 60 * 60 * 24)),
    }));

    res.json(enhanced);
  } catch (err) {
    console.error('Error fetching raised requests:', err);
    res.status(500).json({ error: err.message });
  }
});

// ---------------------- GET: Requests Assigned to a User ----------------------
router.get('/assigned-to/:UserId', async (req, res) => {
  try {
    const UserId = req.params.UserId;

    const requests = await Request.find({ assignTo: UserId })
      .populate('assignBy', 'firstName lastName email')
      .sort({ createdAt: -1 });

    const enhanced = requests.map((r) => ({
      ...r.toObject(),
      age: Math.floor((Date.now() - new Date(r.createdAt)) / (1000 * 60 * 60 * 24)),
    }));

    res.json(enhanced);
  } catch (err) {
    console.error('Error fetching assigned requests:', err);
    res.status(500).json({ error: err.message });
  }
});

// ---------------------- PUT: Update Request Status ----------------------
router.put('/status/:requestId', async (req, res) => {
  const { status } = req.body;
  const validStatuses = ['Yet to Start', 'In Progress', 'Completed'];

  if (!validStatuses.includes(status)) {
    return res.status(400).json({ msg: 'Invalid status value' });
  }

  try {
    const request = await Request.findById(req.params.requestId).populate(
      'assignBy assignTo'
    );
    if (!request) return res.status(404).json({ msg: 'Request not found' });

    request.status = status;
    await request.save();

    const emailText = `Task Status Updated:\nDescription: ${request.description}\nStatus: ${status}\nAssignor: ${request.assignBy.firstName} ${request.assignBy.lastName}\nAssignee: ${request.assignTo.firstName} ${request.assignTo.lastName}`;

    await sendEmail(request.assignBy.email, 'Task Status Updated', emailText);
    await sendEmail(request.assignTo.email, 'Task Status Updated', emailText);

    res.json({ msg: 'Status updated', request });
  } catch (err) {
    console.error('Error updating status:', err);
    res.status(500).json({ error: err.message });
  }
});

// ---------------------- CRON: Daily Reminder ----------------------
cron.schedule('0 9 * * *', async () => {
  try {
    const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000);
    const oldRequests = await Request.find({
      createdAt: { $lte: threeDaysAgo },
      status: { $ne: 'Completed' },
    }).populate('assignBy assignTo');

    if (!oldRequests.length) return console.log('No pending tasks older than 3 days.');

    const assignByMap = new Map();
    const assignToMap = new Map();

    oldRequests.forEach((req) => {
      const age = Math.floor((Date.now() - new Date(req.createdAt)) / (1000 * 60 * 60 * 24));
      const taskBy = `- "${req.description}" (Assigned to: ${req.assignTo.firstName} ${req.assignTo.lastName}, Age: ${age} day(s), Status: ${req.status})`;
      const taskTo = `- "${req.description}" (Assigned by: ${req.assignBy.firstName} ${req.assignBy.lastName}, Age: ${age} day(s), Status: ${req.status})`;

      if (!assignByMap.has(req.assignBy._id.toString())) {
        assignByMap.set(req.assignBy._id.toString(), { user: req.assignBy, tasks: [] });
      }
      assignByMap.get(req.assignBy._id.toString()).tasks.push(taskBy);

      if (!assignToMap.has(req.assignTo._id.toString())) {
        assignToMap.set(req.assignTo._id.toString(), { user: req.assignTo, tasks: [] });
      }
      assignToMap.get(req.assignTo._id.toString()).tasks.push(taskTo);
    });

    for (const [_, { user, tasks }] of assignByMap) {
      const text = `You have pending tasks older than 3 days:\n\n${tasks.join('\n')}\n\nPlease review them.`;
      await sendEmail(user.email, 'Pending Task Reminder (Assignor)', text);
    }
    for (const [_, { user, tasks }] of assignToMap) {
      const text = `You have pending tasks older than 3 days:\n\n${tasks.join('\n')}\n\nPlease review them.`;
      await sendEmail(user.email, 'Pending Task Reminder (Assignee)', text);
    }

    console.log('Reminder emails sent for old pending tasks.');
  } catch (error) {
    console.error('Error sending reminder emails:', error);
  }
});

module.exports = router;
