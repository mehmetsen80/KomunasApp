import React, { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { login as loginApi } from '../../services/authService';
import { LogIn, Lock, User, ArrowLeft, ShieldCheck, AlertCircle, Activity, Brain, Users } from 'lucide-react';
import Button from '../../components/Button';
import './styles.scss';

const Login = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(false);

    const { login } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    const from = location.state?.from?.pathname || '/';

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);
        setLoading(true);

        try {
            const data = await loginApi(username, password);
            if (data.success) {
                login(data.token, data.user);
                navigate(from, { replace: true });
            } else {
                setError(data.message || 'Login failed. Please check your credentials.');
            }
        } catch (err) {
            setError(err.message || 'An error occurred during login. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="loginPage">
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
                                <Users size={20} />
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

            {/* Right Column: Sign In Form Card */}
            <div className="loginPanelRight">
                <div className="loginContent">
                    <Link to="/" className="backHome">
                        <ArrowLeft size={18} />
                        Back to Home
                    </Link>

                    <div className="loginCard">
                        <div className="cardHeader">
                            <div className="logoWrapper">
                                <img src="/icon.jpg" alt="Komunas Logo" />
                            </div>
                            <h1>Welcome Back</h1>
                            <p>Access the USCIS Forms Library & Intelligence Platform</p>
                        </div>

                        <form className="loginForm" onSubmit={handleSubmit}>
                            <div className="inputGroup">
                                <label htmlFor="username">Username</label>
                                <div className="inputWrapper">
                                    <User size={18} className="inputIcon" />
                                    <input
                                        id="username"
                                        type="text"
                                        placeholder="Enter your username"
                                        value={username}
                                        onChange={(e) => setUsername(e.target.value)}
                                        required
                                        autoComplete="username"
                                    />
                                </div>
                            </div>

                            <div className="inputGroup">
                                <div className="labelRow">
                                    <label htmlFor="password">Password</label>
                                    <Link to="/forgot-password">
                                        Forgot?
                                    </Link>
                                </div>
                                <div className="inputWrapper">
                                    <Lock size={18} className="inputIcon" />
                                    <input
                                        id="password"
                                        type="password"
                                        placeholder="••••••••"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        required
                                        autoComplete="current-password"
                                    />
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
                                icon={<LogIn size={20} />}
                                className="loginSubmit"
                            >
                                Sign In
                            </Button>
                        </form>

                        <div className="cardFooter">
                            <div className="securityBadge">
                                <ShieldCheck size={14} />
                                Secured with Linqra Intelligence
                            </div>
                            <p className="noAccount">
                                Don't have an account? <Link to="/register">Create one</Link>
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Login;
