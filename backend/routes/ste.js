const express = require('express');
const router = express.Router();
const STE = require('../models/STE');
const { protect } = require('../middleware/auth');

router.get('/', protect, async (req, res) => {
  try {
    let query = {};
    if (req.user.role !== 'admin') query.submittedBy = req.user._id;
    const { cityMun, year, search, page = 1, limit = 20 } = req.query;
    if (cityMun) query.cityMun = cityMun;
    if (year) query.reportYear = parseInt(year);
    if (search) {
      query.$or = [
        { nameOfEnterprise: { $regex: search, $options: 'i' } },
        { cityMun: { $regex: search, $options: 'i' } },
        { type: { $regex: search, $options: 'i' } }
      ];
    }
    const total = await STE.countDocuments(query);
    const records = await STE.find(query)
      .populate('submittedBy', 'name email')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));
    res.json({ success: true, count: records.length, total, data: records });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.get('/:id', protect, async (req, res) => {
  try {
    const record = await STE.findById(req.params.id).populate('submittedBy', 'name email');
    if (!record) return res.status(404).json({ success: false, message: 'Record not found' });
    res.json({ success: true, data: record });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.post('/', protect, async (req, res) => {
  try {
    const data = { ...req.body, submittedBy: req.user._id };
    const record = await STE.create(data);
    res.status(201).json({ success: true, data: record });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.post('/bulk', protect, async (req, res) => {
  try {
    const records = req.body.records.map(r => ({ ...r, submittedBy: req.user._id }));
    const created = await STE.insertMany(records);
    res.status(201).json({ success: true, count: created.length, data: created });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.put('/:id', protect, async (req, res) => {
  try {
    const record = await STE.findById(req.params.id);
    if (!record) return res.status(404).json({ success: false, message: 'Record not found' });
    if (req.user.role !== 'admin' && record.submittedBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }
    const updated = await STE.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json({ success: true, data: updated });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.delete('/:id', protect, async (req, res) => {
  try {
    const record = await STE.findById(req.params.id);
    if (!record) return res.status(404).json({ success: false, message: 'Record not found' });
    if (req.user.role !== 'admin' && record.submittedBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }
    await STE.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Record deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
