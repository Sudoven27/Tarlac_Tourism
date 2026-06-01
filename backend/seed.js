/**
 * Tarlac Tourism - Database Seed Script
 * 
 * Usage:
 *   cd backend
 *   node seed.js          # seed all
 *   node seed.js --clear  # clear all data first, then seed
 */

require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const User = require('./models/User');
const SAE = require('./models/SAE');
const STA = require('./models/STA');
const STE = require('./models/STE');
const Visitor = require('./models/Visitor');

const MONGO_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/tarlac_tourism';
const CLEAR = process.argv.includes('--clear');

// ── Sample data ──────────────────────────────────────────────

const USERS = [
  { name: 'System Administrator', email: 'admin@tarlac.gov.ph', password: 'Admin@2026', role: 'admin', municipality: 'Tarlac City' },
  { name: 'Maria Santos', email: 'maria.santos@tarlac.gov.ph', password: 'Staff@2026', role: 'staff', municipality: 'Capas' },
  { name: 'Juan Dela Cruz', email: 'juan.delacruz@tarlac.gov.ph', password: 'Staff@2026', role: 'staff', municipality: 'Bamban' },
  { name: 'Ana Reyes', email: 'ana.reyes@tarlac.gov.ph', password: 'Staff@2026', role: 'staff', municipality: 'Camiling' },
];

const SAE_DATA = [
  { nameOfEstablishment: '1925 Resort', typeCode: 'Resort', noOfRooms: 12, noOfEmployees: 8, municipality: 'Tarlac City', reportYear: 2026, region: 'Region III', province: 'Tarlac', address: 'Brgy. San Vicente, Tarlac City' },
  { nameOfEstablishment: 'Covina Hotel', typeCode: 'Hotel', noOfRooms: 22, noOfEmployees: 15, municipality: 'Tarlac City', reportYear: 2026, region: 'Region III', province: 'Tarlac', address: 'MacArthur Hwy, Tarlac City' },
  { nameOfEstablishment: 'New Asia Golf and Spa Resort', typeCode: 'Resort', noOfRooms: 48, noOfEmployees: 67, municipality: 'Tarlac City', reportYear: 2026, region: 'Region III', province: 'Tarlac' },
  { nameOfEstablishment: "Jason's Inn", typeCode: 'Tourist Inn', noOfRooms: 20, noOfEmployees: 8, municipality: 'Tarlac City', reportYear: 2026, region: 'Region III', province: 'Tarlac' },
  { nameOfEstablishment: 'VES Food Resort and Villas', typeCode: 'Hotel', noOfRooms: 48, noOfEmployees: 20, municipality: 'Tarlac City', reportYear: 2026, region: 'Region III', province: 'Tarlac' },
  { nameOfEstablishment: 'Aviemore Farm Resort', typeCode: 'Resort', noOfRooms: 15, noOfEmployees: 12, municipality: 'Camiling', reportYear: 2026, region: 'Region III', province: 'Tarlac' },
  { nameOfEstablishment: 'Fire and Ice Hotel', typeCode: 'Hotel', noOfRooms: 30, noOfEmployees: 18, municipality: 'Camiling', reportYear: 2026, region: 'Region III', province: 'Tarlac' },
  { nameOfEstablishment: 'Paraiso sa Camiling', typeCode: 'Resort', noOfRooms: 8, noOfEmployees: 6, municipality: 'Camiling', reportYear: 2026, region: 'Region III', province: 'Tarlac' },
  { nameOfEstablishment: 'Estancia De Lorenzo', typeCode: 'Hotel', noOfRooms: 14, noOfEmployees: 16, municipality: 'Capas', reportYear: 2026, region: 'Region III', province: 'Tarlac' },
  { nameOfEstablishment: 'Paradise Inn', typeCode: 'Tourist Inn', noOfRooms: 12, noOfEmployees: 3, municipality: 'Paniqui', reportYear: 2026, region: 'Region III', province: 'Tarlac' },
];

