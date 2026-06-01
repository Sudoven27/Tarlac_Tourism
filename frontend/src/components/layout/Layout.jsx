import React, { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  FiGrid, FiHome, FiUsers, FiLogOut, FiMenu, FiX,
  FiMapPin, FiBriefcase, FiUser, FiChevronRight, FiBarChart2
} from 'react-icons/fi';
import { GiPalmTree } from 'react-icons/gi';

const NAV = [
  { to: '/dashboard', icon: FiGrid, label: 'Dashboard' },
  { to: '/sae', icon: FiHome, label: 'Accommodation (SAE)' },
  { to: '/sta', icon: FiMapPin, label: 'Tourist Attractions (STA)' },
  { to: '/ste', icon: FiBriefcase, label: 'Tourism Enterprises (STE)' },
  { to: '/visitors', icon: FiUsers, label: 'Visitor Management' },
  { to: '/reports', icon: FiBarChart2, label: 'Reports & Analytics' },
];

const ADMIN_NAV = [
  { to: '/users', icon: FiUser, label: 'Manage Users' },
];

export default function Layout() {
  const { user, logout, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = () => { logout(); navigate('/login'); };

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      <div className="px-5 py-5 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl gold-gradient flex items-center justify-center shadow-lg flex-shrink-0">
            <GiPalmTree className="text-white text-xl" />
          </div>
          <div>
            <h1 className="font-display text-white font-bold text-sm leading-tight">Tarlac Tourism</h1>
            <p className="text-emerald-300 text-xs">Inventory Supply System</p>
          </div>
        </div>
      </div>

      <div className="px-3 py-3 border-b border-white/10">
        <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer hover:bg-white/10 transition-all"
          onClick={() => { navigate('/profile'); setSidebarOpen(false); }}>
          <div className="w-9 h-9 rounded-xl bg-amber-400/20 flex items-center justify-center border border-amber-400/30 flex-shrink-0">
            <span className="text-amber-300 font-bold text-sm">{user?.name?.[0]?.toUpperCase()}</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-white text-sm font-semibold truncate">{user?.name}</p>
            <p className="text-emerald-300 text-xs capitalize">{user?.role} · {user?.municipality || 'All Areas'}</p>
          </div>
          <FiChevronRight className="text-white/40 text-xs flex-shrink-0" />
        </div>
      </div>

      <nav className="flex-1 px-3 py-3 space-y-0.5 overflow-y-auto">
        <p className="text-emerald-400 text-xs font-bold uppercase tracking-wider px-3 mb-2 mt-1">Main Menu</p>
        {NAV.map(({ to, icon: Icon, label }) => (
          <NavLink key={to} to={to}
            className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
            onClick={() => setSidebarOpen(false)}>
            <Icon className="sidebar-icon text-lg flex-shrink-0" />
            <span className="text-sm">{label}</span>
          </NavLink>
        ))}

        {isAdmin && (
          <>
            <div className="my-2 border-t border-white/10" />
            <p className="text-emerald-400 text-xs font-bold uppercase tracking-wider px-3 mb-2">Administration</p>
            {ADMIN_NAV.map(({ to, icon: Icon, label }) => (
              <NavLink key={to} to={to}
                className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
                onClick={() => setSidebarOpen(false)}>
                <Icon className="sidebar-icon text-lg flex-shrink-0" />
                <span className="text-sm">{label}</span>
              </NavLink>
            ))}
          </>
        )}
      </nav>

      <div className="px-3 py-3 border-t border-white/10">
        <button onClick={handleLogout} className="sidebar-link w-full hover:!bg-red-500/20 hover:!text-red-300">
          <FiLogOut className="text-lg" />
          <span className="text-sm">Sign Out</span>
        </button>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      <aside className="hidden lg:flex flex-col w-60 flex-shrink-0 emerald-gradient shadow-2xl">
        <SidebarContent />
      </aside>

      {sidebarOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setSidebarOpen(false)} />
          <aside className="relative z-10 flex flex-col w-72 emerald-gradient shadow-2xl animate-slide-in">
            <button onClick={() => setSidebarOpen(false)} className="absolute top-4 right-4 text-white/60 hover:text-white">
              <FiX className="text-xl" />
            </button>
            <SidebarContent />
          </aside>
        </div>
      )}

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="lg:hidden flex items-center gap-4 px-4 py-3 bg-white border-b border-gray-100 shadow-sm">
          <button onClick={() => setSidebarOpen(true)} className="text-emerald-700"><FiMenu className="text-xl" /></button>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg gold-gradient flex items-center justify-center">
              <GiPalmTree className="text-white text-sm" />
            </div>
            <span className="font-display font-bold text-emerald-900 text-sm">Tarlac Tourism</span>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4 lg:p-6 main-layout-content">
          <div className="max-w-7xl mx-auto animate-fade-in">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
