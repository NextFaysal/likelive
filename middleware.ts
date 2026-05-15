import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { getToken } from "next-auth/jwt"

// This middleware protects routes that require authentication
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Auth routes - redirect to dashboard if already authenticated
  const authRoutes = ["/login", "/register"]

  // Gracefully handle JWT decryption failures (e.g., stale cookies with
  // a mismatched NEXTAUTH_SECRET) by treating them as unauthenticated
  let token = null
  try {
    token = await getToken({
      req: request,
      secret: process.env.NEXTAUTH_SECRET,
    })
  } catch {
    // Decryption failed — clear the invalid session cookie and treat as
    // unauthenticated so the user is redirected to login cleanly
    const response = NextResponse.redirect(new URL("/login", request.url))
    response.cookies.set("next-auth.session-token", "", {
      maxAge: 0,
      path: "/",
    })
    // Protected routes need the redirect; non-protected can just proceed
    const isProtectedRoute =
      pathname === "/" ||
      pathname.startsWith("/recordings") ||
      pathname.startsWith("/room/")

    if (isProtectedRoute) {
      return response
    }
    // For non-protected routes, just continue without the bad cookie
    const cleanResponse = NextResponse.next()
    cleanResponse.cookies.set("next-auth.session-token", "", {
      maxAge: 0,
      path: "/",
    })
    return cleanResponse
  }

  // Protected routes that require authentication
  const isProtectedRoute =
    pathname === "/" ||
    pathname.startsWith("/recordings") ||
    pathname.startsWith("/room/")

  // Redirect unauthenticated users to login
  if (!token && isProtectedRoute) {
    const loginUrl = new URL("/login", request.url)
    loginUrl.searchParams.set("callbackUrl", pathname)
    return NextResponse.redirect(loginUrl)
  }

  // Redirect authenticated users away from auth pages
  if (token && authRoutes.some((route) => pathname.startsWith(route))) {
    return NextResponse.redirect(new URL("/", request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (public folder)
     */
    "/((?!api|_next/static|_next/image|favicon.ico|.*\\..*$).*)",
  ],
}
