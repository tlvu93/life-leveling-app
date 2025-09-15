import { NextRequest, NextResponse } from "next/server";
import { AuthService } from "@/lib/auth";

// Define protected routes that require authentication
const protectedRoutes = [
  "/dashboard",
  "/onboarding",
  "/goals",
  "/retrospectives",
  "/architect",
  "/adventure",
  "/profile",
  "/family",
];

// Define public routes that should redirect to dashboard if authenticated
const publicRoutes = ["/login", "/register"];

// API routes that require authentication
const protectedApiRoutes = [
  "/api/user",
  "/api/goals",
  "/api/interests",
  "/api/retrospectives",
  "/api/simulation",
  "/api/family",
];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip middleware for static files and API routes that don't need auth
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api/auth") ||
    pathname.startsWith("/api/health") ||
    pathname.startsWith("/api/init-db") ||
    pathname.startsWith("/api/seed-db") ||
    pathname.startsWith("/api/test-db") ||
    pathname.includes(".")
  ) {
    return NextResponse.next();
  }

  try {
    // Check if user is authenticated
    const currentUser = await AuthService.getCurrentUserFromRequest(request);
    const isAuthenticated = currentUser !== null;

    // Handle protected routes
    if (protectedRoutes.some((route) => pathname.startsWith(route))) {
      if (!isAuthenticated) {
        // Redirect to login with return URL
        const loginUrl = new URL("/login", request.url);
        loginUrl.searchParams.set("returnUrl", pathname);
        return NextResponse.redirect(loginUrl);
      }

      // Check if user needs to complete onboarding
      if (
        currentUser &&
        !currentUser.onboardingCompleted &&
        pathname !== "/onboarding"
      ) {
        return NextResponse.redirect(new URL("/onboarding", request.url));
      }
    }

    // Handle protected API routes
    if (protectedApiRoutes.some((route) => pathname.startsWith(route))) {
      if (!isAuthenticated) {
        return NextResponse.json(
          { success: false, error: "Authentication required" },
          { status: 401 }
        );
      }
    }

    // Handle public routes (redirect to dashboard if already authenticated)
    if (publicRoutes.some((route) => pathname.startsWith(route))) {
      if (isAuthenticated) {
        // Check if user needs onboarding
        if (currentUser && !currentUser.onboardingCompleted) {
          return NextResponse.redirect(new URL("/onboarding", request.url));
        }
        return NextResponse.redirect(new URL("/dashboard", request.url));
      }
    }

    // Handle root route
    if (pathname === "/") {
      if (isAuthenticated) {
        // Check if user needs onboarding
        if (currentUser && !currentUser.onboardingCompleted) {
          return NextResponse.redirect(new URL("/onboarding", request.url));
        }
        return NextResponse.redirect(new URL("/dashboard", request.url));
      }
      // Show landing page for unauthenticated users
      return NextResponse.next();
    }

    return NextResponse.next();
  } catch (error) {
    console.error("Middleware error:", error);

    // If there's an error with authentication, redirect to login for protected routes
    if (protectedRoutes.some((route) => pathname.startsWith(route))) {
      return NextResponse.redirect(new URL("/login", request.url));
    }

    // For API routes, return error
    if (protectedApiRoutes.some((route) => pathname.startsWith(route))) {
      return NextResponse.json(
        { success: false, error: "Authentication error" },
        { status: 500 }
      );
    }

    return NextResponse.next();
  }
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
