import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getFines } from '../services/api';

const PayIcon = () => (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
        <path d="M12 2v20M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
);

export default function Fines() {
    const [fines, setFines] = useState([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        getFines()
            .then((res) => setFines(res.data.data || []))
            .catch(() => { })
            .finally(() => setLoading(false));
    }, []);

    const totalAmount = fines.reduce((s, f) => s + (f.amount || 0), 0);
    const unpaidAmount = fines.filter(f => f.paymentStatus === 'UNPAID').reduce((s, f) => s + (f.amount || 0), 0);
    const paidCount = fines.filter(f => f.paymentStatus === 'PAID').length;
    const unpaidCount = fines.filter(f => f.paymentStatus === 'UNPAID').length;

    return (
        <div className="animate-fade-in">
            {/* Header */}
            <div className="flex items-center gap-3 mb-7">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                    style={{ background: 'linear-gradient(135deg, rgba(16,185,129,0.15), rgba(52,211,153,0.1))', border: '1px solid rgba(16,185,129,0.2)' }}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                        <path d="M12 2v20M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6" stroke="#34d399" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                </div>
                <div>
                    <h1 className="text-xl font-bold" style={{ color: '#e2e8f0' }}>Fines</h1>
                    <p className="text-xs mt-0.5" style={{ color: '#475569' }}>Track all fines and payment status</p>
                </div>
            </div>

            {/* Stats */}
            {!loading && fines.length > 0 && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                    {[
                        { label: 'Total Fines', value: fines.length, color: '#818cf8', bg: 'rgba(99,102,241,0.06)', border: 'rgba(99,102,241,0.12)' },
                        { label: 'Paid', value: paidCount, color: '#34d399', bg: 'rgba(16,185,129,0.06)', border: 'rgba(16,185,129,0.12)' },
                        { label: 'Unpaid', value: unpaidCount, color: '#f87171', bg: 'rgba(239,68,68,0.06)', border: 'rgba(239,68,68,0.12)' },
                        { label: 'Outstanding', value: `₹${unpaidAmount.toLocaleString()}`, color: '#fbbf24', bg: 'rgba(245,158,11,0.06)', border: 'rgba(245,158,11,0.12)' },
                    ].map((s) => (
                        <div key={s.label} className="stat-card" style={{ background: s.bg, borderColor: s.border }}>
                            <p className="text-xl font-extrabold" style={{ color: s.color }}>{s.value}</p>
                            <p className="text-xs mt-1" style={{ color: '#64748b' }}>{s.label}</p>
                        </div>
                    ))}
                </div>
            )}

            {/* Table */}
            <div className="glass-card overflow-hidden">
                {loading ? (
                    <div className="flex items-center justify-center h-40">
                        <div className="w-8 h-8 rounded-full" style={{ border: '2px solid rgba(16,185,129,0.3)', borderTopColor: '#10b981', animation: 'spin-slow 1s linear infinite' }} />
                    </div>
                ) : fines.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16" style={{ color: '#475569' }}>
                        <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4"
                            style={{ background: 'rgba(16,185,129,0.06)', border: '1px solid rgba(16,185,129,0.1)' }}>
                            <svg width="30" height="30" viewBox="0 0 24 24" fill="none">
                                <path d="M12 2v20M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6" stroke="#2d3748" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                        </div>
                        <p className="text-sm font-medium" style={{ color: '#94a3b8' }}>No fines issued yet</p>
                        <p className="text-xs mt-1">Fines appear here once violations are approved</p>
                    </div>
                ) : (
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>#</th>
                                <th>Plate Number</th>
                                <th>Violation</th>
                                <th>Amount</th>
                                <th>Issued Date</th>
                                <th>Status</th>
                                <th>Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {fines.map((f, i) => (
                                <tr key={f.id}>
                                    <td className="text-xs" style={{ color: '#475569' }}>{i + 1}</td>
                                    <td>
                                        <span className="font-mono font-bold text-sm" style={{ color: '#a5b4fc' }}>{f.plateNumber}</span>
                                    </td>
                                    <td className="text-sm" style={{ color: '#e2e8f0' }}>{f.violationType}</td>
                                    <td>
                                        <span className="font-bold text-sm" style={{ color: '#fbbf24' }}>₹{f.amount?.toLocaleString()}</span>
                                    </td>
                                    <td className="text-xs" style={{ color: '#64748b' }}>
                                        {new Date(f.issuedDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                                    </td>
                                    <td>
                                        <span className={`badge ${f.paymentStatus === 'PAID' ? 'badge-paid' : 'badge-unpaid'}`}>
                                            {f.paymentStatus === 'PAID' ? '✓ Paid' : '⏳ Unpaid'}
                                        </span>
                                    </td>
                                    <td>
                                        {f.paymentStatus === 'UNPAID' ? (
                                            <button
                                                onClick={() => navigate('/payments', { state: { fineId: f.id, amount: f.amount } })}
                                                className="btn-success text-xs px-3 py-1.5 flex items-center gap-1.5">
                                                <PayIcon /> Pay Now
                                            </button>
                                        ) : (
                                            <span className="text-xs font-medium" style={{ color: '#34d399' }}>✓ Cleared</span>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
}
