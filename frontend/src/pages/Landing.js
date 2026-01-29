import React from 'react';
import { Link } from 'react-router-dom';
import { FiArrowRight, FiCheck, FiMessageCircle, FiTarget, FiClipboard, FiGlobe, FiStar, FiShield } from 'react-icons/fi';
import './Landing.css';

const Landing = () => {

  const features = [
    {
      icon: FiMessageCircle,
      title: 'AI-Powered Guidance',
      description: 'Get personalized recommendations from our intelligent counsellor that understands your goals.',
      highlight: 'Smart AI',
      color: '#4F46E5'
    },
    {
      icon: FiTarget,
      title: 'Smart University Matching',
      description: 'Find your Dream, Target, and Safe universities based on your unique profile.',
      highlight: 'Precision Match',
      color: '#7C3AED'
    },
    {
      icon: FiClipboard,
      title: 'Application Tracking',
      description: 'Stay organized with AI-generated to-do lists and deadline reminders.',
      highlight: 'Stay Organized',
      color: '#EC4899'
    }
  ];

  const steps = [
    { number: '01', title: 'Create Profile', description: 'Tell us about your academic background and goals', icon: FiStar },
    { number: '02', title: 'Get Recommendations', description: 'Receive AI-powered university suggestions', icon: FiTarget },
    { number: '03', title: 'Lock Universities', description: 'Commit to your target universities', icon: FiShield },
    { number: '04', title: 'Apply with Confidence', description: 'Follow guided steps to complete applications', icon: FiCheck }
  ];

  const universities = [
    { name: 'MIT', logo: '🏛️' },
    { name: 'Stanford', logo: '🎓' },
    { name: 'Oxford', logo: '📚' },
    { name: 'Cambridge', logo: '🏰' },
    { name: 'Harvard', logo: '🎯' },
    { name: 'ETH Zurich', logo: '⚡' }
  ];

  return (
    <div className="landing">
      {/* Decorative Elements */}
      <div className="landing-bg-decoration">
        <div className="bg-blob bg-blob-1"></div>
        <div className="bg-blob bg-blob-2"></div>
        <div className="bg-blob bg-blob-3"></div>
      </div>

      {/* Header */}
      <header className="landing-header">
        <div className="container header-content">
          <div className="logo">
            <span className="logo-icon">◆</span>
            AI Counsellor
          </div>
          <nav className="header-nav">
            <Link to="/login" className="nav-link">Login</Link>
            <Link to="/signup" className="btn btn-primary">Get Started</Link>
          </nav>
        </div>
      </header>

      {/* Hero */}
      <section className="hero">
        <div className="hero-glow"></div>
        <div className="container hero-content">
          <div className="hero-badge">
            <FiGlobe /> Trusted by students worldwide
          </div>
          <h1 className="hero-title">
            Your Study Abroad Journey,<br />
            <span className="gradient-text">Reimagined with AI</span>
          </h1>
          <p className="hero-subtitle">
            From dream universities to successful applications — let our AI counsellor 
            guide you every step of the way with personalized insights and expert recommendations.
          </p>
          <div className="hero-cta">
            <Link to="/signup" className="btn btn-primary btn-lg btn-glow">
              Start Your Journey <FiArrowRight />
            </Link>
            <Link to="/login" className="btn btn-glass btn-lg">
              I already have an account
            </Link>
          </div>
          <div className="hero-stats">
            <div className="stat">
              <span className="stat-number">50+</span>
              <span className="stat-label">Universities</span>
            </div>
            <div className="stat-divider"></div>
            <div className="stat">
              <span className="stat-number">10+</span>
              <span className="stat-label">Countries</span>
            </div>
            <div className="stat-divider"></div>
            <div className="stat">
              <span className="stat-number">24/7</span>
              <span className="stat-label">AI Support</span>
            </div>
          </div>
        </div>
      </section>

      {/* Trusted Universities Marquee */}
      <section className="trusted-section">
        <div className="container">
          <p className="trusted-label">Trusted by students accepted to</p>
          <div className="university-marquee">
            <div className="marquee-track">
              {[...universities, ...universities].map((uni, index) => (
                <div key={index} className="university-badge">
                  <span className="uni-logo">{uni.logo}</span>
                  <span className="uni-name">{uni.name}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="features">
        <div className="container">
          <div className="section-header">
            <span className="section-tag">Features</span>
            <h2 className="section-title">Why Choose AI Counsellor?</h2>
            <p className="section-subtitle">Everything you need to navigate your study abroad journey with confidence</p>
          </div>
          <div className="features-grid">
            {features.map((feature, index) => (
              <div key={index} className="feature-card">
                <div className="feature-highlight">{feature.highlight}</div>
                <div className="feature-icon">
                  <feature.icon />
                </div>
                <h3>{feature.title}</h3>
                <p>{feature.description}</p>
                <div className="feature-link">
                  Learn more <FiArrowRight />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it Works */}
      <section className="how-it-works">
        <div className="container">
          <div className="section-header">
            <span className="section-tag">Process</span>
            <h2 className="section-title">How It Works</h2>
            <p className="section-subtitle">Four simple steps to your dream university</p>
          </div>
          <div className="steps-grid">
            {steps.map((step, index) => (
              <div key={index} className="step-card">
                <div className="step-icon">
                  <step.icon />
                </div>
                <div className="step-number">{step.number}</div>
                <h3>{step.title}</h3>
                <p>{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="cta-section">
        <div className="container">
          <div className="cta-card">
            <div className="cta-content">
              <span className="cta-tag">Get Started Today</span>
              <h2>Ready to Begin Your Journey?</h2>
              <p>Join thousands of students who found their perfect university match with AI-powered guidance.</p>
              <div className="cta-buttons">
                <Link to="/signup" className="btn btn-white btn-lg">
                  Get Started for Free <FiArrowRight />
                </Link>
              </div>
            </div>
            <div className="cta-decoration">
              <div className="cta-circle cta-circle-1"></div>
              <div className="cta-circle cta-circle-2"></div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="landing-footer">
        <div className="container footer-content">
          <div className="footer-brand">
            <span className="logo-icon">◆</span>
            AI Counsellor
          </div>
          <p>&copy; 2024 AI Counsellor. Built with ❤️ for Hackathon.</p>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
