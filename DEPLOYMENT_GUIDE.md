# 🚀 Tarlac Tourism System - Free Deployment Guide

## 📋 Overview
This guide will help you deploy your MERN stack application for **FREE** using:
- **Backend**: Render.com (Node.js)
- **Frontend**: Vercel.com (React)
- **Database**: MongoDB Atlas (Free tier)

**Total Cost**: $0/month

---

## ⚠️ CHANGES NEEDED BEFORE DEPLOYMENT

### 1. **Backend Changes Required**

#### A. Create `.env.production` file
Create `backend/.env.production`:
```
MONGODB_URI=your_mongodb_atlas_connection_string
NODE_ENV=production
PORT=5000
JWT_SECRET=your_secure_jwt_secret_key_here
```

#### B. Update CORS in `backend/server.js`
**BEFORE:**
```javascript
app.use(cors({ origin: ['http://localhost:3000', 'http://localhost:5173'], credentials: true }));
```

**AFTER:**
```javascript
app.use(cors({ 
  origin: [
    'http://localhost:3000', 
    'http://localhost:5173',
    'https://your-vercel-frontend.vercel.app'  // Add your Vercel domain
  ], 
  credentials: true 
}));
```

#### C. Add start script to `backend/package.json`
Ensure it has:
```json
"scripts": {
  "start": "node server.js",
  "dev": "nodemon server.js",
  "seed": "node seed.js"
}
```

#### D. Create `Procfile` in backend root
```
web: node server.js
```

#### E. Create `.env.example` for reference
```
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/tarlac_tourism
NODE_ENV=development
PORT=5000
JWT_SECRET=your_jwt_secret_key
```

---

### 2. **Frontend Changes Required**

#### A. Update `frontend/vite.config.js`
**BEFORE:**
```javascript
export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true
      },
      '/uploads': {
        target: 'http://localhost:5000',
        changeOrigin: true
      }
    }
  }
})
```

**AFTER:**
```javascript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true
      },
      '/uploads': {
        target: 'http://localhost:5000',
        changeOrigin: true
      }
    }
  },
  build: {
    outDir: 'dist',
    sourcemap: false
  }
})
```

#### B. Update `frontend/src/services/api.js`
**BEFORE:**
```javascript
const api = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' }
});
```

**AFTER:**
```javascript
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  headers: { 'Content-Type': 'application/json' }
});
```

#### C. Create `frontend/.env.development`
```
VITE_API_URL=http://localhost:5000/api
```

#### D. Create `frontend/.env.production`
```
VITE_API_URL=https://your-render-backend.onrender.com/api
```

#### E. Create `frontend/.gitignore` (if not exists)
Add:
```
node_modules/
dist/
.env.local
.env.*.local
```

---

### 3. **Database Setup (MongoDB Atlas)**

