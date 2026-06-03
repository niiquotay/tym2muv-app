import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { getListings } from '../services/supabaseService';
import { supabase } from '../supabaseClient';
import { Listing } from '../types';
import ListingCard from '../components/ListingCard';
import Icon from '../components/Icon';
import { Link, Navigate } from 'react-router-dom';
import { useRealtimeSubscription } from '../hooks/useRealtimeSubscription';

const AgentDashboard: React.FC = () => {
  const { user } = useAuth();
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [rentalRequestsCount, setRentalRequestsCount] = useState(0);

  useEffect(() => {
    if (!user) return;
    const fetchDashboard = async () => {
      try {
        const result = await getListings({ sellerId: user.id });
        setListings(result.listings);
        
        // Also fetch initial rental requests count (joining properties to only get agent's requests)
        // Since we don't have agent_id on rental_requests directly, we might need a more complex query, 
        // but if agent_id is on rental_requests, we can query it directly. Let's assume it's on the table based on the prompt "Filter: agent_id = current user ID"
        const { count } = await supabase
          .from('rental_requests')
          .select('*', { count: 'exact', head: true })
          .eq('agent_id', user.id);
          
        setRentalRequestsCount(count || 0);

      } catch (err) {
        console.error('Error fetching dashboard listings', err);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboard();
  }, [user]);

  // Handle incoming rental requests dynamically
  useRealtimeSubscription(
    {
      table: 'rental_requests',
      event: 'INSERT',
      filter: `agent_id=eq.${user?.id}`,
    },
    () => {
      setRentalRequestsCount(prev => prev + 1);
    },
    !!user?.id
  );

  if (!user || user.role !== 'Agent') {
      return <Navigate to="/" replace />;
  }

  if (loading) return <div className="flex justify-center py-20"><div className="animate-spin h-10 w-10 rounded-full border-4 border-brand-200 border-t-brand-600"/></div>;

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
          <h1 className="text-2xl font-bold text-slate-900">Agent Dashboard</h1>
          <Link to="/post" className="px-6 py-3 bg-brand-600 text-white rounded-xl font-bold hover:bg-brand-700 transition">
              Post New Property
          </Link>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
             <p className="text-slate-500 font-medium">Active Listings</p>
             <h2 className="text-3xl font-bold text-brand-600 mt-2">{listings.length}</h2>
          </div>
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
             <p className="text-slate-500 font-medium">Pending Requests</p>
             <h2 className="text-3xl font-bold text-slate-800 mt-2">{rentalRequestsCount}</h2>
          </div>
      </div>

      <h2 className="text-xl font-bold text-slate-800 mt-12 mb-6">Your Properties</h2>
      {listings.length === 0 ? (
        <div className="text-center py-20 text-slate-400">
          <Icon name="home" size={48} className="mx-auto mb-4 opacity-30"/>
          <p className="text-lg">You haven't posted any properties yet.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {listings.map(l => <ListingCard key={l.id} listing={l} />)}
        </div>
      )}
    </div>
  );
};

export default AgentDashboard;
