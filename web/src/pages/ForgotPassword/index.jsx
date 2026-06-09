import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { forgotPassword as forgotPasswordApi } from '../../services/authService';
import { Mail, ArrowLeft, ShieldCheck, AlertCircle, CheckCircle2, KeyRound, Activity, Brain, Users } from 'lucide-react';
import Button from '../../components/Button';
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
            {/* Left Column: Brand Marketing Panel */}
            <div className="fpPanelLeft">
                <div className="brandHeader">
                    <div className="brandLogo">K</div>
                    <span className="brandName">Komunas</span>
                </div>

                <div className="marketingContent">
                    <h2 className="marketingTitle">
                        Your Access,{' '}
                        <span className="highlightText">Restored Securely</span>
                    </h2>
                    <p className="marketingSubtitle">
                        We use encrypted, time-limited recovery links to ensure your account stays protected throughout the reset process.
                    </p>

                    <div className="marketingPillars">
                        <div className="pillarItem">
                            <div className="pillarIcon">
                                <KeyRound size={20} />
                            </div>
                            <div className="pillarText">
                                <h3>Secure Recovery</h3>
                                <p>Encrypted reset tokens expire automatically — no persistent vulnerabilities.</p>
                            </div>
                        </div>

                        <div className="pillarItem">
                            <div className="pillarIcon">
                                <Activity size={20} />
                            </div>
                            <div className="pillarText">
                                <h3>Stay Informed</h3>
                                <p>Never miss a USCIS update. Resume your intelligence feed the moment you're back.</p>
                            </div>
                        </div>

                        <div className="pillarItem">
                            <div className="pillarIcon">
                                <Brain size={20} />
                            </div>
                            <div className="pillarText">
                                <h3>Seamless Return</h3>
                                <p>Pick up right where you left off — your saved searches and team access are intact.</p>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="marketingFooter">
                    <p>© {new Date().getFullYear()} Komunas. Intelligence Verified.</p>
                </div>
            </div>

            {/* Right Column: Form Card */}
            <div className="fpPanelRight">
                <div className="fpContent">
                    <Link to="/login" className="backHome">
                        <ArrowLeft size={18} />
                        Back to Login
                    </Link>

                    <div className="fpCard">
                        <div className="cardHeader">
                            <div className="logoWrapper">
                                <img src="/komunas_logo.svg" alt="Komunas Logo" />
                            </div>
                            <h1>Reset Password</h1>
                            <p>Enter your email address and we'll send you a secure recovery link.</p>
                        </div>

                        {!success ? (
                            <form className="fpForm" onSubmit={handleSubmit}>
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

                                <Button
                                    type="submit"
                                    variant="primary"
                                    loading={loading}
                                    icon={<Mail size={20} />}
                                    className="fpSubmit"
                                >
                                    Send Recovery Link
                                </Button>
                            </form>
                        ) : (
                            <div className="successState">
                                <div className="successIcon">
                                    <CheckCircle2 size={40} />
                                </div>
                                <h3>Check Your Inbox</h3>
                                <p>
                                    If an account exists with <b>{email}</b>, you will receive a secure reset link shortly.
                                </p>
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
                            <p className="rememberPassword">
                                Remember your password? <Link to="/login">Sign In</Link>
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ForgotPassword;
