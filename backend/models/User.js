const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  firstName: { type: String, required: true, trim: true },        // trim to remove whitespace
  lastName:  { type: String, required: true, trim: true },
  email:     { type: String, required: true, unique: true, lowercase: true, trim: true },  // lowercase for consistency
  mobile:    { type: String, required: true, trim: true },
  password:  { type: String, required: true },
  lastLogin: { type: Date, default: null },
  role:      { type: String, enum: ['Principal', 'Suresh'], required: true },
  unit:      { type: String, enum: ['VIIT', 'VIEW', 'VIPT', 'WoS', 'VSCPS', 'City Office'], required: true }
}, {
  timestamps: true // adds createdAt and updatedAt fields automatically
});

module.exports = mongoose.model('User', UserSchema);
