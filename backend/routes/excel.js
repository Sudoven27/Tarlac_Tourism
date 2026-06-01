const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const SAE = require('../models/SAE');
const STA = require('../models/STA');
const STE = require('../models/STE');

const ALL_MUN = [
  'Tarlac City','Capas','Bamban','Camiling','Concepcion','Gerona',
  'La Paz','Mayantoc','Moncada','Paniqui','Pura','Ramos',
  'San Clemente','San Jose','San Manuel','Santa Ignacia','Victoria'
];
const MONTHS_SHORT = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

function buildDateFilter(period, startDate, endDate) {
  const now = new Date();
  if (period === 'day') {
    const s = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const e = new Date(s); e.setDate(e.getDate() + 1);
    return { createdAt: { $gte: s, $lt: e } };
  }
  if (period === 'month') {
    const s = new Date(now.getFullYear(), now.getMonth(), 1);
    const e = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    return { createdAt: { $gte: s, $lt: e } };
  }
  if (period === 'year') {
    const s = new Date(now.getFullYear(), 0, 1);
    const e = new Date(now.getFullYear() + 1, 0, 1);
    return { createdAt: { $gte: s, $lt: e } };
  }
  if (period === 'custom' && startDate && endDate) {
    return { createdAt: { $gte: new Date(startDate), $lte: new Date(endDate + 'T23:59:59') } };
  }
  return {};
}

// Compact style helpers
function makeHeader(sheet, title, cols) {
  const r = sheet.addRow([title]);
  r.getCell(1).font = { bold: true, size: 12, color: { argb: 'FFFFFF' } };
  r.getCell(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '2E6B3E' } };
  r.getCell(1).alignment = { horizontal: 'center', vertical: 'middle' };
  r.height = 22;
  sheet.mergeCells(sheet.rowCount, 1, sheet.rowCount, cols);
}

function makeSubHeader(sheet, text, cols) {
  const r = sheet.addRow([text]);
  r.getCell(1).font = { size: 9, italic: true, color: { argb: '555555' } };
  r.getCell(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'F5F5F5' } };
  r.getCell(1).alignment = { horizontal: 'center' };
  r.height = 14;
  sheet.mergeCells(sheet.rowCount, 1, sheet.rowCount, cols);
}

function makeColHeaders(sheet, headers, fillColor = '2E6B3E') {
  const r = sheet.addRow(headers);
  r.height = 16;
  r.eachCell(cell => {
    cell.font = { bold: true, size: 9, color: { argb: 'FFFFFF' } };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: fillColor } };
    cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: false };
    cell.border = {
      bottom: { style: 'thin', color: { argb: 'FFFFFF' } },
      right: { style: 'thin', color: { argb: 'FFFFFF' } }
    };
  });
}

function makeDataRow(sheet, values, isEven, rowColor = 'F0FDF4') {
  const r = sheet.addRow(values);
  r.height = 14;
  r.eachCell({ includeEmpty: true }, cell => {
    cell.font = { size: 9 };
    if (isEven) cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: rowColor } };
    cell.border = {
      bottom: { style: 'hair', color: { argb: 'DDDDDD' } },
      right: { style: 'hair', color: { argb: 'DDDDDD' } }
    };
  });
}

function autoFit(sheet, min = 8, max = 35) {
  sheet.columns.forEach((col, i) => {
    let maxLen = min;
    col.eachCell({ includeEmpty: false }, cell => {
      const len = cell.value != null ? String(cell.value).length : 0;
      if (len > maxLen) maxLen = len;
    });
    col.width = Math.min(maxLen + 2, max);
  });
}

function makeTotalRow(sheet, values) {
  const r = sheet.addRow(values);
  r.height = 16;
  r.eachCell({ includeEmpty: true }, cell => {
    cell.font = { bold: true, size: 9, color: { argb: 'FFFFFF' } };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '065f46' } };
  });
}

