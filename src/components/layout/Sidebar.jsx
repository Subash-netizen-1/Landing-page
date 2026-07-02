import React, { useEffect, useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { dataService } from '../../utils/dataService';
import { 
  FiGrid, 
  FiCalendar, 
  FiUsers, 
  FiCheckSquare, 
  FiCreditCard, 
  FiBarChart2, 
  FiSettings, 
  FiX 
} from 'react-icons/fi';

const Sidebar = ({ isOpen, setIsOpen }) => {
  const { role } = useAuth();
  const location = useLocation();
  const [orgName, setOrgName] = useState('ApexEvents');
  const [orgLogo, setOrgLogo] = useState('');

  // Fetch Org Details
  useEffect(() => {
    dataService.getSettings().then(({ data }) => {
      if (data) {
        setOrgName(data.org_name || 'ApexEvents');
        setOrgLogo(data.org_logo_url || '');
      }
    });
  }, []);

  // Close sidebar on page change (mobile)
  useEffect(() => {
    setIsOpen(false);
  }, [location.pathname]);

  const navItems = [
    { name: 'Dashboard', path: '/', icon: FiGrid, roles: ['Super Admin', 'Event Manager', 'Staff'] },
    { name: 'Events', path: '/events', icon: FiCalendar, roles: ['Super Admin', 'Event Manager', 'Staff'] },
    { name: 'Attendees', path: '/attendees', icon: FiUsers, roles: ['Super Admin', 'Event Manager', 'Staff'] },
    { name: 'Check-In', path: '/check-in', icon: FiCheckSquare, roles: ['Super Admin', 'Event Manager', 'Staff'] },
    { name: 'Payments', path: '/payments', icon: FiCreditCard, roles: ['Super Admin', 'Event Manager', 'Staff'] },
    { name: 'Reports', path: '/reports', icon: FiBarChart2, roles: ['Super Admin', 'Event Manager'] },
    { name: 'Settings', path: '/settings', icon: FiSettings, roles: ['Super Admin', 'Event Manager', 'Staff'] },
  ];

  const filteredItems = navItems.filter(item => item.roles.includes(role));

  const sidebarContent = (
    <div className="flex flex-col h-full bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 transition-colors duration-200">
      {/* Brand Header */}
      <div className="flex items-center justify-between h-16 px-6 border-b border-gray-100 dark:border-gray-800">
        <div className="flex items-center gap-3">
          {orgLogo ? (
            <img src={orgLogo} alt="Logo" className="w-8 h-8 rounded-lg object-cover" />
          ) : (
            <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-brand-600 text-white font-bold text-lg font-display">
              A
            </div>
          )}
          <span className="font-semibold text-lg text-gray-900 dark:text-white tracking-wide font-display">
            {orgName}
          </span>
        </div>
        
        {/* Mobile close button */}
        <button 
          onClick={() => setIsOpen(false)}
          className="lg:hidden p-1.5 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-850 rounded-lg"
        >
          <FiX className="w-5 h-5" />
        </button>
      </div>

      {/* Navigation links */}
      <nav className="flex-1 px-4 py-6 space-y-1.5 overflow-y-auto">
        {filteredItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.name}
              to={item.path}
              className={({ isActive }) => 
                `flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-xl transition-all duration-200 ${
                  isActive 
                    ? 'bg-brand-50 dark:bg-brand-950/40 text-brand-600 dark:text-brand-400 shadow-sm border-l-4 border-brand-600' 
                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-850 hover:text-gray-900 dark:hover:text-white'
                }`
              }
            >
              <Icon className="w-5 h-5 flex-shrink-0" />
              <span>{item.name}</span>
            </NavLink>
          );
        })}
      </nav>

      {/* Role Footer */}
      <div className="p-4 border-t border-gray-100 dark:border-gray-850 bg-gray-50/50 dark:bg-gray-900/50">
        <div className="flex items-center gap-3">
          <div className="flex flex-col">
            <span className="text-xs text-gray-400 dark:text-gray-500 font-semibold tracking-wider uppercase">System Role</span>
            <span className="text-xs font-semibold text-brand-600 dark:text-brand-400 mt-0.5">
              {role || 'Loading...'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-40 bg-gray-900/50 dark:bg-black/60 backdrop-blur-sm lg:hidden transition-opacity duration-300"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Mobile Drawer */}
      <aside 
        className={`fixed inset-y-0 left-0 z-50 w-64 transform lg:hidden transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {sidebarContent}
      </aside>

      {/* Desktop Sidebar */}
      <aside className="hidden lg:block lg:w-64 lg:flex-shrink-0 h-full">
        {sidebarContent}
      </aside>
    </>
  );
};

export default Sidebar;
