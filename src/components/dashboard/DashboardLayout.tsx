import { useState, useEffect, useRef } from 'react';
import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Shield, LayoutDashboard, Table, Map as MapIcon, BarChart3, Flame,
  AlertTriangle, Brain, FileText, Database, Settings, Search, Bell,
  ChevronLeft, ChevronRight, LogOut, User, Menu, X, Check, CheckCheck, Trash2,
} from 'lucide-react';
import { useAuth } from '@/lib/auth';
import { useTheme } from '@/lib/themeContext';
import { fetchNotifications, markNotificationRead, markAllNotificationsRead, clearNotification, searchIncidents } from '@/lib/queries';
import { RoleBadge } from '@/components/ui/Badges';
import type { Notification } from '@/lib/types';

const navItems = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/dashboard/crime-explorer', label: 'Crime Explorer', icon: Table },
  { to: '/dashboard/crime-map', label: 'Crime Map', icon: MapIcon },
  { to: '/dashboard/analytics', label: 'Analytics', icon: BarChart3 },
  { to: '/dashboard/hotspots', label: 'Hotspots', icon: Flame },
  { to: '/dashboard/risk-intelligence', label: 'Risk Intelligence', icon: AlertTriangle },
  { to: '/dashboard/predictions', label: 'Predictions', icon: Brain },
  { to: '/dashboard/reports', label: 'Reports', icon: FileText },
  { to: '/dashboard/data-management', label: 'Data Management', icon: Database },
  { to: '/dashboard/settings', label: 'Settings', icon: Settings },
];

function Sidebar({ collapsed, setCollapsed, mobileOpen, setMobileOpen }: {
  collapsed: boolean;
  setCollapsed: (v: boolean) => void;
  mobileOpen: boolean;
  setMobileOpen: (v: boolean) => void;
}) {
  return (
    <>
      {mobileOpen && (
        <div className="fixed inset-0 bg-black/50 z-30 lg:hidden" onClick={() => setMobileOpen(false)} />
      )}
      <aside
        className={`fixed lg:sticky top-0 left-0 h-screen z-40 transition-all duration-300 ${
          collapsed ? 'w-16' : 'w-60'
        } ${mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}
        style={{ background: 'var(--bg-secondary)', borderRight: '1px solid var(--border-color)' }}
      >
        <div className="flex items-center justify-between p-4 h-14" style={{ borderBottom: '1px solid var(--border-color)' }}>
          {!collapsed && (
            <div className="flex items-center gap-2">
              <Shield className="w-6 h-6 text-cyan-400" />
              <span className="text-sm font-bold text-white tracking-wider">CRIMEWATCH</span>
            </div>
          )}
          {collapsed && <Shield className="w-6 h-6 text-cyan-400 mx-auto" />}
          <button onClick={() => setMobileOpen(false)} className="lg:hidden text-slate-400">
            <X className="w-5 h-5" />
          </button>
        </div>

        <nav className="p-2 space-y-1 overflow-y-auto" style={{ height: 'calc(100vh - 56px - 56px)' }}>
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              onClick={() => setMobileOpen(false)}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all ${
                  isActive
                    ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/30'
                }`
              }
            >
              <item.icon className="w-5 h-5 flex-shrink-0" />
              {!collapsed && <span>{item.label}</span>}
            </NavLink>
          ))}
        </nav>

        <div className="absolute bottom-0 left-0 right-0 p-2" style={{ borderTop: '1px solid var(--border-color)' }}>
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="hidden lg:flex items-center gap-2 px-3 py-2 text-xs text-slate-500 hover:text-white w-full"
          >
            {collapsed ? <ChevronRight className="w-4 h-4 mx-auto" /> : <><ChevronLeft className="w-4 h-4" /> Collapse</>}
          </button>
        </div>
      </aside>
    </>
  );
}

