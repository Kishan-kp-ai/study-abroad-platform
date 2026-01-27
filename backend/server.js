const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/user');
const universityRoutes = require('./routes/university');
const aiRoutes = require('./routes/ai');
const taskRoutes = require('./routes/task');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/user', userRoutes);
app.use('/api/universities', universityRoutes);
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

// Auto-seed function
async function seedUniversities() {
  const University = require('./models/University');
  
  const universities = [
    {
      name: 'Massachusetts Institute of Technology',
      country: 'USA',
      city: 'Cambridge, MA',
      ranking: 1,
      acceptanceRate: 4,
      internationalStudentRatio: 30,
      scholarshipsAvailable: true,
      livingCostPerYear: 25000,
      applicationFee: 75,
      tuitionFee: 57590,
      description: 'World-renowned research university known for science and technology.'
    },
    {
      name: 'Stanford University',
      country: 'USA',
      city: 'Stanford, CA',
      ranking: 3,
      acceptanceRate: 4,
      internationalStudentRatio: 24,
      scholarshipsAvailable: true,
      livingCostPerYear: 28000,
      applicationFee: 90,
      tuitionFee: 60000,
      description: 'Elite private research university in Silicon Valley.'
    },
    {
      name: 'Harvard University',
      country: 'USA',
      city: 'Cambridge, MA',
      ranking: 2,
      acceptanceRate: 5,
      internationalStudentRatio: 25,
      scholarshipsAvailable: true,
      livingCostPerYear: 25000,
      applicationFee: 85,
      tuitionFee: 55000,
      description: 'Ivy League research university with world-class programs.'
    },
    {
      name: 'Carnegie Mellon University',
      country: 'USA',
      city: 'Pittsburgh, PA',
      ranking: 25,
      acceptanceRate: 15,
      internationalStudentRatio: 40,
      scholarshipsAvailable: true,
      livingCostPerYear: 18000,
      applicationFee: 75,
      tuitionFee: 58000,
      description: 'Top university for computer science and engineering.'
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
      description: 'Canada\'s top university with diverse programs.'
    },
    {
      name: 'University of British Columbia',
      country: 'Canada',
      city: 'Vancouver, BC',
      ranking: 35,
      acceptanceRate: 52,
      internationalStudentRatio: 30,
      scholarshipsAvailable: true,
      livingCostPerYear: 14000,
      applicationFee: 118,
      tuitionFee: 42000,
      description: 'Leading Canadian university in beautiful Vancouver.'
    },
    {
      name: 'University of Oxford',
      country: 'UK',
      city: 'Oxford',
      ranking: 4,
      acceptanceRate: 17,
      internationalStudentRatio: 45,
      scholarshipsAvailable: true,
      livingCostPerYear: 18000,
      applicationFee: 75,
      tuitionFee: 35000,
      description: 'Historic British university with tutorial-based learning.'
    },
    {
      name: 'Imperial College London',
      country: 'UK',
      city: 'London',
      ranking: 8,
      acceptanceRate: 14,
      internationalStudentRatio: 60,
      scholarshipsAvailable: true,
      livingCostPerYear: 22000,
      applicationFee: 80,
      tuitionFee: 38000,
      description: 'World leader in science, engineering, medicine, and business.'
    },
    {
      name: 'Technical University of Munich',
      country: 'Germany',
      city: 'Munich',
      ranking: 50,
      acceptanceRate: 8,
      internationalStudentRatio: 35,
      scholarshipsAvailable: true,
      livingCostPerYear: 12000,
      applicationFee: 0,
      tuitionFee: 500,
      description: 'Top German technical university with nearly free tuition.'
    },
    {
      name: 'Georgia Institute of Technology',
      country: 'USA',
      city: 'Atlanta, GA',
      ranking: 44,
      acceptanceRate: 21,
      internationalStudentRatio: 15,
      scholarshipsAvailable: true,
      livingCostPerYear: 16000,
      applicationFee: 85,
      tuitionFee: 32000,
      description: 'Top public research university for engineering.'
    },
    {
      name: 'University of Michigan',
      country: 'USA',
      city: 'Ann Arbor, MI',
      ranking: 23,
      acceptanceRate: 23,
      internationalStudentRatio: 17,
      scholarshipsAvailable: true,
      livingCostPerYear: 15000,
      applicationFee: 75,
      tuitionFee: 52000,
      description: 'Leading public research university with strong programs.'
    },
    {
      name: 'Arizona State University',
      country: 'USA',
      city: 'Tempe, AZ',
      ranking: 121,
      acceptanceRate: 88,
      internationalStudentRatio: 12,
      scholarshipsAvailable: true,
      livingCostPerYear: 14000,
      applicationFee: 70,
      tuitionFee: 32000,
      description: 'Innovative university with high acceptance rate.'
    },
    {
      name: 'Northeastern University',
      country: 'USA',
      city: 'Boston, MA',
      ranking: 53,
      acceptanceRate: 18,
      internationalStudentRatio: 22,
      scholarshipsAvailable: true,
      livingCostPerYear: 20000,
      applicationFee: 75,
      tuitionFee: 56000,
      description: 'Known for co-op programs and experiential learning.'
    },
    {
      name: 'University of Waterloo',
      country: 'Canada',
      city: 'Waterloo, ON',
      ranking: 112,
      acceptanceRate: 53,
      internationalStudentRatio: 25,
      scholarshipsAvailable: true,
      livingCostPerYear: 12000,
      applicationFee: 105,
      tuitionFee: 35000,
      description: 'Top Canadian tech university with strong co-op program.'
    },
    {
      name: 'National University of Singapore',
      country: 'Singapore',
      city: 'Singapore',
      ranking: 11,
      acceptanceRate: 20,
      internationalStudentRatio: 35,
      scholarshipsAvailable: true,
      livingCostPerYear: 10000,
      applicationFee: 50,
      tuitionFee: 38000,
      description: 'Asia\'s top university with global recognition.'
    }
  ];
  
  await University.insertMany(universities);
  console.log(`Seeded ${universities.length} universities`);
}

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
