import { supabase, isSupabaseConfigured } from '../supabaseClient';
import { Listing, User, Chat, ChatMessage, SearchFilters, Monetization, Review, Payment, ViewRequest, StaticPage, BlogPost, RentFinancingApplication } from '../types';
import { withCache, delCache, invalidateCachePrefix, CACHE_TTL, cacheKey } from './cacheService';
import { uploadImageToCloudinary } from './imageService';
import { MOCK_LISTINGS, MOCK_USERS, MOCK_ADS, MOCK_CHATS } from './mockData';

// --- AUTH SERVICES ---
export const loginWithEmail = async (email: string, password: string, selectedRole: 'Tenant' | 'Agent' | 'Admin' = 'Tenant') => {
  if (!isSupabaseConfigured) {
    const matchedUser = MOCK_USERS.find(u => u.socials?.email === email || (u as any).email === email);
    const mockUser = matchedUser || {
      id: 'mock-user-login',
      name: email.split('@')[0],
      avatar: `https://ui-avatars.com/api/?name=${email.split('@')[0]}&background=random`,
      rating: 5.0,
      reviewCount: 1,
      location: 'Accra, Ghana',
      memberSince: 'Jun 2026',
      bio: 'Demo Renter/Buyer Profile',
      verified: true,
      role: selectedRole,
      socials: { email }
    };
    
    const userResult = { ...mockUser, isNewAccount: false, role: selectedRole, uid: mockUser.id, email: email };
    localStorage.setItem('caliber_mock_user', JSON.stringify(userResult));
    return userResult;
  }
  
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
  
  // For now, attach role
  return Object.assign(data.user, { isNewAccount: false, role: selectedRole, uid: data.user?.id });
};

export const signupWithEmail = async (email: string, password: string, name: string, selectedRole: 'Tenant' | 'Agent' | 'Admin' = 'Tenant') => {
  if (!isSupabaseConfigured) {
    const mockUser = {
      id: `gen-user-${Date.now()}`,
      name,
      avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=random`,
      rating: 5.0,
      reviewCount: 0,
      location: 'Lagos, Nigeria',
      memberSince: 'Jun 2026',
      bio: 'Newly Registered Account Space',
      verified: true,
      role: selectedRole,
      socials: { email }
    };
    const userResult = { ...mockUser, isNewAccount: true, role: selectedRole, uid: mockUser.id, email: email };
    localStorage.setItem('caliber_mock_user', JSON.stringify(userResult));
    return userResult;
  }
  
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: name,
        role: selectedRole,
      }
    }
  });
  if (error) throw error;
  
  return Object.assign(data.user || {}, { isNewAccount: true, role: selectedRole, uid: data.user?.id });
};

export const logout = async () => {
  localStorage.removeItem('caliber_mock_user');
  if (isSupabaseConfigured) {
    await supabase.auth.signOut();
  }
};

export const subscribeToAuth = (callback: (user: any | null) => void) => {
  const getMockUser = () => {
    const uStr = localStorage.getItem('caliber_mock_user');
    if (uStr) {
      try {
        return JSON.parse(uStr);
      } catch (e) {
        return null;
      }
    }
    return null;
  };

  if (!isSupabaseConfigured) {
    const checkUser = () => {
      callback(getMockUser());
    };
    checkUser();
    // Monitor storage changes
    const handler = () => checkUser();
    window.addEventListener('storage', handler);
    return () => window.removeEventListener('storage', handler);
  }
  
  // When Supabase is configured, check if a mock admin or user is active first
  const currentMock = getMockUser();
  if (currentMock) {
    callback(currentMock);
  }

  const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
    const activeMock = getMockUser();
    if (activeMock) {
      callback(activeMock);
    } else {
      callback(session?.user || null);
    }
  });

  const storageHandler = () => {
    const activeMock = getMockUser();
    if (activeMock) {
      callback(activeMock);
    } else {
      supabase.auth.getSession().then(({ data: { session } }) => {
        callback(session?.user || null);
      });
    }
  };
  window.addEventListener('storage', storageHandler);

  return () => {
    subscription.unsubscribe();
    window.removeEventListener('storage', storageHandler);
  };
};

export const sendPasswordResetEmail = async (email: string) => {
  if (!isSupabaseConfigured) return;
  await supabase.auth.resetPasswordForEmail(email);
};

export const verifyPasswordResetCode = async (code: string) => {
  // Supabase handles this automatically via link, but we mock for compat
  return 'user@example.com';
};

export const confirmPasswordReset = async (code: string, newPassword: string) => {
  if (!isSupabaseConfigured) return;
  await supabase.auth.updateUser({ password: newPassword });
};

export const loginWithGoogle = async (role?: string) => {
  if (!isSupabaseConfigured) {
    const targetRole = role === 'Agent' ? 'Agent' : 'Tenant';
    const randomUser = MOCK_USERS.find(u => u.role === targetRole) || MOCK_USERS[1];
    localStorage.setItem('caliber_mock_user', JSON.stringify({ ...randomUser, email: `demo_${targetRole.toLowerCase()}@tym2muv.com` }));
    window.location.href = '/';
    return;
  }
  const { error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: { 
      redirectTo: `${window.location.origin}/`
    }
  });
  if (error) throw error;
};

export const loginWithLinkedIn = async (role?: string) => {
  if (!isSupabaseConfigured) {
    const targetRole = role === 'Agent' ? 'Agent' : 'Tenant';
    const randomUser = MOCK_USERS.find(u => u.role === targetRole) || MOCK_USERS[4];
    localStorage.setItem('caliber_mock_user', JSON.stringify({ ...randomUser, email: `demo_${targetRole.toLowerCase()}@tym2muv.com` }));
    window.location.href = '/';
    return;
  }
  const { error } = await supabase.auth.signInWithOAuth({
    provider: 'linkedin_oidc',
    options: { 
      redirectTo: `${window.location.origin}/`
    }
  });
  if (error) throw error;
};

// --- USER SERVICES ---
const mapProfileToUser = (profileData: any): User => {
  // Map database role (lowercase) to capitalized UI role (Tenant / Agent / Admin)
  const mappedRole = (() => {
    const r = (profileData.role || '').toLowerCase();
    if (r === 'agent') return 'Agent';
    if (r === 'admin' || r === 'super_admin') return 'Admin';
    return 'Tenant'; // Default mapping for 'tenant', 'user', 'customer', or empty
  })();

  return {
    id: profileData.id,
    name: profileData.full_name || 'Unknown',
    avatar: profileData.avatar_url || 'https://ui-avatars.com/api/?name=Unknown&background=random',
    rating: profileData.rating || 0,
    reviewCount: profileData.review_count || 0,
    location: profileData.location || 'Unknown',
    memberSince: profileData.created_at || new Date().toISOString(),
    bio: profileData.bio || '',
    verified: profileData.verified || false,
    role: mappedRole,
    savedListings: profileData.savedListings || [],
    socials: profileData.socials || {}
  };
};

export const getUserProfile = async (userId: string): Promise<User | null> => {
  if (!isSupabaseConfigured) {
    const user = MOCK_USERS.find(u => u.id === userId);
    return user || null;
  }
  
  try {
    return await withCache(cacheKey('profile', userId), async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();
        
      if (error || !data) return null;
      
      const savedQuery = await supabase.from('saved_listings').select('listing_id').eq('user_id', userId);
      data.savedListings = (savedQuery.data || []).map(r => r.listing_id);

      return mapProfileToUser(data);
    }, CACHE_TTL.PROFILES);
  } catch (err) {
    console.warn("Supabase profile fetch failed, using mock profile", err);
    const user = MOCK_USERS.find(u => u.id === userId);
    return user || null;
  }
};

export const updateUserProfile = async (userId: string, updates: Partial<User>) => {
  if (!isSupabaseConfigured) {
    const userIdx = MOCK_USERS.findIndex(u => u.id === userId);
    if (userIdx !== -1) {
      MOCK_USERS[userIdx] = { ...MOCK_USERS[userIdx], ...updates };
      localStorage.setItem('caliber_mock_user', JSON.stringify(MOCK_USERS[userIdx]));
    }
    return;
  }
  
  const dbUpdates: any = {};
  if (updates.name !== undefined) dbUpdates.full_name = updates.name;
  if (updates.avatar !== undefined) dbUpdates.avatar_url = updates.avatar;
  if (updates.location !== undefined) dbUpdates.location = updates.location;
  if (updates.bio !== undefined) dbUpdates.bio = updates.bio;
  
  if (Object.keys(dbUpdates).length > 0) {
    await supabase.from('profiles').update(dbUpdates).eq('id', userId);
    await delCache(cacheKey('profile', userId));
  }
};

export const ensureUserProfileExists = async (
  userId: string, 
  email: string | undefined, 
  metadata: any, 
  selectedRole?: string
): Promise<User | null> => {
  if (!isSupabaseConfigured) {
    const user = MOCK_USERS.find(u => u.id === userId);
    return user || null;
  }

  try {
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle();

    const targetRole = (selectedRole || metadata?.role || 'Tenant').toLowerCase() === 'agent' ? 'agent' : 'tenant';

    if (error || !profile) {
      const fullName = metadata?.full_name || metadata?.name || metadata?.given_name || (email ? email.split('@')[0] : 'User');
      const avatarUrl = metadata?.avatar_url || metadata?.picture || metadata?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(fullName)}&background=random`;

      // Attempt to insert the profile. Fall back between 'tenant' and 'user' if there are database enum incompatibilities
      let insertRole = targetRole;
      let { data: newProfile, error: insertError } = await supabase
        .from('profiles')
        .insert({
          id: userId,
          full_name: fullName,
          avatar_url: avatarUrl,
          role: insertRole
        })
        .select()
        .single();

      if (insertError) {
        console.warn('Initial profile insert failed, retrying with fallback role...', insertError);
        insertRole = targetRole === 'tenant' ? 'user' : 'tenant';
        const retryResult = await supabase
          .from('profiles')
          .insert({
            id: userId,
            full_name: fullName,
            avatar_url: avatarUrl,
            role: insertRole
          })
          .select()
          .single();
        newProfile = retryResult.data;
        insertError = retryResult.error;
      }

      if (insertError) {
        console.error('Failed to create fallback user profile after retry:', insertError);
        return null;
      }

      if (insertRole === 'agent') {
        const { error: agentError } = await supabase
          .from('agents')
          .insert({ id: userId, verification_status: 'pending' });
        if (agentError) {
          console.error('Failed to create agent record:', agentError);
        }
      }

      await delCache(cacheKey('profile', userId));
      return mapProfileToUser(newProfile);
    } else {
      if (selectedRole && profile.role !== targetRole) {
        let updateRole = targetRole;
        let { error: updateError } = await supabase
          .from('profiles')
          .update({ role: updateRole })
          .eq('id', userId);

        if (updateError) {
          console.warn('Initial role update failed, retrying with fallback role...', updateError);
          updateRole = targetRole === 'tenant' ? 'user' : 'tenant';
          const retryUpdate = await supabase
            .from('profiles')
            .update({ role: updateRole })
            .eq('id', userId);
          updateError = retryUpdate.error;
        }

        if (!updateError) {
          profile.role = updateRole;
          
          if (updateRole === 'agent') {
            const { data: agentData } = await supabase
              .from('agents')
              .select('id')
              .eq('id', userId)
              .maybeSingle();
              
            if (!agentData) {
              await supabase.from('agents').insert({ id: userId, verification_status: 'pending' });
            }
          }
          await delCache(cacheKey('profile', userId));
        }
      }
      return mapProfileToUser(profile);
    }
  } catch (err) {
    console.error('Error in ensureUserProfileExists:', err);
    return null;
  }
};

