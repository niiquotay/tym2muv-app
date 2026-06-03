import React, { useState, useEffect, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getUserProfile, getListings, getReviewsForVendor, createReview } from '../services/supabaseService';
import { User, Listing, Review } from '../types';
import ListingCard from '../components/ListingCard';
import AdCard from '../components/AdCard';
import Icon from '../components/Icon';
import AgentMonetizationDash from '../components/AgentMonetizationDash';
import { useAuth } from '../context/AuthContext';
import { useMixedContent } from '../hooks/useMixedContent';
import { getOptimizedImageUrl } from '../utils/imageOptimization';

const Profile: React.FC = () => {
  const { userId } = useParams<{ userId: string }>();
  const { user: currentUser, logout } = useAuth();
  const [user, setUser] = useState<User | undefined>(undefined);
  const [listings, setListings] = useState<Listing[]>([]);
  const [savedListings, setSavedListings] = useState<Listing[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [activeTab, setActiveTab] = useState('listings');
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [showReviewForm, setShowReviewForm] = useState(false);
  const isMe = currentUser?.id === user?.id;

  // Define some ads to intersperse
  const ads = [
    {
      type: 'tall' as const,
      title: 'Boost Your Profile',
      description: 'Get a verified badge and stand out from the crowd.',
      cta: 'Get Verified',
      image: 'https://picsum.photos/seed/ad-p1/400/800',
      color: 'from-brand-600 to-fuchsia-600'
    }
  ];

  // Mix listings and ads
  const mixedContent = useMixedContent(listings, ads, 8, 5, false);

  useEffect(() => {
    const fetchProfileData = async () => {
      window.scrollTo(0, 0);
      setIsLoading(true);
      
      try {
        let targetId = userId;
        if (userId === 'me') {
          if (currentUser) {
            targetId = currentUser.id;
          } else {
            setIsLoading(false);
            return;
          }
        }

        if (targetId) {
          const u = await getUserProfile(targetId);
          setUser(u);
          if (u) {
            // Fetch agent listings
            const { listings: userListings } = await getListings({
              sellerId: u.id,
              limit: 50
            });
            setListings(userListings);
            
            // If viewing own tenant profile, fetch saved listings
            if (targetId === currentUser?.id && u.role === 'Tenant' && u.savedListings?.length) {
              // Note: A real app would use a specific 'getSavedListings' query with array-contains 
              // For simplicity, we just fetch all and filter in this MVP view if missing a specific hook
              const { listings: allListings } = await getListings({ limit: 100 });
              setSavedListings(allListings.filter(l => u.savedListings?.includes(l.id)));
              setActiveTab('saved'); // Default to saved tab for tenants
            }
            
            const vendorReviews = await getReviewsForVendor(u.id);
            setReviews(vendorReviews);
          }
        }
      } catch (error) {
        console.error("Error fetching profile data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProfileData();
  }, [userId, currentUser]);

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: `Check out ${user?.name}'s properties on ${user?.agencyName || 'tym2muv'}`,
        url: window.location.href
      }).catch(console.error);
    } else {
      navigator.clipboard.writeText(window.location.href);
      alert('Profile link copied to clipboard!');
    }
  };

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser || !user) return;
    
    setIsSubmittingReview(true);
    try {
      await createReview({
        vendorId: user.id,
        customerId: currentUser.id,
        rating: reviewRating,
        comment: reviewComment
      });
      
      // Refresh reviews and user profile
      const [updatedReviews, updatedUser] = await Promise.all([
        getReviewsForVendor(user.id),
        getUserProfile(user.id)
      ]);
      
      setReviews(updatedReviews);
      if (updatedUser) setUser(updatedUser);
      
      setShowReviewForm(false);
      setReviewComment('');
      setReviewRating(5);
    } catch (error) {
      console.error("Error submitting review:", error);
      alert("Failed to submit review. Please try again.");
    } finally {
      setIsSubmittingReview(false);
    }
  };

  if (isLoading) {
    return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] animate-fade-in">
            <div className="animate-spin text-brand-500 mb-4"><Icon name="loader" size={40} /></div>
            <p className="text-slate-500 font-medium">Finding user profile...</p>
        </div>
    );
  }

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] animate-fade-in">
          <div className="text-slate-300 mb-4"><Icon name="user" size={64} /></div>
          <h2 className="text-xl font-bold text-slate-800">User Not Found</h2>
          <p className="text-slate-500 mt-1">The profile you're looking for doesn't exist.</p>
          <Link to="/" className="mt-6 px-6 py-3 bg-brand-600 text-white rounded-xl font-bold">
            Back to Home
          </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-8"> {/* Standardized padding */}
      {/* Cover Photo Area with Parallax Effect */}
      <div className="h-56 md:h-72 bg-gradient-to-br from-brand-600 via-purple-600 to-fuchsia-500 relative overflow-hidden">
          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
          <div className="absolute inset-0 bg-black/10"></div>
          
          {/* Animated Background Shapes */}
          <div className="absolute top-10 right-10 w-64 h-64 bg-white/10 rounded-full blur-3xl animate-float-slow"></div>
          <div className="absolute bottom-10 left-10 w-48 h-48 bg-fuchsia-400/20 rounded-full blur-2xl animate-float-medium"></div>
      </div>

      <div className="container mx-auto px-4 -mt-20 md:-mt-28 relative z-10 animate-slide-up">
        <div className="glass-strong rounded-[2.5rem] p-6 md:p-10 shadow-2xl ring-1 ring-white/60">
            <div className="flex flex-col lg:flex-row items-start lg:items-end gap-6 mb-10">
                {/* Avatar */}
                <div className="relative group">
                    <div className="absolute -inset-1 bg-gradient-to-br from-brand-400 to-fuchsia-500 rounded-full opacity-70 blur group-hover:opacity-100 transition duration-500"></div>
                    <img src={getOptimizedImageUrl(user.avatar, { width: 300, height: 300, crop: 'thumb' })} alt={user.name} referrerPolicy="no-referrer" className="relative w-32 h-32 md:w-44 md:h-44 rounded-full border-4 border-white shadow-xl object-cover bg-slate-100" />
                    {user.verified && (
                        <div className="absolute bottom-2 right-2 bg-brand-500 text-white p-2 rounded-full border-4 border-white shadow-sm" title="Verified User">
                            <Icon name="check" size={18} />
                        </div>
                    )}
                </div>

                {/* User Info */}
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-1">
                        <h1 className="text-3xl md:text-5xl font-bold text-slate-900 tracking-tight font-display">{user.name}</h1>
                        <button onClick={handleShare} className="p-2 text-slate-400 hover:text-brand-600 bg-slate-100 hover:bg-brand-50 rounded-full transition-colors" title="Share Profile">
                           <Icon name="send" size={16} />
                        </button>
                    </div>
                    
                    {user.role === 'Agent' && user.agencyName && (
                        <div className="flex items-center gap-2 text-brand-600 font-bold mb-3">
                            <Icon name="building" size={18} />
                            <span>{user.agencyName}</span>
                        </div>
                    )}
                    
                    <p className="text-slate-600 text-lg mb-5 max-w-2xl leading-relaxed">{user.bio}</p>
                    
                    <div className="flex flex-wrap gap-4 md:gap-8 text-sm text-slate-500">
                        <div className="flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-100">
                            <Icon name="mapPin" size={16} className="text-brand-500" />
                            {user.location}
                        </div>
                        <div className="flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-100">
                            <Icon name="star" size={16} className="text-yellow-500" />
                            <span className="font-bold text-slate-900">{user.rating}</span> 
                            <span>({user.reviewCount} Reviews)</span>
                        </div>
                        <div className="flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-100">
                            <Icon name="activity" size={16} className="text-brand-500" />
                            Member since {user.memberSince}
                        </div>
                    </div>
                </div>

                {/* Actions */}
                <div className="flex flex-col gap-4 w-full lg:w-auto mt-4 lg:mt-0">
                   <div className="flex gap-3">
                      {isMe ? (
                        <>
                          <Link to="/settings" className="flex-1 lg:flex-none bg-brand-600 text-white px-8 py-3 rounded-2xl hover:bg-brand-700 hover:shadow-lg hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2 font-bold shadow-md shadow-brand-500/20">
                             <Icon name="settings" size={20} /> Edit Profile
                          </Link>
                          <button 
                            onClick={async () => {
                              await logout();
                              window.location.href = '/';
                            }}
                            className="flex-1 lg:flex-none bg-red-50 text-red-600 px-6 py-3 rounded-2xl hover:bg-red-100 hover:shadow-lg hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2 font-bold shadow-md shadow-red-500/10"
                          >
                            <Icon name="logout" size={20} /> Logout
                          </button>
                        </>
                      ) : (
                        <>
                          {user.socials.whatsapp && (
                              <a href={`https://wa.me/${user.socials.whatsapp}`} target="_blank" rel="noopener noreferrer" className="flex-1 lg:flex-none bg-[#25D366] text-white px-6 py-3 rounded-2xl hover:bg-[#128C7E] hover:shadow-lg hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2 font-bold shadow-md shadow-green-500/20">
                                 <Icon name="whatsapp" size={20} /> Chat
                              </a>
                          )}
                          <Link to={`/chat?to=${user.id}`} className="flex-1 lg:flex-none bg-slate-900 text-white px-6 py-3 rounded-2xl hover:bg-slate-800 hover:shadow-lg hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2 font-bold shadow-md shadow-slate-900/20">
                              <Icon name="messageCircle" size={20} /> Message
                          </Link>
                        </>
                      )}
                   </div>
                   
                   {/* Social Row */}
                   <div className="flex justify-center lg:justify-end gap-3">
                      {user.socials.facebook && <a href={`https://facebook.com/${user.socials.facebook}`} target="_blank" rel="noreferrer" className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 hover:bg-[#1877F2] hover:text-white transition-all hover:scale-110"><Icon name="facebook" size={20} /></a>}
                      {user.socials.instagram && <a href={`https://instagram.com/${user.socials.instagram}`} target="_blank" rel="noreferrer" className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 hover:bg-gradient-to-tr hover:from-yellow-400 hover:via-red-500 hover:to-purple-500 hover:text-white transition-all hover:scale-110"><Icon name="instagram" size={20} /></a>}
                      {user.socials.twitter && <a href={`https://twitter.com/${user.socials.twitter}`} target="_blank" rel="noreferrer" className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 hover:bg-[#1DA1F2] hover:text-white transition-all hover:scale-110"><Icon name="twitter" size={20} /></a>}
                      {user.socials.linkedin && <a href="#" className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 hover:bg-[#0A66C2] hover:text-white transition-all hover:scale-110"><Icon name="linkedin" size={20} /></a>}
                   </div>
                </div>
            </div>

            {/* Content Tabs */}
            <div className="border-b border-slate-200 mb-8 overflow-x-auto no-scrollbar">
                <div className="flex gap-8 whitespace-nowrap">
                    {user.role === 'Tenant' && isMe ? (
                      <button 
                         onClick={() => setActiveTab('saved')}
                         className={`pb-4 px-2 font-bold text-sm uppercase tracking-wider transition-all border-b-2 ${activeTab === 'saved' ? 'border-brand-600 text-brand-600' : 'border-transparent text-slate-400 hover:text-slate-600'}`}
                      >
                          Saved Properties ({savedListings.length})
                      </button>
                    ) : null}
                    
                    {user.role !== 'Tenant' && (
                      <button 
                         onClick={() => setActiveTab('listings')}
                         className={`pb-4 px-2 font-bold text-sm uppercase tracking-wider transition-all border-b-2 ${activeTab === 'listings' ? 'border-brand-600 text-brand-600' : 'border-transparent text-slate-400 hover:text-slate-600'}`}
                      >
                          Properties ({listings.length})
                      </button>
                    )}
                    {user.role === 'Agent' && isMe ? (
                      <button 
                         onClick={() => setActiveTab('pro')}
                         className={`pb-4 px-2 font-bold text-sm uppercase tracking-wider transition-all border-b-2 ${activeTab === 'pro' ? 'border-brand-600 text-brand-600' : 'border-transparent text-slate-400 hover:text-slate-600'} flex items-center gap-1.5`}
                      >
                          <Icon name="zap" size={16} className={activeTab === 'pro' ? 'text-brand-500' : 'text-slate-400'} /> Agent Pro
                      </button>
                    ) : null}
                    <button 
                       onClick={() => setActiveTab('reviews')}
                       className={`pb-4 px-2 font-bold text-sm uppercase tracking-wider transition-all border-b-2 ${activeTab === 'reviews' ? 'border-brand-600 text-brand-600' : 'border-transparent text-slate-400 hover:text-slate-600'}`}
                    >
                        Reviews ({user.reviewCount})
                    </button>
                </div>
            </div>

            {activeTab === 'listings' ? (
                listings.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
                        {mixedContent.map((item, idx) => (
                            item.type === 'listing' ? (
                                <ListingCard key={item.data.id} listing={item.data} />
                            ) : (
                                <AdCard 
                                    key={`ad-${idx}`} 
                                    type={item.data.type}
                                    title={item.data.title}
                                    description={item.data.description}
                                    cta={item.data.cta}
                                    image={item.data.image}
                                    color={item.data.color}
                                    className={`col-start-1 sm:col-start-${(idx % 2) + 1} lg:col-start-${(idx % 3) + 1} xl:col-start-${(idx % 4) + 1}`}
                                />
                            )
                        ))}
                    </div>
                ) : (
                    <div className="py-20 text-center">
                        <div className="inline-block p-6 bg-slate-50 rounded-full mb-4">
                            <Icon name="home" size={40} className="text-slate-300" />
                        </div>
                        <h3 className="text-lg font-bold text-slate-700">No properties listed</h3>
                        <p className="text-slate-500 mt-1">This agent hasn't posted any properties yet.</p>
                    </div>
                )
            ) : activeTab === 'pro' ? (
                 <AgentMonetizationDash />
            ) : activeTab === 'saved' ? (
                savedListings.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
                        {savedListings.map(listing => (
                            <ListingCard key={listing.id} listing={listing} />
                        ))}
                    </div>
                ) : (
                    <div className="py-20 text-center">
                        <div className="inline-block p-6 bg-slate-50 rounded-full mb-4">
                            <Icon name="heart" size={40} className="text-slate-300" />
                        </div>
                        <h3 className="text-lg font-bold text-slate-700">No saved properties</h3>
                        <p className="text-slate-500 mt-1">You haven't saved any listings to your favorites yet.</p>
                    </div>
                )
            ) : (
                <div className="space-y-8">
                    {!isMe && currentUser && (
                        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                            {!showReviewForm ? (
                                <div className="flex items-center justify-between">
                                    <div>
                                        <h3 className="font-bold text-slate-800">Leave a Review</h3>
                                        <p className="text-sm text-slate-500">Share your experience with {user.name}</p>
                                    </div>
                                    <button 
                                        onClick={() => setShowReviewForm(true)}
                                        className="px-4 py-2 bg-brand-50 text-brand-600 font-medium rounded-xl hover:bg-brand-100 transition-colors"
                                    >
                                        Write Review
                                    </button>
                                </div>
                            ) : (
                                <form onSubmit={handleSubmitReview} className="space-y-4 animate-fade-in">
                                    <div className="flex items-center justify-between mb-2">
                                        <h3 className="font-bold text-slate-800">Write a Review</h3>
                                        <button 
                                            type="button" 
                                            onClick={() => setShowReviewForm(false)}
                                            className="text-slate-400 hover:text-slate-600"
                                        >
                                            <Icon name="x" size={20} />
                                        </button>
                                    </div>
                                    
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-2">Rating</label>
                                        <div className="flex gap-2">
                                            {[1, 2, 3, 4, 5].map((star) => (
                                                <button
                                                    key={star}
                                                    type="button"
                                                    onClick={() => setReviewRating(star)}
                                                    className={`p-1 transition-colors ${reviewRating >= star ? 'text-yellow-400' : 'text-slate-200 hover:text-yellow-200'}`}
                                                >
                                                    <Icon name="star" size={32} className={reviewRating >= star ? 'fill-current' : ''} />
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                    
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-2">Comment (Optional)</label>
                                        <textarea
                                            value={reviewComment}
                                            onChange={(e) => setReviewComment(e.target.value)}
                                            placeholder="Tell others about your experience..."
                                            className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-brand-500 focus:ring-2 focus:ring-brand-200 outline-none transition-all resize-none h-24"
                                            maxLength={1000}
                                        />
                                    </div>
                                    
                                    <div className="flex justify-end gap-3 pt-2">
                                        <button 
                                            type="button"
                                            onClick={() => setShowReviewForm(false)}
                                            className="px-5 py-2.5 text-slate-600 font-medium hover:bg-slate-50 rounded-xl transition-colors"
                                        >
                                            Cancel
                                        </button>
                                        <button 
                                            type="submit"
                                            disabled={isSubmittingReview}
                                            className="px-5 py-2.5 bg-brand-600 text-white font-medium rounded-xl hover:bg-brand-700 transition-colors disabled:opacity-50 flex items-center gap-2"
                                        >
                                            {isSubmittingReview ? (
                                                <><Icon name="loader" size={16} className="animate-spin" /> Submitting...</>
                                            ) : (
                                                'Submit Review'
                                            )}
                                        </button>
                                    </div>
                                </form>
                            )}
                        </div>
                    )}

                    {reviews.length > 0 ? (
                        <div className="space-y-4">
                            {reviews.map((review) => (
                                <div key={review.id} className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                                    <div className="flex items-start justify-between mb-3">
                                        <div className="flex items-center gap-1 text-yellow-500">
                                            {[...Array(5)].map((_, i) => (
                                                <Icon 
                                                    key={i} 
                                                    name="star" 
                                                    size={16} 
                                                    className={i < review.rating ? 'fill-current' : 'text-slate-200'} 
                                                />
                                            ))}
                                        </div>
                                        <span className="text-xs text-slate-400">
                                            {new Date(review.createdAt).toLocaleDateString()}
                                        </span>
                                    </div>
                                    {review.comment && (
                                        <p className="text-slate-600 leading-relaxed">{review.comment}</p>
                                    )}
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="py-16 text-center text-slate-500 bg-slate-50/50 rounded-3xl border border-dashed border-slate-200">
                            <div className="inline-block p-4 bg-white rounded-full mb-4 shadow-sm">
                                <Icon name="star" size={32} className="text-slate-300" />
                            </div>
                            <h3 className="text-lg font-bold text-slate-700">No reviews yet</h3>
                            <p className="text-slate-500 mt-1">
                                {isMe ? "You don't have any reviews yet." : "Be the first to review this user!"}
                            </p>
                        </div>
                    )}
                </div>
            )}
        </div>
      </div>
    </div>
  );
};

export default Profile;