function NotificationDropdown({ userId }: { userId: string }) {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const load = async () => {
    setLoading(true);
    try {
      const data = await fetchNotifications(userId);
      setNotifications(data);
    } catch (e) {
      console.error('Failed to load notifications', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open) load();
  }, [open]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const handleMarkRead = async (id: string) => {
    await markNotificationRead(id);
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
  };

  const handleMarkAll = async () => {
    await markAllNotificationsRead(userId);
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const handleClear = async (id: string) => {
    await clearNotification(id);
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  const typeColors: Record<string, string> = {
    info: '#22d3ee', warning: '#fbbf24', danger: '#ef4444', success: '#22c55e',
  };

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className="relative p-2 text-slate-400 hover:text-white transition-colors"
        aria-label="Notifications"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 w-4 h-4 bg-red-500 text-white text-[9px] rounded-full flex items-center justify-center">
            {unreadCount}
          </span>
        )}
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="absolute right-0 top-full mt-2 w-80 glass-panel z-50 max-h-96 overflow-hidden flex flex-col"
          >
            <div className="flex items-center justify-between p-3 border-b border-cyan-500/10">
              <span className="text-xs font-semibold text-white uppercase">Notifications</span>
              {unreadCount > 0 && (
                <button onClick={handleMarkAll} className="text-xs text-cyan-400 hover:text-cyan-300 flex items-center gap-1">
                  <CheckCheck className="w-3 h-3" /> Mark all read
                </button>
              )}
            </div>
            <div className="overflow-y-auto flex-1">
              {loading ? (
                <div className="p-4 text-center text-xs text-slate-500">Loading...</div>
              ) : notifications.length === 0 ? (
                <div className="p-4 text-center text-xs text-slate-500">No notifications</div>
              ) : (
                notifications.map((n) => (
                  <div
                    key={n.id}
                    className={`p-3 border-b border-cyan-500/5 ${!n.read ? 'bg-cyan-500/5' : ''}`}
                  >
                    <div className="flex items-start gap-2">
                      <div className="w-2 h-2 rounded-full mt-1.5 flex-shrink-0" style={{ backgroundColor: typeColors[n.type] }} />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-white">{n.title}</p>
                        <p className="text-xs text-slate-500 mt-0.5">{n.message}</p>
                        <div className="flex items-center gap-2 mt-1">
                          {!n.read && (
                            <button onClick={() => handleMarkRead(n.id)} className="text-[10px] text-cyan-400 hover:text-cyan-300 flex items-center gap-1">
                              <Check className="w-3 h-3" /> Mark read
                            </button>
                          )}
                          <button onClick={() => handleClear(n.id)} className="text-[10px] text-slate-500 hover:text-red-400 flex items-center gap-1">
                            <Trash2 className="w-3 h-3" /> Clear
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function Topbar({ onMobileMenu }: { onMobileMenu: () => void }) {
  const { profile, signOut } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<CrimeIncident[]>([]);
  const [showResults, setShowResults] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const [profileOpen, setProfileOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);

  const pageTitle = navItems.find((n) =>
    n.end ? location.pathname === n.to : location.pathname.startsWith(n.to)
  )?.label || 'Dashboard';

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) setShowResults(false);
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) setProfileOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }
    const timer = setTimeout(async () => {
      try {
        const results = await searchIncidents(searchQuery);
        setSearchResults(results);
        setShowResults(true);
      } catch (e) {
        console.error('Search failed', e);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  return (
    <header
      className="sticky top-0 z-20 h-14 flex items-center justify-between px-4 gap-4"
      style={{ background: 'var(--bg-secondary)', borderBottom: '1px solid var(--border-color)' }}
    >
      <div className="flex items-center gap-3">
        <button onClick={onMobileMenu} className="lg:hidden text-slate-400">
          <Menu className="w-5 h-5" />
        </button>
        <h1 className="text-sm font-semibold text-white">{pageTitle}</h1>
      </div>

      <div className="flex items-center gap-3">
        {/* Search */}
        <div className="relative" ref={searchRef}>
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onFocus={() => searchResults.length > 0 && setShowResults(true)}
            placeholder="Search incidents..."
            className="input-field pl-9 w-48 md:w-64 text-xs py-1.5"
          />
          <AnimatePresence>
            {showResults && searchResults.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                className="absolute right-0 top-full mt-2 w-72 glass-panel z-50 max-h-72 overflow-y-auto"
              >
                {searchResults.slice(0, 8).map((inc) => (
                  <button
                    key={inc.id}
                    onClick={() => { navigate('/dashboard/crime-explorer'); setShowResults(false); setSearchQuery(''); }}
                    className="w-full p-2 text-left border-b border-cyan-500/5 hover:bg-cyan-500/5"
                  >
                    <p className="text-xs text-white">{inc.incident_id} — {inc.crime_type}</p>
                    <p className="text-[10px] text-slate-500">{inc.location} • {inc.date}</p>
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Notifications */}
        {profile && <NotificationDropdown userId={profile.id} />}

        {/* Theme toggle */}
        <button onClick={toggleTheme} className="p-2 text-slate-400 hover:text-white" aria-label="Toggle theme">
          {theme === 'dark' ? '☀' : '☾'}
        </button>

        {/* Profile */}
        <div className="relative" ref={profileRef}>
          <button
            onClick={() => setProfileOpen(!profileOpen)}
            className="flex items-center gap-2 text-slate-300 hover:text-white"
          >
            <div className="w-8 h-8 rounded-full bg-cyan-500/20 border border-cyan-500/30 flex items-center justify-center">
              <User className="w-4 h-4 text-cyan-400" />
            </div>
            <div className="hidden md:block text-left">
              <p className="text-xs text-white">{profile?.full_name}</p>
              {profile && <RoleBadge role={profile.role} />}
            </div>
          </button>
          <AnimatePresence>
            {profileOpen && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                className="absolute right-0 top-full mt-2 w-48 glass-panel z-50"
              >
                <div className="p-3 border-b border-cyan-500/10">
                  <p className="text-xs text-white">{profile?.full_name}</p>
                  <p className="text-[10px] text-slate-500">{profile?.email}</p>
                </div>
                <button
                  onClick={() => { navigate('/dashboard/settings'); setProfileOpen(false); }}
                  className="w-full px-3 py-2 text-left text-xs text-slate-300 hover:bg-cyan-500/5 flex items-center gap-2"
                >
                  <Settings className="w-3 h-3" /> Settings
                </button>
                <button
                  onClick={handleSignOut}
                  className="w-full px-3 py-2 text-left text-xs text-red-400 hover:bg-red-500/5 flex items-center gap-2"
                >
                  <LogOut className="w-3 h-3" /> Sign Out
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </header>
  );
}

import type { CrimeIncident } from '@/lib/types';

export function DashboardLayout() {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="flex min-h-screen" style={{ background: 'var(--bg-primary)' }}>
      <Sidebar
        collapsed={collapsed}
        setCollapsed={setCollapsed}
        mobileOpen={mobileOpen}
        setMobileOpen={setMobileOpen}
      />
      <div className="flex-1 min-w-0 flex flex-col">
        <Topbar onMobileMenu={() => setMobileOpen(true)} />
        <main className="flex-1 p-4 lg:p-6 overflow-x-hidden">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
