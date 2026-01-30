import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { toast } from 'react-hot-toast';
import { FiSave, FiEdit2 } from 'react-icons/fi';
import './Profile.css';

const Profile = () => {
  const { user, updateUser } = useAuth();
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    fullName: user?.fullName || '',
    educationLevel: user?.educationLevel || '',
    degree: user?.degree || '',
    major: user?.major || '',
    graduationYear: user?.graduationYear || '',
    gpa: user?.gpa || '',
    intendedDegree: user?.intendedDegree || '',
    fieldOfStudy: user?.fieldOfStudy || '',
    targetIntakeYear: user?.targetIntakeYear || '',
    preferredCountries: user?.preferredCountries || [],
    budgetMin: user?.budgetMin || '',
    budgetMax: user?.budgetMax || '',
    fundingPlan: user?.fundingPlan || '',
    ieltsStatus: user?.ieltsStatus || 'not-started',
    ieltsScore: user?.ieltsScore || '',
    toeflStatus: user?.toeflStatus || 'not-started',
    toeflScore: user?.toeflScore || '',
    greStatus: user?.greStatus || 'not-started',
    greScore: user?.greScore || '',
    gmatStatus: user?.gmatStatus || 'not-started',
    gmatScore: user?.gmatScore || '',
    sopStatus: user?.sopStatus || 'not-started'
  });

  const countries = ['United States', 'Canada', 'United Kingdom', 'Australia', 'Germany', 'Switzerland', 'Singapore', 'Netherlands', 'Ireland'];

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleCountryToggle = (country) => {
    setFormData(prev => ({
      ...prev,
      preferredCountries: prev.preferredCountries.includes(country)
        ? prev.preferredCountries.filter(c => c !== country)
        : [...prev.preferredCountries, country]
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const response = await api.put('/user/profile', formData);
      updateUser(response.data.user);
      setEditing(false);
      toast.success('Profile updated successfully');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="profile-page">
      <div className="page-header">
        <div>
          <h1>Profile Settings</h1>
        </div>
        {!editing ? (
          <button className="btn btn-outline" onClick={() => setEditing(true)}>
            <FiEdit2 /> Edit Profile
          </button>
        ) : (
          <div className="header-actions">
            <button className="btn btn-secondary" onClick={() => setEditing(false)}>
              Cancel
            </button>
            <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
              <FiSave /> {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        )}
      </div>

      <div className="profile-grid">
        {/* Personal Info */}
        <div className="section-card">
          <h2>Personal Information</h2>
          <div className="form-group">
            <label>Full Name</label>
            <input
              type="text"
              name="fullName"
              value={formData.fullName}
              onChange={handleChange}
              disabled={!editing}
            />
          </div>
          <div className="form-group">
            <label>Email</label>
            <input type="email" value={user?.email} disabled />
          </div>
        </div>

        {/* Academic Background */}
        <div className="section-card">
          <h2>Academic Background</h2>
          <div className="form-grid">
            <div className="form-group">
              <label>Education Level</label>
              <select
                name="educationLevel"
                value={formData.educationLevel}
                onChange={handleChange}
                disabled={!editing}
              >
                <option value="">Select</option>
                <option value="high-school">High School</option>
                <option value="bachelors">Bachelor's</option>
                <option value="masters">Master's</option>
                <option value="working">Working Professional</option>
              </select>
            </div>
            <div className="form-group">
              <label>Major</label>
              <input
                type="text"
                name="major"
                value={formData.major}
                onChange={handleChange}
                disabled={!editing}
              />
            </div>
            <div className="form-group">
              <label>GPA/Percentage</label>
              <input
                type="text"
                name="gpa"
                value={formData.gpa}
                onChange={handleChange}
                disabled={!editing}
              />
            </div>
          </div>
        </div>

        {/* Study Goals */}
        <div className="section-card">
          <h2>Study Goals</h2>
          <div className="form-grid">
            <div className="form-group">
              <label>Intended Degree</label>
              <select
                name="intendedDegree"
                value={formData.intendedDegree}
                onChange={handleChange}
                disabled={!editing}
              >
                <option value="">Select</option>
                <option value="bachelors">Bachelor's</option>
                <option value="masters">Master's</option>
                <option value="mba">MBA</option>
                <option value="phd">PhD</option>
              </select>
            </div>
            <div className="form-group">
              <label>Field of Study</label>
              <input
                type="text"
                name="fieldOfStudy"
                value={formData.fieldOfStudy}
                onChange={handleChange}
                disabled={!editing}
              />
            </div>
            <div className="form-group">
              <label>Target Intake</label>
              <select
                name="targetIntakeYear"
                value={formData.targetIntakeYear}
                onChange={handleChange}
                disabled={!editing}
              >
                <option value="">Select</option>
                <option value="2024">Fall 2024</option>
                <option value="2025">Fall 2025</option>
                <option value="2026">Fall 2026</option>
              </select>
            </div>
          </div>
          <div className="form-group">
            <label>Preferred Countries</label>
            <div className="country-grid">
              {countries.map(country => (
                <button
                  key={country}
                  type="button"
                  className={`country-btn ${formData.preferredCountries.includes(country) ? 'selected' : ''}`}
                  onClick={() => editing && handleCountryToggle(country)}
                  disabled={!editing}
                >
                  {country}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Budget */}
        <div className="section-card">
          <h2>Budget & Funding</h2>
          <div className="form-grid">
            <div className="form-group">
              <label>Min Budget (USD/year)</label>
              <input
                type="number"
                name="budgetMin"
                value={formData.budgetMin}
                onChange={handleChange}
                disabled={!editing}
              />
            </div>
            <div className="form-group">
              <label>Max Budget (USD/year)</label>
              <input
                type="number"
                name="budgetMax"
                value={formData.budgetMax}
                onChange={handleChange}
                disabled={!editing}
              />
            </div>
            <div className="form-group full-width">
              <label>Funding Plan</label>
              <select
                name="fundingPlan"
                value={formData.fundingPlan}
                onChange={handleChange}
                disabled={!editing}
              >
                <option value="">Select</option>
                <option value="self-funded">Self-funded</option>
                <option value="scholarship">Scholarship-dependent</option>
                <option value="loan">Education Loan</option>
                <option value="mixed">Mixed</option>
              </select>
            </div>
          </div>
        </div>

        {/* Exams */}
        <div className="section-card full-width">
          <h2>Exams & Readiness</h2>
          <div className="exams-grid">
            <div className="exam-item">
              <label>IELTS</label>
              <select
                name="ieltsStatus"
                value={formData.ieltsStatus}
                onChange={handleChange}
                disabled={!editing}
              >
                <option value="not-started">Not Started</option>
                <option value="in-progress">Preparing</option>
                <option value="completed">Completed</option>
                <option value="not-required">Not Required</option>
              </select>
              {formData.ieltsStatus === 'completed' && (
                <input
                  type="text"
                  name="ieltsScore"
                  value={formData.ieltsScore}
                  onChange={handleChange}
                  placeholder="Score"
                  disabled={!editing}
                />
              )}
            </div>
            <div className="exam-item">
              <label>TOEFL</label>
              <select
                name="toeflStatus"
                value={formData.toeflStatus}
                onChange={handleChange}
                disabled={!editing}
              >
                <option value="not-started">Not Started</option>
                <option value="in-progress">Preparing</option>
                <option value="completed">Completed</option>
                <option value="not-required">Not Required</option>
              </select>
            </div>
            <div className="exam-item">
              <label>GRE</label>
              <select
                name="greStatus"
                value={formData.greStatus}
                onChange={handleChange}
                disabled={!editing}
              >
                <option value="not-started">Not Started</option>
                <option value="in-progress">Preparing</option>
                <option value="completed">Completed</option>
                <option value="not-required">Not Required</option>
              </select>
            </div>
            <div className="exam-item">
              <label>GMAT</label>
              <select
                name="gmatStatus"
                value={formData.gmatStatus}
                onChange={handleChange}
                disabled={!editing}
              >
                <option value="not-started">Not Started</option>
                <option value="in-progress">Preparing</option>
                <option value="completed">Completed</option>
                <option value="not-required">Not Required</option>
              </select>
            </div>
            <div className="exam-item">
              <label>SOP</label>
              <select
                name="sopStatus"
                value={formData.sopStatus}
                onChange={handleChange}
                disabled={!editing}
              >
                <option value="not-started">Not Started</option>
                <option value="draft">Draft Ready</option>
                <option value="ready">Ready</option>
              </select>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
