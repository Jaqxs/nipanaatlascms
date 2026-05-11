/**
 * GBMS GLOBAL CONFIGURATION
 */

export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || '';
export const FRONTEND_URL = process.env.NEXT_PUBLIC_FRONTEND_URL || 'https://system.nipanaatlas.co.tz';

export const getApiUrl = (path: string) => {
  // If the path starts with http, return it as is
  if (path.startsWith('http')) return path;
  
  // Strip leading slash from path if present
  const cleanPath = path.startsWith('/') ? path.slice(1) : path;
  
  // In development, if no API_BASE_URL is set, use relative paths
  if (!API_BASE_URL) {
    return `/${cleanPath}`;
  }
  
  return `${API_BASE_URL}/${cleanPath}`;
};
