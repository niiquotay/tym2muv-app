import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import Icon from './Icon';
import { useAuth } from '../context/AuthContext';

const ProfileDropdown: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = async () => {
    try {
      await logout();
      setIsOpen(false);
      navigate('/signin');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-9 h-9 rounded-full bg-slate-100 p-0.5 border border-slate-200 cursor-pointer hover:ring-2 hover:ring-brand-200 transition-all flex-shrink-0 flex items-center justify-center focus:outline-none"
        aria-label="User Profile Menu"
      >
        <img
          src={user?.avatar || 'https://via.placeholder.com/150'}
          alt="User Avatar"
          referrerPolicy="no-referrer"
          className="w-full h-full rounded-full object-cover"
        />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 mt-2 w-64 bg-white/95 backdrop-blur-md rounded-2xl shadow-xl border border-slate-100 overflow-hidden z-[200] divide-y divide-slate-50"
          >
            {/* Header info */}
            <div className="p-4 bg-slate-50/50">
              <p className="text-sm font-bold text-slate-800 truncate">
                {user?.name || user?.fullName || 'User'}
              </p>
              <p className="text-xs text-slate-500 truncate mt-0.5">
                {user?.socials?.email || user?.email || ''}
              </p>
              {user?.role && (
                <span className="inline-block mt-2 px-2 py-0.5 text-[10px] font-extrabold tracking-wider uppercase bg-brand-50 text-brand-700 rounded">
                  {user.role}
                </span>
              )}
            </div>

            {/* Menu options */}
            <div className="p-1.5 flex flex-col gap-0.5">
              <Link
                to="/profile/me"
                onClick={() => setIsOpen(false)}
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-brand-50/50 text-slate-700 hover:text-brand-700 text-sm font-semibold transition-all group"
              >
                <div className="p-1 rounded-lg bg-slate-50 group-hover:bg-brand-100/50 transition-colors">
                  <Icon name="user" size={16} className="text-slate-500 group-hover:text-brand-600" />
                </div>
                Profile
              </Link>

              <Link
                to="/settings"
                onClick={() => setIsOpen(false)}
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-brand-50/50 text-slate-700 hover:text-brand-700 text-sm font-semibold transition-all group"
              >
                <div className="p-1 rounded-lg bg-slate-50 group-hover:bg-brand-100/50 transition-colors">
                  <Icon name="settings" size={16} className="text-slate-500 group-hover:text-brand-600" />
                </div>
                Account Settings
              </Link>
              
              {user?.role === 'Admin' && (
                <Link
                  to="/admin"
                  onClick={() => setIsOpen(false)}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-orange-50/50 text-slate-700 hover:text-orange-700 text-sm font-semibold transition-all group"
                >
                  <div className="p-1 rounded-lg bg-slate-50 group-hover:bg-orange-100/50 transition-colors">
                    <Icon name="settings" size={16} className="text-slate-500 group-hover:text-orange-600" />
                  </div>
                  Admin Panel
                </Link>
              )}
              {user?.role === 'Agent' && (
                <Link
                  to="/agent-dashboard"
                  onClick={() => setIsOpen(false)}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-brand-50/50 text-slate-700 hover:text-brand-700 text-sm font-semibold transition-all group"
                >
                  <div className="p-1 rounded-lg bg-slate-50 group-hover:bg-brand-100/50 transition-colors">
                    <Icon name="layout" size={16} className="text-slate-500 group-hover:text-brand-600" />
                  </div>
                  Agent Dashboard
                </Link>
              )}
            </div>

            {/* Logout button */}
            <div className="p-1.5">
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-red-50 text-slate-700 hover:text-red-600 text-sm font-semibold transition-all group text-left"
              >
                <div className="p-1 rounded-lg bg-slate-50 group-hover:bg-red-100/50 transition-colors">
                  <Icon name="logout" size={16} className="text-slate-500 group-hover:text-red-500" />
                </div>
                Logout
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ProfileDropdown;
