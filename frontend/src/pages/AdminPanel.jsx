import { useState, useEffect } from 'react';
import { getViolations, approveViolation, updateViolationStatus } from '../services/api';

const statusConfig = {
    PENDING: { color: '#fbbf24', bg: 'rgba(245,158,11,0.08)', border: 'rgba(245,158,11,0.2)' },
    APPROVED: { color: '#34d399', bg: 'rgba(16,185,129,0.08)', border: 'rgba(16,185,129,0.2)' },
    REJECTED: { color: '#f87171', bg: 'rgba(239,68,68,0.08)', border: 'rgba(239,68,68,0.2)' },
};

const StatusBadge = ({ status }) => {
    const cfg = statusConfig[status] || {};
    return (
        <span className="inline-flex items-center px-2 py-0.5 rounded-lg text-[10px] font-semibold"
            style={{ color: cfg.color, background: cfg.bg, border: `1px solid ${cfg.border}` }}>
            {status}
        </span>
    );
};

export default function AdminPanel() {
    const [violations, setViolations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('PENDING');
    const [selected, setSelected] = useState(null);
    const [actionLoading, setActionLoading] = useState(null);
    const [fineAmount, setFineAmount] = useState('');

    const fetchViolations = async () => {
        setLoading(true);
        try {
            const res = await getViolations(filter === 'ALL' ? null : filter);
            setViolations(res.data.data || []);
        } catch (err) { console.error(err); }
        finally { setLoading(false); }
    };

    useEffect(() => { fetchViolations(); }, [filter]);

    const openDetail = (v) => {
        setSelected(v);
        setFineAmount(v.suggestedFine?.toString() || '1000');
    };

    const handleApprove = async (id) => {
        const amount = parseFloat(fineAmount);
        if (isNaN(amount) || amount <= 0) { alert('Enter a valid fine amount'); return; }
        setActionLoading('approve');
        try {
            await approveViolation(id, amount);
            fetchViolations();
            setSelected(null);
        } catch (err) { alert(err.response?.data?.message || 'Failed to approve'); }
        finally { setActionLoading(null); }
    };

    const handleReject = async (id) => {
        setActionLoading('reject');
        try {
            await updateViolationStatus(id, 'REJECTED');
            fetchViolations();
            setSelected(null);
        } catch (err) { alert(err.response?.data?.message || 'Failed to reject'); }
        finally { setActionLoading(null); }
    };

    const counts = {
        total: violations.length,
        pending: violations.filter(v => v.status === 'PENDING').length,
        aiVerified: violations.filter(v => v.aiVerified).length,
    };

    return (
        <div className="animate-fade-in">
            {/* Header */}
            <div className="flex items-center justify-between mb-7">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                        style={{ background: 'linear-gradient(135deg, rgba(245,158,11,0.15), rgba(251,146,60,0.1))', border: '1px solid rgba(245,158,11,0.2)' }}>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" stroke="#fbbf24" strokeWidth="1.5" strokeLinejoin="round" />
                            <path d="M9 12l2 2 4-4" stroke="#fbbf24" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                    </div>
                    <div>
                        <h1 className="text-xl font-bold" style={{ color: '#e2e8f0' }}>Admin Review Panel</h1>
                        <p className="text-xs mt-0.5" style={{ color: '#475569' }}>Review AI-verified violations · Set fines · Approve or reject</p>
                    </div>
                </div>
                {/* Filter pills */}
                <div className="flex gap-1.5">
                    {['ALL', 'PENDING', 'APPROVED', 'REJECTED'].map((s) => (
                        <button key={s} onClick={() => setFilter(s)}
                            className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
                            style={{
                                background: filter === s ? 'linear-gradient(135deg, #f59e0b, #f97316)' : 'rgba(10,14,26,0.5)',
                                color: filter === s ? 'white' : '#64748b',
                                border: `1px solid ${filter === s ? 'transparent' : 'rgba(30,39,64,0.8)'}`,
                                boxShadow: filter === s ? '0 4px 12px rgba(245,158,11,0.25)' : 'none',
                            }}>
                            {s}
                        </button>
                    ))}
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-4 mb-6">
                {[
                    {
                        label: 'Total Shown', value: counts.total, color: '#818cf8', bg: 'rgba(99,102,241,0.06)', border: 'rgba(99,102,241,0.12)',
                        svg: <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><rect x="3" y="3" width="7" height="7" rx="1.5" stroke="#818cf8" strokeWidth="1.5" /><rect x="14" y="3" width="7" height="7" rx="1.5" stroke="#818cf8" strokeWidth="1.5" /><rect x="3" y="14" width="7" height="7" rx="1.5" stroke="#818cf8" strokeWidth="1.5" /><rect x="14" y="14" width="7" height="7" rx="1.5" stroke="#818cf8" strokeWidth="1.5" /></svg>
                    },
                    {
                        label: 'Pending Review', value: counts.pending, color: '#fbbf24', bg: 'rgba(245,158,11,0.06)', border: 'rgba(245,158,11,0.12)',
                        svg: <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="#fbbf24" strokeWidth="1.5" /><path d="M12 7v5l3 3" stroke="#fbbf24" strokeWidth="1.5" strokeLinecap="round" /></svg>
                    },
                    {
                        label: 'AI Verified', value: counts.aiVerified, color: '#34d399', bg: 'rgba(16,185,129,0.06)', border: 'rgba(16,185,129,0.12)',
                        svg: <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M12 2a4 4 0 014 4c0 2-2 4-4 6-2-2-4-4-4-6a4 4 0 014-4z" stroke="#34d399" strokeWidth="1.5" /><path d="M12 16v4M8 20h8" stroke="#34d399" strokeWidth="1.5" strokeLinecap="round" /></svg>
                    },
                ].map((s) => (
                    <div key={s.label} className="stat-card flex items-center gap-4" style={{ background: s.bg, borderColor: s.border }}>
                        <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                            style={{ background: s.bg, border: `1px solid ${s.border}`, filter: 'brightness(1.5)' }}>
                            {s.svg}
                        </div>
                        <div>
                            <p className="text-xl font-extrabold" style={{ color: s.color }}>{s.value}</p>
                            <p className="text-xs" style={{ color: '#64748b' }}>{s.label}</p>
                        </div>
                    </div>
                ))}
            </div>

            {/* Violation Cards */}
            {loading ? (
                <div className="flex items-center justify-center h-40">
                    <div className="w-8 h-8 rounded-full" style={{ border: '2px solid rgba(245,158,11,0.3)', borderTopColor: '#f59e0b', animation: 'spin-slow 1s linear infinite' }} />
                </div>
            ) : violations.length === 0 ? (
                <div className="glass-card flex flex-col items-center justify-center py-16" style={{ color: '#475569' }}>
                    <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4"
                        style={{ background: 'rgba(16,185,129,0.06)', border: '1px solid rgba(16,185,129,0.1)' }}>
                        <svg width="30" height="30" viewBox="0 0 24 24" fill="none">
                            <path d="M22 11.08V12a10 10 0 11-5.93-9.14" stroke="#2d3748" strokeWidth="1.5" strokeLinecap="round" />
                            <polyline points="22,4 12,14.01 9,11.01" stroke="#2d3748" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                    </div>
                    <p className="text-sm font-medium" style={{ color: '#94a3b8' }}>All caught up!</p>
                    <p className="text-xs mt-1">No violations to review for this filter</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                    {violations.map((v) => (
                        <div key={v.id}
                            className="glass-card p-0 overflow-hidden cursor-pointer transition-all"
                            style={{ border: '1px solid rgba(30,39,64,0.8)' }}
                            onMouseEnter={e => e.currentTarget.style.borderColor = 'rgba(245,158,11,0.2)'}
                            onMouseLeave={e => e.currentTarget.style.borderColor = 'rgba(30,39,64,0.8)'}
                            onClick={() => openDetail(v)}>
                            <div className="flex">
                                {/* Image thumbnail */}
                                <div className="w-28 flex-shrink-0 overflow-hidden"
                                    style={{ background: 'rgba(10,14,26,0.8)', minHeight: '8rem' }}>
                                    {v.evidenceImage ? (
                                        <img src={`http://localhost:8080/uploads/${v.evidenceImage}`} alt="Evidence"
                                            className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center">
                                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                                                <path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z" stroke="#2d3748" strokeWidth="1.5" strokeLinejoin="round" />
                                                <circle cx="12" cy="13" r="4" stroke="#2d3748" strokeWidth="1.5" />
                                            </svg>
                                        </div>
                                    )}
                                </div>
                                {/* Details */}
                                <div className="flex-1 p-4">
                                    <div className="flex items-center justify-between mb-1.5">
                                        <div className="flex items-center gap-2">
                                            <span className="font-mono font-bold text-sm" style={{ color: '#a5b4fc' }}>{v.plateNumber}</span>
                                            {v.vehicleCategory && (
                                                <span className="px-1.5 py-0.5 rounded text-[10px]"
                                                    style={{ background: 'rgba(30,39,64,0.8)', color: '#64748b' }}>
                                                    {v.vehicleCategory}
                                                </span>
                                            )}
                                        </div>
                                        <StatusBadge status={v.status} />
                                    </div>
                                    <p className="text-sm font-medium mb-1" style={{ color: '#e2e8f0' }}>{v.violationType}</p>
                                    <p className="text-xs mb-1.5" style={{ color: '#475569' }}>
                                        📍 {v.location} · {new Date(v.violationDate).toLocaleDateString('en-IN')}
                                    </p>
                                    {v.reportedByName && (
                                        <p className="text-xs mb-1.5" style={{ color: '#475569' }}>
                                            👤 <span style={{ color: '#94a3b8' }}>{v.reportedByName}</span>
                                        </p>
                                    )}
                                    <div className="flex items-center gap-2">
                                        {v.aiVerified != null && (
                                            <span className="text-xs font-medium px-2 py-0.5 rounded-lg"
                                                style={{
                                                    background: v.aiVerified ? 'rgba(16,185,129,0.08)' : 'rgba(239,68,68,0.08)',
                                                    color: v.aiVerified ? '#34d399' : '#f87171',
                                                    border: `1px solid ${v.aiVerified ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)'}`,
                                                }}>
                                                🤖 {v.aiVerified ? 'Verified' : 'Rejected'} · {((v.aiConfidence || 0) * 100).toFixed(0)}%
                                            </span>
                                        )}
                                        {v.suggestedFine && v.status === 'PENDING' && (
                                            <span className="text-xs font-medium" style={{ color: '#fbbf24' }}>
                                                💰 ₹{v.suggestedFine}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* ── Detail Modal ── */}
            {selected && (
                <div className="fixed inset-0 flex items-center justify-center z-50 p-4"
                    style={{ background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)' }}
                    onClick={() => setSelected(null)}>
                    <div className="max-w-3xl w-full max-h-[90vh] overflow-y-auto glass-card p-0 overflow-hidden animate-fade-in"
                        onClick={(e) => e.stopPropagation()}>
                        {/* Modal Header */}
                        <div className="flex items-center justify-between px-6 py-4 sticky top-0 z-10"
                            style={{ background: 'linear-gradient(to right, rgba(245,158,11,0.12), rgba(249,115,22,0.08))', borderBottom: '1px solid rgba(245,158,11,0.12)' }}>
                            <div>
                                <h2 className="text-base font-bold" style={{ color: '#e2e8f0' }}>Review Violation #{selected.id}</h2>
                                <StatusBadge status={selected.status} />
                            </div>
                            <button onClick={() => setSelected(null)}
                                className="w-8 h-8 rounded-lg flex items-center justify-center"
                                style={{ background: 'rgba(30,39,64,0.8)', color: '#64748b' }}
                                onMouseEnter={e => { e.currentTarget.style.color = '#f87171'; }}
                                onMouseLeave={e => { e.currentTarget.style.color = '#64748b'; }}>
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>
                            </button>
                        </div>
                        <div className="p-6 space-y-5">
                            {/* Evidence — full size */}
                            <div className="rounded-xl overflow-hidden" style={{ border: '1px solid rgba(30,39,64,0.8)' }}>
                                {selected.evidenceImage ? (
                                    <img src={`http://localhost:8080/uploads/${selected.evidenceImage}`} alt="Evidence"
                                        className="w-full max-h-80 object-contain" style={{ background: 'rgba(10,14,26,0.8)' }} />
                                ) : (
                                    <div className="flex flex-col items-center justify-center py-12" style={{ background: 'rgba(10,14,26,0.5)', color: '#2d3748' }}>
                                        <svg width="40" height="40" viewBox="0 0 24 24" fill="none">
                                            <path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z" stroke="currentColor" strokeWidth="1.5" />
                                            <circle cx="12" cy="13" r="4" stroke="currentColor" strokeWidth="1.5" />
                                        </svg>
                                        <p className="text-xs mt-2">No evidence image uploaded</p>
                                    </div>
                                )}
                            </div>

                            {/* AI Analysis */}
                            {selected.aiRemarks && (
                                <div className="p-4 rounded-xl" style={{
                                    background: selected.aiVerified ? 'rgba(16,185,129,0.05)' : 'rgba(239,68,68,0.05)',
                                    border: `1px solid ${selected.aiVerified ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)'}`,
                                }}>
                                    <p className="text-xs font-semibold mb-2" style={{ color: selected.aiVerified ? '#34d399' : '#f87171' }}>
                                        🤖 Gemini AI Analysis — {((selected.aiConfidence || 0) * 100).toFixed(0)}% Confidence
                                    </p>
                                    <div className="w-full h-1.5 rounded-full mb-2" style={{ background: 'rgba(10,14,26,0.5)' }}>
                                        <div className="h-full rounded-full" style={{
                                            width: `${(selected.aiConfidence || 0) * 100}%`,
                                            background: selected.aiVerified ? '#10b981' : '#ef4444',
                                        }} />
                                    </div>
                                    <p className="text-xs leading-relaxed" style={{ color: '#64748b' }}>{selected.aiRemarks}</p>
                                </div>
                            )}

                            {/* Detail grid */}
                            <div className="grid grid-cols-2 gap-2">
                                {[
                                    { label: 'Plate Number', value: selected.plateNumber, mono: true },
                                    { label: 'Owner', value: selected.ownerName },
                                    { label: 'Vehicle Type', value: selected.vehicleCategory || '—' },
                                    { label: 'Violation', value: selected.violationType },
                                    { label: 'Location', value: selected.location },
                                    { label: 'Date & Time', value: new Date(selected.violationDate).toLocaleString('en-IN') },
                                    { label: 'Reported By', value: selected.reportedByName || '—' },
                                    { label: 'Reporter Email', value: selected.reportedByEmail || '—' },
                                ].map((item) => (
                                    <div key={item.label} className="p-3 rounded-xl"
                                        style={{ background: 'rgba(10,14,26,0.5)', border: '1px solid rgba(30,39,64,0.8)' }}>
                                        <p className="text-[10px] mb-0.5" style={{ color: '#475569' }}>{item.label}</p>
                                        <p className="text-sm font-medium" style={{
                                            color: item.mono ? '#a5b4fc' : '#e2e8f0',
                                            fontFamily: item.mono ? 'monospace' : 'inherit',
                                        }}>{item.value}</p>
                                    </div>
                                ))}
                            </div>

                            {/* Admin Actions — only for PENDING */}
                            {selected.status === 'PENDING' && (
                                <div className="p-5 rounded-xl space-y-4"
                                    style={{ background: 'rgba(245,158,11,0.04)', border: '1px solid rgba(245,158,11,0.15)' }}>
                                    <div className="flex items-center gap-2 mb-1">
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                                            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" stroke="#fbbf24" strokeWidth="1.5" strokeLinejoin="round" />
                                        </svg>
                                        <h3 className="text-sm font-bold" style={{ color: '#fbbf24' }}>Admin Decision</h3>
                                    </div>
                                    <div>
                                        <label className="text-xs mb-2 block" style={{ color: '#94a3b8' }}>
                                            Fine Amount (₹)
                                            {selected.suggestedFine && (
                                                <span style={{ color: '#fbbf24' }}> — AI suggested: ₹{selected.suggestedFine}</span>
                                            )}
                                        </label>
                                        <input type="number" min="0" step="100"
                                            className="input-field text-lg font-bold"
                                            placeholder="Enter fine amount"
                                            value={fineAmount}
                                            onChange={(e) => setFineAmount(e.target.value)} />
                                    </div>
                                    <div className="grid grid-cols-2 gap-3">
                                        <button
                                            onClick={() => handleApprove(selected.id)}
                                            disabled={!!actionLoading}
                                            className="btn-success py-3 text-sm font-semibold flex items-center justify-center gap-2">
                                            {actionLoading === 'approve' ? (
                                                <span className="w-4 h-4 rounded-full" style={{ border: '2px solid rgba(255,255,255,0.3)', borderTopColor: 'white', animation: 'spin-slow 1s linear infinite' }} />
                                            ) : (
                                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M20 6L9 17l-5-5" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
                                            )}
                                            Approve & Issue ₹{fineAmount || '0'} Fine
                                        </button>
                                        <button
                                            onClick={() => handleReject(selected.id)}
                                            disabled={!!actionLoading}
                                            className="btn-danger py-3 text-sm font-semibold flex items-center justify-center gap-2">
                                            {actionLoading === 'reject' ? (
                                                <span className="w-4 h-4 rounded-full" style={{ border: '2px solid rgba(255,255,255,0.3)', borderTopColor: 'white', animation: 'spin-slow 1s linear infinite' }} />
                                            ) : (
                                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>
                                            )}
                                            Reject Violation
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
