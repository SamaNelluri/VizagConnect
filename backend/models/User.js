const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  firstName: { type: String, required: true },
  lastName:  { type: String, required: true },
  email:     { type: String, required: true, unique: true },
  mobile:    { type: String, required: true },
  password:  { type: String, required: true },
  lastLogin: { type: Date, default: null },
  role:      { type: String, enum: ['Principal', 'Suresh'], required: true }, // based on unit
  unit:      { type: String, enum: ['VIIT', 'VIEW', 'VIPT', 'WoS', 'VSCPS', 'City Office'], required: true }
});

module.exports = mongoose.model('User', UserSchema);
