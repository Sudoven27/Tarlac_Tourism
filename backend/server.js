const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

const app = express();

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

// Middleware
const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:5173',
  'https://tarlac-tourism-eight.vercel.app',
  process.env.FRONTEND_URL || 'http://localhost:3000'
];

app.use(cors({ origin: allowedOrigins, credentials: true }));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use('/uploads', express.static(uploadsDir));

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/users', require('./routes/users'));
app.use('/api/sae', require('./routes/sae'));
app.use('/api/sta', require('./routes/sta'));
app.use('/api/ste', require('./routes/ste'));
app.use('/api/dashboard', require('./routes/dashboard'));
app.use('/api/export', require('./routes/export'));
app.use('/api/visitors', require('./routes/visitors'));
app.use('/api/images', require('./routes/images'));
app.use('/api/excel', require('./routes/excel'));

// Health check routes
app.get('/', (req, res) => res.json({ status: 'OK', message: 'Tarlac Tourism API running' }));
app.get('/api/health', (req, res) => res.json({ status: 'OK', message: 'Tarlac Tourism API running' }));

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/tarlac_tourism');
    console.log('✅ MongoDB Connected');
  } catch (err) {
    console.error('❌ MongoDB error:', err.message);
    process.exit(1);
  }
};
connectDB();

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
module.exports = app;
