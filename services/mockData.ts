
import { Listing, User, Agent, Monetization, Chat, ChatMessage } from '../types';

export const MOCK_USERS: (User | Agent)[] = [
  {
    id: 'admin-1',
    name: 'Admin User',
    avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&h=100&fit=crop',
    rating: 5.0,
    reviewCount: 10,
    location: 'Accra, Ghana',
    memberSince: 'Jan 2024',
    bio: 'System Administrator',
    verified: true,
    role: 'Admin',
    socials: { email: 'info@caliberdesk.com' }
  },
  {
    id: 'agent-1',
    name: 'Kofi Mensah',
    avatar: 'https://images.unsplash.com/photo-1599566150163-29194dcaad36?w=100&h=100&fit=crop',
    rating: 4.8,
    reviewCount: 45,
    location: 'Kumasi, Ghana',
    memberSince: 'Feb 2024',
    bio: 'Expert in residential properties in Kumasi.',
    verified: true,
    role: 'Agent',
    agencyName: 'Mensah Real Estate',
    socials: { email: 'kofi@example.com', phone: '+233 24 123 4567' }
  } as Agent,
  {
    id: 'agent-2',
    name: 'Sarah Okafor',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop',
    rating: 4.9,
    reviewCount: 32,
    location: 'Lagos, Nigeria',
    memberSince: 'Mar 2024',
    bio: 'Luxury apartment specialist in Victoria Island.',
    verified: true,
    role: 'Agent',
    agencyName: 'Lagos Luxury Living',
    socials: { email: 'sarah@example.com', phone: '+234 80 123 4567' }
  } as Agent,
  {
    id: 'agent-3',
    name: 'Ama Serwaa',
    avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop',
    rating: 4.7,
    reviewCount: 56,
    location: 'Accra, Ghana',
    memberSince: 'Nov 2023',
    bio: 'Finding the perfect homes for families in Accra.',
    verified: true,
    role: 'Agent',
    agencyName: 'Serwaa Homes',
    socials: { email: 'ama@example.com', phone: '+233 20 987 6543' }
  } as Agent,
  {
    id: 'tenant-1',
    name: 'John Doe',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop',
    rating: 5.0,
    reviewCount: 2,
    location: 'Accra, Ghana',
    memberSince: 'Apr 2024',
    bio: 'Looking for a cozy apartment.',
    verified: false,
    role: 'Tenant',
    socials: { email: 'john@example.com' },
    savedListings: ['listing-1', 'listing-4']
  },
  {
    id: 'tenant-2',
    name: 'Jane Smith',
    avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=100&h=100&fit=crop',
    rating: 4.5,
    reviewCount: 1,
    location: 'Tema, Ghana',
    memberSince: 'May 2024',
    bio: 'Relocating for work, need a serene environment.',
    verified: true,
    role: 'Tenant',
    socials: { email: 'jane@example.com' }
  }
];

