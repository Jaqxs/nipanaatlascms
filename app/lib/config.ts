/**
 * GBMS GLOBAL CONFIGURATION
 */

export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://backend.nipanatlas.co.tz';
export const FRONTEND_URL = process.env.NEXT_PUBLIC_FRONTEND_URL || 'https://system.nipanaatlas.co.tz';

export const getApiUrl = (path: string) => {
  // If the path starts with http, return it as is
  if (path.startsWith('http')) return path;
  
  // Strip leading slash from path if present
  const cleanPath = path.startsWith('/') ? path.slice(1) : path;
  
  return `${API_BASE_URL}/${cleanPath}`;
};
