import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { register as registerApi } from '../../services/authService';
import { UserPlus, User, Mail, Lock, ShieldCheck, AlertCircle, ArrowLeft } from 'lucide-react';
import './styles.scss';

const Register = () => {
  const [formData, setFormData] = useState({
    fullName: '',
    username: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { id, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [id]: value
    }));
  };

  const validate = () => {
    if (formData.fullName.trim().length < 4) {
      setError('Full name must be at least 4 characters');
      return false;
    }
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return false;
    }
    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (!validate()) return;

    setLoading(true);
    try {
      const data = await registerApi({
        fullName: formData.fullName,
        username: formData.username,
        email: formData.email,
        password: formData.password
      });

      if (data.success) {
        if (data.token) {
          login(data.token, data.user);
          navigate('/');
        } else {
          navigate('/login', { state: { message: 'Registration successful! Please sign in.' } });
        }
      } else {
        setError(data.message || 'Registration failed');
      }
    } catch (err) {
      setError(err.message || 'An error occurred during registration');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="registerPage">
      <div className="registerBg">
        <div className="blob blob-1"></div>
        <div className="blob blob-2"></div>
      </div>

      <div className="registerContent">
        <Link to="/login" className="backLink">
          <ArrowLeft size={18} />
          Back to Login
        </Link>

        <div className="registerCard">
          <div className="cardHeader">
            <div className="logoWrapper">
              <img src="/icon.jpg" alt="Komunas Logo" />
            </div>
            <h1>Create Account</h1>
            <p>Join the professional network for USCIS Intelligence</p>
          </div>

          <form className="registerForm" onSubmit={handleSubmit}>
            <div className="inputRow">
              <div className="inputGroup">
                <label htmlFor="fullName">Full Name</label>
                <div className="inputWrapper">
                  <User size={18} className="inputIcon" />
                  <input
                    id="fullName"
                    type="text"
                    placeholder="John Doe"
                    value={formData.fullName}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>

              <div className="inputGroup">
                <label htmlFor="username">Username</label>
                <div className="inputWrapper">
                  <User size={18} className="inputIcon" />
                  <input
                    id="username"
                    type="text"
                    placeholder="johndoe"
                    value={formData.username}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>
            </div>

            <div className="inputGroup">
              <label htmlFor="email">Email Address</label>
              <div className="inputWrapper">
                <Mail size={18} className="inputIcon" />
                <input
                  id="email"
                  type="email"
                  placeholder="john@example.com"
                  value={formData.email}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            <div className="inputRow">
              <div className="inputGroup">
                <label htmlFor="password">Password</label>
                <div className="inputWrapper">
                  <Lock size={18} className="inputIcon" />
                  <input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    value={formData.password}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>

              <div className="inputGroup">
                <label htmlFor="confirmPassword">Confirm</label>
                <div className="inputWrapper">
                  <Lock size={18} className="inputIcon" />
                  <input
                    id="confirmPassword"
                    type="password"
                    placeholder="••••••••"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>
            </div>

            {error && (
              <div className="errorMessage">
                <AlertCircle size={18} />
                <span>{error}</span>
              </div>
            )}

            <button type="submit" className="registerSubmit" disabled={loading}>
              {loading ? (
                <div className="spinner"></div>
              ) : (
                <>
                  <UserPlus size={20} />
                  Create Account
                </>
              )}
            </button>
          </form>

          <div className="cardFooter">
            <div className="securityBadge">
              <ShieldCheck size={14} />
              Secured with Linqra Intelligence
            </div>
            <p className="hasAccount">
              Already have an account? <Link to="/login">Sign In</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;
