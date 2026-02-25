import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { register } from '../services/api';
import { useAuth } from '../context/AuthContext';

const getPasswordStrength = (pwd) => {
    if (!pwd) return { level: 0, label: '', cls: '' };
    let score = 0;
    if (pwd.length >= 6) score++;
    if (pwd.length >= 10) score++;
    if (/[A-Z]/.test(pwd)) score++;
    if (/[0-9]/.test(pwd)) score++;
    if (/[^A-Za-z0-9]/.test(pwd)) score++;
    if (score <= 2) return { level: 1, label: 'Weak', cls: 'pwd-weak' };
    if (score <= 3) return { level: 2, label: 'Medium', cls: 'pwd-medium' };
    return { level: 3, label: 'Strong', cls: 'pwd-strong' };
};

const roleInfo = {
    USER: { label: 'Citizen', desc: 'Report violations and track fines', icon: '👤' },
    OFFICER: { label: 'Officer', desc: 'Review and verify violations', icon: '👮' },
    ADMIN: { label: 'Admin', desc: 'Full system management access', icon: '🛡️' },
};

export default function Register() {
    const [form, setForm] = useState({ name: '', email: '', password: '', role: 'USER' });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [showPwd, setShowPwd] = useState(false);
    const { loginUser } = useAuth();
    const navigate = useNavigate();

    const pwdStrength = getPasswordStrength(form.password);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            const res = await register(form);
            if (res.data.success) {
                loginUser(res.data.data);
                navigate('/dashboard');
            } else {
                setError(res.data.message);
            }
        } catch (err) {
            setError(err.response?.data?.message || 'Registration failed. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-bg p-4">
            <div className="auth-orb auth-orb-1" />
            <div className="auth-orb auth-orb-2" />
            <div className="auth-orb auth-orb-3" />

            <div className="w-full max-w-[440px] animate-fade-in" style={{ position: 'relative', zIndex: 1 }}>
                {/* Header */}
                <div className="text-center mb-6">
                    <div className="logo-icon mx-auto mb-5">
                        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <rect x="9" y="1" width="6" height="22" rx="3" stroke="#818cf8" strokeWidth="1.5" fill="rgba(99,102,241,0.1)" />
                            <circle cx="12" cy="6" r="2" fill="#ef4444" />
                            <circle cx="12" cy="12" r="2" fill="#f59e0b" />
                            <circle cx="12" cy="18" r="2" fill="#10b981" />
                        </svg>
                    </div>
                    <h1 className="text-2xl font-bold gradient-text mb-1">TrafficAI</h1>
                    <p className="text-sm" style={{ color: '#475569' }}>Create your account to get started</p>
                </div>

                {/* Card */}
                <div className="auth-card p-8">
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

                        {/* Full Name */}
                        <div className="mb-4">
                            <label className="block text-xs font-medium mb-2" style={{ color: '#94a3b8' }}>Full Name</label>
                            <div className="input-group">
                                <div className="input-icon">
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                                        <circle cx="12" cy="8" r="4" stroke="currentColor" strokeWidth="1.5" />
                                        <path d="M20 21a8 8 0 00-16 0" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                                    </svg>
                                </div>
                                <input type="text" className="input-field" placeholder="Enter your full name"
                                    value={form.name}
                                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                                    required autoComplete="name" />
                            </div>
                        </div>

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
                                <input type="email" className="input-field" placeholder="name@company.com"
                                    value={form.email}
                                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                                    required autoComplete="email" />
                            </div>
                        </div>

                        {/* Password */}
                        <div className="mb-4">
                            <label className="block text-xs font-medium mb-2" style={{ color: '#94a3b8' }}>Password</label>
                            <div className="input-group">
                                <div className="input-icon">
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                                        <rect x="3" y="11" width="18" height="11" rx="3" stroke="currentColor" strokeWidth="1.5" />
                                        <path d="M7 11V7a5 5 0 0110 0v4" stroke="currentColor" strokeWidth="1.5" />
                                        <circle cx="12" cy="16" r="1.5" fill="currentColor" />
                                    </svg>
                                </div>
                                <input type={showPwd ? 'text' : 'password'} className="input-field"
                                    placeholder="Min 6 characters"
                                    value={form.password}
                                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                                    required minLength={6} autoComplete="new-password"
                                    style={{ paddingRight: '2.75rem' }} />
                                <button type="button" className="input-action" onClick={() => setShowPwd(!showPwd)}
                                    tabIndex={-1} aria-label="Toggle password">
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
                            {/* Password strength bar */}
                            {form.password && (
                                <div className="mt-2">
                                    <div className="w-full rounded-full overflow-hidden" style={{ height: '3px', background: '#1e2740' }}>
                                        <div className={`h-full rounded-full transition-all duration-500`}
                                            style={{
                                                width: `${pwdStrength.level * 33.3}%`,
                                                background: pwdStrength.level === 1 ? '#ef4444' : pwdStrength.level === 2 ? '#f59e0b' : '#10b981'
                                            }} />
                                    </div>
                                    <p className="text-xs mt-1" style={{
                                        color: pwdStrength.level === 1 ? '#f87171' : pwdStrength.level === 2 ? '#fbbf24' : '#34d399'
                                    }}>{pwdStrength.label} password</p>
                                </div>
                            )}
                        </div>

                        {/* Role Selection */}
                        <div className="mb-6">
                            <label className="block text-xs font-medium mb-3" style={{ color: '#94a3b8' }}>Account Type</label>
                            <div className="grid grid-cols-3 gap-2">
                                {Object.entries(roleInfo).map(([key, info]) => (
                                    <button key={key} type="button"
                                        onClick={() => setForm({ ...form, role: key })}
                                        className="p-3 rounded-xl text-center transition-all duration-200"
                                        style={{
                                            background: form.role === key ? 'rgba(99,102,241,0.12)' : 'rgba(10,14,26,0.5)',
                                            border: `1px solid ${form.role === key ? 'rgba(99,102,241,0.3)' : 'rgba(30,39,64,0.8)'}`,
                                            cursor: 'pointer',
                                        }}>
                                        <span className="text-lg block mb-1">{info.icon}</span>
                                        <span className="text-xs font-semibold block"
                                            style={{ color: form.role === key ? '#a5b4fc' : '#94a3b8' }}>
                                            {info.label}
                                        </span>
                                    </button>
                                ))}
                            </div>
                            <p className="text-xs mt-2" style={{ color: '#475569' }}>{roleInfo[form.role].desc}</p>
                        </div>

                        <button type="submit" disabled={loading} className="btn-primary w-full py-3 text-sm">
                            {loading ? (
                                <span className="flex items-center justify-center gap-2">
                                    <svg className="w-4 h-4" style={{ animation: 'spin-slow 1s linear infinite' }} viewBox="0 0 24 24" fill="none">
                                        <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" opacity="0.3" />
                                        <path d="M12 2a10 10 0 019.95 9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                                    </svg>
                                    Creating account...
                                </span>
                            ) : 'Create Account'}
                        </button>
                    </form>

                    <div className="auth-divider my-6"><span>or</span></div>

                    <p className="text-center text-sm" style={{ color: '#64748b' }}>
                        Already have an account?{' '}
                        <Link to="/login" className="font-semibold hover:underline" style={{ color: '#818cf8' }}>
                            Sign In
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
}
