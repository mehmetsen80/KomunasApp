import React, { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { login as loginApi } from '../../services/authService';
import { LogIn, Lock, User, ArrowLeft, ShieldCheck, AlertCircle } from 'lucide-react';
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
            {/* ── Dynamic Background ── */}
            <div className="loginBg">
                <div className="blob blob-1"></div>
                <div className="blob blob-2"></div>
            </div>

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

                        <button type="submit" className="loginSubmit" disabled={loading}>
                            {loading ? (
                                <div className="spinner"></div>
                            ) : (
                                <>
                                    <LogIn size={20} />
                                    Sign In
                                </>
                            )}
                        </button>
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
    );
};

export default Login;
