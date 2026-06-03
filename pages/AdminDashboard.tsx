import React, { useState, useEffect } from 'react';
import AdCard from '../components/AdCard';
import { 
  Users, 
  Home, 
  BarChart3, 
  Settings, 
  Plus, 
  Trash2, 
  Edit2, 
  CheckCircle, 
  XCircle,
  TrendingUp,
  DollarSign,
  Layout as LayoutIcon,
  Search,
  MoreVertical,
  ArrowRight,
  ExternalLink,
  Eye,
  MousePointer2
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  LineChart, 
  Line,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { 
  getAllUsers, 
  getListings, 
  getMonetizationAds, 
  getAdminStats, 
  updateUserRole, 
  updateUserProfile,
  deleteListing,
  updateListing,
  createMonetizationAd,
  updateMonetizationAd,
  deleteMonetizationAd,
  uploadImage,
  getStaticPages,
  createStaticPage,
  updateStaticPage,
  deleteStaticPage,
  getBlogPosts,
  createBlogPost,
  updateBlogPost,
  deleteBlogPost
} from '../services/supabaseService';
import { 
  seedMockData, 
  clearMockData 
} from '../utils/seedMockData';
import { User, Listing, Monetization, StaticPage, BlogPost } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { getSymbolFromCode } from '../services/location';

const COLORS = ['#ea580c', '#3b82f6', '#10b981', '#f59e0b'];

const AdminDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'analytics' | 'users' | 'listings' | 'monetization' | 'pages'>('analytics');
  const [stats, setStats] = useState<any>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [listings, setListings] = useState<Listing[]>([]);
  const [ads, setAds] = useState<Monetization[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Filtering & Pagination State
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [activePage, setActivePage] = useState(1);
  const [pageSize, setPageSize] = useState(50);
  const [totalCount, setTotalCount] = useState(0);
  const [listingTab, setListingTab] = useState<'all' | 'pending' | 'rejected'>('all');
  const [dateRange, setDateRange] = useState({ start: '', end: '' });

  const [showAdModal, setShowAdModal] = useState(false);
  const [editingAd, setEditingAd] = useState<Monetization | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  // Live preview interactive state helpers
  const [previewTitle, setPreviewTitle] = useState('');
  const [previewDesc, setPreviewDesc] = useState('');
  const [previewCta, setPreviewCta] = useState('');
  const [previewColor, setPreviewColor] = useState('from-brand-600 to-indigo-600');
  const [previewType, setPreviewType] = useState<'standard' | 'tall'>('tall');
  const [previewImage, setPreviewImage] = useState('');

  // CMS state helpers
  const [cmsTab, setCmsTab] = useState<'pages' | 'blog'>('pages');
  const [cmsPages, setCmsPages] = useState<StaticPage[]>([]);
  const [blogPosts, setBlogPosts] = useState<BlogPost[]>([]);
  const [cmsLoading, setCmsLoading] = useState(false);
  const [showCmsModal, setShowCmsModal] = useState(false);
  const [editingPage, setEditingPage] = useState<StaticPage | null>(null);
  const [editingPost, setEditingPost] = useState<BlogPost | null>(null);

  // Form states for CMS Page
  const [pageForm, setPageForm] = useState({
    title: '',
    slug: '',
    content: '',
    published: true,
    metaTitle: '',
    metaDescription: ''
  });

  // Form states for BlogPost
  const [postForm, setPostForm] = useState({
    title: '',
    slug: '',
    excerpt: '',
    content: '',
    published: true,
    coverImage: '',
    authorName: '',
    category: 'Market Analysis',
    readTime: '4 min read'
  });

  // CMS CRUD actions
  const handleOpenPageCreate = () => {
    setEditingPage(null);
    setPageForm({
      title: '',
      slug: '',
      content: '# New Page\\n\\nWrite content here.',
      published: true,
      metaTitle: '',
      metaDescription: ''
    });
    setEditingPost(null);
    setShowCmsModal(true);
  };

  const handleOpenPageEdit = (page: StaticPage) => {
    setEditingPage(page);
    setPageForm({
      title: page.title,
      slug: page.slug,
      content: page.content,
      published: page.published,
      metaTitle: page.metaTitle || '',
      metaDescription: page.metaDescription || ''
    });
    setEditingPost(null);
    setShowCmsModal(true);
  };

  const handleOpenPostCreate = () => {
    setEditingPost(null);
    setPostForm({
      title: '',
      slug: '',
      excerpt: '',
      content: '## New Post\\n\\nStart writing in Markdown.',
      published: true,
      coverImage: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=800&q=80',
      authorName: 'Admin Specialist',
      category: 'Market Analysis',
      readTime: '4 min read'
    });
    setEditingPage(null);
    setShowCmsModal(true);
  };

  const handleOpenPostEdit = (post: BlogPost) => {
    setEditingPost(post);
    setPostForm({
      title: post.title,
      slug: post.slug,
      excerpt: post.excerpt,
      content: post.content,
      published: post.published,
      coverImage: post.coverImage || '',
      authorName: post.authorName,
      category: post.category,
      readTime: post.readTime || '4 min read'
    });
    setEditingPage(null);
    setShowCmsModal(true);
  };

  const handleCmsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setCmsLoading(true);
    try {
      if (cmsTab === 'pages') {
        if (editingPage) {
          await updateStaticPage(editingPage.id, pageForm);
        } else {
          await createStaticPage(pageForm);
        }
      } else {
        if (editingPost) {
          await updateBlogPost(editingPost.id, postForm);
        } else {
          await createBlogPost(postForm);
        }
      }
      setShowCmsModal(false);
      setEditingPage(null);
      setEditingPost(null);
      fetchData();
    } catch (err) {
      console.error('Failed to save CMS item:', err);
      alert('Error saving data. Please verify fields.');
    } finally {
      setCmsLoading(false);
    }
  };

  const handleDeletePage = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this static page? Users will no longer be able to load it.')) {
      await deleteStaticPage(id);
      fetchData();
    }
  };

  const handleDeletePost = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this blog post?')) {
      await deleteBlogPost(id);
      fetchData();
    }
  };

  useEffect(() => {
    if (showAdModal) {
      if (editingAd) {
        setPreviewTitle(editingAd.title || '');
        setPreviewDesc(editingAd.description || '');
        setPreviewCta(editingAd.cta || 'Learn More');
        setPreviewColor(editingAd.color || 'from-brand-600 to-indigo-600');
        setPreviewType(editingAd.type === 'tall' ? 'tall' : 'standard');
        setPreviewImage(editingAd.image || '');
      } else {
        setPreviewTitle('Luxury Studio Condo');
        setPreviewDesc('Special offers and zero down-payment mortgages on urban studios!');
        setPreviewCta('Grab Deal');
        setPreviewColor('from-brand-600 to-fuchsia-600');
        setPreviewType('tall');
        setPreviewImage('https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=600&q=80');
      }
    }
  }, [editingAd, showAdModal]);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchTerm), 500);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  useEffect(() => {
    setActivePage(1); // Reset page on filter changes
  }, [debouncedSearch, listingTab, dateRange, activeTab]);

  useEffect(() => {
    fetchData();
  }, [activeTab, activePage, debouncedSearch, listingTab, dateRange]);

  const fetchData = async () => {
    setLoading(true);
    try {
      if (activeTab === 'analytics') {
        const statsData = await getAdminStats();
        setStats(statsData);
      } else if (activeTab === 'listings') {
        const filters: any = {
           page: activePage,
           pageSize,
           isAdminQuery: true,
           query: debouncedSearch
        };
        if (listingTab !== 'all') filters.status = listingTab;
        if (dateRange.start) filters.startDate = dateRange.start;
        if (dateRange.end) filters.endDate = dateRange.end;
        
        const listingsData = await getListings(filters);
        setListings(listingsData.listings);
        setTotalCount(listingsData.total);
      } else if (activeTab === 'users') {
        const usersData = await getAllUsers();
        // Since getAllUsers doesn't have pagination yet in this codebase, we'll just filter client side for now or implement totalCount
        setUsers(usersData);
      } else if (activeTab === 'monetization') {
        const adsData = await getMonetizationAds();
        setAds(adsData);
      } else if (activeTab === 'pages') {
        const pagesData = await getStaticPages();
        setCmsPages(pagesData);
        const blogsData = await getBlogPosts();
        setBlogPosts(blogsData);
      }
    } catch (error) {
      console.error(`Error fetching admin data for ${activeTab}:`, error);
    } finally {
      setLoading(false);
    }
  };

  const handleRoleChange = async (userId: string, newRole: 'Agent' | 'Customer' | 'Admin') => {
    await updateUserRole(userId, newRole);
    fetchData();
  };

  const handleDeleteListing = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this listing?')) {
      await deleteListing(id);
      fetchData();
    }
  };

  const handleAdSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    setIsUploading(true);
    let imageUrl = formData.get('image_url') as string;
    const file = formData.get('image_file') as File;
    
    try {
      if (file && file.size > 0) {
        // Upload image if file is provided
        const path = `monetization/${Date.now()}_${file.name}`;
        imageUrl = await uploadImage(file, path);
      }
      
      const adData = {
        type: formData.get('type') as any,
        title: formData.get('title') as string,
        description: formData.get('description') as string,
        cta: formData.get('cta') as string,
        image: imageUrl || editingAd?.image || '',
        link: formData.get('link') as string,
        color: formData.get('color') as string,
        active: formData.get('active') === 'on',
        priority: parseInt(formData.get('priority') as string) || 0,
        countryCode: formData.get('countryCode') as string || undefined
      };

      if (editingAd) {
        await updateMonetizationAd(editingAd.id, adData);
      } else {
        await createMonetizationAd(adData);
      }
      setShowAdModal(false);
      setEditingAd(null);
      fetchData();
    } catch (error) {
      console.error('Error saving ad:', error);
      alert('Error saving ad. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleDeleteAd = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this ad?')) {
      await deleteMonetizationAd(id);
      fetchData();
    }
  };

  const handleApproveListing = async (id: string) => {
    await updateListing(id, { status: 'active' });
    fetchData();
  };

  const handleRejectListing = async (id: string) => {
    await updateListing(id, { status: 'rejected' });
    fetchData();
  };

  const handleToggleListingStatus = async (id: string, currentStatus: string | undefined) => {
    const newStatus = currentStatus === 'pending' ? 'active' : currentStatus === 'active' ? 'rejected' : 'active';
    await updateListing(id, { status: newStatus });
    fetchData();
  };

  const handleToggleVerifyUser = async (userId: string, currentVerified: boolean) => {
    try {
      await updateUserProfile(userId, { verified: !currentVerified });
      fetchData();
    } catch (err) {
      console.error('Failed to toggle verification status:', err);
    }
  };

  const filteredUsers = users.filter(u => 
    u.name.toLowerCase().includes(debouncedSearch.toLowerCase()) || 
    u.socials?.email?.toLowerCase().includes(debouncedSearch.toLowerCase())
  );

  const filteredListings = listings; // Search is now done server-side

  const pendingCount = stats?.pendingApprovals || 0;

  if (loading && !stats) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <div className="w-64 bg-white border-r border-gray-200 flex flex-col fixed h-full">
        <div className="p-6 border-b border-gray-100">
          <div className="flex items-center gap-2 text-orange-600 font-bold text-xl">
            <LayoutIcon size={24} />
            <span>Admin Panel</span>
          </div>
        </div>
        <nav className="flex-1 p-4 space-y-1">
          <button 
            onClick={() => setActiveTab('analytics')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${activeTab === 'analytics' ? 'bg-orange-50 text-orange-600' : 'text-gray-600 hover:bg-gray-50'}`}
          >
            <BarChart3 size={20} />
            <span className="font-medium">Analytics</span>
          </button>
          <button 
            onClick={() => setActiveTab('users')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${activeTab === 'users' ? 'bg-orange-50 text-orange-600' : 'text-gray-600 hover:bg-gray-50'}`}
          >
            <Users size={20} />
            <span className="font-medium">Users</span>
          </button>
          <button 
            onClick={() => setActiveTab('listings')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${activeTab === 'listings' ? 'bg-orange-50 text-orange-600' : 'text-gray-600 hover:bg-gray-50'}`}
          >
            <Home size={20} />
            <span className="font-medium">Listings</span>
          </button>
          <button 
            onClick={() => setActiveTab('monetization')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${activeTab === 'monetization' ? 'bg-orange-50 text-orange-600' : 'text-gray-600 hover:bg-gray-50'}`}
          >
            <DollarSign size={20} />
            <span className="font-medium">Monetization</span>
          </button>
          <button 
            onClick={() => setActiveTab('pages')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${activeTab === 'pages' ? 'bg-orange-50 text-orange-600' : 'text-gray-600 hover:bg-gray-50'}`}
          >
            <Settings size={20} />
            <span className="font-medium">Page Management</span>
          </button>
        </nav>
        <div className="p-4 border-t border-gray-100">
          <div className="flex items-center gap-3 px-4 py-3 text-gray-400 text-sm">
            <TrendingUp size={16} />
            <span>v1.2.0 Stable</span>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 ml-64 p-8">
        <header className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 capitalize">{activeTab}</h1>
            <p className="text-gray-500">Manage your application and view real-time data.</p>
          </div>
          <div className="flex items-center gap-4">
            <button 
              onClick={async () => { if(window.confirm('Seed mock data?')) { await seedMockData(); fetchData(); } }}
              className="px-4 py-2 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-colors text-sm"
            >
              Seed Mock Data
            </button>
            <button 
              onClick={async () => { if(window.confirm('CLEAR ALL DATA? This is irreversible!')) { await clearMockData(); fetchData(); } }}
              className="px-4 py-2 bg-red-600 text-white rounded-xl font-bold hover:bg-red-700 transition-colors text-sm"
            >
              Clear Data
            </button>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input 
                type="text" 
                placeholder="Search..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 w-64"
              />
            </div>
            <button 
              onClick={fetchData}
              className="p-2 text-gray-500 hover:bg-white hover:shadow-sm rounded-xl transition-all"
            >
              <Plus size={20} className="rotate-45" />
            </button>
          </div>
        </header>

        <AnimatePresence mode="wait">
          {activeTab === 'analytics' && (
            <motion.div 
              key="analytics"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-8"
            >
              {/* Stats Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                  <div className="flex justify-between items-start mb-4">
                    <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
                      <Users size={24} />
                    </div>
                    <span className="text-sm font-medium text-green-600 flex items-center gap-1">
                      +12% <TrendingUp size={14} />
                    </span>
                  </div>
                  <h3 className="text-gray-500 text-sm font-medium">Total Users</h3>
                  <p className="text-2xl font-bold text-gray-900">{stats?.totalUsers || 0}</p>
                </div>
                <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                  <div className="flex justify-between items-start mb-4">
                    <div className="p-3 bg-orange-50 text-orange-600 rounded-xl">
                      <Home size={24} />
                    </div>
                    <span className="text-sm font-medium text-green-600 flex items-center gap-1">
                      +5% <TrendingUp size={14} />
                    </span>
                  </div>
                  <h3 className="text-gray-500 text-sm font-medium">Total Listings</h3>
                  <p className="text-2xl font-bold text-gray-900">{stats?.totalListings || 0}</p>
                </div>
                <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                  <div className="flex justify-between items-start mb-4">
                    <div className="p-3 bg-green-50 text-green-600 rounded-xl">
                      <MousePointer2 size={24} />
                    </div>
                    <span className="text-sm font-medium text-orange-600 flex items-center gap-1">
                      -2% <TrendingUp size={14} className="rotate-180" />
                    </span>
                  </div>
                  <h3 className="text-gray-500 text-sm font-medium">Ad Clicks</h3>
                  <p className="text-2xl font-bold text-gray-900">{stats?.adPerformance?.totalClicks || 0}</p>
                </div>
                <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                  <div className="flex justify-between items-start mb-4">
                    <div className="p-3 bg-purple-50 text-purple-600 rounded-xl">
                      <Eye size={24} />
                    </div>
                    <span className="text-sm font-medium text-green-600 flex items-center gap-1">
                      +18% <TrendingUp size={14} />
                    </span>
                  </div>
                  <h3 className="text-gray-500 text-sm font-medium">Ad Impressions</h3>
                  <p className="text-2xl font-bold text-gray-900">{stats?.adPerformance?.totalImpressions || 0}</p>
                </div>
              </div>

              {/* Charts */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                  <h3 className="text-lg font-bold text-gray-900 mb-6">User Growth</h3>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={[
                        { name: 'Jan', users: 400 },
                        { name: 'Feb', users: 600 },
                        { name: 'Mar', users: 800 },
                        { name: 'Apr', users: 1200 },
                        { name: 'May', users: 1500 },
                        { name: 'Jun', users: 2100 },
                      ]}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12 }} />
                        <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12 }} />
                        <Tooltip 
                          contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                        />
                        <Line type="monotone" dataKey="users" stroke="#ea580c" strokeWidth={3} dot={{ r: 4, fill: '#ea580c' }} activeDot={{ r: 6 }} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                  <h3 className="text-lg font-bold text-gray-900 mb-6">User Roles Distribution</h3>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={[
                            { name: 'Admins', value: stats?.userRoles?.Admin || 0 },
                            { name: 'Agents', value: stats?.userRoles?.Agent || 0 },
                            { name: 'Customers', value: stats?.userRoles?.Customer || 0 },
                          ]}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={100}
                          paddingAngle={5}
                          dataKey="value"
                        >
                          {COLORS.map((color, index) => (
                            <Cell key={`cell-${index}`} fill={color} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="flex justify-center gap-6 mt-4">
                    {['Admins', 'Agents', 'Customers'].map((role, i) => (
                      <div key={role} className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[i] }} />
                        <span className="text-sm text-gray-600">{role}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'users' && (
            <motion.div 
              key="users"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden"
            >
              <table className="w-full text-left font-sans">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100">
                    <th className="px-6 py-4 text-xs font-black uppercase text-slate-500 tracking-wider">User Profile</th>
                    <th className="px-6 py-4 text-xs font-black uppercase text-slate-500 tracking-wider">Access Role</th>
                    <th className="px-6 py-4 text-xs font-black uppercase text-slate-500 tracking-wider">Verification Status</th>
                    <th className="px-6 py-4 text-xs font-black uppercase text-slate-500 tracking-wider">Resident Location</th>
                    <th className="px-6 py-4 text-xs font-black uppercase text-slate-500 tracking-wider">Joined Date</th>
                    <th className="px-6 py-4 text-xs font-black uppercase text-slate-500 tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {filteredUsers.map(user => (
                    <tr key={user.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <img src={user.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=80&h=80'} alt="" className="w-10 h-10 rounded-full object-cover border border-slate-100 shadow-sm" />
                          <div>
                            <div className="font-bold text-gray-950 text-sm">{user.name}</div>
                            <div className="text-xs text-slate-500 font-medium">{user.socials?.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <select 
                          value={user.role}
                          onChange={(e) => handleRoleChange(user.id, e.target.value as any)}
                          className={`text-xs font-black px-3 py-1 rounded-full border-none focus:ring-2 focus:ring-orange-500 cursor-pointer ${
                            user.role === 'Admin' ? 'bg-purple-100 text-purple-700' :
                            user.role === 'Agent' ? 'bg-blue-100 text-blue-700' :
                            'bg-gray-100 text-gray-700'
                          }`}
                        >
                          <option value="Customer">Customer</option>
                          <option value="Agent">Agent</option>
                          <option value="Admin">Admin</option>
                        </select>
                      </td>
                      <td className="px-6 py-4">
                        <button
                          onClick={() => handleToggleVerifyUser(user.id, !!user.verified)}
                          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-black transition-all border shadow-sm active:scale-95 ${
                            user.verified 
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100' 
                            : 'bg-amber-50 text-amber-800 border-amber-200 hover:bg-amber-100'
                          }`}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full ${user.verified ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                          {user.verified ? 'Verified Agent' : 'Standard Account'}
                        </button>
                      </td>
                      <td className="px-6 py-4 text-xs font-bold text-slate-600">{user.location || 'Global Corridor'}</td>
                      <td className="px-6 py-4 text-xs text-slate-500 font-medium">{user.memberSince}</td>
                      <td className="px-6 py-4">
                        <button className="p-2 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors">
                          <MoreVertical size={16} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </motion.div>
          )}

          {activeTab === 'listings' && (
            <motion.div 
              key="listings"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-6"
            >
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-gray-200 pb-2">
                <div className="flex gap-4">
                  <button 
                    onClick={() => setListingTab('all')}
                    className={`pb-2 border-b-2 font-medium text-sm transition-colors ${listingTab === 'all' ? 'border-orange-600 text-orange-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                  >
                    All Listings
                  </button>
                  <button 
                    onClick={() => setListingTab('pending')}
                    className={`pb-2 border-b-2 font-medium text-sm transition-colors flex items-center gap-2 ${listingTab === 'pending' ? 'border-orange-600 text-orange-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                  >
                    Pending Approvals
                    {pendingCount > 0 && (
                      <span className="bg-orange-100 text-orange-600 text-xs px-2 py-0.5 rounded-full font-bold">
                        {pendingCount}
                      </span>
                    )}
                  </button>
                  <button 
                    onClick={() => setListingTab('rejected')}
                    className={`pb-2 border-b-2 font-medium text-sm transition-colors flex items-center gap-2 ${listingTab === 'rejected' ? 'border-orange-600 text-orange-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                  >
                    Rejected
                  </button>
                </div>
                <div className="flex gap-2 items-center">
                   <input type="date" value={dateRange.start} onChange={e => setDateRange(prev => ({ ...prev, start: e.target.value }))} className="text-sm px-2 py-1 border rounded-lg" />
                   <span className="text-gray-400">to</span>
                   <input type="date" value={dateRange.end} onChange={e => setDateRange(prev => ({ ...prev, end: e.target.value }))} className="text-sm px-2 py-1 border rounded-lg" />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {filteredListings.map(listing => (
                <div key={listing.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden group flex flex-col">
                  <div className="relative h-48 flex-shrink-0">
                    <img src={listing.imageUrl} alt="" className="w-full h-full object-cover" />
                    <div className="absolute top-4 right-4 flex gap-2">
                      <button 
                        onClick={() => handleDeleteListing(listing.id)}
                        className="p-2 bg-white/90 backdrop-blur-sm text-red-600 rounded-xl shadow-sm hover:bg-red-600 hover:text-white transition-all"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                    <div className="absolute bottom-4 left-4">
                      <span className="px-3 py-1 bg-orange-600 text-white text-xs font-bold rounded-full shadow-lg">
                        {getSymbolFromCode(listing.currency || 'USD')}{listing.price.toLocaleString()}
                      </span>
                    </div>
                  </div>
                  <div className="flex flex-col flex-1 p-4">
                    <h3 className="font-bold text-gray-900 mb-1 line-clamp-1">{listing.title}</h3>
                    <div className="flex items-center gap-2 text-gray-500 text-sm mb-4">
                      <TrendingUp size={14} />
                      <span>{listing.type} • {listing.propertyType}</span>
                    </div>
                    
                    <div className="mt-auto pt-4 border-t border-gray-50 flex items-center justify-between">
                      {listing.status === 'pending' ? (
                        <div className="flex gap-2">
                          <button 
                            onClick={() => handleApproveListing(listing.id)}
                            className="bg-green-100 text-green-700 px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-green-200"
                          >
                            Approve
                          </button>
                          <button 
                            onClick={() => handleRejectListing(listing.id)}
                            className="bg-red-100 text-red-700 px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-red-200"
                          >
                            Reject
                          </button>
                        </div>
                      ) : (
                        <button 
                          onClick={() => handleToggleListingStatus(listing.id, listing.status)}
                          className={`flex items-center gap-2 px-2 py-1 rounded border transition-colors ${
                            !listing.status || listing.status === 'active' 
                            ? 'bg-green-50 text-green-700 border-green-200 hover:bg-green-100' 
                            : 'bg-red-50 text-red-700 border-red-200 hover:bg-red-100'
                          }`}
                        >
                          <div className={`w-2 h-2 rounded-full ${
                            !listing.status || listing.status === 'active' ? 'bg-green-500' : 'bg-red-500'
                          }`}></div>
                          <span className="text-xs font-bold uppercase tracking-wider">
                            {!listing.status ? 'ACTIVE' : listing.status}
                          </span>
                        </button>
                      )}
                      
                      <button className="text-orange-600 text-sm font-bold flex flex-shrink-0 items-center gap-1 hover:underline ml-2">
                        View <ArrowRight size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
              </div>
              
              {/* Pagination Controls */}
              {totalCount > 0 && (
                <div className="flex items-center justify-between pt-6 border-t border-gray-200">
                  <div className="text-sm text-gray-500">
                    Showing <span className="font-bold text-gray-900">{((activePage - 1) * pageSize) + 1}</span> to <span className="font-bold text-gray-900">{Math.min(activePage * pageSize, totalCount)}</span> of <span className="font-bold text-gray-900">{totalCount}</span> listings
                  </div>
                  <div className="flex gap-2">
                    <button 
                      onClick={() => setActivePage(p => Math.max(1, p - 1))}
                      disabled={activePage === 1}
                      className="px-4 py-2 border border-gray-200 rounded-xl text-sm font-bold text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:hover:bg-transparent"
                    >
                      Previous
                    </button>
                    <button 
                      onClick={() => setActivePage(p => p + 1)}
                      disabled={activePage * pageSize >= totalCount}
                      className="px-4 py-2 border border-gray-200 rounded-xl text-sm font-bold text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:hover:bg-transparent"
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}
            </motion.div>
          )}

          {activeTab === 'monetization' && (
            <motion.div 
              key="monetization"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-6"
            >
              <div className="flex justify-between items-center">
                <h2 className="text-lg font-bold text-gray-900">Active Campaigns</h2>
                <button 
                  onClick={() => { setEditingAd(null); setShowAdModal(true); }}
                  className="flex items-center gap-2 px-4 py-2 bg-orange-600 text-white rounded-xl font-bold hover:bg-orange-700 transition-colors"
                >
                  <Plus size={18} />
                  New Campaign
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {ads.map(ad => (
                  <div key={ad.id} className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                    <div className="flex justify-between items-start mb-6">
                      <div className="flex gap-4">
                        <div className="w-16 h-16 rounded-xl overflow-hidden bg-gray-100">
                          <img src={ad.image} alt="" className="w-full h-full object-cover" />
                        </div>
                        <div>
                          <h3 className="font-bold text-gray-900">{ad.title}</h3>
                          <div className="flex items-center gap-2 mt-1">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                              ad.active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
                            }`}>
                              {ad.active ? 'Active' : 'Paused'}
                            </span>
                            <span className="text-xs text-gray-400">{ad.type}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button 
                          onClick={() => { setEditingAd(ad); setShowAdModal(true); }}
                          className="p-2 text-gray-400 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition-all"
                        >
                          <Edit2 size={18} />
                        </button>
                        <button 
                          onClick={() => handleDeleteAd(ad.id)}
                          className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-4 mb-4">
                      <div className="bg-gray-50 p-3 rounded-xl">
                        <div className="text-[10px] text-gray-500 uppercase font-bold mb-1">Impressions</div>
                        <div className="text-lg font-bold text-gray-900">{ad.impressions || 0}</div>
                      </div>
                      <div className="bg-gray-50 p-3 rounded-xl">
                        <div className="text-[10px] text-gray-500 uppercase font-bold mb-1">Clicks</div>
                        <div className="text-lg font-bold text-gray-900">{ad.clicks || 0}</div>
                      </div>
                      <div className="bg-gray-50 p-3 rounded-xl">
                        <div className="text-[10px] text-gray-500 uppercase font-bold mb-1">CTR</div>
                        <div className="text-lg font-bold text-gray-900">
                          {ad.impressions ? ((ad.clicks / ad.impressions) * 100).toFixed(1) : 0}%
                        </div>
                      </div>
                    </div>

                    {/* Miniature AdCard Visual Preview */}
                    <div className="mb-4 p-4 bg-slate-50 border border-slate-150/60 rounded-2xl">
                      <div className="text-[9px] text-slate-400 font-black uppercase tracking-widest mb-2 flex justify-between">
                        <span>Portal Placement Preview</span>
                        <span className="text-slate-500 font-bold lowercase">{ad.type === 'tall' ? 'tall grid ad' : 'standard flow ad'}</span>
                      </div>
                      <div className="max-w-[170px] mx-auto aspect-[3/4] bg-white p-1 rounded-xl shadow-sm border border-slate-200">
                        <AdCard
                          id={ad.id}
                          type={ad.type === 'tall' ? 'tall' : 'standard'}
                          title={ad.title}
                          description={ad.description || 'No description text provided'}
                          cta={ad.cta || 'Learn More'}
                          image={ad.image}
                          color={ad.color || 'from-brand-600 to-indigo-600'}
                          link={ad.link}
                        />
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-3 border-t border-gray-50">
                      <a 
                        href={ad.link} 
                        target="_blank" 
                        rel="noreferrer"
                        className="text-xs text-blue-600 hover:underline flex items-center gap-1"
                      >
                        {ad.link} <ExternalLink size={12} />
                      </a>
                      <div className="text-xs text-gray-400">Priority: {ad.priority}</div>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {activeTab === 'pages' && (
            <motion.div 
              key="pages"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="space-y-6"
            >
              {/* CMS Tab Bar Header */}
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-white p-4 rounded-2xl border border-slate-100 shadow-sm gap-4">
                <div>
                  <h4 className="font-bold text-slate-800 text-sm">Static Page Management</h4>
                  <p className="text-[10px] text-slate-450 font-medium">Build, edit and publish static content pages</p>
                </div>
                
                <button
                  onClick={handleOpenPageCreate}
                  className="flex items-center gap-1.5 px-4 py-2.5 bg-orange-600 hover:bg-orange-700 text-white rounded-xl text-xs font-bold transition-colors shadow-lg shadow-orange-500/10"
                >
                  <Plus size={16} />
                  <span>Create Static Page</span>
                </button>
              </div>

              {/* Static Pages List view */}
              {cmsTab === 'pages' ? (
                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden pb-4">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-slate-50/50 text-[10px] uppercase text-slate-500 font-mono tracking-wider border-b border-slate-100">
                          <th className="px-6 py-4">Title</th>
                          <th className="px-6 py-4">Slug</th>
                          <th className="px-6 py-4">Meta Title</th>
                          <th className="px-6 py-4">Status</th>
                          <th className="px-6 py-4 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50">
                        {cmsPages.length === 0 ? (
                          <tr>
                            <td colSpan={5} className="text-center py-12 text-slate-400 text-xs font-medium">
                              No static pages defined. Click the button above to add one.
                            </td>
                          </tr>
                        ) : (
                          cmsPages.map(page => (
                            <tr key={page.id} className="text-xs text-slate-650 hover:bg-slate-50/40 font-medium">
                              <td className="px-6 py-4 font-bold text-slate-900">{page.title}</td>
                              <td className="px-6 py-4 font-mono text-blue-600">{page.slug}</td>
                              <td className="px-6 py-4 text-slate-500 truncate max-w-[180px]">{page.metaTitle || '-'}</td>
                              <td className="px-6 py-4">
                                <span className={`px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-wider ${page.published ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-slate-100 text-slate-600 border border-slate-150'}`}>
                                  {page.published ? 'Published' : 'Draft'}
                                </span>
                              </td>
                              <td className="px-6 py-4 text-right space-x-2">
                                <a 
                                  href={`/info/${page.slug}`} 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg text-[10px] font-bold transition-all text-center"
                                >
                                  <ExternalLink size={12} /> Preview
                                </a>
                                <button 
                                  onClick={() => handleOpenPageEdit(page)}
                                  className="inline-flex items-center gap-1 px-2 py-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                                >
                                  <Edit2 size={13} /> Edit
                                </button>
                                <button 
                                  onClick={() => handleDeletePage(page.id)}
                                  className="inline-flex items-center gap-1 px-2 py-1.5 text-red-650 hover:bg-red-50 rounded-lg transition-all font-bold"
                                >
                                  <Trash2 size={13} /> Delete
                                </button>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : (
                /* Blogs Listing View */
                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden pb-4">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-slate-50/50 text-[10px] uppercase text-slate-500 font-mono tracking-wider border-b border-slate-100">
                          <th className="px-6 py-4">Image & Title</th>
                          <th className="px-6 py-4">Author & Cat</th>
                          <th className="px-6 py-4">Excerpt</th>
                          <th className="px-6 py-4">Status</th>
                          <th className="px-6 py-4 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50">
                        {blogPosts.length === 0 ? (
                          <tr>
                            <td colSpan={5} className="text-center py-12 text-slate-400 text-xs font-medium">
                              No blog posts defined. Click the button above to author an article.
                            </td>
                          </tr>
                        ) : (
                          blogPosts.map(post => (
                            <tr key={post.id} className="text-xs text-slate-650 hover:bg-slate-50/40 font-medium">
                              <td className="px-6 py-3 flex items-center gap-3">
                                <img 
                                  src={post.coverImage || "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=600&q=80"}
                                  alt={post.title}
                                  className="w-10 h-8 rounded-lg object-cover bg-slate-50 border border-slate-100 flex-shrink-0"
                                  referrerPolicy="no-referrer"
                                />
                                <div>
                                  <div className="font-bold text-slate-900 leading-tight mb-0.5">{post.title}</div>
                                  <div className="font-mono text-[10px] text-blue-600">/{post.slug}</div>
                                </div>
                              </td>
                              <td className="px-6 py-3">
                                <div className="text-slate-800 font-bold">{post.authorName}</div>
                                <div className="text-[10px] text-slate-450 uppercase tracking-wider font-semibold font-mono">{post.category}</div>
                              </td>
                              <td className="px-6 py-3 text-slate-500 truncate max-w-[200px] leading-relaxed">{post.excerpt}</td>
                              <td className="px-6 py-3">
                                <span className={`px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-wider ${post.published ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-slate-100 text-slate-600 border border-slate-150'}`}>
                                  {post.published ? 'Published' : 'Draft'}
                                </span>
                              </td>
                              <td className="px-6 py-3 text-right space-x-2">
                                <a 
                                  href={`/blog/${post.slug}`} 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg text-[10px] font-bold transition-all text-center"
                                >
                                  <ExternalLink size={12} /> Preview
                                </a>
                                <button 
                                  onClick={() => handleOpenPostEdit(post)}
                                  className="inline-flex items-center gap-1 px-2 py-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                                >
                                  <Edit2 size={13} /> Edit
                                </button>
                                <button 
                                  onClick={() => handleDeletePost(post.id)}
                                  className="inline-flex items-center gap-1 px-2 py-1.5 text-red-650 hover:bg-red-50 rounded-lg transition-all font-bold"
                                >
                                  <Trash2 size={13} /> Delete
                                </button>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Dynamic CMS modal editor */}
              {showCmsModal && (
                <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
                  <motion.div
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="bg-white rounded-3xl shadow-2xl w-full max-w-5xl overflow-hidden my-4 max-h-[92vh] flex flex-col"
                  >
                    {/* Header bar of modal */}
                    <div className="p-5 border-b border-gray-100 flex justify-between items-center bg-slate-50/80">
                      <div>
                        <h3 className="text-base font-black text-slate-900 tracking-tight">
                          {cmsTab === 'pages' ? (editingPage ? `Edit Page: ${editingPage.title}` : 'Build New Static Page') : (editingPost ? `Edit Article: ${editingPost.title}` : 'Draft New Blog Article')}
                        </h3>
                        <p className="text-xs text-slate-500 font-medium">Use structured Markdown inputs. All draft adjustments are instantly reflected offline</p>
                      </div>
                      <button
                        onClick={() => { setShowCmsModal(false); setEditingPage(null); setEditingPost(null); }}
                        className="p-1.5 hover:bg-slate-200 text-slate-400 hover:text-slate-700 rounded-full transition-colors outline-none"
                      >
                        <XCircle size={22} />
                      </button>
                    </div>

                    <form onSubmit={handleCmsSubmit} className="flex-1 flex flex-col overflow-hidden">
                      {/* Inner double columns scrolling */}
                      <div className="grid grid-cols-1 lg:grid-cols-12 overflow-hidden flex-1 max-h-[64vh] sm:max-h-[70vh]">
                        {/* Fields Column */}
                        <div className="lg:col-span-7 p-6 space-y-4 overflow-y-auto scroll-smooth">
                          {cmsTab === 'pages' ? (
                            /* Static Page Form fields */
                            <div className="space-y-4">
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="space-y-1">
                                  <label className="text-[10px] font-black uppercase text-slate-500 tracking-wider">Page Title</label>
                                  <input
                                    type="text"
                                    required
                                    value={pageForm.title}
                                    onChange={(e) => {
                                      const title = e.target.value;
                                      const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
                                      setPageForm({ ...pageForm, title, slug });
                                    }}
                                    placeholder="e.g. Terms of Service"
                                    className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none text-xs font-semibold text-slate-800 bg-white"
                                  />
                                </div>
                                <div className="space-y-1">
                                  <label className="text-[10px] font-black uppercase text-slate-500 tracking-wider">URL Slug</label>
                                  <input
                                    type="text"
                                    required
                                    value={pageForm.slug}
                                    onChange={(e) => setPageForm({ ...pageForm, slug: e.target.value.toLowerCase().replace(/\s+/g, '-') })}
                                    placeholder="e.g. terms-of-service"
                                    className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none text-xs font-mono text-blue-600 font-semibold bg-white"
                                  />
                                </div>
                              </div>

                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="space-y-1">
                                  <label className="text-[10px] font-black uppercase text-slate-500 tracking-wider">Meta SEO Title (Optional)</label>
                                  <input
                                    type="text"
                                    value={pageForm.metaTitle}
                                    onChange={(e) => setPageForm({ ...pageForm, metaTitle: e.target.value })}
                                    placeholder="About Us - Custom Portal Gateway"
                                    className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none text-xs font-medium text-slate-800 bg-white"
                                  />
                                </div>
                                <div className="space-y-1">
                                  <label className="text-[10px] font-black uppercase text-slate-500 tracking-wider">Meta SEO Description (Optional)</label>
                                  <input
                                    type="text"
                                    value={pageForm.metaDescription}
                                    onChange={(e) => setPageForm({ ...pageForm, metaDescription: e.target.value })}
                                    placeholder="A brief metadata layout search engines index"
                                    className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none text-xs font-medium text-slate-850 bg-white"
                                  />
                                </div>
                              </div>

                              <div className="space-y-1">
                                <div className="flex justify-between items-center">
                                  <label className="text-[10px] font-black uppercase text-slate-500 tracking-wider">Markdown Editor Body</label>
                                  <span className="text-[9px] text-orange-600 font-black tracking-wider uppercase bg-orange-50 px-2 py-0.5 rounded-md">RAW MARKDOWN</span>
                                </div>
                                <textarea
                                  required
                                  rows={12}
                                  value={pageForm.content}
                                  onChange={(e) => setPageForm({ ...pageForm, content: e.target.value })}
                                  placeholder="# Title Header&#10;Write clean markdown structures here...&#10;&#10;## Subtitle Section&#10;- Subpoint item&#10;**Bold compliance text**"
                                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none text-xs text-slate-750 font-mono leading-relaxed bg-slate-50/50 resize-y min-h-[300px]"
                                />
                              </div>
                            </div>
                          ) : (
                            /* Blog Post Form fields */
                            <div className="space-y-4">
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="space-y-1">
                                  <label className="text-[10px] font-black uppercase text-slate-500 tracking-wider">Article Title</label>
                                  <input
                                    type="text"
                                    required
                                    value={postForm.title}
                                    onChange={(e) => {
                                      const title = e.target.value;
                                      const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
                                      setPostForm({ ...postForm, title, slug });
                                    }}
                                    placeholder="Trends in commercial lots 2026"
                                    className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none text-xs font-bold text-slate-800 bg-white"
                                  />
                                </div>
                                <div className="space-y-1">
                                  <label className="text-[10px] font-black uppercase text-slate-500 tracking-wider">URL Slug</label>
                                  <input
                                    type="text"
                                    required
                                    value={postForm.slug}
                                    onChange={(e) => setPostForm({ ...postForm, slug: e.target.value.toLowerCase().replace(/\s+/g, '-') })}
                                    placeholder="commercial-peaks"
                                    className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none text-xs font-mono text-blue-600 font-semibold bg-white"
                                  />
                                </div>
                              </div>

                              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                <div className="space-y-1">
                                  <label className="text-[10px] font-black uppercase text-slate-500 tracking-wider">Author Nickname</label>
                                  <input
                                    type="text"
                                    required
                                    value={postForm.authorName}
                                    onChange={(e) => setPostForm({ ...postForm, authorName: e.target.value })}
                                    className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none text-xs font-semibold text-slate-800 bg-white"
                                  />
                                </div>
                                <div className="space-y-1">
                                  <label className="text-[10px] font-black uppercase text-slate-500 tracking-wider">Category</label>
                                  <select
                                    value={postForm.category}
                                    onChange={(e) => setPostForm({ ...postForm, category: e.target.value })}
                                    className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none text-xs font-bold text-slate-800 bg-white"
                                  >
                                    <option value="Market Analysis">Market Analysis</option>
                                    <option value="Investment Guides">Investment Guides</option>
                                    <option value="System Updates">System Updates</option>
                                    <option value="Workspace Design">Workspace Design</option>
                                  </select>
                                </div>
                                <div className="space-y-1">
                                  <label className="text-[10px] font-black uppercase text-slate-500 tracking-wider">Est. Read Time</label>
                                  <input
                                    type="text"
                                    required
                                    value={postForm.readTime}
                                    onChange={(e) => setPostForm({ ...postForm, readTime: e.target.value })}
                                    className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none text-xs font-semibold text-slate-800 bg-white"
                                  />
                                </div>
                              </div>

                              <div className="grid grid-cols-1 sm:grid-cols-1 gap-4">
                                <div className="space-y-1">
                                  <label className="text-[10px] font-black uppercase text-slate-500 tracking-wider">Cover Image URL</label>
                                  <input
                                    type="url"
                                    value={postForm.coverImage}
                                    onChange={(e) => setPostForm({ ...postForm, coverImage: e.target.value })}
                                    placeholder="https://images.unsplash.com/..."
                                    className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none text-xs font-medium text-slate-850 bg-white"
                                  />
                                </div>
                              </div>

                              <div className="space-y-1">
                                <label className="text-[10px] font-black uppercase text-slate-500 tracking-wider">Article Excerpt (Short description)</label>
                                <textarea
                                  required
                                  rows={2}
                                  value={postForm.excerpt}
                                  onChange={(e) => setPostForm({ ...postForm, excerpt: e.target.value })}
                                  placeholder="An exhaustive summary about structural trends, price spikes, or compliance updates..."
                                  className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none text-xs text-slate-750 font-medium bg-white resize-none"
                                />
                              </div>

                              <div className="space-y-1">
                                <div className="flex justify-between items-center">
                                  <label className="text-[10px] font-black uppercase text-slate-500 tracking-wider">Markdown Editor Body</label>
                                  <span className="text-[9px] text-orange-600 font-black tracking-wider uppercase bg-orange-50 px-2 py-0.5 rounded-md">RAW MARKDOWN</span>
                                </div>
                                <textarea
                                  required
                                  rows={10}
                                  value={postForm.content}
                                  onChange={(e) => setPostForm({ ...postForm, content: e.target.value })}
                                  placeholder="## Modern peaks inside workspace rings&#10;&#10;Start writing your analysis in Markdown syntax...&#10;&#10;> 'Efficiency is the ultimate metric.'"
                                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none text-xs text-slate-700 font-mono leading-relaxed bg-slate-50/50 resize-y min-h-[250px]"
                                />
                              </div>
                            </div>
                          )}

                          {/* Publishing State Switch */}
                          <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-150/40">
                            <div>
                              <div className="text-xs font-extrabold text-slate-900">Make status Publically Available</div>
                              <div className="text-[10px] text-slate-500">Draft blocks are exclusively viewable in this Admin dashboard</div>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                              <input
                                type="checkbox"
                                checked={cmsTab === 'pages' ? pageForm.published : postForm.published}
                                onChange={(e) => {
                                  const checked = e.target.checked;
                                  if (cmsTab === 'pages') {
                                    setPageForm({ ...pageForm, published: checked });
                                  } else {
                                    setPostForm({ ...postForm, published: checked });
                                  }
                                }}
                                className="sr-only peer"
                              />
                              <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-350 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-orange-600"></div>
                            </label>
                          </div>
                        </div>

                        {/* Guide & live layout preview Column (5 cols) */}
                        <div className="lg:col-span-5 p-6 border-t lg:border-t-0 lg:border-l border-slate-100 bg-slate-50/70 overflow-y-auto space-y-6">
                          {/* Rich Formatting Cheat Card */}
                          <div className="bg-gradient-to-br from-indigo-900 to-slate-900 text-purple-200 p-5 rounded-2xl shadow-md space-y-3">
                            <h4 className="text-xs font-black uppercase text-white tracking-wider flex items-center gap-1.5">
                              <Settings size={14} className="text-orange-400" />
                              Markdown Syntax Guide
                            </h4>
                            <div className="text-[11px] space-y-2 leading-relaxed">
                              <div><code className="text-yellow-300 font-bold font-mono px-1"># Title</code> <span className="opacity-80">Primary header title layout.</span></div>
                              <div><code className="text-yellow-300 font-bold font-mono px-1">## Subtitle</code> <span className="opacity-80">Secondary section dividers.</span></div>
                              <div><code className="text-yellow-300 font-bold font-mono px-1">**Bold**</code> <span className="opacity-80">To highlight critical terms.</span></div>
                              <div><code className="text-yellow-300 font-bold font-mono px-1">- Item</code> <span className="opacity-80">Add clean dotted unordered lists.</span></div>
                              <div><code className="text-yellow-300 font-bold font-mono px-1">&gt; Quote</code> <span className="opacity-80">Styled blockquotes for editorial statements.</span></div>
                            </div>
                          </div>

                          {/* Live Parser Preview */}
                          <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase text-slate-500 tracking-wider">Parsed Live Preview</label>
                            <div className="bg-white p-5 rounded-2xl border border-slate-150 shadow-sm max-h-[300px] overflow-y-auto no-scrollbar prose prose-slate">
                              <h3 className="text-sm font-bold text-slate-900 leading-tight mb-2 border-b border-slate-100 pb-1.5 opacity-40 uppercase tracking-widest font-mono">Live Visual Render</h3>
                              <div className="markdown-body text-xs leading-relaxed space-y-2">
                                <h1 className="text-xl font-bold text-slate-900">{cmsTab === 'pages' ? pageForm.title || 'Untitled Static Page' : postForm.title || 'Untitled Blog Post'}</h1>
                                {cmsTab === 'blog' && (
                                  <div className="text-[10px] text-slate-400 font-mono mb-2">Author: {postForm.authorName || 'Anonymous'} | Cat: {postForm.category}</div>
                                )}
                                <div className="text-xs text-slate-700 font-medium">
                                  {cmsTab === 'pages' ? (
                                    pageForm.content ? (
                                      <div className="text-slate-650 opacity-90 prose text-xs">
                                        <div className="border-l-2 border-slate-200 pl-2 text-slate-500 font-mono text-[10px] my-1">Parsed markdown display below:</div>
                                        <div className="text-xs text-slate-650 leading-relaxed font-normal whitespace-pre-line border border-slate-100 p-3 rounded-lg bg-slate-50">
                                          {cmsTab === 'pages' ? pageForm.content.slice(0, 500) : postForm.content.slice(0, 500)}
                                          {(cmsTab === 'pages' ? pageForm.content.length : postForm.content.length) > 500 && ' ... [truncated inside editor]'}
                                        </div>
                                      </div>
                                    ) : 'No raw markdown contents logged ...'
                                  ) : (
                                    postForm.content ? (
                                      <div className="text-slate-650 opacity-90 prose text-xs">
                                        <div className="border-l-2 border-slate-200 pl-2 text-slate-500 font-mono text-[10px] my-1">Parsed markdown display below:</div>
                                        <div className="text-xs text-slate-650 leading-relaxed font-normal whitespace-pre-line border border-slate-100 p-3 rounded-lg bg-slate-50">
                                          {postForm.content.slice(0, 500)}
                                          {postForm.content.length > 500 && ' ... [truncated inside editor]'}
                                        </div>
                                      </div>
                                    ) : 'No raw markdown contents logged ...'
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Footer Actions bar */}
                      <div className="p-5 border-t border-slate-100 bg-slate-50 flex justify-end gap-3 rounded-b-3xl">
                        <button
                          type="button"
                          onClick={() => { setShowCmsModal(false); setEditingPage(null); setEditingPost(null); }}
                          className="px-5 py-2.5 bg-white border border-slate-200 text-slate-600 rounded-xl font-bold text-xs hover:bg-slate-50 transition-colors"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          disabled={cmsLoading}
                          className="px-5 py-2.5 bg-orange-600 hover:bg-orange-700 disabled:bg-orange-400 text-white rounded-xl font-bold text-xs transition-colors shadow-lg shadow-orange-500/15"
                        >
                          {cmsLoading ? 'Saving changes...' : 'Save Draft Settings'}
                        </button>
                      </div>
                    </form>
                  </motion.div>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Ad Modal */}
      {showAdModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
          <motion.div 
            initial={{ opacity: 0, scale: 0.98, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl overflow-hidden my-4 max-h-[92vh] flex flex-col"
          >
            {/* Header */}
            <div className="p-5 border-b border-gray-100 flex justify-between items-center bg-slate-50/80">
              <div>
                <h3 className="text-lg font-black text-slate-900 tracking-tight">
                  {editingAd ? 'Edit Sponsored Campaign' : 'Design Paid Advertisement'}
                </h3>
                <p className="text-xs text-slate-500 font-medium">Configure live, tracking-enabled ad placements on user home corridors</p>
              </div>
              <button 
                type="button"
                onClick={() => setShowAdModal(false)} 
                className="p-1.5 hover:bg-slate-250 text-slate-400 hover:text-slate-700 rounded-full transition-colors focus:ring-2 focus:ring-orange-500 outline-none"
              >
                <XCircle size={22} />
              </button>
            </div>

            {/* Split Content panel */}
            <div className="grid grid-cols-1 md:grid-cols-12 overflow-hidden flex-1">
              
              {/* Left Form (7 cols) */}
              <form onSubmit={handleAdSubmit} className="md:col-span-7 p-6 space-y-4 overflow-y-auto max-h-[64vh] sm:max-h-[70vh] no-scrollbar">
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[11px] font-black uppercase text-slate-500 tracking-wider">Campaign Title</label>
                    <input 
                      name="title" 
                      value={previewTitle}
                      onChange={(e) => setPreviewTitle(e.target.value)}
                      required
                      placeholder="e.g. 5% Mortgage Rate Deal"
                      className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none text-xs text-slate-800 font-medium" 
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[11px] font-black uppercase text-slate-500 tracking-wider">Visual Type / Height</label>
                    <select 
                      name="type" 
                      value={previewType}
                      onChange={(e) => setPreviewType(e.target.value as any)}
                      className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none text-xs text-slate-850 font-bold bg-white"
                    >
                      <option value="card">Standard Card (Category corridor)</option>
                      <option value="tall">Tall Card (Home grid - High Priority)</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[11px] font-black uppercase text-slate-500 tracking-wider">CTA Button text</label>
                    <input 
                      name="cta" 
                      value={previewCta}
                      onChange={(e) => setPreviewCta(e.target.value)}
                      placeholder="e.g. Check Deals, Apply Now"
                      className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none text-xs text-slate-800 font-medium" 
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[11px] font-black uppercase text-slate-500 tracking-wider">Landing Page URL (Hyperlink)</label>
                    <input 
                      name="link" 
                      defaultValue={editingAd?.link}
                      required
                      placeholder="e.g. https://caliberdesk.com/lp"
                      className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none text-xs font-mono text-blue-600 font-medium" 
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-black uppercase text-slate-500 tracking-wider">Ad Description / Pitch Copy</label>
                  <textarea 
                    name="description" 
                    value={previewDesc}
                    onChange={(e) => setPreviewDesc(e.target.value)}
                    required
                    rows={2}
                    placeholder="Provide a highly clickable marketing slogan describing the sponsor asset..."
                    className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none text-xs text-slate-700 font-medium leading-relaxed resize-none" 
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-black uppercase text-slate-500 tracking-wider">Gradient Accent Style</label>
                  <input type="hidden" name="color" value={previewColor} />
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {[
                      { name: 'Sunset Red', gradient: 'from-orange-600 to-fuchsia-600' },
                      { name: 'Ocean Blue', gradient: 'from-blue-600 to-indigo-600' },
                      { name: 'Emerald', gradient: 'from-emerald-600 to-teal-600' },
                      { name: 'Golden Amber', gradient: 'from-orange-600 to-amber-600' },
                      { name: 'Obsidian Black', gradient: 'from-slate-700 to-slate-900' },
                      { name: 'Cosmic Violet', gradient: 'from-purple-600 to-pink-600' },
                    ].map((preset) => (
                      <button
                        type="button"
                        key={preset.name}
                        onClick={() => setPreviewColor(preset.gradient)}
                        className={`px-3 py-1.5 rounded-full text-[10px] font-black text-white bg-gradient-to-r ${preset.gradient} transition-transform active:scale-95 border ${
                          previewColor === preset.gradient ? 'border-orange-500 scale-105 shadow-md ring-1 ring-orange-500' : 'border-transparent opacity-80 hover:opacity-100'
                        }`}
                      >
                        {preset.name}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="p-3 bg-slate-50 rounded-xl space-y-3 border border-slate-200/60 shadow-inner">
                  <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest block">Resource Image</span>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-center">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-600 block">Mock Upload</label>
                      <input 
                        type="file"
                        name="image_file" 
                        accept="image/*"
                        className="w-full text-[10px] file:mr-2 file:py-1 file:px-2.5 file:rounded-lg file:border-0 file:text-[10px] file:font-black file:bg-orange-50 file:text-orange-600 hover:file:bg-orange-100 text-slate-500 outline-none" 
                      />
                    </div>
                    
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-600 block">External URL</label>
                      <input 
                        type="url"
                        name="image_url" 
                        value={previewImage}
                        onChange={(e) => setPreviewImage(e.target.value)}
                        placeholder="https://... image link"
                        className="w-full px-2 py-1 border border-slate-200 rounded-lg text-[10px] font-medium text-slate-700 outline-none focus:ring-1 focus:ring-orange-500" 
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-1">
                    <label className="text-[11px] font-black uppercase text-slate-500 tracking-wider">Priority (0-100)</label>
                    <input 
                      name="priority" 
                      type="number"
                      defaultValue={editingAd?.priority || 0}
                      className="w-full px-3 py-1.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none text-xs text-slate-800 font-bold" 
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[11px] font-black uppercase text-slate-500 tracking-wider">Country ISO Filter</label>
                    <input 
                      name="countryCode" 
                      placeholder="e.g. GH, NG, US"
                      defaultValue={editingAd?.countryCode}
                      className="w-full px-3 py-1.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none text-xs text-slate-800 font-black uppercase placeholder:normal-case" 
                    />
                  </div>
                  <div className="flex items-center gap-2 pt-5">
                    <input 
                      type="checkbox" 
                      name="active" 
                      id="active"
                      defaultChecked={editingAd ? editingAd.active : true}
                      className="w-4 h-4 text-orange-600 rounded focus:ring-orange-500 border-slate-300" 
                    />
                    <label htmlFor="active" className="text-xs font-black text-slate-700 cursor-pointer select-none">Active Run</label>
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
                  <button 
                    type="button"
                    onClick={() => setShowAdModal(false)}
                    className="px-4 py-2 text-slate-500 font-black hover:bg-slate-50 rounded-xl text-xs active:scale-95 transition-transform"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit"
                    disabled={isUploading}
                    className="px-6 py-2 bg-orange-600 text-white font-black rounded-xl hover:bg-orange-700 shadow-md enabled:active:scale-95 disabled:opacity-50 text-xs flex items-center gap-1.5 transition-transform"
                  >
                    {isUploading ? (
                      <>
                        <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        Compressing...
                      </>
                    ) : (
                      editingAd ? 'Save Modifications' : 'Place Live Campaign'
                    )}
                  </button>
                </div>
              </form>

              {/* Right Preview (5 cols) */}
              <div className="md:col-span-5 p-6 bg-slate-50 border-t md:border-t-0 md:border-l border-slate-100 flex flex-col justify-start items-center">
                <div className="text-center w-full mb-4">
                  <span className="text-[10px] font-black text-slate-400 block uppercase tracking-widest">Feed corridor Live Preview</span>
                  <p className="text-[10px] text-slate-500 font-medium">Real-time mock viewport on the portal main hallway</p>
                </div>
                
                <div className="w-full max-w-[260px] aspect-[4/5] sm:aspect-[3/4] flex justify-center items-center h-full relative p-2 shadow-inner border border-dashed border-slate-200 rounded-2xl bg-white">
                  <div className="w-full h-full">
                    <AdCard
                      type={previewType}
                      title={previewTitle || 'Custom Sponsored Campaign'}
                      description={previewDesc || 'Configure descriptions on the designer sidebar. Perfect targeting drives conversion.'}
                      cta={previewCta || 'Learn More'}
                      image={previewImage || 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=600&q=80'}
                      color={previewColor}
                    />
                  </div>
                </div>
              </div>

            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
