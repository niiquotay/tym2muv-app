import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import Icon from './Icon';
import { useAuth } from '../context/AuthContext';

const MobileBottomNav = () => {
  const location = useLocation();
  const { isAuthenticated, user } = useAuth();
  
  const navItems = [
    { name: 'Home', path: '/', icon: 'home' },
    { name: 'Search', path: '/search', icon: 'search' },
    { name: 'Saved', path: '/saved', icon: 'heart' },
    { name: 'Chat', path: '/chat', icon: 'messageCircle' },
    { name: 'Profile', path: isAuthenticated ? '/profile/me' : '/signin', icon: 'user' },
  ];

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-[100] bg-white border-t border-slate-100 pb-safe pb-4">
      <div className="flex items-center justify-around">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path || (item.path !== '/' && location.pathname.startsWith(item.path));
          
          return (
            <Link 
              key={item.name} 
              to={item.path}
              className={`flex flex-col items-center justify-center p-3 flex-1 ${isActive ? 'text-brand-600' : 'text-slate-400'}`}
            >
              <div className={`transition-transform ${isActive ? 'scale-110 mb-1' : 'mb-1'}`}>
                <Icon name={item.icon as any} size={24} />
              </div>
              <span className={`text-[10px] font-bold ${isActive ? 'text-brand-600' : 'text-slate-500'}`}>
                {item.name}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
};

export default MobileBottomNav;
