import React, { useState } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Compass, 
  FileText, 
  Bookmark, 
  User, 
  MessageSquare, 
  Bell, 
  Settings, 
  LogOut, 
  Search, 
  Menu, 
  X,
  Briefcase
} from 'lucide-react';
import BrandLogo from '../components/BrandLogo';
import { useScholar } from '../context/ScholarContext';

const NAV_ITEMS = [
  { name: 'Dashboard', path: '/student/dashboard', icon: LayoutDashboard },
  { name: 'Explore Opportunities', path: '/student/explore', icon: Compass },
  { name: 'My Applications', path: '/student/applications', icon: FileText },
  { name: 'Resume & Portfolio', path: '/student/portfolio', icon: Briefcase },
  { name: 'Saved Opportunities', path: '/student/saved', icon: Bookmark },
  { name: 'My Profile', path: '/student/profile', icon: User },
  { name: 'Messages', path: '/student/messages', icon: MessageSquare },
  { name: 'Notifications', path: '/student/notifications', icon: Bell },
  { name: 'Settings', path: '/student/settings', icon: Settings },
];

export default function StudentLayout({ children, globalSearch, onGlobalSearchChange, sidebarExtra }) {
  const { 
    studentProfile, 
    applications, 
    savedOpportunities, 
    notifications, 
    unreadNotificationsCount, 
    unreadMessagesCount,
    markNotificationAsRead 
  } = useScholar();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [notificationOpen, setNotificationOpen] = useState(false);

  const handleLogout = () => {
    navigate('/login');
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (location.pathname !== '/student/explore') {
      navigate('/student/explore');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col text-slate-900 selection:bg-indigo-100 selection:text-indigo-900">
      
      {/* Top Navigation Bar */}
      <header className="sticky top-0 z-40 w-full bg-white border-b border-slate-200/90 shadow-2xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          
          {/* Brand Logo & Mobile Menu Toggle */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-100"
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
            <BrandLogo size="default" to="/student/dashboard" accentColor="indigo" />
          </div>

          {/* Central Search Bar */}
          <div className="hidden md:flex flex-1 max-w-xl mx-4">
            <form onSubmit={handleSearchSubmit} className="relative w-full">
              <div className="pointer-events-none absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400">
                <Search className="w-4 h-4" />
              </div>
              <input
                type="text"
                value={globalSearch || ''}
                onChange={(e) => onGlobalSearchChange?.(e.target.value)}
                onFocus={() => {
                  if (location.pathname !== '/student/explore') {
                    navigate('/student/explore');
                  }
                }}
                placeholder="Search research, internships, hackathons, skills..."
                className="w-full text-xs sm:text-sm pl-10 pr-4 py-2 rounded-xl bg-slate-100/80 hover:bg-slate-100 focus:bg-white border border-slate-200/90 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 outline-none transition-all placeholder:text-slate-400"
              />
            </form>
          </div>

          {/* Right Profile & Notification Controls */}
          <div className="flex items-center gap-3">
            {/* Notification Icon */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setNotificationOpen(!notificationOpen)}
                className="relative p-2 rounded-xl text-slate-500 hover:text-indigo-600 hover:bg-slate-100 transition-colors"
                aria-label="Notifications"
              >
                <Bell className="w-5 h-5" />
                {unreadNotificationsCount > 0 && (
                  <span className="absolute top-1 right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-indigo-600 text-white text-[10px] font-bold flex items-center justify-center ring-2 ring-white">
                    {unreadNotificationsCount}
                  </span>
                )}
              </button>

              {/* Quick Notification Dropdown */}
              {notificationOpen && (
                <div 
                  className="absolute right-0 mt-2 w-80 bg-white rounded-2xl shadow-xl border border-slate-200 p-4 text-left z-50 animate-fadeIn"
                  onClick={() => setNotificationOpen(false)}
                >
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
                    <span className="text-xs font-bold text-slate-900 uppercase">Recent Updates</span>
                    <NavLink to="/student/notifications" className="text-[11px] font-semibold text-indigo-600 hover:underline">
                      View all ({notifications.length})
                    </NavLink>
                  </div>
                  <div className="space-y-2 text-xs max-h-64 overflow-y-auto">
                    {notifications.length === 0 ? (
                      <p className="text-slate-400 py-3 text-center text-xs">No notifications yet</p>
                    ) : (
                      notifications.slice(0, 3).map((n) => (
                        <div 
                          key={n.id || n._id} 
                          onClick={() => {
                            if (!n.isRead) markNotificationAsRead(n.id || n._id);
                          }}
                          className={`p-2.5 rounded-xl border transition-colors cursor-pointer ${
                            !n.isRead 
                              ? 'bg-indigo-50/70 border-indigo-100 text-indigo-900 font-semibold' 
                              : 'bg-slate-50 border-slate-100 text-slate-700'
                          }`}
                        >
                          <p className="font-semibold">{n.title}</p>
                          <p className="text-slate-600 text-[11px] mt-0.5 line-clamp-2">{n.message || n.desc}</p>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Student Profile Quick View */}
            <NavLink
              to="/student/profile"
              className="flex items-center gap-2.5 p-1 sm:px-2.5 sm:py-1.5 rounded-xl hover:bg-slate-100 transition-colors border border-transparent hover:border-slate-200"
            >
              <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-600 to-indigo-800 text-white font-bold text-xs flex items-center justify-center shadow-xs">
                {studentProfile.fullName?.charAt(0) || 'S'}
              </div>
              <div className="hidden sm:flex flex-col text-left">
                <span className="text-xs font-bold text-slate-900 leading-tight">
                  {studentProfile.fullName}
                </span>
                <span className="text-[11px] text-slate-500 truncate max-w-[120px]">
                  {studentProfile.degree} • {studentProfile.academicYear}
                </span>
              </div>
            </NavLink>
          </div>

        </div>
      </header>

      {/* Main Workspace Layout (Sidebar + Content) */}
      <div className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 flex gap-6">
        
        {/* Desktop Left Sidebar */}
        <aside className="hidden lg:flex flex-col w-72 shrink-0 bg-white rounded-2xl border border-slate-200/90 shadow-subtle p-4 h-[calc(100vh-5.5rem)] sticky top-20 overflow-hidden justify-between">
          <div className="flex-1 overflow-y-auto pr-1 space-y-3">
            <div className="space-y-1">
              <div className="px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Student Workspace
              </div>

              {NAV_ITEMS.map((item) => {
                const Icon = item.icon;
                return (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    className={({ isActive }) =>
                      `flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                        isActive
                          ? 'bg-indigo-50 text-indigo-700 shadow-2xs font-bold border border-indigo-100/80'
                          : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                      }`
                    }
                  >
                    <div className="flex items-center gap-2.5">
                      <Icon className="w-4 h-4" />
                      <span>{item.name}</span>
                    </div>
                    {item.path === '/student/notifications' && unreadNotificationsCount > 0 ? (
                      <span className="px-1.5 py-0.5 rounded-md text-[10px] font-bold bg-indigo-600 text-white">
                        {unreadNotificationsCount}
                      </span>
                    ) : item.path === '/student/messages' && unreadMessagesCount > 0 ? (
                      <span className="px-1.5 py-0.5 rounded-md text-[10px] font-bold bg-indigo-600 text-white animate-pulse">
                        {unreadMessagesCount}
                      </span>
                    ) : item.badge ? (
                      <span className="px-1.5 py-0.5 rounded-md text-[10px] font-bold bg-indigo-100 text-indigo-700">
                        {item.badge}
                      </span>
                    ) : null}
                    {item.path === '/student/applications' && applications.length > 0 && (
                      <span className="px-1.5 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 text-slate-600">
                        {applications.length}
                      </span>
                    )}
                    {item.path === '/student/saved' && savedOpportunities.length > 0 && (
                      <span className="px-1.5 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 text-slate-600">
                        {savedOpportunities.length}
                      </span>
                    )}
                  </NavLink>
                );
              })}
            </div>

            {/* Injected Content in Left Sidebar Empty Space (e.g., Filters on Explore Opportunities) */}
            {sidebarExtra && (
              <div className="pt-3 border-t border-slate-100">
                {sidebarExtra}
              </div>
            )}
          </div>

          {/* Bottom Sidebar Action: Portal Status & Logout */}
          <div className="pt-3 border-t border-slate-100 shrink-0 space-y-2">
            <div className="px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-100 text-[11px] text-slate-500 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                Scholar Portal Active
              </span>
              <span className="font-semibold text-slate-700">v1.2</span>
            </div>

            <button
              type="button"
              onClick={handleLogout}
              className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-rose-600 hover:bg-rose-50 transition-colors"
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
                  <BrandLogo size="small" to="/student/dashboard" />
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
                          `flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold ${
                            isActive
                              ? 'bg-indigo-50 text-indigo-700 font-bold'
                              : 'text-slate-600 hover:bg-slate-50'
                          }`
                        }
                      >
                        <div className="flex items-center gap-3">
                          <Icon className="w-4 h-4" />
                          <span>{item.name}</span>
                        </div>
                        {item.path === '/student/notifications' && unreadNotificationsCount > 0 ? (
                          <span className="px-1.5 py-0.5 rounded-md text-[10px] font-bold bg-indigo-600 text-white">
                            {unreadNotificationsCount}
                          </span>
                        ) : item.path === '/student/messages' && unreadMessagesCount > 0 ? (
                          <span className="px-1.5 py-0.5 rounded-md text-[10px] font-bold bg-indigo-600 text-white">
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
