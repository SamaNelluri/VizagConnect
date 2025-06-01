const mongoose = require('mongoose');

const RequestSchema = new mongoose.Schema({
  assignTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  assignBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  unit: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true,
    maxlength: 100
  },
  status: {
    type: String,
    enum: ['Yet to Start', 'In Progress', 'Completed'],
    default: 'Yet to Start'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Request', RequestSchema);
