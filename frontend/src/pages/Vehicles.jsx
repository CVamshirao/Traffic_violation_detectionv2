import { useState, useEffect } from 'react';
import { getVehicles, addVehicle, updateVehicle, deleteVehicle } from '../services/api';

const vehicleTypes = ['Car', 'Motorcycle', 'Truck', 'Bus', 'Auto-rickshaw', 'Bicycle', 'Other'];

const typeIcon = (type) => {
    const icons = { Car: '🚗', Motorcycle: '🏍️', Truck: '🚛', Bus: '🚌', 'Auto-rickshaw': '🛺', Bicycle: '🚲', Other: '🚙' };
    return icons[type] || '🚘';
};

function PageHeader({ count }) {
    return (
        <div className="flex items-center justify-between mb-7">
            <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                    style={{ background: 'linear-gradient(135deg, rgba(99,102,241,0.15), rgba(14,165,233,0.1))', border: '1px solid rgba(99,102,241,0.2)' }}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                        <path d="M5 17h14M7 9l2-4h6l2 4" stroke="#818cf8" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                        <rect x="3" y="9" width="18" height="8" rx="2" stroke="#818cf8" strokeWidth="1.5" />
                        <circle cx="7" cy="17" r="1.5" stroke="#818cf8" strokeWidth="1.5" />
                        <circle cx="17" cy="17" r="1.5" stroke="#818cf8" strokeWidth="1.5" />
                    </svg>
                </div>
                <div>
                    <h1 className="text-xl font-bold" style={{ color: '#e2e8f0' }}>My Vehicles</h1>
                    <p className="text-xs mt-0.5" style={{ color: '#475569' }}>
                        {count} registered vehicle{count !== 1 ? 's' : ''}
                    </p>
                </div>
            </div>
        </div>
    );
}