export const toggleSavedListing = async (userId: string, listingId: string): Promise<void> => {
  if (!isSupabaseConfigured) {
    const user = MOCK_USERS.find(u => u.id === userId);
    if (user) {
      const saved = user.savedListings || [];
      if (saved.includes(listingId)) {
        user.savedListings = saved.filter(id => id !== listingId);
      } else {
        user.savedListings = [...saved, listingId];
      }
      localStorage.setItem('caliber_mock_user', JSON.stringify(user));
    }
    return;
  }
  
  const { data: existing } = await supabase
    .from('saved_listings')
    .select('id')
    .eq('user_id', userId)
    .eq('listing_id', listingId)
    .maybeSingle();

  if (existing) {
    await supabase.from('saved_listings').delete().eq('id', existing.id);
  } else {
    await supabase.from('saved_listings').insert({ user_id: userId, listing_id: listingId });
  }
  await delCache(cacheKey('profile', userId)); // invalidate profile cache since savedListings changed
};

export const getSavedListingIds = async (userId: string): Promise<string[]> => {
  if (!isSupabaseConfigured) {
    const user = MOCK_USERS.find(u => u.id === userId);
    return user?.savedListings || [];
  }
  const { data } = await supabase.from('saved_listings').select('listing_id').eq('user_id', userId);
  return (data || []).map(r => r.listing_id);
};

export const getAllUsers = async (): Promise<User[]> => {
  if (!isSupabaseConfigured) {
    return MOCK_USERS;
  }
  try {
    const { data, error } = await supabase.from('profiles').select('*').order('created_at', { ascending: false });
    if (error) throw error;
    return (data || []).map(mapProfileToUser);
  } catch (err) {
    console.warn("Supabase users fetch failed, using mock", err);
    return MOCK_USERS;
  }
};

export const updateUserRole = async (userId: string, role: string) => {
  if (!isSupabaseConfigured) {
    const userIdx = MOCK_USERS.findIndex(u => u.id === userId);
    if (userIdx !== -1) {
      MOCK_USERS[userIdx].role = role as any;
      localStorage.setItem('caliber_mock_user', JSON.stringify(MOCK_USERS[userIdx]));
    }
    return;
  }
  await supabase.from('profiles').update({ role }).eq('id', userId);
  await delCache(cacheKey('profile', userId));
};

