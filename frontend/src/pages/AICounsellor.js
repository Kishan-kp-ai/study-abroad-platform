import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { toast } from 'react-hot-toast';
import { FiSend, FiUser, FiCpu, FiRefreshCw } from 'react-icons/fi';
import './AICounsellor.css';

const AICounsellor = () => {
  const { refreshProfile } = useAuth();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    loadChatHistory();
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const loadChatHistory = async () => {
    try {
      const response = await api.get('/ai/history');
      if (response.data.length > 0) {
        setMessages(response.data);
      } else {
        // Initial greeting
        setMessages([{
          role: 'assistant',
          content: `Hello! I'm your AI Study Abroad Counsellor. I have access to your profile and I'm here to help you with:

• **Profile Analysis** - Understanding your strengths and gaps
• **University Recommendations** - Finding Dream, Target, and Safe universities
• **Application Guidance** - Creating actionable to-do lists
• **Decision Making** - Helping you shortlist and lock universities

What would you like to discuss today? You can ask me things like:
- "Analyze my profile and tell me my chances"
- "Recommend universities for me"
- "What should I do next?"
- "Help me shortlist universities"`
        }]);
      }
    } catch (error) {
      console.error('Error loading chat history:', error);
    } finally {
      setInitialLoading(false);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userMessage = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setLoading(true);

    try {
      const response = await api.post('/ai/chat', { message: userMessage });
      
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: response.data.response,
        actions: response.data.actions 
      }]);

      // Refresh profile if there were actions
      if (response.data.actions?.length > 0) {
        await refreshProfile();
        toast.success(`AI performed ${response.data.actions.length} action(s)`);
      }
    } catch (error) {
      console.error('Chat error:', error);
      toast.error('Failed to get response. Please try again.');
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: 'Sorry, I encountered an error. Please try again.' 
      }]);
    } finally {
      setLoading(false);
    }
  };

  const quickPrompts = [
    "Analyze my profile",
    "Recommend universities",
    "What should I do next?",
    "Create a study plan",
    "What are my chances at top universities?"
  ];

  const handleQuickPrompt = (prompt) => {
    setInput(prompt);
  };

  if (initialLoading) {
    return (
      <div className="counsellor-loading">
        <FiRefreshCw className="spin" />
        <p>Loading AI Counsellor...</p>
      </div>
    );
  }

  return (
    <div className="counsellor-page">
      <div className="counsellor-header">
        <div className="header-info">
          <h1>AI Counsellor</h1>
          <p>Your personal study abroad guide</p>
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
                {message.actions?.length > 0 && (
                  <div className="message-actions">
                    {message.actions.map((action, i) => (
                      <span key={i} className="action-badge">
                        {action.type === 'shortlist' && `✓ Shortlisted ${action.universityName}`}
                        {action.type === 'lock' && `🔒 Locked ${action.universityName}`}
                        {action.type === 'create_task' && `📝 Created task: ${action.title}`}
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

        {/* Quick Prompts */}
        {messages.length <= 1 && (
          <div className="quick-prompts">
            {quickPrompts.map((prompt, index) => (
              <button 
                key={index}
                className="quick-prompt-btn"
                onClick={() => handleQuickPrompt(prompt)}
              >
                {prompt}
              </button>
            ))}
          </div>
        )}

        {/* Input */}
        <form className="chat-input-form" onSubmit={sendMessage}>
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
    </div>
  );
};

// Helper to format message with markdown-like syntax
function formatMessage(text) {
  if (!text) return '';
  
  return text
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/\n/g, '<br>')
    .replace(/• /g, '&bull; ');
}

export default AICounsellor;
