const express = require('express');
const router = express.Router();
const SAE = require('../models/SAE');
const STA = require('../models/STA');
const STE = require('../models/STE');
const User = require('../models/User');
const Visitor = require('../models/Visitor');
const { protect } = require('../middleware/auth');

const ALL_MUNICIPALITIES = [
  'Tarlac City','Capas','Bamban','Camiling','Concepcion','Gerona',
  'La Paz','Mayantoc','Moncada','Paniqui','Pura','Ramos',
  'San Clemente','San Jose','San Manuel','Santa Ignacia','Victoria'
];
const ALL_MONTHS = [1,2,3,4,5,6,7,8,9,10,11,12];

// Build date filter from period + custom dates
function buildDateFilter(period, startDate, endDate, year, month) {
  const now = new Date();
  if (period === 'day') {
    const s = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const e = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
    return { visitDate: { $gte: s, $lt: e } };
  }
  if (period === 'month') {
    const s = new Date(now.getFullYear(), now.getMonth(), 1);
    const e = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    return { visitDate: { $gte: s, $lt: e } };
  }
  if (period === 'year') {
    const y = year ? parseInt(year) : now.getFullYear();
    return { visitDate: { $gte: new Date(y, 0, 1), $lt: new Date(y + 1, 0, 1) } };
  }
  if (period === 'custom' && startDate && endDate) {
    return { visitDate: { $gte: new Date(startDate), $lte: new Date(endDate + 'T23:59:59') } };
  }
  // default: year
  const y = year ? parseInt(year) : now.getFullYear();
  return { visitDate: { $gte: new Date(y, 0, 1), $lt: new Date(y + 1, 0, 1) } };
}

