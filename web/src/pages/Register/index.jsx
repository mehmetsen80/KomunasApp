import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { register as registerApi } from '../../services/authService';
import { UserPlus, User, Mail, Lock, ShieldCheck, AlertCircle, ArrowLeft, Activity, Brain, Users as UsersIcon } from 'lucide-react';
import Button from '../../components/Button';
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
      {/* Left Column: Brand Marketing Panel */}
      <div className="loginPanelLeft">
        <div className="brandHeader">
          <div className="brandLogo">K</div>
          <span className="brandName">Komunas</span>
        </div>

        <div className="marketingContent">
          <h2 className="marketingTitle">
            Stay Ahead of USCIS <br />
            <span className="highlightText">Regulatory Changes</span>
          </h2>
          <p className="marketingSubtitle">
            Real-time tracking, AI version analysis, and collaborative team insights in a unified intelligence platform.
          </p>

          <div className="marketingPillars">
            <div className="pillarItem">
              <div className="pillarIcon">
                <Activity size={20} />
              </div>
              <div className="pillarText">
                <h3>Early Detection</h3>
                <p>Track form updates, announcements, visa charts, and wait times as they happen.</p>
              </div>
            </div>

            <div className="pillarItem">
              <div className="pillarIcon">
                <Brain size={20} />
              </div>
              <div className="pillarText">
                <h3>AI Version Analysis</h3>
                <p>Instantly compare versions, extract modifications, and summarize policy manuals.</p>
              </div>
            </div>

            <div className="pillarItem">
              <div className="pillarIcon">
                <UsersIcon size={20} />
              </div>
              <div className="pillarText">
                <h3>Workspace Synergy</h3>
                <p>Secure team mapping, registry audit controls, and real-time workspace notifications.</p>
              </div>
            </div>
          </div>
        </div>

        <div className="marketingFooter">
          <p>© {new Date().getFullYear()} Komunas. Intelligence Verified.</p>
        </div>
      </div>

      {/* Right Column: Registration Card */}
      <div className="loginPanelRight">
        <div className="registerContent">
          <Link to="/login" className="backLink">
            <ArrowLeft size={18} />
            Back to Login
          </Link>

          <div className="registerCard">
            <div className="cardHeader">
              <div className="logoWrapper">
                <img src="/komunas_logo.svg" alt="Komunas Logo" />
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

              <Button
                type="submit"
                variant="primary"
                loading={loading}
                icon={<UserPlus size={20} />}
                className="registerSubmit"
              >
                Create Account
              </Button>
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
    </div>
  );
};

export default Register;
