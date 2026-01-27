const express = require('express');
const User = require('../models/User');
const authMiddleware = require('../middleware/auth');
const router = express.Router();

// Get current user profile
router.get('/profile', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.userId)
      .select('-password')
      .populate('shortlistedUniversities.universityId')
      .populate('lockedUniversities.universityId');
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Complete onboarding
router.post('/onboarding', authMiddleware, async (req, res) => {
  try {
    console.log('Onboarding request received:', req.body);
    console.log('User ID:', req.userId);
    
    const { skipWithDefaults } = req.body;
    
    // If user skips onboarding, only mark as completed without filling data
    if (skipWithDefaults) {
      const user = await User.findByIdAndUpdate(
        req.userId,
        { onboardingCompleted: true, currentStage: 1 },
        { new: true }
      ).select('-password');
      
      return res.json({ message: 'Onboarding skipped', user });
    }
    
    const {
      educationLevel, degree, major, graduationYear, gpa,
      intendedDegree, fieldOfStudy, targetIntakeYear, preferredCountries,
      budgetMin, budgetMax, fundingPlan,
      ieltsStatus, ieltsScore, toeflStatus, toeflScore,
      greStatus, greScore, gmatStatus, gmatScore, sopStatus
    } = req.body;
    
    const updateData = {
      educationLevel, degree, major, graduationYear, gpa,
      intendedDegree, fieldOfStudy, targetIntakeYear, preferredCountries,
      budgetMin, budgetMax, fundingPlan,
      ieltsStatus, ieltsScore, toeflStatus, toeflScore,
      greStatus, greScore, gmatStatus, gmatScore, sopStatus,
      onboardingCompleted: true,
      currentStage: 2
    };
    
    console.log('Updating user with:', updateData);
    
    const user = await User.findByIdAndUpdate(
      req.userId,
      updateData,
      { new: true }
    ).select('-password');
    
    console.log('Updated user:', user);
    
    res.json({ message: 'Onboarding completed', user });
  } catch (error) {
    console.error('Onboarding error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Update profile
router.put('/profile', authMiddleware, async (req, res) => {
  try {
    const updates = req.body;
    delete updates.password; // Prevent password update through this route
    
    const user = await User.findByIdAndUpdate(
      req.userId,
      updates,
      { new: true }
    ).select('-password');
    
    res.json({ message: 'Profile updated', user });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get profile strength analysis
router.get('/profile-strength', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    
    // Calculate profile strength based on all profile fields
    const strength = {
      academics: 'weak',
      exams: 'not-started',
      sop: user.sopStatus || 'not-started',
      overall: 0,
      profileCompletion: 0
    };
    
    // === PROFILE COMPLETION (for Building Profile stage) ===
    // Measures how much of the profile is filled out
    // Total: 100 points
    let completionScore = 0;
    
    // Basic Info (20 points)
    if (user.fullName && user.fullName.trim()) completionScore += 10;
    if (user.email && user.email.trim()) completionScore += 10;
    
    // Academic Background (25 points)
    if (user.educationLevel && user.educationLevel.trim()) completionScore += 5;
    if (user.degree && user.degree.trim()) completionScore += 5;
    if (user.major && user.major.trim()) completionScore += 5;
    if (user.gpa && user.gpa.toString().trim()) completionScore += 5;
    if (user.graduationYear) completionScore += 5;
    
    // Study Goals (25 points)
    if (user.intendedDegree && user.intendedDegree.trim()) completionScore += 7;
    if (user.fieldOfStudy && user.fieldOfStudy.trim()) completionScore += 6;
    if (user.targetIntakeYear) completionScore += 6;
    if (user.preferredCountries && user.preferredCountries.length > 0) completionScore += 6;
    
    // Budget & Funding (10 points)
    if (user.budgetMin) completionScore += 3;
    if (user.budgetMax) completionScore += 3;
    if (user.fundingPlan && user.fundingPlan.trim()) completionScore += 4;
    
    // Exams filled (10 points)
    const examStatuses = [user.ieltsStatus, user.toeflStatus, user.greStatus, user.gmatStatus];
    const examsSet = examStatuses.filter(s => s && s !== 'not-started').length;
    if (examsSet >= 2) completionScore += 10;
    else if (examsSet >= 1) completionScore += 5;
    
    // SOP (10 points)
    if (user.sopStatus && user.sopStatus !== 'not-started') completionScore += 10;
    
    strength.profileCompletion = Math.min(completionScore, 100);
    
    // === PROFILE STRENGTH (quality evaluation) ===
    // Measures the quality/readiness of academics, exams, SOP
    // Total: 100 points (Academics: 40, Exams: 40, SOP: 20)
    let strengthScore = 0;
    
    // Academics strength (40 points) - based on GPA quality
    if (user.gpa) {
      const gpaNum = parseFloat(user.gpa);
      if (gpaNum >= 3.5 || gpaNum >= 85) {
        strengthScore += 40;
        strength.academics = 'strong';
      } else if (gpaNum >= 3.0 || gpaNum >= 70) {
        strengthScore += 25;
        strength.academics = 'average';
      } else if (gpaNum > 0) {
        strengthScore += 10;
        strength.academics = 'weak';
      }
    }
    
    // Exams strength (40 points) - based on completion status
    const completedExams = examStatuses.filter(s => s === 'completed').length;
    const inProgressExams = examStatuses.filter(s => s === 'in-progress').length;
    const notRequiredExams = examStatuses.filter(s => s === 'not-required').length;
    
    if (completedExams >= 2 || (completedExams >= 1 && notRequiredExams >= 2)) {
      strengthScore += 40;
      strength.exams = 'completed';
    } else if (completedExams >= 1) {
      strengthScore += 25;
      strength.exams = 'in-progress';
    } else if (inProgressExams >= 1) {
      strengthScore += 10;
      strength.exams = 'in-progress';
    }
    
    // SOP strength (20 points)
    if (user.sopStatus === 'ready') {
      strengthScore += 20;
    } else if (user.sopStatus === 'draft') {
      strengthScore += 10;
    }
    
    strength.overall = Math.min(strengthScore, 100);
    
    res.json(strength);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Shortlist a university
router.post('/shortlist/:universityId', authMiddleware, async (req, res) => {
  try {
    const { category } = req.body; // dream, target, safe
    const { universityId } = req.params;
    
    const user = await User.findById(req.userId);
    
    // Check if already shortlisted
    const alreadyShortlisted = user.shortlistedUniversities.find(
      u => u.universityId.toString() === universityId
    );
    
    if (alreadyShortlisted) {
      return res.status(400).json({ message: 'University already shortlisted' });
    }
    
    user.shortlistedUniversities.push({ universityId, category });
    
    // Update stage if needed
    if (user.currentStage < 2) user.currentStage = 2;
    
    await user.save();
    
    res.json({ message: 'University shortlisted', shortlistedUniversities: user.shortlistedUniversities });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Remove from shortlist
router.delete('/shortlist/:universityId', authMiddleware, async (req, res) => {
  try {
    const { universityId } = req.params;
    
    const user = await User.findById(req.userId);
    user.shortlistedUniversities = user.shortlistedUniversities.filter(
      u => u.universityId.toString() !== universityId
    );
    
    // Rollback stage if no shortlisted universities and not in later stages
    if (user.shortlistedUniversities.length === 0 && user.lockedUniversities.length === 0) {
      user.currentStage = 1;
    }
    
    await user.save();
    
    res.json({ message: 'Removed from shortlist', shortlistedUniversities: user.shortlistedUniversities });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Lock a university
router.post('/lock/:universityId', authMiddleware, async (req, res) => {
  try {
    const { universityId } = req.params;
    const user = await User.findById(req.userId);
    
    // Check if already locked
    const alreadyLocked = user.lockedUniversities.find(
      u => u.universityId.toString() === universityId
    );
    
    if (alreadyLocked) {
      return res.status(400).json({ message: 'University already locked' });
    }
    
    user.lockedUniversities.push({ universityId });
    
    // Update stage based on locked count
    if (user.lockedUniversities.length >= 3) {
      user.currentStage = 4;
    } else {
      user.currentStage = 3;
    }
    
    await user.save();
    
    res.json({ 
      message: 'University locked', 
      lockedUniversities: user.lockedUniversities,
      currentStage: user.currentStage 
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Unlock a university
router.delete('/lock/:universityId', authMiddleware, async (req, res) => {
  try {
    const { universityId } = req.params;
    const user = await User.findById(req.userId);
    
    user.lockedUniversities = user.lockedUniversities.filter(
      u => u.universityId.toString() !== universityId
    );
    
    // Rollback stage based on remaining data
    if (user.lockedUniversities.length === 0) {
      if (user.shortlistedUniversities.length === 0) {
        user.currentStage = 1;
      } else {
        user.currentStage = 2;
      }
    } else if (user.lockedUniversities.length < 3) {
      user.currentStage = 3;
    }
    
    await user.save();
    
    res.json({ 
      message: 'University unlocked', 
      lockedUniversities: user.lockedUniversities,
      currentStage: user.currentStage 
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;
