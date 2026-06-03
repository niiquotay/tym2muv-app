
export interface SubCategory {
  id: string;
  name: string;
}

export interface Category {
  id: string;
  name: string;
  description?: string;
  iconName: string;
  subcategories: SubCategory[];
  color: string;
}

export type PropertyType = 'Apartment' | 'House' | 'Condo' | 'Land' | 'Commercial' | 'Office' | 'Retail' | 'Warehouse' | 'Villa';
export type ListingType = 'Rent' | 'Sale';

export interface Country {
  code: string;
  name: string;
  flag: string;
  flagUrl: string;
  currency: string;
  symbol: string;
}

export interface Listing {
  id: string;
  title: string;
  price: number;
  currency: string;
  location: string;
  country: string; // Country code (e.g., 'GH', 'NG')
  imageUrl: string; // Primary thumbnail
  images?: string[]; // Array of all images
  videos?: string[]; // Array of video URLs
  categoryId: string;
  subcategoryId?: string;
  isFeatured?: boolean;
  isPremium?: boolean;
  datePosted: string;
  expiryDate: string;
  sellerId: string; // Link to a user (Agent)
  description: string;
  status?: 'pending' | 'active' | 'rejected'; // Approval status
  
  // Real Estate Specific Fields
  type: ListingType;
  propertyType: PropertyType;
  bedrooms?: number;
  bathrooms?: number;
  sqft?: number;
  amenities?: string[];
  furnished?: boolean;
  parking?: boolean;
  security?: boolean;
  petsAllowed?: boolean;
  yearBuilt?: number;
  isVerified?: boolean;
  virtualTourUrl?: string;
}

export interface SearchFilters {
  categoryId?: string;
  subcategoryId?: string;
  minPrice?: string;
  maxPrice?: string;
  location?: string;
  type?: ListingType;
  propertyType?: PropertyType;
  bedrooms?: number;
  bathrooms?: number;
  sortBy?: string;
  page?: number;
  limit?: number;
  pageSize?: number;
  countryCode?: string;
  sellerId?: string;
  agent_id?: string;
  status?: string;
  startDate?: string;
  endDate?: string;
  query?: string;
  isAdminQuery?: boolean;
}

export type UserRole = 'Agent' | 'Customer' | 'Admin' | 'Tenant';

export interface User {
  id: string;
  name: string;
  email?: string;
  avatar: string;
  rating: number;
  reviewCount: number;
  location: string;
  memberSince: string;
  bio: string;
  verified: boolean;
  role: UserRole;
  savedListings?: string[]; // Array of saved listing IDs
  socials: {
    whatsapp?: string;
    facebook?: string;
    instagram?: string;
    twitter?: string;
    linkedin?: string;
    phone?: string;
    email?: string;
    website?: string;
  };
}

export interface Agent extends User {
  agencyName?: string;
  licenseNumber?: string;
  specialization?: string[];
}

export interface Payment {
  id: string;
  userId: string;
  amount: number;
  currency: string;
  status: 'pending' | 'completed' | 'failed' | 'refunded';
  purpose: 'subscription' | 'promotion' | 'listing_fee';
  referenceId?: string; // listingId or subscriptionId
  createdAt: string;
  gateway?: string;
}

export interface ChatMessage {
  id: string;
  senderId: string;
  text: string;
  timestamp: string;
  isRead: boolean;
}

export interface Chat {
  id: string;
  participants: string[];
  listingId?: string;
  messages: ChatMessage[];
  lastMessage: string;
  lastMessageTime: string;
  unreadCount: number;
  lastSenderId?: string;
}

export interface ViewRequest {
  id: string;
  listingId: string;
  tenantId: string;
  agentId: string;
  status: 'pending' | 'approved' | 'rejected' | 'completed';
  requestedDate: string;
  requestedTime: string;
  message?: string;
  createdAt: string;
}

export interface Monetization {
  id: string;
  type: 'banner' | 'popup' | 'card' | 'tall';
  title: string;
  description: string;
  cta: string;
  image: string;
  link: string;
  color: string;
  active: boolean;
  countryCode?: string;
  priority: number;
  clicks: number;
  impressions: number;
  createdAt: string;
}

export interface Review {
  id: string;
  vendorId: string;
  customerId: string;
  rating: number;
  comment?: string;
  createdAt: string;
}

export interface StaticPage {
  id: string;
  slug: string;
  title: string;
  content: string;
  published: boolean;
  metaTitle?: string;
  metaDescription?: string;
  createdAt: string;
  updatedAt: string;
}

export interface BlogPost {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  content: string;
  published: boolean;
  coverImage?: string;
  authorName: string;
  category: string;
  readTime?: string;
  createdAt: string;
  updatedAt: string;
}

export interface RentFinancingApplication {
  id: string;
  userId?: string;
  
  // Personal Information
  fullName: string;
  email: string;
  phone: string;
  employmentStatus: string;
  monthlyIncome: number;
  idType: string;
  idNumber: string;

  // Rent Details
  monthlyRent: number;
  landlordName: string;
  landlordPhone: string;
  moveInDate: string;
  leaseDuration: number;

  // Property Address
  streetAddress: string;
  city: string;
  stateRegion: string;
  country: string;
  postalCode?: string;

  // Loan Details
  amountRequired: number;
  repaymentDuration: number; // max 36 months

  status: 'pending' | 'approved' | 'rejected' | 'under_review';
  createdAt: string;
}


