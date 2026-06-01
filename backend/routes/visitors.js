const express = require('express');
const router = express.Router();
const Visitor = require('../models/Visitor');
const { protect } = require('../middleware/auth');

// GET all visitors with filters
router.get('/', protect, async (req, res) => {
  try {
    let query = {};
    if (req.user.role !== 'admin') query.submittedBy = req.user._id;

    const { municipality, year, month, search, residence, page = 1, limit = 20, startDate, endDate } = req.query;

    if (municipality) query.municipality = municipality;
    if (year) query.reportYear = parseInt(year);
    if (month) query.reportMonth = parseInt(month);
    if (residence) query.residenceType = residence;
    if (startDate || endDate) {
      query.visitDate = {};
      if (startDate) query.visitDate.$gte = new Date(startDate);
      if (endDate) query.visitDate.$lte = new Date(endDate + 'T23:59:59');
    }
    if (search) {
      query.$or = [
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } },
        { touristSpot: { $regex: search, $options: 'i' } },
        { municipality: { $regex: search, $options: 'i' } }
      ];
    }

    const total = await Visitor.countDocuments(query);
    const records = await Visitor.find(query)
      .populate('submittedBy', 'name email')
      .sort({ visitDate: -1, createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    res.json({ success: true, count: records.length, total, data: records });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET visitor stats for dashboard
router.get('/stats', protect, async (req, res) => {
  try {
    const { year, month, municipality } = req.query;
    let match = {};
    if (year) match.reportYear = parseInt(year);
    if (month) match.reportMonth = parseInt(month);
    if (municipality) match.municipality = municipality;

    const [
      total, byGender, byResidence, byMunicipality,
      byMonth, bySpot, totalMale, totalFemale, totalForeign, totalLocal
    ] = await Promise.all([
      Visitor.countDocuments(match),
      Visitor.aggregate([{ $match: match }, { $group: { _id: '$gender', count: { $sum: 1 } } }]),
      Visitor.aggregate([{ $match: match }, { $group: { _id: '$residenceType', count: { $sum: 1 } } }]),
      Visitor.aggregate([{ $match: match }, { $group: { _id: '$municipality', count: { $sum: 1 } } }, { $sort: { count: -1 } }, { $limit: 10 }]),
      Visitor.aggregate([
        { $match: match },
        { $group: { _id: { year: '$reportYear', month: '$reportMonth' }, count: { $sum: 1 } } },
        { $sort: { '_id.year': 1, '_id.month': 1 } }
      ]),
      Visitor.aggregate([{ $match: match }, { $group: { _id: '$touristSpot', count: { $sum: 1 } } }, { $sort: { count: -1 } }, { $limit: 8 }]),
      Visitor.countDocuments({ ...match, gender: 'Male' }),
      Visitor.countDocuments({ ...match, gender: 'Female' }),
      Visitor.countDocuments({ ...match, residenceType: 'Foreign' }),
      Visitor.countDocuments({ ...match, residenceType: { $in: ['This Municipality', 'This Province'] } })
    ]);

    res.json({
      success: true,
      data: { total, byGender, byResidence, byMunicipality, byMonth, bySpot, totalMale, totalFemale, totalForeign, totalLocal }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET single visitor
router.get('/:id', protect, async (req, res) => {
  try {
    const record = await Visitor.findById(req.params.id).populate('submittedBy', 'name email');
    if (!record) return res.status(404).json({ success: false, message: 'Record not found' });
    res.json({ success: true, data: record });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST create visitor
router.post('/', protect, async (req, res) => {
  try {
    const visitDate = new Date(req.body.visitDate);
    const data = {
      ...req.body,
      submittedBy: req.user._id,
      reportYear: visitDate.getFullYear(),
      reportMonth: visitDate.getMonth() + 1
    };
    const record = await Visitor.create(data);
    res.status(201).json({ success: true, data: record });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST bulk create
router.post('/bulk', protect, async (req, res) => {
  try {
    const records = req.body.records.map(r => {
      const visitDate = new Date(r.visitDate);
      return {
        ...r,
        submittedBy: req.user._id,
        reportYear: visitDate.getFullYear(),
        reportMonth: visitDate.getMonth() + 1
      };
    });
    const created = await Visitor.insertMany(records);
    res.status(201).json({ success: true, count: created.length, data: created });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// PUT update visitor
router.put('/:id', protect, async (req, res) => {
  try {
    const record = await Visitor.findById(req.params.id);
    if (!record) return res.status(404).json({ success: false, message: 'Record not found' });
    if (req.user.role !== 'admin' && record.submittedBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }
    const updated = await Visitor.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    res.json({ success: true, data: updated });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// DELETE visitor
router.delete('/:id', protect, async (req, res) => {
  try {
    const record = await Visitor.findById(req.params.id);
    if (!record) return res.status(404).json({ success: false, message: 'Record not found' });
    if (req.user.role !== 'admin' && record.submittedBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }
    await Visitor.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Record deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
