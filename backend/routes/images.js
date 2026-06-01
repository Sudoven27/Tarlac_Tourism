const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { protect } = require('../middleware/auth');

const uploadsDir = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadsDir),
  filename: (req, file, cb) => {
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `${unique}${path.extname(file.originalname)}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = /jpeg|jpg|png|gif|bmp|webp/;
    if (allowed.test(path.extname(file.originalname).toLowerCase()) && allowed.test(file.mimetype)) {
      return cb(null, true);
    }
    cb(new Error('Only image files are allowed'));
  }
});

// POST /api/images/upload — upload up to 2 images, returns array of URLs
router.post('/upload', protect, upload.array('images', 2), async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ success: false, message: 'No files uploaded' });
    }
    const baseUrl = `${req.protocol}://${req.get('host')}`;
    const urls = req.files.map(f => `${baseUrl}/uploads/${f.filename}`);
    res.json({ success: true, urls });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// DELETE /api/images/delete — delete a specific uploaded image by filename
router.delete('/delete/:filename', protect, (req, res) => {
  try {
    const filePath = path.join(uploadsDir, req.params.filename);
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    res.json({ success: true, message: 'Image deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
