import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const navItems = [
    { path: '/dashboard', label: 'Dashboard', svg: <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><rect x="3" y="3" width="7" height="7" rx="2" stroke="currentColor" strokeWidth="1.5" /><rect x="14" y="3" width="7" height="7" rx="2" stroke="currentColor" strokeWidth="1.5" /><rect x="3" y="14" width="7" height="7" rx="2" stroke="currentColor" strokeWidth="1.5" /><rect x="14" y="14" width="7" height="7" rx="2" stroke="currentColor" strokeWidth="1.5" /></svg> },
    { path: '/report', label: 'Report Violation', svg: <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><rect x="3" y="3" width="18" height="18" rx="3" stroke="currentColor" strokeWidth="1.5" /><circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.5" /><path d="M3 9h3m12 0h3M12 3v3m0 12v3" stroke="currentColor" strokeWidth="1.5" /></svg> },
    { path: '/violations', label: 'Violations', svg: <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" /><path d="M12 9v4m0 4h.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg> },
    { path: '/vehicles', label: 'My Vehicles', svg: <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M5 17h14M7 9l2-4h6l2 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /><rect x="3" y="9" width="18" height="8" rx="2" stroke="currentColor" strokeWidth="1.5" /><circle cx="7" cy="17" r="2" stroke="currentColor" strokeWidth="1.5" /><circle cx="17" cy="17" r="2" stroke="currentColor" strokeWidth="1.5" /></svg> },
    { path: '/fines', label: 'Fines', svg: <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg> },
    { path: '/payments', label: 'Payments', svg: <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><rect x="1" y="4" width="22" height="16" rx="3" stroke="currentColor" strokeWidth="1.5" /><path d="M1 10h22" stroke="currentColor" strokeWidth="1.5" /><path d="M6 15h4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></svg> },
];

const adminItems = [
    { path: '/admin', label: 'Admin Panel', svg: <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" /><path d="M9 12l2 2 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg> },
];

export default function Layout() {
    const { user, logout, isAdmin } = useAuth();
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const items = isAdmin() ? [...navItems, ...adminItems] : navItems;

    const initials = user?.name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || '?';

    return (
        <div className="flex min-h-screen" style={{ background: '#0a0e1a' }}>
            {/* Sidebar */}
            <aside className="sidebar w-[260px] flex-shrink-0 flex flex-col" style={{ position: 'sticky', top: 0, height: '100vh' }}>
                {/* Logo */}
                <div className="p-5 pb-4" style={{ borderBottom: '1px solid rgba(30,39,64,0.5)' }}>
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl flex items-center justify-center"
                            style={{ background: 'linear-gradient(135deg, rgba(99,102,241,0.15), rgba(14,165,233,0.1))', border: '1px solid rgba(99,102,241,0.2)' }}>
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                                <rect x="9" y="1" width="6" height="22" rx="3" stroke="#818cf8" strokeWidth="1.5" fill="rgba(99,102,241,0.1)" />
                                <circle cx="12" cy="6" r="1.5" fill="#ef4444" />
                                <circle cx="12" cy="12" r="1.5" fill="#f59e0b" />
                                <circle cx="12" cy="18" r="1.5" fill="#10b981" />
                            </svg>
                        </div>
                        <div>
                            <h1 className="text-sm font-bold gradient-text">TrafficAI</h1>
                            <p className="text-[10px]" style={{ color: '#475569' }}>Violation Detection</p>
                        </div>
                    </div>
                </div>

                {/* Section Label */}
                <div className="px-5 pt-5 pb-2">
                    <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: '#334155' }}>Navigation</span>
                </div>

                {/* Nav Items */}
                <nav className="flex-1 px-3 space-y-0.5 overflow-y-auto">
                    {items.map((item) => (
                        <NavLink
                            key={item.path}
                            to={item.path}
                            className={({ isActive }) =>
                                `sidebar-nav-item ${isActive ? 'active' : ''}`
                            }
                        >
                            <span style={{ opacity: 0.85, display: 'flex', alignItems: 'center' }}>{item.svg}</span>
                            {item.label}
                        </NavLink>
                    ))}
                </nav>

                {/* User Profile */}
                <div className="p-4" style={{ borderTop: '1px solid rgba(30,39,64,0.5)' }}>
                    <div className="flex items-center gap-3 mb-3 px-1">
                        <div className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold"
                            style={{ background: 'linear-gradient(135deg, #6366f1, #818cf8)', color: 'white' }}>
                            {initials}
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate" style={{ color: '#e2e8f0' }}>{user?.name}</p>
                            <p className="text-[10px] font-medium" style={{ color: '#6366f1' }}>
                                {user?.role === 'ADMIN' ? '🛡️ Admin' : user?.role === 'OFFICER' ? '👮 Officer' : '👤 Citizen'}
                            </p>
                        </div>
                    </div>
                    <button onClick={handleLogout}
                        className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-all duration-200"
                        style={{ color: '#64748b', background: 'rgba(239,68,68,0.04)', border: '1px solid rgba(239,68,68,0.08)' }}
                        onMouseEnter={e => { e.target.style.background = 'rgba(239,68,68,0.1)'; e.target.style.color = '#f87171'; }}
                        onMouseLeave={e => { e.target.style.background = 'rgba(239,68,68,0.04)'; e.target.style.color = '#64748b'; }}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                            <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                        Sign Out
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 overflow-auto" style={{ background: 'linear-gradient(180deg, #0a0e1a 0%, #0d1220 100%)' }}>
                <div className="p-8 max-w-7xl mx-auto animate-fade-in">
                    <Outlet />
                </div>
            </main>
        </div>
    );
}
