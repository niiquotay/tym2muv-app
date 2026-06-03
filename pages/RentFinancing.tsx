import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLocation } from '../context/LocationContext';
import { submitRentFinancingApplication, getRentFinancingApplications } from '../services/supabaseService';
import { RentFinancingApplication } from '../types';
import Icon from '../components/Icon';
import { motion, AnimatePresence } from 'framer-motion';

const ID_TYPES = [
  { id: 'national_id', name: 'National ID Card' },
  { id: 'passport', name: 'International Passport' },
  { id: 'drivers_license', name: "Driver's License" },
  { id: 'voters_card', name: "Voter's Card" }
];

const EMPLOYMENT_STATUSES = [
  { id: 'employed', name: 'Employed (Salary Earner)' },
  { id: 'self_employed', name: 'Self-Employed / Entrepreneur' },
  { id: 'unemployed', name: 'Unemployed' },
  { id: 'student', name: 'Student with Income' },
  { id: 'retired', name: 'Retired' }
];

const RentFinancing: React.FC = () => {
  const { user } = useAuth();
  const { location: userLoc } = useLocation();
  const [activeTab, setActiveTab] = useState<'apply' | 'history'>('apply');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [applications, setApplications] = useState<RentFinancingApplication[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    // Personal Info
    fullName: user?.name || '',
    email: user?.socials?.email || user?.email || '',
    phone: user?.socials?.phone || '',
    employmentStatus: 'employed',
    monthlyIncome: '',
    idType: 'national_id',
    idNumber: '',

    // Rent Details
    monthlyRent: '',
    landlordName: '',
    landlordPhone: '',
    moveInDate: '',
    leaseDuration: '12',

    // Property Address
    streetAddress: '',
    city: '',
    stateRegion: '',
    country: userLoc.name || '',
    postalCode: '',

    // Loan Details
    amountRequired: 1000,
    repaymentDuration: 12 // default 12, max 36
  });

  // Calculate dynamic limit bounds for the sliders
  const minAmount = 200;
  const maxAmount = 50000;

  // Repayment calculator values
  // Estimate monthly interest rate at 1.5% simple monthly interest (quite typical for rent financing)
  const interestRate = 1.5; 
  const totalInterest = (formData.amountRequired * (interestRate / 100) * formData.repaymentDuration);
  const totalRepayable = formData.amountRequired + totalInterest;
  const monthlyRepayment = totalRepayable / formData.repaymentDuration;

  useEffect(() => {
    if (user) {
      setFormData(prev => ({
        ...prev,
        fullName: prev.fullName || user.name || '',
        email: prev.email || user.socials?.email || user.email || '',
        phone: prev.phone || user.socials?.phone || ''
      }));
    }
  }, [user]);

  const fetchHistory = async () => {
    if (!user) return;
    setIsLoadingHistory(true);
    try {
      const history = await getRentFinancingApplications(user.id);
      setApplications(history);
    } catch (err) {
      console.error('Failed to load application history:', err);
    } finally {
      setIsLoadingHistory(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'history') {
      fetchHistory();
    }
  }, [activeTab, user]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSliderChange = (name: 'amountRequired' | 'repaymentDuration', value: number) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    // Basic Validation
    if (!formData.fullName.trim()) return setErrorMsg('Full Name is required.');
    if (!formData.email.trim()) return setErrorMsg('Email is required.');
    if (!formData.phone.trim()) return setErrorMsg('Phone number is required.');
    if (!formData.monthlyIncome || parseFloat(formData.monthlyIncome) <= 0) return setErrorMsg('Please enter a valid monthly income.');
    if (!formData.idNumber.trim()) return setErrorMsg('ID number is required.');
    if (!formData.monthlyRent || parseFloat(formData.monthlyRent) <= 0) return setErrorMsg('Please enter a valid monthly rent.');
    if (!formData.landlordName.trim()) return setErrorMsg('Landlord name is required.');
    if (!formData.landlordPhone.trim()) return setErrorMsg('Landlord contact phone is required.');
    if (!formData.moveInDate) return setErrorMsg('Expected move-in date is required.');
    if (!formData.streetAddress.trim() || !formData.city.trim() || !formData.stateRegion.trim()) {
      return setErrorMsg('Please complete all property address fields.');
    }

    if (formData.repaymentDuration > 36) {
      return setErrorMsg('Maximum repayment duration is 36 months.');
    }

    setIsSubmitting(true);
    try {
      await submitRentFinancingApplication({
        userId: user?.id,
        fullName: formData.fullName,
        email: formData.email,
        phone: formData.phone,
        employmentStatus: formData.employmentStatus,
        monthlyIncome: parseFloat(formData.monthlyIncome),
        idType: formData.idType,
        idNumber: formData.idNumber,
        monthlyRent: parseFloat(formData.monthlyRent),
        landlordName: formData.landlordName,
        landlordPhone: formData.landlordPhone,
        moveInDate: formData.moveInDate,
        leaseDuration: parseInt(formData.leaseDuration, 10),
        streetAddress: formData.streetAddress,
        city: formData.city,
        stateRegion: formData.stateRegion,
        country: formData.country,
        postalCode: formData.postalCode,
        amountRequired: Number(formData.amountRequired),
        repaymentDuration: Number(formData.repaymentDuration)
      });

      setSuccessMsg('Your rent financing application was successfully submitted! Our finance team will review and contact you within 24 hours.');
      // Reset loan inputs or redirect
      window.scrollTo({ top: 0, behavior: 'smooth' });
      // Refresh form
      setFormData(prev => ({
        ...prev,
        monthlyRent: '',
        landlordName: '',
        landlordPhone: '',
        moveInDate: '',
        streetAddress: '',
        city: '',
        stateRegion: '',
        amountRequired: 1000,
        repaymentDuration: 12
      }));
    } catch (err: any) {
      setErrorMsg(err.message || 'Something went wrong during submission. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return (
          <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-700 px-3 py-1 rounded-full text-xs font-bold border border-emerald-200">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> Approved
          </span>
        );
      case 'rejected':
        return (
          <span className="inline-flex items-center gap-1 bg-red-50 text-red-700 px-3 py-1 rounded-full text-xs font-bold border border-red-200">
            <span className="w-1.5 h-1.5 rounded-full bg-red-500"></span> Declined
          </span>
        );
      case 'under_review':
        return (
          <span className="inline-flex items-center gap-1 bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-xs font-bold border border-blue-200">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse"></span> Under Review
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 bg-amber-50 text-amber-700 px-3 py-1 rounded-full text-xs font-bold border border-amber-200">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span> Pending Review
          </span>
        );
    }
  };

  return (
    <div id="rent-financing-view" className="py-8 min-h-screen bg-slate-50/50">
      <div className="container mx-auto px-4 max-w-5xl">
        
        {/* Page Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <div>
            <span className="inline-flex items-center gap-1.5 bg-brand-50 border border-brand-100 text-brand-700 px-3.5 py-1 rounded-full text-xs font-bold tracking-wide uppercase mb-3">
              <Icon name="zap" size={12} className="text-brand-500 animate-pulse" />
              CaliberRent Financing Center
            </span>
            <h1 className="text-3xl font-extrabold tracking-tight text-slate-800 font-display">
              Flexible Rent Financing
            </h1>
            <p className="text-slate-500 text-xs mt-1 leading-relaxed max-w-xl">
              Don't let massive landlord advance demands slow you down. Apply for instant rental capital and spread your payments comfortably across up to 36 months.
            </p>
          </div>
          
          {/* Navigation Tabs */}
          <div className="flex bg-white border border-slate-205 p-1 rounded-2xl shadow-sm">
            <button
              id="tab-apply-btn"
              onClick={() => setActiveTab('apply')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'apply'
                  ? 'bg-brand-600 text-white shadow-md'
                  : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              New Application
            </button>
            <button
              id="tab-history-btn"
              onClick={() => setActiveTab('history')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'history'
                  ? 'bg-brand-600 text-white shadow-md'
                  : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              My Applications
            </button>
          </div>
        </div>

        {/* Application Form Tab */}
        {activeTab === 'apply' ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* Main Application Form Inputs */}
            <div className="lg:col-span-2 space-y-6">
              
              <AnimatePresence mode="wait">
                {successMsg && (
                  <motion.div 
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="p-5 bg-emerald-50 border border-emerald-100 text-emerald-800 rounded-3xl flex gap-3 items-start"
                  >
                    <div className="p-1 rounded-full bg-emerald-500 text-white flex-shrink-0 mt-0.5">
                      <Icon name="check" size={16} />
                    </div>
                    <div className="text-xs font-semibold leading-relaxed">
                      {successMsg}
                    </div>
                  </motion.div>
                )}

                {errorMsg && (
                  <motion.div 
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="p-5 bg-red-50 border border-red-100 text-red-800 rounded-3xl flex gap-3 items-start"
                  >
                    <div className="p-1 rounded-full bg-red-500 text-white flex-shrink-0 mt-0.5">
                      <Icon name="alert" size={16} />
                    </div>
                    <div className="text-xs font-semibold leading-relaxed">
                      {errorMsg}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <form onSubmit={handleFormSubmit} className="space-y-6">
                
                {/* 1. Personal Information */}
                <div className="bg-white rounded-[2rem] p-6 border border-slate-100 shadow-sm space-y-4">
                  <div className="flex items-center gap-2 mb-2 pb-3 border-b border-slate-50">
                    <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
                      <Icon name="user" size={16} />
                    </div>
                    <h3 className="font-bold text-slate-800 text-sm sm:text-base">Personal Information</h3>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Full Name</label>
                      <input
                        type="text"
                        name="fullName"
                        value={formData.fullName}
                        onChange={handleInputChange}
                        placeholder="John Doe"
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-150 rounded-xl text-xs sm:text-sm font-semibold transition-all focus:bg-white focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Email Address</label>
                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        placeholder="johndoe@email.com"
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-150 rounded-xl text-xs sm:text-sm font-semibold transition-all focus:bg-white focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none"
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Phone Number</label>
                      <input
                        type="tel"
                        name="phone"
                        value={formData.phone}
                        onChange={handleInputChange}
                        placeholder="+233 20 123 4567"
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-150 rounded-xl text-xs sm:text-sm font-semibold transition-all focus:bg-white focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Employment Status</label>
                      <select
                        name="employmentStatus"
                        value={formData.employmentStatus}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-150 rounded-xl text-xs sm:text-sm font-bold text-slate-800 transition-all focus:bg-white focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none cursor-pointer"
                      >
                        {EMPLOYMENT_STATUSES.map(status => (
                          <option key={status.id} value={status.id}>{status.name}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="md:col-span-1">
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Monthly Income ({userLoc.symbol})</label>
                      <input
                        type="number"
                        name="monthlyIncome"
                        value={formData.monthlyIncome}
                        onChange={handleInputChange}
                        placeholder="4500"
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-150 rounded-xl text-xs sm:text-sm font-semibold transition-all focus:bg-white focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Verification ID Type</label>
                      <select
                        name="idType"
                        value={formData.idType}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-150 rounded-xl text-xs sm:text-sm font-bold text-slate-800 transition-all focus:bg-white focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none cursor-pointer"
                      >
                        {ID_TYPES.map(type => (
                          <option key={type.id} value={type.id}>{type.name}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">ID Document Number</label>
                      <input
                        type="text"
                        name="idNumber"
                        value={formData.idNumber}
                        onChange={handleInputChange}
                        placeholder="GHA-123456789-0"
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-150 rounded-xl text-xs sm:text-sm font-semibold transition-all focus:bg-white focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none"
                        required
                      />
                    </div>
                  </div>
                </div>

                {/* 2. Rent Details */}
                <div className="bg-white rounded-[2rem] p-6 border border-slate-100 shadow-sm space-y-4">
                  <div className="flex items-center gap-2 mb-2 pb-3 border-b border-slate-50">
                    <div className="w-8 h-8 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center">
                      <Icon name="tag" size={16} />
                    </div>
                    <h3 className="font-bold text-slate-800 text-sm sm:text-base">Rent & Landlord Details</h3>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Monthly Rent ({userLoc.symbol})</label>
                      <input
                        type="number"
                        name="monthlyRent"
                        value={formData.monthlyRent}
                        onChange={handleInputChange}
                        placeholder="1200"
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-150 rounded-xl text-xs sm:text-sm font-semibold transition-all focus:bg-white focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Lease Duration (Months)</label>
                      <select
                        name="leaseDuration"
                        value={formData.leaseDuration}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-150 rounded-xl text-xs sm:text-sm font-bold text-slate-800 transition-all focus:bg-white focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none cursor-pointer"
                      >
                        <option value="6">6 Months</option>
                        <option value="12">12 Months</option>
                        <option value="24">24 Months</option>
                        <option value="36">36 Months</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Landlord Name</label>
                      <input
                        type="text"
                        name="landlordName"
                        value={formData.landlordName}
                        onChange={handleInputChange}
                        placeholder="Alhaji Kwesi"
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-150 rounded-xl text-xs sm:text-sm font-semibold transition-all focus:bg-white focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Landlord Contact Phone</label>
                      <input
                        type="tel"
                        name="landlordPhone"
                        value={formData.landlordPhone}
                        onChange={handleInputChange}
                        placeholder="+233 24 987 6543"
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-150 rounded-xl text-xs sm:text-sm font-semibold transition-all focus:bg-white focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Expected Move-in Date</label>
                      <input
                        type="date"
                        name="moveInDate"
                        value={formData.moveInDate}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-150 rounded-xl text-xs sm:text-sm font-semibold transition-all focus:bg-white focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none cursor-pointer text-slate-850"
                        required
                      />
                    </div>
                  </div>
                </div>

                {/* 3. Property Address */}
                <div className="bg-white rounded-[2rem] p-6 border border-slate-100 shadow-sm space-y-4">
                  <div className="flex items-center gap-2 mb-2 pb-3 border-b border-slate-50">
                    <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                      <Icon name="mapPin" size={16} />
                    </div>
                    <h3 className="font-bold text-slate-800 text-sm sm:text-base">Property Address</h3>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Street Address</label>
                    <input
                      type="text"
                      name="streetAddress"
                      value={formData.streetAddress}
                      onChange={handleInputChange}
                      placeholder="Ring Road Central, Plot 42"
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-150 rounded-xl text-xs sm:text-sm font-semibold transition-all focus:bg-white focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="md:col-span-2">
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">City / Town</label>
                      <input
                        type="text"
                        name="city"
                        value={formData.city}
                        onChange={handleInputChange}
                        placeholder="Accra"
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-150 rounded-xl text-xs sm:text-sm font-semibold transition-all focus:bg-white focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none"
                        required
                      />
                    </div>
                    <div className="md:col-span-1">
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Region / State</label>
                      <input
                        type="text"
                        name="stateRegion"
                        value={formData.stateRegion}
                        onChange={handleInputChange}
                        placeholder="Greater Accra"
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-150 rounded-xl text-xs sm:text-sm font-semibold transition-all focus:bg-white focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none"
                        required
                      />
                    </div>
                    <div className="md:col-span-1">
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Postal Code</label>
                      <input
                        type="text"
                        name="postalCode"
                        value={formData.postalCode}
                        onChange={handleInputChange}
                        placeholder="GA-184"
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-150 rounded-xl text-xs sm:text-sm font-semibold transition-all focus:bg-white focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none"
                      />
                    </div>
                  </div>
                </div>

                {/* Submit Action Block */}
                <div>
                  <button
                    id="submit-financing-application-btn"
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full py-4 bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-700 hover:to-indigo-700 text-white font-extrabold text-sm tracking-wide rounded-2xl shadow-xl shadow-indigo-500/10 hover:shadow-indigo-500/25 active:scale-98 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {isSubmitting ? (
                      <>
                        <Icon name="loader" size={18} className="animate-spin" />
                        <span>Processing Instant Verification...</span>
                      </>
                    ) : (
                      <>
                        <Icon name="shieldCheck" size={18} />
                        <span>Submit Secure Rent Financing Application</span>
                      </>
                    )}
                  </button>
                </div>

              </form>
            </div>

            {/* Live Repayment Calculator Card (Static/Floating Sidebar) */}
            <div className="lg:col-span-1">
              <div className="sticky top-24 bg-white rounded-[2.5rem] p-6 border border-slate-100 shadow-md space-y-6">
                
                <div className="flex items-center gap-2.5 pb-4 border-b border-slate-100">
                  <div className="w-9 h-9 rounded-xl bg-brand-100 text-brand-600 flex items-center justify-center">
                    <Icon name="creditCard" size={18} />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-800 text-sm">Loan details</h3>
                    <p className="text-[10px] text-slate-450 font-medium">Interactive Rent Term Estimator</p>
                  </div>
                </div>

                {/* Amount Required Slider */}
                <div className="space-y-3">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-bold text-slate-500 uppercase tracking-wider">Amount Required</span>
                    <span className="font-extrabold text-slate-900 border border-slate-100 bg-slate-50 px-2.5 py-1 rounded-lg text-xs">
                      {userLoc.symbol}{formData.amountRequired.toLocaleString()}
                    </span>
                  </div>

                  <input
                    id="loan-amount-slider"
                    type="range"
                    min={minAmount}
                    max={maxAmount}
                    step={100}
                    value={formData.amountRequired}
                    onChange={(e) => handleSliderChange('amountRequired', parseInt(e.target.value, 10))}
                    className="w-full h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-brand-600"
                  />

                  <div className="flex justify-between text-[10px] font-mono font-bold text-slate-400">
                    <span>{userLoc.symbol}{minAmount}</span>
                    <span>{userLoc.symbol}{maxAmount}</span>
                  </div>
                </div>

                {/* Repayment Duration Slider */}
                <div className="space-y-3">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-bold text-slate-500 uppercase tracking-wider">Repayment period</span>
                    <span className="font-extrabold text-slate-900 border border-slate-100 bg-slate-50 px-2.5 py-1 rounded-lg text-xs">
                      {formData.repaymentDuration} Months
                    </span>
                  </div>

                  <input
                    id="repayment-duration-slider"
                    type="range"
                    min={1}
                    max={36}
                    step={1}
                    value={formData.repaymentDuration}
                    onChange={(e) => handleSliderChange('repaymentDuration', parseInt(e.target.value, 10))}
                    className="w-full h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-brand-600"
                  />

                  <div className="flex justify-between text-[10px] font-mono font-bold text-slate-400">
                    <span>1 Month</span>
                    <span>36 Months max</span>
                  </div>
                </div>

                {/* Estimated Repayments breakdown */}
                <div className="bg-brand-50/50 p-4 rounded-3xl border border-brand-100/30 space-y-3">
                  <span className="text-[10px] font-extrabold tracking-wider uppercase text-slate-400 block">estimated loan cost</span>
                  
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-medium text-slate-600">Principal Amount</span>
                    <span className="font-bold text-slate-800">{userLoc.symbol}{formData.amountRequired.toLocaleString()}</span>
                  </div>

                  <div className="flex justify-between items-center text-xs">
                    <span className="font-medium text-slate-600">Estimated Rate</span>
                    <span className="font-bold text-indigo-700">{interestRate}% / month</span>
                  </div>

                  <div className="flex justify-between items-center text-xs pb-3 border-b border-brand-100/50">
                    <span className="font-medium text-slate-600">Total Interest ({formData.repaymentDuration}m)</span>
                    <span className="font-bold text-slate-800">{userLoc.symbol}{Math.round(totalInterest).toLocaleString()}</span>
                  </div>

                  <div className="flex justify-between items-center pt-1">
                    <div>
                      <span className="text-xs font-bold text-slate-900">Monthly Repayment</span>
                      <span className="text-[9px] block text-slate-450 leading-tight">Interest inclusive</span>
                    </div>
                    <span className="text-xl font-black text-brand-700 font-display">
                      {userLoc.symbol}{Math.round(monthlyRepayment).toLocaleString()}
                    </span>
                  </div>
                </div>

                {/* Highlight badges for trust */}
                <div className="space-y-2.5 pt-1">
                  <div className="flex gap-2.5 items-start text-xs">
                    <div className="w-5 h-5 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Icon name="check" size={12} />
                    </div>
                    <p className="text-slate-500 text-[11px] leading-tight font-medium"><strong>No early payoff fees.</strong> Settle principal early at zero extra penalties.</p>
                  </div>
                  <div className="flex gap-2.5 items-start text-xs">
                    <div className="w-5 h-5 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Icon name="check" size={12} />
                    </div>
                    <p className="text-slate-500 text-[11px] leading-tight font-medium"><strong>Direct disbursement.</strong> Approved capital sent directly to your landlord.</p>
                  </div>
                </div>

              </div>
            </div>

          </div>
        ) : (
          /* Past Applications History Tab */
          <div className="bg-white rounded-[2.5rem] p-6 sm:p-8 border border-slate-100 shadow-sm min-h-[400px]">
            <h3 className="font-bold text-slate-850 text-lg mb-6 flex items-center gap-2">
              <Icon name="clock" size={20} className="text-brand-600" />
              Your Applications History
            </h3>

            {isLoadingHistory ? (
              <div className="flex justify-center items-center py-20">
                <Icon name="loader" size={32} className="animate-spin text-brand-600" />
              </div>
            ) : applications.length === 0 ? (
              <div className="py-20 text-center">
                <div className="w-16 h-16 bg-slate-50 text-slate-300 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Icon name="database" size={32} />
                </div>
                <h4 className="font-bold text-slate-850">No Financing Applications</h4>
                <p className="text-slate-450 text-xs mt-1 leading-relaxed">
                  You have not submitted any rent financing requests yet. Tap "New Application" to begin!
                </p>
                <button
                  onClick={() => setActiveTab('apply')}
                  className="mt-6 px-5 py-2.5 bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs rounded-xl transition-all shadow-md focus:ring-2 focus:ring-brand-500"
                >
                  Apply Now
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {applications.map((app) => (
                  <div 
                    key={app.id} 
                    className="p-5 border border-slate-100 rounded-3xl hover:border-brand-100/50 transition-all bg-slate-50/20"
                  >
                    <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 border-b border-slate-50 pb-4 mb-4">
                      <div>
                        <span className="text-[10px] font-mono text-slate-400 font-bold uppercase tracking-wide block">Application ID: {app.id}</span>
                        <h4 className="font-extrabold text-slate-800 text-sm mt-1 sm:text-base">
                          Rent Financing Request for Plot/Street {app.streetAddress.slice(0, 30)}...
                        </h4>
                        <span className="text-[11px] text-slate-500 font-medium">Submitted on {new Date(app.createdAt).toLocaleDateString()}</span>
                      </div>
                      <div className="self-start sm:self-center">
                        {getStatusBadge(app.status)}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs font-semibold">
                      <div>
                        <span className="text-[10px] text-slate-450 uppercase font-bold block tracking-wider mb-1">Loan Capital</span>
                        <span className="text-slate-800 text-sm font-extrabold">{userLoc.symbol}{app.amountRequired.toLocaleString()}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-450 uppercase font-bold block tracking-wider mb-1">Monthly Cost</span>
                        <span className="text-slate-850 text-sm font-bold">
                          {userLoc.symbol}{Math.round((app.amountRequired + (app.amountRequired * (interestRate/100) * app.repaymentDuration)) / app.repaymentDuration).toLocaleString()} / mo
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-450 uppercase font-bold block tracking-wider mb-1">Repayment Term</span>
                        <span className="text-slate-850 font-bold">{app.repaymentDuration} Months</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-450 uppercase font-bold block tracking-wider mb-1">Move-In Date</span>
                        <span className="text-slate-850 font-bold">{new Date(app.moveInDate).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
};

export default RentFinancing;
