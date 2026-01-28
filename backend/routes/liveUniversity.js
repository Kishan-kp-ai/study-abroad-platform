const express = require('express');
const User = require('../models/User');
const authMiddleware = require('../middleware/auth');
const { 
  fetchUniversitiesByCountry, 
  searchUniversities, 
  getUniversityByName,
  fetchUniversitiesForCountries,
  generateId
} = require('../services/liveUniversityApi');

const router = express.Router();

// Get universities by country (live fetch)
router.get('/by-country/:country', authMiddleware, async (req, res) => {
  try {
    const { country } = req.params;
    const { limit = 50 } = req.query;
    
    const universities = await fetchUniversitiesByCountry(country);
    
    res.json({
      source: 'live',
      fetchedAt: new Date().toISOString(),
      count: Math.min(universities.length, parseInt(limit)),
      data: universities.slice(0, parseInt(limit))
    });
  } catch (error) {
    res.status(503).json({ 
      message: 'Unable to fetch universities at this time',
      error: error.message,
      source: 'live',
      isTemporaryError: true
    });
  }
});

// Search universities (live fetch)
router.get('/search', authMiddleware, async (req, res) => {
  try {
    const { q, limit = 20 } = req.query;
    
    if (!q || q.length < 2) {
      return res.json({
        source: 'live',
        count: 0,
        data: [],
        message: 'Please enter at least 2 characters to search'
      });
    }
    
    const universities = await searchUniversities(q);
    
    res.json({
      source: 'live',
      fetchedAt: new Date().toISOString(),
      count: Math.min(universities.length, parseInt(limit)),
      data: universities.slice(0, parseInt(limit))
    });
  } catch (error) {
    res.status(503).json({ 
      message: 'Unable to search universities at this time',
      error: error.message,
      source: 'live',
      isTemporaryError: true
    });
  }
});

// Get single university by ID (live fetch)
router.get('/details/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    
    // Decode the ID to get name and country
    const decoded = Buffer.from(id, 'base64').toString('utf-8');
    const [name, country] = decoded.split('::');
    
    if (!name || !country) {
      return res.status(400).json({ message: 'Invalid university ID' });
    }
    
    const university = await getUniversityByName(name, country);
    
    if (!university) {
      return res.status(404).json({ 
        message: 'University not found',
        source: 'live'
      });
    }
    
    res.json({
      source: 'live',
      fetchedAt: new Date().toISOString(),
      data: university
    });
  } catch (error) {
    res.status(503).json({ 
      message: 'Unable to fetch university details at this time',
      error: error.message,
      source: 'live',
      isTemporaryError: true
    });
  }
});

// Get personalized recommendations (live fetch based on user profile)
router.get('/recommended', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    const countries = user.preferredCountries || ['United States'];
    
    // Fetch universities for user's preferred countries
    const universities = await fetchUniversitiesForCountries(countries, 20);
    
    // Calculate fit score for each university
    const recommendations = universities.map(uni => {
      let fitScore = 0;
      let risks = [];
      let reasons = [];
      
      // Check budget fit
      const avgTuition = uni.programs.reduce((sum, p) => sum + (p.tuitionPerYear || 0), 0) / uni.programs.length;
      const totalCost = avgTuition + (uni.livingCostPerYear || 0);
      
      if (user.budgetMax && totalCost <= user.budgetMax) {
        fitScore += 30;
        reasons.push('Within your budget');
      } else if (user.budgetMax) {
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
      source: 'live',
      fetchedAt: new Date().toISOString(),
      userProfile: {
        intendedDegree: user.intendedDegree,
        fieldOfStudy: user.fieldOfStudy,
        preferredCountries: user.preferredCountries,
        budgetMax: user.budgetMax
      },
      dream: recommendations.filter(r => r.category === 'dream'),
      target: recommendations.filter(r => r.category === 'target'),
      safe: recommendations.filter(r => r.category === 'safe')
    });
  } catch (error) {
    console.error('Recommendation error:', error);
    res.status(503).json({ 
      message: 'Unable to fetch recommendations at this time',
      error: error.message,
      source: 'live',
      isTemporaryError: true
    });
  }
});

// Get all universities for user's preferred countries
router.get('/for-me', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    const countries = user?.preferredCountries || ['United States'];
    const { limit = 100 } = req.query;
    
    const universities = await fetchUniversitiesForCountries(countries, Math.ceil(parseInt(limit) / countries.length));
    
    res.json({
      source: 'live',
      fetchedAt: new Date().toISOString(),
      countries,
      count: universities.length,
      data: universities.slice(0, parseInt(limit))
    });
  } catch (error) {
    res.status(503).json({ 
      message: 'Unable to fetch universities at this time',
      error: error.message,
      source: 'live',
      isTemporaryError: true
    });
  }
});

