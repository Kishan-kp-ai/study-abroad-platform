import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import liveUniversityApi from '../services/liveUniversityApi';
import { toast } from 'react-hot-toast';
import { 
  FiSend, 
  FiUser, 
  FiCpu, 
  FiRefreshCw,
  FiZap,
  FiTarget,
  FiBookOpen,
  FiTrendingUp,
  FiCheckCircle,
  FiHeart,
  FiArrowRight,
  FiMessageCircle,
  FiGlobe,
  FiStar,
  FiAlertCircle,
  FiLock
} from 'react-icons/fi';
import UniversityCard from '../components/UniversityCard';
import './AICounsellor.css';

const REQUIRED_PROFILE_COMPLETION = 85;

const AICounsellor = () => {
  const { user, refreshProfile } = useAuth();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [suggestedPrompts, setSuggestedPrompts] = useState([]);
  const [profileCompletion, setProfileCompletion] = useState(null);
  const [shortlistedIds, setShortlistedIds] = useState([]);
  const [lockedIds, setLockedIds] = useState([]);
  const [shortlistVisible, setShortlistVisible] = useState(false);
  const messagesEndRef = useRef(null);

  const shortlistedCount = (user?.shortlistedUniversities?.length || 0) + (user?.liveShortlistedUniversities?.length || 0);
  const lockedCount = (user?.lockedUniversities?.length || 0) + (user?.liveLockedUniversities?.length || 0);

  // Load user's shortlisted/locked universities
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

  useEffect(() => {
    fetchProfileCompletion();
  }, []);

  useEffect(() => {
    if (profileCompletion !== null && profileCompletion >= REQUIRED_PROFILE_COMPLETION) {
      loadChatHistory();
    } else if (profileCompletion !== null) {
      setInitialLoading(false);
    }
  }, [profileCompletion]);

  const fetchProfileCompletion = async () => {
    try {
      const response = await api.get('/user/profile-strength');
      setProfileCompletion(response.data.profileCompletion);
    } catch (error) {
      console.error('Error fetching profile completion:', error);
      setProfileCompletion(0);
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    updateSuggestedPrompts();
  }, [messages, user]);

  const loadChatHistory = async () => {
    try {
      const response = await api.get('/ai/history');
      if (response.data.length > 0) {
        setMessages(response.data);
      } else {
        const greeting = getPersonalizedGreeting();
        setMessages([{
          role: 'assistant',
          content: greeting
        }]);
      }
    } catch (error) {
      console.error('Error loading chat history:', error);
    } finally {
      setInitialLoading(false);
    }
  };

  const getPersonalizedGreeting = () => {
    const firstName = user?.fullName?.split(' ')[0] || 'there';
    const hour = new Date().getHours();
    const timeGreeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
    
    let statusMessage = '';
    if (shortlistedCount === 0) {
      statusMessage = `I see you haven't shortlisted any universities yet. Let's find some great options for your **${user?.intendedDegree || 'degree'}** in **${user?.fieldOfStudy || 'your field'}**!`;
    } else if (lockedCount === 0) {
      statusMessage = `You have **${shortlistedCount} universities** shortlisted. Ready to lock some in and start your application journey?`;
    } else {
      statusMessage = `Great progress! You have **${lockedCount} universities locked** and ready for applications.`;
    }

    return `${timeGreeting}, ${firstName}! 👋

${statusMessage}

I'm your AI Study Abroad Counsellor, and I'm here to make your journey easier. Here's how I can help:

• **🎯 Profile Analysis** - Understand your strengths and what to improve
• **🎓 Smart Recommendations** - Find Dream, Target, and Safe universities  
• **📋 Action Planning** - Get a personalized to-do list
• **💬 Any Questions** - Just ask naturally, I understand!

What would you like to explore today?`;
  };

  const updateSuggestedPrompts = () => {
    const lastMessage = messages[messages.length - 1];
    if (!lastMessage || lastMessage.role !== 'assistant') return;

    const content = lastMessage.content.toLowerCase();
    let prompts = [];
    
    // Check if shortlist is currently visible in any message
    const isShortlistDisplayed = messages.some(msg => 
      msg.universityRecommendations?._isShortlist
    ) || shortlistVisible;

    // Check if this is the initial greeting message
    const isGreeting = content.includes('study abroad counsellor') || content.includes('what would you like to explore');
    
    if (isGreeting) {
      // Initial greeting - show main options based on user state
      if (shortlistedCount === 0) {
        prompts = [
          { text: 'Recommend universities', icon: FiGlobe },
          { text: 'Analyze my profile', icon: FiUser },
          { text: 'What are my chances?', icon: FiTrendingUp }
        ];
      } else {
        prompts = [
          { text: 'Recommend universities', icon: FiGlobe },
          { text: 'Profile Analysis', icon: FiUser },
          { text: 'What should I do next?', icon: FiArrowRight }
        ];
        if (!isShortlistDisplayed) {
          prompts.push({ text: 'Show my shortlist', icon: FiHeart });
        }
      }
    } else if (content.includes('shortlist') || content.includes('added')) {
      prompts = [
        { text: 'Recommend more universities', icon: FiGlobe },
        { text: 'What should I do next?', icon: FiArrowRight }
      ];
      // Only add "Show my shortlist" if not already displayed
      if (!isShortlistDisplayed) {
        prompts.unshift({ text: 'Show my shortlist', icon: FiHeart });
      }
    } else if (content.includes('locked') || content.includes('committed')) {
      prompts = [
        { text: 'Recommend universities', icon: FiGlobe },
        { text: 'What should I do next?', icon: FiArrowRight }
      ];
      if (!isShortlistDisplayed) {
        prompts.push({ text: 'Show my shortlist', icon: FiHeart });
      }
    } else if (content.includes('profile') || content.includes('analysis')) {
      prompts = [
        { text: 'How can I improve my profile?', icon: FiTrendingUp },
        { text: 'Recommend universities for me', icon: FiGlobe },
        { text: 'Create a study plan', icon: FiCheckCircle }
      ];
    } else if (content.includes('recommend') || content.includes('universities')) {
      prompts = [
        { text: 'Tell me more about the top one', icon: FiStar },
        { text: 'Shortlist a university', icon: FiHeart },
        { text: 'Compare two universities', icon: FiTarget }
      ];
    } else if (shortlistedCount === 0) {
      prompts = [
        { text: 'Recommend universities', icon: FiGlobe },
        { text: 'Analyze my profile', icon: FiUser },
        { text: 'What are my chances?', icon: FiTrendingUp }
      ];
    } else if (lockedCount === 0) {
      prompts = [
        { text: 'Recommend universities', icon: FiGlobe },
        { text: 'What should I do next?', icon: FiArrowRight }
      ];
      if (!isShortlistDisplayed) {
        prompts.push({ text: 'Show my shortlist', icon: FiHeart });
      }
    } else {
      prompts = [
        { text: 'Recommend universities', icon: FiGlobe },
        { text: 'What should I do next?', icon: FiArrowRight },
        { text: 'Help with my SOP', icon: FiBookOpen }
      ];
    }

    setSuggestedPrompts(prompts);
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const sendMessage = async (messageText) => {
    const userMessage = (messageText || input).trim();
    if (!userMessage || loading) return;

    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setLoading(true);
    setSuggestedPrompts([]);

    try {
      const response = await api.post('/ai/chat', { message: userMessage });
      
      // Check if response includes university recommendations
      const messageData = { 
        role: 'assistant', 
        content: response.data.response,
        actions: response.data.actions 
      };
      
      // Add university recommendations if present
      if (response.data.universityRecommendations) {
        messageData.universityRecommendations = response.data.universityRecommendations;
        
        // Track if shortlist is now visible
        if (response.data.universityRecommendations._isShortlist) {
          setShortlistVisible(true);
        }
      }
      
      setMessages(prev => [...prev, messageData]);

      if (response.data.actions?.length > 0) {
        await refreshProfile();
        toast.success(`Done! ${response.data.actions.length} action(s) completed`, {
          icon: '✨'
        });
      }
    } catch (error) {
      console.error('Chat error:', error);
      toast.error('Failed to get response. Please try again.');
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: "I'm having a little trouble right now. Could you try asking again? 🙏" 
      }]);
    } finally {
      setLoading(false);
    }
  };

  // Handle shortlist/lock toggle for university cards
  const handleToggleShortlist = async (university) => {
    const uniId = university.id;
    const isShortlisted = shortlistedIds.includes(uniId);
    
    try {
      if (isShortlisted) {
        await liveUniversityApi.removeFromShortlist(uniId);
        setShortlistedIds(prev => prev.filter(id => id !== uniId));
        toast.success('Removed from shortlist');
      } else {
        await liveUniversityApi.shortlistUniversity(uniId, university.name, university.country);
        setShortlistedIds(prev => [...prev, uniId]);
        toast.success('Added to shortlist');
      }
      await refreshProfile();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update shortlist');
    }
  };

  const handleToggleLock = async (university) => {
    const uniId = university.id;
    const isLocked = lockedIds.includes(uniId);
    
    try {
      if (isLocked) {
        await liveUniversityApi.unlockUniversity(uniId);
        setLockedIds(prev => prev.filter(id => id !== uniId));
        toast.success('University unlocked');
      } else {
        await liveUniversityApi.lockUniversity(uniId, university.name, university.country);
        setLockedIds(prev => [...prev, uniId]);
        toast.success('University locked');
      }
      await refreshProfile();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update lock status');
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    sendMessage();
  };

  const handleSuggestionClick = (prompt) => {
    if (prompt.link) {
      return;
    }
    sendMessage(prompt.text);
  };

  const clearHistory = async () => {
    try {
      await api.delete('/ai/history');
      const greeting = getPersonalizedGreeting();
      setMessages([{ role: 'assistant', content: greeting }]);
      setShortlistVisible(false); // Reset shortlist visibility
      toast.success('Conversation cleared');
    } catch (error) {
      toast.error('Failed to clear history');
    }
  };



  if (initialLoading) {
    return (
      <div className="counsellor-loading">
        <FiRefreshCw className="spin" />
        <p>Starting your AI Counsellor...</p>
      </div>
    );
  }

  if (profileCompletion !== null && profileCompletion < REQUIRED_PROFILE_COMPLETION) {
    return (
      <div className="counsellor-page">
        <div className="counsellor-locked">
          <div className="locked-icon">
            <FiLock />
          </div>
          <h2>AI Counsellor is Locked</h2>
          <p className="locked-message">
            Complete at least <strong>{REQUIRED_PROFILE_COMPLETION}%</strong> of your profile to unlock 
            personalized AI guidance for your study abroad journey.
          </p>
          <div className="profile-progress-container">
            <div className="profile-progress-bar">
              <div 
                className="profile-progress-fill"
                style={{ width: `${profileCompletion}%` }}
              />
            </div>
            <span className="progress-text">
              {profileCompletion}% / {REQUIRED_PROFILE_COMPLETION}% complete
            </span>
          </div>
          <div className="locked-tips">
            <h4>What you need to complete:</h4>
            <ul>
              <li><FiUser /> Basic Information (Name, Email)</li>
              <li><FiBookOpen /> Academic Background (Degree, GPA, Major)</li>
              <li><FiTarget /> Study Goals (Intended Degree, Field, Countries)</li>
              <li><FiTrendingUp /> Budget & Funding Information</li>
              <li><FiCheckCircle /> Exam Status (IELTS, TOEFL, GRE, GMAT)</li>
            </ul>
          </div>
          <Link to="/profile" className="complete-profile-btn">
            <FiArrowRight /> Complete Your Profile
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="counsellor-page">
      <div className="counsellor-header">
        <div className="header-info">
          <h1><FiMessageCircle /> AI Counsellor</h1>
          <p>Your personal study abroad guide</p>
        </div>
        <div className="header-actions">
          <div className="user-stats">
            <span className="stat">
              <FiHeart /> {shortlistedCount} shortlisted
            </span>
            <span className="stat">
              <FiTarget /> {lockedCount} locked
            </span>
          </div>
          <button className="clear-btn" onClick={clearHistory} title="Clear conversation">
            <FiRefreshCw /> New Chat
          </button>
        </div>
      </div>



      <div className="chat-container">
        <div className="messages-container">
          {messages.map((message, index) => (
            <div 
              key={index} 
              className={`message ${message.role}`}
            >
              <div className="message-avatar">
                {message.role === 'user' ? <FiUser /> : <FiCpu />}
              </div>
              <div className="message-content">
                <div 
                  className="message-text"
                  dangerouslySetInnerHTML={{ 
                    __html: formatMessage(message.content) 
                  }}
                />
                
                {/* University Recommendations/Shortlist Cards */}
                {message.universityRecommendations && !message.universityRecommendations.error && !message.universityRecommendations.isEmpty && (
                  <div className="university-recommendations">
                    {/* Summary for shortlist display */}
                    {message.universityRecommendations._isShortlist && message.universityRecommendations.summary && (
                      <div className="shortlist-summary">
                        <span className="summary-item">📋 Total: {message.universityRecommendations.summary.total}</span>
                        <span className="summary-item dream">🌟 Dream: {message.universityRecommendations.summary.dream}</span>
                        <span className="summary-item target">🎯 Target: {message.universityRecommendations.summary.target}</span>
                        <span className="summary-item safe">✅ Safe: {message.universityRecommendations.summary.safe}</span>
                        <span className="summary-item locked">🔒 Locked: {message.universityRecommendations.summary.locked}</span>
                      </div>
                    )}
                    
                    {/* Dream Universities */}
                    {message.universityRecommendations.dream?.length > 0 && (
                      <div className="recommendation-section">
                        <h4 className="section-title dream">🌟 Dream Universities</h4>
                        <p className="section-subtitle">
                          {message.universityRecommendations._isShortlist 
                            ? 'Your reach schools' 
                            : 'Reach schools – competitive but worth trying'}
                        </p>
                        <div className="recommendation-cards">
                          {message.universityRecommendations.dream.map((uni, i) => (
                            <UniversityCard
                              key={uni.id || i}
                              university={uni}
                              isShortlisted={shortlistedIds.includes(uni.id)}
                              isLocked={lockedIds.includes(uni.id)}
                              onToggleShortlist={handleToggleShortlist}
                              onToggleLock={handleToggleLock}
                              showCategory={true}
                              category="dream"
                              fitReasons={uni.reasons || []}
                              fitRisks={uni.risks || []}
                            />
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {/* Target Universities */}
                    {message.universityRecommendations.target?.length > 0 && (
                      <div className="recommendation-section">
                        <h4 className="section-title target">🎯 Target Universities</h4>
                        <p className="section-subtitle">
                          {message.universityRecommendations._isShortlist 
                            ? 'Good match for your profile' 
                            : 'Great match – realistic with your profile'}
                        </p>
                        <div className="recommendation-cards">
                          {message.universityRecommendations.target.map((uni, i) => (
                            <UniversityCard
                              key={uni.id || i}
                              university={uni}
                              isShortlisted={shortlistedIds.includes(uni.id)}
                              isLocked={lockedIds.includes(uni.id)}
                              onToggleShortlist={handleToggleShortlist}
                              onToggleLock={handleToggleLock}
                              showCategory={true}
                              category="target"
                              fitReasons={uni.reasons || []}
                              fitRisks={uni.risks || []}
                            />
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {/* Safe Universities */}
                    {message.universityRecommendations.safe?.length > 0 && (
                      <div className="recommendation-section">
                        <h4 className="section-title safe">✅ Safe Universities</h4>
                        <p className="section-subtitle">
                          {message.universityRecommendations._isShortlist 
                            ? 'Your backup options' 
                            : 'High confidence – likely admits'}
                        </p>
                        <div className="recommendation-cards">
                          {message.universityRecommendations.safe.map((uni, i) => (
                            <UniversityCard
                              key={uni.id || i}
                              university={uni}
                              isShortlisted={shortlistedIds.includes(uni.id)}
                              isLocked={lockedIds.includes(uni.id)}
                              onToggleShortlist={handleToggleShortlist}
                              onToggleLock={handleToggleLock}
                              showCategory={true}
                              category="safe"
                              fitReasons={uni.reasons || []}
                              fitRisks={uni.risks || []}
                            />
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {/* Advice */}
                    {message.universityRecommendations.advice && (
                      <div className="recommendation-advice">
                        💡 {message.universityRecommendations.advice}
                      </div>
                    )}
                  </div>
                )}
                
                {message.actions?.length > 0 && (
                  <div className="message-actions">
                    {message.actions.map((action, i) => (
                      <span key={i} className={`action-badge ${action.type}`}>
                        {action.type === 'shortlist' && (
                          <><FiHeart /> Shortlisted {action.universityName}</>
                        )}
                        {action.type === 'lock' && (
                          <><FiTarget /> Locked {action.universityName}</>
                        )}
                        {action.type === 'create_task' && (
                          <><FiCheckCircle /> Created: {action.title}</>
                        )}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
          
          {loading && (
            <div className="message assistant">
              <div className="message-avatar">
                <FiCpu />
              </div>
              <div className="message-content">
                <div className="typing-indicator">
                  <span></span>
                  <span></span>
                  <span></span>
                </div>
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>

        {/* Contextual Suggestions */}
        {suggestedPrompts.length > 0 && !loading && (
          <div className="contextual-suggestions">
            <span className="suggestions-label">
              <FiZap /> Suggested:
            </span>
            {suggestedPrompts.map((prompt, index) => (
              prompt.link ? (
                <Link 
                  key={index} 
                  to={prompt.link}
                  className="suggestion-chip link"
                >
                  <prompt.icon /> {prompt.text}
                </Link>
              ) : (
                <button
                  key={index}
                  className="suggestion-chip"
                  onClick={() => handleSuggestionClick(prompt)}
                >
                  <prompt.icon /> {prompt.text}
                </button>
              )
            ))}
          </div>
        )}

        {/* Input */}
        <form className="chat-input-form" onSubmit={handleSubmit}>
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask me anything about your study abroad journey..."
            disabled={loading}
          />
          <button type="submit" disabled={loading || !input.trim()}>
            <FiSend />
          </button>
        </form>
      </div>

      {/* Floating Tips */}
      {messages.length <= 2 && (
        <div className="tips-panel">
          <div className="tip">
            <FiAlertCircle className="tip-icon" />
            <p><strong>Pro tip:</strong> Say "Shortlist Stanford as a dream" to add universities directly!</p>
          </div>
        </div>
      )}
    </div>
  );
};

function formatMessage(text) {
  if (!text) return '';
  
  return text
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/\n/g, '<br>')
    .replace(/• /g, '&bull; ')
    .replace(/✅/g, '<span class="emoji">✅</span>')
    .replace(/🔒/g, '<span class="emoji">🔒</span>')
    .replace(/🎯/g, '<span class="emoji">🎯</span>')
    .replace(/📋/g, '<span class="emoji">📋</span>')
    .replace(/📅/g, '<span class="emoji">📅</span>')
    .replace(/📍/g, '<span class="emoji">📍</span>')
    .replace(/👉/g, '<span class="emoji">👉</span>')
    .replace(/👋/g, '<span class="emoji">👋</span>')
    .replace(/💡/g, '<span class="emoji">💡</span>')
    .replace(/🎓/g, '<span class="emoji">🎓</span>');
}

export default AICounsellor;
