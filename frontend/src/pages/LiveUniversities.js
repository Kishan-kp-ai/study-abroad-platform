import React, { useState, useCallback, useRef, useEffect, useMemo, createContext, useContext } from 'react';
import liveUniversityApi from '../services/liveUniversityApi';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-hot-toast';
import { 
  FiSearch, 
  FiGlobe,
  FiMapPin,
  FiExternalLink,
  FiDollarSign,
  FiUsers,
  FiPercent,
  FiAward,
  FiLoader,
  FiAlertCircle,
  FiRefreshCw,
  FiWifi,
  FiFilter,
  FiX,
  FiChevronDown,
  FiChevronUp,
  FiAlertTriangle,
  FiCheckCircle,
  FiTrendingUp,
  FiHeart,
  FiLock,
  FiUnlock,
  FiInfo,
  FiUser
} from 'react-icons/fi';
import './LiveUniversities.css';

// Currency metadata
const CURRENCY_INFO = {
  USD: { symbol: '$', name: 'US Dollar', locale: 'en-US' },
  INR: { symbol: '₹', name: 'Indian Rupee', locale: 'en-IN' },
  EUR: { symbol: '€', name: 'Euro', locale: 'de-DE' },
  GBP: { symbol: '£', name: 'British Pound', locale: 'en-GB' },
  CAD: { symbol: 'C$', name: 'Canadian Dollar', locale: 'en-CA' },
  AUD: { symbol: 'A$', name: 'Australian Dollar', locale: 'en-AU' }
};

// Fallback rates
const FALLBACK_RATES = {
  USD: 1,
  INR: 83.50,
  EUR: 0.92,
  GBP: 0.79,
  CAD: 1.37,
  AUD: 1.54
};

// Context for exchange rates
const ExchangeRateContext = createContext(null);

// Currency Switcher Component
const CurrencySwitcher = ({ usdAmount }) => {
  const context = useContext(ExchangeRateContext);
  const { rates, loading, error, lastUpdated } = context || { rates: FALLBACK_RATES, loading: false, error: null, lastUpdated: null };
  const [isOpen, setIsOpen] = useState(false);
  const [selectedCurrency, setSelectedCurrency] = useState(null);
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0 });
  const dropdownRef = useRef(null);
  const buttonRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleToggle = (e) => {
    e.stopPropagation();
    e.preventDefault();
    if (!isOpen && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      const dropdownWidth = 240;
      let left = rect.left;
      
      // Ensure dropdown doesn't overflow right edge of viewport
      if (left + dropdownWidth > window.innerWidth - 10) {
        left = window.innerWidth - dropdownWidth - 10;
      }
      
      setDropdownPosition({
        top: rect.bottom + 8,
        left: Math.max(10, left)
      });
    }
    setIsOpen(!isOpen);
  };

  const convertFromUSD = (amount, currency) => {
    if (!rates || currency === 'USD') return amount;
    const rate = rates[currency];
    if (!rate) return amount;
    return amount * rate;
  };

  const formatCurrency = (amount, currency) => {
    const info = CURRENCY_INFO[currency];
    const convertedAmount = convertFromUSD(amount, currency);
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
    <div className="currency-switcher" ref={dropdownRef} onClick={(e) => e.stopPropagation()} onMouseDown={(e) => e.stopPropagation()}>
      <span className="usd-price">
        ${usdAmount?.toLocaleString('en-US')}
      </span>
      
      <button 
        ref={buttonRef}
        className="currency-toggle-btn"
        onClick={handleToggle}
        title="Convert to other currencies"
        disabled={loading}
      >
        {loading ? <span className="loading-spinner" /> : <FiRefreshCw />}
      </button>

      {selectedCurrency && rates && (
        <span className="converted-price" title="Currency values are approximate">
          → {formatCurrency(usdAmount, selectedCurrency)}
          <button className="clear-conversion" onClick={clearConversion} title="Clear">
            <FiX />
          </button>
        </span>
      )}

      {isOpen && (
        <>
          <div 
            className="currency-overlay"
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'rgba(0, 0, 0, 0.5)',
              zIndex: 9998
            }}
            onClick={() => setIsOpen(false)}
          />
          <div 
            className="currency-dropdown"
            style={{ 
              position: 'fixed', 
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              zIndex: 9999 
            }}
          >
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
        </>
      )}
    </div>
  );
};

