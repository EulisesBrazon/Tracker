import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Protect routes: require token cookie. Exclude login route, public and _next.
export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Allow Next internals and public files
  if (pathname.startsWith('/_next') || pathname.startsWith('/static') || pathname.startsWith('/favicon.ico') || pathname.startsWith('/public')) {
    return NextResponse.next();
  }

  // Allow login endpoint and page
  if (pathname === '/api/auth/login' || pathname === '/api/auth' || pathname === '/login' || pathname === '/') {
    return NextResponse.next();
  }

  const token = req.cookies.get('token')?.value;

  // API requests: return 401 if missing, except for /api/cron/sync
  if (pathname.startsWith('/api')) {
    if (pathname === '/api/cron/sync') {
      return NextResponse.next();
    }
    if (!token) {
      return new NextResponse(JSON.stringify({ message: 'Unauthorized' }), { status: 401, headers: { 'content-type': 'application/json' } });
    }
    return NextResponse.next();
  }

  // Pages: redirect to root/login if not authenticated
  if (!token) {
    const url = req.nextUrl.clone();
    url.pathname = '/';
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  // apply middleware to all routes
  matcher: '/:path*',
};
