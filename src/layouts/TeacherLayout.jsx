import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Compass,
  PlusCircle,
  Users,
  User,
  MessageSquare,
  Bell,
  Settings,
  LogOut,
  Search,
  Menu,
  X,
  ShieldCheck
} from 'lucide-react';
import BrandLogo from '../components/BrandLogo';
import { useScholar } from '../context/ScholarContext';

const NAV_ITEMS = [
  { name: 'Dashboard', path: '/teacher/dashboard', icon: LayoutDashboard },
  { name: 'My Opportunities', path: '/teacher/my-opportunities', icon: Compass },
  { name: 'Create Opportunity', path: '/teacher/create-opportunity', icon: PlusCircle, highlight: true },
  { name: 'Student Applicants', path: '/teacher/applicants', icon: Users },
  { name: 'Messages', path: '/teacher/messages', icon: MessageSquare },
  { name: 'Notifications', path: '/teacher/notifications', icon: Bell },
  { name: 'My Profile', path: '/teacher/profile', icon: User },
  { name: 'Settings', path: '/teacher/settings', icon: Settings },
];

export default function TeacherLayout({ children, globalSearch, onGlobalSearchChange }) {
  const {
    teacherProfile,
    applications,
    unreadNotificationsCount,
    unreadMessagesCount
  } = useScholar();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [notificationOpen, setNotificationOpen] = useState(false);

  const handleLogout = () => {
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col text-slate-900 selection:bg-teal-100 selection:text-teal-900">

      {/* Top Header */}
      <header className="sticky top-0 z-40 w-full bg-white border-b border-slate-200/90 shadow-2xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">

          {/* Logo & Mobile Menu Toggle */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-100"
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
            <BrandLogo size="default" to="/teacher/dashboard" accentColor="teal" />
          </div>

          {/* Search bar */}
          <div className="hidden md:flex flex-1 max-w-xl mx-4">
            <div className="relative w-full">
              <div className="pointer-events-none absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400">
                <Search className="w-4 h-4" />
              </div>
              <input
                type="text"
                value={globalSearch || ''}
                onChange={(e) => onGlobalSearchChange?.(e.target.value)}
                placeholder="Search opportunities, applicants, skills..."
                className="w-full text-xs sm:text-sm pl-10 pr-4 py-2 rounded-xl bg-slate-100/80 hover:bg-slate-100 focus:bg-white border border-slate-200/90 focus:border-teal-600 focus:ring-2 focus:ring-teal-100 outline-none transition-all placeholder:text-slate-400"
              />
            </div>
          </div>

          {/* Right Header items */}
          <div className="flex items-center gap-3">
            {/* Notifications icon */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setNotificationOpen(!notificationOpen)}
                className="relative p-2 rounded-xl text-slate-500 hover:text-teal-600 hover:bg-slate-100 transition-colors"
                aria-label="Notifications"
              >
                <Bell className="w-5 h-5" />
                <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-teal-600 ring-2 ring-white"></span>
              </button>

              {notificationOpen && (
                <div
                  className="absolute right-0 mt-2 w-80 bg-white rounded-2xl shadow-xl border border-slate-200 p-4 text-left z-50 animate-fadeIn"
                  onClick={() => setNotificationOpen(false)}
                >
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
                    <span className="text-xs font-bold text-slate-900 uppercase">Faculty Alerts</span>
                    <NavLink to="/teacher/notifications" className="text-[11px] font-semibold text-teal-600 hover:underline">
                      View all
                    </NavLink>
                  </div>
                  <div className="space-y-2.5 text-xs">
                    <div className="p-2 rounded-xl bg-teal-50/70 border border-teal-100">
                      <p className="font-semibold text-teal-900">New Student Application</p>
                      <p className="text-slate-600 text-[11px] mt-0.5">A student submitted an application for your IoT Agriculture project.</p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Teacher Profile Quick View */}
            <NavLink
              to="/teacher/profile"
              className="flex items-center gap-2.5 p-1 sm:px-2.5 sm:py-1.5 rounded-xl hover:bg-slate-100 transition-colors border border-transparent hover:border-slate-200"
            >
              <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-teal-600 to-teal-800 text-white font-bold text-xs flex items-center justify-center shadow-xs">
                {teacherProfile.fullName?.charAt(0) || 'T'}
              </div>
              <div className="hidden sm:flex flex-col text-left">
                <span className="text-xs font-bold text-slate-900 leading-tight">
                  {teacherProfile.fullName}
                </span>
                <span className="text-[11px] text-teal-700 font-medium truncate max-w-[130px]">
                  {teacherProfile.designation}
                </span>
              </div>
            </NavLink>
          </div>

        </div>
      </header>

      {/* Main Workspace Layout (Sidebar + Content) */}
      <div className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 flex gap-6">

        {/* Desktop Left Sidebar */}
        <aside className="hidden lg:flex flex-col w-64 shrink-0 bg-white rounded-2xl border border-slate-200/90 shadow-subtle p-4 justify-between h-[calc(100vh-6.5rem)] sticky top-22">
          <div className="space-y-1">
            <div className="px-3 py-2 text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Faculty Workspace
            </div>

            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  className={({ isActive }) =>
                    `flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${isActive
                      ? 'bg-teal-50 text-teal-800 shadow-2xs font-bold border border-teal-200/80'
                      : item.highlight
                        ? 'text-teal-700 font-bold bg-teal-50/50 hover:bg-teal-50 border border-teal-100/50'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                    }`
                  }
                >
                  <div className="flex items-center gap-3">
                    <Icon className={`w-4 h-4 ${item.highlight ? 'text-teal-600' : ''}`} />
                    <span>{item.name}</span>
                  </div>
                  {item.path === '/teacher/notifications' && unreadNotificationsCount > 0 ? (
                    <span className="px-1.5 py-0.5 rounded-md text-[10px] font-bold bg-teal-600 text-white">
                      {unreadNotificationsCount}
                    </span>
                  ) : item.path === '/teacher/messages' && unreadMessagesCount > 0 ? (
                    <span className="px-1.5 py-0.5 rounded-md text-[10px] font-bold bg-teal-600 text-white animate-pulse">
                      {unreadMessagesCount}
                    </span>
                  ) : item.badge ? (
                    <span className="px-1.5 py-0.5 rounded-md text-[10px] font-bold bg-teal-100 text-teal-800">
                      {item.badge}
                    </span>
                  ) : null}
                  {item.path === '/teacher/applicants' && applications.length > 0 && (
                    <span className="px-1.5 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 text-slate-600">
                      {applications.length}
                    </span>
                  )}
                </NavLink>
              );
            })}
          </div>

          {/* Bottom Sidebar Action: Portal Status & Logout */}
          <div className="pt-4 border-t border-slate-100 space-y-2">
            <div className="px-3 py-2 rounded-xl bg-slate-50 border border-slate-100 text-[11px] text-slate-500 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-teal-600" />
                Faculty Verified
              </span>
              <span className="font-semibold text-slate-700">v1.2</span>
            </div>

            <button
              type="button"
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold text-rose-600 hover:bg-rose-50 transition-colors"
            >
              <LogOut className="w-4 h-4" />
              <span>Logout</span>
            </button>
          </div>
        </aside>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div
            className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs lg:hidden"
            onClick={() => setMobileMenuOpen(false)}
          >
            <div
              className="w-72 max-w-[85vw] h-full bg-white shadow-2xl p-5 flex flex-col justify-between"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <BrandLogo size="small" to="/teacher/dashboard" accentColor="teal" />
                  <button
                    onClick={() => setMobileMenuOpen(false)}
                    className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <nav className="space-y-1">
                  {NAV_ITEMS.map((item) => {
                    const Icon = item.icon;
                    return (
                      <NavLink
                        key={item.path}
                        to={item.path}
                        onClick={() => setMobileMenuOpen(false)}
                        className={({ isActive }) =>
                          `flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold ${isActive
                            ? 'bg-teal-50 text-teal-800 font-bold'
                            : 'text-slate-600 hover:bg-slate-50'
                          }`
                        }
                      >
                        <div className="flex items-center gap-3">
                          <Icon className="w-4 h-4" />
                          <span>{item.name}</span>
                        </div>
                        {item.path === '/teacher/notifications' && unreadNotificationsCount > 0 ? (
                          <span className="px-1.5 py-0.5 rounded-md text-[10px] font-bold bg-teal-600 text-white">
                            {unreadNotificationsCount}
                          </span>
                        ) : item.path === '/teacher/messages' && unreadMessagesCount > 0 ? (
                          <span className="px-1.5 py-0.5 rounded-md text-[10px] font-bold bg-teal-600 text-white">
                            {unreadMessagesCount}
                          </span>
                        ) : null}
                      </NavLink>
                    );
                  })}
                </nav>
              </div>

              <div className="pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={handleLogout}
                  className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold text-rose-600 hover:bg-rose-50"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Logout</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Main Section Content Container */}
        <main className="flex-1 min-w-0">
          {children}
        </main>

      </div>
    </div>
  );
}