const STA_DATA = [
  { taName: 'Capas National Shrine', typeCode: 'History_and_Culture', cityMun: 'Capas', reportYear: 2026, noOfEmployees: 3, devtLvl: 'Developed', mgt: 'National Government', onlineConnectivity: 'Yes', description: 'Historical shrine dedicated to Filipino and American soldiers who perished during the Bataan Death March in WWII. Features a memorial complex, museum, and walkways.', visitorsPerYear: 50000 },
  { taName: 'Mt. Pinatubo Trekking Adventure', typeCode: 'Nature', cityMun: 'Capas', reportYear: 2026, noOfEmployees: 15, devtLvl: 'Developed', mgt: 'Community-Based', onlineConnectivity: 'Yes', description: 'World-famous volcano and its crater lake. One of the most visited eco-tourism destinations in Central Luzon, offering trekking and 4x4 adventure rides.', entryFee: 500, visitorsPerYear: 30000 },
  { taName: 'Death March Monument', typeCode: 'History_and_Culture', cityMun: 'Capas', reportYear: 2026, noOfEmployees: 2, devtLvl: 'Developed', mgt: 'LGU' },
  { taName: 'Monasterio de Tarlac', typeCode: 'History_and_Culture', cityMun: 'San Jose', reportYear: 2026, noOfEmployees: 5, devtLvl: 'Highly Developed', mgt: 'Private', description: 'A Benedictine monastery set atop a hill overlooking Central Luzon. Home to a relic of the True Cross and a stunning panoramic view.', visitorsPerYear: 40000, entryFee: 0 },
  { taName: 'Canding Eco Tourism Park', typeCode: 'Nature', cityMun: 'San Clemente', reportYear: 2026, noOfEmployees: 11, devtLvl: 'Developing', mgt: 'LGU' },
  { taName: 'Timangguyob Falls', typeCode: 'Nature', cityMun: 'San Clemente', reportYear: 2026, noOfEmployees: 4, devtLvl: 'Developing', mgt: 'Community-Based' },
  { taName: 'General Amper Eco Park', typeCode: 'Nature', cityMun: 'Capas', reportYear: 2026, noOfEmployees: 3, devtLvl: 'Developed', mgt: 'LGU' },
  { taName: 'Dungan Falls', typeCode: 'Nature', cityMun: 'Mayantoc', reportYear: 2026, noOfEmployees: 2, devtLvl: 'Developing', mgt: 'Community-Based', description: 'A scenic natural waterfall located in the mountains of Mayantoc, surrounded by lush tropical vegetation.' },
  { taName: 'Anak Pawikan Festival', typeCode: 'Events_and_Festivals', cityMun: 'San Manuel', reportYear: 2026, noOfEmployees: 0, devtLvl: 'Developed', mgt: 'LGU' },
  { taName: 'Pampanga River Recreation Area', typeCode: 'Sports_and_Recreation', cityMun: 'Bamban', reportYear: 2026, noOfEmployees: 6, devtLvl: 'Developed', mgt: 'Private' },
];

const STE_DATA = [
  { nameOfEnterprise: 'Adventure Trip Travel & Tours', type: 'Travel and Tours', totalEmployees: 3, cityMun: 'Capas', reportYear: 2026, region: 'Region III', provHuc: 'Tarlac', subType: 'Travel Organizer' },
  { nameOfEnterprise: "Altrek's Trekking Travel and Tours", type: 'Travel and Tours', totalEmployees: 5, cityMun: 'Capas', reportYear: 2026, region: 'Region III', provHuc: 'Tarlac', subType: 'Travel Organizer' },
  { nameOfEnterprise: 'Funtastic Michael Travel and Tours', type: 'Travel and Tours', totalEmployees: 3, cityMun: 'Capas', reportYear: 2026, region: 'Region III', provHuc: 'Tarlac', subType: 'Travel Organizer' },
  { nameOfEnterprise: 'Berlyn Travel & Tours Services', type: 'Travel and Tours', totalEmployees: 4, cityMun: 'Capas', reportYear: 2026, region: 'Region III', provHuc: 'Tarlac' },
  { nameOfEnterprise: 'Pinatubo Xtreme Grill & Restaurant', type: 'Restaurant', seatsUnit: 80, totalEmployees: 12, cityMun: 'Capas', reportYear: 2026, region: 'Region III', provHuc: 'Tarlac', subType: 'Casual Dining' },
  { nameOfEnterprise: 'Aling Sosing Carinderia', type: 'Restaurant', seatsUnit: 30, totalEmployees: 5, cityMun: 'Tarlac City', reportYear: 2026, region: 'Region III', provHuc: 'Tarlac', subType: 'Carinderia' },
  { nameOfEnterprise: 'Tarlac City Tourism Souvenir Shop', type: 'Souvenir Shop', seatsUnit: 1, totalEmployees: 4, cityMun: 'Tarlac City', reportYear: 2026, region: 'Region III', provHuc: 'Tarlac' },
  { nameOfEnterprise: 'Relax Spa & Wellness Center', type: 'Spa and Wellness', seatsUnit: 10, totalEmployees: 8, cityMun: 'Tarlac City', reportYear: 2026, region: 'Region III', provHuc: 'Tarlac' },
];

const TOURIST_SPOTS = [
  'Capas National Shrine', 'Mt. Pinatubo', 'Monasterio de Tarlac',
  'Canding Eco Tourism Park', 'Timangguyob Falls', 'Dungan Falls',
  'General Amper Eco Park', 'Pampanga River Area'
];
const MUNICIPALITIES_LIST = ['Capas', 'Tarlac City', 'Bamban', 'Camiling', 'San Jose', 'San Clemente', 'Mayantoc', 'Paniqui'];
const PURPOSES = ['Leisure/Recreation', 'Cultural/Heritage', 'Adventure', 'Business', 'Religious', 'Education'];
const GENDERS = ['Male', 'Female'];
const RESIDENCES = ['This Municipality', 'This Province', 'Other Province', 'Foreign'];
const TRANSPORTS = ['Private Vehicle', 'Bus', 'Motorcycle', 'Tricycle'];

