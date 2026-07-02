import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { dataService } from '../../utils/dataService';
import { toast } from 'react-hot-toast';
import { 
  FiMenu, 
  FiBell, 
  FiSun, 
  FiMoon, 
  FiChevronDown, 
  FiUser, 
  FiSettings, 
  FiLogOut,
  FiDatabase,
  FiInfo,
  FiCheck
} from 'react-icons/fi';

const Topbar = ({ onMenuToggle }) => {
  const { profile, logout, isDemoMode } = useAuth();
  const { darkMode, toggleTheme } = useTheme();
  const navigate = useNavigate();

  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showDemoModal, setShowDemoModal] = useState(false);

  const notifRef = useRef(null);
  const profileRef = useRef(null);

  // Fetch notifications
  const fetchNotifications = () => {
    dataService.getNotifications().then(({ data }) => {
      if (data) {
        setNotifications(data);
        setUnreadCount(data.filter(n => !n.is_read).length);
      }
    });
  };

  useEffect(() => {
    fetchNotifications();
    // Poll notifications every 10 seconds in Demo Mode / Real Mode for updates
    const interval = setInterval(fetchNotifications, 10000);
    return () => clearInterval(interval);
  }, []);

  // Close dropdowns on outside click
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setShowNotifications(false);
      }
      if (profileRef.current && !profileRef.current.contains(e.target)) {
        setShowProfileMenu(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  const handleMarkAsRead = async (id) => {
    const { error } = await dataService.markNotificationAsRead(id);
    if (!error) {
      fetchNotifications();
    }
  };

  const handleClearAll = async () => {
    const { error } = await dataService.clearAllNotifications();
    if (!error) {
      fetchNotifications();
      toast.success('Cleared all notifications');
    }
  };

  const handleLogout = async () => {
    const { error } = await logout();
    if (!error) {
      toast.success('Logged out successfully');
      navigate('/login');
    } else {
      toast.error('Logout failed');
    }
  };

  return (
    <>
      <header className="sticky top-0 z-30 flex items-center justify-between h-16 px-4 sm:px-6 bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-850 transition-colors duration-200">
        <div className="flex items-center gap-3">
          {/* Mobile Menu Toggle */}
          <button
            onClick={onMenuToggle}
            className="lg:hidden p-2 text-gray-500 hover:bg-gray-550/20 dark:hover:bg-gray-800 rounded-lg focus:outline-none"
          >
            <FiMenu className="w-5 h-5" />
          </button>

          {/* Local Demo Mode Badge */}
          {isDemoMode && (
            <button
              onClick={() => setShowDemoModal(true)}
              className="flex items-center gap-1.5 px-3 py-1 text-xs font-semibold text-amber-800 bg-amber-50 hover:bg-amber-100 border border-amber-250 dark:text-amber-300 dark:bg-amber-950/40 dark:border-amber-900/50 rounded-full transition-all duration-200 animate-pulse"
            >
              <FiDatabase className="w-3.5 h-3.5" />
              <span>Local Demo Mode</span>
              <FiInfo className="w-3 h-3 text-amber-500 dark:text-amber-400" />
            </button>
          )}
        </div>

        {/* Action icons & Profile */}
        <div className="flex items-center gap-2 sm:gap-4">
          {/* Light / Dark Mode Toggle */}
          <button
            onClick={toggleTheme}
            className="p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-all duration-200"
            title={darkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          >
            {darkMode ? <FiSun className="w-5 h-5" /> : <FiMoon className="w-5 h-5" />}
          </button>

          {/* Notifications Dropdown */}
          <div className="relative" ref={notifRef}>
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-all duration-200"
            >
              <FiBell className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute top-1.5 right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white ring-2 ring-white dark:ring-gray-900">
                  {unreadCount}
                </span>
              )}
            </button>

            {showNotifications && (
              <div className="absolute right-0 mt-2 w-80 sm:w-96 origin-top-right rounded-2xl bg-white dark:bg-gray-900 py-2 shadow-xl border border-gray-100 dark:border-gray-800 ring-1 ring-black/5 focus:outline-none overflow-hidden">
                <div className="flex items-center justify-between px-4 py-2 border-b border-gray-100 dark:border-gray-800">
                  <span className="font-semibold text-sm text-gray-900 dark:text-white">Notifications</span>
                  {unreadCount > 0 && (
                    <button 
                      onClick={handleClearAll}
                      className="text-xs text-brand-600 hover:text-brand-700 dark:text-brand-400 dark:hover:text-brand-300 font-medium"
                    >
                      Mark all read
                    </button>
                  )}
                </div>

                <div className="max-h-72 overflow-y-auto divide-y divide-gray-100 dark:divide-gray-800">
                  {notifications.length === 0 ? (
                    <div className="px-4 py-8 text-center text-gray-500 dark:text-gray-400 text-sm">
                      No notifications yet
                    </div>
                  ) : (
                    notifications.map((notif) => (
                      <div 
                        key={notif.id} 
                        className={`flex gap-3 p-4 hover:bg-gray-50 dark:hover:bg-gray-850/50 transition-colors duration-150 ${
                          !notif.is_read ? 'bg-brand-50/20 dark:bg-brand-950/10' : ''
                        }`}
                      >
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-semibold text-gray-900 dark:text-white">{notif.title}</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">{notif.message}</p>
                          <span className="text-[10px] text-gray-400 dark:text-gray-500 mt-1 block">
                            {new Date(notif.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        {!notif.is_read && (
                          <button 
                            onClick={() => handleMarkAsRead(notif.id)}
                            className="p-1 text-gray-400 hover:text-brand-600 dark:hover:text-brand-400"
                            title="Mark as read"
                          >
                            <FiCheck className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="h-6 w-px bg-gray-200 dark:bg-gray-800"></div>

          {/* Profile User Dropdown */}
          <div className="relative" ref={profileRef}>
            <button
              onClick={() => setShowProfileMenu(!showProfileMenu)}
              className="flex items-center gap-2.5 p-1 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 focus:outline-none transition-all duration-200"
            >
              <img
                src={profile?.avatar_url || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(profile?.full_name || 'Staff')}`}
                alt="Avatar"
                className="w-8 h-8 rounded-full border border-gray-200 dark:border-gray-700 object-cover"
              />
              <div className="hidden sm:flex flex-col text-left">
                <span className="text-xs font-semibold text-gray-900 dark:text-white leading-tight">
                  {profile?.full_name || 'System User'}
                </span>
                <span className="text-[10px] text-gray-500 dark:text-gray-400 leading-none mt-0.5">
                  {profile?.role || 'Staff'}
                </span>
              </div>
              <FiChevronDown className="hidden sm:block w-4 h-4 text-gray-500" />
            </button>

            {showProfileMenu && (
              <div className="absolute right-0 mt-2 w-52 origin-top-right rounded-2xl bg-white dark:bg-gray-900 p-1.5 shadow-xl border border-gray-100 dark:border-gray-800 ring-1 ring-black/5 focus:outline-none">
                <div className="px-3 py-2 border-b border-gray-100 dark:border-gray-800 mb-1">
                  <p className="text-xs font-semibold text-gray-500 dark:text-gray-400">Signed in as</p>
                  <p className="text-xs font-medium text-gray-900 dark:text-white truncate mt-0.5">{profile?.email}</p>
                </div>
                
                <Link
                  to="/settings"
                  onClick={() => setShowProfileMenu(false)}
                  className="flex items-center gap-2.5 px-3 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-850 rounded-xl transition-all duration-200"
                >
                  <FiUser className="w-4 h-4" />
                  <span>My Profile</span>
                </Link>

                <Link
                  to="/settings"
                  onClick={() => setShowProfileMenu(false)}
                  className="flex items-center gap-2.5 px-3 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-850 rounded-xl transition-all duration-200"
                >
                  <FiSettings className="w-4 h-4" />
                  <span>Settings</span>
                </Link>

                <div className="h-px bg-gray-100 dark:bg-gray-800 my-1"></div>

                <button
                  onClick={handleLogout}
                  className="flex items-center gap-2.5 w-full text-left px-3 py-2.5 text-sm font-medium text-red-650 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/20 rounded-xl transition-all duration-200"
                >
                  <FiLogOut className="w-4 h-4" />
                  <span>Sign Out</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Info Modal for Local Demo Mode */}
      {showDemoModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/50 dark:bg-black/60 backdrop-blur-sm">
          <div className="relative w-full max-w-md p-6 bg-white dark:bg-gray-900 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-800">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-gray-800 mb-4">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <FiDatabase className="text-amber-500" />
                <span>Running in Demo Mode</span>
              </h3>
              <button 
                onClick={() => setShowDemoModal(false)}
                className="text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-850 p-1.5 rounded-lg"
              >
                <FiX className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-3.5 text-sm text-gray-650 dark:text-gray-300">
              <p>
                ApexEvents is currently running in <strong>Local Demo Mode</strong> because no valid Supabase environment variables were detected in your project setup.
              </p>
              <p>
                All data is simulated and saved to your browser's local storage database. You can add events, register attendees, execute manual check-ins, view charts, and change settings immediately.
              </p>
              <p className="font-semibold text-gray-900 dark:text-white">
                To connect your real database:
              </p>
              <ol className="list-decimal list-inside space-y-1 bg-gray-50 dark:bg-gray-850 p-3 rounded-xl border border-gray-100 dark:border-gray-800 text-xs font-mono">
                <li>Create a Supabase project</li>
                <li>Run the schema script: <br /><span className="text-brand-500 font-semibold">supabase_schema.sql</span></li>
                <li>Add these keys to your .env: <br />
                  VITE_SUPABASE_URL=... <br />
                  VITE_SUPABASE_ANON_KEY=...
                </li>
              </ol>
            </div>
            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setShowDemoModal(false)}
                className="px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white font-medium rounded-xl transition-all duration-200"
              >
                Got It
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Topbar;
