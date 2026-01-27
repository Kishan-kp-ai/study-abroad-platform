const express = require('express');
const Task = require('../models/Task');
const User = require('../models/User');
const authMiddleware = require('../middleware/auth');
const router = express.Router();

// Get all tasks for user
router.get('/', authMiddleware, async (req, res) => {
  try {
    const tasks = await Task.find({ userId: req.userId })
      .populate('universityId')
      .sort({ priority: -1, createdAt: -1 });
    res.json(tasks);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Create a task
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { title, description, category, priority, dueDate, universityId } = req.body;
    
    const task = new Task({
      userId: req.userId,
      universityId,
      title,
      description,
      category,
      priority,
      dueDate
    });
    
    await task.save();
    res.status(201).json(task);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Update a task
router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const updates = req.body;
    
    if (updates.completed) {
      updates.completedAt = new Date();
    }
    
    const task = await Task.findOneAndUpdate(
      { _id: req.params.id, userId: req.userId },
      updates,
      { new: true }
    );
    
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }
    
    res.json(task);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Delete a task
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const task = await Task.findOneAndDelete({ _id: req.params.id, userId: req.userId });
    
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }
    
    res.json({ message: 'Task deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Delete all tasks for a university (used when unlocking)
router.delete('/university/:universityId', authMiddleware, async (req, res) => {
  try {
    const { universityId } = req.params;
    
    const result = await Task.deleteMany({ 
      userId: req.userId, 
      universityId: universityId 
    });
    
    res.json({ 
      message: 'Tasks deleted', 
      deletedCount: result.deletedCount 
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Generate application tasks for locked university
router.post('/generate/:universityId', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    const { universityId } = req.params;
    
    // Check if university is locked
    const isLocked = user.lockedUniversities.find(
      l => l.universityId.toString() === universityId
    );
    
    if (!isLocked) {
      return res.status(400).json({ message: 'University must be locked first' });
    }
    
    // Check if tasks already generated
    const existingTasks = await Task.find({ userId: req.userId, universityId });
    if (existingTasks.length > 0) {
      return res.json({ message: 'Tasks already generated', tasks: existingTasks });
    }
    
    // Generate standard application tasks
    const tasks = [
      { title: 'Prepare Statement of Purpose (SOP)', category: 'document', priority: 'high' },
      { title: 'Gather academic transcripts', category: 'document', priority: 'high' },
      { title: 'Get letters of recommendation (2-3)', category: 'document', priority: 'high' },
      { title: 'Prepare updated CV/Resume', category: 'document', priority: 'medium' },
      { title: 'Complete English proficiency test', category: 'exam', priority: 'high' },
      { title: 'Submit standardized test scores (GRE/GMAT)', category: 'exam', priority: 'medium' },
      { title: 'Fill online application form', category: 'application', priority: 'high' },
      { title: 'Pay application fee', category: 'application', priority: 'medium' },
      { title: 'Prepare financial documents', category: 'document', priority: 'medium' },
      { title: 'Research scholarship opportunities', category: 'general', priority: 'medium' }
    ];
    
    const createdTasks = await Task.insertMany(
      tasks.map(t => ({
        ...t,
        userId: req.userId,
        universityId,
        aiGenerated: true
      }))
    );
    
    res.status(201).json({ message: 'Tasks generated', tasks: createdTasks });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;
