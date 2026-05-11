import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Log all API calls and page requests to the server console
  console.log(`[REQUEST] ${request.method} ${pathname} - ${new Date().toISOString()}`);
  
  return NextResponse.next();
}

// Only log relevant paths
export const config = {
  matcher: ['/api/:path*', '/((?!_next/static|_next/image|favicon.ico).*)'],
};