router.get('/stats', protect, async (req, res) => {
  try {
    const { year, municipality, period = 'year', startDate, endDate, month } = req.query;
    const y = year ? parseInt(year) : new Date().getFullYear();
    const yearFilter = { reportYear: y };
    const munFilter = municipality ? { cityMun: municipality } : {};
    const saeMunFilter = municipality ? { municipality } : {};

    // Visitor date filter
    const vDateFilter = buildDateFilter(period, startDate, endDate, year, month);
    const vFilter = { ...vDateFilter, ...(municipality ? { municipality } : {}) };

    const [
      totalSAE, totalSTA, totalSTE, totalUsers,
      totalVisitors,
      byGender, byResidence,
      saeByMun, staByMun, steByMun,
      saeByType, staByType, steByType,
      totalRooms, totalEmployees,
      visitorsByMonth, visitorsBySpot,
      visitorsByMun
    ] = await Promise.all([
      SAE.countDocuments({ ...yearFilter, ...saeMunFilter }),
      STA.countDocuments({ ...yearFilter, ...munFilter }),
      STE.countDocuments({ ...yearFilter, ...munFilter }),
      User.countDocuments({ role: 'staff' }),
      Visitor.countDocuments(vFilter),

      // Gender breakdown
      Visitor.aggregate([
        { $match: vFilter },
        { $group: { _id: '$gender', count: { $sum: 1 } } }
      ]),

      // Residence breakdown
      Visitor.aggregate([
        { $match: vFilter },
        { $group: { _id: '$residenceType', count: { $sum: 1 } } }
      ]),

      // Inventory by municipality – ALL municipalities, 0 if none
      SAE.aggregate([
        { $match: yearFilter },
        { $group: { _id: '$municipality', count: { $sum: 1 }, rooms: { $sum: '$noOfRooms' } } }
      ]),
      STA.aggregate([
        { $match: yearFilter },
        { $group: { _id: '$cityMun', count: { $sum: 1 } } }
      ]),
      STE.aggregate([
        { $match: yearFilter },
        { $group: { _id: '$cityMun', count: { $sum: 1 } } }
      ]),

      SAE.aggregate([{ $match: yearFilter }, { $group: { _id: '$typeCode', count: { $sum: 1 } } }]),
      STA.aggregate([{ $match: yearFilter }, { $group: { _id: '$typeCode', count: { $sum: 1 } } }]),
      STE.aggregate([{ $match: yearFilter }, { $group: { _id: '$type', count: { $sum: 1 } } }]),
      SAE.aggregate([{ $match: yearFilter }, { $group: { _id: null, total: { $sum: '$noOfRooms' } } }]),
      SAE.aggregate([{ $match: yearFilter }, { $group: { _id: null, total: { $sum: '$noOfEmployees' } } }]),

      // Monthly trend – ALL 12 months, 0 if no data
      Visitor.aggregate([
        { $match: vFilter },
        { $group: {
          _id: { month: '$reportMonth' },
          total: { $sum: 1 },
          thisMun: { $sum: { $cond: [{ $eq: ['$residenceType', 'This Municipality'] }, 1, 0] } },
          thisProvince: { $sum: { $cond: [{ $eq: ['$residenceType', 'This Province'] }, 1, 0] } },
          otherProvince: { $sum: { $cond: [{ $eq: ['$residenceType', 'Other Province'] }, 1, 0] } },
          foreign: { $sum: { $cond: [{ $eq: ['$residenceType', 'Foreign'] }, 1, 0] } },
          male: { $sum: { $cond: [{ $eq: ['$gender', 'Male'] }, 1, 0] } },
          female: { $sum: { $cond: [{ $eq: ['$gender', 'Female'] }, 1, 0] } }
        }},
        { $sort: { '_id.month': 1 } }
      ]),

      // Top spots
      Visitor.aggregate([
        { $match: vFilter },
        { $group: { _id: '$touristSpot', count: { $sum: 1 },
          thisMun: { $sum: { $cond: [{ $eq: ['$residenceType', 'This Municipality'] }, 1, 0] } },
          thisProvince: { $sum: { $cond: [{ $eq: ['$residenceType', 'This Province'] }, 1, 0] } },
          otherProvince: { $sum: { $cond: [{ $eq: ['$residenceType', 'Other Province'] }, 1, 0] } },
          foreign: { $sum: { $cond: [{ $eq: ['$residenceType', 'Foreign'] }, 1, 0] } }
        }},
        { $sort: { count: -1 } },
        { $limit: 10 }
      ]),

      // Visitors by municipality (all municipalities, 0 if none)
      Visitor.aggregate([
        { $match: vFilter },
        { $group: {
          _id: '$municipality',
          total: { $sum: 1 },
          thisMun: { $sum: { $cond: [{ $eq: ['$residenceType', 'This Municipality'] }, 1, 0] } },
          thisProvince: { $sum: { $cond: [{ $eq: ['$residenceType', 'This Province'] }, 1, 0] } },
          otherProvince: { $sum: { $cond: [{ $eq: ['$residenceType', 'Other Province'] }, 1, 0] } },
          foreign: { $sum: { $cond: [{ $eq: ['$residenceType', 'Foreign'] }, 1, 0] } }
        }}
      ])
    ]);

    // Derive totals from byResidence
    const residenceMap = {};
    byResidence.forEach(r => { residenceMap[r._id] = r.count; });
    const genderMap = {};
    byGender.forEach(g => { genderMap[g._id] = g.count; });

    const totalMale = genderMap['Male'] || 0;
    const totalFemale = genderMap['Female'] || 0;
    const totalOther = genderMap['Other'] || 0;
    const totalForeign = residenceMap['Foreign'] || 0;
    const totalThisMun = residenceMap['This Municipality'] || 0;
    const totalThisProv = residenceMap['This Province'] || 0;
    const totalOtherProv = residenceMap['Other Province'] || 0;
    const totalLocal = totalThisMun + totalThisProv + totalOtherProv;

    // Fill ALL 12 months with 0s for missing
    const monthMap = {};
    visitorsByMonth.forEach(m => { monthMap[m._id.month] = m; });
    const fullMonthlyTrend = ALL_MONTHS.map(m => ({
      month: m,
      total: monthMap[m]?.total || 0,
      thisMun: monthMap[m]?.thisMun || 0,
      thisProvince: monthMap[m]?.thisProvince || 0,
      otherProvince: monthMap[m]?.otherProvince || 0,
      foreign: monthMap[m]?.foreign || 0,
      male: monthMap[m]?.male || 0,
      female: monthMap[m]?.female || 0
    }));

    // Fill ALL municipalities with 0s
    const saeMunMap = {}; saeByMun.forEach(m => { saeMunMap[m._id] = m; });
    const staMunMap = {}; staByMun.forEach(m => { staMunMap[m._id] = m; });
    const steMunMap = {}; steByMun.forEach(m => { steMunMap[m._id] = m; });
    const visMunMap = {}; visitorsByMun.forEach(m => { visMunMap[m._id] = m; });

    const fullInventoryByMun = ALL_MUNICIPALITIES.map(mun => ({
      municipality: mun,
      sae: saeMunMap[mun]?.count || 0,
      sta: staMunMap[mun]?.count || 0,
      ste: steMunMap[mun]?.count || 0,
      rooms: saeMunMap[mun]?.rooms || 0,
      visitors: visMunMap[mun]?.total || 0,
      thisMun: visMunMap[mun]?.thisMun || 0,
      thisProvince: visMunMap[mun]?.thisProvince || 0,
      otherProvince: visMunMap[mun]?.otherProvince || 0,
      foreign: visMunMap[mun]?.foreign || 0
    }));

    const recent = await Promise.all([
      SAE.find({ ...yearFilter, ...saeMunFilter }).sort({ createdAt: -1 }).limit(5).populate('submittedBy', 'name'),
      STA.find({ ...yearFilter, ...munFilter }).sort({ createdAt: -1 }).limit(5).populate('submittedBy', 'name'),
      Visitor.find(vFilter).sort({ visitDate: -1 }).limit(5).populate('submittedBy', 'name')
    ]);

    res.json({
      success: true,
      data: {
        totals: {
          sae: totalSAE, sta: totalSTA, ste: totalSTE, users: totalUsers,
          visitors: totalVisitors, maleVisitors: totalMale, femaleVisitors: totalFemale,
          otherVisitors: totalOther, foreignVisitors: totalForeign,
          thisMunVisitors: totalThisMun, thisProvinceVisitors: totalThisProv,
          otherProvinceVisitors: totalOtherProv, localVisitors: totalLocal,
          rooms: totalRooms[0]?.total || 0, employees: totalEmployees[0]?.total || 0
        },
        byMunicipality: { sae: saeByMun, sta: staByMun, ste: steByMun },
        byType: { sae: saeByType, sta: staByType, ste: steByType },
        byGender, byResidence,
        visitorsByMonth: fullMonthlyTrend,
        visitorsBySpot,
        inventoryByMunicipality: fullInventoryByMun,
        recent: { sae: recent[0], sta: recent[1], visitors: recent[2] }
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Visitor summary per record (for PDF)
router.get('/visitor-summary/:type/:id', protect, async (req, res) => {
  try {
    const { type, id } = req.params;
    const { period = 'year', year, startDate, endDate } = req.query;

    let spotFilter = {};
    if (type === 'sta') {
      const STA = require('../models/STA');
      const rec = await STA.findById(id);
      if (rec) spotFilter = { touristSpot: rec.taName };
    } else if (type === 'sae') {
      const SAE = require('../models/SAE');
      const rec = await SAE.findById(id);
      if (rec) spotFilter = { municipality: rec.cityMun || rec.municipality };
    } else {
      const STE = require('../models/STE');
      const rec = await STE.findById(id);
      if (rec) spotFilter = { municipality: rec.cityMun };
    }

    const dateFilter = buildDateFilter(period, startDate, endDate, year);
    const match = { ...dateFilter, ...spotFilter };

    const [summary] = await Visitor.aggregate([
      { $match: match },
      { $group: {
        _id: null,
        total: { $sum: 1 },
        thisMun: { $sum: { $cond: [{ $eq: ['$residenceType', 'This Municipality'] }, 1, 0] } },
        thisProvince: { $sum: { $cond: [{ $eq: ['$residenceType', 'This Province'] }, 1, 0] } },
        otherProvince: { $sum: { $cond: [{ $eq: ['$residenceType', 'Other Province'] }, 1, 0] } },
        foreign: { $sum: { $cond: [{ $eq: ['$residenceType', 'Foreign'] }, 1, 0] } }
      }}
    ]);

    res.json({ success: true, data: summary || { total: 0, thisMun: 0, thisProvince: 0, otherProvince: 0, foreign: 0 } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
