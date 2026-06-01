const mongoose = require('mongoose');

const saeSchema = new mongoose.Schema({
  num: { type: Number },
  nameOfEstablishment: { type: String, required: true, trim: true },
  attractionCode: { type: String, default: '', trim: true },
  typeCode: {
    type: String,
    enum: ['Hotel', 'Resort', 'Motel', 'Tourist Inn', 'Pension House', 'Hostel', 'Apartelle', 'Others'],
    required: true
  },
  noOfRooms: { type: Number, default: 0 },
  noOfEmployees: { type: Number, default: 0 },
  femaleEmployees: { type: Number, default: 0 },
  maleEmployees: { type: Number, default: 0 },
  reportYear: { type: Number, default: new Date().getFullYear() },
  reportMonth: { type: Number, default: new Date().getMonth() + 1 },
  region: { type: String, default: 'Region III' },
  provHuc: { type: String, default: 'Tarlac' },
  cityMun: { type: String, required: true },
  contactNumber: { type: String, default: '' },
  email: { type: String, default: '' },
  address: { type: String, default: '' },
  latitude: { type: Number },
  longitude: { type: Number },
  images: [{ type: String }],
  submittedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  status: { type: String, enum: ['draft', 'submitted', 'approved'], default: 'submitted' },
  notes: { type: String, default: '' }
}, { timestamps: true });

module.exports = mongoose.model('SAE', saeSchema);
