import React, { useState } from 'react';
import { 
  FiMapPin,
  FiExternalLink,
  FiDollarSign,
  FiAward,
  FiLoader,
  FiChevronDown,
  FiAlertTriangle,
  FiCheckCircle,
  FiTrendingUp,
  FiHeart,
  FiLock,
  FiUnlock
} from 'react-icons/fi';
import './UniversityCard.css';

const FIXED_PROGRAMS = [
  { name: 'Bachelor of Science (BS) in Computer Science', degree: 'bachelors', field: 'Computer Science' },
  { name: 'Bachelor of Science (BS) in Data Science', degree: 'bachelors', field: 'Data Science' },
  { name: 'Bachelor of Science (BS) in Electrical Engineering', degree: 'bachelors', field: 'Engineering' },
  { name: 'Bachelor of Science (BS) in Business Administration', degree: 'bachelors', field: 'Business' },
  { name: 'Master of Science (MS) in Computer Science', degree: 'masters', field: 'Computer Science' },
  { name: 'Master of Science (MS) in Data Science', degree: 'masters', field: 'Data Science' },
  { name: 'Doctor of Philosophy (PhD)', degree: 'phd', field: 'Computer Science' }
];

const getUniversityProgram = (uni) => {
  const hash = uni.id ? uni.id.toString().split('').reduce((a, b) => a + b.charCodeAt(0), 0) : 0;
  return FIXED_PROGRAMS[hash % FIXED_PROGRAMS.length];
};

