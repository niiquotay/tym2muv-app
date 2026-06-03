
/**
 * Generates a standardized listing title based on property details.
 * Format: "{Bedrooms} Bedroom | {Property Type} | {Location}"
 */
export const generateListingTitle = (details: {
  bedrooms?: number | string;
  propertyType?: string;
  location?: string;
}): string => {
  const parts: string[] = [];

  if (details.bedrooms) {
    const beds = Number(details.bedrooms);
    parts.push(`${beds} ${beds === 1 ? 'Bedroom' : 'Bedrooms'}`);
  }

  if (details.propertyType) {
    parts.push(details.propertyType);
  }

  return parts.join(' | ');
};
