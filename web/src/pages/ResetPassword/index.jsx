import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { resetPassword as resetPasswordApi } from '../../services/authService';
import { Lock, ArrowLeft, ShieldCheck, AlertCircle, CheckCircle2 } from 'lucide-react';
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
            {/* ── Dynamic Background ── */}
            <div className="resetPasswordBg">
                <div className="blob blob-1"></div>
                <div className="blob blob-2"></div>
            </div>

            <div className="resetPasswordContent">
                <div className="resetPasswordCard">
                    <div className="cardHeader">
                        <div className="logoWrapper">
                            <img src="/icon.jpg" alt="Komunas Logo" />
                        </div>
                        <h1>Set New Password</h1>
                        <p>Establish a secure new credential for your account.</p>
                    </div>

                    {!success ? (
                        <form className="resetPasswordForm" onSubmit={handleSubmit}>
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

                            <button type="submit" className="resetPasswordSubmit" disabled={loading || !token}>
                                {loading ? (
                                    <div className="spinner"></div>
                                ) : (
                                    <>
                                        Update Password
                                    </>
                                )}
                            </button>
                        </form>
                    ) : (
                        <div className="successState">
                            <div className="successIcon">
                                <CheckCircle2 size={48} />
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
    );
};

export default ResetPassword;
