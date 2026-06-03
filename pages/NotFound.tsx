import React from 'react';
import { Link } from 'react-router-dom';
import Icon from '../components/Icon';

const NotFound: React.FC = () => (
  <div className="min-h-[60vh] flex flex-col items-center justify-center text-center px-4">
    <Icon name="search" size={64} className="text-slate-200 mb-6"/>
    <h1 className="text-5xl font-extrabold text-slate-800 mb-2">404</h1>
    <p className="text-xl text-slate-500 mb-8">This page doesn't exist.</p>
    <Link to="/" className="px-6 py-3 bg-brand-600 text-white rounded-xl font-bold hover:bg-brand-700 transition-colors">
      Go Home
    </Link>
  </div>
);

export default NotFound;
