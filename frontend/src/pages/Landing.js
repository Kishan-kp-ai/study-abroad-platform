import React from 'react';
import { Link } from 'react-router-dom';
import { FiArrowRight, FiCheck, FiMessageCircle, FiTarget, FiClipboard } from 'react-icons/fi';
import './Landing.css';

const Landing = () => {
  const features = [
    {
      icon: FiMessageCircle,
      title: 'AI-Powered Guidance',
      description: 'Get personalized recommendations from our intelligent counsellor that understands your goals.'
    },
    {
      icon: FiTarget,
      title: 'Smart University Matching',
      description: 'Find your Dream, Target, and Safe universities based on your unique profile.'
    },
    {
      icon: FiClipboard,
      title: 'Application Tracking',
      description: 'Stay organized with AI-generated to-do lists and deadline reminders.'
    }
  ];

  const steps = [
    { number: '01', title: 'Create Profile', description: 'Tell us about your academic background and goals' },
    { number: '02', title: 'Get Recommendations', description: 'Receive AI-powered university suggestions' },
    { number: '03', title: 'Lock Universities', description: 'Commit to your target universities' },
    { number: '04', title: 'Apply with Confidence', description: 'Follow guided steps to complete applications' }
  ];

  return (
    <div className="landing">
      {/* Header */}
      <header className="landing-header">
        <div className="container header-content">
          <div className="logo">AI Counsellor</div>
          <nav className="header-nav">
            <Link to="/login" className="nav-link">Login</Link>
            <Link to="/signup" className="btn btn-primary">Get Started</Link>
          </nav>
        </div>
      </header>

      {/* Hero */}
      <section className="hero">
        <div className="container hero-content">
          <h1 className="hero-title">
            Plan Your Study Abroad Journey<br />
            <span className="gradient-text">With a Guided AI Counsellor</span>
          </h1>
          <p className="hero-subtitle">
            Stop drowning in confusion. Get step-by-step guidance from profile building 
            to university applications with an AI that understands your unique journey.
          </p>
          <div className="hero-cta">
            <Link to="/signup" className="btn btn-primary btn-lg">
              Start Your Journey <FiArrowRight />
            </Link>
            <Link to="/login" className="btn btn-outline btn-lg">
              I already have an account
            </Link>
          </div>
          <div className="hero-stats">
            <div className="stat">
              <span className="stat-number">50+</span>
              <span className="stat-label">Universities</span>
            </div>
            <div className="stat">
              <span className="stat-number">10+</span>
              <span className="stat-label">Countries</span>
            </div>
            <div className="stat">
              <span className="stat-number">AI</span>
              <span className="stat-label">Powered</span>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="features">
        <div className="container">
          <h2 className="section-title">Why Choose AI Counsellor?</h2>
          <div className="features-grid">
            {features.map((feature, index) => (
              <div key={index} className="feature-card">
                <div className="feature-icon">
                  <feature.icon />
                </div>
                <h3>{feature.title}</h3>
                <p>{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it Works */}
      <section className="how-it-works">
        <div className="container">
          <h2 className="section-title">How It Works</h2>
          <div className="steps-grid">
            {steps.map((step, index) => (
              <div key={index} className="step-card">
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
            <h2>Ready to Start Your Journey?</h2>
            <p>Join thousands of students who found their perfect university match.</p>
            <Link to="/signup" className="btn btn-white btn-lg">
              Get Started for Free <FiArrowRight />
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="landing-footer">
        <div className="container">
          <p>&copy; 2024 AI Counsellor. Built for Hackathon.</p>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
