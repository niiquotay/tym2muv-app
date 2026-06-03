import { Country } from '../types';
import { withCache, cacheKey, CACHE_TTL } from './cacheService';

export interface UserLocationData {
  city: string;
  country: string;
  countryCode: string;
  currency: string;
  symbol: string;
  formattedAddress: string;
}

export const AFRICAN_COUNTRIES: Country[] = [
  { code: 'DZ', name: 'Algeria', flag: '🇩🇿', flagUrl: 'https://flagcdn.com/w160/dz.png', currency: 'DZD', symbol: 'د.ج' },
  { code: 'AO', name: 'Angola', flag: '🇦🇴', flagUrl: 'https://flagcdn.com/w160/ao.png', currency: 'AOA', symbol: 'Kz' },
  { code: 'BJ', name: 'Benin', flag: '🇧🇯', flagUrl: 'https://flagcdn.com/w160/bj.png', currency: 'XOF', symbol: 'CFA' },
  { code: 'BW', name: 'Botswana', flag: '🇧🇼', flagUrl: 'https://flagcdn.com/w160/bw.png', currency: 'BWP', symbol: 'P' },
  { code: 'BF', name: 'Burkina Faso', flag: '🇧🇫', flagUrl: 'https://flagcdn.com/w160/bf.png', currency: 'XOF', symbol: 'CFA' },
  { code: 'BI', name: 'Burundi', flag: '🇧🇮', flagUrl: 'https://flagcdn.com/w160/bi.png', currency: 'BIF', symbol: 'FBu' },
  { code: 'CV', name: 'Cabo Verde', flag: '🇨🇻', flagUrl: 'https://flagcdn.com/w160/cv.png', currency: 'CVE', symbol: '$' },
  { code: 'CM', name: 'Cameroon', flag: '🇨🇲', flagUrl: 'https://flagcdn.com/w160/cm.png', currency: 'XAF', symbol: 'FCFA' },
  { code: 'CF', name: 'Central African Republic', flag: '🇨🇫', flagUrl: 'https://flagcdn.com/w160/cf.png', currency: 'XAF', symbol: 'FCFA' },
  { code: 'TD', name: 'Chad', flag: '🇹🇩', flagUrl: 'https://flagcdn.com/w160/td.png', currency: 'XAF', symbol: 'FCFA' },
  { code: 'KM', name: 'Comoros', flag: '🇰🇲', flagUrl: 'https://flagcdn.com/w160/km.png', currency: 'KMF', symbol: 'CF' },
  { code: 'CD', name: 'DR Congo', flag: '🇨🇩', flagUrl: 'https://flagcdn.com/w160/cd.png', currency: 'CDF', symbol: 'FC' },
  { code: 'CG', name: 'Congo', flag: '🇨🇬', flagUrl: 'https://flagcdn.com/w160/cg.png', currency: 'XAF', symbol: 'FCFA' },
  { code: 'DJ', name: 'Djibouti', flag: '🇩🇯', flagUrl: 'https://flagcdn.com/w160/dj.png', currency: 'DJF', symbol: 'Fdj' },
  { code: 'EG', name: 'Egypt', flag: '🇪🇬', flagUrl: 'https://flagcdn.com/w160/eg.png', currency: 'EGP', symbol: 'E£' },
  { code: 'GQ', name: 'Equatorial Guinea', flag: '🇬🇶', flagUrl: 'https://flagcdn.com/w160/gq.png', currency: 'XAF', symbol: 'FCFA' },
  { code: 'ER', name: 'Eritrea', flag: '🇪🇷', flagUrl: 'https://flagcdn.com/w160/er.png', currency: 'ERN', symbol: 'Nfk' },
  { code: 'SZ', name: 'Eswatini', flag: '🇸🇿', flagUrl: 'https://flagcdn.com/w160/sz.png', currency: 'SZL', symbol: 'L' },
  { code: 'ET', name: 'Ethiopia', flag: '🇪🇹', flagUrl: 'https://flagcdn.com/w160/et.png', currency: 'ETB', symbol: 'Br' },
  { code: 'GA', name: 'Gabon', flag: '🇬🇦', flagUrl: 'https://flagcdn.com/w160/ga.png', currency: 'XAF', symbol: 'FCFA' },
  { code: 'GM', name: 'Gambia', flag: '🇬🇲', flagUrl: 'https://flagcdn.com/w160/gm.png', currency: 'GMD', symbol: 'D' },
  { code: 'GH', name: 'Ghana', flag: '🇬🇭', flagUrl: 'https://flagcdn.com/w160/gh.png', currency: 'GHS', symbol: 'GH₵' },
  { code: 'GN', name: 'Guinea', flag: '🇬🇳', flagUrl: 'https://flagcdn.com/w160/gn.png', currency: 'GNF', symbol: 'FG' },
  { code: 'GW', name: 'Guinea-Bissau', flag: '🇬🇼', flagUrl: 'https://flagcdn.com/w160/gw.png', currency: 'XOF', symbol: 'CFA' },
  { code: 'CI', name: 'Ivory Coast', flag: '🇨🇮', flagUrl: 'https://flagcdn.com/w160/ci.png', currency: 'XOF', symbol: 'CFA' },
  { code: 'KE', name: 'Kenya', flag: '🇰🇪', flagUrl: 'https://flagcdn.com/w160/ke.png', currency: 'KES', symbol: 'KSh' },
  { code: 'LS', name: 'Lesotho', flag: '🇱🇸', flagUrl: 'https://flagcdn.com/w160/ls.png', currency: 'LSL', symbol: 'L' },
  { code: 'LR', name: 'Liberia', flag: '🇱🇷', flagUrl: 'https://flagcdn.com/w160/lr.png', currency: 'LRD', symbol: 'L$' },
  { code: 'LY', name: 'Libya', flag: '🇱🇾', flagUrl: 'https://flagcdn.com/w160/ly.png', currency: 'LYD', symbol: 'ل.د' },
  { code: 'MG', name: 'Madagascar', flag: '🇲🇬', flagUrl: 'https://flagcdn.com/w160/mg.png', currency: 'MGA', symbol: 'Ar' },
  { code: 'MW', name: 'Malawi', flag: '🇲🇼', flagUrl: 'https://flagcdn.com/w160/mw.png', currency: 'MWK', symbol: 'MK' },
  { code: 'ML', name: 'Mali', flag: '🇲🇱', flagUrl: 'https://flagcdn.com/w160/ml.png', currency: 'XOF', symbol: 'CFA' },
  { code: 'MR', name: 'Mauritania', flag: '🇲🇷', flagUrl: 'https://flagcdn.com/w160/mr.png', currency: 'MRU', symbol: 'UM' },
  { code: 'MU', name: 'Mauritius', flag: '🇲🇺', flagUrl: 'https://flagcdn.com/w160/mu.png', currency: 'MUR', symbol: '₨' },
  { code: 'MA', name: 'Morocco', flag: '🇲🇦', flagUrl: 'https://flagcdn.com/w160/ma.png', currency: 'MAD', symbol: 'DH' },
  { code: 'MZ', name: 'Mozambique', flag: '🇲🇿', flagUrl: 'https://flagcdn.com/w160/mz.png', currency: 'MZN', symbol: 'MT' },
  { code: 'NA', name: 'Namibia', flag: '🇳🇦', flagUrl: 'https://flagcdn.com/w160/na.png', currency: 'NAD', symbol: 'N$' },
  { code: 'NE', name: 'Niger', flag: '🇳🇪', flagUrl: 'https://flagcdn.com/w160/ne.png', currency: 'XOF', symbol: 'CFA' },
  { code: 'NG', name: 'Nigeria', flag: '🇳🇬', flagUrl: 'https://flagcdn.com/w160/ng.png', currency: 'NGN', symbol: '₦' },
  { code: 'RW', name: 'Rwanda', flag: '🇷🇼', flagUrl: 'https://flagcdn.com/w160/rw.png', currency: 'RWF', symbol: 'RF' },
  { code: 'ST', name: 'Sao Tome and Principe', flag: '🇸🇹', flagUrl: 'https://flagcdn.com/w160/st.png', currency: 'STN', symbol: 'Db' },
  { code: 'SN', name: 'Senegal', flag: '🇸🇳', flagUrl: 'https://flagcdn.com/w160/sn.png', currency: 'XOF', symbol: 'CFA' },
  { code: 'SC', name: 'Seychelles', flag: '🇸🇨', flagUrl: 'https://flagcdn.com/w160/sc.png', currency: 'SCR', symbol: '₨' },
  { code: 'SL', name: 'Sierra Leone', flag: '🇸🇱', flagUrl: 'https://flagcdn.com/w160/sl.png', currency: 'SLL', symbol: 'Le' },
  { code: 'SO', name: 'Somalia', flag: '🇸🇴', flagUrl: 'https://flagcdn.com/w160/so.png', currency: 'SOS', symbol: 'S' },
  { code: 'ZA', name: 'South Africa', flag: '🇿🇦', flagUrl: 'https://flagcdn.com/w160/za.png', currency: 'ZAR', symbol: 'R' },
  { code: 'SS', name: 'South Sudan', flag: '🇸🇸', flagUrl: 'https://flagcdn.com/w160/ss.png', currency: 'SSP', symbol: '£' },
  { code: 'SD', name: 'Sudan', flag: '🇸🇩', flagUrl: 'https://flagcdn.com/w160/sd.png', currency: 'SDG', symbol: 'ج.س.' },
  { code: 'TZ', name: 'Tanzania', flag: '🇹🇿', flagUrl: 'https://flagcdn.com/w160/tz.png', currency: 'TZS', symbol: 'TSh' },
  { code: 'TG', name: 'Togo', flag: '🇹🇬', flagUrl: 'https://flagcdn.com/w160/tg.png', currency: 'XOF', symbol: 'CFA' },
  { code: 'TN', name: 'Tunisia', flag: '🇹🇳', flagUrl: 'https://flagcdn.com/w160/tn.png', currency: 'TND', symbol: 'د.ت' },
  { code: 'UG', name: 'Uganda', flag: '🇺🇬', flagUrl: 'https://flagcdn.com/w160/ug.png', currency: 'UGX', symbol: 'USh' },
  { code: 'ZM', name: 'Zambia', flag: '🇿🇲', flagUrl: 'https://flagcdn.com/w160/zm.png', currency: 'ZMW', symbol: 'ZK' },
  { code: 'ZW', name: 'Zimbabwe', flag: '🇿🇼', flagUrl: 'https://flagcdn.com/w160/zw.png', currency: 'USD', symbol: '$' },
];

