
import React from 'react';
import { Link } from 'react-router-dom';
import { Category } from '../types';
import Icon from './Icon';

interface CategoryGridProps {
  categories: Category[];
}

const CategoryGrid: React.FC<CategoryGridProps> = ({ categories }) => {
  return (
    <div className="grid grid-cols-2 min-[420px]:grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8 gap-3 sm:gap-4">
      {categories.map((category, index) => {
        // Extract the color name from the bg class (e.g., "bg-blue-100" -> "blue")
        const colorMatch = category.color.match(/bg-([a-z]+)-/);
        const colorName = colorMatch ? colorMatch[1] : 'slate';
        
        return (
          <Link 
            key={category.id} 
            to={`/category/${category.id}`}
            className={`group relative flex flex-col items-center justify-center p-4 rounded-2xl border border-white/40 shadow-sm transition-all duration-300 bg-white/40 backdrop-blur-sm
              hover:bg-white/90 hover:scale-[1.05] hover:-translate-y-1 hover:shadow-xl hover:z-10
              hover:border-${colorName}-400 hover:shadow-${colorName}-500/20`}
          >
            {/* Icon Container with Dynamic Colors */}
            <div className={`relative w-14 h-14 mb-3 rounded-2xl flex items-center justify-center ${category.color} shadow-sm group-hover:shadow-md transition-all duration-300 bg-opacity-80 group/icon`}>
              <Icon 
                name={category.iconName} 
                size={32}
                variant="3d"
                className="drop-shadow-sm animate-icon-float"
                style={{ animationDelay: `${index * 0.1}s` }}
              />

              {/* Tooltip */}
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-max max-w-[150px] bg-slate-800 text-white text-[11px] font-medium rounded-xl py-2 px-3 opacity-0 group-hover/icon:opacity-100 transition-all duration-200 pointer-events-none z-50 text-center whitespace-normal leading-snug shadow-xl transform origin-bottom scale-95 group-hover/icon:scale-100">
                {category.name}
                {/* Arrow */}
                <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-slate-800"></div>
              </div>
            </div>
            
            {/* Category Name */}
            <span className={`text-xs sm:text-sm font-semibold text-slate-700 text-center leading-tight transition-colors group-hover:text-${colorName}-600`}>
              {category.name}
            </span>
            
            {/* Subtle chevron indicator on hover */}
            <div className={`absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-all duration-300 text-${colorName}-400`}>
               <Icon name="chevronRight" size={12} />
            </div>
          </Link>
        );
      })}
    </div>
  );
};

export default CategoryGrid;
