import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Simple middleware that allows all routes for now
// You can add authentication logic here later
export function middleware(request: NextRequest) {
  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!.*\\..*|_next).*)",
    "/",
    "/(api|trpc)(.*)",
  ],
}; 