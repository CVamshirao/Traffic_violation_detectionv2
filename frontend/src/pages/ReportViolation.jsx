import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createViolation } from '../services/api';

const vehicleCategories = [
    { value: 'Two Wheeler', icon: '🏍️', label: 'Two Wheeler' },
    { value: 'Three Wheeler', icon: '🛺', label: 'Three Wheeler' },
    { value: 'Four Wheeler', icon: '🚗', label: 'Four Wheeler' },
    { value: 'Heavy Vehicle', icon: '🚛', label: 'Heavy Vehicle' },
];

const violationTypes = [
    { value: 'Over Speed', icon: '💨', severity: 'high' },
    { value: 'No Helmet', icon: '⛑️', severity: 'medium' },
    { value: 'Signal Jump', icon: '🚦', severity: 'high' },
    { value: 'Illegal Parking', icon: '🅿️', severity: 'low' },
    { value: 'Wrong Way', icon: '🔄', severity: 'critical' },
    { value: 'No Seatbelt', icon: '🪢', severity: 'medium' },
    { value: 'Triple Riding', icon: '👥', severity: 'medium' },
    { value: 'Using Mobile', icon: '📱', severity: 'high' },
    { value: 'Drunk Driving', icon: '🍺', severity: 'critical' },
    { value: 'No License Plate', icon: '🔢', severity: 'high' },
    { value: 'Overloading', icon: '📦', severity: 'high' },
    { value: 'Lane Violation', icon: '↔️', severity: 'medium' },
];

const severityColors = {
    low: 'border-sky-500/30 bg-sky-500/5 text-sky-300',
    medium: 'border-amber-500/30 bg-amber-500/5 text-amber-300',
    high: 'border-orange-500/30 bg-orange-500/5 text-orange-300',
    critical: 'border-red-500/30 bg-red-500/5 text-red-300',
};

