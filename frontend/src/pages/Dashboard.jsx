import { useState, useEffect } from 'react';
import { getDashboardStats } from '../services/api';
import { useAuth } from '../context/AuthContext';

const statCards = [
    {
        key: 'totalViolations', label: 'Total Violations',
        gradient: 'linear-gradient(135deg, #6366f1, #818cf8)',
        bg: 'rgba(99,102,241,0.06)',
        border: 'rgba(99,102,241,0.12)',
        svg: <svg width="22" height="22" viewBox="0 0 24 24" fill="none"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" stroke="white" strokeWidth="1.5" strokeLinejoin="round" /><path d="M12 9v4m0 4h.01" stroke="white" strokeWidth="2" strokeLinecap="round" /></svg>,
    },
    {
        key: 'pendingViolations', label: 'Pending Review',
        gradient: 'linear-gradient(135deg, #f59e0b, #fbbf24)',
        bg: 'rgba(245,158,11,0.06)',
        border: 'rgba(245,158,11,0.12)',
        svg: <svg width="22" height="22" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="white" strokeWidth="1.5" /><path d="M12 6v6l4 2" stroke="white" strokeWidth="1.5" strokeLinecap="round" /></svg>,
    },
    {
        key: 'paidFines', label: 'Fines Paid',
        gradient: 'linear-gradient(135deg, #10b981, #34d399)',
        bg: 'rgba(16,185,129,0.06)',
        border: 'rgba(16,185,129,0.12)',
        svg: <svg width="22" height="22" viewBox="0 0 24 24" fill="none"><path d="M22 11.08V12a10 10 0 11-5.93-9.14" stroke="white" strokeWidth="1.5" strokeLinecap="round" /><polyline points="22,4 12,14.01 9,11.01" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>,
    },
    {
        key: 'unpaidFines', label: 'Fines Unpaid',
        gradient: 'linear-gradient(135deg, #ef4444, #f87171)',
        bg: 'rgba(239,68,68,0.06)',
        border: 'rgba(239,68,68,0.12)',
        svg: <svg width="22" height="22" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="white" strokeWidth="1.5" /><path d="M15 9l-6 6M9 9l6 6" stroke="white" strokeWidth="1.5" strokeLinecap="round" /></svg>,
    },
];

const fineSchedule = [
    { type: 'Over Speed', base: '₹1,000', color: '#f87171' },
    { type: 'No Helmet', base: '₹500', color: '#fbbf24' },
    { type: 'Signal Jump', base: '₹1,500', color: '#a78bfa' },
    { type: 'Illegal Parking', base: '₹500', color: '#38bdf8' },
    { type: 'Wrong Way', base: '₹2,000', color: '#fb7185' },
    { type: 'No Seatbelt', base: '₹1,000', color: '#fb923c' },
    { type: 'Triple Riding', base: '₹1,000', color: '#22d3ee' },
    { type: 'Using Mobile', base: '₹1,500', color: '#a78bfa' },
    { type: 'Drunk Driving', base: '₹5,000', color: '#ef4444' },
    { type: 'No License Plate', base: '₹2,000', color: '#2dd4bf' },
    { type: 'Overloading', base: '₹2,500', color: '#facc15' },
    { type: 'Lane Violation', base: '₹1,000', color: '#818cf8' },
];

