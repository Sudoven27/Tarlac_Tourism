const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const SAE = require('../models/SAE');
const STA = require('../models/STA');
const STE = require('../models/STE');

// ─── Helpers ──────────────────────────────────────────────────────────────────
function imgBlock(url, label) {
  if (url) {
    return `<div class="img-wrap">
      <p class="img-label">${label}</p>
      <img src="${url}" alt="${label}" style="width:100%;max-height:200px;object-fit:contain;border-radius:4px;border:1px solid #e5e7eb;" onerror="this.style.display='none';this.nextElementSibling.style.display='flex'"/>
      <div class="no-img" style="display:none">No Image</div>
    </div>`;
  }
  return `<div class="img-wrap">
    <p class="img-label">${label}</p>
    <div class="no-img">No Image</div>
  </div>`;
}

async function getVisitorSummary(record, year) {
  try {
    const Visitor = require('../models/Visitor');
    const spotName = record.taName || record.nameOfEstablishment || record.nameOfEnterprise;
    const mun = record.cityMun || record.municipality;
    const matchFilter = spotName ? { touristSpot: spotName } : { municipality: mun };
    const y = year ? parseInt(year) : new Date().getFullYear();
    const dateF = { visitDate: { $gte: new Date(y, 0, 1), $lt: new Date(y + 1, 0, 1) } };
    const [vs] = await Visitor.aggregate([
      { $match: { ...dateF, ...matchFilter } },
      { $group: { _id: null, total: { $sum: 1 },
        thisMun: { $sum: { $cond: [{ $eq: ['$residenceType', 'This Municipality'] }, 1, 0] } },
        thisProvince: { $sum: { $cond: [{ $eq: ['$residenceType', 'This Province'] }, 1, 0] } },
        otherProvince: { $sum: { $cond: [{ $eq: ['$residenceType', 'Other Province'] }, 1, 0] } },
        foreign: { $sum: { $cond: [{ $eq: ['$residenceType', 'Foreign'] }, 1, 0] } }
      }}
    ]);
    return vs || { total: 0, thisMun: 0, thisProvince: 0, otherProvince: 0, foreign: 0 };
  } catch { return { total: 0, thisMun: 0, thisProvince: 0, otherProvince: 0, foreign: 0 }; }
}

async function getRecord(type, id) {
  if (type === 'sae') return SAE.findById(id).populate('submittedBy', 'name email');
  if (type === 'sta') return STA.findById(id).populate('submittedBy', 'name email');
  if (type === 'ste') return STE.findById(id).populate('submittedBy', 'name email');
  return null;
}

async function sendPDF(res, html, filename) {
  try {
    const puppeteer = require('puppeteer');
    const browser = await puppeteer.launch({
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
    });
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'networkidle0', timeout: 15000 });
    const buf = await page.pdf({
      format: 'A4', printBackground: true,
      margin: { top: '0', right: '0', bottom: '0', left: '0' }
    });
    await browser.close();
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    return res.send(buf);
  } catch {
    // Puppeteer unavailable — return HTML for client-side rendering
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    return res.send(html);
  }
}

