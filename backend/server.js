const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/user');
const universityRoutes = require('./routes/university');
const liveUniversityRoutes = require('./routes/liveUniversity');
const aiRoutes = require('./routes/ai');
const taskRoutes = require('./routes/task');
const { fetchRealUniversities } = require('./services/universityApi');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/user', userRoutes);
app.use('/api/universities', universityRoutes);
app.use('/api/live-universities', liveUniversityRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/tasks', taskRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'AI Counsellor API is running' });
});

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI)
  .then(async () => {
    console.log('Connected to MongoDB Atlas');
    
    // Auto-seed universities if database is empty
    const University = require('./models/University');
    const count = await University.countDocuments();
    if (count === 0) {
      console.log('No universities found. Seeding database...');
      await seedUniversities();
    } else {
      console.log(`Found ${count} universities in database`);
    }
  })
  .catch(err => console.error('MongoDB connection error:', err));

// Auto-seed function - fetches real universities from API
async function seedUniversities() {
  const University = require('./models/University');
  
  try {
    console.log('Fetching real university data from API...');
    
    // Fetch from multiple countries
    const countries = [
      'United States', 
      'United Kingdom', 
      'Canada', 
      'Germany', 
      'Australia'
    ];
    
    const universities = await fetchRealUniversities(countries);
    
    if (universities.length > 0) {
      // Insert in batches
      const batchSize = 50;
      for (let i = 0; i < universities.length; i += batchSize) {
        const batch = universities.slice(i, i + batchSize);
        await University.insertMany(batch, { ordered: false }).catch(err => {
          if (err.code !== 11000) console.error('Insert error:', err.message);
        });
      }
      console.log(`Seeded ${universities.length} universities from API`);
    } else {
      console.log('No universities fetched from API, using fallback data');
      await seedFallbackUniversities();
    }
  } catch (error) {
    console.error('API fetch failed, using fallback data:', error.message);
    await seedFallbackUniversities();
  }
}

// Fallback seed data if API fails
async function seedFallbackUniversities() {
  const University = require('./models/University');
  
  const universities = [
    {
      name: 'Massachusetts Institute of Technology',
      country: 'United States',
      city: 'Cambridge, MA',
      ranking: 1,
      acceptanceRate: 4,
      internationalStudentRatio: 33,
      scholarshipsAvailable: true,
      livingCostPerYear: 21000,
      applicationFee: 75,
      tuitionFee: 57986,
      website: 'https://www.mit.edu',
      description: 'World-renowned research university known for science and technology.',
      programs: [
        { name: 'MS in Computer Science', degree: 'masters', field: 'Computer Science', duration: '2 years', tuitionPerYear: 57986, requirements: { minGPA: 3.5, ieltsMin: 7.0, toeflMin: 100, greRequired: true, gmatRequired: false } }
      ]
    },
    {
      name: 'Stanford University',
      country: 'United States',
      city: 'Stanford, CA',
      ranking: 2,
      acceptanceRate: 4,
      internationalStudentRatio: 24,
      scholarshipsAvailable: true,
      livingCostPerYear: 25000,
      applicationFee: 125,
      tuitionFee: 61731,
      website: 'https://www.stanford.edu',
      description: 'Elite private research university in Silicon Valley.',
      programs: [
        { name: 'MS in Computer Science', degree: 'masters', field: 'Computer Science', duration: '2 years', tuitionPerYear: 61731, requirements: { minGPA: 3.6, ieltsMin: 7.0, toeflMin: 100, greRequired: true, gmatRequired: false } }
      ]
    },
    {
      name: 'Harvard University',
      country: 'United States',
      city: 'Cambridge, MA',
      ranking: 3,
      acceptanceRate: 3,
      internationalStudentRatio: 25,
      scholarshipsAvailable: true,
      livingCostPerYear: 24000,
      applicationFee: 105,
      tuitionFee: 55000,
      website: 'https://www.harvard.edu',
      description: 'Ivy League research university with world-class programs.',
      programs: [
        { name: 'MS in Data Science', degree: 'masters', field: 'Data Science', duration: '1.5 years', tuitionPerYear: 55000, requirements: { minGPA: 3.6, ieltsMin: 7.5, toeflMin: 104, greRequired: true, gmatRequired: false } }
      ]
    },
    {
      name: 'University of Oxford',
      country: 'United Kingdom',
      city: 'Oxford',
      ranking: 4,
      acceptanceRate: 17,
      internationalStudentRatio: 45,
      scholarshipsAvailable: true,
      livingCostPerYear: 18000,
      applicationFee: 75,
      tuitionFee: 35000,
      website: 'https://www.ox.ac.uk',
      description: 'Historic British university with tutorial-based learning.',
      programs: [
        { name: 'MSc in Computer Science', degree: 'masters', field: 'Computer Science', duration: '1 year', tuitionPerYear: 35000, requirements: { minGPA: 3.5, ieltsMin: 7.5, toeflMin: 110, greRequired: false, gmatRequired: false } }
      ]
    },
    {
      name: 'University of Toronto',
      country: 'Canada',
      city: 'Toronto, ON',
      ranking: 18,
      acceptanceRate: 43,
      internationalStudentRatio: 25,
      scholarshipsAvailable: true,
      livingCostPerYear: 15000,
      applicationFee: 125,
      tuitionFee: 45000,
      website: 'https://www.utoronto.ca',
      description: 'Canada\'s top university with diverse programs.',
      programs: [
        { name: 'MASc in Computer Engineering', degree: 'masters', field: 'Engineering', duration: '2 years', tuitionPerYear: 45000, requirements: { minGPA: 3.3, ieltsMin: 7.0, toeflMin: 93, greRequired: false, gmatRequired: false } }
      ]
    }
  ];
  
  await University.insertMany(universities);
  console.log(`Seeded ${universities.length} fallback universities`);
}

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