export const MOCK_LISTINGS: Listing[] = [
  {
    id: 'listing-1',
    title: 'Modern 3 Bedroom Apartment',
    price: 2500,
    currency: 'USD',
    location: 'East Legon, Accra',
    country: 'GH',
    imageUrl: 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=800&q=80',
    categoryId: 'residential',
    type: 'Rent',
    propertyType: 'Apartment',
    bedrooms: 3,
    bathrooms: 2,
    sqft: 1500,
    description: 'Beautiful modern apartment in the heart of East Legon. Features 24/7 security, swimming pool, and gym. Close to top international schools and shopping malls.',
    sellerId: 'agent-1',
    datePosted: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    expiryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    isVerified: true,
    isFeatured: true,
    images: [
      'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=800&q=80',
      'https://images.unsplash.com/photo-1512918728675-ed5a9ecdebfd?w=800&q=80',
      'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800&q=80'
    ]
  },
  {
    id: 'listing-2',
    title: 'Luxury Villa with Ocean View',
    price: 850000,
    currency: 'USD',
    location: 'Victoria Island, Lagos',
    country: 'NG',
    imageUrl: 'https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=800&q=80',
    categoryId: 'residential',
    type: 'Sale',
    propertyType: 'Villa',
    bedrooms: 5,
    bathrooms: 6,
    sqft: 4500,
    description: 'Stunning villa with panoramic ocean views. Private pool, cinema room, and smart home features. Enjoy luxury living at its finest.',
    sellerId: 'agent-2',
    datePosted: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    expiryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    isVerified: true,
    isFeatured: true,
    images: [
      'https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=800&q=80',
      'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=800&q=80'
    ]
  },
  {
    id: 'listing-3',
    title: 'Commercial Office Space in Prime Area',
    price: 1500,
    currency: 'GHS',
    location: 'Osu, Accra',
    country: 'GH',
    imageUrl: 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=800&q=80',
    categoryId: 'commercial',
    type: 'Rent',
    propertyType: 'Office',
    description: 'Prime office space in Osu. High foot traffic area, perfect for startups or small businesses looking for visibility.',
    sellerId: 'agent-1',
    datePosted: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    expiryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    isVerified: true,
    isFeatured: false,
    images: [
      'https://images.unsplash.com/photo-1497366216548-37526070297c?w=800&q=80',
    ]
  },
  {
    id: 'listing-4',
    title: 'Cozy Studio Apartment',
    price: 1200,
    currency: 'GHS',
    location: 'Cantonments, Accra',
    country: 'GH',
    imageUrl: 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800&q=80',
    categoryId: 'residential',
    type: 'Rent',
    propertyType: 'Apartment',
    bedrooms: 1,
    bathrooms: 1,
    sqft: 500,
    description: 'Perfect for young professionals. This studio is fully furnished and located in a very secure neighborhood.',
    sellerId: 'agent-3',
    datePosted: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
    expiryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    isVerified: true,
    isFeatured: false,
    images: [
      'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800&q=80',
      'https://images.unsplash.com/photo-1505691938895-1758d7feb511?w=800&q=80'
    ]
  },
  {
    id: 'listing-5',
    title: 'Family House with Large Garden',
    price: 4500,
    currency: 'GHS',
    location: 'Spintex, Accra',
    country: 'GH',
    imageUrl: 'https://images.unsplash.com/photo-1580587771525-78b9dba3b914?w=800&q=80',
    categoryId: 'residential',
    type: 'Rent',
    propertyType: 'House',
    bedrooms: 4,
    bathrooms: 3,
    sqft: 2500,
    description: 'Spacious family house featuring a large garden, garage, and a boys quarters. Located in a quiet part of Spintex.',
    sellerId: 'agent-3',
    datePosted: new Date().toISOString(),
    expiryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    isVerified: true,
    isFeatured: true,
    images: [
      'https://images.unsplash.com/photo-1580587771525-78b9dba3b914?w=800&q=80'
    ]
  },
  {
    id: 'listing-6',
    title: 'Retail Shop Space',
    price: 3000,
    currency: 'GHS',
    location: 'Makola, Accra',
    country: 'GH',
    imageUrl: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=800&q=80',
    categoryId: 'commercial',
    type: 'Rent',
    propertyType: 'Retail',
    sqft: 200,
    description: 'Highly sought-after retail space in the bustling Makola market. Guaranteed high daily foot traffic.',
    sellerId: 'agent-1',
    datePosted: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
    expiryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    isVerified: false,
    isFeatured: false,
    images: [
      'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=800&q=80'
    ]
  },
  {
    id: 'listing-7',
    title: 'Newly Built 2 Bedroom Apartment',
    price: 1800,
    currency: 'GHS',
    location: 'Kasoa, Central Region',
    country: 'GH',
    imageUrl: 'https://images.unsplash.com/photo-1502672260266-1c1de2d93688?w=800&q=80',
    categoryId: 'residential',
    type: 'Rent',
    propertyType: 'Apartment',
    bedrooms: 2,
    bathrooms: 2,
    sqft: 900,
    description: 'Affordable newly built apartment in a gated community in Kasoa. Close to main road and transport links.',
    sellerId: 'agent-3',
    datePosted: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    expiryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    isVerified: true,
    isFeatured: false,
    images: [
      'https://images.unsplash.com/photo-1502672260266-1c1de2d93688?w=800&q=80'
    ]
  },
  {
    id: 'listing-8',
    title: 'Beachfront Mansion',
    price: 2500000,
    currency: 'USD',
    location: 'Lekki Phase 1, Lagos',
    country: 'NG',
    imageUrl: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=800&q=80',
    categoryId: 'residential',
    type: 'Sale',
    propertyType: 'House',
    bedrooms: 6,
    bathrooms: 7,
    sqft: 8000,
    description: 'An architectural masterpiece located on the beachfront. Features a private dock, infinity pool, and helipad.',
    sellerId: 'agent-2',
    datePosted: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
    expiryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    isVerified: true,
    isFeatured: true,
    images: [
      'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=800&q=80'
    ]
  },
  {
    id: 'listing-9',
    title: 'Affordable Plot of Land',
    price: 45000,
    currency: 'GHS',
    location: 'Dodowa, Greater Accra',
    country: 'GH',
    imageUrl: 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=800&q=80',
    categoryId: 'land',
    type: 'Sale',
    propertyType: 'Land',
    sqft: 4000,
    description: 'Registered plot of land suitable for residential development. Very peaceful area with access to water and electricity.',
    sellerId: 'agent-1',
    datePosted: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    expiryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    isVerified: true,
    isFeatured: false,
    images: [
      'https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=800&q=80'
    ]
  },
  {
    id: 'listing-10',
    title: 'Executive 4 Bedroom Home',
    price: 350000,
    currency: 'USD',
    location: 'Tema Community 25',
    country: 'GH',
    imageUrl: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800&q=80',
    categoryId: 'residential',
    type: 'Sale',
    propertyType: 'House',
    bedrooms: 4,
    bathrooms: 4,
    sqft: 3200,
    description: 'Executive home in the prestigious Community 25. Large driveway, modern kitchen, and beautiful landscaping.',
    sellerId: 'agent-3',
    datePosted: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString(),
    expiryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    isVerified: true,
    isFeatured: true,
    images: [
      'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800&q=80',
      'https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?w=800&q=80'
    ]
  }
];

