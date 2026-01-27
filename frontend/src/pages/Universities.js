import React, { useState, useEffect, useRef, createContext, useContext } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { toast } from 'react-hot-toast';
import { 
  FiSearch, 
  FiFilter, 
  FiStar, 
  FiTarget, 
  FiShield,
  FiPlus,
  FiCheck,
  FiLock,
  FiUnlock,
  FiDollarSign,
  FiMapPin,
  FiAward,
  FiX,
  FiChevronDown,
  FiChevronUp,
  FiRefreshCw,
  FiInfo
} from 'react-icons/fi';
import './Universities.css';

// Currency metadata (symbols only - rates fetched from API)
const CURRENCY_INFO = {
  USD: { symbol: '$', name: 'US Dollar', locale: 'en-US' },
  INR: { symbol: '₹', name: 'Indian Rupee', locale: 'en-IN' },
  EUR: { symbol: '€', name: 'Euro', locale: 'de-DE' },
  GBP: { symbol: '£', name: 'British Pound', locale: 'en-GB' },
  CAD: { symbol: 'C$', name: 'Canadian Dollar', locale: 'en-CA' },
  AUD: { symbol: 'A$', name: 'Australian Dollar', locale: 'en-AU' }
};

// Context to share exchange rates across all currency switchers
const ExchangeRateContext = createContext(null);

// Currency Switcher Component
const CurrencySwitcher = ({ usdAmount }) => {
  const { rates, loading, error, lastUpdated } = useContext(ExchangeRateContext);
  const [isOpen, setIsOpen] = useState(false);
  const [selectedCurrency, setSelectedCurrency] = useState(null);
  const dropdownRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Convert USD to target currency
  const convertFromUSD = (amount, currency) => {
    if (!rates || currency === 'USD') return amount;
    const rate = rates[currency];
    if (!rate) return amount;
    return amount * rate;
  };

  // Format currency with proper locale
  const formatCurrency = (amount, currency) => {
    const info = CURRENCY_INFO[currency];
    const convertedAmount = convertFromUSD(amount, currency);
    
    // Use Intl.NumberFormat for proper locale-based formatting
    const formatter = new Intl.NumberFormat(info.locale, {
      style: 'decimal',
      maximumFractionDigits: 0,
      minimumFractionDigits: 0
    });
    
    return info.symbol + formatter.format(convertedAmount);
  };

  const handleCurrencySelect = (currency) => {
    if (currency === 'USD') {
      setSelectedCurrency(null);
    } else {
      setSelectedCurrency(currency);
    }
    setIsOpen(false);
  };

  const clearConversion = () => {
    setSelectedCurrency(null);
  };

  return (
    <div className="currency-switcher" ref={dropdownRef}>
      <span className="usd-price">
        <FiDollarSign /> ${usdAmount?.toLocaleString('en-US')}/yr
      </span>
      
      <button 
        className="currency-toggle-btn"
        onClick={() => setIsOpen(!isOpen)}
        title="Convert to other currencies"
        disabled={loading || error}
      >
        {loading ? <span className="loading-spinner" /> : <FiRefreshCw />}
      </button>

      {selectedCurrency && rates && (
        <span className="converted-price" title="Currency values are approximate and for planning purposes.">
          → {formatCurrency(usdAmount, selectedCurrency)}
          <button className="clear-conversion" onClick={clearConversion} title="Clear">
            <FiX />
          </button>
        </span>
      )}

      {isOpen && (
        <div className="currency-dropdown">
          <div className="dropdown-header">
            Convert to
            {lastUpdated && (
              <span className="rate-updated" title={`Rates updated: ${lastUpdated}`}>
                <FiInfo />
              </span>
            )}
          </div>
          
          {error ? (
            <div className="dropdown-error">
              Unable to fetch rates. Using offline mode.
            </div>
          ) : (
            Object.keys(CURRENCY_INFO).map(currency => (
              <button
                key={currency}
                className={`currency-option ${selectedCurrency === currency ? 'active' : ''}`}
                onClick={() => handleCurrencySelect(currency)}
              >
                <span className="currency-symbol">{CURRENCY_INFO[currency].symbol}</span>
                <span className="currency-name">{currency}</span>
                {currency !== 'USD' && rates && (
                  <span className="currency-preview">
                    {formatCurrency(usdAmount, currency)}
                  </span>
                )}
              </button>
            ))
          )}
          
          <div className="dropdown-disclaimer">
            <FiInfo /> Values are approximate
          </div>
        </div>
      )}
    </div>
  );
};