// GET /api/excel/download
router.get('/download', protect, async (req, res) => {
  const { period = 'year', type = 'all', municipality, year, startDate, endDate } = req.query;

  try {
    let ExcelJS;
    try { ExcelJS = require('exceljs'); }
    catch { return res.status(500).json({ success: false, message: 'ExcelJS not installed. Run: cd backend && npm install exceljs' }); }

    const dateFilter = buildDateFilter(period, startDate, endDate);
    const munFilter = municipality ? { cityMun: municipality } : {};
    const saeMunFilter = municipality ? { municipality } : {};
    const yearFilter = year ? { reportYear: parseInt(year) } : {};
    const baseFilter = { ...dateFilter, ...yearFilter };

    const periodLabel = period === 'day' ? `Today (${new Date().toLocaleDateString('en-PH')})` :
      period === 'month' ? `This Month (${new Date().toLocaleString('en-PH', { month:'long', year:'numeric' })})` :
      period === 'year' ? `This Year (${new Date().getFullYear()})` :
      period === 'custom' ? `${startDate} to ${endDate}` : 'All Time';

    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'Tarlac Tourism Office';
    workbook.created = new Date();

    // ── SAE Sheet ──────────────────────────────────────────────────────────────
    if (type === 'all' || type === 'sae') {
      const data = await SAE.find({ ...baseFilter, ...saeMunFilter }).populate('submittedBy', 'name').sort({ cityMun: 1, nameOfEstablishment: 1 }).lean();
      const sheet = workbook.addWorksheet('SAE - Accommodation', { properties: { tabColor: { argb: '2E6B3E' } } });

      const headers = ['#','Name of Establishment','Type Code','No. of Rooms','No. of Employees','Female Emp.','Male Emp.','Report Year','Month','Prov/HUC','City/Mun','Address','Contact No.','Email','Status','Submitted By'];
      makeHeader(sheet, 'TARLAC TOURISM — ACCOMMODATION ESTABLISHMENTS (FORM SAE1)', headers.length);
      makeSubHeader(sheet, `Period: ${periodLabel}${municipality ? ' | Municipality: '+municipality : ''} | Province of Tarlac, Region III`, headers.length);
      makeColHeaders(sheet, headers, '2E6B3E');

      data.forEach((r, i) => {
        makeDataRow(sheet, [
          i+1, r.nameOfEstablishment, r.typeCode, r.noOfRooms||0, r.noOfEmployees||0,
          r.femaleEmployees||0, r.maleEmployees||0, r.reportYear,
          r.reportMonth ? MONTHS_SHORT[r.reportMonth-1] : '',
          r.provHuc||'Tarlac', r.cityMun||r.municipality||'', r.address||'',
          r.contactNumber||'', r.email||'', r.status||'submitted', r.submittedBy?.name||''
        ], i%2===0, 'F0FDF4');
      });

      const totRooms = data.reduce((s,r) => s+(r.noOfRooms||0), 0);
      const totEmp = data.reduce((s,r) => s+(r.noOfEmployees||0), 0);
      const totFem = data.reduce((s,r) => s+(r.femaleEmployees||0), 0);
      const totMale = data.reduce((s,r) => s+(r.maleEmployees||0), 0);
      makeTotalRow(sheet, ['TOTAL', `${data.length} records`, '', totRooms, totEmp, totFem, totMale, '', '', '', '', '', '', '', '', '']);
      autoFit(sheet);
    }

    // ── STA Sheet ──────────────────────────────────────────────────────────────
    if (type === 'all' || type === 'sta') {
      const data = await STA.find({ ...yearFilter, ...munFilter }).populate('submittedBy', 'name').sort({ cityMun: 1, taName: 1 }).lean();
      const sheet = workbook.addWorksheet('STA - Tourist Attractions', { properties: { tabColor: { argb: '388E3C' } } });

      const headers = ['#','TA Name','Type Code','Year Est.','Region','Prov/HUC','City/Mun','Report Year','Employees','Female Emp.','Male Emp.','Barangay','TA Category','NTDP Category','Dev. Level','Management','Online','Contact Person','Contact Info','Entry Fee','Visitors/Year','Status','Submitted By'];
      makeHeader(sheet, 'TARLAC TOURISM — TOURIST ATTRACTIONS (FORM STA1)', headers.length);
      makeSubHeader(sheet, `Period: ${periodLabel}${municipality ? ' | Municipality: '+municipality : ''} | Province of Tarlac, Region III`, headers.length);
      makeColHeaders(sheet, headers, '388E3C');

      data.forEach((r, i) => {
        makeDataRow(sheet, [
          i+1, r.taName, (r.typeCode||'').replace(/_/g,' '), r.yearEst||'',
          r.region||'Region III', r.provHuc||'Tarlac', r.cityMun||'',
          r.reportYear, r.employees||0, r.femaleEmp||0, r.maleEmp||0,
          r.brgy||'', r.taCategory||'', r.ntdpCategory||'', r.devtLvl||'',
          r.mgt||'', r.onlineConnectivity||'', r.contactPerson||'', r.contactInfo||'',
          r.entryFee||0, r.visitorsPerYear||0, r.status||'submitted', r.submittedBy?.name||''
        ], i%2===0, 'F0FDF4');
      });
      makeTotalRow(sheet, ['TOTAL', `${data.length} records`]);
      autoFit(sheet);
    }

    // ── STE Sheet ──────────────────────────────────────────────────────────────
    if (type === 'all' || type === 'ste') {
      const data = await STE.find({ ...baseFilter, ...munFilter }).populate('submittedBy', 'name').sort({ cityMun: 1, nameOfEnterprise: 1 }).lean();
      const sheet = workbook.addWorksheet('STE - Tourism Enterprises', { properties: { tabColor: { argb: 'C17A00' } } });

      const headers = ['#','Name of Enterprise','Type','Seats/Units','Total Employees','Female Emp.','Male Emp.','Report Year','Month','Region','Prov/HUC','City/Mun','Classification','Contact No.','Email','Status','Submitted By'];
      makeHeader(sheet, 'TARLAC TOURISM — TOURISM ENTERPRISES (FORM STE1)', headers.length);
      makeSubHeader(sheet, `Period: ${periodLabel}${municipality ? ' | Municipality: '+municipality : ''} | Province of Tarlac, Region III`, headers.length);
      makeColHeaders(sheet, headers, 'C17A00');

      data.forEach((r, i) => {
        makeDataRow(sheet, [
          i+1, r.nameOfEnterprise, r.type, r.seatsUnit||0, r.totalEmployees||0,
          r.femaleEmployees||0, r.maleEmployees||0, r.reportYear,
          r.reportMonth ? MONTHS_SHORT[r.reportMonth-1] : '',
          r.region||'Region III', r.provHuc||'Tarlac', r.cityMun||'',
          r.classification||'', r.contactNumber||'', r.email||'',
          r.status||'submitted', r.submittedBy?.name||''
        ], i%2===0, 'FFFDE7');
      });
      const totEmp = data.reduce((s,r) => s+(r.totalEmployees||0), 0);
      makeTotalRow(sheet, ['TOTAL', `${data.length} records`, '', '', totEmp]);
      autoFit(sheet);
    }

    // ── Inventory Summary Sheet ────────────────────────────────────────────────
    if (type === 'all') {
      const [saeByMun, staByMun, steByMun] = await Promise.all([
        SAE.aggregate([{ $match: yearFilter }, { $group: { _id: '$municipality', sae: { $sum: 1 }, rooms: { $sum: '$noOfRooms' } } }]),
        STA.aggregate([{ $match: yearFilter }, { $group: { _id: '$cityMun', sta: { $sum: 1 } } }]),
        STE.aggregate([{ $match: yearFilter }, { $group: { _id: '$cityMun', ste: { $sum: 1 } } }])
      ]);

      const sm = {}; saeByMun.forEach(m => { sm[m._id] = m; });
      const stam = {}; staByMun.forEach(m => { stam[m._id] = m; });
      const stem = {}; steByMun.forEach(m => { stem[m._id] = m; });

      const sheet = workbook.addWorksheet('Summary by Municipality', { properties: { tabColor: { argb: '1565C0' } } });
      const headers = ['Municipality', 'Accommodation (SAE)', 'Tourist Attractions (STA)', 'Tourism Enterprises (STE)', 'Total Rooms', 'Total Inventory'];
      makeHeader(sheet, 'TARLAC TOURISM — INVENTORY SUMMARY BY MUNICIPALITY', headers.length);
      makeSubHeader(sheet, `Year: ${year || new Date().getFullYear()} | Province of Tarlac, Region III`, headers.length);
      makeColHeaders(sheet, headers, '1565C0');

      let totSAE=0, totSTA=0, totSTE=0, totRooms=0;
      ALL_MUN.forEach((mun, i) => {
        const s = sm[mun]?.sae || 0;
        const st = stam[mun]?.sta || 0;
        const se = stem[mun]?.ste || 0;
        const r = sm[mun]?.rooms || 0;
        totSAE+=s; totSTA+=st; totSTE+=se; totRooms+=r;
        makeDataRow(sheet, [mun, s, st, se, r, s+st+se], i%2===0, 'E3F2FD');
      });
      makeTotalRow(sheet, ['TOTAL', totSAE, totSTA, totSTE, totRooms, totSAE+totSTA+totSTE]);
      autoFit(sheet, 12, 30);
    }

    const filename = `TarlacTourism_${type.toUpperCase()}_${period}_${Date.now()}.xlsx`;
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    await workbook.xlsx.write(res);
    res.end();

  } catch (err) {
    console.error('Excel error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