const vehicleMultipliers = [
    { type: 'Two Wheeler', multiplier: '0.8×', icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><circle cx="5" cy="17" r="3" stroke="#818cf8" strokeWidth="1.5" /><circle cx="19" cy="17" r="3" stroke="#818cf8" strokeWidth="1.5" /><path d="M5 17l4-8h4l2 4h4" stroke="#818cf8" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg> },
    { type: 'Three Wheeler', multiplier: '1.0×', icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><circle cx="6" cy="18" r="2" stroke="#818cf8" strokeWidth="1.5" /><circle cx="18" cy="18" r="2" stroke="#818cf8" strokeWidth="1.5" /><path d="M6 18h-2V9l4-4h6l4 4v9h-2" stroke="#818cf8" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg> },
    { type: 'Four Wheeler', multiplier: '1.2×', icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M5 17h14M7 9l2-4h6l2 4" stroke="#818cf8" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /><rect x="3" y="9" width="18" height="8" rx="2" stroke="#818cf8" strokeWidth="1.5" /><circle cx="7" cy="17" r="1.5" stroke="#818cf8" strokeWidth="1.5" /><circle cx="17" cy="17" r="1.5" stroke="#818cf8" strokeWidth="1.5" /></svg> },
    { type: 'Heavy Vehicle', multiplier: '1.5×', icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><rect x="1" y="6" width="15" height="12" rx="2" stroke="#818cf8" strokeWidth="1.5" /><path d="M16 10h4l3 4v4h-7V10z" stroke="#818cf8" strokeWidth="1.5" strokeLinejoin="round" /><circle cx="6" cy="18" r="2" stroke="#818cf8" strokeWidth="1.5" /><circle cx="19" cy="18" r="2" stroke="#818cf8" strokeWidth="1.5" /></svg> },
];

const pipelineSteps = [
    { step: '01', title: 'Upload Evidence', desc: 'Officer captures and uploads violation photo with location data', color: 'linear-gradient(135deg, #0ea5e9, #38bdf8)' },
    { step: '02', title: 'AI Analysis', desc: 'Gemini AI performs multi-factor image verification and classification', color: 'linear-gradient(135deg, #8b5cf6, #a78bfa)' },
    { step: '03', title: 'Admin Review', desc: 'Human review of AI-verified cases ensures accuracy before action', color: 'linear-gradient(135deg, #f59e0b, #fbbf24)' },
    { step: '04', title: 'Fine Issued', desc: 'Automated fine calculation based on violation type and vehicle class', color: 'linear-gradient(135deg, #10b981, #34d399)' },
];

export default function Dashboard() {
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const { user } = useAuth();

    useEffect(() => {
        getDashboardStats()
            .then((res) => setStats(res.data.data))
            .catch(() => { })
            .finally(() => setLoading(false));
    }, []);

    const hour = new Date().getHours();
    const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-10 h-10 rounded-full" style={{ border: '2px solid rgba(99,102,241,0.3)', borderTopColor: '#6366f1', animation: 'spin-slow 1s linear infinite' }} />
                    <span className="text-sm" style={{ color: '#64748b' }}>Loading dashboard...</span>
                </div>
            </div>
        );
    }

    return (
        <div className="animate-fade-in">
            {/* Header */}
            <div className="mb-8">
                <div className="flex items-center gap-4 mb-1">
                    <div className="w-11 h-11 rounded-2xl flex items-center justify-center"
                        style={{ background: 'linear-gradient(135deg, rgba(99,102,241,0.12), rgba(14,165,233,0.08))', border: '1px solid rgba(99,102,241,0.15)' }}>
                        <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                            <rect x="3" y="3" width="7" height="7" rx="2" stroke="#818cf8" strokeWidth="1.5" />
                            <rect x="14" y="3" width="7" height="7" rx="2" stroke="#818cf8" strokeWidth="1.5" />
                            <rect x="3" y="14" width="7" height="7" rx="2" stroke="#818cf8" strokeWidth="1.5" />
                            <rect x="14" y="14" width="7" height="7" rx="2" stroke="#818cf8" strokeWidth="1.5" />
                        </svg>
                    </div>
                    <div>
                        <h1 className="text-xl font-bold" style={{ color: '#e2e8f0' }}>
                            {greeting}, <span className="gradient-text">{user?.name?.split(' ')[0] || 'there'}</span>
                        </h1>
                        <p className="text-xs mt-0.5" style={{ color: '#475569' }}>
                            Here's your traffic violation system overview
                        </p>
                    </div>
                </div>
            </div>

            {/* Stat Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                {statCards.map((card, i) => (
                    <div key={card.key}
                        className="stat-card"
                        style={{ background: card.bg, borderColor: card.border, animationDelay: `${i * 0.08}s` }}>
                        <div className="flex items-center justify-between mb-4">
                            <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                                style={{ background: card.gradient, boxShadow: `0 4px 14px ${card.border}` }}>
                                {card.svg}
                            </div>
                            <span className="text-3xl font-extrabold" style={{ color: '#f1f5f9', letterSpacing: '-0.02em' }}>
                                {stats?.[card.key] ?? 0}
                            </span>
                        </div>
                        <p className="text-xs font-medium" style={{ color: '#64748b' }}>{card.label}</p>
                    </div>
                ))}
            </div>

            {/* Fine Schedule + Vehicle Multiplier */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mb-6">
                {/* Fine Schedule */}
                <div className="lg:col-span-2 glass-card p-6">
                    <div className="flex items-center gap-3 mb-5">
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center"
                            style={{ background: 'rgba(139,92,246,0.1)', border: '1px solid rgba(139,92,246,0.15)' }}>
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                                <path d="M12 2v20M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6" stroke="#a78bfa" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                        </div>
                        <div>
                            <h2 className="text-sm font-bold" style={{ color: '#e2e8f0' }}>Fine Schedule</h2>
                            <p className="text-[10px]" style={{ color: '#475569' }}>Base amounts for each violation type</p>
                        </div>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                        {fineSchedule.map((item) => (
                            <div key={item.type} className="p-3 rounded-xl transition-all duration-200"
                                style={{ background: 'rgba(10,14,26,0.5)', border: '1px solid rgba(30,39,64,0.7)' }}
                                onMouseEnter={e => e.currentTarget.style.borderColor = `${item.color}33`}
                                onMouseLeave={e => e.currentTarget.style.borderColor = 'rgba(30,39,64,0.7)'}>
                                <div className="flex items-center gap-2 mb-2">
                                    <div className="w-1.5 h-1.5 rounded-full" style={{ background: item.color }} />
                                    <span className="text-[11px] font-medium" style={{ color: '#94a3b8' }}>{item.type}</span>
                                </div>
                                <span className="text-sm font-bold" style={{ color: item.color }}>{item.base}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Vehicle Multiplier */}
                <div className="glass-card p-6">
                    <div className="flex items-center gap-3 mb-5">
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center"
                            style={{ background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.15)' }}>
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                                <path d="M5 17h14M7 9l2-4h6l2 4" stroke="#818cf8" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                                <rect x="3" y="9" width="18" height="8" rx="2" stroke="#818cf8" strokeWidth="1.5" />
                            </svg>
                        </div>
                        <div>
                            <h2 className="text-sm font-bold" style={{ color: '#e2e8f0' }}>Multipliers</h2>
                            <p className="text-[10px]" style={{ color: '#475569' }}>By vehicle class</p>
                        </div>
                    </div>
                    <div className="space-y-2">
                        {vehicleMultipliers.map((vm) => (
                            <div key={vm.type} className="flex items-center justify-between p-3 rounded-xl transition-all"
                                style={{ background: 'rgba(10,14,26,0.5)', border: '1px solid rgba(30,39,64,0.7)' }}>
                                <div className="flex items-center gap-3">
                                    {vm.icon}
                                    <span className="text-xs font-medium" style={{ color: '#94a3b8' }}>{vm.type}</span>
                                </div>
                                <span className="text-sm font-bold" style={{
                                    color: vm.multiplier === '1.5×' ? '#f59e0b' : vm.multiplier === '1.2×' ? '#818cf8' : '#64748b'
                                }}>{vm.multiplier}</span>
                            </div>
                        ))}
                    </div>
                    <div className="mt-4 p-3 rounded-lg" style={{ background: 'rgba(99,102,241,0.04)', border: '1px solid rgba(99,102,241,0.08)' }}>
                        <p className="text-[10px] leading-relaxed" style={{ color: '#475569' }}>
                            <span style={{ color: '#818cf8' }}>Formula:</span> Fine = Base × Multiplier. Heavy vehicles incur 1.5× the base fine amount.
                        </p>
                    </div>
                </div>
            </div>

            {/* AI Pipeline */}
            <div className="glass-card p-6">
                <div className="flex items-center gap-3 mb-6">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center"
                        style={{ background: 'rgba(14,165,233,0.1)', border: '1px solid rgba(14,165,233,0.15)' }}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                            <path d="M12 2a4 4 0 014 4c0 1.95-2 4-4 6-2-2-4-4.05-4-6a4 4 0 014-4z" stroke="#38bdf8" strokeWidth="1.5" />
                            <path d="M4.93 10.93l2.83 2.83M16.24 13.76l2.83-2.83M12 16v4M8 20h8" stroke="#38bdf8" strokeWidth="1.5" strokeLinecap="round" />
                        </svg>
                    </div>
                    <div>
                        <h2 className="text-sm font-bold" style={{ color: '#e2e8f0' }}>AI Verification Pipeline</h2>
                        <p className="text-[10px]" style={{ color: '#475569' }}>How violations are processed end-to-end</p>
                    </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                    {pipelineSteps.map((s, i) => (
                        <div key={s.step} className="pipeline-step relative" style={{ animationDelay: `${i * 0.1}s` }}>
                            {/* Connector line between steps */}
                            {i < pipelineSteps.length - 1 && (
                                <div className="hidden md:block absolute top-1/2 -right-2 w-3.5 h-px" style={{ background: 'rgba(30,39,64,0.8)' }}>
                                    <div className="absolute right-0 top-1/2 -translate-y-1/2 w-1 h-1 rounded-full" style={{ background: '#334155' }} />
                                </div>
                            )}
                            <div className="flex items-center gap-3 mb-3">
                                <div className="w-8 h-8 rounded-lg flex items-center justify-center text-[11px] font-bold text-white"
                                    style={{ background: s.color, boxShadow: `0 4px 12px ${s.color.includes('#0ea5e9') ? 'rgba(14,165,233,0.2)' : s.color.includes('#8b5cf6') ? 'rgba(139,92,246,0.2)' : s.color.includes('#f59e0b') ? 'rgba(245,158,11,0.2)' : 'rgba(16,185,129,0.2)'}` }}>
                                    {s.step}
                                </div>
                                <h3 className="text-xs font-semibold" style={{ color: '#e2e8f0' }}>{s.title}</h3>
                            </div>
                            <p className="text-[11px] leading-relaxed" style={{ color: '#64748b' }}>{s.desc}</p>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