// Shortlist a live university
router.post('/shortlist', authMiddleware, async (req, res) => {
  try {
    const { universityId, universityName, country, category = 'target' } = req.body;
    
    const user = await User.findById(req.userId);
    
    if (!user.liveShortlistedUniversities) {
      user.liveShortlistedUniversities = [];
    }
    
    const alreadyShortlisted = user.liveShortlistedUniversities.find(
      u => u.universityId === universityId
    );
    
    if (alreadyShortlisted) {
      return res.status(400).json({ message: 'University already shortlisted' });
    }
    
    user.liveShortlistedUniversities.push({ 
      universityId, 
      universityName, 
      country, 
      category,
      shortlistedAt: new Date()
    });
    
    await user.save();
    
    res.json({ 
      message: 'University shortlisted', 
      liveShortlistedUniversities: user.liveShortlistedUniversities 
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Remove from live shortlist
router.delete('/shortlist/:universityId', authMiddleware, async (req, res) => {
  try {
    const { universityId } = req.params;
    
    const user = await User.findById(req.userId);
    
    if (!user.liveShortlistedUniversities) {
      user.liveShortlistedUniversities = [];
    }
    
    user.liveShortlistedUniversities = user.liveShortlistedUniversities.filter(
      u => u.universityId !== universityId
    );
    
    await user.save();
    
    res.json({ 
      message: 'Removed from shortlist', 
      liveShortlistedUniversities: user.liveShortlistedUniversities 
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Lock a live university
router.post('/lock', authMiddleware, async (req, res) => {
  try {
    const { universityId, universityName, country } = req.body;
    
    const user = await User.findById(req.userId);
    
    if (!user.liveLockedUniversities) {
      user.liveLockedUniversities = [];
    }
    
    const alreadyLocked = user.liveLockedUniversities.find(
      u => u.universityId === universityId
    );
    
    if (alreadyLocked) {
      return res.status(400).json({ message: 'University already locked' });
    }
    
    user.liveLockedUniversities.push({ 
      universityId, 
      universityName, 
      country,
      lockedAt: new Date()
    });
    
    await user.save();
    
    // Auto-generate application tasks for the locked university
    const Task = require('../models/Task');
    const existingTasks = await Task.find({ userId: req.userId, universityId });
    
    let createdTasks = [];
    if (existingTasks.length === 0) {
      const applicationTasks = [
        { title: `Prepare SOP for ${universityName}`, category: 'document', priority: 'high' },
        { title: `Gather transcripts for ${universityName}`, category: 'document', priority: 'high' },
        { title: `Get recommendation letters for ${universityName}`, category: 'document', priority: 'high' },
        { title: `Complete application form for ${universityName}`, category: 'application', priority: 'high' },
        { title: `Pay application fee for ${universityName}`, category: 'application', priority: 'medium' },
        { title: `Prepare financial documents for ${universityName}`, category: 'document', priority: 'medium' }
      ];
      
      createdTasks = await Task.insertMany(
        applicationTasks.map(t => ({
          ...t,
          userId: req.userId,
          universityId,
          universityName,
          aiGenerated: true
        }))
      );
    }
    
    res.json({ 
      message: 'University locked', 
      liveLockedUniversities: user.liveLockedUniversities,
      tasksCreated: createdTasks.length
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Unlock a live university
router.delete('/lock/:universityId', authMiddleware, async (req, res) => {
  try {
    const { universityId } = req.params;
    
    const user = await User.findById(req.userId);
    
    if (!user.liveLockedUniversities) {
      user.liveLockedUniversities = [];
    }
    
    user.liveLockedUniversities = user.liveLockedUniversities.filter(
      u => u.universityId !== universityId
    );
    
    await user.save();
    
    // Also delete any tasks associated with this university
    const Task = require('../models/Task');
    const deletedTasks = await Task.deleteMany({ 
      userId: req.userId, 
      universityId: universityId 
    });
    
    res.json({ 
      message: 'University unlocked', 
      liveLockedUniversities: user.liveLockedUniversities,
      tasksDeleted: deletedTasks.deletedCount
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get user's live shortlisted and locked universities
router.get('/my-selections', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    
    res.json({
      shortlisted: user.liveShortlistedUniversities || [],
      locked: user.liveLockedUniversities || []
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;
