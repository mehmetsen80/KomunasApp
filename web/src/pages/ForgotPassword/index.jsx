import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { forgotPassword as forgotPasswordApi } from '../../services/authService';
import { Mail, ArrowLeft, ShieldCheck, AlertCircle, CheckCircle2 } from 'lucide-react';
import './styles.scss';

const ForgotPassword = () => {
    const [email, setEmail] = useState('');
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(false);
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);
        setSuccess(false);
        setLoading(true);

        try {
            const data = await forgotPasswordApi(email);
            if (data.success) {
                setSuccess(true);
            } else {
                setError(data.message || 'Failed to send reset link. Please try again.');
            }
        } catch (err) {
            setError(err.message || 'An error occurred. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="forgotPasswordPage">
            {/* ── Dynamic Background ── */}
            <div className="forgotPasswordBg">
                <div className="blob blob-1"></div>
                <div className="blob blob-2"></div>
            </div>

            <div className="forgotPasswordContent">
                <Link to="/login" className="backLogin">
                    <ArrowLeft size={18} />
                    Back to Login
                </Link>

                <div className="forgotPasswordCard">
                    <div className="cardHeader">
                        <div className="logoWrapper">
                            <img src="/icon.jpg" alt="Komunas Logo" />
                        </div>
                        <h1>Reset Password</h1>
                        <p>Enter your email address and we'll send you a high-fidelity recovery link.</p>
                    </div>

                    {!success ? (
                        <form className="forgotPasswordForm" onSubmit={handleSubmit}>
                            <div className="inputGroup">
                                <label htmlFor="email">Email Address</label>
                                <div className="inputWrapper">
                                    <Mail size={18} className="inputIcon" />
                                    <input
                                        id="email"
                                        type="email"
                                        placeholder="Enter your registered email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        required
                                        autoComplete="email"
                                    />
                                </div>
                            </div>

                            {error && (
                                <div className="errorMessage">
                                    <AlertCircle size={18} />
                                    <span>{error}</span>
                                </div>
                            )}

                            <button type="submit" className="forgotPasswordSubmit" disabled={loading}>
                                {loading ? (
                                    <div className="spinner"></div>
                                ) : (
                                    <>
                                        Send Recovery Link
                                    </>
                                )}
                            </button>
                        </form>
                    ) : (
                        <div className="successState">
                            <div className="successIcon">
                                <CheckCircle2 size={48} />
                            </div>
                            <h3>Check Your Inbox</h3>
                            <p>If an account exists with <b>{email}</b>, you will receive a secure reset link shortly.</p>
                            <Link to="/login" className="returnLoginBtn">
                                Return to Login
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

export default ForgotPassword;
