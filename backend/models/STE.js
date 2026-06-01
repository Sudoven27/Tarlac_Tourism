const mongoose = require('mongoose');

const steSchema = new mongoose.Schema({
  num: { type: Number },
  nameOfEnterprise: { type: String, required: true, trim: true },
  attractionCode: { type: String, default: '', trim: true },
  type: {
    type: String,
    enum: ['Travel and Tours', 'Restaurant', 'Transportation', 'Souvenir Shop', 'Spa and Wellness', 'Entertainment', 'Others'],
    required: true
  },
  seatsUnit: { type: Number, default: 0 },
  totalEmployees: { type: Number, default: 0 },
  femaleEmployees: { type: Number, default: 0 },
  maleEmployees: { type: Number, default: 0 },
  reportYear: { type: Number, default: new Date().getFullYear() },
  reportMonth: { type: Number, default: new Date().getMonth() + 1 },
  region: { type: String, default: 'Region III' },
  provHuc: { type: String, default: 'Tarlac' },
  cityMun: { type: String, required: true },
  classification: { type: String, default: '' },
  contactNumber: { type: String, default: '' },
  email: { type: String, default: '' },
  address: { type: String, default: '' },
  images: [{ type: String }],
  submittedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  status: { type: String, enum: ['draft', 'submitted', 'approved'], default: 'submitted' },
  notes: { type: String, default: '' }
}, { timestamps: true });

module.exports = mongoose.model('STE', steSchema);