1. Go to [mongodb.com/cloud/atlas](https://mongodb.com/cloud/atlas)
2. Sign up for free account
3. Create a free M0 cluster
4. Get connection string (looks like):
   ```
   mongodb+srv://username:password@cluster.mongodb.net/tarlac_tourism?retryWrites=true&w=majority
   ```
5. Add your IPs to IP Whitelist:
   - During dev: Add your machine IP
   - For production: Add `0.0.0.0/0` (allows all IPs - okay for free tier)

---

## 🔧 STEP-BY-STEP DEPLOYMENT

### STEP 1: Prepare Code for Deployment

1. **Root folder** - Create file structure:
   ```
   tarlac-tourism/
   ├── backend/
   ├── frontend/
   └── .gitignore
   ```

2. **Create root `.gitignore`**:
   ```
   node_modules/
   .env
   .env.local
   .DS_Store
   ```

3. **Git setup**:
   ```bash
   git init
   git add .
   git commit -m "Initial commit - ready for deployment"
   git branch -M main
   ```

4. **Push to GitHub**:
   ```bash
   git remote add origin https://github.com/YOUR_USERNAME/tarlac-tourism.git
   git push -u origin main
   ```

---

### STEP 2: Deploy MongoDB Atlas Database

1. **Create MongoDB Atlas Account**
   - Go to [mongodb.com/cloud/atlas](https://mongodb.com/cloud/atlas)
   - Click "Sign Up"
   - Use Google/GitHub auth (faster)

2. **Create Cluster**
   - Click "Create" → Select "M0 FREE" tier
   - Choose region close to your users
   - Create cluster

3. **Add Database User**
   - Database Access → Add Database User
   - Username: `tourismadmin`
   - Password: Generate secure password
   - Save the credentials

4. **Get Connection String**
   - Clusters → Connect → Driver
   - Copy connection string
   - Replace `<password>` with your password
   - Example: `mongodb+srv://tourismadmin:password@cluster0.xxxxx.mongodb.net/tarlac_tourism?retryWrites=true&w=majority`

5. **Add IP to Whitelist**
   - Network Access → Add IP Address
   - Add `0.0.0.0/0` (allows all IPs)

---

### STEP 3: Deploy Backend on Render

1. **Create Render Account**
   - Go to [render.com](https://render.com)
   - Sign up with GitHub

2. **Create New Web Service**
   - Click "New +" → "Web Service"
   - Connect your GitHub repository
   - Select your repo

3. **Configure Service**
   - **Name**: `tarlac-tourism-backend`
   - **Environment**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Plan**: Select "Free"

4. **Set Environment Variables**
   - Add in "Environment" section:
     ```
     MONGODB_URI = mongodb+srv://tourismadmin:password@cluster0.xxxxx.mongodb.net/tarlac_tourism?retryWrites=true&w=majority
     NODE_ENV = production
     JWT_SECRET = your_very_secure_random_string_here_at_least_32_characters_long
     ```

5. **Deploy**
   - Click "Create Web Service"
   - Wait for deployment (2-3 minutes)
   - Copy your service URL: `https://tarlac-tourism-backend.onrender.com`

---

### STEP 4: Deploy Frontend on Vercel

1. **Create Vercel Account**
   - Go to [vercel.com](https://vercel.com)
   - Sign up with GitHub

2. **Import Project**
   - Click "Add New" → "Project"
   - Import your GitHub repo

3. **Configure Project**
   - **Framework**: Vite
   - **Root Directory**: `frontend`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`

4. **Set Environment Variables**
   - Go to "Settings" → "Environment Variables"
   - Add:
     ```
     VITE_API_URL = https://tarlac-tourism-backend.onrender.com/api
     ```

5. **Deploy**
   - Click "Deploy"
   - Wait for deployment (1-2 minutes)
   - Copy your project URL: `https://tarlac-tourism.vercel.app`

---

### STEP 5: Final Configuration

1. **Update Backend CORS**
   - On Render dashboard, go to your backend service
   - Settings → Environment Variables
   - Update `CORS_ORIGINS` to include Vercel URL

2. **Update Backend Code** (if needed)
   - Update `backend/server.js` CORS line with Vercel URL
   - Commit and push to GitHub
   - Render auto-deploys on push

3. **Test Deployment**
   - Visit: `https://your-frontend.vercel.app`
   - Try logging in
   - Test data operations
   - Check browser console for errors

---

## 📁 Updated File Structure for Deployment

```
tarlac-tourism/
├── backend/
│   ├── .env.production          ← NEW: Production env
│   ├── .env.example             ← NEW: Template
│   ├── Procfile                 ← NEW: For Render
│   ├── package.json             ← UPDATED: start script
│   ├── server.js                ← UPDATED: CORS origins
│   ├── routes/
│   ├── models/
│   └── ...
├── frontend/
│   ├── .env.development         ← NEW: Dev env
│   ├── .env.production          ← NEW: Production env
│   ├── vite.config.js           ← UPDATED: build config
│   ├── package.json
│   ├── src/
│   │   ├── services/
│   │   │   └── api.js           ← UPDATED: Dynamic API URL
│   │   └── ...
│   └── ...
├── .gitignore                   ← NEW/UPDATED
├── DEPLOYMENT_GUIDE.md          ← This file
└── package.json                 ← ROOT (optional)
```

---

## ⚡ Quick Reference: URLs After Deployment

- **Frontend**: `https://tarlac-tourism.vercel.app`
- **Backend API**: `https://tarlac-tourism-backend.onrender.com`
- **MongoDB**: `mongodb+srv://...`

---

## 🔒 Security Checklist

- [ ] Never commit `.env` files to Git
- [ ] Use strong JWT_SECRET (32+ characters)
- [ ] Use strong MongoDB password
- [ ] Enable HTTPS (automatic on both platforms)
- [ ] Add environment-specific variables
- [ ] Whitelist IPs in MongoDB (or use 0.0.0.0/0)
- [ ] Test all authentication flows

---

## 🐛 Troubleshooting

### Frontend can't connect to backend
- Check VITE_API_URL in Vercel environment variables
- Check CORS origins in backend
- Verify backend service is running (check Render logs)

### MongoDB connection fails
- Verify connection string format
- Check username/password
- Confirm IP whitelist includes your IPs
- Check network connectivity in MongoDB Atlas

### Build fails
- Check build logs in platform console
- Ensure `npm run build` works locally first
- Verify all dependencies in package.json

### Uploads not working (on free tier)
- File uploads may have size limits on free tier
- Consider using cloud storage (Cloudinary free tier) instead

---

## 💡 Next Steps (After Deployment)

1. Set up custom domain (optional)
2. Add monitoring/logging
3. Set up automated backups for MongoDB
4. Consider upgrading to paid tier if needed
5. Add CI/CD workflows

---

## 📞 Support Links
- **Render Docs**: https://render.com/docs
- **Vercel Docs**: https://vercel.com/docs
- **MongoDB Atlas Docs**: https://www.mongodb.com/docs/atlas/