export const MOCK_ADS: Monetization[] = [
  {
    id: 'ad-1',
    type: 'card',
    title: 'Get Featured Today!',
    description: 'Boost your listing visibility by 10x with our featured placement.',
    cta: 'Learn More',
    image: 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=400&q=80',
    link: 'https://example.com/featured',
    color: 'linear-gradient(135deg, #ea580c 0%, #f97316 100%)',
    active: true,
    priority: 10,
    clicks: 150,
    impressions: 2500,
    createdAt: new Date().toISOString()
  },
  {
    id: 'ad-2',
    type: 'banner',
    title: 'New Luxury Development in Accra',
    description: 'Pre-launch prices available for limited time.',
    cta: 'View Project',
    image: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=1200&q=80',
    link: 'https://example.com/luxury-accra',
    color: '#1e293b',
    active: true,
    priority: 5,
    clicks: 45,
    impressions: 1200,
    createdAt: new Date().toISOString()
  }
];

export const MOCK_CHATS: Chat[] = [
  {
    id: 'chat-1',
    participants: ['admin-1', 'agent-1'],
    listingId: 'listing-1',
    messages: [
      { id: 'm1', senderId: 'agent-1', text: 'Hello, is this still available?', timestamp: new Date().toISOString(), isRead: true }
    ],
    lastMessage: 'Hello, is this still available?',
    lastMessageTime: new Date().toISOString(),
    unreadCount: 0
  }
];

// --- PROGRAMMATIC DATA GENERATOR (Ensures 20+ Mock Users & 50+ Mock Listings) ---

