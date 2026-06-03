
import React from 'react';
import { 
  Home, Truck, Shield, AlertCircle, Database, Car, Briefcase, Smartphone, Armchair, Shirt, Wrench, PawPrint, Sprout, Baby, GraduationCap, Coins, Palette, BookHeart, Building2, Box, Search, Plus, Menu, SlidersHorizontal, ArrowUpDown, ChevronRight, ChevronDown, MapPin, Utensils, Heart, Activity, Globe, Gamepad2, Music, Mic, Camera, Loader2, X, Star, Check, Send, Sparkles, MessageCircle, User, MessageSquare, Facebook, Instagram, Twitter, Linkedin, Phone, Mail, Calendar, Clock, Navigation, Package, Map, ExternalLink, Info, Bell, Settings, LogOut, Trash2, Edit3, Image as ImageIcon, Upload, Download, Filter, Share2, ArrowLeft, ShieldCheck, Copy, Key, Eye, EyeOff, Lock, Unlock, CreditCard, Wallet, ShoppingCart, Tag, Gift, Award, Trophy, Target, Zap, Flame, Leaf, Sun, Moon, Cloud, Wind, Droplets, Thermometer, Video, Bed, Bath, ParkingCircle, Maximize, DollarSign, Layout, LucideIcon 
} from 'lucide-react';

interface IconProps extends React.SVGProps<SVGSVGElement> {
  name: string;
  size?: number;
  variant?: 'default' | '3d' | 'flat';
  color?: string;
}

const iconMap: Record<string, LucideIcon> = {
  home: Home,
  truck: Truck,
  shield: Shield,
  alert: AlertCircle,
  database: Database,
  layout: Layout,
  car: Car,
  briefcase: Briefcase,
  smartphone: Smartphone,
  armchair: Armchair,
  shirt: Shirt,
  wrench: Wrench,
  paw: PawPrint,
  sprout: Sprout,
  baby: Baby,
  graduation: GraduationCap,
  coins: Coins,
  palette: Palette,
  "book-heart": BookHeart,
  building: Building2,
  box: Box,
  search: Search,
  plus: Plus,
  menu: Menu,
  sliders: SlidersHorizontal,
  sort: ArrowUpDown,
  chevronRight: ChevronRight,
  chevronDown: ChevronDown,
  mapPin: MapPin,
  utensils: Utensils,
  heart: Heart,
  activity: Activity,
  globe: Globe,
  gamepad: Gamepad2,
  music: Music,
  mic: Mic,
  camera: Camera,
  loader: Loader2,
  x: X,
  star: Star,
  check: Check,
  send: Send,
  sparkles: Sparkles,
  messageCircle: MessageCircle,
  user: User,
  whatsapp: MessageSquare,
  facebook: Facebook,
  instagram: Instagram,
  twitter: Twitter,
  linkedin: Linkedin,
  phone: Phone,
  mail: Mail,
  calendar: Calendar,
  clock: Clock,
  navigation: Navigation,
  package: Package,
  map: Map,
  external: ExternalLink,
  info: Info,
  bell: Bell,
  settings: Settings,
  logout: LogOut,
  trash: Trash2,
  edit: Edit3,
  image: ImageIcon,
  upload: Upload,
  download: Download,
  filter: Filter,
  share: Share2,
  share2: Share2,
  arrowLeft: ArrowLeft,
  shieldCheck: ShieldCheck,
  copy: Copy,
  key: Key,
  eye: Eye,
  eyeOff: EyeOff,
  lock: Lock,
  unlock: Unlock,
  creditCard: CreditCard,
  wallet: Wallet,
  shoppingCart: ShoppingCart,
  tag: Tag,
  gift: Gift,
  award: Award,
  trophy: Trophy,
  target: Target,
  zap: Zap,
  flame: Flame,
  leaf: Leaf,
  sun: Sun,
  moon: Moon,
  cloud: Cloud,
  wind: Wind,
  droplets: Droplets,
  thermometer: Thermometer,
  video: Video,
  bed: Bed,
  bath: Bath,
  parking: ParkingCircle,
  security: ShieldCheck,
  maximize: Maximize,
  dollarSign: DollarSign,
};

const Icon: React.FC<IconProps> = ({ 
  name, 
  className = "", 
  size = 24, 
  variant = 'default',
  color,
  ...props 
}) => {
  const LucideIconComponent = iconMap[name] || Box;

  if (variant === '3d') {
    return (
      <div className={`relative flex items-center justify-center ${className} icon-3d`} style={{ width: size, height: size }}>
        {/* Shadow Layer - Bottom right offset */}
        <LucideIconComponent 
          size={size} 
          className="absolute text-slate-900/10 translate-y-1.5 translate-x-1 blur-[2px]" 
          strokeWidth={2.5}
        />
        {/* Depth Layer - Subtle thickness */}
        <LucideIconComponent 
          size={size} 
          className="absolute text-slate-400/30 translate-y-[1px] translate-x-[0.5px]" 
          strokeWidth={3}
        />
        {/* Highlight Layer - Top left offset */}
        <LucideIconComponent 
          size={size} 
          className="absolute text-white/40 -translate-y-[0.5px] -translate-x-[0.5px]" 
          strokeWidth={1.5}
        />
        {/* Main Icon */}
        <LucideIconComponent 
          size={size} 
          className="relative text-current drop-shadow-sm" 
          strokeWidth={2}
          {...props}
        />
      </div>
    );
  }

  return (
    <LucideIconComponent 
      size={size} 
      className={className} 
      strokeWidth={2}
      {...props} 
    />
  );
};

export default Icon;
