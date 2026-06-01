const mongoose = require('mongoose');

const visitorSchema = new mongoose.Schema({
  // Identity
  firstName: { type: String, required: true, trim: true },
  lastName: { type: String, required: true, trim: true },
  gender: { type: String, enum: ['Male', 'Female', 'Other'], required: true },
  age: { type: Number, min: 0, max: 120 },

  // Origin
  residenceType: {
    type: String,
    enum: ['This Municipality', 'This Province', 'Other Province', 'Foreign'],
    required: true
  },
  province: { type: String, default: '' },
  country: { type: String, default: 'Philippines' },
  nationality: { type: String, default: 'Filipino' },

  // Visit info
  touristSpot: { type: String, required: true },
  municipality: { type: String, required: true },
  visitDate: { type: Date, required: true },
  purpose: {
    type: String,
    enum: ['Leisure/Recreation', 'Cultural/Heritage', 'Adventure', 'Business', 'Religious', 'Education', 'Others'],
    default: 'Leisure/Recreation'
  },
  groupSize: { type: Number, default: 1, min: 1 },
  stayDuration: { type: String, default: '' }, // e.g. "1 day", "2 nights"
  transportation: {
    type: String,
    enum: ['Private Vehicle', 'Bus', 'Motorcycle', 'Walk', 'Tricycle', 'Other'],
    default: 'Private Vehicle'
  },

  // Spend
  estimatedSpend: { type: Number, default: 0 },

  // Satisfaction
  rating: { type: Number, min: 1, max: 5 },
  feedback: { type: String, default: '' },

  // Meta
  reportYear: { type: Number, default: new Date().getFullYear() },
  reportMonth: { type: Number, default: new Date().getMonth() + 1 },
  submittedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  status: { type: String, enum: ['draft', 'submitted'], default: 'submitted' },
  notes: { type: String, default: '' }
}, { timestamps: true });

// Virtual for full name
visitorSchema.virtual('fullName').get(function () {
  return `${this.firstName} ${this.lastName}`;
});

// Index for date-based queries
visitorSchema.index({ visitDate: -1, municipality: 1 });
visitorSchema.index({ reportYear: 1, reportMonth: 1 });

module.exports = mongoose.model('Visitor', visitorSchema);
