import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 1. Get the cookie
  const isAuthenticated = request.cookies.get('session_active');

  // 2. Define Public Paths
  const isPublicPath = 
    pathname === '/' || 
    pathname === '/login' || 
    pathname === '/register';

  // 3. STRICT Internal Check: Only ignore actual static folders and API
  const isStaticAsset = 
    pathname.startsWith('/_next/') || 
    pathname.startsWith('/api/') ||
    pathname === '/favicon.ico';

  // DEBUG: Check terminal to see why a page is being allowed
  console.log(`Path: ${pathname} | Auth: ${!!isAuthenticated} | Public: ${isPublicPath}`);

  // 4. Redirect Logic
  if (!isAuthenticated && !isPublicPath && !isStaticAsset) {
    return NextResponse.redirect(new URL('/register', request.url));
  }

  return NextResponse.next();
}

export const config = {
  // Catch everything except specific Next.js internals
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};