function randomFrom(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
function randomInt(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }

function generateVisitors(adminId) {
  const visitors = [];
  // Generate 60 visitors spread across 2026
  for (let i = 0; i < 60; i++) {
    const month = randomInt(1, 12);
    const day = randomInt(1, 28);
    const visitDate = new Date(2026, month - 1, day);
    const residence = randomFrom(RESIDENCES);
    const isForeign = residence === 'Foreign';

    visitors.push({
      firstName: ['Maria', 'Jose', 'Ana', 'Carlos', 'Lisa', 'Mark', 'Grace', 'Ramon', 'Elena', 'Patrick', 'John', 'Sarah', 'Michael', 'Jennifer', 'David', 'Emma', 'Liam', 'Olivia', 'Noah', 'Sophia'][i % 20],
      lastName: ['Santos', 'Reyes', 'Cruz', 'Garcia', 'Torres', 'Flores', 'Rivera', 'Gomez', 'Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Miller', 'Davis', 'Wilson', 'Moore', 'Taylor', 'Anderson', 'Thomas'][i % 20],
      gender: randomFrom(GENDERS),
      age: randomInt(18, 65),
      residenceType: residence,
      province: isForeign ? '' : randomFrom(['Metro Manila', 'Pampanga', 'Nueva Ecija', 'Bulacan', 'Bataan']),
      country: isForeign ? randomFrom(['Japan', 'South Korea', 'USA', 'Australia', 'Germany', 'China']) : 'Philippines',
      nationality: isForeign ? randomFrom(['Japanese', 'Korean', 'American', 'Australian', 'German', 'Chinese']) : 'Filipino',
      touristSpot: randomFrom(TOURIST_SPOTS),
      municipality: randomFrom(MUNICIPALITIES_LIST),
      visitDate,
      purpose: randomFrom(PURPOSES),
      groupSize: randomInt(1, 6),
      transportation: randomFrom(TRANSPORTS),
      stayDuration: randomFrom(['1 day', 'Half day', '2 days', '3 days', 'Overnight']),
      estimatedSpend: randomInt(200, 5000),
      rating: randomInt(3, 5),
      feedback: randomFrom(['Great experience!', 'Beautiful place, will come back.', 'Very peaceful and scenic.', 'Highly recommended for families.', 'Amazing natural beauty.', 'Worth every penny.', '']),
      reportYear: 2026,
      reportMonth: month,
      submittedBy: adminId,
      status: 'submitted'
    });
  }
  return visitors;
}

async function seed() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('✅ Connected to MongoDB');

    if (CLEAR) {
      await Promise.all([
        User.deleteMany({}),
        SAE.deleteMany({}),
        STA.deleteMany({}),
        STE.deleteMany({}),
        Visitor.deleteMany({})
      ]);
      console.log('🗑️  Cleared all collections');
    }

    // Users
    const adminExists = await User.findOne({ email: 'admin@tarlac.gov.ph' });
    let adminUser;
    if (!adminExists) {
      const users = await User.create(USERS);
      adminUser = users.find(u => u.role === 'admin');
      console.log(`👤 Created ${users.length} users`);
    } else {
      adminUser = adminExists;
      console.log('👤 Admin already exists, skipping user seed');
    }

    // SAE
    const saeCount = await SAE.countDocuments();
    if (saeCount === 0) {
      const saeData = SAE_DATA.map(d => ({ ...d, submittedBy: adminUser._id }));
      await SAE.insertMany(saeData);
      console.log(`🏨 Created ${saeData.length} SAE records`);
    } else {
      console.log(`🏨 SAE already has ${saeCount} records, skipping`);
    }

    // STA
    const staCount = await STA.countDocuments();
    if (staCount === 0) {
      const staData = STA_DATA.map(d => ({ ...d, submittedBy: adminUser._id }));
      await STA.insertMany(staData);
      console.log(`🌿 Created ${staData.length} STA records`);
    } else {
      console.log(`🌿 STA already has ${staCount} records, skipping`);
    }

    // STE
    const steCount = await STE.countDocuments();
    if (steCount === 0) {
      const steData = STE_DATA.map(d => ({ ...d, submittedBy: adminUser._id }));
      await STE.insertMany(steData);
      console.log(`🏢 Created ${steData.length} STE records`);
    } else {
      console.log(`🏢 STE already has ${steCount} records, skipping`);
    }

    // Visitors
    const visitorCount = await Visitor.countDocuments();
    if (visitorCount === 0) {
      const visitorData = generateVisitors(adminUser._id);
      await Visitor.insertMany(visitorData);
      console.log(`👥 Created ${visitorData.length} visitor records`);
    } else {
      console.log(`👥 Visitors already has ${visitorCount} records, skipping`);
    }

    console.log('\n🎉 Seed complete!');
    console.log('─────────────────────────────────');
    console.log('🔑 Admin Login:');
    console.log('   Email:    admin@tarlac.gov.ph');
    console.log('   Password: Admin@2026');
    console.log('─────────────────────────────────');

  } catch (err) {
    console.error('❌ Seed error:', err.message);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

seed();
