const mongoose = require('mongoose');

const taskSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  universityId: { type: String },
  universityName: { type: String },
  
  title: { type: String, required: true },
  description: { type: String },
  category: { type: String, enum: ['document', 'exam', 'application', 'general'] },
  priority: { type: String, enum: ['high', 'medium', 'low'], default: 'medium' },
  
  dueDate: { type: Date },
  completed: { type: Boolean, default: false },
  completedAt: { type: Date },
  
  aiGenerated: { type: Boolean, default: false },
  
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

taskSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('Task', taskSchema);
