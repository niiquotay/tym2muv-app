import React from 'react';
import { Link } from 'react-router-dom';
import { Category } from '../types';
import Icon from './Icon';

interface CategorySidebarProps {
  categories: Category[];
}

const CategorySidebar: React.FC<CategorySidebarProps> = ({ categories }) => {
  return (
    <div className="glass rounded-2xl p-4 shadow-sm h-[calc(100vh-8rem)] overflow-y-auto custom-scrollbar">
      <div className="flex items-center gap-2 mb-4 px-2 pb-2 border-b border-slate-200/50">
        <Icon name="menu" size={18} className="text-brand-600" />
        <h3 className="font-bold text-lg text-slate-800">Categories</h3>
      </div>
      <div className="space-y-1">
        {categories.map((category) => (
          <Link 
            key={category.id} 
            to={`/category/${category.id}`}
            className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-white/60 hover:shadow-sm text-slate-600 hover:text-brand-700 transition-all group relative overflow-hidden"
          >
             {/* Hover Highlight */}
            <div className="absolute inset-0 bg-gradient-to-r from-brand-50/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

            <div className={`relative z-10 w-9 h-9 rounded-lg flex items-center justify-center ${category.color} bg-opacity-20 group-hover:bg-opacity-100 group-hover:text-white transition-all shadow-sm`}>
              <Icon 
                name={category.iconName} 
                size={20}
                variant="3d"
                className="group-hover:text-white transition-colors"
              />
            </div>
            
            <span className="relative z-10 text-sm font-medium truncate group-hover:translate-x-1 transition-transform">{category.name}</span>
            
            <div className="relative z-10 ml-auto opacity-0 group-hover:opacity-100 transition-opacity transform group-hover:translate-x-0 -translate-x-2">
               <Icon name="chevronRight" size={14} className="text-brand-400" />
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default CategorySidebar;