// Fallback rates in case API fails
const FALLBACK_RATES = {
  USD: 1,
  INR: 83.50,
  EUR: 0.92,
  GBP: 0.79,
  CAD: 1.37,
  AUD: 1.54
};

const Universities = () => {
  const { user, refreshProfile } = useAuth();
  const [universities, setUniversities] = useState([]);
  const [recommendations, setRecommendations] = useState(null);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState('recommended');
  const [showFilters, setShowFilters] = useState(false);
  
  // Exchange rate state
  const [exchangeRates, setExchangeRates] = useState({
    rates: null,
    loading: true,
    error: null,
    lastUpdated: null
  });
  
  // Filter states
  const [filters, setFilters] = useState({
    search: '',
    country: '',
    degreeLevel: '',
    fieldOfStudy: '',
    budgetMin: '',
    budgetMax: '',
    acceptanceChance: '',
    scholarshipAvailable: '',
    testRequirement: ''
  });

  // Fetch exchange rates once on mount
  useEffect(() => {
    fetchExchangeRates();
  }, []);

  const fetchExchangeRates = async () => {
    try {
      // Using open.er-api.com - free, no API key required, USD as base
      const response = await fetch('https://open.er-api.com/v6/latest/USD');
      const data = await response.json();
      
      if (data.result === 'success') {
        // Extract only the currencies we need
        const rates = {
          USD: 1,
          INR: data.rates.INR,
          EUR: data.rates.EUR,
          GBP: data.rates.GBP,
          CAD: data.rates.CAD,
          AUD: data.rates.AUD
        };
        
        setExchangeRates({
          rates,
          loading: false,
          error: null,
          lastUpdated: new Date().toLocaleString()
        });
      } else {
        throw new Error('API returned error');
      }
    } catch (error) {
      console.error('Failed to fetch exchange rates:', error);
      // Use fallback rates
      setExchangeRates({
        rates: FALLBACK_RATES,
        loading: false,
        error: 'Using offline rates',
        lastUpdated: 'Offline'
      });
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      await api.post('/universities/seed');
      
      const [allRes, recRes] = await Promise.all([
        api.get('/universities'),
        api.get('/universities/recommended/for-me')
      ]);
      
      setUniversities(allRes.data);
      setRecommendations(recRes.data);
    } catch (error) {
      console.error('Error loading universities:', error);
      toast.error('Failed to load universities');
    } finally {
      setLoading(false);
    }
  };

  const isShortlisted = (uniId) => {
    return user?.shortlistedUniversities?.some(s => s.universityId?._id === uniId || s.universityId === uniId);
  };

  const isLocked = (uniId) => {
    return user?.lockedUniversities?.some(l => l.universityId?._id === uniId || l.universityId === uniId);
  };

  const handleShortlist = async (universityId, category) => {
    try {
      if (isShortlisted(universityId)) {
        await api.delete(`/user/shortlist/${universityId}`);
        toast.success('Removed from shortlist');
      } else {
        await api.post(`/user/shortlist/${universityId}`, { category });
        toast.success('Added to shortlist');
      }
      await refreshProfile();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Action failed');
    }
  };

  const handleLock = async (universityId) => {
    try {
      if (isLocked(universityId)) {
        const confirmed = window.confirm(
          'Are you sure you want to unlock this university? Your application tasks for this university will be removed.'
        );
        if (confirmed) {
          await api.delete(`/tasks/university/${universityId}`);
          await api.delete(`/user/lock/${universityId}`);
          toast.success('University unlocked and tasks removed');
        }
      } else {
        await api.post(`/user/lock/${universityId}`);
        await api.post(`/tasks/generate/${universityId}`);
        toast.success('University locked! Application tasks created.');
      }
      await refreshProfile();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Action failed');
    }
  };

  const getCategoryIcon = (category) => {
    switch (category) {
      case 'dream': return <FiStar className="category-icon dream" />;
      case 'target': return <FiTarget className="category-icon target" />;
      case 'safe': return <FiShield className="category-icon safe" />;
      default: return null;
    }
  };

  const getChanceColor = (chance) => {
    if (chance === 'high') return '#10b981';
    if (chance === 'medium') return '#f59e0b';
    return '#ef4444';
  };

  // Get unique values for filter options
  const countries = [...new Set(universities.map(u => u.country))].sort();
  const fields = [...new Set(universities.flatMap(u => u.programs?.map(p => p.field) || []))].filter(Boolean).sort();

  // Filter universities
  const filterUniversity = (uni, item = null) => {
    if (filters.search && !uni.name.toLowerCase().includes(filters.search.toLowerCase())) {
      return false;
    }
    if (filters.country && uni.country !== filters.country) {
      return false;
    }
    if (filters.degreeLevel) {
      const hasMatchingDegree = uni.programs?.some(p => p.degree === filters.degreeLevel);
      if (!hasMatchingDegree) return false;
    }
    if (filters.fieldOfStudy) {
      const hasMatchingField = uni.programs?.some(p => 
        p.field?.toLowerCase().includes(filters.fieldOfStudy.toLowerCase())
      );
      if (!hasMatchingField) return false;
    }
    if (filters.budgetMin || filters.budgetMax) {
      const avgTuition = uni.programs?.reduce((sum, p) => sum + (p.tuitionPerYear || 0), 0) / (uni.programs?.length || 1);
      const totalCost = avgTuition + (uni.livingCostPerYear || 0);
      if (filters.budgetMin && totalCost < parseInt(filters.budgetMin)) return false;
      if (filters.budgetMax && totalCost > parseInt(filters.budgetMax)) return false;
    }
    if (filters.acceptanceChance && item?.acceptanceChance) {
      if (item.acceptanceChance !== filters.acceptanceChance) return false;
    }
    if (filters.scholarshipAvailable) {
      if (filters.scholarshipAvailable === 'yes' && !uni.scholarshipsAvailable) return false;
      if (filters.scholarshipAvailable === 'no' && uni.scholarshipsAvailable) return false;
    }
    if (filters.testRequirement) {
      const hasTestReq = uni.programs?.some(p => {
        if (filters.testRequirement === 'gre') return p.requirements?.greRequired;
        if (filters.testRequirement === 'gmat') return p.requirements?.gmatRequired;
        if (filters.testRequirement === 'none') return !p.requirements?.greRequired && !p.requirements?.gmatRequired;
        return true;
      });
      if (!hasTestReq) return false;
    }
    return true;
  };

  const filteredUniversities = universities.filter(uni => filterUniversity(uni));

  const filterRecommendations = (items) => {
    return items?.filter(item => filterUniversity(item.university, item)) || [];
  };

  const clearFilters = () => {
    setFilters({
      search: '',
      country: '',
      degreeLevel: '',
      fieldOfStudy: '',
      budgetMin: '',
      budgetMax: '',
      acceptanceChance: '',
      scholarshipAvailable: '',
      testRequirement: ''
    });
  };

  const activeFilterCount = Object.values(filters).filter(v => v !== '').length;

  const renderUniversityCard = (item, showCategory = true) => {
    const uni = item.university || item;
    const category = item.category;
    const tuitionPerYear = uni.programs?.[0]?.tuitionPerYear || 0;
    
    return (
      <div key={uni._id} className="university-card">
        <div className="uni-header">
          {showCategory && category && getCategoryIcon(category)}
          <h3>{uni.name}</h3>
          {isLocked(uni._id) && <span className="locked-badge"><FiLock /> Locked</span>}
        </div>
        
        <div className="uni-info">
          <span className="info-item">
            <FiMapPin /> {uni.city}, {uni.country}
          </span>
          <span className="info-item">
            <FiAward /> Rank #{uni.ranking}
          </span>
        </div>

        {/* Price with Currency Switcher */}
        <div className="uni-price-row">
          <CurrencySwitcher 
            usdAmount={tuitionPerYear} 
            universityId={uni._id} 
          />
        </div>

        {/* Program Tags - Show available degree levels */}
        <div className="program-tags">
          {(() => {
            const degrees = [...new Set(uni.programs?.map(p => p.degree) || [])];
            const degreeLabels = {
              'bachelors': "Bachelor's",
              'masters': "Master's",
              'mba': 'MBA',
              'phd': 'PhD'
            };
            return degrees.slice(0, 4).map((degree, i) => (
              <span key={i} className={`program-tag ${degree}`}>
                {degreeLabels[degree] || degree}
              </span>
            ));
          })()}
          {uni.programs?.length > 0 && (
            <span className="program-count">
              {uni.programs.length} programs
            </span>
          )}
        </div>

        {item.reasons && (
          <div className="uni-reasons">
            <strong>Why it fits:</strong>
            <ul>
              {item.reasons.map((r, i) => <li key={i}>{r}</li>)}
            </ul>
          </div>
        )}

        {item.risks?.length > 0 && (
          <div className="uni-risks">
            <strong>Risks:</strong>
            <ul>
              {item.risks.map((r, i) => <li key={i}>{r}</li>)}
            </ul>
          </div>
        )}

        <div className="uni-stats">
          <div className="stat">
            <span className="stat-label">Acceptance</span>
            <span className="stat-value">{uni.acceptanceRate}%</span>
          </div>
          {item.acceptanceChance && (
            <div className="stat">
              <span className="stat-label">Your Chance</span>
              <span 
                className="stat-value chance"
                style={{ color: getChanceColor(item.acceptanceChance) }}
              >
                {item.acceptanceChance}
              </span>
            </div>
          )}
          <div className="stat">
            <span className="stat-label">Scholarship</span>
            <span className="stat-value">{uni.scholarshipsAvailable ? '✓ Yes' : '✗ No'}</span>
          </div>
          {item.estimatedCost && (
            <div className="stat">
              <span className="stat-label">Est. Cost/yr</span>
              <span className="stat-value">${item.estimatedCost?.toLocaleString()}</span>
            </div>
          )}
        </div>

        {/* Test Requirements */}
        <div className="test-requirements">
          {uni.programs?.[0]?.requirements?.greRequired && (
            <span className="test-tag gre">GRE Required</span>
          )}
          {uni.programs?.[0]?.requirements?.gmatRequired && (
            <span className="test-tag gmat">GMAT Required</span>
          )}
          {!uni.programs?.[0]?.requirements?.greRequired && !uni.programs?.[0]?.requirements?.gmatRequired && (
            <span className="test-tag none">No GRE/GMAT</span>
          )}
        </div>

        <div className="uni-actions">
          <button 
            className={`btn-action ${isShortlisted(uni._id) ? 'active' : ''}`}
            onClick={() => handleShortlist(uni._id, category || 'target')}
          >
            {isShortlisted(uni._id) ? <><FiCheck /> Shortlisted</> : <><FiPlus /> Shortlist</>}
          </button>
          
          {isShortlisted(uni._id) && (
            <button 
              className={`btn-action btn-lock ${isLocked(uni._id) ? 'locked' : ''}`}
              onClick={() => handleLock(uni._id)}
            >
              {isLocked(uni._id) ? <><FiUnlock /> Unlock</> : <><FiLock /> Lock</>}
            </button>
          )}
        </div>
      </div>
    );
  };

  if (loading) {
    return <div className="loading">Loading universities...</div>;
  }

  return (
    <ExchangeRateContext.Provider value={exchangeRates}>
    <div className="universities-page">
      <div className="page-header">
        <div>
          <h1>University Discovery</h1>
          <p>Find and shortlist universities that match your profile</p>
        </div>
        
        <div className="header-actions">
          <button 
            className={`filter-toggle-btn ${showFilters ? 'active' : ''}`}
            onClick={() => setShowFilters(!showFilters)}
          >
            <FiFilter />
            Filters
            {activeFilterCount > 0 && (
              <span className="filter-count">{activeFilterCount}</span>
            )}
            {showFilters ? <FiChevronUp /> : <FiChevronDown />}
          </button>
          
          <div className="view-toggle">
            <button 
              className={view === 'recommended' ? 'active' : ''}
              onClick={() => setView('recommended')}
            >
              Recommended
            </button>
            <button 
              className={view === 'all' ? 'active' : ''}
              onClick={() => setView('all')}
            >
              All Universities
            </button>
          </div>
        </div>
      </div>

      {/* Filters Panel */}
      {showFilters && (
        <div className="filters-panel">
          <div className="filters-header">
            <h3><FiFilter /> Filters</h3>
            {activeFilterCount > 0 && (
              <button className="clear-filters-btn" onClick={clearFilters}>
                <FiX /> Clear All
              </button>
            )}
          </div>
          
          <div className="filters-grid">
            <div className="filter-group">
              <label>Search</label>
              <div className="search-input">
                <FiSearch />
                <input
                  type="text"
                  placeholder="University name..."
                  value={filters.search}
                  onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                />
              </div>
            </div>

            <div className="filter-group">
              <label>Country</label>
              <select
                value={filters.country}
                onChange={(e) => setFilters({ ...filters, country: e.target.value })}
              >
                <option value="">All Countries</option>
                {countries.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>

            <div className="filter-group">
              <label>Degree Level</label>
              <select
                value={filters.degreeLevel}
                onChange={(e) => setFilters({ ...filters, degreeLevel: e.target.value })}
              >
                <option value="">All Levels</option>
                <option value="bachelors">Bachelor's</option>
                <option value="masters">Master's</option>
                <option value="mba">MBA</option>
                <option value="phd">PhD</option>
              </select>
            </div>

            <div className="filter-group">
              <label>Field of Study</label>
              <select
                value={filters.fieldOfStudy}
                onChange={(e) => setFilters({ ...filters, fieldOfStudy: e.target.value })}
              >
                <option value="">All Fields</option>
                {fields.map(f => <option key={f} value={f}>{f}</option>)}
              </select>
            </div>

            <div className="filter-group budget-group">
              <label>Budget Range (USD/year)</label>
              <div className="budget-inputs">
                <input
                  type="number"
                  placeholder="Min"
                  value={filters.budgetMin}
                  onChange={(e) => setFilters({ ...filters, budgetMin: e.target.value })}
                />
                <span>to</span>
                <input
                  type="number"
                  placeholder="Max"
                  value={filters.budgetMax}
                  onChange={(e) => setFilters({ ...filters, budgetMax: e.target.value })}
                />
              </div>
            </div>

            <div className="filter-group">
              <label>Acceptance Chance</label>
              <select
                value={filters.acceptanceChance}
                onChange={(e) => setFilters({ ...filters, acceptanceChance: e.target.value })}
              >
                <option value="">Any Chance</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
            </div>

            <div className="filter-group">
              <label>Scholarship Available</label>
              <select
                value={filters.scholarshipAvailable}
                onChange={(e) => setFilters({ ...filters, scholarshipAvailable: e.target.value })}
              >
                <option value="">Any</option>
                <option value="yes">Yes</option>
                <option value="no">No</option>
              </select>
            </div>

            <div className="filter-group">
              <label>Test Requirement</label>
              <select
                value={filters.testRequirement}
                onChange={(e) => setFilters({ ...filters, testRequirement: e.target.value })}
              >
                <option value="">Any</option>
                <option value="gre">GRE Required</option>
                <option value="gmat">GMAT Required</option>
                <option value="none">No GRE/GMAT</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Results Count */}
      <div className="results-info">
        {view === 'all' ? (
          <span>Showing {filteredUniversities.length} of {universities.length} universities</span>
        ) : (
          <span>
            Showing {
              filterRecommendations(recommendations?.dream).length +
              filterRecommendations(recommendations?.target).length +
              filterRecommendations(recommendations?.safe).length
            } recommended universities
          </span>
        )}
      </div>

      {view === 'recommended' ? (
        <div className="recommendations">
          <section className="category-section">
            <div className="category-header dream">
              <FiStar />
              <h2>Dream Universities</h2>
              <span className="category-count">{filterRecommendations(recommendations?.dream).length}</span>
            </div>
            <p className="category-desc">Ambitious choices that require strong credentials</p>
            <div className="universities-grid">
              {filterRecommendations(recommendations?.dream).length > 0 ? (
                filterRecommendations(recommendations?.dream).map(item => renderUniversityCard(item))
              ) : (
                <p className="empty-msg">No dream universities match your filters</p>
              )}
            </div>
          </section>

          <section className="category-section">
            <div className="category-header target">
              <FiTarget />
              <h2>Target Universities</h2>
              <span className="category-count">{filterRecommendations(recommendations?.target).length}</span>
            </div>
            <p className="category-desc">Realistic options with good chances of acceptance</p>
            <div className="universities-grid">
              {filterRecommendations(recommendations?.target).length > 0 ? (
                filterRecommendations(recommendations?.target).map(item => renderUniversityCard(item))
              ) : (
                <p className="empty-msg">No target universities match your filters</p>
              )}
            </div>
          </section>

          <section className="category-section">
            <div className="category-header safe">
              <FiShield />
              <h2>Safe Universities</h2>
              <span className="category-count">{filterRecommendations(recommendations?.safe).length}</span>
            </div>
            <p className="category-desc">High chance of acceptance based on your profile</p>
            <div className="universities-grid">
              {filterRecommendations(recommendations?.safe).length > 0 ? (
                filterRecommendations(recommendations?.safe).map(item => renderUniversityCard(item))
              ) : (
                <p className="empty-msg">No safe universities match your filters</p>
              )}
            </div>
          </section>
        </div>
      ) : (
        <div className="universities-grid">
          {filteredUniversities.length > 0 ? (
            filteredUniversities.map(uni => renderUniversityCard(uni, false))
          ) : (
            <p className="empty-msg">No universities match your filters</p>
          )}
        </div>
      )}
    </div>
    </ExchangeRateContext.Provider>
  );
};

export default Universities;