// --- LISTING SERVICES ---
const mapPropertyToListing = (p: any): Listing => ({
  id: p.id,
  title: p.title,
  price: p.price,
  currency: p.currency,
  location: p.location,
  country: p.country_code,
  imageUrl: (p.images && p.images.length > 0) ? p.images[0] : (p.image_url || ''),
  images: p.images || [],
  videos: p.videos || [],
  categoryId: p.category_id,
  subcategoryId: p.subcategory_id,
  isFeatured: p.is_featured,
  isPremium: p.is_premium,
  datePosted: p.created_at,
  expiryDate: p.expiry_date,
  sellerId: p.agent_id,
  description: p.description,
  status: p.status === 'approved' ? 'active' : p.status,
  type: p.listing_type,
  propertyType: p.property_type,
  bedrooms: p.bedrooms,
  bathrooms: p.bathrooms,
  sqft: p.sqft,
  amenities: p.amenities || [],
  furnished: p.furnished,
  parking: p.parking,
  security: p.security,
  petsAllowed: p.pets_allowed,
  yearBuilt: p.year_built,
  isVerified: p.is_verified,
  virtualTourUrl: p.virtual_tour_url,
});

/* DB_INDEXES_REQUIRED: see supabase_production_schema.sql 
-- Run this once in Supabase SQL Editor:
CREATE INDEX IF NOT EXISTS idx_properties_location_trgm 
ON properties USING GIN (location gin_trgm_ops);

CREATE INDEX IF NOT EXISTS idx_properties_status ON properties(status);
CREATE INDEX IF NOT EXISTS idx_properties_country_code ON properties(country_code);
CREATE INDEX IF NOT EXISTS idx_properties_category ON properties(category_id);
CREATE INDEX IF NOT EXISTS idx_properties_price ON properties(price);
CREATE INDEX IF NOT EXISTS idx_properties_agent ON properties(agent_id);
*/
export const getListings = async (filters?: SearchFilters): Promise<{ listings: Listing[], total: number, hasMore: boolean }> => {
  const getMockListings = () => {
    let filtered = [...MOCK_LISTINGS];
    if (filters?.categoryId) {
      filtered = filtered.filter(l => l.categoryId === filters.categoryId);
    }
    if (filters?.type) {
      filtered = filtered.filter(l => l.type === filters.type);
    }
    if (filters?.propertyType) {
      filtered = filtered.filter(l => l.propertyType === filters.propertyType);
    }
    if (filters?.countryCode) {
      filtered = filtered.filter(l => l.country === filters.countryCode);
    }
    if (filters?.sellerId || filters?.agent_id) {
      const sellerId = filters.sellerId || filters.agent_id;
      filtered = filtered.filter(l => l.sellerId === sellerId);
    }
    if (filters?.minPrice) {
      filtered = filtered.filter(l => l.price >= parseInt(filters.minPrice!));
    }
    if (filters?.maxPrice) {
      filtered = filtered.filter(l => l.price <= parseInt(filters.maxPrice!));
    }
    if (filters?.location) {
      filtered = filtered.filter(l => l.location.toLowerCase().includes(filters.location!.toLowerCase()));
    }
    if (filters?.query) {
      const q = filters.query.toLowerCase();
      filtered = filtered.filter(l => l.title.toLowerCase().includes(q) || l.description.toLowerCase().includes(q));
    }
    
    // Sort logic
    if (filters?.sortBy === 'price_asc') {
      filtered.sort((a, b) => a.price - b.price);
    } else if (filters?.sortBy === 'price_desc') {
      filtered.sort((a, b) => b.price - a.price);
    } else {
      // Default: premium/featured first, then date newer
      filtered.sort((a, b) => {
        if (a.isPremium && !b.isPremium) return -1;
        if (!a.isPremium && b.isPremium) return 1;
        if (a.isFeatured && !b.isFeatured) return -1;
        if (!a.isFeatured && b.isFeatured) return 1;
        return new Date(b.datePosted).getTime() - new Date(a.datePosted).getTime();
      });
    }

    const page = filters?.page || 1;
    const limit = filters?.limit || filters?.pageSize || 24;
    const from = (page - 1) * limit;
    const pageData = filtered.slice(from, from + limit);
    
    return {
      listings: pageData,
      total: filtered.length,
      hasMore: from + limit < filtered.length
    };
  };

  if (!isSupabaseConfigured) {
    return getMockListings();
  }
  
  try {
    return await withCache(cacheKey('listings', filters || 'all'), async () => {
      let query = supabase
        .from('properties')
        .select('*', { count: 'exact' });

      if (!filters?.isAdminQuery) {
        query = query.eq('status', 'approved');
      } else if (filters?.status) {
        const dbStatus = filters.status === 'active' ? 'approved' : filters.status;
        query = query.eq('status', dbStatus);
      }
      
      if (filters?.categoryId) query = query.eq('category_id', filters.categoryId);
      if (filters?.type) query = query.eq('listing_type', filters.type);
      if (filters?.propertyType) query = query.eq('property_type', filters.propertyType);
      if (filters?.bedrooms) query = query.gte('bedrooms', filters.bedrooms);
      if (filters?.countryCode) query = query.eq('country_code', filters.countryCode);
      if (filters?.sellerId || filters?.agent_id) query = query.eq('agent_id', filters?.sellerId || filters?.agent_id);
      if (filters?.minPrice) query = query.gte('price', parseInt(filters.minPrice));
      if (filters?.maxPrice) query = query.lte('price', parseInt(filters.maxPrice));
      if (filters?.location) query = query.ilike('location', `%${filters.location}%`);
      if (filters?.query) query = query.ilike('title', `%${filters.query}%`);
      if (filters?.startDate) query = query.gte('created_at', filters.startDate);
      if (filters?.endDate) query = query.lte('created_at', filters.endDate);

      const page = filters?.page || 1;
      const limit = filters?.limit || filters?.pageSize || 50;
      
      const from = (page - 1) * limit;
      query = query.range(from, from + limit - 1);

      const { data, error, count } = await query.order('is_premium', { ascending: false }).order('created_at', { ascending: false });
      if (error) throw error;
      
      const totalCount = count || 0;
      const hasMore = from + limit < totalCount;
      
      return { listings: (data || []).map(mapPropertyToListing), total: totalCount, hasMore };
    }, CACHE_TTL.SEARCH);
  } catch (err) {
    console.warn("Supabase listings query failed, using mock", err);
    return getMockListings();
  }
};

export const getListingById = async (id: string): Promise<Listing | null> => {
  if (!isSupabaseConfigured) {
    const listing = MOCK_LISTINGS.find(l => l.id === id);
    return listing || null;
  }
  
  try {
    return await withCache(cacheKey('listing', id), async () => {
      const { data, error } = await supabase.from('properties').select('*').eq('id', id).single();
      if (error || !data) return null;
      return mapPropertyToListing(data);
    }, CACHE_TTL.LISTINGS);
  } catch (err) {
    console.warn("Supabase getListingById failed, using mock description", err);
    const listing = MOCK_LISTINGS.find(l => l.id === id);
    return listing || null;
  }
};

