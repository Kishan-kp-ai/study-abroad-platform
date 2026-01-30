import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { toast } from 'react-hot-toast';
import { 
  FiMic, 
  FiMicOff, 
  FiVolume2, 
  FiVolumeX,
  FiMessageCircle,
  FiCheck,
  FiLoader
} from 'react-icons/fi';
import './Onboarding.css';

const Onboarding = () => {
  const { user, updateUser } = useAuth();
  const navigate = useNavigate();
  
  // Conversation state
  const [messages, setMessages] = useState([]);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [onboardingComplete, setOnboardingComplete] = useState(false);
  const [extractedData, setExtractedData] = useState({});
  const [voicesLoaded, setVoicesLoaded] = useState(false);
  const [conversationReady, setConversationReady] = useState(false);
  
  // Refs
  const recognitionRef = useRef(null);
  const synthRef = useRef(window.speechSynthesis);
  const messagesEndRef = useRef(null);
  const conversationStarted = useRef(false);
  
  // Collected data accumulator
  const collectedDataRef = useRef({});
  
  // Progress tracking - 5 main categories
  const calculateProgress = () => {
    const data = extractedData;
    let completed = 0;
    const totalSteps = 5;
    
    // Step 1: Education Level
    if (data.educationLevel || data.degree) completed++;
    // Step 2: Field of Study / Major
    if (data.fieldOfStudy || data.major || data.intendedDegree) completed++;
    // Step 3: Preferred Countries
    if (data.preferredCountries && data.preferredCountries.length > 0) completed++;
    // Step 4: Budget
    if (data.budgetMin || data.budgetMax) completed++;
    // Step 5: Exams Status
    if (data.ieltsStatus || data.greStatus || data.toeflStatus) completed++;
    
    return Math.round((completed / totalSteps) * 100);
  };
  
  const progress = calculateProgress();
  
  // Ref to hold latest handleUserInput to avoid stale closure
  const handleUserInputRef = useRef(null);
  
  // Check browser support
  const [browserSupport, setBrowserSupport] = useState({
    speechRecognition: false,
    speechSynthesis: false
  });

  // Ensure proper display on mount
  useEffect(() => {
    // Force scroll to top
    window.scrollTo(0, 0);
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
    
    // Prevent body scroll
    document.body.style.overflow = 'hidden';
    document.documentElement.style.overflow = 'hidden';
    
    return () => {
      document.body.style.overflow = '';
      document.documentElement.style.overflow = '';
    };
  }, []);

  // Load voices
  useEffect(() => {
    const loadVoices = () => {
      const voices = synthRef.current.getVoices();
      if (voices.length > 0) {
        setVoicesLoaded(true);
      }
    };

    loadVoices();
    
    // Chrome loads voices asynchronously
    if (speechSynthesis.onvoiceschanged !== undefined) {
      speechSynthesis.onvoiceschanged = loadVoices;
    }
    
    // Fallback: if voices don't load within 2 seconds, proceed anyway
    const timeout = setTimeout(() => {
      if (!voicesLoaded) {
        console.log('Voices not loaded, proceeding anyway');
        setVoicesLoaded(true);
      }
    }, 2000);
    
    return () => clearTimeout(timeout);
  }, []);

  useEffect(() => {
    // Check for browser support
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    setBrowserSupport({
      speechRecognition: !!SpeechRecognition,
      speechSynthesis: 'speechSynthesis' in window
    });

    if (SpeechRecognition) {
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = true;
      recognitionRef.current.lang = 'en-US';

      recognitionRef.current.onresult = (event) => {
        const current = event.resultIndex;
        const transcriptText = event.results[current][0].transcript;
        setTranscript(transcriptText);
        
        if (event.results[current].isFinal) {
          // Use ref to get latest handleUserInput function
          if (handleUserInputRef.current) {
            handleUserInputRef.current(transcriptText);
          }
          setTranscript('');
        }
      };

      recognitionRef.current.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        setIsListening(false);
        if (event.error === 'not-allowed') {
          toast.error('Microphone access denied. Please enable it in browser settings.');
        }
      };

      recognitionRef.current.onend = () => {
        setIsListening(false);
      };
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }
      synthRef.current.cancel();
    };
  }, []);

  // Start conversation after user clicks start button
  useEffect(() => {
    if (voicesLoaded && conversationReady && !conversationStarted.current) {
      conversationStarted.current = true;
      setTimeout(() => {
        startConversation();
      }, 300);
    }
  }, [voicesLoaded, conversationReady]);

  const handleStartConversation = () => {
    // User gesture enables speech synthesis
    setConversationReady(true);
    // Unlock audio context for speech synthesis
    const utterance = new SpeechSynthesisUtterance('');
    utterance.volume = 0;
    window.speechSynthesis.speak(utterance);
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const speak = useCallback((text) => {
    return new Promise((resolve) => {
      if (!browserSupport.speechSynthesis || !voiceEnabled) {
        resolve();
        return;
      }

      // Cancel any ongoing speech
      synthRef.current.cancel();
      
      // Chrome bug fix: resume speech synthesis if it's paused
      if (synthRef.current.paused) {
        synthRef.current.resume();
      }
      
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.95;
      utterance.pitch = 1;
      utterance.volume = 1;
      utterance.lang = 'en-US';
      
      // Get available voices and select a good one
      const voices = synthRef.current.getVoices();
      console.log('Available voices:', voices.length);
      
      // Try to find a good English voice
      const preferredVoice = voices.find(v => 
        v.name.includes('Microsoft David') || v.name.includes('Microsoft Mark')
      ) || voices.find(v => 
        v.lang.startsWith('en') && v.name.toLowerCase().includes('male')
      ) || voices.find(v => 
        v.lang.startsWith('en') && (
          v.name.includes('Google UK English Male') ||
          v.name.includes('Alex') ||
          v.name.includes('Daniel')
        )
      ) || voices.find(v => 
        v.lang.startsWith('en-US')
      ) || voices.find(v => 
        v.lang.startsWith('en')
      ) || voices[0];
      
      if (preferredVoice) {
        utterance.voice = preferredVoice;
        console.log('Using voice:', preferredVoice.name);
      }

      let resolved = false;
      const safeResolve = () => {
        if (!resolved) {
          resolved = true;
          setIsSpeaking(false);
          resolve();
        }
      };

      utterance.onstart = () => {
        console.log('Speech started');
        setIsSpeaking(true);
      };
      
      utterance.onend = () => {
        console.log('Speech ended');
        safeResolve();
      };
      
      utterance.onerror = (event) => {
        console.error('Speech error:', event.error);
        safeResolve();
      };

      // Speak immediately
      try {
        synthRef.current.speak(utterance);
        console.log('Speech queued');
        
        // Chrome workaround: keep synthesis alive for long text
        const keepAlive = setInterval(() => {
          if (!synthRef.current.speaking) {
            clearInterval(keepAlive);
          } else {
            synthRef.current.pause();
            synthRef.current.resume();
          }
        }, 14000);
        
        // Timeout fallback - resolve after max time based on text length
        const maxTime = Math.max(5000, text.length * 80);
        setTimeout(() => {
          clearInterval(keepAlive);
          safeResolve();
        }, maxTime);
        
      } catch (error) {
        console.error('Speech synthesis error:', error);
        safeResolve();
      }
    });
  }, [browserSupport.speechSynthesis, voiceEnabled]);

  const startConversation = async () => {
    const greeting = `Hello ${user?.fullName?.split(' ')[0] || 'there'}! I'm your AI assistant, and I'll help you set up your study abroad profile. This will only take a few minutes. Let's start with a simple question. What is your current education level? Are you in high school, completing a bachelor's degree, or do you already have a master's?`;
    
    addMessage('assistant', greeting);
    await speak(greeting);
  };

  const addMessage = (role, content) => {
    setMessages(prev => [...prev, { role, content, timestamp: new Date() }]);
  };

  const handleUserInput = async (input) => {
    if (!input.trim() || isProcessing) return;
    
    addMessage('user', input);
    setIsProcessing(true);

    try {
      console.log('Sending to backend, collectedData:', collectedDataRef.current);
      
      const response = await api.post('/ai/onboarding-chat', {
        message: input,
        conversationHistory: messages.map(m => ({ role: m.role, content: m.content })),
        collectedData: collectedDataRef.current
      });

      const { reply, extractedData: newData, isComplete, finalData } = response.data;
      
      console.log('Response from backend:', { reply, newData, isComplete, finalData });
      
      // Accumulate extracted data
      if (newData && Object.keys(newData).length > 0) {
        collectedDataRef.current = { ...collectedDataRef.current, ...newData };
        setExtractedData(collectedDataRef.current);
        console.log('Updated collectedData:', collectedDataRef.current);
      }

      addMessage('assistant', reply);
      await speak(reply);

      if (isComplete) {
        setOnboardingComplete(true);
        // Merge all collected data with final data
        const completeData = { ...collectedDataRef.current, ...finalData };
        console.log('Completing onboarding with data:', completeData);
        setTimeout(() => {
          completeOnboarding(completeData);
        }, 2000);
      }
    } catch (error) {
      console.error('Onboarding chat error:', error);
      const errorMsg = "I didn't quite catch that. Could you please say that again?";
      addMessage('assistant', errorMsg);
      await speak(errorMsg);
    } finally {
      setIsProcessing(false);
    }
  };

  // Keep ref updated with latest handleUserInput
  useEffect(() => {
    handleUserInputRef.current = handleUserInput;
  });

  const startListening = () => {
    if (!browserSupport.speechRecognition) {
      toast.error('Speech recognition not supported in this browser. Please use Chrome or Edge.');
      return;
    }

    // Stop any ongoing speech
    if (isSpeaking) {
      synthRef.current.cancel();
      setIsSpeaking(false);
    }

    try {
      recognitionRef.current.start();
      setIsListening(true);
    } catch (error) {
      console.error('Failed to start recognition:', error);
      // Recognition might already be running
      try {
        recognitionRef.current.stop();
        setTimeout(() => {
          recognitionRef.current.start();
          setIsListening(true);
        }, 100);
      } catch (e) {
        console.error('Retry failed:', e);
      }
    }
  };

  const stopListening = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    setIsListening(false);
  };

  const completeOnboarding = async (data) => {
    try {
      console.log('completeOnboarding called with data:', data);
      
      // Ensure all required fields have defaults
      const profileData = {
        educationLevel: data.educationLevel || 'bachelors',
        degree: data.degree || 'Bachelor\'s',
        major: data.major || data.fieldOfStudy || 'Not specified',
        graduationYear: data.graduationYear || new Date().getFullYear(),
        gpa: data.gpa || '',
        intendedDegree: data.intendedDegree || 'masters',
        fieldOfStudy: data.fieldOfStudy || data.major || 'Not specified',
        targetIntakeYear: data.targetIntakeYear || new Date().getFullYear() + 1,
        preferredCountries: data.preferredCountries || ['United States'],
        budgetMin: data.budgetMin || 20000,
        budgetMax: data.budgetMax || 50000,
        fundingPlan: data.fundingPlan || 'mixed',
        ieltsStatus: data.ieltsStatus || 'not-started',
        toeflStatus: data.toeflStatus || 'not-started',
        greStatus: data.greStatus || 'not-started',
        gmatStatus: data.gmatStatus || 'not-started',
        sopStatus: data.sopStatus || 'not-started'
      };

      console.log('Sending profileData to /user/onboarding:', profileData);
      
      const response = await api.post('/user/onboarding', profileData);
      console.log('Onboarding response:', response.data);
      
      updateUser(response.data.user);
      toast.success('Profile created successfully!');
      navigate('/dashboard');
    } catch (error) {
      console.error('Onboarding error:', error);
      console.error('Error response:', error.response?.data);
      toast.error('Failed to save profile. Please try again.');
      setOnboardingComplete(false);
    }
  };

  const toggleVoice = () => {
    if (isSpeaking) {
      synthRef.current.cancel();
      setIsSpeaking(false);
    }
    setVoiceEnabled(!voiceEnabled);
    toast.success(voiceEnabled ? 'Voice muted' : 'Voice enabled');
  };

  const handleSkipOnboarding = async () => {
    // Stop any ongoing speech
    synthRef.current.cancel();
    // Save any partial data collected so far along with marking onboarding as complete
    try {
      const partialData = {
        ...collectedDataRef.current,
        ...extractedData,
        skipWithDefaults: true
      };
      console.log('Skipping with partial data:', partialData);
      const response = await api.post('/user/onboarding', partialData);
      updateUser(response.data.user);
      toast.success('Onboarding skipped. Your partial data has been saved.');
      navigate('/dashboard');
    } catch (error) {
      console.error('Skip onboarding error:', error);
      toast.error('Failed to skip onboarding. Please try again.');
    }
  };

  // Text input fallback
  const [textInput, setTextInput] = useState('');
  const handleTextSubmit = (e) => {
    e.preventDefault();
    if (textInput.trim() && !isProcessing) {
      handleUserInput(textInput);
      setTextInput('');
    }
  };

  return (
    <div className="voice-onboarding">
      <div className="onboarding-container">
        {/* Header */}
        <div className="onboarding-header">
          <div className="header-content">
            <h1>🎓 Onboarding AI</h1>
          </div>
          <div className="header-actions">
            <button 
              className={`voice-toggle ${!voiceEnabled ? 'muted' : ''}`}
              onClick={toggleVoice}
              title={voiceEnabled ? 'Mute voice' : 'Enable voice'}
            >
              {voiceEnabled ? <FiVolume2 /> : <FiVolumeX />}
            </button>
            <button 
              className="skip-button"
              onClick={handleSkipOnboarding}
              title="Skip onboarding"
            >
              Skip
            </button>
          </div>
        </div>
        
        {/* Progress Bar */}
        {conversationReady && (
          <div className="onboarding-progress">
            <div className="progress-bar">
              <div 
                className="progress-fill" 
                style={{ width: `${progress}%` }}
              />
            </div>
            <span className="progress-text">{progress}% Complete</span>
          </div>
        )}

        {/* Conversation */}
        <div className="conversation-area">
          {messages.length === 0 && !conversationReady && (
            <div className="start-conversation">
              <p>Click the button below to start your voice-guided onboarding</p>
              <button 
                className="start-button"
                onClick={handleStartConversation}
                disabled={!voicesLoaded}
              >
                {voicesLoaded ? '🎤 Start Conversation' : 'Loading...'}
              </button>
            </div>
          )}
          
          {messages.map((msg, index) => (
            <div key={index} className={`message ${msg.role}`}>
              <div className="message-avatar">
                {msg.role === 'assistant' ? '🤖' : '👤'}
              </div>
              <div className="message-content">
                <p>{msg.content}</p>
              </div>
            </div>
          ))}
          
          {isProcessing && (
            <div className="message assistant">
              <div className="message-avatar">🤖</div>
              <div className="message-content">
                <div className="typing-dots">
                  <span></span><span></span><span></span>
                </div>
              </div>
            </div>
          )}
          
          {transcript && (
            <div className="live-transcript">
              <FiMic className="pulse" /> {transcript}
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>



        {/* Voice Controls */}
        <div className="voice-controls">
          {onboardingComplete ? (
            <div className="completion-status">
              <FiLoader className="spin" />
              <span>Setting up your profile...</span>
            </div>
          ) : (
            <>
              <button
                className={`mic-button ${isListening ? 'listening' : ''} ${isSpeaking || isProcessing ? 'disabled' : ''}`}
                onClick={isListening ? stopListening : startListening}
                disabled={isSpeaking || isProcessing}
              >
                <div className="mic-icon">
                  {isListening ? <FiMic /> : <FiMicOff />}
                </div>
                <span>
                  {isListening ? 'Listening... (click to stop)' : 
                   isSpeaking ? 'AI is speaking...' :
                   isProcessing ? 'Processing...' : 
                   'Click to Speak'}
                </span>
              </button>

              {/* Text input fallback */}
              <form className="text-input-form" onSubmit={handleTextSubmit}>
                <input
                  type="text"
                  value={textInput}
                  onChange={(e) => setTextInput(e.target.value)}
                  placeholder="Or type your response here..."
                  disabled={isProcessing || isSpeaking}
                />
                <button type="submit" disabled={!textInput.trim() || isProcessing || isSpeaking}>
                  <FiMessageCircle />
                </button>
              </form>
            </>
          )}
        </div>

        {/* Browser Support Warning */}
        {!browserSupport.speechRecognition && (
          <div className="browser-warning">
            ⚠️ Voice input not supported in this browser. Please use Chrome or Edge, or type your responses below.
          </div>
        )}
      </div>
    </div>
  );
};

export default Onboarding;
