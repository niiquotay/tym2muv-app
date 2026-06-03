import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { updateUserProfile, uploadImage } from '../services/supabaseService';
import Icon from '../components/Icon';
import { useNavigate } from 'react-router-dom';

const Settings: React.FC = () => {
  const { user, refreshUser } = useAuth();
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    bio: '',
    phone: '',
    location: '',
    avatar: ''
  });
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || '',
        bio: user.bio || '',
        phone: user.socials?.phone || user.phone || '',
        location: user.location || '',
        avatar: user.avatar || ''
      });
    }
  }, [user]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0] && user) {
      const file = e.target.files[0];
      setIsSubmitting(true);
      try {
        const url = await uploadImage(file, `avatars/${user.id}/${Date.now()}_${file.name}`);
        setFormData(prev => ({ ...prev, avatar: url }));
      } catch (error) {
        console.error("Error uploading avatar:", error);
        alert("Failed to upload image.");
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setIsSubmitting(true);
    try {
      await updateUserProfile(user.id, {
        name: formData.name,
        bio: formData.bio,
        location: formData.location,
        avatar: formData.avatar,
        socials: {
          ...user.socials,
          phone: formData.phone
        }
      });
      await refreshUser();
      alert("Profile updated successfully!");
      navigate(`/profile/${user.id}`);
    } catch (error) {
      console.error("Error updating profile:", error);
      alert("Failed to update profile.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!user) return null;

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl min-h-screen">
      <div className="flex items-center gap-4 mb-8">
        <button onClick={() => navigate(-1)} className="p-2 hover:bg-slate-100 rounded-full text-slate-500">
          <Icon name="chevronRight" size={24} className="rotate-180" />
        </button>
        <h1 className="text-3xl font-bold text-slate-900">Profile Settings</h1>
      </div>

      <div className="glass-card rounded-3xl p-6 md:p-10 shadow-xl border border-slate-100">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Avatar Upload */}
          <div className="flex flex-col items-center mb-8">
            <div className="relative group">
              <img 
                src={formData.avatar || 'https://via.placeholder.com/150'} 
                alt="Profile" 
                referrerPolicy="no-referrer"
                className="w-32 h-32 rounded-full object-cover border-4 border-white shadow-lg bg-slate-100"
              />
              <button 
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="absolute inset-0 flex items-center justify-center bg-black/40 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <Icon name="camera" size={24} />
              </button>
              <input 
                type="file" 
                ref={fileInputRef} 
                className="hidden" 
                accept="image/*"
                onChange={handleImageUpload}
              />
            </div>
            <p className="text-sm text-slate-500 mt-3">Click to change profile photo</p>
          </div>

          <div className="grid grid-cols-1 gap-6">
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">Full Name</label>
              <input 
                type="text" 
                name="name"
                value={formData.name}
                onChange={handleChange}
                className="w-full border border-slate-200 rounded-xl p-4 focus:ring-2 focus:ring-brand-500 outline-none bg-white/60"
                placeholder="Your name"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">Phone Number</label>
              <input 
                type="tel" 
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                className="w-full border border-slate-200 rounded-xl p-4 focus:ring-2 focus:ring-brand-500 outline-none bg-white/60"
                placeholder="+233..."
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">Location</label>
              <input 
                type="text" 
                name="location"
                value={formData.location}
                onChange={handleChange}
                className="w-full border border-slate-200 rounded-xl p-4 focus:ring-2 focus:ring-brand-500 outline-none bg-white/60"
                placeholder="City, Country"
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">Bio</label>
              <textarea 
                name="bio"
                value={formData.bio}
                onChange={handleChange}
                rows={4}
                className="w-full border border-slate-200 rounded-xl p-4 focus:ring-2 focus:ring-brand-500 outline-none bg-white/60"
                placeholder="Tell us about yourself..."
              ></textarea>
            </div>
          </div>

          <div className="pt-6">
            <button 
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-brand-600 text-white py-4 rounded-xl font-bold hover:bg-brand-700 shadow-xl shadow-brand-500/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isSubmitting ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <Icon name="check" size={20} />
              )}
              {isSubmitting ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Settings;
