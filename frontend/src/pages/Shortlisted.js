import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import liveUniversityApi from '../services/liveUniversityApi';
import { toast } from 'react-hot-toast';
import { 
  FiHeart,
  FiMapPin,
  FiExternalLink,
  FiLock,
  FiUnlock,
  FiTrash2,
  FiLoader,
  FiSearch,
  FiFilter,
  FiX,
  FiAlertCircle,
  FiCheckCircle,
  FiArrowRight,
  FiDollarSign,
  FiAward,
  FiAlertTriangle,
  FiTrendingUp
} from 'react-icons/fi';
import './Shortlisted.css';

// Country-based default costs (fallback when API doesn't return data)
const COUNTRY_DEFAULTS = {
  'United States': { tuition: 35000, living: 18000 },
  'United Kingdom': { tuition: 28000, living: 15000 },
  'Canada': { tuition: 22000, living: 14000 },
  'Australia': { tuition: 30000, living: 16000 },
  'Germany': { tuition: 500, living: 12000 },
  'France': { tuition: 3000, living: 12000 },
  'Netherlands': { tuition: 15000, living: 14000 },
  'Ireland': { tuition: 20000, living: 14000 },
  'Singapore': { tuition: 35000, living: 18000 },
  'default': { tuition: 25000, living: 15000 }
};

// Helper functions for card display
const calculateTotalCost = (uni) => {
  const tuition = uni.tuitionFee || 0;
  const living = uni.livingCostPerYear || 0;
  
  // If both are 0, use country defaults
  if (tuition === 0 && living === 0) {
    const defaults = COUNTRY_DEFAULTS[uni.country] || COUNTRY_DEFAULTS['default'];
    return defaults.tuition + defaults.living;
  }
  
  return tuition + living;
};

const getRiskLevel = (uni) => {
  const acceptanceRate = uni.acceptanceRate || 50;
  const ranking = uni.ranking || 100;
  
  if (acceptanceRate < 15 || ranking < 30) {
    return { level: 'high', label: 'High Risk', color: '#dc2626' };
  } else if (acceptanceRate < 40 || ranking < 80) {
    return { level: 'medium', label: 'Medium Risk', color: '#f59e0b' };
  }
  return { level: 'low', label: 'Low Risk', color: '#10b981' };
};

const getAcceptanceLikelihood = (uni) => {
  const acceptanceRate = uni.acceptanceRate || 50;
  const internationalRatio = uni.internationalStudentRatio || 15;
  
  let score = acceptanceRate;
  if (internationalRatio > 25) score += 10;
  if (uni.scholarshipsAvailable) score += 5;
  
  if (score >= 60) {
    return { level: 'high', label: 'High Chance', color: '#10b981' };
  } else if (score >= 35) {
    return { level: 'medium', label: 'Medium Chance', color: '#f59e0b' };
  }
  return { level: 'low', label: 'Low Chance', color: '#dc2626' };
};