const FIRST_NAMES = ["Kwame", "Akua", "Yaw", "Abena", "Kojo", "Esi", "Kofi", "Afia", "Chinedu", "Olumide", "Ngozi", "Tunde", "Chioma", "Amara", "Mwangi", "Wanjiku", "Ochieng", "Achieng", "Njeri", "Karanja", "Efe", "Damilola", "Fatima", "Zainab"];
const LAST_NAMES = ["Boadu", "Addo", "Mensah", "Boateng", "Asante", "Owusu", "Appiah", "Osei", "Okafor", "Balogun", "Adebayo", "Folawiyo", "Egwu", "Uzoh", "Kamau", "Njoroge", "Kiprop", "Odhiambo", "Mwangi", "Kimani", "Adeyemi", "Okoro", "Ibrahim", "Keita"];
const BIOS = [
  "Passionately helping families discover their ideal home spaces across West Africa.",
  "Specialist in urban luxury condos and commercial property investment guidance.",
  "Experienced broker with deep neighborhood knowledge and negotiation skills.",
  "Dedicated to finding budget-friendly rental options for students and young professionals.",
  "Focused on land sales, agricultural acquisitions, and real estate development portfolios."
];
const AGENT_COMPANIES = ["Precision Realty", "Elevated Spaces Ltd", "Gateway Property Hub", "African Horizons Estate", "Capital Trust Residential"];

const MALE_AVATARS = [
  "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop",
  "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop",
  "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop",
  "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=100&h=100&fit=crop",
  "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=100&h=100&fit=crop"
];

const FEMALE_AVATARS = [
  "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop",
  "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop",
  "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=100&h=100&fit=crop",
  "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=100&h=100&fit=crop",
  "https://images.unsplash.com/photo-1554151228-14d9def656e4?w=100&h=100&fit=crop"
];

const GH_LOCATIONS = [
  "Airport Residential, Accra", "Cantonments, Accra", "Dzorwulu, Accra",
  "East Legon, Accra", "Osu, Accra", "Labone, Accra", "Ridge, Accra",
  "Tema Community 6, Tema", "Ahodwo, Kumasi", "Nhyiaeso, Kumasi", "Kasoa, Central Region",
  "Cape Coast, Central Region", "Takoradi, Western Region"
];

const NG_LOCATIONS = [
  "Ikoyi, Lagos", "Victoria Island, Lagos", "Lekki Phase 1, Lagos", "Ikeja, Lagos",
  "Wuse II, Abuja", "Maitama, Abuja", "Gwarinpa, Abuja", "Yaba, Lagos", "Surulere, Lagos"
];

const KE_LOCATIONS = [
  "Westlands, Nairobi", "Karen, Nairobi", "Kilimani, Nairobi", "Runda, Nairobi",
  "Gigiri, Nairobi", "Nyali, Mombasa", "Kasarani, Nairobi"
];

const LISTING_TITLES = {
  houses: [
    "Modern Penthouse Suite", "Charming Family Bungalow", "Executive Garden Mansion",
    "Elite Sunset Villa", "Cozy Multi-Family Duplex", "High-Rise Sky Apartment",
    "Architectural Gated Estate", "Contemporary Semi-Detached House"
  ],
  land: [
    "Prime Acreage for Development", "Fully Serviced Gated Plot", "Fertile Agricultural Estate",
    "Panoramic Hillside Lot", "Premium Beachfront Parcel", "Suburban Residential Flat Land"
  ],
  offices: [
    "Grade-A Corporate Headquarters", "Sleek Co-Working Open Hub", "Centrally Located Retail Space",
    "Creative Studio Workstation", "Premium Main Street Storefront"
  ],
  warehouses: [
    "Secure Industrial Storage Center", "State-of-the-Art Fulfillment Warehouse", "High-Capacity Cold Room Storage",
    "Commercial Distribution Logistics Base", "Compact Raw Material Storage Depot"
  ],
  services: [
    "Luxury Interior Design Service", "Professional Estate Valuation Consult", "Reliable Nationwide Moving Logistics",
    "Corporate Legal Property Verification", "Certified Property Management & Sourcing"
  ]
};

