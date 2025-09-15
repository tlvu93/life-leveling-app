import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { cookies } from "next/headers";
import { SessionManager } from "./kv";

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
    // Create session in KV store
    const sessionId = await SessionManager.createSession(user.id, {
      user,
      lastActivity: new Date().toISOString(),
    });

    // Generate JWT token
    const token = this.generateToken({ userId: user.id, sessionId });

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

      const payload = this.verifyToken(token);
      if (!payload) {
        return null;
      }

      // Get session from KV store
      const session = await SessionManager.getSession(payload.sessionId);
      if (!session || session.userId !== payload.userId) {
        return null;
      }

      // Update last activity
      await SessionManager.updateSession(payload.sessionId, {
        lastActivity: new Date().toISOString(),
      });

      return session.user;
    } catch (error) {
      console.error("Get current user failed:", error);
      return null;
    }
  }

  // Logout user
  static async logout(): Promise<void> {
    try {
      const cookieStore = await cookies();
      const token = cookieStore.get(this.COOKIE_NAME)?.value;

      if (token) {
        const payload = this.verifyToken(token);
        if (payload) {
          // Delete session from KV store
          await SessionManager.deleteSession(payload.sessionId);
        }
      }

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

      const payload = this.verifyToken(token);
      if (!payload) {
        return null;
      }

      // Get session from KV store
      const session = await SessionManager.getSession(payload.sessionId);
      if (!session || session.userId !== payload.userId) {
        return null;
      }

      return session.user;
    } catch (error) {
      console.error("Get current user from request failed:", error);
      return null;
    }
  }
}