export const createListing = async (listing: Omit<Listing, 'id'>): Promise<string> => {
  if (!isSupabaseConfigured) {
    const newId = `gen-listing-${Date.now()}`;
    const newListing: Listing = {
      ...listing,
      id: newId,
      datePosted: new Date().toISOString(),
      expiryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    };
    MOCK_LISTINGS.push(newListing);
    return newId;
  }
  
  const { data, error } = await supabase.from('properties').insert({
    title: listing.title,
    price: listing.price,
    currency: listing.currency,
    location: listing.location,
    country_code: listing.country,
    images: listing.images,
    videos: listing.videos,
    category_id: listing.categoryId,
    subcategory_id: listing.subcategoryId,
    agent_id: listing.sellerId,
    description: listing.description,
    status: listing.status === 'active' ? 'approved' : (listing.status || 'pending'),
    listing_type: listing.type,
    property_type: listing.propertyType,
    bedrooms: listing.bedrooms,
    bathrooms: listing.bathrooms,
    sqft: listing.sqft,
    amenities: listing.amenities,
    furnished: listing.furnished,
    parking: listing.parking,
    security: listing.security,
    pets_allowed: listing.petsAllowed,
    year_built: listing.yearBuilt,
    virtual_tour_url: listing.virtualTourUrl,
  }).select('id').single();
  
  if (error) throw error;
  await invalidateCachePrefix('listings');
  return data.id;
};

export const updateListing = async (id: string, updates: Partial<Listing>) => {
  if (!isSupabaseConfigured) {
    const idx = MOCK_LISTINGS.findIndex(l => l.id === id);
    if (idx !== -1) {
      MOCK_LISTINGS[idx] = { ...MOCK_LISTINGS[idx], ...updates };
    }
    return;
  }
  
  const dbUpdates: any = {};
  if (updates.status !== undefined) {
    dbUpdates.status = updates.status === 'active' ? 'approved' : updates.status;
  }
  if (updates.title !== undefined) dbUpdates.title = updates.title;
  if (updates.price !== undefined) dbUpdates.price = updates.price;
  if (updates.description !== undefined) dbUpdates.description = updates.description;
  if (updates.location !== undefined) dbUpdates.location = updates.location;
  if (updates.images !== undefined) dbUpdates.images = updates.images;
  if (updates.bedrooms !== undefined) dbUpdates.bedrooms = updates.bedrooms;
  if (updates.bathrooms !== undefined) dbUpdates.bathrooms = updates.bathrooms;
  if (updates.sqft !== undefined) dbUpdates.sqft = updates.sqft;
  if (updates.furnished !== undefined) dbUpdates.furnished = updates.furnished;
  if (updates.parking !== undefined) dbUpdates.parking = updates.parking;
  if (updates.petsAllowed !== undefined) dbUpdates.pets_allowed = updates.petsAllowed;
  if (updates.virtualTourUrl !== undefined) dbUpdates.virtual_tour_url = updates.virtualTourUrl;
  if (updates.isPremium !== undefined) dbUpdates.is_premium = updates.isPremium;
  
  if (Object.keys(dbUpdates).length === 0) return;
  const { error } = await supabase.from('properties').update(dbUpdates).eq('id', id);
  if (error) throw error;
  
  await invalidateCachePrefix('listings');
  await delCache(cacheKey('listing', id));
};

export const deleteListing = async (id: string) => {
  if (!isSupabaseConfigured) {
    const idx = MOCK_LISTINGS.findIndex(l => l.id === id);
    if (idx !== -1) {
      MOCK_LISTINGS.splice(idx, 1);
    }
    return;
  }
  
  const { error } = await supabase.from('properties').delete().eq('id', id);
  if (error) throw error;
  
  await invalidateCachePrefix('listings');
  await delCache(cacheKey('listing', id));
};

// --- STORAGE SERVICES ---
export const uploadImage = async (file: File, path: string, onProgress?: (n: number) => void): Promise<string> => {
  return uploadImageToCloudinary(file, onProgress);
};

// --- CHAT SERVICES ---
const mapChatRow = (data: any): Chat => ({
  id: data.id,
  participants: data.participants,
  listingId: data.listing_id,
  messages: (data.messages || []).map((m: any) => ({
    id: m.id,
    senderId: m.sender_id,
    text: m.content,
    timestamp: m.created_at,
    isRead: m.is_read || false
  })).sort((a: any, b: any) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()),
  lastMessage: data.last_message,
  lastMessageTime: data.last_message_time,
  unreadCount: data.unread_count || 0,
  lastSenderId: data.last_sender_id
});

export const getChats = (userId: string, callback: (chats: Chat[]) => void) => {
  let cachedChats: Chat[] = [];
  
  const fetchInitial = async () => {
    const { data } = await supabase
      .from('chats')
      .select('*, messages(*, sender:profiles(id, full_name, avatar_url))')
      .contains('participants', [userId])
      .order('last_message_time', { ascending: false })
      .limit(50); // Add pagination limit
    cachedChats = (data || []).map(mapChatRow);
    callback(cachedChats);
  };
  
  fetchInitial();

  const channel = supabase
    .channel(`user-chats:${userId}`)
    .on('postgres_changes', {
      event: 'UPDATE',
      schema: 'public',
      table: 'chats',
      filter: `participants=cs.{${userId}}`
    }, (payload) => {
      // Only refresh the specific chat that changed
      cachedChats = cachedChats.map(c => 
        c.id === payload.new.id ? { ...c, lastMessage: payload.new.last_message, lastMessageTime: payload.new.last_message_time } : c
      );
      callback([...cachedChats]);
    })
    .subscribe();

  return () => { supabase.removeChannel(channel); };
};

export const mapMessage = (data: any): ChatMessage => ({
  id: data.id,
  senderId: data.sender_id,
  text: data.content,
  timestamp: data.created_at,
  isRead: data.is_read || false
});

export const fetchMessages = async (chatId: string): Promise<ChatMessage[]> => {
  const { data, error } = await supabase.from('messages')
    .select('*')
    .eq('chat_id', chatId)
    .order('created_at', { ascending: true });
  
  if (error || !data) return [];
  return data.map(mapMessage);
};

export const sendMessage = async (chatId: string, senderId: string, text: string) => {
  const { error } = await supabase.from('messages').insert({
    chat_id: chatId,
    sender_id: senderId,
    content: text,
    is_read: false
  });
  if (error) throw error;
  await supabase.from('chats').update({ last_message: text, last_message_time: new Date().toISOString(), last_sender_id: senderId }).eq('id', chatId);
};

export const createChat = async (currentUserId: string, otherUserId: string, listingId?: string): Promise<string> => {
  const { data: existing } = await supabase.from('chats')
    .select('id').contains('participants', [currentUserId, otherUserId])
    .eq('listing_id', listingId || '').maybeSingle();
  if (existing) return existing.id;

  const { data, error } = await supabase.from('chats').insert({
    participants: [currentUserId, otherUserId],
    listing_id: listingId,
    last_message: '',
    last_message_time: new Date().toISOString(),
    unread_count: 0
  }).select('id').single();
  
  if (error) throw error;
  return data.id;
};

// --- PAYMENT SERVICES ---
export const createPayment = async (paymentData: Omit<Payment, 'id'>): Promise<string> => {
  const { data, error } = await supabase.from('payments').insert({
    user_id: paymentData.userId,
    amount: paymentData.amount,
    currency: paymentData.currency,
    status: paymentData.status,
    purpose: paymentData.purpose,
    reference_id: paymentData.referenceId,
    gateway: paymentData.gateway
  }).select('id').single();
  if (error) throw error;
  return data.id;
};