const COUNTRIES = [
  'Australia',
  'Canada',
  'France',
  'Germany',
  'Ireland',
  'Netherlands',
  'Singapore',
  'Switzerland',
  'United Kingdom',
  'United States'
];

const DEGREE_LEVELS = [
  { value: 'bachelors', label: "Bachelor's" },
  { value: 'masters', label: "Master's" },
  { value: 'mba', label: 'MBA' },
  { value: 'phd', label: 'PhD' }
];

const FIELDS_OF_STUDY = [
  'Computer Science',
  'Data Science',
  'Artificial Intelligence',
  'Engineering',
  'Business'
];

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

const LiveUniversities = () => {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCountry, setSelectedCountry] = useState('');
  const [universities, setUniversities] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [fetchInfo, setFetchInfo] = useState(null);
  const [selectedUniversity, setSelectedUniversity] = useState(null);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [profileMatchEnabled, setProfileMatchEnabled] = useState(false);
  
  const [filters, setFilters] = useState({
    degreeLevel: '',
    fieldOfStudy: '',
    budgetMin: '',
    budgetMax: '',
    acceptanceChance: '',
    scholarshipAvailable: '',
    testRequirement: ''
  });

  const [shortlistedIds, setShortlistedIds] = useState([]);
  const [lockedIds, setLockedIds] = useState([]);

  const [exchangeRates, setExchangeRates] = useState({
    rates: FALLBACK_RATES,
    loading: false,
    error: null,
    lastUpdated: 'Using fallback rates'
  });
  
  const searchTimeoutRef = useRef(null);
  const abortControllerRef = useRef(null);

  useEffect(() => {
    fetchExchangeRates();
  }, []);

  const fetchExchangeRates = async () => {
    try {
      const response = await fetch('https://open.er-api.com/v6/latest/USD');
      const data = await response.json();
      
      if (data.result === 'success') {
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
      setExchangeRates({
        rates: FALLBACK_RATES,
        loading: false,
        error: 'Using offline rates',
        lastUpdated: 'Offline'
      });
    }
  };

  useEffect(() => {
    const loadSelections = async () => {
      try {
        const data = await liveUniversityApi.getMySelections();
        setShortlistedIds(data.shortlisted?.map(u => u.universityId) || []);
        setLockedIds(data.locked?.map(u => u.universityId) || []);
      } catch (error) {
        console.error('Error loading selections:', error);
      }
    };
    loadSelections();
  }, []);

  const toggleShortlist = async (e, uni) => {
    e.stopPropagation();
    const uniId = uni.id;
    const isShortlisted = shortlistedIds.includes(uniId);
    
    try {
      if (isShortlisted) {
        await liveUniversityApi.removeFromShortlist(uniId);
        setShortlistedIds(prev => prev.filter(id => id !== uniId));
        toast.success('Removed from shortlist');
      } else {
        // Send full university details when shortlisting
        await liveUniversityApi.shortlistUniversity(
          uniId, 
          uni.name, 
          uni.country,
          'target',
          uni.city,
          uni.tuitionFee,
          uni.livingCostPerYear,
          uni.ranking,
          uni.acceptanceRate,
          uni.scholarshipsAvailable,
          uni.website,
          uni.internationalStudentRatio
        );
        setShortlistedIds(prev => [...prev, uniId]);
        toast.success('Added to shortlist');
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update shortlist');
    }
  };

  const toggleLock = async (e, uni) => {
    e.stopPropagation();
    const uniId = uni.id;
    const isLocked = lockedIds.includes(uniId);
    
    try {
      if (isLocked) {
        await liveUniversityApi.unlockUniversity(uniId);
        setLockedIds(prev => prev.filter(id => id !== uniId));
        toast.success('University unlocked');
      } else {
        // Send full university details when locking
        await liveUniversityApi.lockUniversity(
          uniId, 
          uni.name, 
          uni.country,
          uni.city,
          uni.tuitionFee,
          uni.livingCostPerYear,
          uni.ranking,
          uni.acceptanceRate,
          uni.scholarshipsAvailable,
          uni.website,
          uni.internationalStudentRatio
        );
        setLockedIds(prev => [...prev, uniId]);
        toast.success('University locked');
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update lock status');
    }
  };

  const clearResults = () => {
    setUniversities([]);
    setFetchInfo(null);
    setError(null);
    setSelectedUniversity(null);
  };

  const clearFilters = () => {
    setFilters({
      degreeLevel: '',
      fieldOfStudy: '',
      budgetMin: '',
      budgetMax: '',
      acceptanceChance: '',
      scholarshipAvailable: '',
      testRequirement: ''
    });
  };

  const activeFilterCount = Object.values(filters).filter(v => v !== '').length + (profileMatchEnabled ? 1 : 0);

  const hasProfileData = user && (
    (user.budgetMax && user.budgetMax > 0) ||
    user.intendedDegree ||
    user.fieldOfStudy
  );

  const filteredUniversities = useMemo(() => {
    return universities.filter((uni) => {
      const assignedProgram = getUniversityProgram(uni);

      // Profile match filter - apply strict filtering
      if (profileMatchEnabled && user) {
        let checksApplied = 0;

        // Budget filter
        if (user.budgetMax && user.budgetMax > 0) {
          checksApplied++;
          const totalCost = (uni.tuitionFee || 0) + (uni.livingCostPerYear || 0);
          if (totalCost > user.budgetMax) {
            return false;
          }
        }

        // Degree level filter
        if (user.intendedDegree) {
          checksApplied++;
          const degreeMap = {
            "Bachelor's": 'bachelors',
            "Master's": 'masters',
            'MBA': 'mba',
            'PhD': 'phd'
          };
          const userDegree = degreeMap[user.intendedDegree] || user.intendedDegree?.toLowerCase();
          if (assignedProgram.degree !== userDegree) return false;
        }

        // Field of study filter
        if (user.fieldOfStudy) {
          checksApplied++;
          const userField = (user.fieldOfStudy || '').toLowerCase();
          const uniField = (assignedProgram.field || '').toLowerCase();
          const fieldMatch = uniField.includes(userField) || 
                            userField.includes(uniField) ||
                            uniField.split(' ').some(word => word.length > 2 && userField.includes(word)) ||
                            userField.split(' ').some(word => word.length > 2 && uniField.includes(word));
          if (!fieldMatch) return false;
        }

        // If no checks were applied, show all
        if (checksApplied === 0) return true;
      }
      
      if (filters.degreeLevel) {
        if (assignedProgram.degree !== filters.degreeLevel) return false;
      }

      if (filters.fieldOfStudy) {
        if (!assignedProgram.field.toLowerCase().includes(filters.fieldOfStudy.toLowerCase())) return false;
      }

      if (filters.budgetMin) {
        const totalCost = (uni.tuitionFee || 0) + (uni.livingCostPerYear || 0);
        if (totalCost < parseInt(filters.budgetMin)) return false;
      }

      if (filters.budgetMax) {
        const totalCost = (uni.tuitionFee || 0) + (uni.livingCostPerYear || 0);
        if (totalCost > parseInt(filters.budgetMax)) return false;
      }

      if (filters.acceptanceChance) {
        const likelihood = getAcceptanceLikelihood(uni);
        if (filters.acceptanceChance === 'high' && likelihood.level !== 'high') return false;
        if (filters.acceptanceChance === 'medium' && likelihood.level !== 'medium') return false;
        if (filters.acceptanceChance === 'low' && likelihood.level !== 'low') return false;
      }

      if (filters.scholarshipAvailable) {
        if (filters.scholarshipAvailable === 'yes' && !uni.scholarshipsAvailable) return false;
        if (filters.scholarshipAvailable === 'no' && uni.scholarshipsAvailable) return false;
      }

      if (filters.testRequirement) {
        const programs = uni.programs || [];
        if (filters.testRequirement === 'gre') {
          const hasGRE = programs.some(p => p.requirements?.greRequired);
          if (!hasGRE) return false;
        }
        if (filters.testRequirement === 'gmat') {
          const hasGMAT = programs.some(p => p.requirements?.gmatRequired);
          if (!hasGMAT) return false;
        }
        if (filters.testRequirement === 'none') {
          const noTests = programs.some(p => !p.requirements?.greRequired && !p.requirements?.gmatRequired);
          if (!noTests) return false;
        }
      }

      return true;
    });
  }, [universities, filters, profileMatchEnabled, user]);

  const handleSearch = useCallback(async (query) => {
    if (query.length < 2) {
      clearResults();
      return;
    }

    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();

    setLoading(true);
    setError(null);
    setSelectedCountry('');

    try {
      const result = await liveUniversityApi.searchUniversities(query);
      setUniversities(result.data || []);
      setFetchInfo({
        source: result.source,
        fetchedAt: result.fetchedAt,
        count: result.count
      });
    } catch (err) {
      if (err.name !== 'AbortError') {
        setError(err.response?.data?.message || 'Failed to search universities');
        setUniversities([]);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  const handleSearchInputChange = (e) => {
    const query = e.target.value;
    setSearchQuery(query);

    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    searchTimeoutRef.current = setTimeout(() => {
      handleSearch(query);
    }, 300);
  };

  const handleCountrySelect = async (country) => {
    if (!country) {
      clearResults();
      setSelectedCountry('');
      return;
    }

    setSelectedCountry(country);
    setSearchQuery('');
    setLoading(true);
    setError(null);

    try {
      const result = await liveUniversityApi.getByCountry(country);
      setUniversities(result.data || []);
      setFetchInfo({
        source: result.source,
        fetchedAt: result.fetchedAt,
        count: result.count
      });
    } catch (err) {
      setError(err.response?.data?.message || `Failed to fetch universities for ${country}`);
      setUniversities([]);
      toast.error('Unable to fetch data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleUniversityClick = async (university) => {
    if (selectedUniversity?.id === university.id) {
      setSelectedUniversity(null);
      return;
    }

    setDetailsLoading(true);
    setSelectedUniversity(university);

    try {
      const result = await liveUniversityApi.getDetails(university.id);
      setSelectedUniversity(result.data);
    } catch (err) {
      toast.error('Failed to load university details');
      setSelectedUniversity(university);
    } finally {
      setDetailsLoading(false);
    }
  };

  const handleRefresh = () => {
    if (selectedCountry) {
      handleCountrySelect(selectedCountry);
    } else if (searchQuery.length >= 2) {
      handleSearch(searchQuery);
    }
  };

  useEffect(() => {
    return () => {
      if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
      if (abortControllerRef.current) abortControllerRef.current.abort();
    };
  }, []);

  return (
    <ExchangeRateContext.Provider value={exchangeRates}>
    <div className="live-universities-page">
      <div className="page-header">
        <div className="header-content">
          <h1><FiGlobe /> Live University Search</h1>
        </div>
        <div className="live-indicator">
          <FiWifi className="pulse" />
          <span>Live Data</span>
        </div>
      </div>

      <div className="search-section">
        <div className="search-box">
          <FiSearch className="search-icon" />
          <input
            type="text"
            placeholder="Search universities by name..."
            value={searchQuery}
            onChange={handleSearchInputChange}
            disabled={loading}
          />
          {loading && <FiLoader className="loading-icon spin" />}
        </div>

        <div className="country-filter">
          <select
            value={selectedCountry}
            onChange={(e) => handleCountrySelect(e.target.value)}
            disabled={loading}
          >
            <option value="">Select a country...</option>
            {COUNTRIES.map(country => (
              <option key={country} value={country}>{country}</option>
            ))}
          </select>
        </div>

        {fetchInfo && (
          <button className="refresh-btn" onClick={handleRefresh} disabled={loading}>
            <FiRefreshCw className={loading ? 'spin' : ''} />
            Refresh
          </button>
        )}

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

        {/* Profile Match Toggle - Always Visible */}
        <button 
          className={`profile-match-btn ${profileMatchEnabled ? 'active' : ''}`}
          onClick={() => setProfileMatchEnabled(!profileMatchEnabled)}
        >
          <FiUser />
          {profileMatchEnabled ? 'Profile Match ON' : 'Profile Match'}
        </button>
      </div>

      {/* Profile Match Info Bar */}
      {profileMatchEnabled && (
        <div className={`profile-match-bar ${!hasProfileData ? 'warning' : ''}`}>
          <FiUser />
          <span>
            {hasProfileData ? (
              <>Filtering by: {[
                user?.budgetMax && `Budget ≤$${user.budgetMax.toLocaleString()}`,
                user?.intendedDegree && `Degree (${user.intendedDegree})`,
                user?.fieldOfStudy && `Field (${user.fieldOfStudy})`
              ].filter(Boolean).join(' • ')}</>
            ) : (
              <>⚠️ No profile data found. Please complete your profile in Settings to use this filter.</>
            )}
          </span>
          <button onClick={() => setProfileMatchEnabled(false)}><FiX /></button>
        </div>
      )}

      {showFilters && (
        <div className="filters-panel">
          <div className="filters-header">
            <h3><FiFilter /> Filters</h3>
            {activeFilterCount > 0 && (
              <button className="clear-filters-btn" onClick={() => { clearFilters(); setProfileMatchEnabled(false); }}>
                <FiX /> Clear All
              </button>
            )}
          </div>
          
          <div className="filters-grid">
            <div className="filter-group">
              <label>Degree Level</label>
              <select
                value={filters.degreeLevel}
                onChange={(e) => setFilters({ ...filters, degreeLevel: e.target.value })}
              >
                <option value="">All Levels</option>
                {DEGREE_LEVELS.map(d => (
                  <option key={d.value} value={d.value}>{d.label}</option>
                ))}
              </select>
            </div>

            <div className="filter-group">
              <label>Field of Study</label>
              <select
                value={filters.fieldOfStudy}
                onChange={(e) => setFilters({ ...filters, fieldOfStudy: e.target.value })}
              >
                <option value="">All Fields</option>
                {FIELDS_OF_STUDY.map(f => (
                  <option key={f} value={f}>{f}</option>
                ))}
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
                <option value="high">High (&gt;50%)</option>
                <option value="medium">Medium (20-50%)</option>
                <option value="low">Low (&lt;20%)</option>
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

          </div>
        </div>
      )}

      {fetchInfo && (
        <div className="fetch-info">
          <span className="source-badge">
            <FiWifi /> {fetchInfo.source.toUpperCase()}
          </span>
          <span className="count">
            {activeFilterCount > 0 
              ? `${filteredUniversities.length} of ${universities.length} universities` 
              : `${fetchInfo.count} universities found`}
          </span>
          <span className="timestamp">Fetched: {new Date(fetchInfo.fetchedAt).toLocaleTimeString()}</span>
        </div>
      )}

      {error && (
        <div className="error-banner">
          <FiAlertCircle />
          <span>{error}</span>
          <button onClick={handleRefresh}>Retry</button>
        </div>
      )}

      {!loading && universities.length === 0 && !error && (
        <div className="empty-state">
          <FiGlobe className="empty-icon" />
          <h3>Search or Select a Country</h3>
          <p>Enter a university name or select a country to fetch live data</p>
        </div>
      )}

      {!loading && universities.length > 0 && filteredUniversities.length === 0 && (
        <div className="empty-state">
          <FiFilter className="empty-icon" />
          <h3>No Results Match Filters</h3>
          <p>Try adjusting your filter criteria</p>
          <button className="clear-filters-btn" onClick={clearFilters}>
            <FiX /> Clear Filters
          </button>
        </div>
      )}

      <div className="universities-grid">
        {filteredUniversities.map((uni) => {
          const isExpanded = selectedUniversity?.id === uni.id;
          return (
          <div 
            key={uni.id} 
            className={`university-card ${isExpanded ? 'expanded' : ''}`}
            onClick={() => handleUniversityClick(uni)}
          >
            <div className="card-header">
              <h3>{uni.name}</h3>
              <div className="card-actions">
                <button
                  className={`action-btn shortlist-btn ${shortlistedIds.includes(uni.id) ? 'active' : ''}`}
                  onClick={(e) => toggleShortlist(e, uni)}
                  title={shortlistedIds.includes(uni.id) ? 'Remove from shortlist' : 'Add to shortlist'}
                >
                  <FiHeart />
                </button>
                <button
                  className={`action-btn lock-btn ${lockedIds.includes(uni.id) ? 'active' : ''}`}
                  onClick={(e) => toggleLock(e, uni)}
                  title={lockedIds.includes(uni.id) ? 'Unlock university' : 'Lock university'}
                >
                  {lockedIds.includes(uni.id) ? <FiLock /> : <FiUnlock />}
                </button>
                {uni.website && (
                  <a 
                    href={uni.website} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="website-link"
                  >
                    <FiExternalLink />
                  </a>
                )}
              </div>
            </div>

            <div className="card-meta">
              <span className="location">
                <FiMapPin /> {uni.city}, {uni.country}
              </span>
              {uni.ranking && (
                <span className="ranking">
                  <FiAward /> Rank #{uni.ranking}
                </span>
              )}
            </div>

            {/* Program Section - always visible */}
            <div className="card-program-section">
              <h4>Program</h4>
              <div className="programs-list">
                <span className="program-tag">
                  {getUniversityProgram(uni).name}
                </span>
              </div>
            </div>

            {/* Cost Section - always visible */}
            <div className="card-cost-section">
              <div className="cost-main">
                <span className="cost-label"><FiDollarSign /> Total Cost/Year</span>
                <CurrencySwitcher usdAmount={calculateTotalCost(uni)} />
              </div>
            </div>

            {/* Expandable Content Wrapper */}
            <div className={`card-expandable ${isExpanded ? 'expanded' : ''}`}>
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

              {/* Card Details */}
              <div className="card-details">
                {detailsLoading ? (
                  <div className="details-loading">
                    <FiLoader className="spin" /> Loading details...
                  </div>
                ) : (
                  <>
                    <div className="detail-section">
                      <h4>Costs Breakdown</h4>
                      <div className="costs-grid">
                        <div>
                          <label>Tuition</label>
                          <span>${uni.tuitionFee?.toLocaleString()}/yr</span>
                        </div>
                        <div>
                          <label>Living</label>
                          <span>${uni.livingCostPerYear?.toLocaleString()}/yr</span>
                        </div>
                        <div>
                          <label>App Fee</label>
                          <span>${uni.applicationFee}</span>
                        </div>
                      </div>
                    </div>

                    <div className="detail-actions">
                      {!shortlistedIds.includes(uni.id) ? (
                        <button
                          className="detail-action-btn shortlist"
                          onClick={(e) => toggleShortlist(e, uni)}
                        >
                          <FiHeart /> Shortlist University
                        </button>
                      ) : (
                        <button
                          className={`detail-action-btn lock ${lockedIds.includes(uni.id) ? 'locked' : ''}`}
                          onClick={(e) => toggleLock(e, uni)}
                        >
                          {lockedIds.includes(uni.id) ? <><FiLock /> Locked</> : <><FiUnlock /> Lock University</>}
                        </button>
                      )}
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Scholarships & Tap for More / Collapse */}
            <div className="card-footer-row">
              <div className={`scholarship-indicator ${uni.scholarshipsAvailable ? 'available' : 'unavailable'}`}>
                <FiCheckCircle />
                <span>{uni.scholarshipsAvailable ? 'Scholarships Available' : 'No Scholarships'}</span>
              </div>
              {!isExpanded ? (
                <button className="tap-more-btn" onClick={() => handleUniversityClick(uni)}>
                  <FiChevronDown /> Tap for more
                </button>
              ) : (
                <button className="collapse-btn" onClick={(e) => { e.stopPropagation(); setSelectedUniversity(null); }}>
                  <FiChevronUp /> Collapse
                </button>
              )}
            </div>
          </div>
        );
        })}
      </div>
    </div>
    </ExchangeRateContext.Provider>
  );
};

export default LiveUniversities;
