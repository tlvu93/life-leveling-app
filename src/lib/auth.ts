import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { cookies } from "next/headers";
// import { SessionManager } from "./kv"; // Temporarily disabled for development

if (!process.env.JWT_SECRET) {
  throw new Error("JWT_SECRET environment variable is not set");
}

export interface AuthUser {
  id: string;
  ageRangeMin: number;
  ageRangeMax: number;
  familyModeEnabled: boolean;
  onboardingCompleted: boolean;
  createdAt: string;
}

export interface JWTPayload {
  userId: string;
  sessionId: string;
  user?: AuthUser; // For development without KV
  iat?: number;
  exp?: number;
}

export class AuthService {
  private static readonly JWT_SECRET = process.env.JWT_SECRET!;
  private static readonly JWT_EXPIRY = "7d";
  private static readonly COOKIE_NAME = "auth-token";

  // Hash password
  static async hashPassword(password: string): Promise<string> {
    const saltRounds = 12;
    return bcrypt.hash(password, saltRounds);
  }

  // Verify password
  static async verifyPassword(
    password: string,
    hashedPassword: string
  ): Promise<boolean> {
    return bcrypt.compare(password, hashedPassword);
  }

  // Generate JWT token
  static generateToken(payload: Omit<JWTPayload, "iat" | "exp">): string {
    return jwt.sign(payload, this.JWT_SECRET, {
      expiresIn: this.JWT_EXPIRY,
    });
  }

  // Verify JWT token
  static verifyToken(token: string): JWTPayload | null {
    try {
      return jwt.verify(token, this.JWT_SECRET) as JWTPayload;
    } catch (error) {
      console.error("Token verification failed:", error);
      return null;
    }
  }

  // Create authenticated session
  static async createAuthSession(user: AuthUser): Promise<string> {
    // For development: create session without KV store
    const sessionId = crypto.randomUUID();

    // Generate JWT token with user data embedded
    const token = jwt.sign(
      {
        userId: user.id,
        sessionId,
        user: user, // Embed user data in JWT for development
      },
      this.JWT_SECRET,
      { expiresIn: this.JWT_EXPIRY }
    );

    // Set HTTP-only cookie
    const cookieStore = await cookies();
    cookieStore.set(this.COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: "/",
    });

    return token;
  }

  // Get current user from session
  static async getCurrentUser(): Promise<AuthUser | null> {
    try {
      const cookieStore = await cookies();
      const token = cookieStore.get(this.COOKIE_NAME)?.value;

      if (!token) {
        return null;
      }

      const payload = jwt.verify(token, this.JWT_SECRET) as any;
      if (!payload || !payload.user) {
        return null;
      }

      return payload.user;
    } catch (error) {
      console.error("Get current user failed:", error);
      return null;
    }
  }

  // Logout user
  static async logout(): Promise<void> {
    try {
      const cookieStore = await cookies();
      // Clear cookie
      cookieStore.delete(this.COOKIE_NAME);
    } catch (error) {
      console.error("Logout failed:", error);
    }
  }

  // Check if user is authenticated
  static async isAuthenticated(): Promise<boolean> {
    const user = await this.getCurrentUser();
    return user !== null;
  }

  // Get current user from request (for middleware)
  static async getCurrentUserFromRequest(
    request: Request
  ): Promise<AuthUser | null> {
    try {
      // Get token from cookie header
      const cookieHeader = request.headers.get("cookie");
      if (!cookieHeader) {
        return null;
      }

      const cookies = Object.fromEntries(
        cookieHeader.split("; ").map((cookie) => {
          const [name, value] = cookie.split("=");
          return [name, decodeURIComponent(value)];
        })
      );

      const token = cookies[this.COOKIE_NAME];
      if (!token) {
        return null;
      }

      const payload = jwt.verify(token, this.JWT_SECRET) as unknown;
      if (!payload || !payload.user) {
        return null;
      }

      return payload.user;
    } catch (error) {
      console.error("Get current user from request failed:", error);
      return null;
    }
  }

  // Get user ID from request token
  static async getUserIdFromRequest(request: Request): Promise<string | null> {
    const user = await this.getCurrentUserFromRequest(request);
    return user?.id || null;
  }
}

// Helper functions for easier use in API routes
export async function getTokenUserId(request: Request): Promise<string | null> {
  return AuthService.getUserIdFromRequest(request);
}

export function verifyToken(token: string): JWTPayload | null {
  return AuthService.verifyToken(token);
}