// ─── SAE / STA / STE PDF Template ────────────────────────────────────────────
function buildPDFTemplate(type, record, baseUrl, vs) {
  const E = '#2E6B3E';
  const G = '#D4A017';

  const rawImages = Array.isArray(record.images)
    ? record.images
    : record.imageUrl ? [record.imageUrl] : [];
  const images = rawImages
    .map(u => u && u.startsWith('http') ? u : u ? `${baseUrl}${u}` : null)
    .filter(Boolean);
  const img1 = images[0] || null;
  const img2 = images[1] || null;

  let name, code, idCode, municipality, address, year, description, typeLabel, category, extraGrid;

  if (type === 'sae') {
    name = record.nameOfEstablishment || '—';
    code = record.attractionCode || `SAE-${record.reportYear || 2026}-${String(record._id).slice(-6).toUpperCase()}`;
    idCode = `AE-${String(record._id).slice(-4).toUpperCase()}`;
    municipality = record.cityMun || record.municipality || '—';
    address = record.address || '—';
    year = record.reportYear || '—';
    typeLabel = 'ACCOMMODATION ESTABLISHMENT';
    category = record.typeCode || '—';
    description = record.notes || `${record.typeCode || 'Accommodation'} in ${municipality}. Rooms: ${record.noOfRooms || 0}. Employees: ${record.noOfEmployees || 0}.`;
    extraGrid = `
      <div class="ei"><div class="el">No. of Rooms</div><div class="ev">${record.noOfRooms ?? '—'}</div></div>
      <div class="ei"><div class="el">No. of Employees</div><div class="ev">${record.noOfEmployees ?? '—'}</div></div>
      <div class="ei"><div class="el">Female Employees</div><div class="ev">${record.femaleEmployees ?? '—'}</div></div>
      <div class="ei"><div class="el">Male Employees</div><div class="ev">${record.maleEmployees ?? '—'}</div></div>
      <div class="ei"><div class="el">Month</div><div class="ev">${record.reportMonth ? ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][record.reportMonth - 1] : '—'}</div></div>
      <div class="ei"><div class="el">Contact</div><div class="ev">${record.contactNumber || '—'}</div></div>
      <div class="ei"><div class="el">Email</div><div class="ev">${record.email || '—'}</div></div>
      <div class="ei"><div class="el">Province/HUC</div><div class="ev">${record.provHuc || 'Tarlac'}</div></div>`;
  } else if (type === 'sta') {
    name = record.taName || '—';
    code = record.attractionCode || `STA-${record.reportYear || 2026}-${String(record._id).slice(-6).toUpperCase()}`;
    idCode = `TA-${String(record._id).slice(-4).toUpperCase()}`;
    municipality = record.cityMun || '—';
    address = `${record.brgy ? record.brgy + ', ' : ''}${record.cityMun || ''}, Tarlac`;
    year = record.yearEst ? `Est. ${record.yearEst}` : (record.reportYear || '—');
    typeLabel = 'TOURIST ATTRACTION';
    category = (record.typeCode || '').replace(/_/g, ' ') || '—';
    description = record.descriptionNotes || `Tourist attraction in ${municipality}. Category: ${category}. Dev. Level: ${record.devtLvl || 'N/A'}.`;
    extraGrid = `
      <div class="ei"><div class="el">Employees</div><div class="ev">${record.employees ?? '—'}</div></div>
      <div class="ei"><div class="el">Female Emp.</div><div class="ev">${record.femaleEmp ?? '—'}</div></div>
      <div class="ei"><div class="el">Male Emp.</div><div class="ev">${record.maleEmp ?? '—'}</div></div>
      <div class="ei"><div class="el">Barangay</div><div class="ev">${record.brgy || '—'}</div></div>
      <div class="ei"><div class="el">TA Category</div><div class="ev">${record.taCategory || '—'}</div></div>
      <div class="ei"><div class="el">NTDP Category</div><div class="ev">${record.ntdpCategory || '—'}</div></div>
      <div class="ei"><div class="el">Dev. Level</div><div class="ev">${record.devtLvl || '—'}</div></div>
      <div class="ei"><div class="el">Management</div><div class="ev">${record.mgt || '—'}</div></div>
      <div class="ei"><div class="el">Online</div><div class="ev">${record.onlineConnectivity || '—'}</div></div>
      <div class="ei"><div class="el">Entry Fee</div><div class="ev">${record.entryFee ? '₱' + record.entryFee : '—'}</div></div>
      <div class="ei"><div class="el">Contact Person</div><div class="ev">${record.contactPerson || '—'}</div></div>
      <div class="ei"><div class="el">Contact Info</div><div class="ev">${record.contactInfo || '—'}</div></div>`;
  } else {
    name = record.nameOfEnterprise || '—';
    code = record.attractionCode || `STE-${record.reportYear || 2026}-${String(record._id).slice(-6).toUpperCase()}`;
    idCode = `TE-${String(record._id).slice(-4).toUpperCase()}`;
    municipality = record.cityMun || '—';
    address = record.address || `${record.cityMun || ''}, Tarlac`;
    year = record.reportYear || '—';
    typeLabel = 'TOURISM ENTERPRISE';
    category = record.type || '—';
    description = record.notes || `${record.type || 'Enterprise'} in ${municipality}. Employees: ${record.totalEmployees || 0}.`;
    extraGrid = `
      <div class="ei"><div class="el">Seats/Units</div><div class="ev">${record.seatsUnit ?? '—'}</div></div>
      <div class="ei"><div class="el">Total Employees</div><div class="ev">${record.totalEmployees ?? '—'}</div></div>
      <div class="ei"><div class="el">Female Emp.</div><div class="ev">${record.femaleEmployees ?? '—'}</div></div>
      <div class="ei"><div class="el">Male Emp.</div><div class="ev">${record.maleEmployees ?? '—'}</div></div>
      <div class="ei"><div class="el">Month</div><div class="ev">${record.reportMonth ? ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][record.reportMonth - 1] : '—'}</div></div>
      <div class="ei"><div class="el">Classification</div><div class="ev">${record.classification || '—'}</div></div>
      <div class="ei"><div class="el">Contact</div><div class="ev">${record.contactNumber || '—'}</div></div>
      <div class="ei"><div class="el">Province/HUC</div><div class="ev">${record.provHuc || 'Tarlac'}</div></div>`;
  }

  const visitorSummaryHtml = vs ? `
  <div style="margin-top:0;border:1px solid #ddd;border-top:none;">
    <div style="background:${E};color:white;font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:.8px;padding:6px 8px;">VISITOR BREAKDOWN SUMMARY</div>
    <div style="display:grid;grid-template-columns:repeat(5,1fr);">
      <div style="padding:8px 10px;border-right:1px solid #ddd;text-align:center;">
        <div style="font-size:8px;font-weight:700;text-transform:uppercase;color:#888;margin-bottom:3px;">This Municipality</div>
        <div style="font-size:16px;font-weight:700;color:${E};">${vs.thisMun}</div>
      </div>
      <div style="padding:8px 10px;border-right:1px solid #ddd;text-align:center;">
        <div style="font-size:8px;font-weight:700;text-transform:uppercase;color:#888;margin-bottom:3px;">Other Municipality</div>
        <div style="font-size:16px;font-weight:700;color:#0891b2;">${vs.thisProvince}</div>
      </div>
      <div style="padding:8px 10px;border-right:1px solid #ddd;text-align:center;">
        <div style="font-size:8px;font-weight:700;text-transform:uppercase;color:#888;margin-bottom:3px;">Other Province</div>
        <div style="font-size:16px;font-weight:700;color:#7c3aed;">${vs.otherProvince}</div>
      </div>
      <div style="padding:8px 10px;border-right:1px solid #ddd;text-align:center;">
        <div style="font-size:8px;font-weight:700;text-transform:uppercase;color:#888;margin-bottom:3px;">Foreign</div>
        <div style="font-size:16px;font-weight:700;color:#d97706;">${vs.foreign}</div>
      </div>
      <div style="padding:8px 10px;text-align:center;background:#F9FFF9;">
        <div style="font-size:8px;font-weight:700;text-transform:uppercase;color:#888;margin-bottom:3px;">Total Visitors</div>
        <div style="font-size:16px;font-weight:700;color:${E};">${vs.total}</div>
      </div>
    </div>
  </div>` : '';

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"/>
<style>
  *{margin:0;padding:0;box-sizing:border-box;}
  body{font-family:Arial,sans-serif;font-size:11px;background:white;-webkit-print-color-adjust:exact;print-color-adjust:exact;}
  .page{width:794px;margin:0 auto;padding:32px 40px 40px;}
  .hdr{display:flex;align-items:center;gap:14px;padding-bottom:10px;border-bottom:3px solid ${E};margin-bottom:10px;}
  .logo{width:52px;height:52px;background:${E};border-radius:50%;display:flex;align-items:center;justify-content:center;color:white;font-size:18px;font-weight:700;flex-shrink:0;}
  .org{font-size:18px;font-weight:700;color:${E};line-height:1.2;}
  .org span{color:${G};}
  .type-badge{background:${G};color:white;font-size:9px;font-weight:700;padding:4px 12px;border-radius:16px;letter-spacing:1px;text-transform:uppercase;white-space:nowrap;}
  .banner{background:${E};color:white;text-align:center;padding:6px;font-size:10px;font-weight:700;letter-spacing:2px;text-transform:uppercase;border-radius:4px;margin-bottom:14px;}
  table{width:100%;border-collapse:collapse;border:1px solid #ddd;}
  td{border:1px solid #ddd;}
  .th{background:${E};color:white;font-size:9px;font-weight:700;text-transform:uppercase;text-align:center;padding:6px 8px;}
  .id-val{text-align:center;font-size:13px;font-weight:700;color:${E};padding:8px;background:#F9FFF9;font-family:monospace;}
  .lbl{background:#F2F2F2;font-size:9px;font-weight:700;text-transform:uppercase;color:#555;padding:7px 8px;width:22%;white-space:nowrap;}
  .val{font-size:11px;font-weight:600;color:#1a2e1a;padding:7px 8px;}
  .val.big{font-size:14px;font-weight:700;color:${E};}
  .sec-h{background:${E};color:white;font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:.8px;padding:6px 8px;}
  .desc{padding:10px 12px;font-size:10px;line-height:1.7;color:#333;min-height:60px;}
  .extra{display:grid;grid-template-columns:1fr 1fr;border:1px solid #ddd;border-top:none;}
  .ei{padding:6px 8px;border-right:1px solid #ddd;border-bottom:1px solid #ddd;}
  .ei:nth-child(even){border-right:none;}
  .el{font-size:8px;font-weight:700;text-transform:uppercase;color:#888;margin-bottom:1px;}
  .ev{font-size:10px;font-weight:600;color:#333;}
  .cat{display:inline-block;background:${G}22;color:${G};border:1px solid ${G}55;font-size:9px;font-weight:700;padding:2px 8px;border-radius:10px;letter-spacing:.5px;text-transform:uppercase;}
  .img-wrap{flex:1;text-align:center;}
  .img-label{font-size:9px;font-weight:700;text-transform:uppercase;color:${E};letter-spacing:.8px;margin-bottom:6px;}
  .no-img{width:100%;height:160px;background:#f5f5f5;display:flex;align-items:center;justify-content:center;border-radius:4px;color:#bbb;font-size:11px;border:1px dashed #ccc;}
</style>
</head>
<body>
<div class="page">

  <div class="hdr">
    <div class="logo">T</div>
    <div style="flex:1">
      <div class="org"><span>TARLAC</span> TOURISM OFFICE</div>
      <div style="font-size:9px;color:#888;letter-spacing:2px;text-transform:uppercase;margin-top:2px;">Heart of Wonders · Province of Tarlac, Region III</div>
      <div style="font-size:10px;color:#555;font-weight:600;margin-top:2px;">Inventory Supply Data System — Official Record</div>
    </div>
    <div class="type-badge">${typeLabel}</div>
  </div>

  <div class="banner">${typeLabel} · OFFICIAL RECORD FORM</div>

  <table>
    <tr><td colspan="2" class="th">ATTRACTION CODE</td><td class="th">ATTRACTION I.D.</td></tr>
    <tr><td colspan="2" class="id-val">${code}</td><td class="id-val">${idCode}</td></tr>
  </table>

  <div style="border:1px solid #ddd;border-top:none;">
    <div class="th" style="text-align:left;padding:6px 8px;">PHOTOS</div>
    <div style="display:flex;gap:12px;padding:12px;background:#fafafa;">
      ${imgBlock(img1, 'Image 1 — Front / Main')}
      ${imgBlock(img2, 'Image 2 — Additional')}
    </div>
  </div>

  <table style="border-top:none;">
    <tr><td class="lbl">Name</td><td colspan="2" class="val big">${name}</td></tr>
    <tr><td class="lbl">Municipality</td><td class="val">${municipality}</td><td class="val"><span class="cat">${category}</span></td></tr>
    <tr><td class="lbl">Address</td><td colspan="2" class="val">${address}</td></tr>
    <tr><td class="lbl">Year</td><td colspan="2" class="val">${year}</td></tr>
    <tr><td colspan="3" class="sec-h">Description / Notes</td></tr>
    <tr><td colspan="3" class="desc">${description || '—'}</td></tr>
  </table>

  <div class="extra">${extraGrid}</div>

  ${visitorSummaryHtml}

</div>
</body>
</html>`;
}

// ─── Visitor PDF Template ─────────────────────────────────────────────────────
function buildVisitorPDF(record) {
  const E = '#2E6B3E';
  const G = '#D4A017';
  const MONTHS_FULL = ['January','February','March','April','May','June','July','August','September','October','November','December'];
  const visitDate = record.visitDate
    ? new Date(record.visitDate).toLocaleDateString('en-PH', { year: 'numeric', month: 'long', day: 'numeric' })
    : '—';
  const stars = '★'.repeat(record.rating || 0) + '☆'.repeat(5 - (record.rating || 0));

  return `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8"/>
<style>
  *{margin:0;padding:0;box-sizing:border-box;}
  body{font-family:Arial,sans-serif;font-size:11px;background:white;-webkit-print-color-adjust:exact;print-color-adjust:exact;}
  .page{width:794px;margin:0 auto;padding:32px 40px 40px;}
  .hdr{display:flex;align-items:center;gap:14px;padding-bottom:10px;border-bottom:3px solid ${E};margin-bottom:10px;}
  .logo{width:52px;height:52px;background:${E};border-radius:50%;display:flex;align-items:center;justify-content:center;color:white;font-size:18px;font-weight:700;flex-shrink:0;}
  .org{font-size:18px;font-weight:700;color:${E};}
  .org span{color:${G};}
  .badge{background:${G};color:white;font-size:9px;font-weight:700;padding:4px 12px;border-radius:16px;letter-spacing:1px;text-transform:uppercase;}
  .banner{background:${E};color:white;text-align:center;padding:6px;font-size:10px;font-weight:700;letter-spacing:2px;text-transform:uppercase;border-radius:4px;margin-bottom:14px;}
  table{width:100%;border-collapse:collapse;border:1px solid #ddd;}
  td{border:1px solid #ddd;}
  .th{background:${E};color:white;font-size:9px;font-weight:700;text-transform:uppercase;text-align:center;padding:6px 8px;}
  .id-val{text-align:center;font-size:13px;font-weight:700;color:${E};padding:8px;font-family:monospace;background:#F9FFF9;}
  .lbl{background:#F2F2F2;font-size:9px;font-weight:700;text-transform:uppercase;color:#555;padding:7px 8px;width:25%;white-space:nowrap;}
  .val{font-size:11px;font-weight:600;color:#1a2e1a;padding:7px 8px;}
  .val.big{font-size:14px;font-weight:700;color:${E};}
  .sec-h{background:${E};color:white;font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:.8px;padding:6px 8px;}
  .desc{padding:10px 12px;font-size:10px;line-height:1.6;color:#333;min-height:50px;}
  .grid2{display:grid;grid-template-columns:1fr 1fr;border:1px solid #ddd;border-top:none;}
  .gi{padding:6px 8px;border-right:1px solid #ddd;border-bottom:1px solid #ddd;}
  .gi:nth-child(even){border-right:none;}
  .gl{font-size:8px;font-weight:700;text-transform:uppercase;color:#888;margin-bottom:1px;}
  .gv{font-size:10px;font-weight:600;color:#333;}
  .stars{color:${G};font-size:15px;letter-spacing:2px;}
  .res-local{background:#d1fae5;color:#065f46;padding:2px 8px;border-radius:10px;font-size:9px;font-weight:700;}
  .res-foreign{background:#fef3c7;color:#92400e;padding:2px 8px;border-radius:10px;font-size:9px;font-weight:700;}
</style>
</head>
<body>
<div class="page">
  <div class="hdr">
    <div class="logo">T</div>
    <div style="flex:1">
      <div class="org"><span>TARLAC</span> TOURISM OFFICE</div>
      <div style="font-size:9px;color:#888;letter-spacing:2px;text-transform:uppercase;margin-top:2px;">Heart of Wonders · Province of Tarlac, Region III</div>
      <div style="font-size:10px;color:#555;font-weight:600;margin-top:2px;">Visitor Management System — Official Record</div>
    </div>
    <div class="badge">VISITOR RECORD</div>
  </div>
  <div class="banner">VISITOR MANAGEMENT SYSTEM · OFFICIAL RECORD</div>
  <table>
    <tr><td colspan="2" class="th">VISITOR CODE</td><td class="th">VISIT I.D.</td></tr>
    <tr>
      <td colspan="2" class="id-val">VIS-${record.reportYear||2026}-${String(record._id).slice(-6).toUpperCase()}</td>
      <td class="id-val">V-${String(record._id).slice(-4).toUpperCase()}</td>
    </tr>
    <tr><td class="lbl">Full Name</td><td colspan="2" class="val big">${record.firstName || ''} ${record.lastName || ''}</td></tr>
    <tr><td class="lbl">Gender / Age</td><td class="val">${record.gender || '—'}</td><td class="val">Age: <strong>${record.age || '—'}</strong></td></tr>
    <tr><td class="lbl">Residence</td>
      <td colspan="2" class="val">
        <span class="${record.residenceType === 'Foreign' ? 'res-foreign' : 'res-local'}">${record.residenceType || '—'}</span>
        &nbsp;${record.province || record.country || ''}
      </td>
    </tr>
    <tr><td class="lbl">Tourist Spot</td><td colspan="2" class="val big">${record.touristSpot || '—'}</td></tr>
    <tr><td class="lbl">Municipality</td><td class="val">${record.municipality || '—'}</td><td class="val">Province of Tarlac</td></tr>
    <tr><td class="lbl">Visit Date</td><td class="val">${visitDate}</td><td class="val">Group: <strong>${record.groupSize || 1}</strong></td></tr>
    <tr><td class="lbl">Purpose</td><td class="val">${record.purpose || '—'}</td><td class="val">Transport: ${record.transportation || '—'}</td></tr>
    <tr><td colspan="3" class="sec-h">Feedback &amp; Satisfaction</td></tr>
    <tr><td colspan="3" class="desc">
      <div style="margin-bottom:6px"><span class="stars">${stars}</span><span style="font-size:10px;color:#888;margin-left:6px">${record.rating ? record.rating + ' / 5' : 'No rating'}</span></div>
      <div>${record.feedback || 'No feedback provided.'}</div>
    </td></tr>
  </table>
  <div class="grid2">
    <div class="gi"><div class="gl">Nationality</div><div class="gv">${record.nationality || 'Filipino'}</div></div>
    <div class="gi"><div class="gl">Stay Duration</div><div class="gv">${record.stayDuration || '—'}</div></div>
    <div class="gi"><div class="gl">Est. Spend</div><div class="gv">${record.estimatedSpend ? '₱' + Number(record.estimatedSpend).toLocaleString() : '—'}</div></div>
    <div class="gi"><div class="gl">Report Month</div><div class="gv">${MONTHS_FULL[(record.reportMonth || 1) - 1]} ${record.reportYear || ''}</div></div>
    <div class="gi"><div class="gl">Notes</div><div class="gv">${record.notes || '—'}</div></div>
    <div class="gi"><div class="gl">Status</div><div class="gv">${record.status || 'submitted'}</div></div>
  </div>
</div>
</body>
</html>`;
}

// ═══════════════════════════════════════════════════════════════════════════════
// ROUTES — visitor routes MUST come before /:type/:id to avoid conflicts
// ═══════════════════════════════════════════════════════════════════════════════

// GET /api/export/pdf/visitor/:id  ← MUST be before /pdf/:type/:id
router.get('/pdf/visitor/:id', protect, async (req, res) => {
  try {
    const Visitor = require('../models/Visitor');
    const record = await Visitor.findById(req.params.id).populate('submittedBy', 'name email');
    if (!record) return res.status(404).json({ success: false, message: 'Visitor record not found' });
    const html = buildVisitorPDF(record.toObject());
    const fname = `${record.firstName}_${record.lastName}_VIS-${String(record._id).slice(-6).toUpperCase()}.pdf`.replace(/\s+/g, '_');
    await sendPDF(res, html, fname);
  } catch (err) {
    console.error('Visitor PDF error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/export/html/visitor/:id  ← MUST be before /html/:type/:id
router.get('/html/visitor/:id', protect, async (req, res) => {
  try {
    const Visitor = require('../models/Visitor');
    const record = await Visitor.findById(req.params.id).populate('submittedBy', 'name email');
    if (!record) return res.status(404).json({ success: false, message: 'Visitor record not found' });
    const html = buildVisitorPDF(record.toObject());
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.send(html);
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/export/pdf/:type/:id  (sae | sta | ste)
router.get('/pdf/:type/:id', protect, async (req, res) => {
  const { type, id } = req.params;
  if (!['sae', 'sta', 'ste'].includes(type)) {
    return res.status(400).json({ success: false, message: 'Invalid type. Use: sae, sta, ste' });
  }
  try {
    const { year } = req.query;
    let record = await getRecord(type, id);
    if (!record) return res.status(404).json({ success: false, message: 'Record not found' });
    const vs = await getVisitorSummary(record, year);
    const plain = record.toObject ? record.toObject() : { ...record };
    const baseUrl = `${req.protocol}://${req.get('host')}`;
    const html = buildPDFTemplate(type, plain, baseUrl, vs);
    const recName = (plain.nameOfEstablishment || plain.taName || plain.nameOfEnterprise || 'record')
      .replace(/[^a-zA-Z0-9]/g, '_').slice(0, 40);
    const code = plain.attractionCode || `${type.toUpperCase()}-${String(plain._id).slice(-6).toUpperCase()}`;
    await sendPDF(res, html, `${recName}_${code}.pdf`);
  } catch (err) {
    console.error('PDF error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/export/html/:type/:id  (sae | sta | ste)
router.get('/html/:type/:id', protect, async (req, res) => {
  const { type, id } = req.params;
  if (!['sae', 'sta', 'ste'].includes(type)) {
    return res.status(400).json({ success: false, message: 'Invalid type. Use: sae, sta, ste' });
  }
  try {
    const { year } = req.query;
    let record = await getRecord(type, id);
    if (!record) return res.status(404).json({ success: false, message: 'Record not found' });
    const vs = await getVisitorSummary(record, year);
    const plain = record.toObject ? record.toObject() : { ...record };
    const baseUrl = `${req.protocol}://${req.get('host')}`;
    const html = buildPDFTemplate(type, plain, baseUrl, vs);
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.send(html);
  } catch (err) {
    console.error('HTML error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
