# Tarlac Tourism – Inventory Supply Data Management System
**Province of Tarlac, Region III · 2026**

A full-stack MERN web application for managing the 2026 Inventory Supply and Demand Report of Tourism Data for the Province of Tarlac. Features emerald green & gold theme, role-based access, OCR image upload, and PDF export matching the official Word template.

---

## 🖥️ Tech Stack
- **Backend**: Node.js + Express.js + MongoDB (Mongoose)
- **Frontend**: React 18 + Vite + Tailwind CSS + Recharts
- **Auth**: JWT role-based (Admin / Staff)
- **OCR**: Tesseract.js (server-side image text extraction)
- **PDF**: Puppeteer (backend) + html2pdf.js fallback (frontend)

---

## 📁 Project Structure
```
tarlac-tourism/
├── backend/
│   ├── models/         User, SAE, STA, STE, Visitor
│   ├── routes/         auth, users, sae, sta, ste, visitors, dashboard, export, ocr
│   ├── middleware/     JWT auth
│   ├── seed.js         Sample data seeder
│   └── server.js
└── frontend/src/
    ├── pages/          Dashboard, SAE, STA, STE, Visitors, Reports,
    │                   Upload, Users, Profile, Login, NotFound
    ├── components/     Layout, DataTable, Modal, Forms, PDFDownloadButton,
    │                   RecordDetailModal, ConfirmDialog, ErrorBoundary
    ├── hooks/          usePDFExport
    ├── context/        AuthContext
    └── services/       Axios API instance
```

---

## ⚡ Quick Start

### Prerequisites
- **Node.js** v18+ → https://nodejs.org
- **MongoDB** v6+ → https://www.mongodb.com/try/download/community
  *(or MongoDB Atlas cloud)*

### 1. Install Everything (one command)

```bash
npm install
```
This installs root tools + all backend + all frontend dependencies automatically.

### 2. Configure Environment
```bash
# .env.example is auto-copied to backend/.env during setup
# Edit backend/.env if you need a different MongoDB URI
```

### 3. Start MongoDB
```bash
mongod   # local install
# or use MongoDB Atlas — set MONGODB_URI in backend/.env
```

### 4. Run the App (one command)

```bash
npm run dev
```
This starts **both** the backend (port 5000) and frontend (port 3000) together in one terminal using `concurrently`.

### 5. Seed Sample Data (Recommended)
```bash
npm run seed
# Creates admin + 10 SAE + 10 STA + 8 STE + 60 visitor records
```

### 6. Open the App
Open **http://localhost:3000**

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@tarlac.gov.ph | Admin@2026 |
| Staff | maria.santos@tarlac.gov.ph | Staff@2026 |

---

## 📊 Data Modules

| Module | Form | Description |
|--------|------|-------------|
| **SAE** | SAE1 | Accommodation Establishments (Hotels, Resorts, Inns) |
| **STA** | STA1 | Tourist Attractions (Parks, Shrines, Falls, Events) |
| **STE** | STE1 | Tourism Enterprises (Travel Agencies, Restaurants) |
| **Visitors** | — | Individual visitor records with demographics & feedback |

---

## 📄 PDF Export

Every record type generates a PDF matching the official **Tarlac Tourism Office – Visitor Management** Word template layout:

- Emerald green `#2E6B3E` headers, gold `#D4A017` accents
- Attraction Code + I.D., two image slots (graceful "No Image" fallback)
- Municipality / Address / Year / Category / Description
- Type-specific detail grid (rooms, employees, entry fee, etc.)
- Official stamp footer with generation date

**Download buttons appear in 3 locations:**
1. Table row — gold icon button (🔽)
2. Record detail modal — Details tab
3. Record detail modal — PDF Preview tab (live iframe preview)

**File naming:** `EstablishmentName_SAE-XXXXXX.pdf`

**Install Puppeteer** for high-quality server-side PDFs:
```bash
cd backend && npm install puppeteer
```
Without Puppeteer, html2pdf.js (CDN) renders PDFs client-side automatically.

---

## 🌐 API Reference

```
POST   /api/auth/login              Login
POST   /api/auth/seed               Create first admin (run once)
GET    /api/auth/me                 Get current user

GET    /api/sae                     List (search, filter, paginate)
POST   /api/sae                     Create
PUT    /api/sae/:id                 Update
DELETE /api/sae/:id                 Delete

GET    /api/sta                     (same pattern)
GET    /api/ste                     (same pattern)

GET    /api/visitors                List visitors
GET    /api/visitors/stats          Aggregated visitor statistics
POST   /api/visitors                Create visitor record
PUT    /api/visitors/:id            Update
DELETE /api/visitors/:id            Delete

GET    /api/dashboard/stats         Full dashboard aggregations

GET    /api/export/pdf/:type/:id    Download PDF (SAE/STA/STE)
GET    /api/export/html/:type/:id   HTML template for client render
GET    /api/export/pdf/visitor/:id  Download visitor PDF
GET    /api/export/html/visitor/:id Visitor HTML template

POST   /api/ocr/upload              Upload image (returns URL)
POST   /api/ocr/extract             Upload + OCR text extraction

GET    /api/users                   List users (Admin)
POST   /api/users                   Create user (Admin)
PUT    /api/users/:id               Update user
DELETE /api/users/:id               Delete user
```

---

## 🎨 Design System
- **Font**: Outfit (body) + Playfair Display (headings)
- **Primary**: Emerald `#059669` / Dark `#047857`
- **Accent**: Gold `#d97706` / Light Gold `#f59e0b`
- **Sidebar**: `linear-gradient(135deg, #065f46, #059669)`
- **Responsive**: Mobile-first, sidebar collapses on small screens

---

## 🛠️ Scripts

All commands are run from the **root folder** — no need to `cd` into subfolders.

| Command | Description |
|---------|-------------|
| `npm install` | Install all dependencies (root + backend + frontend) |
| `npm run dev` | Start backend + frontend together in one terminal |
| `npm run seed` | Seed sample data (admin + SAE + STA + STE + visitors) |
| `npm run seed:clear` | Wipe DB then re-seed fresh |
| `npm run build` | Build frontend for production |
| `npm start` | Start backend + frontend (uses `node` not nodemon) |

---

*Provincial Tourism Office – Province of Tarlac, Region III, Philippines · 2026*
