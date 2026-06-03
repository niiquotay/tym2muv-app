const CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME || 'demo';

export interface ImageOptions {
  width?: number;
  height?: number;
  quality?: string | number; // 'auto' or number
  format?: 'auto' | 'webp' | 'jpeg' | 'png';
  crop?: string;
}

export function getOptimizedImageUrl(publicIdOrUrl: string | undefined | null, options: ImageOptions = {}): string {
  if (!publicIdOrUrl) return "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 1 1'%3E%3C/svg%3E";
  
  const {
    width,
    height,
    quality = 'auto',
    format = 'auto',
    crop = 'fill'
  } = options;

  let transformations = `f_${format},q_${quality}`;
  if (width) transformations += `,w_${width}`;
  if (height) transformations += `,h_${height}`;
  if (crop) transformations += `,c_${crop}`;

  const version = '?v=20260523'; // Cache busting

  if (publicIdOrUrl.startsWith('http')) {
    // Already a Cloudinary URL?
    if (publicIdOrUrl.includes('res.cloudinary.com')) return publicIdOrUrl;
    
    // Auto-fetch for external URLs
    return `https://res.cloudinary.com/${CLOUD_NAME}/image/fetch/${transformations}/${encodeURIComponent(publicIdOrUrl)}${version}`;
  }

  // Native Cloudinary public ID
  return `https://res.cloudinary.com/${CLOUD_NAME}/image/upload/${transformations}/${publicIdOrUrl}${version}`;
}