export default function ReportViolation() {
    const [form, setForm] = useState({
        plateNumber: '',
        vehicleCategory: '',
        violationType: '',
        location: '',
    });
    const [image, setImage] = useState(null);
    const [preview, setPreview] = useState(null);
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState('');
    const [error, setError] = useState('');
    const [aiResult, setAiResult] = useState(null);
    const [step, setStep] = useState(1);
    const [dragActive, setDragActive] = useState(false);
    const navigate = useNavigate();


    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setImage(file);
            setPreview(URL.createObjectURL(file));
        }
    };

    const handleDrop = (e) => {
        e.preventDefault();
        setDragActive(false);
        const file = e.dataTransfer.files[0];
        if (file && file.type.startsWith('image/')) {
            setImage(file);
            setPreview(URL.createObjectURL(file));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');
        setAiResult(null);
        setLoading(true);

        const formData = new FormData();
        formData.append('plateNumber', form.plateNumber);
        formData.append('vehicleCategory', form.vehicleCategory);
        formData.append('violationType', form.violationType);
        formData.append('location', form.location);
        if (image) formData.append('image', image);

        try {
            const res = await createViolation(formData);
            const data = res.data.data;
            const msg = res.data.message;

            if (data.aiVerified) {
                setSuccess(msg);
                setAiResult({ verified: true, confidence: data.aiConfidence, remarks: data.aiRemarks });
                setTimeout(() => navigate('/violations'), 3000);
            } else {
                setError(msg);
                setAiResult({ verified: false, confidence: data.aiConfidence, remarks: data.aiRemarks });
            }

            setForm({ plateNumber: '', vehicleCategory: '', violationType: '', location: '' });
            setImage(null);
            setPreview(null);
            setStep(1);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to report violation');
        } finally {
            setLoading(false);
        }
    };

    const canProceedStep2 = form.vehicleCategory && form.violationType;
    const canSubmit = form.plateNumber && form.location && image;

    return (
        <div className="animate-fade-in max-w-4xl mx-auto">
            {/* Header */}
            <div className="mb-8">
                <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                        style={{ background: 'linear-gradient(135deg, rgba(239,68,68,0.15), rgba(249,115,22,0.1))', border: '1px solid rgba(239,68,68,0.2)' }}>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                            <circle cx="11" cy="11" r="8" stroke="#f87171" strokeWidth="1.5" />
                            <path d="M11 7v4m0 4h.01" stroke="#f87171" strokeWidth="2" strokeLinecap="round" />
                            <path d="M21 21l-4.35-4.35" stroke="#f87171" strokeWidth="1.5" strokeLinecap="round" />
                        </svg>
                    </div>
                    <div>
                        <h1 className="text-xl font-bold" style={{ color: '#e2e8f0' }}>Report Violation</h1>
                        <p className="text-xs mt-0.5" style={{ color: '#475569' }}>Upload evidence · AI verifies · Admin reviews</p>
                    </div>
                </div>
                {/* Progress Steps */}
                <div className="flex items-center gap-2 mt-6">
                    {[
                        { num: 1, label: 'Classification' },
                        { num: 2, label: 'Evidence & Details' },
                    ].map((s) => (
                        <div key={s.num} className="flex items-center gap-2 flex-1">
                            <div
                                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all ${step >= s.num
                                    ? 'bg-gradient-to-br from-primary to-secondary text-white shadow-lg shadow-primary/30'
                                    : 'bg-dark-card text-dark-text border border-dark-border'
                                    }`}
                            >
                                {s.num}
                            </div>
                            <span className={`text-sm font-medium ${step >= s.num ? 'text-dark-text-light' : 'text-dark-text'}`}>
                                {s.label}
                            </span>
                            {s.num < 2 && <div className={`flex-1 h-0.5 rounded ${step > s.num ? 'bg-primary' : 'bg-dark-border'}`} />}
                        </div>
                    ))}
                </div>
            </div>

            {/* AI Result Banner */}
            {/* ── Two-stage AI verification result ── */}
            {aiResult && (
                <div className="mb-6 animate-fade-in rounded-2xl overflow-hidden"
                    style={{ border: `1px solid ${aiResult.verified ? 'rgba(16,185,129,0.25)' : 'rgba(239,68,68,0.25)'}` }}>
                    {/* Header bar */}
                    <div className="px-5 py-3 flex items-center gap-3"
                        style={{ background: aiResult.verified ? 'rgba(16,185,129,0.12)' : 'rgba(239,68,68,0.12)' }}>
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center"
                            style={{ background: aiResult.verified ? 'rgba(16,185,129,0.2)' : 'rgba(239,68,68,0.2)' }}>
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                                {aiResult.verified
                                    ? <path d="M20 6L9 17l-5-5" stroke="#34d399" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                                    : <path d="M18 6L6 18M6 6l12 12" stroke="#f87171" strokeWidth="2.5" strokeLinecap="round" />}
                            </svg>
                        </div>
                        <div>
                            <p className="text-sm font-bold" style={{ color: aiResult.verified ? '#34d399' : '#f87171' }}>
                                AI Verification {aiResult.verified ? 'Passed — Sent to Admin Panel' : 'Failed — Submission Rejected'}
                            </p>
                            <p className="text-xs" style={{ color: '#64748b' }}>
                                Overall confidence: {((aiResult.confidence || 0) * 100).toFixed(0)}%
                            </p>
                        </div>
                    </div>

                    {/* Overall confidence bar */}
                    <div className="px-5 pt-3 pb-1">
                        <div className="w-full h-1.5 rounded-full" style={{ background: 'rgba(10,14,26,0.6)' }}>
                            <div className="h-full rounded-full transition-all duration-1000"
                                style={{
                                    width: `${(aiResult.confidence || 0) * 100}%`,
                                    background: aiResult.verified
                                        ? 'linear-gradient(90deg, #10b981, #34d399)'
                                        : 'linear-gradient(90deg, #ef4444, #f87171)',
                                }} />
                        </div>
                    </div>

                    {/* Stage breakdown — parse remarks lines */}
                    <div className="px-5 py-4 space-y-2">
                        {(aiResult.remarks || '').split('\n').filter(Boolean).map((line, idx) => {
                            const isYolo = line.includes('YOLO Stage');
                            const isGemini = line.includes('Gemini Stage') || line.includes('Gemini');
                            const isPass = line.includes('PASSED') || line.includes('VERIFIED');
                            const isFail = line.includes('REJECTED');
                            const dotColor = isFail ? '#f87171' : isPass ? '#34d399' : '#64748b';
                            return (
                                <div key={idx} className="flex items-start gap-2.5">
                                    <div className="w-4 h-4 rounded-full flex-shrink-0 flex items-center justify-center mt-0.5"
                                        style={{ background: `${dotColor}18`, border: `1px solid ${dotColor}40` }}>
                                        <div className="w-1.5 h-1.5 rounded-full" style={{ background: dotColor }} />
                                    </div>
                                    <p className="text-xs leading-relaxed font-mono" style={{ color: '#94a3b8' }}>
                                        {isYolo && <span style={{ color: '#818cf8' }}>🔍 </span>}
                                        {isGemini && <span style={{ color: '#a78bfa' }}>🤖 </span>}
                                        {line}
                                    </p>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {success && !aiResult && (
                <div className="px-4 py-3.5 rounded-xl text-sm mb-6 animate-fade-in"
                    style={{ background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.2)', color: '#34d399' }}>
                    {success}
                </div>
            )}
            {error && !aiResult && (
                <div className="px-4 py-3.5 rounded-xl text-sm mb-6"
                    style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', color: '#f87171' }}>
                    {error}
                </div>
            )}


            <form onSubmit={handleSubmit}>
                {/* ── Step 1: Classification ── */}
                {step === 1 && (
                    <div className="space-y-6 animate-fade-in">
                        {/* Vehicle Category */}
                        <div className="glass-card p-6">
                            <h2 className="text-lg font-semibold text-dark-text-light mb-1">Vehicle Type</h2>
                            <p className="text-dark-text text-xs mb-4">Select the category of the offending vehicle</p>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                {vehicleCategories.map((cat) => (
                                    <button
                                        key={cat.value}
                                        type="button"
                                        onClick={() => setForm({ ...form, vehicleCategory: cat.value })}
                                        className={`p-4 rounded-xl border-2 text-center transition-all hover:scale-[1.02] ${form.vehicleCategory === cat.value
                                            ? 'border-primary bg-primary/10 shadow-lg shadow-primary/10'
                                            : 'border-dark-border bg-dark-card hover:border-primary/30'
                                            }`}
                                    >
                                        <span className="text-3xl block mb-2">{cat.icon}</span>
                                        <span className={`text-sm font-medium ${form.vehicleCategory === cat.value ? 'text-primary-light' : 'text-dark-text'
                                            }`}>
                                            {cat.label}
                                        </span>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Violation Type */}
                        <div className="glass-card p-6">
                            <h2 className="text-lg font-semibold text-dark-text-light mb-1">Violation Type</h2>
                            <p className="text-dark-text text-xs mb-4">What type of violation was observed?</p>
                            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                                {violationTypes.map((vt) => (
                                    <button
                                        key={vt.value}
                                        type="button"
                                        onClick={() => setForm({ ...form, violationType: vt.value })}
                                        className={`p-3 rounded-xl border text-left transition-all hover:scale-[1.02] ${form.violationType === vt.value
                                            ? 'border-primary bg-primary/10 shadow-lg shadow-primary/10'
                                            : `${severityColors[vt.severity]} border hover:brightness-125`
                                            }`}
                                    >
                                        <span className="text-xl">{vt.icon}</span>
                                        <p className={`text-sm font-medium mt-1 ${form.violationType === vt.value ? 'text-primary-light' : ''
                                            }`}>
                                            {vt.value}
                                        </p>
                                        <span className={`text-[10px] uppercase tracking-wider font-semibold px-1.5 py-0.5 rounded mt-1 inline-block ${vt.severity === 'critical' ? 'bg-red-500/20 text-red-300' :
                                            vt.severity === 'high' ? 'bg-orange-500/20 text-orange-300' :
                                                vt.severity === 'medium' ? 'bg-amber-500/20 text-amber-300' :
                                                    'bg-sky-500/20 text-sky-300'
                                            }`}>
                                            {vt.severity}
                                        </span>
                                    </button>
                                ))}
                            </div>
                        </div>

                        <button
                            type="button"
                            disabled={!canProceedStep2}
                            onClick={() => setStep(2)}
                            className="btn-primary w-full py-3 text-base"
                        >
                            Continue to Evidence Upload →
                        </button>
                    </div>
                )}

                {/* ── Step 2: Evidence & Details ── */}
                {step === 2 && (
                    <div className="space-y-6 animate-fade-in">
                        {/* Selected summary */}
                        <div className="glass-card p-4 flex items-center gap-4">
                            <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-primary/10 border border-primary/20">
                                <span className="text-lg">{vehicleCategories.find((c) => c.value === form.vehicleCategory)?.icon}</span>
                                <span className="text-sm font-medium text-primary-light">{form.vehicleCategory}</span>
                            </div>
                            <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-primary/10 border border-primary/20">
                                <span className="text-lg">{violationTypes.find((v) => v.value === form.violationType)?.icon}</span>
                                <span className="text-sm font-medium text-primary-light">{form.violationType}</span>
                            </div>
                            <button type="button" onClick={() => setStep(1)} className="ml-auto text-xs transition-colors"
                                style={{ color: '#64748b' }}
                                onMouseEnter={e => e.currentTarget.style.color = '#a5b4fc'}
                                onMouseLeave={e => e.currentTarget.style.color = '#64748b'}>
                                ← Change
                            </button>
                        </div>

                        {/* Image Upload */}
                        <div className="glass-card p-6">
                            <h2 className="text-sm font-bold mb-1" style={{ color: '#e2e8f0' }}>Evidence Image</h2>
                            <p className="text-dark-text text-xs mb-4">Upload a clear photo — our AI will verify the violation</p>
                            <div
                                onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
                                onDragLeave={() => setDragActive(false)}
                                onDrop={handleDrop}
                                onClick={() => document.getElementById('imgUpload').click()}
                                className={`relative border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all ${dragActive
                                    ? 'border-primary bg-primary/5 scale-[1.01]'
                                    : preview
                                        ? 'border-emerald-500/30 bg-emerald-500/5'
                                        : 'border-dark-border hover:border-primary/40 hover:bg-dark-card/50'
                                    }`}
                            >
                                {preview ? (
                                    <div className="relative inline-block">
                                        <img src={preview} alt="Evidence" className="max-h-56 mx-auto rounded-xl shadow-2xl" />
                                        <div className="absolute -top-2 -right-2 w-6 h-6 bg-emerald-500 rounded-full flex items-center justify-center text-white text-xs">✓</div>
                                        <p className="text-xs text-emerald-300 mt-3">Click to change image</p>
                                    </div>
                                ) : (
                                    <div className="py-4">
                                        <div className="w-16 h-16 mx-auto rounded-2xl flex items-center justify-center mb-4"
                                            style={{ background: 'rgba(10,14,26,0.7)', border: '1px solid rgba(30,39,64,0.8)' }}>
                                            <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
                                                <path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z" stroke="#334155" strokeWidth="1.5" strokeLinejoin="round" />
                                                <circle cx="12" cy="13" r="4" stroke="#334155" strokeWidth="1.5" />
                                            </svg>
                                        </div>
                                        <p className="text-dark-text-light font-medium">Drag & drop evidence image</p>
                                        <p className="text-dark-text text-xs mt-1">or click to browse · PNG, JPG up to 10MB</p>
                                        <div className="flex items-center justify-center gap-1.5 mt-3 text-xs" style={{ color: '#818cf8' }}>
                                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
                                                <path d="M12 2a4 4 0 014 4c0 2-2 4-4 6-2-2-4-4-4-6a4 4 0 014-4z" stroke="currentColor" strokeWidth="1.5" />
                                                <path d="M12 16v4M8 20h8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                                            </svg>
                                            <span>🔍 YOLO detects objects → 🤖 Gemini verifies violation</span>
                                        </div>
                                    </div>
                                )}
                                <input id="imgUpload" type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
                            </div>
                        </div>

                        {/* Vehicle & Location */}
                        <div className="glass-card p-6">
                            <h2 className="text-sm font-bold mb-4" style={{ color: '#e2e8f0' }}>Violation Details</h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-medium mb-2" style={{ color: '#94a3b8' }}>Plate Number</label>
                                    <input
                                        className="input-field uppercase"
                                        placeholder="e.g. KA01AB1234"
                                        value={form.plateNumber}
                                        onChange={(e) => setForm({ ...form, plateNumber: e.target.value.toUpperCase() })}
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium mb-2" style={{ color: '#94a3b8' }}>Location</label>
                                    <input
                                        className="input-field"
                                        placeholder="e.g. MG Road, Bangalore"
                                        value={form.location}
                                        onChange={(e) => setForm({ ...form, location: e.target.value })}
                                        required
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="flex gap-3">
                            <button type="button" onClick={() => setStep(1)} className="btn-secondary flex-1 py-3">
                                ← Back
                            </button>
                            <button type="submit" disabled={loading || !canSubmit} className="btn-primary flex-[2] py-3 text-base">
                                {loading ? (
                                    <span className="flex items-center justify-center gap-2">
                                        <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                                        AI Analyzing...
                                    </span>
                                ) : (
                                    '🤖 Submit for AI Verification'
                                )}
                            </button>
                        </div>
                    </div>
                )}
            </form>
        </div>
    );
}
