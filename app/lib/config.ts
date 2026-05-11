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
  
  // SMART ROUTING: If we are on localhost, ALWAYS use relative paths 
  // to avoid CORS or DNS issues with the production backend.
  if (typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')) {
    return `/${cleanPath}`;
  }
  
  // Fallback to absolute URL if configured
  if (API_BASE_URL) {
    return `${API_BASE_URL}/${cleanPath}`;
  }
  
  return `/${cleanPath}`;
};