export const getUserPayments = async (userId: string): Promise<Payment[]> => {
  const { data, error } = await supabase.from('payments').select('*').eq('user_id', userId).order('created_at', { ascending: false });
  if (error) throw error;
  return (data || []).map((p: any) => ({
    id: p.id,
    userId: p.user_id,
    amount: p.amount,
    currency: p.currency,
    status: p.status,
    purpose: p.purpose,
    referenceId: p.reference_id,
    gateway: p.gateway,
    createdAt: p.created_at
  }));
};

// --- ADMIN SERVICES ---
export const getAdminStats = async () => {
  if (!isSupabaseConfigured) {
    return {
      totalUsers: MOCK_USERS.length,
      totalListings: MOCK_LISTINGS.length,
      totalAds: MOCK_ADS.length,
      pendingApprovals: 2,
      revenue: 45000,
      userRoles: { 
        Admin: 1, 
        Agent: MOCK_USERS.filter(u => u.role === 'Agent').length, 
        Customer: MOCK_USERS.filter(u => u.role !== 'Agent').length 
      },
      listingTypes: { 
        Rent: MOCK_LISTINGS.filter(l => l.type === 'Rent').length, 
        Sale: MOCK_LISTINGS.filter(l => l.type === 'Sale').length 
      },
      adPerformance: { totalClicks: 12500, totalImpressions: 489000 }
    };
  }

  try {
    return await withCache('admin_stats', async () => {
      const { data, error } = await supabase.rpc('get_dashboard_stats');
      if (error) {
        console.error('Error fetching admin stats:', error);
        // fallback if rpc fails
        return {
          totalUsers: MOCK_USERS.length, totalListings: MOCK_LISTINGS.length, totalAds: MOCK_ADS.length,
          pendingApprovals: 2, revenue: 45000,
          userRoles: { 
            Admin: 1, 
            Agent: MOCK_USERS.filter(u => u.role === 'Agent').length, 
            Customer: MOCK_USERS.filter(u => u.role !== 'Agent').length 
          },
          listingTypes: { 
            Rent: MOCK_LISTINGS.filter(l => l.type === 'Rent').length, 
            Sale: MOCK_LISTINGS.filter(l => l.type === 'Sale').length 
          },
          adPerformance: { totalClicks: 12500, totalImpressions: 489000 }
        };
      }
      return data;
    }, 300); // 5 minute TTL (5 * 60)
  } catch (err) {
    console.warn("getAdminStats query failed, falling back to mock counts:", err);
    return {
      totalUsers: MOCK_USERS.length,
      totalListings: MOCK_LISTINGS.length,
      totalAds: MOCK_ADS.length,
      pendingApprovals: 2,
      revenue: 45000,
      userRoles: { 
        Admin: 1, 
        Agent: MOCK_USERS.filter(u => u.role === 'Agent').length, 
        Customer: MOCK_USERS.filter(u => u.role !== 'Agent').length 
      },
      listingTypes: { 
        Rent: MOCK_LISTINGS.filter(l => l.type === 'Rent').length, 
        Sale: MOCK_LISTINGS.filter(l => l.type === 'Sale').length 
      },
      adPerformance: { totalClicks: 12500, totalImpressions: 489000 }
    };
  }
};

// --- MONETIZATION SERVICES ---
export const getMonetizationAds = async (countryCode?: string): Promise<Monetization[]> => {
  const getMockAds = () => {
    let ads = [...MOCK_ADS];
    if (countryCode) {
      ads = ads.filter(ad => ad.countryCode === countryCode);
    }
    return ads;
  };

  if (!isSupabaseConfigured) {
    return getMockAds();
  }

  try {
    let query = supabase.from('monetization_ads').select('*').order('priority', { ascending: false });
    if (countryCode) query = query.eq('country_code', countryCode);
    const { data, error } = await query;
    if (error) throw error;
    return (data || []).map((ad: any) => ({
      id: ad.id,
      type: ad.type,
      title: ad.title,
      description: ad.description,
      cta: ad.cta,
      image: ad.image_url,
      link: ad.link,
      color: ad.color,
      active: ad.active,
      countryCode: ad.country_code,
      priority: ad.priority,
      clicks: ad.clicks,
      impressions: ad.impressions,
      createdAt: ad.created_at
    }));
  } catch (err) {
    console.warn("getMonetizationAds failed, using mock ads", err);
    return getMockAds();
  }
};

export const createMonetizationAd = async (ad: any): Promise<string> => {
  if (!isSupabaseConfigured) {
    const newId = `ad-gen-${Date.now()}`;
    const newAd: Monetization = {
      id: newId,
      type: ad.type,
      title: ad.title,
      description: ad.description,
      cta: ad.cta,
      image: ad.image || 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=400&q=80',
      link: ad.link,
      color: ad.color || 'from-orange-600 to-amber-600',
      active: ad.active !== undefined ? ad.active : true,
      countryCode: ad.countryCode,
      priority: ad.priority || 0,
      clicks: 0,
      impressions: 0,
      createdAt: new Date().toISOString()
    };
    MOCK_ADS.push(newAd);
    return newId;
  }

  const { data, error } = await supabase.from('monetization_ads').insert({
    type: ad.type,
    title: ad.title,
    description: ad.description,
    cta: ad.cta,
    image_url: ad.image,
    link: ad.link,
    color: ad.color,
    active: ad.active,
    country_code: ad.countryCode,
    priority: ad.priority
  }).select('id').single();
  if (error) throw error;
  return data.id;
};

export const updateMonetizationAd = async (id: string, updates: any) => {
  if (!isSupabaseConfigured) {
    const idx = MOCK_ADS.findIndex(ad => ad.id === id);
    if (idx !== -1) {
      MOCK_ADS[idx] = {
        ...MOCK_ADS[idx],
        ...updates
      };
    }
    return;
  }

  const dbUpdates: any = {};
  if (updates.type !== undefined) dbUpdates.type = updates.type;
  if (updates.title !== undefined) dbUpdates.title = updates.title;
  if (updates.description !== undefined) dbUpdates.description = updates.description;
  if (updates.cta !== undefined) dbUpdates.cta = updates.cta;
  if (updates.image !== undefined) dbUpdates.image_url = updates.image;
  if (updates.link !== undefined) dbUpdates.link = updates.link;
  if (updates.color !== undefined) dbUpdates.color = updates.color;
  if (updates.active !== undefined) dbUpdates.active = updates.active;
  if (updates.priority !== undefined) dbUpdates.priority = updates.priority;
  if (updates.countryCode !== undefined) dbUpdates.country_code = updates.countryCode;

  const { error } = await supabase.from('monetization_ads').update(dbUpdates).eq('id', id);
  if (error) throw error;
};

export const deleteMonetizationAd = async (id: string) => {
  if (!isSupabaseConfigured) {
    const idx = MOCK_ADS.findIndex(ad => ad.id === id);
    if (idx !== -1) {
      MOCK_ADS.splice(idx, 1);
    }
    return;
  }

  const { error } = await supabase.from('monetization_ads').delete().eq('id', id);
  if (error) throw error;
};

