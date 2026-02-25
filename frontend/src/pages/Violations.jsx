import { useState, useEffect } from 'react';
import { getViolations } from '../services/api';

const statusFilters = ['ALL', 'PENDING', 'APPROVED', 'REJECTED'];

const statusConfig = {
    PENDING: { label: 'Pending', color: '#fbbf24', bg: 'rgba(245,158,11,0.08)', border: 'rgba(245,158,11,0.15)' },
    APPROVED: { label: 'Approved', color: '#34d399', bg: 'rgba(16,185,129,0.08)', border: 'rgba(16,185,129,0.15)' },
    REJECTED: { label: 'Rejected', color: '#f87171', bg: 'rgba(239,68,68,0.08)', border: 'rgba(239,68,68,0.15)' },
};

const StatusBadge = ({ status }) => {
    const cfg = statusConfig[status] || {};
    return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-semibold"
            style={{ color: cfg.color, background: cfg.bg, border: `1px solid ${cfg.border}` }}>
            {status}
        </span>
    );
};

export default function Violations() {
    const [violations, setViolations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('ALL');
    const [selected, setSelected] = useState(null);

    const fetchViolations = async () => {
        setLoading(true);
        try {
            const res = await getViolations(filter === 'ALL' ? null : filter);
            setViolations(res.data.data || []);
        } catch (err) { console.error(err); }
        finally { setLoading(false); }
    };

    useEffect(() => { fetchViolations(); }, [filter]);

    const counts = {
        total: violations.length,
        pending: violations.filter(v => v.status === 'PENDING').length,
        approved: violations.filter(v => v.status === 'APPROVED').length,
        rejected: violations.filter(v => v.status === 'REJECTED').length,
    };

    return (
        <div className="animate-fade-in">
            {/* Header */}
            <div className="flex items-center justify-between mb-7">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                        style={{ background: 'linear-gradient(135deg, rgba(239,68,68,0.12), rgba(245,158,11,0.08))', border: '1px solid rgba(239,68,68,0.18)' }}>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                            <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" stroke="#f87171" strokeWidth="1.5" strokeLinejoin="round" />
                            <path d="M12 9v4m0 4h.01" stroke="#f87171" strokeWidth="2" strokeLinecap="round" />
                        </svg>
                    </div>
                    <div>
                        <h1 className="text-xl font-bold" style={{ color: '#e2e8f0' }}>My Violations</h1>
                        <p className="text-xs mt-0.5" style={{ color: '#475569' }}>Track reported violation statuses</p>
                    </div>
                </div>
                {/* Filter Pills */}
                <div className="flex gap-1.5">
                    {statusFilters.map((s) => (
                        <button key={s} onClick={() => setFilter(s)}
                            className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
                            style={{
                                background: filter === s ? 'linear-gradient(135deg, #6366f1, #8b5cf6)' : 'rgba(10,14,26,0.5)',
                                color: filter === s ? 'white' : '#64748b',
                                border: `1px solid ${filter === s ? 'transparent' : 'rgba(30,39,64,0.8)'}`,
                                boxShadow: filter === s ? '0 4px 12px rgba(99,102,241,0.25)' : 'none',
                            }}>
                            {s}
                        </button>
                    ))}
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-4 gap-3 mb-6">
                {[
                    { label: 'Total', value: counts.total, color: '#818cf8', bg: 'rgba(99,102,241,0.06)', border: 'rgba(99,102,241,0.12)' },
                    { label: 'Pending', value: counts.pending, color: '#fbbf24', bg: 'rgba(245,158,11,0.06)', border: 'rgba(245,158,11,0.12)' },
                    { label: 'Approved', value: counts.approved, color: '#34d399', bg: 'rgba(16,185,129,0.06)', border: 'rgba(16,185,129,0.12)' },
                    { label: 'Rejected', value: counts.rejected, color: '#f87171', bg: 'rgba(239,68,68,0.06)', border: 'rgba(239,68,68,0.12)' },
                ].map((s) => (
                    <div key={s.label} className="stat-card" style={{ background: s.bg, borderColor: s.border }}>
                        <p className="text-2xl font-extrabold" style={{ color: s.color }}>{s.value}</p>
                        <p className="text-xs mt-1" style={{ color: '#64748b' }}>{s.label}</p>
                    </div>
                ))}
            </div>

            {/* Cards */}
            <div className="space-y-3">
                {loading ? (
                    <div className="flex items-center justify-center h-40">
                        <div className="w-8 h-8 rounded-full" style={{ border: '2px solid rgba(239,68,68,0.3)', borderTopColor: '#ef4444', animation: 'spin-slow 1s linear infinite' }} />
                    </div>
                ) : violations.length === 0 ? (
                    <div className="glass-card flex flex-col items-center justify-center py-16" style={{ color: '#475569' }}>
                        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" className="mb-3">
                            <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" stroke="#2d3748" strokeWidth="1.5" strokeLinejoin="round" />
                            <path d="M12 9v4m0 4h.01" stroke="#2d3748" strokeWidth="2" strokeLinecap="round" />
                        </svg>
                        <p className="text-sm font-medium" style={{ color: '#94a3b8' }}>No violations found</p>
                        <p className="text-xs mt-1">Try a different status filter or report a new violation</p>
                    </div>
                ) : violations.map((v) => (
                    <div key={v.id}
                        className="glass-card p-0 overflow-hidden cursor-pointer transition-all"
                        style={{ border: '1px solid rgba(30,39,64,0.8)' }}
                        onMouseEnter={e => e.currentTarget.style.borderColor = 'rgba(99,102,241,0.2)'}
                        onMouseLeave={e => e.currentTarget.style.borderColor = 'rgba(30,39,64,0.8)'}
                        onClick={() => setSelected(v)}>
                        <div className="flex">
                            {/* Image */}
                            <div className="w-28 flex-shrink-0 overflow-hidden"
                                style={{ background: 'rgba(10,14,26,0.8)', minHeight: '7rem' }}>
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
                            {/* Info */}
                            <div className="flex-1 p-4">
                                <div className="flex items-center justify-between mb-1">
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
                                <p className="text-xs mb-2" style={{ color: '#475569' }}>
                                    📍 {v.location} · {new Date(v.violationDate).toLocaleDateString('en-IN')}
                                </p>
                                {v.aiVerified != null && (
                                    <span className="inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-lg"
                                        style={{
                                            background: v.aiVerified ? 'rgba(16,185,129,0.08)' : 'rgba(239,68,68,0.08)',
                                            color: v.aiVerified ? '#34d399' : '#f87171',
                                            border: `1px solid ${v.aiVerified ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)'}`,
                                        }}>
                                        🤖 AI {v.aiVerified ? 'Verified' : 'Rejected'} · {((v.aiConfidence || 0) * 100).toFixed(0)}%
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Detail Modal */}
            {selected && (
                <div className="fixed inset-0 flex items-center justify-center z-50 p-4"
                    style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(8px)' }}
                    onClick={() => setSelected(null)}>
                    <div className="max-w-2xl w-full max-h-[90vh] overflow-y-auto animate-fade-in glass-card p-0 overflow-hidden"
                        onClick={(e) => e.stopPropagation()}>
                        {/* Modal header */}
                        <div className="flex items-center justify-between px-6 py-4 sticky top-0 z-10"
                            style={{ background: 'rgba(7,10,20,0.95)', borderBottom: '1px solid rgba(30,39,64,0.8)' }}>
                            <div>
                                <h2 className="text-base font-bold" style={{ color: '#e2e8f0' }}>Violation #{selected.id}</h2>
                                <StatusBadge status={selected.status} />
                            </div>
                            <button onClick={() => setSelected(null)}
                                className="w-8 h-8 rounded-lg flex items-center justify-center transition-all"
                                style={{ background: 'rgba(30,39,64,0.8)', color: '#64748b' }}
                                onMouseEnter={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.1)'; e.currentTarget.style.color = '#f87171'; }}
                                onMouseLeave={e => { e.currentTarget.style.background = 'rgba(30,39,64,0.8)'; e.currentTarget.style.color = '#64748b'; }}>
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>
                            </button>
                        </div>
                        <div className="p-6 space-y-4">
                            {/* Status banner */}
                            <div className="p-4 rounded-xl" style={{
                                background: statusConfig[selected.status]?.bg || 'rgba(30,39,64,0.5)',
                                border: `1px solid ${statusConfig[selected.status]?.border || 'rgba(30,39,64,0.8)'}`,
                            }}>
                                <p className="text-sm font-semibold" style={{ color: statusConfig[selected.status]?.color }}>
                                    Status: {selected.status}
                                </p>
                                <p className="text-xs mt-0.5" style={{ color: '#475569' }}>
                                    {selected.status === 'PENDING' && 'Your report is awaiting admin review'}
                                    {selected.status === 'APPROVED' && 'Report accepted — a fine has been issued'}
                                    {selected.status === 'REJECTED' && 'Report was reviewed and rejected'}
                                </p>
                            </div>
                            {/* Evidence */}
                            <div className="rounded-xl overflow-hidden" style={{ border: '1px solid rgba(30,39,64,0.8)' }}>
                                {selected.evidenceImage ? (
                                    <img src={`http://localhost:8080/uploads/${selected.evidenceImage}`} alt="Evidence"
                                        className="w-full max-h-64 object-contain" style={{ background: 'rgba(10,14,26,0.8)' }} />
                                ) : (
                                    <div className="flex flex-col items-center justify-center py-10" style={{ background: 'rgba(10,14,26,0.5)', color: '#2d3748' }}>
                                        <svg width="36" height="36" viewBox="0 0 24 24" fill="none">
                                            <path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z" stroke="currentColor" strokeWidth="1.5" />
                                            <circle cx="12" cy="13" r="4" stroke="currentColor" strokeWidth="1.5" />
                                        </svg>
                                        <p className="text-xs mt-2">No evidence image</p>
                                    </div>
                                )}
                            </div>
                            {/* AI Analysis */}
                            {selected.aiVerified != null && (
                                <div className="p-4 rounded-xl" style={{
                                    background: selected.aiVerified ? 'rgba(16,185,129,0.05)' : 'rgba(239,68,68,0.05)',
                                    border: `1px solid ${selected.aiVerified ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)'}`,
                                }}>
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="text-xs font-semibold" style={{ color: selected.aiVerified ? '#34d399' : '#f87171' }}>
                                            🤖 AI Confidence: {((selected.aiConfidence || 0) * 100).toFixed(0)}%
                                        </span>
                                    </div>
                                    <div className="w-full h-1.5 rounded-full mb-2" style={{ background: 'rgba(10,14,26,0.5)' }}>
                                        <div className="h-full rounded-full transition-all duration-700"
                                            style={{ width: `${(selected.aiConfidence || 0) * 100}%`, background: selected.aiVerified ? '#10b981' : '#ef4444' }} />
                                    </div>
                                    {selected.aiRemarks && (
                                        <p className="text-xs leading-relaxed" style={{ color: '#64748b' }}>{selected.aiRemarks}</p>
                                    )}
                                </div>
                            )}
                            {/* Details grid */}
                            <div className="grid grid-cols-2 gap-2">
                                {[
                                    { label: 'Plate Number', value: selected.plateNumber, highlight: true },
                                    { label: 'Owner', value: selected.ownerName },
                                    { label: 'Vehicle Type', value: selected.vehicleCategory || '—' },
                                    { label: 'Violation', value: selected.violationType },
                                    { label: 'Location', value: selected.location },
                                    { label: 'Date & Time', value: new Date(selected.violationDate).toLocaleString('en-IN') },
                                ].map((item) => (
                                    <div key={item.label} className="p-3 rounded-xl"
                                        style={{ background: 'rgba(10,14,26,0.5)', border: '1px solid rgba(30,39,64,0.8)' }}>
                                        <p className="text-[10px] mb-1" style={{ color: '#475569' }}>{item.label}</p>
                                        <p className="text-sm font-medium" style={{ color: item.highlight ? '#a5b4fc' : '#e2e8f0', fontFamily: item.highlight ? 'monospace' : 'inherit' }}>
                                            {item.value}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
