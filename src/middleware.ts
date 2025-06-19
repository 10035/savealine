import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(req: NextRequest) {
  const res = NextResponse.next();
  const supabase = createMiddlewareClient({ req, res });

  // Refresh session if expired
  const { data: { session } } = await supabase.auth.getSession();

  console.log('Middleware - Path:', req.nextUrl.pathname);
  console.log('Middleware - Session exists:', !!session);
  console.log('Middleware - User ID:', session?.user?.id);

  // Temporarily disabled for testing
  // if (req.nextUrl.pathname.startsWith('/api/') && !session) {
  //   console.log('Middleware - Blocking request: No session');
  //   return NextResponse.json(
  //     { error: 'Authentication required' },
  //     { status: 401 }
  //   );
  // }

  return res;
}

export const config = {
  matcher: ['/api/:path*']
}; 