export const trackAdClick = async (id: string) => {
  await supabase.rpc('increment_ad_stat', { ad_id: id, field: 'clicks' });
};

export const trackAdImpression = async (id: string) => {
  await supabase.rpc('increment_ad_stat', { ad_id: id, field: 'impressions' });
};

// --- VIEW REQUEST SERVICES ---
export const getViewRequestsForAgent = async (agentId: string): Promise<ViewRequest[]> => {
  const { data, error } = await supabase.from('view_requests').select('*').eq('agent_id', agentId).order('created_at', { ascending: false });
  if (error) throw error;
  return (data || []).map((r: any) => ({
    id: r.id,
    listingId: r.listing_id,
    tenantId: r.tenant_id,
    agentId: r.agent_id,
    status: r.status,
    requestedDate: r.requested_date,
    requestedTime: r.requested_time,
    message: r.message,
    createdAt: r.created_at
  }));
};
export const updateViewRequestStatus = async (id: string, status: any) => {
  const { error } = await supabase.from('view_requests').update({ status }).eq('id', id);
  if (error) throw error;
};

export const createViewRequest = async (request: Omit<ViewRequest, 'id' | 'createdAt'>): Promise<string> => {
  const { data, error } = await supabase.from('view_requests').insert({
    listing_id: request.listingId,
    tenant_id: request.tenantId,
    agent_id: request.agentId,
    status: request.status,
    requested_date: request.requestedDate,
    requested_time: request.requestedTime,
    message: request.message
  }).select('id').single();
  if (error) throw error;
  return data.id;
};

// --- REVIEW SERVICES ---
export const getReviewsForVendor = async (vendorId: string): Promise<Review[]> => {
  const { data, error } = await supabase.from('reviews').select('*').eq('vendor_id', vendorId).order('created_at', { ascending: false });
  if (error) throw error;
  return (data || []).map((r: any) => ({
    id: r.id,
    vendorId: r.vendor_id,
    customerId: r.customer_id,
    rating: r.rating,
    comment: r.comment,
    createdAt: r.created_at
  }));
};

export const createReview = async (review: any): Promise<string> => {
  const { data, error } = await supabase.from('reviews').insert({
    vendor_id: review.vendorId,
    customer_id: review.customerId,
    rating: review.rating,
    comment: review.comment
  }).select('id').single();
  if (error) throw error;
  return data.id;
};

// --- CMS / STATIC PAGES & BLOG POST SERVICES ---

const DEFAULT_STATIC_PAGES: StaticPage[] = [
  {
    id: 'about-us',
    slug: 'about-us',
    title: 'About CaliberDesk',
    content: `# About CaliberDesk\n\nWelcome to **CaliberDesk**, the premium, secure, and production-ready job matching and real-estate transaction platform designed to keep your workflows efficient and compliant.\n\n### Our Mission\nOur mission is to establish durable, secure linkages between candidates, tenants, agents, and admins under strict performance guarantees.\n\n### Core System Specifications\n- **Enterprise Scale**: Servicing up to 5,000 active daily profiles with zero sub-millisecond degradation.\n- **Ultimate Safety**: Implemented with military-grade transport layer security rules and comprehensive Cloudflare firewall locks.\n- **Global Access**: Real-time localized IP geo-conversion across multiple trade zones.\n\nThank you for choosing CaliberDesk.`,
    published: true,
    metaTitle: 'About CaliberDesk - Job and Property Gateway',
    metaDescription: 'Learn more about CaliberDesk system guidelines and our mission to streamline workspace management.',
    createdAt: new Date('2026-06-01T12:00:00Z').toISOString(),
    updatedAt: new Date('2026-06-01T12:00:00Z').toISOString()
  },
  {
    id: 'terms-of-service',
    slug: 'terms',
    title: 'Terms of Service',
    content: `# Terms of Service\n\n*Effective Date: June 1, 2026*\n\nPlease study these Terms of Service carefully before utilizing any portal services. By engaging with CaliberDesk, you agree to comply with all specified terms.\n\n## 1. System Compliance\nUsers must preserve credential isolation and must never bypass access gateways.\n\n## 2. Platform Usage & License\nWe grant you a restricted, non-transferable licence to load and view assets under standard developer bounds.\n\n## 3. Disclaimers\nCaliberDesk assumes no liability for external networks or third-party web endpoints. Contact our engineering team for specialized enterprise deployments.`,
    published: true,
    metaTitle: 'Terms of Service - CaliberDesk Secure Gateway',
    metaDescription: 'Official site terms and user compliance policies for CaliberDesk applications.',
    createdAt: new Date('2026-06-01T12:00:00Z').toISOString(),
    updatedAt: new Date('2026-06-01T12:00:00Z').toISOString()
  },
  {
    id: 'privacy-policy',
    slug: 'privacy',
    title: 'Privacy Policy',
    content: `# Privacy Policy\n\n*Last Updated: June 1, 2026*\n\nYour telemetry privacy and credential integrity represent our highest priority. This Policy outlines how we manage profile fields.\n\n### 1. Information We Collect\n- **Sign-in Identifiers**: Sanitized names and emails accessed via Google/LinkedIn providers.\n- **Local Cache**: Location telemetry converted client-side for dynamic displays.\n\n### 2. Encryption Norms\nAll active tokens are enveloped using industry-standard TLS algorithms before hitting Supabase database partitions. Keys are never logged in plain text.`,
    published: true,
    metaTitle: 'Privacy Policy - CaliberDesk Information Protection',
    metaDescription: 'Understand how CaliberDesk manages secure user credentials and privacy.',
    createdAt: new Date('2026-06-01T12:00:00Z').toISOString(),
    updatedAt: new Date('2026-06-01T12:00:00Z').toISOString()
  }
];

const DEFAULT_BLOG_POSTS: BlogPost[] = [
  {
    id: 'blog-post-1',
    slug: 'navigating-2026-real-estate-peaks',
    title: 'Navigating Commercial Real Estate in 2026',
    excerpt: 'An exhaustive analysis of office demand trends, workspace density shifts, and prime co-working corridor values.',
    content: `## The Modern Workspace Frontier in 2026\n\nAs the commercial landscape adjusts, we observe a dramatic acceleration toward **highly dense, hybrid workspace corridors** across major technological epicenters.\n\n### 1. Location Optimization\nProximity to public rapid-transit channels is now the primary price driver for multi-story office lots. Commuters prioritize space layout flexibility over raw square-footage.\n\n### 2. High Density and Low Waste\nModern developers are replacing monolithic cubicle rings with responsive **modular benches** and soundproof phone silos.\n\n> "Efficiency is no longer about maximizing raw desks; it is about maximizing active hours per square meter."\n\nWe anticipate commercial rentals in prime West-African and European tech cities to grow by an average of **14%** over the coming fiscal semester.`,
    published: true,
    coverImage: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=800&q=80',
    authorName: 'Evelyn Sterling',
    category: 'Market Analysis',
    readTime: '5 min read',
    createdAt: new Date('2026-06-02T10:00:00Z').toISOString(),
    updatedAt: new Date('2026-06-02T10:00:00Z').toISOString()
  },
  {
    id: 'blog-post-2',
    slug: 'top-tips-for-buying-studio-condos',
    title: 'Top Tips for Savvy Studio Condo Buyers',
    excerpt: 'Essential tactics to verify structural safety, navigate zero-down mortgages, and maximize rent yield.',
    content: `## Buying Your First Urban Studio\n\nUrban studio flats present unmatched capitalization upside for initial investors. However, buying without an exhaustive checklist can bind your capital in low-yield properties.\n\n### The Golden Checklist:\n1. **Verify Utility Subcards**: Inspect electrical substations and water safety meters.\n2. **Negotiate Mortgage Rates**: Look for down-payment match programs or local municipal credits.\n3. **Assess Tenant Intent**: If renting out, study listing prices inside a 1-mile radius.\n\nWith CaliberDesk, you can find active portfolios that align perfectly with modern buyer standards.`,
    published: true,
    coverImage: 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=800&q=80',
    authorName: 'Marcus Vance',
    category: 'Investment Guides',
    readTime: '4 min read',
    createdAt: new Date('2026-06-01T08:30:00Z').toISOString(),
    updatedAt: new Date('2026-06-01T08:30:00Z').toISOString()
  }
];

