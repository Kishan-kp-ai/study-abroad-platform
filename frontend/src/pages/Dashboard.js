import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import liveUniversityApi from '../services/liveUniversityApi';
import { 
  FiMessageCircle, 
  FiBook, 
  FiTarget, 
  FiCheckCircle,
  FiAlertCircle,
  FiArrowRight,
  FiLock,
  FiUser
} from 'react-icons/fi';
import './Dashboard.css';

const Dashboard = () => {
  const { user, refreshProfile } = useAuth();
  const [profileStrength, setProfileStrength] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [liveSelections, setLiveSelections] = useState({ shortlisted: [], locked: [] });

  const loadDashboardData = useCallback(async () => {
    try {
      const [strengthRes, tasksRes, liveSelectionsRes] = await Promise.all([
        api.get('/user/profile-strength'),
        api.get('/tasks'),
        liveUniversityApi.getMySelections(),
        refreshProfile()
      ]);
      setProfileStrength(strengthRes.data);
      setTasks(tasksRes.data);
      setLiveSelections(liveSelectionsRes);
    } catch (error) {
      console.error('Error loading dashboard:', error);
    } finally {
      setLoading(false);
    }
  }, [refreshProfile]);

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  // Refresh data when page becomes visible (user returns from another tab/page)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        loadDashboardData();
      }
    };

    const handleFocus = () => {
      loadDashboardData();
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleFocus);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
    };
  }, [loadDashboardData]);

  // Building Profile completion (for Stage 1 progress)
  const profileCompletion = profileStrength?.profileCompletion || 0;
  const isProfileComplete = profileCompletion >= 80;
  
  // Profile Strength (quality evaluation - separate from completion)
  const profileStrengthScore = profileStrength?.overall || 0;

  const stages = [
    { id: 1, name: 'Building Profile', icon: isProfileComplete ? FiCheckCircle : FiUser },
    { id: 2, name: 'Discovering Universities', icon: FiBook },
    { id: 3, name: 'Finalizing Universities', icon: FiTarget },
    { id: 4, name: 'Preparing Applications', icon: FiLock }
  ];

  // Circular progress component for Stage 1
  const CircularProgress = ({ percentage }) => {
    const radius = 28;
    const strokeWidth = 4;
    const normalizedRadius = radius - strokeWidth / 2;
    const circumference = normalizedRadius * 2 * Math.PI;
    const strokeDashoffset = circumference - (percentage / 100) * circumference;

    return (
      <svg
        className="circular-progress"
        width={radius * 2}
        height={radius * 2}
      >
        <circle
          className="circular-progress-bg"
          stroke="#e2e8f0"
          fill="transparent"
          strokeWidth={strokeWidth}
          r={normalizedRadius}
          cx={radius}
          cy={radius}
        />
        <circle
          className="circular-progress-bar"
          stroke={percentage >= 80 ? '#10b981' : '#f59e0b'}
          fill="transparent"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference + ' ' + circumference}
          style={{ strokeDashoffset, transition: 'stroke-dashoffset 0.5s ease-in-out' }}
          r={normalizedRadius}
          cx={radius}
          cy={radius}
        />
      </svg>
    );
  };

  const getStrengthColor = (strength) => {
    if (strength === 'strong' || strength === 'completed' || strength === 'ready') return '#10b981';
    if (strength === 'average' || strength === 'in-progress' || strength === 'draft') return '#f59e0b';
    return '#ef4444';
  };

  const toggleTask = async (taskId) => {
    const task = tasks.find(t => t._id === taskId);
    try {
      await api.put(`/tasks/${taskId}`, { completed: !task.completed });
      setTasks(tasks.map(t => 
        t._id === taskId ? { ...t, completed: !t.completed } : t
      ));
    } catch (error) {
      console.error('Error updating task:', error);
    }
  };

  if (loading) {
    return <div className="loading">Loading dashboard...</div>;
  }

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <div>
          <h1>Welcome back, {user?.fullName?.split(' ')[0]}!</h1>
          <p>Here's your study abroad journey at a glance</p>
        </div>
        <Link to="/counsellor" className="btn btn-primary">
          <FiMessageCircle /> Talk to AI Counsellor
        </Link>
      </div>

      {/* Stage Indicator */}
      <div className="stage-section">
        <h2>Your Journey Stage</h2>
        <div className="stages">
          {stages.map((stage, index) => (
            <div 
              key={stage.id} 
              className={`stage ${stage.id === 1 ? (isProfileComplete ? 'active completed' : 'active in-progress') : (user?.currentStage >= stage.id ? 'active' : '')} ${user?.currentStage === stage.id ? 'current' : ''}`}
            >
              <div className={`stage-icon ${stage.id === 1 ? 'with-progress' : ''}`}>
                {stage.id === 1 && <CircularProgress percentage={profileCompletion} />}
                <stage.icon />
              </div>
              <div className="stage-info">
                <span className="stage-number">Stage {stage.id}</span>
                <span className="stage-name">{stage.name}</span>
              </div>
              {index < stages.length - 1 && <div className="stage-connector" />}
            </div>
          ))}
        </div>
      </div>

      <div className="dashboard-grid">
        {/* Profile Summary */}
        <div className="card profile-summary">
          <h3>Profile Summary</h3>
          <div className="profile-details">
            <div className="profile-item">
              <span className="label">Education</span>
              <span className="value">{user?.degree} in {user?.major}</span>
            </div>
            <div className="profile-item">
              <span className="label">Target</span>
              <span className="value">{user?.intendedDegree} in {user?.fieldOfStudy}</span>
            </div>
            <div className="profile-item">
              <span className="label">Countries</span>
              <span className="value">{user?.preferredCountries?.join(', ') || 'Not set'}</span>
            </div>
            <div className="profile-item">
              <span className="label">Budget</span>
              <span className="value">${user?.budgetMin?.toLocaleString()} - ${user?.budgetMax?.toLocaleString()}/yr</span>
            </div>
          </div>
          <Link to="/profile" className="card-link">
            Edit Profile <FiArrowRight />
          </Link>
        </div>

        {/* Profile Strength */}
        <div className="card profile-strength">
          <h3>Profile Strength</h3>
          {profileStrength && (
            <>
              <div className="strength-score">
                <div className="score-circle">
                  <span className="score-value">{profileStrengthScore}%</span>
                </div>
              </div>
              <div className="strength-items">
                <div className="strength-item">
                  <span className="strength-label">Academics</span>
                  <span 
                    className="strength-badge"
                    style={{ backgroundColor: getStrengthColor(profileStrength.academics) }}
                  >
                    {profileStrength.academics}
                  </span>
                </div>
                <div className="strength-item">
                  <span className="strength-label">Exams</span>
                  <span 
                    className="strength-badge"
                    style={{ backgroundColor: getStrengthColor(profileStrength.exams) }}
                  >
                    {profileStrength.exams}
                  </span>
                </div>
                <div className="strength-item">
                  <span className="strength-label">SOP</span>
                  <span 
                    className="strength-badge"
                    style={{ backgroundColor: getStrengthColor(profileStrength.sop) }}
                  >
                    {profileStrength.sop}
                  </span>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Universities Summary */}
        <div className="card universities-summary">
          <h3>Universities</h3>
          <div className="uni-stats">
            <div className="uni-stat">
              <span className="stat-number">{(user?.shortlistedUniversities?.length || 0) + (liveSelections.shortlisted?.length || 0)}</span>
              <span className="stat-label">Shortlisted</span>
            </div>
            <div className="uni-stat">
              <span className="stat-number">{(user?.lockedUniversities?.length || 0) + (liveSelections.locked?.length || 0)}</span>
              <span className="stat-label">Locked</span>
            </div>
          </div>
          {(user?.lockedUniversities?.length || 0) + (liveSelections.locked?.length || 0) === 0 && (
            <div className="uni-alert">
              <FiAlertCircle />
              <span>Lock at least one university to start application guidance</span>
            </div>
          )}
          <Link to="/universities" className="card-link">
            Explore Universities <FiArrowRight />
          </Link>
        </div>

        {/* Tasks */}
        <div className="card tasks-card">
          <h3>To-Do List</h3>
          {tasks.length === 0 ? (
            <p className="no-tasks">No tasks yet. Talk to AI Counsellor to get started!</p>
          ) : (
            <ul className="task-list">
              {tasks.slice(0, 5).map(task => (
                <li key={task._id} className={`task-item ${task.completed ? 'completed' : ''}`}>
                  <button 
                    className="task-checkbox"
                    onClick={() => toggleTask(task._id)}
                  >
                    {task.completed && <FiCheckCircle />}
                  </button>
                  <span className="task-title">{task.title}</span>
                  <span className={`task-priority ${task.priority}`}>{task.priority}</span>
                </li>
              ))}
            </ul>
          )}
          {tasks.length > 5 && (
            <Link to="/application" className="card-link">
              View All Tasks <FiArrowRight />
            </Link>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="quick-actions">
        <h2>Quick Actions</h2>
        <div className="actions-grid">
          <Link to="/counsellor" className="action-card">
            <FiMessageCircle className="action-icon" />
            <div>
              <h4>AI Counsellor</h4>
              <p>Get personalized guidance</p>
            </div>
          </Link>
          <Link to="/universities" className="action-card">
            <FiBook className="action-icon" />
            <div>
              <h4>Explore Universities</h4>
              <p>Find your perfect match</p>
            </div>
          </Link>
          <Link to="/application" className="action-card">
            <FiTarget className="action-icon" />
            <div>
              <h4>Application Guide</h4>
              <p>Track your progress</p>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
