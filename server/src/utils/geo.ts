// Geospatial utilities for location-based queries

/**
 * Earth's radius in kilometers
 */
export const EARTH_RADIUS_KM = 6371;

/**
 * Convert kilometers to meters
 */
export const kmToMeters = (km: number): number => km * 1000;

/**
 * Convert meters to kilometers
 */
export const metersToKm = (meters: number): number => meters / 1000;

/**
 * Calculate distance between two points using Haversine formula
 * @param lat1 Latitude of point 1
 * @param lng1 Longitude of point 1
 * @param lat2 Latitude of point 2
 * @param lng2 Longitude of point 2
 * @returns Distance in kilometers
 */
export const calculateDistance = (
  lat1: number, 
  lng1: number, 
  lat2: number, 
  lng2: number
): number => {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * 
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  
  return EARTH_RADIUS_KM * c;
};

/**
 * Validate coordinates
 */
export const isValidCoordinates = (lng: number, lat: number): boolean => {
  return lng >= -180 && lng <= 180 && lat >= -90 && lat <= 90;
};

/**
 * Create a GeoJSON Point object
 */
export const createPoint = (lng: number, lat: number): { type: 'Point'; coordinates: [number, number] } => {
  if (!isValidCoordinates(lng, lat)) {
    throw new Error('Invalid coordinates');
  }
  return {
    type: 'Point',
    coordinates: [lng, lat]
  };
};

/**
 * Default search radiuses in kilometers
 */
export const DEFAULT_RADIUSES = {
  nearby: 10,    // For "nearby" queries
  city: 25,      // Within city
  region: 50,    // Regional search
  wide: 100      // Wide area search
};

/**
 * Build MongoDB geospatial query for $geoNear
 */
export const buildGeoNearStage = (
  lng: number, 
  lat: number, 
  maxDistanceKm: number = DEFAULT_RADIUSES.city,
  additionalQuery: Record<string, unknown> = {}
) => {
  return {
    $geoNear: {
      near: {
        type: 'Point',
        coordinates: [lng, lat]
      },
      distanceField: 'distance',
      maxDistance: kmToMeters(maxDistanceKm),
      query: additionalQuery,
      spherical: true,
      distanceMultiplier: 0.001 // Convert to km in output
    }
  };
};

/**
 * Popular Indian cities with approximate coordinates
 * Used for default location when geolocation is unavailable
 */
export const INDIAN_CITIES = {
  'Mumbai': { lat: 19.0760, lng: 72.8777 },
  'Delhi': { lat: 28.6139, lng: 77.2090 },
  'Bangalore': { lat: 12.9716, lng: 77.5946 },
  'Hyderabad': { lat: 17.3850, lng: 78.4867 },
  'Chennai': { lat: 13.0827, lng: 80.2707 },
  'Kolkata': { lat: 22.5726, lng: 88.3639 },
  'Pune': { lat: 18.5204, lng: 73.8567 },
  'Ahmedabad': { lat: 23.0225, lng: 72.5714 },
  'Jaipur': { lat: 26.9124, lng: 75.7873 },
  'Lucknow': { lat: 26.8467, lng: 80.9462 }
};

/**
 * Get city coordinates by name
 */
export const getCityCoordinates = (cityName: string): { lat: number; lng: number } | null => {
  const normalizedName = cityName.trim();
  const city = Object.entries(INDIAN_CITIES).find(
    ([name]) => name.toLowerCase() === normalizedName.toLowerCase()
  );
  return city ? city[1] : null;
};

/**
 * Format distance for display
 */
export const formatDistance = (distanceKm: number): string => {
  if (distanceKm < 1) {
    return `${Math.round(distanceKm * 1000)} m`;
  }
  if (distanceKm < 10) {
    return `${distanceKm.toFixed(1)} km`;
  }
  return `${Math.round(distanceKm)} km`;
};