const getLocalPages = (): StaticPage[] => {
  const p = localStorage.getItem('cms_static_pages');
  if (!p) {
    localStorage.setItem('cms_static_pages', JSON.stringify(DEFAULT_STATIC_PAGES));
    return DEFAULT_STATIC_PAGES;
  }
  try {
    return JSON.parse(p);
  } catch (_) {
    return DEFAULT_STATIC_PAGES;
  }
};

const saveLocalPages = (pages: StaticPage[]) => {
  localStorage.setItem('cms_static_pages', JSON.stringify(pages));
};

const getLocalPosts = (): BlogPost[] => {
  const p = localStorage.getItem('cms_blog_posts');
  if (!p) {
    localStorage.setItem('cms_blog_posts', JSON.stringify(DEFAULT_BLOG_POSTS));
    return DEFAULT_BLOG_POSTS;
  }
  try {
    return JSON.parse(p);
  } catch (_) {
    return DEFAULT_BLOG_POSTS;
  }
};

const saveLocalPosts = (posts: BlogPost[]) => {
  localStorage.setItem('cms_blog_posts', JSON.stringify(posts));
};

export const getStaticPages = async (): Promise<StaticPage[]> => {
  if (isSupabaseConfigured) {
    try {
      const { data, error } = await supabase.from('cms_pages').select('*').order('created_at', { ascending: false });
      if (!error && data) {
        return data.map((p: any) => ({
          id: p.id,
          slug: p.slug,
          title: p.title,
          content: p.content,
          published: p.published,
          metaTitle: p.meta_title,
          metaDescription: p.meta_description,
          createdAt: p.created_at,
          updatedAt: p.updated_at
        }));
      }
    } catch (e) {
      console.warn('Supabase cms_pages failed, falling back to local files', e);
    }
  }
  return getLocalPages();
};

export const getStaticPageBySlug = async (slug: string): Promise<StaticPage | null> => {
  if (isSupabaseConfigured) {
    try {
      const { data, error } = await supabase.from('cms_pages').select('*').eq('slug', slug).maybeSingle();
      if (!error && data) {
        return {
          id: data.id,
          slug: data.slug,
          title: data.title,
          content: data.content,
          published: data.published,
          metaTitle: data.meta_title,
          metaDescription: data.meta_description,
          createdAt: data.created_at,
          updatedAt: data.updated_at
        };
      }
    } catch (_) {}
  }
  const pages = getLocalPages();
  const page = pages.find(p => p.slug === slug || p.id === slug);
  return page || null;
};

