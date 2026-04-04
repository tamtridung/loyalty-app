import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const allowedOrigin = process.env.CORS_ALLOW_ORIGIN ?? '*';

function applyCorsHeaders(response: NextResponse): NextResponse {
  response.headers.set('Access-Control-Allow-Origin', allowedOrigin);
  response.headers.set('Access-Control-Allow-Methods', 'GET,POST,PATCH,PUT,DELETE,OPTIONS');
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  return response;
}

export function middleware(request: NextRequest) {
  if (request.method === 'OPTIONS') {
    return applyCorsHeaders(new NextResponse(null, { status: 204 }));
  }

  return applyCorsHeaders(NextResponse.next());
}

export const config = {
  matcher: ['/api/:path*'],
};
