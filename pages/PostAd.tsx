import React, { useState, useRef, useEffect } from 'react';
import { CATEGORIES } from '../constants';
import Icon from '../components/Icon';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import LocationSelect from '../components/LocationSelect';
import { generateListingTitle } from '../utils/listingUtils';
import { sanitizeString, validateListingData, checkRateLimit } from '../services/security';
import { getListingById, updateListing, createListing, uploadImage } from '../services/supabaseService';
import { useAuth } from '../context/AuthContext';
import { useLocation } from '../context/LocationContext';
import { getSymbolFromCode } from '../services/location';
import { generateAdDescription, suggestPriceRange, enhanceImage } from '../services/ai';

const PostAd: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const editId = searchParams.get('edit');
  const { user } = useAuth();
  const { location } = useLocation();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGeneratingDesc, setIsGeneratingDesc] = useState(false);
  const [isSuggestingPrice, setIsSuggestingPrice] = useState(false);
  const [enhancingImageIndex, setEnhancingImageIndex] = useState<number | null>(null);
  const [suggestedPriceRange, setSuggestedPriceRange] = useState<{min: number, max: number} | null>(null);

  const [step, setStep] = useState(1);
  
  // Redirect buyers to create a vendor account
  useEffect(() => {
    if (user && user.role !== 'Agent' && user.role !== 'Admin') {
      navigate('/create-vendor', { replace: true });
    }
  }, [user, navigate]);

  const [formData, setFormData] = useState({
    categoryId: '',
    categoryName: '',
    title: '',
    price: '',
    currency: location.currency || 'USD',
    type: 'Rent',
    propertyType: 'Apartment',
    bedrooms: '',
    bathrooms: '',
    sqft: '',
    furnished: false,
    parking: false,
    petsAllowed: false,
    location: '',
    description: '',
    yearBuilt: '',
    virtualTourUrl: '',
    isPremium: false
  });
  
  // Image handling
  const [images, setImages] = useState<string[]>([]); // URLs
  const [imageFiles, setImageFiles] = useState<File[]>([]); // Local files for upload
  const fileInputRef = useRef<HTMLInputElement>(null);



  // Load listing if editing
  useEffect(() => {
    if (editId) {
      const fetchListing = async () => {
        const listing = await getListingById(editId);
        if (listing) {
          // Check if user is owner
          if (user && listing.sellerId !== user.id) {
            navigate('/');
            return;
          }

          setFormData({
            categoryId: listing.categoryId,
            categoryName: CATEGORIES.find(c => c.id === listing.categoryId)?.name || '',
            title: listing.title,
            price: listing.price.toString(),
            currency: listing.currency || location.currency || 'USD',
            type: listing.type,
            propertyType: listing.propertyType,
            bedrooms: listing.bedrooms?.toString() || '',
            bathrooms: listing.bathrooms?.toString() || '',
            sqft: listing.sqft?.toString() || '',
            furnished: listing.furnished || false,
            parking: listing.parking || false,
            petsAllowed: listing.petsAllowed || false,
            location: listing.location,
            description: listing.description || '',
            yearBuilt: listing.yearBuilt?.toString() || '',
            virtualTourUrl: listing.virtualTourUrl || '',
            isPremium: listing.isPremium || false
          });
          setImages(listing.images || [listing.imageUrl]);
          setStep(2); // Skip category selection when editing
        }
      };
      fetchListing();
    }
  }, [editId, user, navigate]);

  // Auto-generate title when relevant fields change
  useEffect(() => {
    const newTitle = generateListingTitle({
      bedrooms: formData.bedrooms,
      propertyType: formData.propertyType
    });
    setFormData(prev => ({ ...prev, title: newTitle }));
  }, [formData.bedrooms, formData.propertyType, formData.location]);

  const handleCategorySelect = (id: string, name: string) => {
    let defaultPropType = 'Apartment';
    if (id === 'land') {
      defaultPropType = 'Land';
    } else if (id === 'offices') {
      defaultPropType = 'Office';
    } else if (id === 'houses') {
      defaultPropType = 'House';
    } else if (id === 'warehouses') {
      defaultPropType = 'Warehouse';
    }
    setFormData(prev => ({ 
      ...prev, 
      categoryId: id, 
      categoryName: name,
      propertyType: defaultPropType
    }));
    setStep(2);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleLocationChange = (value: string) => {
    setFormData(prev => ({ ...prev, location: sanitizeString(value) }));
  };

  const handleGenerateDescription = async () => {
    setIsGeneratingDesc(true);
    try {
      const desc = await generateAdDescription({
        propertyType: formData.propertyType,
        type: formData.type,
        bedrooms: formData.bedrooms,
        bathrooms: formData.bathrooms,
        sqft: formData.sqft,
        yearBuilt: formData.yearBuilt,
        location: formData.location,
        furnished: formData.furnished,
        parking: formData.parking,
        petsAllowed: formData.petsAllowed
      });
      if (desc) {
        setFormData(prev => ({ ...prev, description: desc }));
      }
    } finally {
      setIsGeneratingDesc(false);
    }
  };

  const handleSuggestPrice = async () => {
    setIsSuggestingPrice(true);
    try {
      const range = await suggestPriceRange({
        propertyType: formData.propertyType,
        type: formData.type,
        bedrooms: formData.bedrooms,
        bathrooms: formData.bathrooms,
        sqft: formData.sqft,
        location: formData.location,
        currency: formData.currency
      });
      if (range) {
        setSuggestedPriceRange(range);
        setFormData(prev => ({ ...prev, price: Math.round((range.min + range.max) / 2).toString() }));
      }
    } finally {
      setIsSuggestingPrice(false);
    }
  };

  const handleEnhanceImage = async (index: number, e: React.MouseEvent) => {
    e.stopPropagation();
    const imageToEnhance = images[index];
    if (!imageToEnhance.startsWith('data:')) {
      alert("Can only enhance newly uploaded images.");
      return;
    }

    setEnhancingImageIndex(index);
    try {
      const mimeType = imageToEnhance.split(';')[0].split(':')[1];
      const enhanced = await enhanceImage(imageToEnhance, mimeType);
      if (enhanced) {
        setImages(prev => {
          const newImages = [...prev];
          newImages[index] = enhanced;
          return newImages;
        });
      }
    } finally {
      setEnhancingImageIndex(null);
    }
  };

  const [uploadProgress, setUploadProgress] = useState<{current: number, total: number, percent: number} | null>(null);

  const handlePublish = async () => {
    if (!user) return;
    
    if (!checkRateLimit('post_listing', 5, 3600000)) {
      alert("You have reached the limit of 5 listings per hour. Please try again later.");
      return;
    }

    const listingDataToValidate = {
      ...formData,
      price: parseFloat(formData.price),
      images: images
    };

    const validation = validateListingData(listingDataToValidate);
    if (!validation.valid) {
      alert("Please fix the following errors:\n" + validation.errors.join('\n'));
      return;
    }

    setIsSubmitting(true);
    setUploadProgress(null);

    try {
      // 1. Upload new images if any
      const uploadedUrls: string[] = [...images.filter(img => img.startsWith('http'))];
      
      let currentFile = 1;
      const totalFiles = imageFiles.length;
      
      for (const file of imageFiles) {
        setUploadProgress({ current: currentFile, total: totalFiles, percent: 0 });
        const url = await uploadImage(file, `listings/${user.id}/${Date.now()}_${file.name}`, (percent) => {
            setUploadProgress({ current: currentFile, total: totalFiles, percent });
        });
        uploadedUrls.push(url);
        currentFile++;
      }
      setUploadProgress(null);

      const listingData = {
        ...formData,
        price: parseFloat(formData.price) || 0,
        currency: formData.currency,
        bedrooms: parseInt(formData.bedrooms) || 0,
        bathrooms: parseInt(formData.bathrooms) || 0,
        sqft: parseInt(formData.sqft) || 0,
        yearBuilt: parseInt(formData.yearBuilt) || new Date().getFullYear(),
        images: uploadedUrls,
        imageUrl: uploadedUrls[0] || '',
        sellerId: user.id,
        sellerName: user.name,
        sellerAvatar: user.avatar,
        status: 'Active',
        postedAt: new Date().toISOString().split('T')[0],
        views: 0
      };

      if (editId) {
        await updateListing(editId, listingData as any);
      } else {
        await createListing(listingData as any);
      }
      
      navigate('/profile/me');
    } catch (error) {
      console.error("Error publishing ad:", error);
      alert("Failed to publish ad. Please try again.");
    } finally {
      setIsSubmitting(false);
      setUploadProgress(null);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const files = Array.from(e.target.files) as File[];
      
      const MAX_SIZE_MB = 5;
      const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

      const validFiles: File[] = [];

      for (const file of files) {
        if (!ALLOWED_TYPES.includes(file.type)) {
          alert(`${file.name} is not a supported format. Use JPG, PNG, or WebP.`);
          continue;
        }
        if (file.size > MAX_SIZE_MB * 1024 * 1024) {
          alert(`${file.name} exceeds ${MAX_SIZE_MB}MB. Please compress the image.`);
          continue;
        }
        validFiles.push(file);
      }

      if (validFiles.length > 0) {
          setImageFiles(prev => [...prev, ...validFiles]);
          
          validFiles.forEach((file: File) => {
            const reader = new FileReader();
            reader.onloadend = () => {
                if (reader.result) {
                    setImages(prev => [...prev, reader.result as string]);
                }
            };
            reader.readAsDataURL(file);
          });
      }
    }
  };

  const removeImage = (indexToRemove: number) => {
    setImages(prev => prev.filter((_, index) => index !== indexToRemove));
    // Also need to remove from imageFiles if it was a new upload
    // This is a bit tricky since images contains both URLs and base64 previews
    // For simplicity, we'll just filter both by index if we assume they match
    // But they don't necessarily match if some are existing URLs.
    // Let's refine this:
    const imageToRemove = images[indexToRemove];
    if (imageToRemove.startsWith('data:')) {
        // It's a new file, find its index in imageFiles
        // This is still not perfect but better
        setImageFiles(prev => prev.filter((_, i) => i !== (indexToRemove - images.filter(img => img.startsWith('http')).length)));
    }
  };

  return (
    <div className="container mx-auto px-4 pt-6 pb-12 max-w-4xl min-h-screen">
      <div className="text-center mb-10">
        <h1 className="text-4xl font-bold text-slate-900 mb-3">List your property.</h1>
        <p className="text-slate-500 text-lg">Find the perfect tenant or buyer with our professional listing tools.</p>
      </div>

      <div className="glass-card rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-100 overflow-hidden">
        {/* Progress Bar */}
        <div className="bg-slate-50/50 border-b border-slate-100 p-6 flex justify-between items-center px-4 md:px-12">
           <div className={`flex items-center gap-2 ${step >= 1 ? 'text-brand-600 font-semibold' : 'text-slate-400'}`}>
              <span className={`w-8 h-8 rounded-full border-2 flex items-center justify-center text-sm ${step >= 1 ? 'border-brand-600 bg-brand-50' : 'border-current'}`}>1</span>
              <span className="hidden sm:inline">Category</span>
           </div>
           <div className="h-[2px] bg-slate-200 flex-1 mx-4">
             <div className="h-full bg-brand-500 transition-all duration-300" style={{ width: step >= 2 ? '50%' : step >= 3 ? '100%' : '0%' }}></div>
           </div>
           <div className={`flex items-center gap-2 ${step >= 2 ? 'text-brand-600 font-semibold' : 'text-slate-400'}`}>
              <span className={`w-8 h-8 rounded-full border-2 flex items-center justify-center text-sm ${step >= 2 ? 'border-brand-600 bg-brand-50' : 'border-current'}`}>2</span>
              <span className="hidden sm:inline">Details</span>
           </div>
           <div className="h-[2px] bg-slate-200 flex-1 mx-4">
             <div className="h-full bg-brand-500 transition-all duration-300" style={{ width: step >= 3 ? '100%' : '0%' }}></div>
           </div>
           <div className={`flex items-center gap-2 ${step >= 3 ? 'text-brand-600 font-semibold' : 'text-slate-400'}`}>
              <span className={`w-8 h-8 rounded-full border-2 flex items-center justify-center text-sm ${step >= 3 ? 'border-brand-600 bg-brand-50' : 'border-current'}`}>3</span>
              <span className="hidden sm:inline">Photos</span>
           </div>
        </div>

        <div className="p-6 md:p-10">
          {step === 1 && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 animate-fade-in">
              {CATEGORIES.map(cat => (
                <button
                  key={cat.id}
                  onClick={() => handleCategorySelect(cat.id, cat.name)}
                  className="group p-6 border border-slate-200 rounded-2xl hover:border-brand-500 hover:bg-brand-50/50 hover:shadow-lg transition-all flex flex-col items-center gap-4 text-center bg-white/60"
                >
                  <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${cat.color} bg-opacity-20 group-hover:scale-110 transition-transform`}>
                    <Icon name={cat.iconName} size={32} variant="3d" className="drop-shadow-sm" />
                  </div>
                  <span className="text-sm font-semibold text-slate-700 group-hover:text-brand-700">{cat.name}</span>
                </button>
              ))}
            </div>
          )}

          {step === 2 && (
            <div className="space-y-8 max-w-2xl mx-auto animate-fade-in">
               <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">Listing Type</label>
                    <div className="flex gap-2">
                       {['Rent', 'Sale'].map(type => (
                          <button
                            key={type}
                            onClick={() => setFormData(prev => ({ ...prev, type }))}
                            className={`flex-1 py-3 rounded-xl font-bold border-2 transition-all ${formData.type === type ? 'bg-brand-500 text-white border-brand-500' : 'bg-white text-slate-500 border-slate-200 hover:border-brand-200'}`}
                          >
                             {type}
                          </button>
                       ))}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">Property Type</label>
                    <select 
                      name="propertyType"
                      value={formData.propertyType}
                      onChange={handleChange}
                      className="w-full border border-slate-300 rounded-xl p-4 focus:ring-2 focus:ring-brand-500 focus:border-transparent outline-none transition-all shadow-sm bg-white/60"
                    >
                      {formData.categoryId === 'houses' && (
                        <>
                          <option value="Apartment">Apartment</option>
                          <option value="House">House</option>
                          <option value="Condo">Condo</option>
                          <option value="Villa">Villa</option>
                        </>
                      )}
                      {formData.categoryId === 'land' && (
                        <>
                          <option value="Land">Land</option>
                        </>
                      )}
                      {formData.categoryId === 'warehouses' && (
                        <>
                          <option value="Warehouse">Warehouse</option>
                          <option value="Storage">Storage</option>
                        </>
                      )}
                      {formData.categoryId === 'offices' && (
                        <>
                          <option value="Office">Office</option>
                          <option value="Commercial">Commercial</option>
                          <option value="Retail">Retail</option>
                          <option value="Warehouse">Warehouse</option>
                        </>
                      )}
                      {!['houses', 'land', 'offices', 'warehouses'].includes(formData.categoryId) && (
                        <>
                          <option value="Apartment">Apartment</option>
                          <option value="House">House</option>
                          <option value="Condo">Condo</option>
                          <option value="Villa">Villa</option>
                          <option value="Office">Office</option>
                          <option value="Land">Land</option>
                          <option value="Commercial">Commercial</option>
                          <option value="Retail">Retail</option>
                          <option value="Warehouse">Warehouse</option>
                        </>
                      )}
                    </select>
                  </div>
               </div>

               <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">Property Title (Auto-generated)</label>
                  <input 
                    type="text" 
                    name="title"
                    value={formData.title}
                    readOnly
                    className="w-full border border-slate-200 rounded-xl p-4 focus:ring-2 focus:ring-brand-500 focus:border-transparent outline-none transition-all shadow-sm bg-slate-50 text-slate-500 cursor-not-allowed" 
                    placeholder="Title will be generated automatically" 
                  />
               </div>
               
               <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <div className="flex justify-between items-end mb-2">
                      <label className="block text-sm font-bold text-slate-700">Price {formData.type === 'Rent' ? '(Monthly)' : ''}</label>
                      <button
                        type="button"
                        onClick={handleSuggestPrice}
                        disabled={isSuggestingPrice || !formData.location || !formData.propertyType}
                        className="text-xs font-bold text-brand-600 hover:text-brand-700 flex items-center gap-1 disabled:opacity-50"
                      >
                        {isSuggestingPrice ? <Icon name="loader" size={14} className="animate-spin" /> : <Icon name="sparkles" size={14} />}
                        Suggest Price
                      </button>
                    </div>
                    <div className="flex gap-2">
                      <select
                        name="currency"
                        value={formData.currency}
                        onChange={handleChange}
                        className="border border-slate-300 rounded-xl p-4 focus:ring-2 focus:ring-brand-500 focus:border-transparent outline-none transition-all shadow-sm bg-white/60 w-24"
                      >
                        {Array.from(new Set(['USD', 'GHS', 'NGN', 'KES', 'ZAR', 'EGP', 'MAD', 'ETB', 'TZS', 'UGX', 'RWF', 'XOF', 'XAF', 'ZMW', 'EUR', 'GBP', location.currency || 'USD'])).map(c => (
                          <option key={c} value={c}>{c}</option>
                        ))}
                      </select>
                      <div className="relative flex-1">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500">
                          {getSymbolFromCode(formData.currency)}
                        </span>
                        <input 
                          type="number" 
                          name="price"
                          value={formData.price}
                          onChange={handleChange}
                          className="w-full border border-slate-300 rounded-xl p-4 pl-8 focus:ring-2 focus:ring-brand-500 focus:border-transparent outline-none transition-all shadow-sm bg-white/60" 
                          placeholder="0.00" 
                        />
                      </div>
                    </div>
                    {suggestedPriceRange && (
                      <p className="text-xs text-brand-600 mt-2 font-medium">
                        Suggested range: {getSymbolFromCode(formData.currency)}{suggestedPriceRange.min.toLocaleString()} - {getSymbolFromCode(formData.currency)}{suggestedPriceRange.max.toLocaleString()}
                      </p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">Bedrooms</label>
                    <input 
                      type="number" 
                      name="bedrooms"
                      value={formData.bedrooms}
                      onChange={handleChange}
                      className="w-full border border-slate-300 rounded-xl p-4 focus:ring-2 focus:ring-brand-500 focus:border-transparent outline-none transition-all shadow-sm bg-white/60" 
                      placeholder="0" 
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">Bathrooms</label>
                    <input 
                      type="number" 
                      name="bathrooms"
                      value={formData.bathrooms}
                      onChange={handleChange}
                      className="w-full border border-slate-300 rounded-xl p-4 focus:ring-2 focus:ring-brand-500 focus:border-transparent outline-none transition-all shadow-sm bg-white/60" 
                      placeholder="0" 
                    />
                  </div>
               </div>

               <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">Square Footage (Sq Ft)</label>
                    <input 
                      type="number" 
                      name="sqft"
                      value={formData.sqft}
                      onChange={handleChange}
                      className="w-full border border-slate-300 rounded-xl p-4 focus:ring-2 focus:ring-brand-500 focus:border-transparent outline-none transition-all shadow-sm bg-white/60" 
                      placeholder="e.g. 1200" 
                    />
                  </div>
                  <div className="flex flex-col gap-4 pt-2">
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => setFormData(prev => ({ ...prev, furnished: !prev.furnished }))}
                        className={`w-12 h-6 rounded-full transition-colors relative ${formData.furnished ? 'bg-brand-500' : 'bg-slate-200'}`}
                      >
                        <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${formData.furnished ? 'left-7' : 'left-1'}`}></div>
                      </button>
                      <span className="text-sm font-bold text-slate-700">Furnished</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => setFormData(prev => ({ ...prev, parking: !prev.parking }))}
                        className={`w-12 h-6 rounded-full transition-colors relative ${formData.parking ? 'bg-brand-500' : 'bg-slate-200'}`}
                      >
                        <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${formData.parking ? 'left-7' : 'left-1'}`}></div>
                      </button>
                      <span className="text-sm font-bold text-slate-700">Parking Available</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => setFormData(prev => ({ ...prev, petsAllowed: !prev.petsAllowed }))}
                        className={`w-12 h-6 rounded-full transition-colors relative ${formData.petsAllowed ? 'bg-brand-500' : 'bg-slate-200'}`}
                      >
                        <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${formData.petsAllowed ? 'left-7' : 'left-1'}`}></div>
                      </button>
                      <span className="text-sm font-bold text-slate-700">Pets Allowed</span>
                    </div>
                  </div>
               </div>

               <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">Year Built</label>
                    <input 
                      type="number" 
                      name="yearBuilt"
                      value={formData.yearBuilt}
                      onChange={handleChange}
                      className="w-full border border-slate-300 rounded-xl p-4 focus:ring-2 focus:ring-brand-500 focus:border-transparent outline-none transition-all shadow-sm bg-white/60" 
                      placeholder="e.g. 2020" 
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">Virtual Tour URL (Optional)</label>
                    <input 
                      type="url" 
                      name="virtualTourUrl"
                      value={formData.virtualTourUrl}
                      onChange={handleChange}
                      className="w-full border border-slate-300 rounded-xl p-4 focus:ring-2 focus:ring-brand-500 focus:border-transparent outline-none transition-all shadow-sm bg-white/60" 
                      placeholder="https://my.matterport.com/..." 
                    />
                  </div>
                </div>

                <div className="p-4 bg-brand-50 rounded-2xl border border-brand-100">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-bold text-brand-900">Premium Listing</h4>
                      <p className="text-xs text-brand-600">Premium listings stay live for 91 days and get top ranking for the first 10 days.</p>
                    </div>
                    <button
                      onClick={() => setFormData(prev => ({ ...prev, isPremium: !prev.isPremium }))}
                      className={`w-14 h-7 rounded-full transition-colors relative ${formData.isPremium ? 'bg-brand-600' : 'bg-slate-300'}`}
                    >
                      <div className={`absolute top-1 w-5 h-5 rounded-full bg-white transition-all ${formData.isPremium ? 'left-8' : 'left-1'}`}></div>
                    </button>
                  </div>
                </div>

               <div>
                 <label className="block text-sm font-bold text-slate-700 mb-2">Location</label>
                 <LocationSelect 
                    value={formData.location}
                    onChange={handleLocationChange}
                    placeholder="Region, City or Town..."
                 />
               </div>

               <div className="relative">
                  <div className="flex justify-between items-end mb-2">
                    <label className="block text-sm font-bold text-slate-700">Description</label>
                    <button
                      type="button"
                      onClick={handleGenerateDescription}
                      disabled={isGeneratingDesc || !formData.location || !formData.propertyType}
                      className="text-xs font-bold text-brand-600 hover:text-brand-700 flex items-center gap-1 disabled:opacity-50"
                    >
                      {isGeneratingDesc ? <Icon name="loader" size={14} className="animate-spin" /> : <Icon name="sparkles" size={14} />}
                      AI Generate
                    </button>
                  </div>
                  <textarea 
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    rows={6} 
                    className="w-full border border-slate-300 rounded-xl p-4 focus:ring-2 focus:ring-brand-500 focus:border-transparent outline-none transition-all shadow-sm bg-white/60" 
                    placeholder="Describe your item..."
                  ></textarea>
               </div>

               <div className="flex justify-between pt-6 border-t border-slate-100">
                  <button onClick={() => setStep(1)} className="text-slate-500 hover:text-slate-900 font-medium px-4 py-2">Back</button>
                  <button onClick={() => setStep(3)} className="bg-brand-600 text-white px-8 py-3 rounded-xl font-bold hover:bg-brand-700 shadow-lg shadow-brand-500/20 transform hover:-translate-y-0.5 transition-all">Next: Photos</button>
               </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-8 max-w-4xl mx-auto animate-fade-in">
              <div 
                onClick={() => fileInputRef.current?.click()}
                className={`border-3 border-dashed border-slate-200 rounded-3xl hover:bg-slate-50 hover:border-brand-400 transition-all cursor-pointer group text-center ${images.length > 0 ? 'py-8 p-6' : 'p-16'}`}
              >
                 <div className="mx-auto w-16 h-16 bg-brand-50 text-brand-500 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform shadow-sm">
                    <Icon name="camera" size={24} />
                 </div>
                 <h3 className="font-bold text-xl text-slate-900 mb-2">
                    {images.length > 0 ? 'Add More Photos' : 'Upload Photos'}
                 </h3>
                 <p className="text-slate-500">Drag and drop or click to browse</p>
                 <p className="text-xs text-slate-400 mt-2 uppercase tracking-wider font-medium">Supports JPG, PNG</p>
                 <input 
                    type="file" 
                    ref={fileInputRef} 
                    className="hidden" 
                    multiple 
                    accept="image/*"
                    onChange={handleImageUpload}
                 />
              </div>

              {/* Image Grid */}
              {images.length > 0 && (
                <div>
                    <h4 className="text-sm font-bold text-slate-700 mb-3">{images.length} Photos Selected</h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {images.map((img, index) => (
                            <div key={index} className="relative aspect-square rounded-2xl overflow-hidden group border border-slate-200 shadow-sm bg-slate-100">
                                <img src={img} alt={`Preview ${index}`} referrerPolicy="no-referrer" className="w-full h-full object-cover" />
                                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors"></div>
                                
                                <button 
                                    onClick={(e) => handleEnhanceImage(index, e)}
                                    disabled={enhancingImageIndex === index || !img.startsWith('data:')}
                                    className={`absolute top-2 left-2 p-1.5 bg-white text-brand-500 rounded-full shadow-md opacity-0 group-hover:opacity-100 transition-all hover:bg-brand-50 hover:scale-110 z-20 ${enhancingImageIndex === index ? 'opacity-100' : ''} ${!img.startsWith('data:') ? 'hidden' : ''}`}
                                    title="AI Enhance"
                                >
                                    {enhancingImageIndex === index ? <Icon name="loader" size={16} className="animate-spin" /> : <Icon name="sparkles" size={16} />}
                                </button>
                                
                                <button 
                                    onClick={(e) => { e.stopPropagation(); removeImage(index); }}
                                    className="absolute top-2 right-2 p-1.5 bg-white text-red-500 rounded-full shadow-md opacity-0 group-hover:opacity-100 transition-all hover:bg-red-50 hover:scale-110 z-20"
                                    title="Remove photo"
                                >
                                    <Icon name="x" size={16} />
                                </button>
                                
                                {index === 0 && (
                                    <div className="absolute bottom-2 left-2 px-2 py-1 bg-black/60 backdrop-blur rounded text-[10px] text-white font-bold">
                                        COVER
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
              )}

               <div className="flex justify-between pt-8 border-t border-slate-100 relative">
                  <button onClick={() => setStep(2)} className="text-slate-500 hover:text-slate-900 font-medium px-4 py-2">Back</button>
                  
                  <div className="flex flex-col items-end gap-2">
                      <button 
                        onClick={handlePublish}
                        disabled={images.length === 0 || isSubmitting}
                        className={`bg-brand-600 text-white px-10 py-4 rounded-xl font-bold hover:bg-brand-700 shadow-xl shadow-brand-500/30 transform hover:-translate-y-0.5 transition-all flex items-center gap-2 ${(images.length === 0 || isSubmitting) ? 'opacity-50 cursor-not-allowed' : ''}`}
                      >
                         {isSubmitting ? (
                            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                         ) : (
                            <Icon name="check" size={20} />
                         )}
                         {isSubmitting ? 'Publishing...' : (editId ? 'Update Ad' : 'Publish Ad')}
                      </button>
                      
                      {uploadProgress && (
                          <div className="w-full max-w-xs space-y-1">
                              <div className="flex justify-between text-xs text-slate-500 font-medium">
                                  <span>Uploading {uploadProgress.current} of {uploadProgress.total}</span>
                                  <span>{uploadProgress.percent}%</span>
                              </div>
                              <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                                  <div 
                                      className="h-full bg-brand-500 transition-all duration-300 ease-out"
                                      style={{ width: `${uploadProgress.percent}%` }}
                                  />
                              </div>
                          </div>
                      )}
                  </div>
               </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PostAd;