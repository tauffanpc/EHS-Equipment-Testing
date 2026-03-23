import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../App';
import {
  LayoutDashboard, ClipboardList, PlusCircle,
  ShieldCheck, LogOut, QrCode, Menu, X, ChevronRight
} from 'lucide-react';

interface LayoutProps { children: React.ReactNode; }

const menuItems = [
  { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
  { name: 'Inventory', path: '/inventory', icon: ClipboardList },
  { name: 'Registrasi', path: '/register-equipment', icon: PlusCircle },
];

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { user, signOut } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const allMenuItems = user?.role === 'superadmin'
    ? [...menuItems, { name: 'Admin', path: '/admin', icon: ShieldCheck }]
    : menuItems;

  const isActive = (path: string) => location.pathname === path;

  const handleLogout = async () => {
    await signOut();
    navigate('/login');
  };

  const initials = user?.fullName
    ? user.fullName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
    : 'U';

  return (
    <div className="flex min-h-screen bg-[#F4F6F9]">

      {/* ── SIDEBAR (PC only) ── */}
      <aside className="sidebar hidden lg:flex">
        {/* Logo */}
        <div className="px-6 py-6 border-b border-white/5">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-blue-600 rounded-lg flex items-center justify-center flex-shrink-0">
              <QrCode size={18} className="text-white" />
            </div>
            <div>
              <p className="text-white font-bold text-sm leading-none">EHS Equipment</p>
              <p className="text-blue-400 text-[10px] font-semibold tracking-widest uppercase mt-0.5">Testing System</p>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-1">
          <p className="label-xs text-white/20 px-3 mb-3">Menu Utama</p>
          {allMenuItems.map(item => (
            <Link
              key={item.path}
              to={item.path}
              className={`nav-item ${isActive(item.path) ? 'active' : ''}`}
            >
              <item.icon size={18} />
              {item.name}
              {isActive(item.path) && (
                <ChevronRight size={14} className="ml-auto text-blue-400" />
              )}
            </Link>
          ))}
        </nav>

        {/* User */}
        <div className="p-3 border-t border-white/5">
          <div className="flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-white/5 transition-colors">
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
              {initials}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white text-sm font-semibold truncate leading-none">{user?.fullName}</p>
              <p className="text-white/40 text-[10px] uppercase tracking-wide mt-0.5">{user?.role}</p>
            </div>
            <button
              onClick={handleLogout}
              title="Keluar"
              className="p-1.5 text-white/30 hover:text-red-400 transition-colors rounded-lg hover:bg-white/5"
            >
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </aside>

      {/* ── MOBILE HEADER ── */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-40 bg-white border-b border-gray-200 flex items-center justify-between px-4 h-14">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 bg-blue-600 rounded-lg flex items-center justify-center">
            <QrCode size={14} className="text-white" />
          </div>
          <span className="font-bold text-sm text-gray-900">EHS Equipment</span>
        </div>
        <button
          onClick={() => setSidebarOpen(true)}
          className="p-2 text-gray-500 hover:text-gray-900"
        >
          <Menu size={20} />
        </button>
      </div>

      {/* ── MOBILE DRAWER ── */}
      {sidebarOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div className="absolute inset-0 bg-black/40" onClick={() => setSidebarOpen(false)} />
          <div className="relative w-72 bg-[#0D1117] flex flex-col h-full">
            <div className="px-5 py-5 border-b border-white/5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                  <QrCode size={16} className="text-white" />
                </div>
                <div>
                  <p className="text-white font-bold text-sm">EHS Equipment</p>
                  <p className="text-blue-400 text-[10px] uppercase tracking-widest">Testing System</p>
                </div>
              </div>
              <button onClick={() => setSidebarOpen(false)} className="text-white/40 hover:text-white">
                <X size={20} />
              </button>
            </div>
            <nav className="flex-1 px-3 py-4 space-y-1">
              {allMenuItems.map(item => (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setSidebarOpen(false)}
                  className={`nav-item ${isActive(item.path) ? 'active' : ''}`}
                >
                  <item.icon size={18} />
                  {item.name}
                </Link>
              ))}
            </nav>
            <div className="p-3 border-t border-white/5">
              <div className="flex items-center gap-3 px-3 py-3">
                <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white text-xs font-bold">
                  {initials}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-white text-sm font-semibold truncate">{user?.fullName}</p>
                  <p className="text-white/40 text-[10px] uppercase tracking-wide">{user?.role}</p>
                </div>
                <button onClick={handleLogout} className="text-white/30 hover:text-red-400 transition-colors">
                  <LogOut size={16} />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── MAIN CONTENT ── */}
      <div className="flex-1 flex flex-col min-w-0">
        <main className="flex-1 p-4 lg:p-8 mt-14 lg:mt-0 pb-20 lg:pb-8 overflow-y-auto">
          {children}
        </main>
      </div>

      {/* ── BOTTOM NAV (Mobile only) ── */}
      <nav className="bottom-nav lg:hidden">
        {allMenuItems.map(item => (
          <Link
            key={item.path}
            to={item.path}
            className={`bottom-nav-item ${isActive(item.path) ? 'active' : ''}`}
          >
            <item.icon size={20} strokeWidth={isActive(item.path) ? 2.5 : 1.8} />
            {item.name}
          </Link>
        ))}
      </nav>
    </div>
  );
};
