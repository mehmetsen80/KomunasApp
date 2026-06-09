import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { resetPassword as resetPasswordApi } from '../../services/authService';
import { Lock, ShieldCheck, AlertCircle, CheckCircle2, KeyRound, Activity, Brain } from 'lucide-react';
import Button from '../../components/Button';
import './styles.scss';

const ResetPassword = () => {
    const [searchParams] = useSearchParams();
    const token = searchParams.get('token');

    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(false);
    const [loading, setLoading] = useState(false);

    const navigate = useNavigate();

    useEffect(() => {
        if (!token) {
            setError('Missing reset token. Please request a new link.');
        }
    }, [token]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);

        if (password !== confirmPassword) {
            setError('Passwords do not match');
            return;
        }

        if (password.length < 6) {
            setError('Password must be at least 6 characters');
            return;
        }

        setLoading(true);

        try {
            const data = await resetPasswordApi(token, password);
            if (data.success) {
                setSuccess(true);
                // Redirect to login after 3 seconds
                setTimeout(() => {
                    navigate('/login');
                }, 3000);
            } else {
                setError(data.message || 'Failed to reset password. Token may be expired.');
            }
        } catch (err) {
            setError(err.message || 'An error occurred. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="resetPasswordPage">
            {/* Left Column: Brand Marketing Panel */}
            <div className="rpPanelLeft">
                <div className="brandHeader">
                    <div className="brandLogo">K</div>
                    <span className="brandName">Komunas</span>
                </div>

                <div className="marketingContent">
                    <h2 className="marketingTitle">
                        A Fresh Start,{' '}
                        <span className="highlightText">Fully Secured</span>
                    </h2>
                    <p className="marketingSubtitle">
                        Your new password is encrypted end-to-end. Once set, your full access to the USCIS intelligence platform is instantly restored.
                    </p>

                    <div className="marketingPillars">
                        <div className="pillarItem">
                            <div className="pillarIcon">
                                <KeyRound size={20} />
                            </div>
                            <div className="pillarText">
                                <h3>End-to-End Encryption</h3>
                                <p>Credentials are hashed and never stored in plain text — ever.</p>
                            </div>
                        </div>

                        <div className="pillarItem">
                            <div className="pillarIcon">
                                <Activity size={20} />
                            </div>
                            <div className="pillarText">
                                <h3>Instant Access</h3>
                                <p>Resume real-time USCIS monitoring the moment your password is updated.</p>
                            </div>
                        </div>

                        <div className="pillarItem">
                            <div className="pillarIcon">
                                <Brain size={20} />
                            </div>
                            <div className="pillarText">
                                <h3>Everything Preserved</h3>
                                <p>Your saved searches, team roles, and AI insights remain completely intact.</p>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="marketingFooter">
                    <p>© {new Date().getFullYear()} Komunas. Intelligence Verified.</p>
                </div>
            </div>

            {/* Right Column: Form Card */}
            <div className="rpPanelRight">
                <div className="rpContent">
                    <Link to="/forgot-password" className="backHome">
                        ← Back to Reset Request
                    </Link>

                    <div className="rpCard">
                        <div className="cardHeader">
                            <div className="logoWrapper">
                                <img src="/komunas_logo.svg" alt="Komunas Logo" />
                            </div>
                            <h1>Set New Password</h1>
                            <p>Establish a secure new credential for your account.</p>
                        </div>

                        {!success ? (
                            <form className="rpForm" onSubmit={handleSubmit}>
                                <div className="inputGroup">
                                    <label htmlFor="password">New Password</label>
                                    <div className="inputWrapper">
                                        <Lock size={18} className="inputIcon" />
                                        <input
                                            id="password"
                                            type="password"
                                            placeholder="Min. 6 characters"
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            required
                                        />
                                    </div>
                                </div>

                                <div className="inputGroup">
                                    <label htmlFor="confirmPassword">Confirm New Password</label>
                                    <div className="inputWrapper">
                                        <Lock size={18} className="inputIcon" />
                                        <input
                                            id="confirmPassword"
                                            type="password"
                                            placeholder="Repeat your password"
                                            value={confirmPassword}
                                            onChange={(e) => setConfirmPassword(e.target.value)}
                                            required
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
                                    disabled={!token}
                                    icon={<Lock size={20} />}
                                    className="rpSubmit"
                                >
                                    Update Password
                                </Button>
                            </form>
                        ) : (
                            <div className="successState">
                                <div className="successIcon">
                                    <CheckCircle2 size={40} />
                                </div>
                                <h3>Password Updated</h3>
                                <p>Your secure credential has been successfully synchronized. Redirecting to login...</p>
                                <Link to="/login" className="returnLoginBtn">
                                    Go to Login Now
                                </Link>
                            </div>
                        )}

                        <div className="cardFooter">
                            <div className="securityBadge">
                                <ShieldCheck size={14} />
                                Secured with Linqra Intelligence
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ResetPassword;
