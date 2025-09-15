import { kv } from "@vercel/kv";

// Session management utilities
export class SessionManager {
  private static readonly SESSION_PREFIX = "session:";
  private static readonly SESSION_EXPIRY = 60 * 60 * 24 * 7; // 7 days

  static async createSession(
    userId: string,
    sessionData: any
  ): Promise<string> {
    const sessionId = crypto.randomUUID();
    const sessionKey = `${this.SESSION_PREFIX}${sessionId}`;

    await kv.setex(
      sessionKey,
      this.SESSION_EXPIRY,
      JSON.stringify({
        userId,
        ...sessionData,
        createdAt: new Date().toISOString(),
      })
    );

    return sessionId;
  }

  static async getSession(sessionId: string): Promise<any | null> {
    const sessionKey = `${this.SESSION_PREFIX}${sessionId}`;
    const sessionData = await kv.get(sessionKey);

    if (!sessionData) {
      return null;
    }

    return typeof sessionData === "string"
      ? JSON.parse(sessionData)
      : sessionData;
  }

  static async updateSession(sessionId: string, updates: any): Promise<void> {
    const sessionKey = `${this.SESSION_PREFIX}${sessionId}`;
    const existingSession = await this.getSession(sessionId);

    if (existingSession) {
      await kv.setex(
        sessionKey,
        this.SESSION_EXPIRY,
        JSON.stringify({
          ...existingSession,
          ...updates,
          updatedAt: new Date().toISOString(),
        })
      );
    }
  }

  static async deleteSession(sessionId: string): Promise<void> {
    const sessionKey = `${this.SESSION_PREFIX}${sessionId}`;
    await kv.del(sessionKey);
  }

  static async extendSession(sessionId: string): Promise<void> {
    const sessionKey = `${this.SESSION_PREFIX}${sessionId}`;
    await kv.expire(sessionKey, this.SESSION_EXPIRY);
  }
}

// Cache utilities for application data
export class CacheManager {
  private static readonly CACHE_PREFIX = "cache:";
  private static readonly DEFAULT_EXPIRY = 60 * 60; // 1 hour

  static async set(
    key: string,
    value: any,
    expiry: number = this.DEFAULT_EXPIRY
  ): Promise<void> {
    const cacheKey = `${this.CACHE_PREFIX}${key}`;
    await kv.setex(cacheKey, expiry, JSON.stringify(value));
  }

  static async get<T>(key: string): Promise<T | null> {
    const cacheKey = `${this.CACHE_PREFIX}${key}`;
    const cachedData = await kv.get(cacheKey);

    if (!cachedData) {
      return null;
    }

    return typeof cachedData === "string" ? JSON.parse(cachedData) : cachedData;
  }

  static async delete(key: string): Promise<void> {
    const cacheKey = `${this.CACHE_PREFIX}${key}`;
    await kv.del(cacheKey);
  }

  static async exists(key: string): Promise<boolean> {
    const cacheKey = `${this.CACHE_PREFIX}${key}`;
    return (await kv.exists(cacheKey)) === 1;
  }
}
