/**
 * GBMS GLOBAL CONFIGURATION
 */

// The Sync Hub URL (Your Dokploy backend)
export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://backend.nipanaatlas.co.tz';
export const FRONTEND_URL = process.env.NEXT_PUBLIC_FRONTEND_URL || 'https://system.nipanaatlas.co.tz';

export const getApiUrl = (path: string) => {
  // If the path starts with http, return it as is
  if (path.startsWith('http')) return path;
  
  // Strip leading slash from path if present
  const cleanPath = path.startsWith('/') ? path.slice(1) : path;
  
  // If API_BASE_URL is configured, use it for ALL environments
  // This ensures local dev can sync with the cloud hub.
  if (API_BASE_URL) {
    const baseUrl = API_BASE_URL.endsWith('/') ? API_BASE_URL.slice(0, -1) : API_BASE_URL;
    return `${baseUrl}/${cleanPath}`;
  }
  
  return `/${cleanPath}`;
};

// Log configuration status on server-side startup
if (typeof window === 'undefined') {
  console.log('--------------------------------------------------');
  console.log('GBMS SYSTEM INITIALIZED');
  console.log(`DOMAIN: ${FRONTEND_URL}`);
  console.log(`SYNC HUB: ${API_BASE_URL || 'Using relative paths'}`);
  console.log('--------------------------------------------------');
}
