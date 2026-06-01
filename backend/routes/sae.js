const express = require('express');
const router = express.Router();
const SAE = require('../models/SAE');
const { protect, adminOnly } = require('../middleware/auth');

// GET all SAE records
router.get('/', protect, async (req, res) => {
  try {
    let query = {};
    if (req.user.role !== 'admin') query.submittedBy = req.user._id;

    const { municipality, year, search, page = 1, limit = 20 } = req.query;
    if (municipality) query.municipality = municipality;
    if (year) query.reportYear = parseInt(year);
    if (search) {
      query.$or = [
        { nameOfEstablishment: { $regex: search, $options: 'i' } },
        { municipality: { $regex: search, $options: 'i' } },
        { typeCode: { $regex: search, $options: 'i' } }
      ];
    }

    const total = await SAE.countDocuments(query);
    const records = await SAE.find(query)
      .populate('submittedBy', 'name email')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    res.json({ success: true, count: records.length, total, data: records });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET single SAE
router.get('/:id', protect, async (req, res) => {
  try {
    const record = await SAE.findById(req.params.id).populate('submittedBy', 'name email');
    if (!record) return res.status(404).json({ success: false, message: 'Record not found' });
    res.json({ success: true, data: record });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST create SAE
router.post('/', protect, async (req, res) => {
  try {
    const data = { ...req.body, submittedBy: req.user._id };
    const record = await SAE.create(data);
    res.status(201).json({ success: true, data: record });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST bulk create SAE
router.post('/bulk', protect, async (req, res) => {
  try {
    const records = req.body.records.map(r => ({ ...r, submittedBy: req.user._id }));
    const created = await SAE.insertMany(records);
    res.status(201).json({ success: true, count: created.length, data: created });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// PUT update SAE
router.put('/:id', protect, async (req, res) => {
  try {
    const record = await SAE.findById(req.params.id);
    if (!record) return res.status(404).json({ success: false, message: 'Record not found' });
    if (req.user.role !== 'admin' && record.submittedBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }
    const updated = await SAE.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    res.json({ success: true, data: updated });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// DELETE SAE
router.delete('/:id', protect, async (req, res) => {
  try {
    const record = await SAE.findById(req.params.id);
    if (!record) return res.status(404).json({ success: false, message: 'Record not found' });
    if (req.user.role !== 'admin' && record.submittedBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }
    await SAE.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Record deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
