const mongoose = require('mongoose');

const universitySchema = new mongoose.Schema({
  name: { type: String, required: true },
  country: { type: String, required: true },
  city: { type: String },
  ranking: { type: Number },
  
  // Programs offered
  programs: [{
    name: { type: String },
    degree: { type: String }, // bachelors, masters, mba, phd
    field: { type: String },
    duration: { type: String },
    tuitionPerYear: { type: Number },
    requirements: {
      minGPA: { type: Number },
      ieltsMin: { type: Number },
      toeflMin: { type: Number },
      greRequired: { type: Boolean },
      gmatRequired: { type: Boolean }
    }
  }],
  
  // General info
  acceptanceRate: { type: Number },
  internationalStudentRatio: { type: Number },
  scholarshipsAvailable: { type: Boolean, default: false },
  applicationDeadlines: [{
    intake: { type: String },
    deadline: { type: Date }
  }],
  
  // Costs
  tuitionFee: { type: Number },
  livingCostPerYear: { type: Number },
  applicationFee: { type: Number },
  
  website: { type: String },
  description: { type: String }
});

module.exports = mongoose.model('University', universitySchema);
