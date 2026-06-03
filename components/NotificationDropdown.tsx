import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Icon from './Icon';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';

const MOCK_NOTIFICATIONS = [
  { id: 1, title: 'New Message', text: 'You have a new message from Agent John', time: '5m ago', read: false, link: '/chat' },
  { id: 2, title: 'Property Update', text: 'Price dropped for "Luxury Villa in Cantonments"', time: '1h ago', read: false, link: '/listing/1' },
  { id: 3, title: 'Payment Success', text: 'Your premium ad payment was successful.', time: '1d ago', read: true, link: '/profile/me' },
];

const NotificationDropdown = () => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { isAuthenticated } = useAuth();
  
  const unreadCount = MOCK_NOTIFICATIONS.filter(n => !n.read).length;

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (!isAuthenticated) return null;

  return (
    <div className="relative" ref={dropdownRef}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="p-1.5 sm:p-2 text-slate-500 hover:text-brand-600 hover:bg-brand-50 rounded-full transition-all relative group"
        aria-label="Notifications"
      >
        <Icon name="bell" size={20} className="sm:w-[22px] sm:h-[22px]" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 flex h-3 w-3 items-center justify-center rounded-full bg-red-500 text-[8px] font-bold text-white border border-white">
            {unreadCount}
          </span>
        )}
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 mt-2 w-80 bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden z-[200]"
          >
            <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <h3 className="font-bold text-slate-900">Notifications</h3>
              <span className="text-xs font-medium text-brand-600 bg-brand-50 px-2 py-1 rounded-full cursor-pointer hover:bg-brand-100 transition-colors">
                Mark all as read
              </span>
            </div>
            
            <div className="max-h-[300px] overflow-y-auto custom-scrollbar">
              {MOCK_NOTIFICATIONS.length > 0 ? (
                <div className="flex flex-col">
                  {MOCK_NOTIFICATIONS.map((notif) => (
                    <Link 
                      key={notif.id}
                      to={notif.link}
                      onClick={() => setIsOpen(false)}
                      className={`p-4 border-b border-slate-50 hover:bg-slate-50 transition-colors ${!notif.read ? 'bg-brand-50/30' : ''}`}
                    >
                      <div className="flex gap-3">
                        <div className={`mt-0.5 w-2 h-2 rounded-full shrink-0 ${!notif.read ? 'bg-brand-500' : 'bg-transparent'}`} />
                        <div className="flex-1">
                          <h4 className={`text-sm font-semibold ${!notif.read ? 'text-slate-900' : 'text-slate-700'}`}>{notif.title}</h4>
                          <p className="text-xs text-slate-500 mt-0.5 leading-snug">{notif.text}</p>
                          <span className="text-[10px] font-medium text-slate-400 mt-2 block">{notif.time}</span>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="p-8 text-center text-slate-500 text-sm">
                  No new notifications
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default NotificationDropdown;
