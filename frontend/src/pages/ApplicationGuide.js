import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import liveUniversityApi from '../services/liveUniversityApi';
import { toast } from 'react-hot-toast';
import { 
  FiCheckCircle, 
  FiCircle,
  FiClock,
  FiAlertCircle,
  FiPlus,
  FiTrash2,
  FiLock,
  FiUnlock
} from 'react-icons/fi';
import './ApplicationGuide.css';

const ApplicationGuide = () => {
  const { user, refreshProfile } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddTask, setShowAddTask] = useState(false);
  const [newTask, setNewTask] = useState({ title: '', priority: 'medium', category: 'general' });
  const [filter, setFilter] = useState('all');
  const [liveLockedUniversities, setLiveLockedUniversities] = useState([]);

  useEffect(() => {
    loadTasks();
    loadLiveSelections();
  }, []);

  const loadLiveSelections = async () => {
    try {
      const data = await liveUniversityApi.getMySelections();
      setLiveLockedUniversities(data.locked || []);
    } catch (error) {
      console.error('Error loading live selections:', error);
    }
  };

  const loadTasks = async () => {
    try {
      const response = await api.get('/tasks');
      setTasks(response.data);
    } catch (error) {
      console.error('Error loading tasks:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleTask = async (taskId) => {
    const task = tasks.find(t => t._id === taskId);
    try {
      await api.put(`/tasks/${taskId}`, { completed: !task.completed });
      setTasks(tasks.map(t => 
        t._id === taskId ? { ...t, completed: !t.completed } : t
      ));
      toast.success(task.completed ? 'Task reopened' : 'Task completed!');
    } catch (error) {
      toast.error('Failed to update task');
    }
  };

  const deleteTask = async (taskId) => {
    try {
      await api.delete(`/tasks/${taskId}`);
      setTasks(tasks.filter(t => t._id !== taskId));
      toast.success('Task deleted');
    } catch (error) {
      toast.error('Failed to delete task');
    }
  };

  const addTask = async (e) => {
    e.preventDefault();
    if (!newTask.title.trim()) return;

    try {
      const response = await api.post('/tasks', newTask);
      setTasks([response.data, ...tasks]);
      setNewTask({ title: '', priority: 'medium', category: 'general' });
      setShowAddTask(false);
      toast.success('Task added');
    } catch (error) {
      toast.error('Failed to add task');
    }
  };

  const unlockUniversity = async (uni) => {
    try {
      if (uni.source === 'live') {
        await liveUniversityApi.unlockUniversity(uni.id);
        setLiveLockedUniversities(prev => prev.filter(u => u.universityId !== uni.id));
      } else {
        await api.delete(`/user/lock/${uni.id}`);
        await refreshProfile();
      }
      toast.success(`Unlocked ${uni.name}`);
    } catch (error) {
      console.error('Error unlocking:', error);
      toast.error('Failed to unlock university');
    }
  };

  const hasLockedUniversities = (user?.lockedUniversities?.length > 0) || (liveLockedUniversities.length > 0);
  const allLockedUniversities = [
    ...(user?.lockedUniversities || []).map(u => ({
      id: u.universityId?._id || u.universityId,
      name: u.universityId?.name || u.universityName || 'Unknown',
      country: u.universityId?.country || u.country || '',
      source: 'recommended'
    })),
    ...liveLockedUniversities.map(u => ({
      id: u.universityId,
      name: u.universityName,
      country: u.country,
      source: 'live'
    }))
  ];

  const filteredTasks = tasks.filter(task => {
    if (filter === 'all') return true;
    if (filter === 'pending') return !task.completed;
    if (filter === 'completed') return task.completed;
    return task.category === filter;
  });

  // Group tasks by university
  const tasksByUniversity = filteredTasks.reduce((acc, task) => {
    const uniId = task.universityId || 'general';
    const uniName = task.universityName || 'General Tasks';
    if (!acc[uniId]) {
      acc[uniId] = { name: uniName, tasks: [] };
    }
    acc[uniId].tasks.push(task);
    return acc;
  }, {});

  const stats = {
    total: tasks.length,
    completed: tasks.filter(t => t.completed).length,
    pending: tasks.filter(t => !t.completed).length,
    highPriority: tasks.filter(t => t.priority === 'high' && !t.completed).length
  };

  if (loading) {
    return <div className="loading">Loading application guide...</div>;
  }

  if (!hasLockedUniversities) {
    return (
      <div className="application-page">
        <div className="no-locked-state">
          <div className="lock-icon">
            <FiLock />
          </div>
          <h2>Lock a University First</h2>
          <p>
            You need to lock at least one university before you can access the 
            application guidance and to-do list.
          </p>
          <p className="hint">
            Locking a university shows your commitment and unlocks personalized 
            application tasks and timelines.
          </p>
          <Link to="/live-universities" className="btn btn-primary">
            Go to Universities
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="application-page">
      <div className="page-header">
        <div>
          <h1>Application Guide</h1>
        </div>
        <button className="btn btn-primary" onClick={() => setShowAddTask(true)}>
          <FiPlus /> Add Task
        </button>
      </div>

      {/* Stats */}
      <div className="stats-bar">
        <div className="stat-item">
          <span className="stat-value">{stats.total}</span>
          <span className="stat-label">Total Tasks</span>
        </div>
        <div className="stat-item">
          <span className="stat-value completed">{stats.completed}</span>
          <span className="stat-label">Completed</span>
        </div>
        <div className="stat-item">
          <span className="stat-value pending">{stats.pending}</span>
          <span className="stat-label">Pending</span>
        </div>
        <div className="stat-item">
          <span className="stat-value high">{stats.highPriority}</span>
          <span className="stat-label">High Priority</span>
        </div>
      </div>

      {/* Progress */}
      <div className="progress-section">
        <div className="progress-header">
          <span>Overall Progress</span>
          <span>{stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0}%</span>
        </div>
        <div className="progress-bar">
          <div 
            className="progress-fill"
            style={{ width: `${stats.total > 0 ? (stats.completed / stats.total) * 100 : 0}%` }}
          />
        </div>
      </div>

      {/* Filters */}
      <div className="filter-bar">
        <button 
          className={filter === 'all' ? 'active' : ''}
          onClick={() => setFilter('all')}
        >
          All
        </button>
        <button 
          className={filter === 'pending' ? 'active' : ''}
          onClick={() => setFilter('pending')}
        >
          Pending
        </button>
        <button 
          className={filter === 'completed' ? 'active' : ''}
          onClick={() => setFilter('completed')}
        >
          Completed
        </button>
        <button 
          className={filter === 'document' ? 'active' : ''}
          onClick={() => setFilter('document')}
        >
          Documents
        </button>
        <button 
          className={filter === 'exam' ? 'active' : ''}
          onClick={() => setFilter('exam')}
        >
          Exams
        </button>
      </div>

      {/* Add Task Modal */}
      {showAddTask && (
        <div className="modal-overlay" onClick={() => setShowAddTask(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h3>Add New Task</h3>
            <form onSubmit={addTask}>
              <div className="form-group">
                <label>Task Title</label>
                <input
                  type="text"
                  value={newTask.title}
                  onChange={e => setNewTask({ ...newTask, title: e.target.value })}
                  placeholder="What needs to be done?"
                  autoFocus
                />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Priority</label>
                  <select
                    value={newTask.priority}
                    onChange={e => setNewTask({ ...newTask, priority: e.target.value })}
                  >
                    <option value="high">High</option>
                    <option value="medium">Medium</option>
                    <option value="low">Low</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Category</label>
                  <select
                    value={newTask.category}
                    onChange={e => setNewTask({ ...newTask, category: e.target.value })}
                  >
                    <option value="document">Document</option>
                    <option value="exam">Exam</option>
                    <option value="application">Application</option>
                    <option value="general">General</option>
                  </select>
                </div>
              </div>
              <div className="modal-actions">
                <button type="button" className="btn-secondary" onClick={() => setShowAddTask(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Add Task
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Tasks List - Grouped by University */}
      <div className="tasks-container">
        {filteredTasks.length === 0 ? (
          <div className="empty-state">
            <p>No tasks found. Add a task or talk to the AI Counsellor to generate tasks.</p>
          </div>
        ) : (
          <div className="tasks-by-university">
            {Object.entries(tasksByUniversity).map(([uniId, { name, tasks: uniTasks }]) => (
              <div key={uniId} className="university-task-group">
                <div className="university-group-header">
                  <h3>{name}</h3>
                  <span className="task-count">
                    {uniTasks.filter(t => t.completed).length}/{uniTasks.length} completed
                  </span>
                </div>
                <div className="tasks-list">
                  {uniTasks.map(task => (
                    <div 
                      key={task._id} 
                      className={`task-card ${task.completed ? 'completed' : ''} ${task.priority}`}
                    >
                      <button className="task-check" onClick={() => toggleTask(task._id)}>
                        {task.completed ? <FiCheckCircle /> : <FiCircle />}
                      </button>
                      <div className="task-content">
                        <span className="task-title">{task.title}</span>
                        <div className="task-meta">
                          <span className={`priority-badge ${task.priority}`}>
                            {task.priority}
                          </span>
                          <span className="category-badge">
                            {task.category || 'general'}
                          </span>
                        </div>
                      </div>
                      <button className="task-delete" onClick={() => deleteTask(task._id)}>
                        <FiTrash2 />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Locked Universities */}
      <div className="locked-universities-section">
        <h2>Locked Universities ({allLockedUniversities.length})</h2>
        <div className="locked-list">
          {allLockedUniversities.map((item, index) => (
            <div key={index} className="locked-item">
              <FiLock className="lock-icon" />
              <div className="locked-info">
                <span className="locked-name">{item.name}</span>
                {item.country && <span className="locked-country">{item.country}</span>}
              </div>
              {item.source === 'live' && <span className="live-badge">Live</span>}
              <button 
                className="unlock-btn"
                onClick={() => unlockUniversity(item)}
                title="Unlock university"
              >
                <FiUnlock /> Unlock
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ApplicationGuide;
