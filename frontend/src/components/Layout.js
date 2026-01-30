import React, { useState, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  FiHome, 
  FiMessageCircle, 
  FiGlobe,
  FiHeart,
  FiFileText, 
  FiUser, 
  FiLogOut,
  FiMenu,
  FiX
} from 'react-icons/fi';
import './Layout.css';
import logo from '../assets/logo.png';

const Layout = ({ children }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
      if (window.innerWidth > 768) {
        setMenuOpen(false);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleLogout = () => {
    if (window.confirm('Are you sure you want to logout?')) {
      logout();
      navigate('/', { replace: true });
    }
  };

  const handleNavClick = () => {
    setMenuOpen(false);
  };

  const navItems = [
    { to: '/dashboard', icon: FiHome, label: 'Dashboard' },
    { to: '/counsellor', icon: FiMessageCircle, label: 'AI Counsellor' },
    { to: '/live-universities', icon: FiGlobe, label: 'Universities' },
    { to: '/shortlisted', icon: FiHeart, label: 'Shortlisted' },
    { to: '/application', icon: FiFileText, label: 'Application' },
    { to: '/profile', icon: FiUser, label: 'Profile' },
  ];

  return (
    <div className="layout">
      {/* Mobile Menu Toggle */}
      <button 
        className="mobile-menu-toggle" 
        onClick={() => setMenuOpen(!menuOpen)}
      >
        {menuOpen ? <FiX size={22} /> : <FiMenu size={22} />}
      </button>

      <aside className={`sidebar ${menuOpen ? 'menu-open' : ''}`}>
        <div className="sidebar-header">
          <div className="logo">
            <img src={logo} alt="Logo" className="logo-img" />
            <span>AI Counsellor</span>
          </div>
        </div>
        
        <nav className={`sidebar-nav ${menuOpen ? 'show' : ''}`}>
          {navItems.map(item => (
            <NavLink 
              key={item.to} 
              to={item.to} 
              className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
              onClick={handleNavClick}
            >
              <item.icon className="nav-icon" />
              <span>{item.label}</span>
            </NavLink>
          ))}
          <button className="nav-item mobile-logout-btn" onClick={handleLogout}>
            <FiLogOut className="nav-icon" />
            <span>Logout</span>
          </button>
        </nav>

        <div className="sidebar-footer">
          <div className="user-info">
            <div className="user-avatar">
              {user?.fullName?.charAt(0).toUpperCase()}
            </div>
            <div className="user-details">
              <span className="user-name">{user?.fullName}</span>
              <span className="user-email">{user?.email}</span>
            </div>
          </div>
          <button className="logout-btn" onClick={handleLogout}>
            <FiLogOut />
          </button>
        </div>
      </aside>

      {menuOpen && <div className="menu-overlay" onClick={() => setMenuOpen(false)} />}

      <main className="main-content">
        {children}
      </main>
    </div>
  );
};

export default Layout;