const Shortlisted = () => {
  const [shortlisted, setShortlisted] = useState([]);
  const [locked, setLocked] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('shortlisted');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');

  const loadSelections = useCallback(async () => {
    try {
      setLoading(true);
      const data = await liveUniversityApi.getMySelections();
      
      // Use stored details directly - no API calls needed
      setShortlisted(data.shortlisted || []);
      setLocked(data.locked || []);
    } catch (error) {
      console.error('Error loading selections:', error);
      toast.error('Failed to load your selections');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSelections();
  }, [loadSelections]);

  const handleRemoveFromShortlist = async (universityId, universityName) => {
    try {
      await liveUniversityApi.removeFromShortlist(universityId);
      setShortlisted(prev => prev.filter(u => u.universityId !== universityId));
      toast.success(`Removed ${universityName} from shortlist`);
    } catch (error) {
      toast.error('Failed to remove from shortlist');
    }
  };

  const handleLock = async (uni) => {
    try {
      await liveUniversityApi.lockUniversity(uni.universityId, uni.universityName, uni.country);
      setLocked(prev => [...prev, { ...uni, lockedAt: new Date().toISOString() }]);
      toast.success(`Locked ${uni.universityName}`);
    } catch (error) {
      if (error.response?.data?.message === 'University already locked') {
        toast.error('University is already locked');
      } else {
        toast.error('Failed to lock university');
      }
    }
  };

  const handleUnlock = async (universityId, universityName) => {
    try {
      await liveUniversityApi.unlockUniversity(universityId);
      setLocked(prev => prev.filter(u => u.universityId !== universityId));
      toast.success(`Unlocked ${universityName}`);
    } catch (error) {
      toast.error('Failed to unlock university');
    }
  };

  const isLocked = (universityId) => {
    return locked.some(u => u.universityId === universityId);
  };

  const getCategoryColor = (category) => {
    switch (category) {
      case 'dream': return '#8b5cf6';
      case 'target': return '#3b82f6';
      case 'safe': return '#10b981';
      default: return '#6b7280';
    }
  };

  const filteredShortlisted = shortlisted.filter(uni => {
    const matchesSearch = uni.universityName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          uni.country.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = filterCategory === 'all' || uni.category === filterCategory;
    return matchesSearch && matchesCategory;
  });

  const filteredLocked = locked.filter(uni => {
    const matchesSearch = uni.universityName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          uni.country.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  const activeList = activeTab === 'shortlisted' ? filteredShortlisted : filteredLocked;

  if (loading) {
    return (
      <div className="shortlisted-page">
        <div className="loading-state">
          <FiLoader className="spin" />
          <p>Loading your selections...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="shortlisted-page">
      <div className="page-header">
        <div className="header-content">
          <h1><FiHeart /> My Universities</h1>
          <p>Manage your shortlisted and locked universities</p>
        </div>
        <Link to="/live-universities" className="explore-btn">
          <FiSearch /> Explore More Universities
        </Link>
      </div>

      {/* Stats Summary */}
      <div className="stats-summary">
        <div className="stat-card">
          <div className="stat-icon shortlist-icon">
            <FiHeart />
          </div>
          <div className="stat-info">
            <span className="stat-number">{shortlisted.length}</span>
            <span className="stat-label">Shortlisted</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon locked-icon">
            <FiLock />
          </div>
          <div className="stat-info">
            <span className="stat-number">{locked.length}</span>
            <span className="stat-label">Locked</span>
          </div>
        </div>
        <div className="stat-card categories">
          <div className="category-breakdown">
            <span className="category-item dream">
              <span className="dot"></span>
              {shortlisted.filter(u => u.category === 'dream').length} Dream
            </span>
            <span className="category-item target">
              <span className="dot"></span>
              {shortlisted.filter(u => u.category === 'target').length} Target
            </span>
            <span className="category-item safe">
              <span className="dot"></span>
              {shortlisted.filter(u => u.category === 'safe').length} Safe
            </span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="tabs-section">
        <div className="tabs">
          <button 
            className={`tab ${activeTab === 'shortlisted' ? 'active' : ''}`}
            onClick={() => setActiveTab('shortlisted')}
          >
            <FiHeart /> Shortlisted ({shortlisted.length})
          </button>
          <button 
            className={`tab ${activeTab === 'locked' ? 'active' : ''}`}
            onClick={() => setActiveTab('locked')}
          >
            <FiLock /> Locked ({locked.length})
          </button>
        </div>

        {/* Search & Filter */}
        <div className="search-filter">
          <div className="search-box">
            <FiSearch className="search-icon" />
            <input
              type="text"
              placeholder="Search universities..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <button className="clear-search" onClick={() => setSearchQuery('')}>
                <FiX />
              </button>
            )}
          </div>
          {activeTab === 'shortlisted' && (
            <div className="filter-dropdown">
              <FiFilter />
              <select 
                value={filterCategory} 
                onChange={(e) => setFilterCategory(e.target.value)}
              >
                <option value="all">All Categories</option>
                <option value="dream">Dream</option>
                <option value="target">Target</option>
                <option value="safe">Safe</option>
              </select>
            </div>
          )}
        </div>
      </div>

      {/* Universities List */}
      {activeList.length === 0 ? (
        <div className="empty-state">
          {activeTab === 'shortlisted' ? (
            <>
              <FiHeart className="empty-icon" />
              <h3>No Shortlisted Universities</h3>
              <p>Start exploring and add universities to your shortlist!</p>
              <Link to="/live-universities" className="btn-primary">
                <FiSearch /> Explore Universities
              </Link>
            </>
          ) : (
            <>
              <FiLock className="empty-icon" />
              <h3>No Locked Universities</h3>
              <p>Lock universities you're committed to applying to</p>
            </>
          )}
        </div>
      ) : (
        <div className="universities-list">
          {activeList.map((uni) => (
            <div key={uni.universityId} className="university-card">
              {/* Category Badge */}
              {activeTab === 'shortlisted' && uni.category && (
                <div 
                  className="card-category-badge"
                  style={{ backgroundColor: getCategoryColor(uni.category) }}
                >
                  {uni.category.toUpperCase()}
                </div>
              )}
              {activeTab === 'locked' && (
                <div className="card-category-badge locked-category">
                  <FiLock /> LOCKED
                </div>
              )}

              {/* Card Header */}
              <div className="card-header">
                <h3>{uni.universityName}</h3>
                <div className="card-header-actions">
                  {uni.website && (
                    <a 
                      href={uni.website} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="website-link"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <FiExternalLink />
                    </a>
                  )}
                </div>
              </div>

              {/* Meta Info */}
              <div className="card-meta">
                <span className="location">
                  <FiMapPin /> {uni.city ? `${uni.city}, ` : ''}{uni.country}
                </span>
                {uni.ranking && (
                  <span className="ranking">
                    <FiAward /> Rank #{uni.ranking}
                  </span>
                )}
              </div>

              {/* Cost Section */}
              {(uni.tuitionFee || uni.livingCostPerYear) ? (
                <div className="card-cost-section">
                  <div className="cost-main">
                    <span className="cost-label">
                      <FiDollarSign /> Total Cost/Year
                    </span>
                    <span className="cost-value">${calculateTotalCost(uni).toLocaleString()}</span>
                  </div>
                </div>
              ) : null}

              {/* Status Badges */}
              <div className="card-status-row">
                <div className="status-item">
                  <span className="status-label"><FiAlertTriangle /> Risk Level</span>
                  <span 
                    className="status-badge"
                    style={{ backgroundColor: getRiskLevel(uni).color }}
                  >
                    {getRiskLevel(uni).label}
                  </span>
                </div>
                <div className="status-item">
                  <span className="status-label"><FiTrendingUp /> Acceptance</span>
                  <span 
                    className="status-badge"
                    style={{ backgroundColor: getAcceptanceLikelihood(uni).color }}
                  >
                    {getAcceptanceLikelihood(uni).label}
                  </span>
                </div>
              </div>

              {/* Scholarship Info */}
              <div className={`scholarship-indicator ${uni.scholarshipsAvailable ? 'available' : 'unavailable'}`}>
                <FiCheckCircle />
                <span>{uni.scholarshipsAvailable ? 'Scholarships Available' : 'No Scholarships'}</span>
              </div>

              {/* Actions */}
              <div className="card-actions">
                {activeTab === 'shortlisted' && (
                  <>
                    {!isLocked(uni.universityId) ? (
                      <button 
                        className="action-btn lock-btn"
                        onClick={() => handleLock(uni)}
                        title="Lock university"
                      >
                        <FiLock /> Lock
                      </button>
                    ) : (
                      <button 
                        className="action-btn locked"
                        title="Already locked"
                        disabled
                      >
                        <FiCheckCircle /> Locked
                      </button>
                    )}
                    <button 
                      className="action-btn remove-btn"
                      onClick={() => handleRemoveFromShortlist(uni.universityId, uni.universityName)}
                      title="Remove from shortlist"
                    >
                      <FiTrash2 />
                    </button>
                  </>
                )}
                {activeTab === 'locked' && (
                  <button 
                    className="action-btn unlock-btn"
                    onClick={() => handleUnlock(uni.universityId, uni.universityName)}
                    title="Unlock university"
                  >
                    <FiUnlock /> Unlock
                  </button>
                )}
              </div>

              {/* Added Date */}
              <div className="added-date">
                Added {new Date(uni.shortlistedAt || uni.lockedAt).toLocaleDateString()}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Guide Section */}
      {locked.length > 0 && (
        <div className="guide-section">
          <div className="guide-content">
            <FiAlertCircle className="guide-icon" />
            <div>
              <h4>Ready to Apply?</h4>
              <p>You have {locked.length} locked {locked.length === 1 ? 'university' : 'universities'}. Go to Application Guide to start your application journey!</p>
            </div>
          </div>
          <Link to="/application" className="guide-link">
            Application Guide <FiArrowRight />
          </Link>
        </div>
      )}
    </div>
  );
};

export default Shortlisted;