export const createStaticPage = async (page: Omit<StaticPage, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> => {
  const now = new Date().toISOString();
  const id = `page-${Date.now()}`;
  if (isSupabaseConfigured) {
    try {
      const { data, error } = await supabase.from('cms_pages').insert({
        id,
        slug: page.slug,
        title: page.title,
        content: page.content,
        published: page.published,
        meta_title: page.metaTitle,
        meta_description: page.metaDescription,
        created_at: now,
        updated_at: now
      }).select('id').single();
      if (!error && data) return data.id;
    } catch (e) {
      console.warn('Fallback to local page creation', e);
    }
  }
  const pages = getLocalPages();
  pages.push({ ...page, id, createdAt: now, updatedAt: now });
  saveLocalPages(pages);
  return id;
};

export const updateStaticPage = async (id: string, page: Partial<StaticPage>): Promise<void> => {
  const now = new Date().toISOString();
  if (isSupabaseConfigured) {
    try {
      const dbPayload: any = { updated_at: now };
      if (page.title !== undefined) dbPayload.title = page.title;
      if (page.slug !== undefined) dbPayload.slug = page.slug;
      if (page.content !== undefined) dbPayload.content = page.content;
      if (page.published !== undefined) dbPayload.published = page.published;
      if (page.metaTitle !== undefined) dbPayload.meta_title = page.metaTitle;
      if (page.metaDescription !== undefined) dbPayload.meta_description = page.metaDescription;

      const { error } = await supabase.from('cms_pages').update(dbPayload).eq('id', id);
      if (!error) return;
    } catch (e) {
      console.warn('Fallback to local page update', e);
    }
  }
  const pages = getLocalPages();
  const idx = pages.findIndex(p => p.id === id);
  if (idx !== -1) {
    pages[idx] = { ...pages[idx], ...page, updatedAt: now };
    saveLocalPages(pages);
  }
};

export const deleteStaticPage = async (id: string): Promise<void> => {
  if (isSupabaseConfigured) {
    try {
      const { error } = await supabase.from('cms_pages').delete().eq('id', id);
      if (!error) return;
    } catch (e) {
      console.warn('Fallback to local page deletion', e);
    }
  }
  const pages = getLocalPages();
  const filtered = pages.filter(p => p.id !== id);
  saveLocalPages(filtered);
};

// --- BLOG POST SERVICES ---

export const getBlogPosts = async (): Promise<BlogPost[]> => {
  if (isSupabaseConfigured) {
    try {
      const { data, error } = await supabase.from('blog_posts').select('*').order('created_at', { ascending: false });
      if (!error && data) {
        return data.map((b: any) => ({
          id: b.id,
          slug: b.slug,
          title: b.title,
          excerpt: b.excerpt,
          content: b.content,
          published: b.published,
          coverImage: b.cover_image,
          authorName: b.author_name,
          category: b.category,
          readTime: b.read_time,
          createdAt: b.created_at,
          updatedAt: b.updated_at
        }));
      }
    } catch (e) {
      console.warn('Supabase blog_posts query failed, falling back to local files', e);
    }
  }
  return getLocalPosts();
};

export const getBlogPostBySlug = async (slug: string): Promise<BlogPost | null> => {
  if (isSupabaseConfigured) {
    try {
      const { data, error } = await supabase.from('blog_posts').select('*').eq('slug', slug).maybeSingle();
      if (!error && data) {
        return {
          id: data.id,
          slug: data.slug,
          title: data.title,
          excerpt: data.excerpt,
          content: data.content,
          published: data.published,
          coverImage: data.cover_image,
          authorName: data.author_name,
          category: data.category,
          readTime: data.read_time,
          createdAt: data.created_at,
          updatedAt: data.updated_at
        };
      }
    } catch (_) {}
  }
  const posts = getLocalPosts();
  const post = posts.find(b => b.slug === slug || b.id === slug);
  return post || null;
};

export const createBlogPost = async (post: Omit<BlogPost, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> => {
  const now = new Date().toISOString();
  const id = `blog-${Date.now()}`;
  if (isSupabaseConfigured) {
    try {
      const { data, error } = await supabase.from('blog_posts').insert({
        id,
        slug: post.slug,
        title: post.title,
        excerpt: post.excerpt,
        content: post.content,
        published: post.published,
        cover_image: post.coverImage,
        author_name: post.authorName,
        category: post.category,
        read_time: post.readTime || '4 min read',
        created_at: now,
        updated_at: now
      }).select('id').single();
      if (!error && data) return data.id;
    } catch (e) {
      console.warn('Fallback to local blog post creation', e);
    }
  }
  const posts = getLocalPosts();
  posts.push({ ...post, id, createdAt: now, updatedAt: now });
  saveLocalPosts(posts);
  return id;
};

export const updateBlogPost = async (id: string, post: Partial<BlogPost>): Promise<void> => {
  const now = new Date().toISOString();
  if (isSupabaseConfigured) {
    try {
      const dbPayload: any = { updated_at: now };
      if (post.title !== undefined) dbPayload.title = post.title;
      if (post.slug !== undefined) dbPayload.slug = post.slug;
      if (post.excerpt !== undefined) dbPayload.excerpt = post.excerpt;
      if (post.content !== undefined) dbPayload.content = post.content;
      if (post.published !== undefined) dbPayload.published = post.published;
      if (post.coverImage !== undefined) dbPayload.cover_image = post.coverImage;
      if (post.authorName !== undefined) dbPayload.author_name = post.authorName;
      if (post.category !== undefined) dbPayload.category = post.category;
      if (post.readTime !== undefined) dbPayload.read_time = post.readTime;

      const { error } = await supabase.from('blog_posts').update(dbPayload).eq('id', id);
      if (!error) return;
    } catch (e) {
      console.warn('Fallback to local blog update', e);
    }
  }
  const posts = getLocalPosts();
  const idx = posts.findIndex(b => b.id === id);
  if (idx !== -1) {
    posts[idx] = { ...posts[idx], ...post, updatedAt: now };
    saveLocalPosts(posts);
  }
};

export const deleteBlogPost = async (id: string): Promise<void> => {
  if (isSupabaseConfigured) {
    try {
      const { error } = await supabase.from('blog_posts').delete().eq('id', id);
      if (!error) return;
    } catch (e) {
      console.warn('Fallback to local blog deletion', e);
    }
  }
  const posts = getLocalPosts();
  const filtered = posts.filter(b => b.id !== id);
  saveLocalPosts(filtered);
};

// --- RENT FINANCING SERVICES ---
const getLocalApplications = (): RentFinancingApplication[] => {
  const data = localStorage.getItem('caliber_rent_financing_applications');
  if (!data) return [];
  try {
    return JSON.parse(data);
  } catch (e) {
    return [];
  }
};

const saveLocalApplications = (apps: RentFinancingApplication[]): void => {
  localStorage.setItem('caliber_rent_financing_applications', JSON.stringify(apps));
};

export const submitRentFinancingApplication = async (app: Omit<RentFinancingApplication, 'id' | 'createdAt' | 'status'>): Promise<RentFinancingApplication> => {
  const newApp: RentFinancingApplication = {
    ...app,
    id: `app-${Date.now()}`,
    status: 'pending',
    createdAt: new Date().toISOString()
  };

  if (isSupabaseConfigured) {
    try {
      const { data, error } = await supabase.from('rent_financing_applications').insert({
        user_id: newApp.userId,
        full_name: newApp.fullName,
        email: newApp.email,
        phone: newApp.phone,
        employment_status: newApp.employmentStatus,
        monthly_income: newApp.monthlyIncome,
        id_type: newApp.idType,
        id_number: newApp.idNumber,
        monthly_rent: newApp.monthlyRent,
        landlord_name: newApp.landlordName,
        landlord_phone: newApp.landlordPhone,
        move_in_date: newApp.moveInDate,
        lease_duration: newApp.leaseDuration,
        street_address: newApp.streetAddress,
        city: newApp.city,
        state_region: newApp.stateRegion,
        country: newApp.country,
        postal_code: newApp.postalCode,
        amount_required: newApp.amountRequired,
        repayment_duration: newApp.repaymentDuration,
        status: newApp.status,
        created_at: newApp.createdAt
      }).select().single();

      if (error) throw error;
      if (data) {
        return {
          id: data.id,
          userId: data.user_id,
          fullName: data.full_name,
          email: data.email,
          phone: data.phone,
          employmentStatus: data.employment_status,
          monthlyIncome: Number(data.monthly_income),
          idType: data.id_type,
          idNumber: data.id_number,
          monthlyRent: Number(data.monthly_rent),
          landlordName: data.landlord_name,
          landlordPhone: data.landlord_phone,
          moveInDate: data.move_in_date,
          leaseDuration: Number(data.lease_duration),
          streetAddress: data.street_address,
          city: data.city,
          stateRegion: data.state_region,
          country: data.country,
          postalCode: data.postal_code,
          amountRequired: Number(data.amount_required),
          repaymentDuration: Number(data.repayment_duration),
          status: data.status,
          createdAt: data.created_at
        };
      }
    } catch (e) {
      console.warn('Fallback to local rent financing submission', e);
    }
  }

  const apps = getLocalApplications();
  apps.unshift(newApp);
  saveLocalApplications(apps);
  return newApp;
};

export const getRentFinancingApplications = async (userId?: string): Promise<RentFinancingApplication[]> => {
  if (isSupabaseConfigured && userId) {
    try {
      const { data, error } = await supabase
        .from('rent_financing_applications')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      if (data) {
        return data.map((d: any) => ({
          id: d.id,
          userId: d.user_id,
          fullName: d.full_name,
          email: d.email,
          phone: d.phone,
          employmentStatus: d.employment_status,
          monthlyIncome: Number(d.monthly_income),
          idType: d.id_type,
          idNumber: d.id_number,
          monthlyRent: Number(d.monthly_rent),
          landlordName: d.landlord_name,
          landlordPhone: d.landlord_phone,
          moveInDate: d.move_in_date,
          leaseDuration: Number(d.lease_duration),
          streetAddress: d.street_address,
          city: d.city,
          stateRegion: d.state_region,
          country: d.country,
          postalCode: d.postal_code,
          amountRequired: Number(d.amount_required),
          repaymentDuration: Number(d.repayment_duration),
          status: d.status,
          createdAt: d.created_at
        }));
      }
    } catch (e) {
      console.warn('Fallback to local rent financing list', e);
    }
  }

  const apps = getLocalApplications();
  if (userId) {
    return apps.filter(a => a.userId === userId || a.email === userId);
  }
  return apps;
};