const calculateTotalCost = (uni) => {
  return (uni.tuitionFee || 0) + (uni.livingCostPerYear || 0);
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

const UniversityCard = ({ 
  university, 
  isShortlisted = false,
  isLocked = false,
  onToggleShortlist,
  onToggleLock,
  showCategory = false,
  category = null,
  fitReasons = [],
  fitRisks = [],
  compact = false
}) => {
  const [expanded, setExpanded] = useState(false);
  const [detailsLoading, setDetailsLoading] = useState(false);

  const handleCardClick = () => {
    if (!compact) {
      setExpanded(!expanded);
    }
  };

  const handleShortlist = (e) => {
    e.stopPropagation();
    if (onToggleShortlist) {
      onToggleShortlist(university);
    }
  };

  const handleLock = (e) => {
    e.stopPropagation();
    if (onToggleLock) {
      onToggleLock(university);
    }
  };

  const totalCost = calculateTotalCost(university);
  const riskLevel = getRiskLevel(university);
  const acceptanceLikelihood = getAcceptanceLikelihood(university);
  const program = getUniversityProgram(university);

  const getCategoryStyle = () => {
    switch(category) {
      case 'dream':
        return { borderColor: '#8b5cf6', badgeColor: '#8b5cf6', label: '🌟 Dream' };
      case 'target':
        return { borderColor: '#3b82f6', badgeColor: '#3b82f6', label: '🎯 Target' };
      case 'safe':
        return { borderColor: '#10b981', badgeColor: '#10b981', label: '✅ Safe' };
      default:
        return null;
    }
  };

  const categoryStyle = getCategoryStyle();

  return (
    <div 
      className={`uni-card ${expanded ? 'expanded' : ''} ${compact ? 'compact' : ''}`}
      onClick={handleCardClick}
      style={categoryStyle ? { borderLeft: `4px solid ${categoryStyle.borderColor}` } : {}}
    >
      {/* Category Badge */}
      {showCategory && categoryStyle && (
        <div className="category-badge" style={{ backgroundColor: categoryStyle.badgeColor }}>
          {categoryStyle.label}
        </div>
      )}

      <div className="uni-card-header">
        <h3>{university.name}</h3>
        <div className="uni-card-actions">
          <button
            className={`uni-action-btn shortlist-btn ${isShortlisted ? 'active' : ''}`}
            onClick={handleShortlist}
            title={isShortlisted ? 'Remove from shortlist' : 'Add to shortlist'}
          >
            <FiHeart />
          </button>
          <button
            className={`uni-action-btn lock-btn ${isLocked ? 'active' : ''}`}
            onClick={handleLock}
            title={isLocked ? 'Unlock university' : 'Lock university'}
          >
            {isLocked ? <FiLock /> : <FiUnlock />}
          </button>
          {university.website && (
            <a 
              href={university.website} 
              target="_blank" 
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="uni-website-link"
            >
              <FiExternalLink />
            </a>
          )}
        </div>
      </div>

      <div className="uni-card-meta">
        <span className="location">
          <FiMapPin /> {university.city}, {university.country}
        </span>
        {university.ranking && (
          <span className="ranking">
            <FiAward /> Rank #{university.ranking}
          </span>
        )}
      </div>

      {/* Cost Section */}
      <div className="uni-card-cost-section">
        <div className="cost-main">
          <span className="cost-label"><FiDollarSign /> Total Cost/Year</span>
          <span className="cost-value">${totalCost.toLocaleString()}</span>
        </div>
      </div>

      {/* Status Badges */}
      <div className="uni-card-status-row">
        <div className="status-item">
          <span className="status-label"><FiAlertTriangle /> Risk Level</span>
          <span 
            className="status-badge"
            style={{ backgroundColor: riskLevel.color }}
          >
            {riskLevel.label}
          </span>
        </div>
        <div className="status-item">
          <span className="status-label"><FiTrendingUp /> Acceptance</span>
          <span 
            className="status-badge"
            style={{ backgroundColor: acceptanceLikelihood.color }}
          >
            {acceptanceLikelihood.label}
          </span>
        </div>
      </div>

      {/* Fit Reasons/Risks for AI recommendations */}
      {(fitReasons.length > 0 || fitRisks.length > 0) && (
        <div className="uni-card-fit-info">
          {fitReasons.length > 0 && (
            <div className="fit-reasons">
              {fitReasons.map((reason, i) => (
                <span key={i} className="fit-tag reason">✓ {reason}</span>
              ))}
            </div>
          )}
          {fitRisks.length > 0 && (
            <div className="fit-risks">
              {fitRisks.map((risk, i) => (
                <span key={i} className="fit-tag risk">⚠ {risk}</span>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Scholarships & Tap for More */}
      <div className="uni-card-footer-row">
        <div className={`scholarship-indicator ${university.scholarshipsAvailable ? 'available' : 'unavailable'}`}>
          <FiCheckCircle />
          <span>{university.scholarshipsAvailable ? 'Scholarships Available' : 'No Scholarships'}</span>
        </div>
        {!compact && !expanded && (
          <button className="tap-more-btn" onClick={handleCardClick}>
            <FiChevronDown /> Tap for more
          </button>
        )}
      </div>

      {expanded && !compact && (
        <div className="uni-card-details">
          {detailsLoading ? (
            <div className="details-loading">
              <FiLoader className="spin" /> Loading details...
            </div>
          ) : (
            <>
              <div className="detail-section">
                <h4>Program</h4>
                <div className="programs-list">
                  <span className="program-tag">{program.name}</span>
                </div>
              </div>

              <div className="detail-section">
                <h4>Costs</h4>
                <div className="costs-grid">
                  <div>
                    <label>Tuition</label>
                    <span>${university.tuitionFee?.toLocaleString()}/yr</span>
                  </div>
                  <div>
                    <label>Living</label>
                    <span>${university.livingCostPerYear?.toLocaleString()}/yr</span>
                  </div>
                  <div>
                    <label>App Fee</label>
                    <span>${university.applicationFee}</span>
                  </div>
                </div>
              </div>

              <div className="detail-actions">
                {!isShortlisted ? (
                  <button
                    className="detail-action-btn shortlist"
                    onClick={handleShortlist}
                  >
                    <FiHeart /> Shortlist University
                  </button>
                ) : (
                  <button
                    className={`detail-action-btn lock ${isLocked ? 'locked' : ''}`}
                    onClick={handleLock}
                  >
                    {isLocked ? <><FiLock /> Locked</> : <><FiUnlock /> Lock University</>}
                  </button>
                )}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default UniversityCard;
