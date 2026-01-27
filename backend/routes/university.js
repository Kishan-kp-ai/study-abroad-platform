const express = require('express');
const University = require('../models/University');
const User = require('../models/User');
const authMiddleware = require('../middleware/auth');
const { fetchRealUniversities } = require('../services/universityApi');
const router = express.Router();

// Get all universities with optional filters
router.get('/', authMiddleware, async (req, res) => {
  try {
    const { country, degree, field, maxTuition } = req.query;
    
    let query = {};
    
    if (country) {
      query.country = { $in: country.split(',') };
    }
    
    const universities = await University.find(query);
    
    // Filter by program requirements if needed
    let filtered = universities;
    
    if (degree || field || maxTuition) {
      filtered = universities.filter(uni => {
        return uni.programs.some(prog => {
          let matches = true;
          if (degree) matches = matches && prog.degree === degree;
          if (field) matches = matches && prog.field.toLowerCase().includes(field.toLowerCase());
          if (maxTuition) matches = matches && prog.tuitionPerYear <= parseInt(maxTuition);
          return matches;
        });
      });
    }
    
    res.json(filtered);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get university by ID
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const university = await University.findById(req.params.id);
    if (!university) {
      return res.status(404).json({ message: 'University not found' });
    }
    res.json(university);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get recommended universities based on user profile
router.get('/recommended/for-me', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    const universities = await University.find({
      country: { $in: user.preferredCountries || [] }
    });
    
    // Calculate fit score for each university
    const recommendations = universities.map(uni => {
      let fitScore = 0;
      let risks = [];
      let reasons = [];
      
      // Check budget fit
      const avgTuition = uni.programs.reduce((sum, p) => sum + (p.tuitionPerYear || 0), 0) / uni.programs.length;
      const totalCost = avgTuition + (uni.livingCostPerYear || 0);
      
      if (totalCost <= user.budgetMax) {
        fitScore += 30;
        reasons.push('Within your budget');
      } else {
        risks.push('May exceed your budget');
      }
      
      // Check GPA requirements
      const userGPA = parseFloat(user.gpa) || 0;
      const hasMatchingProgram = uni.programs.some(p => {
        if (p.degree === user.intendedDegree) {
          fitScore += 20;
          if (p.requirements?.minGPA && userGPA >= p.requirements.minGPA) {
            fitScore += 20;
            reasons.push('Your GPA meets requirements');
            return true;
          } else if (p.requirements?.minGPA) {
            risks.push(`GPA requirement: ${p.requirements.minGPA}`);
          }
        }
        return false;
      });
      
      // Check acceptance rate
      if (uni.acceptanceRate) {
        if (uni.acceptanceRate > 50) {
          fitScore += 15;
          reasons.push('Higher acceptance rate');
        } else if (uni.acceptanceRate < 20) {
          risks.push('Highly competitive');
        }
      }
      
      // Categorize
      let category = 'target';
      if (fitScore >= 70) category = 'safe';
      else if (fitScore <= 30) category = 'dream';
      
      return {
        university: uni,
        fitScore,
        category,
        reasons,
        risks,
        estimatedCost: totalCost,
        acceptanceChance: fitScore >= 60 ? 'high' : fitScore >= 40 ? 'medium' : 'low'
      };
    });
    
    // Sort by fit score
    recommendations.sort((a, b) => b.fitScore - a.fitScore);
    
    res.json({
      dream: recommendations.filter(r => r.category === 'dream'),
      target: recommendations.filter(r => r.category === 'target'),
      safe: recommendations.filter(r => r.category === 'safe')
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Seed initial university data
router.post('/seed', async (req, res) => {
  try {
    const existingCount = await University.countDocuments();
    if (existingCount > 0) {
      return res.json({ message: 'Universities already seeded', count: existingCount });
    }
    
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
        website: 'https://mit.edu',
        description: 'World-renowned research university known for science and technology.',
        programs: [
          {
            name: 'MS Computer Science',
            degree: 'masters',
            field: 'Computer Science',
            duration: '2 years',
            tuitionPerYear: 57590,
            requirements: { minGPA: 3.7, ieltsMin: 7.0, toeflMin: 100, greRequired: true }
          },
          {
            name: 'MBA',
            degree: 'mba',
            field: 'Business',
            duration: '2 years',
            tuitionPerYear: 82000,
            requirements: { minGPA: 3.5, ieltsMin: 7.5, toeflMin: 109, gmatRequired: true }
          }
        ]
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
        website: 'https://stanford.edu',
        description: 'Elite private research university in Silicon Valley.',
        programs: [
          {
            name: 'MS Computer Science',
            degree: 'masters',
            field: 'Computer Science',
            duration: '2 years',
            tuitionPerYear: 60000,
            requirements: { minGPA: 3.6, ieltsMin: 7.0, toeflMin: 100, greRequired: true }
          }
        ]
      },
      {
        name: 'University of Toronto',
        country: 'Canada',
        city: 'Toronto, ON',
        ranking: 21,
        acceptanceRate: 43,
        internationalStudentRatio: 25,
        scholarshipsAvailable: true,
        livingCostPerYear: 15000,
        applicationFee: 125,
        website: 'https://utoronto.ca',
        description: 'Canada\'s top university with diverse programs.',
        programs: [
          {
            name: 'MSc Computer Science',
            degree: 'masters',
            field: 'Computer Science',
            duration: '2 years',
            tuitionPerYear: 45000,
            requirements: { minGPA: 3.3, ieltsMin: 7.0, toeflMin: 93, greRequired: false }
          },
          {
            name: 'MBA',
            degree: 'mba',
            field: 'Business',
            duration: '20 months',
            tuitionPerYear: 65000,
            requirements: { minGPA: 3.0, ieltsMin: 7.0, toeflMin: 100, gmatRequired: true }
          }
        ]
      },
      {
        name: 'University of British Columbia',
        country: 'Canada',
        city: 'Vancouver, BC',
        ranking: 35,
        acceptanceRate: 52,
        internationalStudentRatio: 28,
        scholarshipsAvailable: true,
        livingCostPerYear: 14000,
        applicationFee: 110,
        website: 'https://ubc.ca',
        description: 'Leading Canadian research university on the Pacific coast.',
        programs: [
          {
            name: 'MSc Data Science',
            degree: 'masters',
            field: 'Data Science',
            duration: '2 years',
            tuitionPerYear: 40000,
            requirements: { minGPA: 3.0, ieltsMin: 6.5, toeflMin: 90, greRequired: false }
          }
        ]
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
        website: 'https://ox.ac.uk',
        description: 'World\'s oldest English-speaking university.',
        programs: [
          {
            name: 'MSc Computer Science',
            degree: 'masters',
            field: 'Computer Science',
            duration: '1 year',
            tuitionPerYear: 35000,
            requirements: { minGPA: 3.5, ieltsMin: 7.5, toeflMin: 110, greRequired: false }
          }
        ]
      },
      {
        name: 'Imperial College London',
        country: 'UK',
        city: 'London',
        ranking: 6,
        acceptanceRate: 14,
        internationalStudentRatio: 60,
        scholarshipsAvailable: true,
        livingCostPerYear: 22000,
        applicationFee: 80,
        website: 'https://imperial.ac.uk',
        description: 'World-class science, engineering, and medicine institution.',
        programs: [
          {
            name: 'MSc Computing',
            degree: 'masters',
            field: 'Computer Science',
            duration: '1 year',
            tuitionPerYear: 38000,
            requirements: { minGPA: 3.3, ieltsMin: 7.0, toeflMin: 100, greRequired: false }
          }
        ]
      },
      {
        name: 'University of Melbourne',
        country: 'Australia',
        city: 'Melbourne',
        ranking: 33,
        acceptanceRate: 70,
        internationalStudentRatio: 45,
        scholarshipsAvailable: true,
        livingCostPerYear: 21000,
        applicationFee: 100,
        website: 'https://unimelb.edu.au',
        description: 'Australia\'s leading university with global reputation.',
        programs: [
          {
            name: 'Master of IT',
            degree: 'masters',
            field: 'Information Technology',
            duration: '2 years',
            tuitionPerYear: 45000,
            requirements: { minGPA: 3.0, ieltsMin: 6.5, toeflMin: 79, greRequired: false }
          }
        ]
      },
      {
        name: 'Technical University of Munich',
        country: 'Germany',
        city: 'Munich',
        ranking: 50,
        acceptanceRate: 40,
        internationalStudentRatio: 35,
        scholarshipsAvailable: true,
        livingCostPerYear: 12000,
        applicationFee: 0,
        website: 'https://tum.de',
        description: 'Germany\'s top technical university with no tuition fees.',
        programs: [
          {
            name: 'MSc Informatics',
            degree: 'masters',
            field: 'Computer Science',
            duration: '2 years',
            tuitionPerYear: 300,
            requirements: { minGPA: 3.0, ieltsMin: 6.5, toeflMin: 88, greRequired: false }
          }
        ]
      },
      {
        name: 'ETH Zurich',
        country: 'Switzerland',
        city: 'Zurich',
        ranking: 8,
        acceptanceRate: 27,
        internationalStudentRatio: 40,
        scholarshipsAvailable: true,
        livingCostPerYear: 24000,
        applicationFee: 150,
        website: 'https://ethz.ch',
        description: 'Europe\'s leading science and technology university.',
        programs: [
          {
            name: 'MSc Computer Science',
            degree: 'masters',
            field: 'Computer Science',
            duration: '2 years',
            tuitionPerYear: 1500,
            requirements: { minGPA: 3.5, ieltsMin: 7.0, toeflMin: 100, greRequired: true }
          }
        ]
      },
      {
        name: 'National University of Singapore',
        country: 'Singapore',
        city: 'Singapore',
        ranking: 11,
        acceptanceRate: 25,
        internationalStudentRatio: 38,
        scholarshipsAvailable: true,
        livingCostPerYear: 16000,
        applicationFee: 50,
        website: 'https://nus.edu.sg',
        description: 'Asia\'s leading global university.',
        programs: [
          {
            name: 'MSc Computer Science',
            degree: 'masters',
            field: 'Computer Science',
            duration: '1.5 years',
            tuitionPerYear: 35000,
            requirements: { minGPA: 3.2, ieltsMin: 6.5, toeflMin: 90, greRequired: true }
          }
        ]
      },
      {
        name: 'Arizona State University',
        country: 'USA',
        city: 'Tempe, AZ',
        ranking: 185,
        acceptanceRate: 88,
        internationalStudentRatio: 15,
        scholarshipsAvailable: true,
        livingCostPerYear: 15000,
        applicationFee: 70,
        website: 'https://asu.edu',
        description: 'Large public research university known for innovation.',
        programs: [
          {
            name: 'MS Computer Science',
            degree: 'masters',
            field: 'Computer Science',
            duration: '2 years',
            tuitionPerYear: 32000,
            requirements: { minGPA: 3.0, ieltsMin: 6.5, toeflMin: 80, greRequired: false }
          }
        ]
      },
      {
        name: 'University of Waterloo',
        country: 'Canada',
        city: 'Waterloo, ON',
        ranking: 112,
        acceptanceRate: 53,
        internationalStudentRatio: 22,
        scholarshipsAvailable: true,
        livingCostPerYear: 12000,
        applicationFee: 125,
        website: 'https://uwaterloo.ca',
        description: 'Top Canadian university for engineering and co-op programs.',
        programs: [
          {
            name: 'MMath Computer Science',
            degree: 'masters',
            field: 'Computer Science',
            duration: '2 years',
            tuitionPerYear: 28000,
            requirements: { minGPA: 3.0, ieltsMin: 7.0, toeflMin: 90, greRequired: false }
          }
        ]
      }
    ];
    
    await University.insertMany(universities);
    
    res.json({ message: 'Universities seeded successfully', count: universities.length });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Sync universities from external API (real data)
router.post('/sync-from-api', async (req, res) => {
  try {
    const { countries, clearExisting } = req.body;
    
    // Optional: clear existing universities
    if (clearExisting) {
      await University.deleteMany({});
      console.log('Cleared existing universities');
    }
    
    // Default countries to fetch
    const countriesToFetch = countries || [
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
    const universities = await fetchRealUniversities(countriesToFetch);
    
    // Insert in batches to avoid memory issues
    const batchSize = 50;
    let inserted = 0;
    
    for (let i = 0; i < universities.length; i += batchSize) {
      const batch = universities.slice(i, i + batchSize);
      await University.insertMany(batch, { ordered: false }).catch(err => {
        // Ignore duplicate key errors
        if (err.code !== 11000) throw err;
      });
      inserted += batch.length;
    }
    
    console.log(`Synced ${inserted} universities from API`);
    res.json({ 
      message: 'Universities synced from API', 
      count: inserted,
      countries: countriesToFetch
    });
  } catch (error) {
    console.error('Sync error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Search universities by name (for autocomplete)
router.get('/search', authMiddleware, async (req, res) => {
  try {
    const { q, limit = 10 } = req.query;
    
    if (!q || q.length < 2) {
      return res.json([]);
    }
    
    const universities = await University.find({
      name: { $regex: q, $options: 'i' }
    })
    .limit(parseInt(limit))
    .select('name country city ranking tuitionFee');
    
    res.json(universities);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;