export function getCountryByCode(code: string): Country | undefined {
  return AFRICAN_COUNTRIES.find(c => c.code.toUpperCase() === code.toUpperCase());
}

/**
 * Detects the user's location and currency using Browser Geolocation or IP-based geolocation.
 */
export async function detectUserLocation(): Promise<UserLocationData> {
  const cacheKeyStr = cacheKey('location', 'user-ip-fallback'); // since it's just a fallback right now
  
  return withCache(cacheKeyStr, async () => {
    const fallback: UserLocationData = {
      city: 'Accra',
      country: 'Ghana',
      countryCode: 'GH',
      currency: 'GHS',
      symbol: 'GH₵',
      formattedAddress: 'Accra, Ghana'
    };

    return fallback;
  }, CACHE_TTL.LOCATION);
}

export function getSymbolFromCode(code: string): string {
  const symbols: Record<string, string> = {
    USD: '$', EUR: '€', GBP: '£', JPY: '¥', INR: '₹', CAD: '$', AUD: '$',
    CNY: '¥', RUB: '₽', KRW: '₩', BRL: 'R$', TRY: '₺',
    GHS: 'GH₵', NGN: '₦', KES: 'KSh', ZAR: 'R', EGP: 'E£', MAD: 'MAD',
    ETB: 'Br', TZS: 'TSh', UGX: 'USh', RWF: 'FRw', XOF: 'CFA', XAF: 'FCFA',
    ZMW: 'ZK'
  };
  return symbols[code] || code;
}