const IMAGES_POOL = {
  houses: [
    "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800&q=80",
    "https://images.unsplash.com/photo-1583608205776-bfd35f0d9f83?w=800&q=80",
    "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800&q=80",
    "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=800&q=80",
    "https://images.unsplash.com/photo-1628624747186-a941c476b7ef?w=800&q=80",
    "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=800&q=80",
    "https://images.unsplash.com/photo-1502672260266-1c1de2d93688?w=800&q=80",
    "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800&q=80",
    "https://images.unsplash.com/photo-1513694203232-719a280e022f?w=800&q=80"
  ],
  land: [
    "https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=800&q=80",
    "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?w=800&q=80",
    "https://images.unsplash.com/photo-1473448912268-2022ce9509d8?w=800&q=80"
  ],
  offices: [
    "https://images.unsplash.com/photo-1497366216548-37526070297c?w=800&q=80",
    "https://images.unsplash.com/photo-1497366811353-6870744d04b2?w=800&q=80",
    "https://images.unsplash.com/photo-1504384308090-c894fdcc538d?w=800&q=80"
  ],
  warehouses: [
    "https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=800&q=80",
    "https://images.unsplash.com/photo-1553413077-190dd305871c?w=800&q=80"
  ],
  services: [
    "https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?w=800&q=80",
    "https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=800&q=80"
  ]
};

