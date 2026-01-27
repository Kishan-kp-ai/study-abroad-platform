const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  fullName: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  
  // Onboarding status
  onboardingCompleted: { type: Boolean, default: false },
  
  // Academic Background
  educationLevel: { type: String },
  degree: { type: String },
  major: { type: String },
  graduationYear: { type: Number },
  gpa: { type: String },
  
  // Study Goal
  intendedDegree: { type: String },
  fieldOfStudy: { type: String },
  targetIntakeYear: { type: Number },
  preferredCountries: [{ type: String }],
  
  // Budget
  budgetMin: { type: Number },
  budgetMax: { type: Number },
  fundingPlan: { type: String }, // self-funded, scholarship, loan
  
  // Exams & Readiness
  ieltsStatus: { type: String, default: 'not-started' },
  ieltsScore: { type: String },
  toeflStatus: { type: String, default: 'not-started' },
  toeflScore: { type: String },
  greStatus: { type: String, default: 'not-started' },
  greScore: { type: String },
  gmatStatus: { type: String, default: 'not-started' },
  gmatScore: { type: String },
  sopStatus: { type: String, default: 'not-started' },
  
  // Current Stage (1-4)
  currentStage: { type: Number, default: 1 },
  
  // Shortlisted Universities
  shortlistedUniversities: [{
    universityId: { type: mongoose.Schema.Types.ObjectId, ref: 'University' },
    category: { type: String, enum: ['dream', 'target', 'safe'] },
    addedAt: { type: Date, default: Date.now }
  }],
  
  // Locked Universities
  lockedUniversities: [{
    universityId: { type: mongoose.Schema.Types.ObjectId, ref: 'University' },
    lockedAt: { type: Date, default: Date.now }
  }],
  
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

userSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('User', userSchema);
