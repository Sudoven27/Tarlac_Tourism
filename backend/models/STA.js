const mongoose = require('mongoose');

const staSchema = new mongoose.Schema({
  num: { type: Number },
  taName: { type: String, required: true, trim: true },
  attractionCode: { type: String, default: '', trim: true },
  typeCode: {
    type: String,
    enum: ['Nature', 'History_and_Culture', 'Man-Made', 'Events_and_Festivals', 'Sports_and_Recreation', 'Others'],
    required: true
  },
  yearEst: { type: Number },
  region: { type: String, default: 'Region III' },
  provHuc: { type: String, default: 'Tarlac' },
  cityMun: { type: String, required: true },
  reportYear: { type: Number, default: new Date().getFullYear() },
  employees: { type: Number, default: 0 },
  femaleEmp: { type: Number, default: 0 },
  maleEmp: { type: Number, default: 0 },
  brgy: { type: String, default: '' },
  latitude: { type: Number },
  longitude: { type: Number },
  altitudeM: { type: Number },
  taCategory: { type: String, default: '' },
  ntdpCategory: { type: String, default: '' },
  devtLvl: { type: String, enum: ['Undeveloped', 'Developing', 'Developed', 'Highly Developed'], default: 'Developed' },
  mgt: { type: String, default: '' },
  onlineConnectivity: { type: String, enum: ['Yes', 'No', 'N/A'], default: 'N/A' },
  descriptionNotes: { type: String, default: '' },
  contactPerson: { type: String, default: '' },
  contactInfo: { type: String, default: '' },
  images: [{ type: String }],
  submittedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  status: { type: String, enum: ['draft', 'submitted', 'approved'], default: 'submitted' },
  entryFee: { type: Number, default: 0 },
  visitorsPerYear: { type: Number, default: 0 }
}, { timestamps: true });

module.exports = mongoose.model('STA', staSchema);
