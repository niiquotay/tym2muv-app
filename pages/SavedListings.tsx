import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { getListingById } from '../services/supabaseService';
import { Listing } from '../types';
import ListingCard from '../components/ListingCard';
import Icon from '../components/Icon';

const SavedListings: React.FC = () => {
  const { user } = useAuth();
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.savedListings?.length) { 
        setListings([]);
        setLoading(false); 
        return; 
    }
    const fetchSaved = async () => {
        setLoading(true);
        try {
            const promises = user.savedListings.map(id => getListingById(id));
            const results = await Promise.all(promises);
            setListings(results.filter((l): l is Listing => l !== null));
        } catch (err) {
            console.error("Error fetching saved listings:", err);
        } finally {
            setLoading(false);
        }
    };
    fetchSaved();
  }, [user]);

  if (loading) return <div className="flex justify-center py-20"><div className="animate-spin h-10 w-10 rounded-full border-4 border-brand-200 border-t-brand-600"/></div>;

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-slate-900 mb-6">Saved Properties</h1>
      {listings.length === 0 ? (
        <div className="text-center py-20 text-slate-400">
          <Icon name="heart" size={48} className="mx-auto mb-4 opacity-30"/>
          <p className="text-lg">No saved properties yet.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {listings.map(l => <ListingCard key={l.id} listing={l} />)}
        </div>
      )}
    </div>
  );
};

export default SavedListings;
