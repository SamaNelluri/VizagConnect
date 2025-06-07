const mongoose = require('mongoose');

const EmployeeSchema = new mongoose.Schema({
  unit: { type: String, required: true },
  firstName: { type: String, required: true },
  email: { type: String, required: true, unique: true }
});

module.exports = mongoose.model('Employee', EmployeeSchema);
