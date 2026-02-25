import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { makePayment, getPayments } from '../services/api';

const paymentMethods = [
    { value: 'Credit Card', icon: '💳' },
    { value: 'Debit Card', icon: '🏧' },
    { value: 'UPI', icon: '📱' },
    { value: 'Net Banking', icon: '🏦' },
    { value: 'Wallet', icon: '👛' },
];

const methodColors = {
    'Credit Card': '#818cf8', 'Debit Card': '#38bdf8',
    'UPI': '#fb7185', 'Net Banking': '#34d399', 'Wallet': '#fbbf24',
};

export default function Payments() {
    const location = useLocation();
    const navigate = useNavigate();
    const [payments, setPayments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [processing, setProcessing] = useState(false);
    const [success, setSuccess] = useState('');
    const [error, setError] = useState('');
    const [form, setForm] = useState({ fineId: '', paymentMethod: '' });

    useEffect(() => {
        if (location.state?.fineId) {
            setForm((f) => ({ ...f, fineId: location.state.fineId.toString() }));
            setShowForm(true);
        }
        fetchPayments();
    }, []);

    const fetchPayments = async () => {
        try {
            const res = await getPayments();
            setPayments(res.data.data || []);
        } catch (err) { console.error(err); }
        finally { setLoading(false); }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(''); setSuccess(''); setProcessing(true);
        try {
            const res = await makePayment({ fineId: parseInt(form.fineId), paymentMethod: form.paymentMethod });
            setSuccess(`Payment successful! Transaction Ref: ${res.data.data.transactionRef}`);
            setShowForm(false);
            setForm({ fineId: '', paymentMethod: '' });
            fetchPayments();
        } catch (err) {
            setError(err.response?.data?.message || 'Payment failed. Please try again.');
        } finally { setProcessing(false); }
    };

    const totalPaid = payments.reduce((s, p) => s + (p.amount || 0), 0);

    return (
        <div className="animate-fade-in">
            {/* Header */}
            <div className="flex items-center justify-between mb-7">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                        style={{ background: 'linear-gradient(135deg, rgba(99,102,241,0.15), rgba(139,92,246,0.1))', border: '1px solid rgba(139,92,246,0.2)' }}>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                            <rect x="2" y="5" width="20" height="14" rx="2" stroke="#a78bfa" strokeWidth="1.5" />
                            <path d="M2 10h20" stroke="#a78bfa" strokeWidth="1.5" />
                            <path d="M6 15h4" stroke="#a78bfa" strokeWidth="1.5" strokeLinecap="round" />
                        </svg>
                    </div>
                    <div>
                        <h1 className="text-xl font-bold" style={{ color: '#e2e8f0' }}>Payments</h1>
                        <p className="text-xs mt-0.5" style={{ color: '#475569' }}>
                            {payments.length} transactions · ₹{totalPaid.toLocaleString()} paid
                        </p>
                    </div>
                </div>
                <button onClick={() => setShowForm(!showForm)} className="btn-primary flex items-center gap-2 px-4 py-2.5 text-sm">
                    {showForm ? (
                        <><svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg> Cancel</>
                    ) : (
                        <><svg width="14" height="14" viewBox="0 0 24 24" fill="none"><rect x="2" y="5" width="20" height="14" rx="2" stroke="currentColor" strokeWidth="1.5" /><path d="M2 10h20" stroke="currentColor" strokeWidth="1.5" /></svg> Make Payment</>
                    )}
                </button>
            </div>

            {/* Alerts */}
            {success && (
                <div className="flex items-center gap-3 px-4 py-3.5 rounded-xl mb-5 animate-fade-in"
                    style={{ background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.2)' }}>
                    <div className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0"
                        style={{ background: 'rgba(16,185,129,0.2)' }}>
                        <svg width="11" height="11" viewBox="0 0 24 24" fill="none"><path d="M5 13l4 4L19 7" stroke="#34d399" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
                    </div>
                    <p className="text-sm font-medium" style={{ color: '#34d399' }}>{success}</p>
                </div>
            )}
            {error && (
                <div className="flex items-center gap-3 px-4 py-3.5 rounded-xl mb-5"
                    style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)' }}>
                    <div className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0"
                        style={{ background: 'rgba(239,68,68,0.2)' }}>
                        <svg width="11" height="11" viewBox="0 0 24 24" fill="none"><path d="M18 6L6 18M6 6l12 12" stroke="#f87171" strokeWidth="2.5" strokeLinecap="round" /></svg>
                    </div>
                    <p className="text-sm font-medium" style={{ color: '#f87171' }}>{error}</p>
                </div>
            )}

            {/* Payment Form */}
            {showForm && (
                <div className="glass-card p-6 mb-6 animate-slide-in">
                    <h2 className="text-sm font-bold mb-5" style={{ color: '#e2e8f0' }}>Process Payment</h2>
                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-medium mb-2" style={{ color: '#94a3b8' }}>Fine ID</label>
                                <input type="number" className="input-field" placeholder="Enter Fine ID"
                                    value={form.fineId}
                                    onChange={(e) => setForm({ ...form, fineId: e.target.value })} required />
                            </div>
                            {location.state?.amount && (
                                <div>
                                    <label className="block text-xs font-medium mb-2" style={{ color: '#94a3b8' }}>Amount Due</label>
                                    <div className="input-field flex items-center" style={{ background: 'rgba(245,158,11,0.05)', borderColor: 'rgba(245,158,11,0.15)' }}>
                                        <span className="text-lg font-bold" style={{ color: '#fbbf24' }}>₹{location.state.amount.toLocaleString()}</span>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Payment Method */}
                        <div>
                            <label className="block text-xs font-medium mb-3" style={{ color: '#94a3b8' }}>Payment Method</label>
                            <div className="grid grid-cols-3 md:grid-cols-5 gap-2">
                                {paymentMethods.map((m) => (
                                    <button key={m.value} type="button"
                                        onClick={() => setForm({ ...form, paymentMethod: m.value })}
                                        className="p-3 rounded-xl text-center transition-all"
                                        style={{
                                            border: `1px solid ${form.paymentMethod === m.value ? methodColors[m.value] + '40' : 'rgba(30,39,64,0.8)'}`,
                                            background: form.paymentMethod === m.value ? methodColors[m.value] + '10' : 'rgba(10,14,26,0.5)',
                                        }}>
                                        <span className="text-xl block mb-1">{m.icon}</span>
                                        <span className="text-[10px] font-medium block"
                                            style={{ color: form.paymentMethod === m.value ? methodColors[m.value] : '#64748b' }}>
                                            {m.value}
                                        </span>
                                    </button>
                                ))}
                            </div>
                        </div>

                        <button type="submit" disabled={processing || !form.fineId || !form.paymentMethod}
                            className="btn-primary w-full py-3 flex items-center justify-center gap-2">
                            {processing ? (
                                <>
                                    <span className="w-4 h-4 rounded-full" style={{ border: '2px solid rgba(255,255,255,0.3)', borderTopColor: 'white', animation: 'spin-slow 1s linear infinite' }} />
                                    Processing...
                                </>
                            ) : '✓ Confirm Payment'}
                        </button>
                    </form>
                </div>
            )}

            {/* History Table */}
            <div className="glass-card overflow-hidden">
                <div className="px-5 py-4" style={{ borderBottom: '1px solid rgba(30,39,64,0.8)' }}>
                    <h3 className="text-sm font-bold" style={{ color: '#e2e8f0' }}>Transaction History</h3>
                </div>
                {loading ? (
                    <div className="flex items-center justify-center h-40">
                        <div className="w-8 h-8 rounded-full" style={{ border: '2px solid rgba(139,92,246,0.3)', borderTopColor: '#8b5cf6', animation: 'spin-slow 1s linear infinite' }} />
                    </div>
                ) : payments.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-14" style={{ color: '#475569' }}>
                        <svg width="36" height="36" viewBox="0 0 24 24" fill="none" className="mb-3">
                            <rect x="2" y="5" width="20" height="14" rx="2" stroke="#2d3748" strokeWidth="1.5" />
                            <path d="M2 10h20" stroke="#2d3748" strokeWidth="1.5" />
                        </svg>
                        <p className="text-sm font-medium" style={{ color: '#94a3b8' }}>No transactions yet</p>
                        <p className="text-xs mt-1">Payments will appear here once processed</p>
                    </div>
                ) : (
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>#</th>
                                <th>Fine ID</th>
                                <th>Amount</th>
                                <th>Method</th>
                                <th>Transaction Ref</th>
                                <th>Date</th>
                            </tr>
                        </thead>
                        <tbody>
                            {payments.map((p, i) => (
                                <tr key={p.id}>
                                    <td className="text-xs" style={{ color: '#475569' }}>{i + 1}</td>
                                    <td className="text-sm font-medium" style={{ color: '#a5b4fc' }}>#{p.fineId}</td>
                                    <td className="font-bold text-sm" style={{ color: '#fbbf24' }}>₹{p.amount?.toLocaleString()}</td>
                                    <td>
                                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium"
                                            style={{ background: 'rgba(139,92,246,0.08)', color: methodColors[p.paymentMethod] || '#a78bfa', border: '1px solid rgba(139,92,246,0.12)' }}>
                                            {paymentMethods.find(m => m.value === p.paymentMethod)?.icon} {p.paymentMethod}
                                        </span>
                                    </td>
                                    <td className="font-mono text-xs" style={{ color: '#64748b' }}>{p.transactionRef}</td>
                                    <td className="text-xs" style={{ color: '#64748b' }}>
                                        {new Date(p.paymentDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
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
