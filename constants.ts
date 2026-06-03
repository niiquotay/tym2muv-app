import { Category } from './types';

export const APP_NAME = "tym2muv Real Estate";

export const CATEGORIES: Category[] = [
  {
    id: 'houses',
    name: 'Houses',
    description: 'Find beautiful apartments, houses, condos, and villas for rent or sale.',
    iconName: 'home',
    color: 'bg-blue-100 text-blue-600',
    subcategories: [
      { id: 'apartments', name: 'Apartments' },
      { id: 'houses-res', name: 'Houses & Villas' },
      { id: 'condos', name: 'Condos & Townhouses' },
    ]
  },
  {
    id: 'land',
    name: 'Land',
    description: 'Browse residential, agricultural, and commercial land or plots.',
    iconName: 'mapPin',
    color: 'bg-emerald-100 text-emerald-600',
    subcategories: [
      { id: 'residential-plots', name: 'Residential Plots' },
      { id: 'agricultural-plots', name: 'Agricultural Plots' },
      { id: 'commercial-plots', name: 'Commercial Land' },
    ]
  },
  {
    id: 'offices',
    name: 'Offices',
    description: 'Corporate headquarters, commercial offices, co-working, and retail spaces.',
    iconName: 'briefcase',
    color: 'bg-amber-100 text-amber-600',
    subcategories: [
      { id: 'private-offices', name: 'Private Offices' },
      { id: 'coworking', name: 'Co-working' },
      { id: 'retail-shops', name: 'Retail Shops' },
    ]
  },
  {
    id: 'warehouses',
    name: 'Warehouses & Storage',
    description: 'Find storage spaces, industrial warehouses, cold rooms, and fulfillment centers.',
    iconName: 'package',
    color: 'bg-indigo-100 text-indigo-600',
    subcategories: [
      { id: 'storage', name: 'Storage Units' },
      { id: 'warehouses-ind', name: 'Industrial Warehouses' },
      { id: 'cold-storage', name: 'Cold Rooms' },
    ]
  },
  {
    id: 'services',
    name: 'Property Services',
    description: 'Professional services for property owners and seekers.',
    iconName: 'wrench',
    color: 'bg-purple-100 text-purple-600',
    subcategories: [
      { id: 'agents', name: 'Real Estate Agents' },
      { id: 'legal', name: 'Legal & Conveyancing' },
      { id: 'moving', name: 'Moving & Logistics' },
      { id: 'interior', name: 'Interior Design' },
      { id: 'valuation', name: 'Property Valuation' },
    ]
  },
];
