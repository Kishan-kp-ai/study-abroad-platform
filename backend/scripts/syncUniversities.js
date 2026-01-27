// Run this script to sync universities from external API
// Usage: node scripts/syncUniversities.js

require('dotenv').config();
const mongoose = require('mongoose');
const University = require('../models/University');
const { fetchRealUniversities } = require('../services/universityApi');

async function syncUniversities() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected!\n');

    // Clear existing universities
    console.log('Clearing existing universities...');
    await University.deleteMany({});
    console.log('Cleared!\n');

    // Fetch from API
    const countries = [
      'United States',
      'United Kingdom', 
      'Canada',
      'Germany',
      'Australia',
      'Singapore',
      'Ireland',
      'Netherlands'
    ];

    console.log('Fetching universities from API...');
    console.log('Countries:', countries.join(', '), '\n');

    const universities = await fetchRealUniversities(countries);
    console.log(`Fetched ${universities.length} universities\n`);

    // Insert into database
    if (universities.length > 0) {
      const batchSize = 50;
      let inserted = 0;

      for (let i = 0; i < universities.length; i += batchSize) {
        const batch = universities.slice(i, i + batchSize);
        await University.insertMany(batch, { ordered: false }).catch(err => {
          if (err.code !== 11000) console.error('Insert error:', err.message);
        });
        inserted += batch.length;
        console.log(`Inserted ${inserted}/${universities.length} universities...`);
      }

      console.log(`\n✅ Successfully synced ${inserted} universities!`);
    } else {
      console.log('❌ No universities fetched from API');
    }

    await mongoose.disconnect();
    console.log('\nDone!');
    process.exit(0);
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

syncUniversities();
