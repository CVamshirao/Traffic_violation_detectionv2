import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { login } from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function Login() {
    const [form, setForm] = useState({ email: '', password: '' });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [showPwd, setShowPwd] = useState(false);
    const { loginUser } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            const res = await login(form);
            if (res.data.success) {
                loginUser(res.data.data);
                navigate('/dashboard');
            } else {
                setError(res.data.message);
            }
        } catch (err) {
            setError(err.response?.data?.message || 'Login failed. Please check your credentials.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-bg p-4">
            {/* Background Orbs */}
            <div className="auth-orb auth-orb-1" />
            <div className="auth-orb auth-orb-2" />
            <div className="auth-orb auth-orb-3" />

            <div className="w-full max-w-[440px] animate-fade-in" style={{ position: 'relative', zIndex: 1 }}>
                {/* Header */}
                <div className="text-center mb-8">
                    <div className="logo-icon mx-auto mb-5">
                        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <rect x="9" y="1" width="6" height="22" rx="3" stroke="#818cf8" strokeWidth="1.5" fill="rgba(99,102,241,0.1)" />
                            <circle cx="12" cy="6" r="2" fill="#ef4444" />
                            <circle cx="12" cy="12" r="2" fill="#f59e0b" />
                            <circle cx="12" cy="18" r="2" fill="#10b981" />
                        </svg>
                    </div>
                    <h1 className="text-2xl font-bold gradient-text mb-1">TrafficAI</h1>
                    <p className="text-sm" style={{ color: '#475569' }}>AI-Powered Violation Detection System</p>
                </div>

                {/* Card */}
                <div className="auth-card p-8">
                    <div className="mb-6">
                        <h2 className="text-lg font-semibold text-dark-text-light">Welcome back</h2>
                        <p className="text-xs mt-1" style={{ color: '#475569' }}>Sign in with your credentials to continue</p>
                    </div>

                    <form onSubmit={handleSubmit}>
                        {error && (
                            <div className="flex items-center gap-2 px-4 py-3 rounded-xl mb-5"
                                style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.15)' }}>
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                                    <circle cx="12" cy="12" r="10" stroke="#f87171" strokeWidth="1.5" />
                                    <path d="M12 8v4m0 4h.01" stroke="#f87171" strokeWidth="2" strokeLinecap="round" />
                                </svg>
                                <span className="text-sm" style={{ color: '#f87171' }}>{error}</span>
                            </div>
                        )}

                        {/* Email */}
                        <div className="mb-4">
                            <label className="block text-xs font-medium mb-2" style={{ color: '#94a3b8' }}>Email Address</label>
                            <div className="input-group">
                                <div className="input-icon">
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                                        <rect x="2" y="4" width="20" height="16" rx="3" stroke="currentColor" strokeWidth="1.5" />
                                        <path d="M2 7l10 6 10-6" stroke="currentColor" strokeWidth="1.5" />
                                    </svg>
                                </div>
                                <input
                                    type="email"
                                    className="input-field"
                                    placeholder="name@company.com"
                                    value={form.email}
                                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                                    required
                                    autoComplete="email"
                                />
                            </div>
                        </div>

                        {/* Password */}
                        <div className="mb-6">
                            <div className="flex items-center justify-between mb-2">
                                <label className="text-xs font-medium" style={{ color: '#94a3b8' }}>Password</label>
                            </div>
                            <div className="input-group">
                                <div className="input-icon">
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                                        <rect x="3" y="11" width="18" height="11" rx="3" stroke="currentColor" strokeWidth="1.5" />
                                        <path d="M7 11V7a5 5 0 0110 0v4" stroke="currentColor" strokeWidth="1.5" />
                                        <circle cx="12" cy="16" r="1.5" fill="currentColor" />
                                    </svg>
                                </div>
                                <input
                                    type={showPwd ? 'text' : 'password'}
                                    className="input-field"
                                    placeholder="Enter your password"
                                    value={form.password}
                                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                                    required
                                    autoComplete="current-password"
                                    style={{ paddingRight: '2.75rem' }}
                                />
                                <button type="button" className="input-action" onClick={() => setShowPwd(!showPwd)}
                                    tabIndex={-1} aria-label="Toggle password visibility">
                                    {showPwd ? (
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                                            <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                                            <line x1="1" y1="1" x2="23" y2="23" stroke="currentColor" strokeWidth="1.5" />
                                        </svg>
                                    ) : (
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                                            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" stroke="currentColor" strokeWidth="1.5" />
                                            <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.5" />
                                        </svg>
                                    )}
                                </button>
                            </div>
                        </div>

                        <button type="submit" disabled={loading} className="btn-primary w-full py-3 text-sm">
                            {loading ? (
                                <span className="flex items-center justify-center gap-2">
                                    <svg className="w-4 h-4" style={{ animation: 'spin-slow 1s linear infinite' }} viewBox="0 0 24 24" fill="none">
                                        <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" opacity="0.3" />
                                        <path d="M12 2a10 10 0 019.95 9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                                    </svg>
                                    Signing in...
                                </span>
                            ) : 'Sign In'}
                        </button>
                    </form>

                    <div className="auth-divider my-6">
                        <span>or</span>
                    </div>

                    <p className="text-center text-sm" style={{ color: '#64748b' }}>
                        Don't have an account?{' '}
                        <Link to="/register" className="font-semibold hover:underline" style={{ color: '#818cf8' }}>
                            Create Account
                        </Link>
                    </p>
                </div>

                {/* Footer features */}
                <div className="flex items-center justify-center gap-3 mt-6 flex-wrap">
                    <span className="feature-tag">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" stroke="#818cf8" strokeWidth="1.5" /></svg>
                        Secure
                    </span>
                    <span className="feature-tag">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="3" stroke="#818cf8" strokeWidth="1.5" /><path d="M12 1v2m0 18v2M4.22 4.22l1.42 1.42m12.73 12.73l1.42 1.42M1 12h2m18 0h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" stroke="#818cf8" strokeWidth="1.5" /></svg>
                        AI Powered
                    </span>
                    <span className="feature-tag">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none"><path d="M22 11.08V12a10 10 0 11-5.93-9.14" stroke="#818cf8" strokeWidth="1.5" strokeLinecap="round" /><polyline points="22,4 12,14.01 9,11.01" stroke="#818cf8" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
                        Real-time
                    </span>
                </div>
            </div>
        </div>
    );
}