// Generate an additional 20 mock users/agents
for (let i = 1; i <= 20; i++) {
  const isAgent = i % 2 === 0;
  const gender = i % 3 === 0 ? 'female' : 'male';
  const firstName = FIRST_NAMES[(i * 3) % FIRST_NAMES.length];
  const lastName = LAST_NAMES[(i * 7) % LAST_NAMES.length];
  const name = `${firstName} ${lastName}`;
  const avatar = gender === 'female' 
    ? FEMALE_AVATARS[i % FEMALE_AVATARS.length] 
    : MALE_AVATARS[i % MALE_AVATARS.length];
  
  const rating = parseFloat((4.0 + (i % 11) * 0.1).toFixed(1));
  const reviewCount = (i * 4) + 3;
  const countryCode = i % 3 === 0 ? 'GH' : (i % 3 === 1 ? 'NG' : 'KE');
  const location = countryCode === 'GH' 
    ? GH_LOCATIONS[i % GH_LOCATIONS.length] 
    : (countryCode === 'NG' ? NG_LOCATIONS[i % NG_LOCATIONS.length] : KE_LOCATIONS[i % KE_LOCATIONS.length]);
  
  const bio = BIOS[i % BIOS.length];
  const idStr = `gen-user-${i}`;
  
  if (isAgent) {
    const agentObj: Agent = {
      id: idStr,
      name,
      avatar,
      rating,
      reviewCount,
      location,
      memberSince: `Mar 2024`,
      bio,
      verified: i % 4 !== 0,
      role: 'Agent',
      agencyName: AGENT_COMPANIES[i % AGENT_COMPANIES.length],
      socials: {
        email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}@example.com`,
        phone: countryCode === 'GH' ? `+233 24 ${1000000 + i}` : (countryCode === 'NG' ? `+234 80 ${10000000 + i}` : `+254 70 ${1000000 + i}`),
        whatsapp: countryCode === 'GH' ? `23324${1000000 + i}` : (countryCode === 'NG' ? `23480${10000000 + i}` : `25470${1000000 + i}`)
      }
    };
    MOCK_USERS.push(agentObj);
  } else {
    const userObj: User = {
      id: idStr,
      name,
      avatar,
      rating,
      reviewCount,
      location,
      memberSince: `Apr 2024`,
      bio,
      verified: i % 5 === 0,
      role: i % 5 === 1 ? 'Tenant' : 'Customer',
      socials: {
        email: `${firstName.toLowerCase()}@example.com`
      }
    };
    MOCK_USERS.push(userObj);
  }
}

// Generate an additional 55 mock properties (making total 65)
const categoriesKeys = ['houses', 'land', 'offices', 'warehouses', 'services'] as const;

for (let i = 1; i <= 55; i++) {
  const categoryId = categoriesKeys[i % categoriesKeys.length];
  const titleTemplates = LISTING_TITLES[categoryId];
  const baseTitle = titleTemplates[i % titleTemplates.length];
  
  const countryCode = i % 3 === 0 ? 'GH' : (i % 3 === 1 ? 'NG' : 'KE');
  const currency = countryCode === 'GH' ? 'GHS' : (countryCode === 'NG' ? 'NGN' : 'KES');
  
  const location = countryCode === 'GH' 
    ? GH_LOCATIONS[i % GH_LOCATIONS.length] 
    : (countryCode === 'NG' ? NG_LOCATIONS[i % NG_LOCATIONS.length] : KE_LOCATIONS[i % KE_LOCATIONS.length]);
  
  // High fidelity localized currency calculations
  let price = 500;
  if (categoryId === 'houses') {
    price = currency === 'GHS' ? (1500 + (i % 12) * 500) : (currency === 'NGN' ? (200000 + (i % 15) * 50000) : (35000 + (i % 10) * 12000));
  } else if (categoryId === 'land') {
    price = currency === 'GHS' ? (25000 + (i % 10) * 5000) : (currency === 'NGN' ? (5000000 + (i % 12) * 100000) : (1200000 + (i % 8) * 80000));
  } else if (categoryId === 'offices') {
    price = currency === 'GHS' ? (800 + (i % 8) * 200) : (currency === 'NGN' ? (50000 + (i % 10) * 10000) : (15000 + (i % 6) * 2000));
  } else if (categoryId === 'warehouses') {
    price = currency === 'GHS' ? (4000 + (i % 6) * 1000) : (currency === 'NGN' ? (450000 + (i % 8) * 20000) : (80000 + (i % 5) * 15000));
  } else {
    price = currency === 'GHS' ? (200 + (i % 5) * 50) : (currency === 'NGN' ? (10000 + (i % 5) * 2500) : (2500 + (i % 5) * 500));
  }
  
  const imagePool = IMAGES_POOL[categoryId];
  const imageUrl = imagePool[i % imagePool.length];
  
  // Pick an agent created dynamically above
  const sellerId = `gen-user-${((i * 2) % 20) || 2}`; 
  
  const propertyType = categoryId === 'houses' ? 'House' : (categoryId === 'land' ? 'Land' : (categoryId === 'offices' ? 'Office' : (categoryId === 'warehouses' ? 'Warehouse' : 'Apartment')));
  
  MOCK_LISTINGS.push({
    id: `gen-listing-${i}`,
    title: `${baseTitle} in ${location.split(',')[0]}`,
    price,
    currency,
    location,
    country: countryCode,
    imageUrl,
    images: [imageUrl],
    categoryId,
    isFeatured: i % 4 === 0,
    isPremium: i % 7 === 0,
    datePosted: new Date(Date.now() - (i % 15) * 24 * 60 * 60 * 1000).toISOString(),
    expiryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    sellerId,
    description: `A highly-recommended premium property classified listing located in the prime sector of ${location}. Experience maximum comfort, absolute convenience, superior finishing, premium access, and 24/7 security options optimized for high reliability.`,
    type: i % 3 === 0 ? 'Sale' : 'Rent',
    propertyType: propertyType as any,
    bedrooms: categoryId === 'houses' ? (1 + (i % 5)) : undefined,
    bathrooms: categoryId === 'houses' ? (1 + (i % 4)) : undefined,
    sqft: 400 + (i % 20) * 100,
    isVerified: i % 3 !== 0,
  });
}

export const getUser = (userId: string): User | undefined => {
  return MOCK_USERS.find(u => u.id === userId);
};