export default function Vehicles() {
    const [vehicles, setVehicles] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [editId, setEditId] = useState(null);
    const [form, setForm] = useState({ plateNumber: '', ownerName: '', vehicleType: '' });
    const [saving, setSaving] = useState(false);

    const fetchVehicles = async () => {
        try {
            const res = await getVehicles();
            setVehicles(res.data.data || []);
        } catch (err) { console.error(err); }
        finally { setLoading(false); }
    };

    useEffect(() => { fetchVehicles(); }, []);

    const openAdd = () => {
        setForm({ plateNumber: '', ownerName: '', vehicleType: '' });
        setEditId(null);
        setShowForm(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            if (editId) await updateVehicle(editId, form);
            else await addVehicle(form);
            setShowForm(false);
            setEditId(null);
            fetchVehicles();
        } catch (err) {
            alert(err.response?.data?.message || 'Error saving vehicle');
        } finally { setSaving(false); }
    };

    const handleEdit = (v) => {
        setForm({ plateNumber: v.plateNumber, ownerName: v.ownerName, vehicleType: v.vehicleType });
        setEditId(v.id);
        setShowForm(true);
    };

    const handleDelete = async (id) => {
        if (!confirm('Delete this vehicle?')) return;
        try { await deleteVehicle(id); fetchVehicles(); }
        catch (err) { alert(err.response?.data?.message || 'Error deleting vehicle'); }
    };

    return (
        <div className="animate-fade-in">
            <PageHeader count={vehicles.length} />

            <div className="flex justify-end mb-5">
                <button
                    onClick={showForm ? () => setShowForm(false) : openAdd}
                    className="btn-primary flex items-center gap-2 px-4 py-2.5 text-sm">
                    {showForm ? (
                        <>
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>
                            Cancel
                        </>
                    ) : (
                        <>
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>
                            Add Vehicle
                        </>
                    )}
                </button>
            </div>

            {/* Form */}
            {showForm && (
                <div className="glass-card p-6 mb-6 animate-slide-in">
                    <h2 className="text-sm font-bold mb-5" style={{ color: '#e2e8f0' }}>
                        {editId ? 'Edit Vehicle' : 'Register New Vehicle'}
                    </h2>
                    <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                            <label className="block text-xs font-medium mb-2" style={{ color: '#94a3b8' }}>Plate Number</label>
                            <input className="input-field uppercase" placeholder="e.g. KA01AB1234"
                                value={form.plateNumber}
                                onChange={(e) => setForm({ ...form, plateNumber: e.target.value.toUpperCase() })} required />
                        </div>
                        <div>
                            <label className="block text-xs font-medium mb-2" style={{ color: '#94a3b8' }}>Owner Name</label>
                            <input className="input-field" placeholder="Vehicle owner"
                                value={form.ownerName}
                                onChange={(e) => setForm({ ...form, ownerName: e.target.value })} required />
                        </div>
                        <div>
                            <label className="block text-xs font-medium mb-2" style={{ color: '#94a3b8' }}>Vehicle Type</label>
                            <select className="input-field" value={form.vehicleType}
                                onChange={(e) => setForm({ ...form, vehicleType: e.target.value })} required
                                style={{ appearance: 'none' }}>
                                <option value="">Select type</option>
                                {vehicleTypes.map((t) => <option key={t} value={t}>{t}</option>)}
                            </select>
                        </div>
                        <div className="md:col-span-3 flex gap-3">
                            <button type="submit" disabled={saving} className="btn-primary px-6 py-2.5 text-sm">
                                {saving ? 'Saving...' : editId ? 'Update Vehicle' : 'Add Vehicle'}
                            </button>
                            <button type="button" onClick={() => setShowForm(false)} className="btn-secondary px-6 py-2.5 text-sm">Cancel</button>
                        </div>
                    </form>
                </div>
            )}

            {/* Table */}
            <div className="glass-card overflow-hidden">
                {loading ? (
                    <div className="flex items-center justify-center h-40">
                        <div className="w-8 h-8 rounded-full" style={{ border: '2px solid rgba(99,102,241,0.3)', borderTopColor: '#6366f1', animation: 'spin-slow 1s linear infinite' }} />
                    </div>
                ) : vehicles.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16" style={{ color: '#475569' }}>
                        <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4"
                            style={{ background: 'rgba(99,102,241,0.06)', border: '1px solid rgba(99,102,241,0.1)' }}>
                            <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
                                <path d="M5 17h14M7 9l2-4h6l2 4" stroke="#4b5563" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                                <rect x="3" y="9" width="18" height="8" rx="2" stroke="#4b5563" strokeWidth="1.5" />
                            </svg>
                        </div>
                        <p className="text-sm font-medium" style={{ color: '#94a3b8' }}>No vehicles registered yet</p>
                        <p className="text-xs mt-1">Click "Add Vehicle" to register your first vehicle</p>
                    </div>
                ) : (
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>#</th>
                                <th>Plate Number</th>
                                <th>Owner</th>
                                <th>Type</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {vehicles.map((v, i) => (
                                <tr key={v.id}>
                                    <td className="text-xs" style={{ color: '#475569' }}>{i + 1}</td>
                                    <td>
                                        <span className="font-mono font-bold text-sm" style={{ color: '#a5b4fc' }}>{v.plateNumber}</span>
                                    </td>
                                    <td className="text-sm" style={{ color: '#e2e8f0' }}>{v.ownerName}</td>
                                    <td>
                                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium"
                                            style={{ background: 'rgba(14,165,233,0.08)', color: '#38bdf8', border: '1px solid rgba(14,165,233,0.12)' }}>
                                            <span>{typeIcon(v.vehicleType)}</span>
                                            {v.vehicleType}
                                        </span>
                                    </td>
                                    <td>
                                        <div className="flex gap-2">
                                            <button onClick={() => handleEdit(v)}
                                                className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
                                                style={{ background: 'rgba(99,102,241,0.08)', color: '#a5b4fc', border: '1px solid rgba(99,102,241,0.12)' }}
                                                onMouseEnter={e => e.currentTarget.style.background = 'rgba(99,102,241,0.15)'}
                                                onMouseLeave={e => e.currentTarget.style.background = 'rgba(99,102,241,0.08)'}>
                                                Edit
                                            </button>
                                            <button onClick={() => handleDelete(v.id)} className="btn-danger text-xs px-3 py-1.5">
                                                Delete
                                            </button>
                                        </div>
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
