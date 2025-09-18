import { kv } from "@vercel/kv";
import { SimulationScenario } from "@/types";

const CACHE_PREFIX = "scenario:";
const USER_SCENARIOS_PREFIX = "user_scenarios:";
const CACHE_TTL = 60 * 60 * 24 * 7; // 7 days

export class ScenarioCache {
  // Cache a single scenario
  static async cacheScenario(scenario: SimulationScenario): Promise<void> {
    try {
      const key = `${CACHE_PREFIX}${scenario.id}`;
      await kv.setex(key, CACHE_TTL, JSON.stringify(scenario));

      // Also update the user's scenario list
      await this.addToUserScenarios(scenario.userId, scenario.id);
    } catch (error) {
      console.error("Failed to cache scenario:", error);
      // Don't throw - caching is optional
    }
  }

  // Get a cached scenario
  static async getCachedScenario(
    scenarioId: string
  ): Promise<SimulationScenario | null> {
    try {
      const key = `${CACHE_PREFIX}${scenarioId}`;
      const cached = await kv.get(key);

      if (cached && typeof cached === "string") {
        return JSON.parse(cached) as SimulationScenario;
      }

      return null;
    } catch (error) {
      console.error("Failed to get cached scenario:", error);
      return null;
    }
  }

  // Cache user's scenario list
  static async cacheUserScenarios(
    userId: string,
    scenarios: SimulationScenario[]
  ): Promise<void> {
    try {
      const key = `${USER_SCENARIOS_PREFIX}${userId}`;
      const scenarioIds = scenarios.map((s) => s.id);
      await kv.setex(key, CACHE_TTL, JSON.stringify(scenarioIds));

      // Cache individual scenarios
      for (const scenario of scenarios) {
        await this.cacheScenario(scenario);
      }
    } catch (error) {
      console.error("Failed to cache user scenarios:", error);
    }
  }

  // Get cached user scenarios
  static async getCachedUserScenarios(
    userId: string
  ): Promise<SimulationScenario[]> {
    try {
      const key = `${USER_SCENARIOS_PREFIX}${userId}`;
      const cached = await kv.get(key);

      if (cached && typeof cached === "string") {
        const scenarioIds = JSON.parse(cached) as string[];
        const scenarios: SimulationScenario[] = [];

        // Get each scenario from cache
        for (const id of scenarioIds) {
          const scenario = await this.getCachedScenario(id);
          if (scenario) {
            scenarios.push(scenario);
          }
        }

        return scenarios;
      }

      return [];
    } catch (error) {
      console.error("Failed to get cached user scenarios:", error);
      return [];
    }
  }

  // Add scenario to user's list
  static async addToUserScenarios(
    userId: string,
    scenarioId: string
  ): Promise<void> {
    try {
      const key = `${USER_SCENARIOS_PREFIX}${userId}`;
      const cached = await kv.get(key);

      let scenarioIds: string[] = [];
      if (cached && typeof cached === "string") {
        scenarioIds = JSON.parse(cached) as string[];
      }

      if (!scenarioIds.includes(scenarioId)) {
        scenarioIds.push(scenarioId);
        await kv.setex(key, CACHE_TTL, JSON.stringify(scenarioIds));
      }
    } catch (error) {
      console.error("Failed to add scenario to user list:", error);
    }
  }

  // Remove scenario from cache
  static async removeScenario(
    scenarioId: string,
    userId: string
  ): Promise<void> {
    try {
      // Remove individual scenario
      const scenarioKey = `${CACHE_PREFIX}${scenarioId}`;
      await kv.del(scenarioKey);

      // Remove from user's list
      const userKey = `${USER_SCENARIOS_PREFIX}${userId}`;
      const cached = await kv.get(userKey);

      if (cached && typeof cached === "string") {
        const scenarioIds = JSON.parse(cached) as string[];
        const updatedIds = scenarioIds.filter((id) => id !== scenarioId);
        await kv.setex(userKey, CACHE_TTL, JSON.stringify(updatedIds));
      }
    } catch (error) {
      console.error("Failed to remove scenario from cache:", error);
    }
  }

  // Clear all cached scenarios for a user
  static async clearUserCache(userId: string): Promise<void> {
    try {
      const key = `${USER_SCENARIOS_PREFIX}${userId}`;
      const cached = await kv.get(key);

      if (cached && typeof cached === "string") {
        const scenarioIds = JSON.parse(cached) as string[];

        // Remove individual scenarios
        for (const id of scenarioIds) {
          const scenarioKey = `${CACHE_PREFIX}${id}`;
          await kv.del(scenarioKey);
        }

        // Remove user's list
        await kv.del(key);
      }
    } catch (error) {
      console.error("Failed to clear user cache:", error);
    }
  }

  // Cache simulation results for quick access
  static async cacheSimulationResults(
    userId: string,
    effortAllocation: Record<string, number>,
    results: Record<string, any>
  ): Promise<void> {
    try {
      const key = `simulation:${userId}:${this.hashEffortAllocation(
        effortAllocation
      )}`;
      await kv.setex(key, 60 * 30, JSON.stringify(results)); // 30 minutes cache
    } catch (error) {
      console.error("Failed to cache simulation results:", error);
    }
  }

  // Get cached simulation results
  static async getCachedSimulationResults(
    userId: string,
    effortAllocation: Record<string, number>
  ): Promise<Record<string, any> | null> {
    try {
      const key = `simulation:${userId}:${this.hashEffortAllocation(
        effortAllocation
      )}`;
      const cached = await kv.get(key);

      if (cached && typeof cached === "string") {
        return JSON.parse(cached);
      }

      return null;
    } catch (error) {
      console.error("Failed to get cached simulation results:", error);
      return null;
    }
  }

  // Create a hash of effort allocation for caching
  private static hashEffortAllocation(
    effortAllocation: Record<string, number>
  ): string {
    const sorted = Object.keys(effortAllocation)
      .sort()
      .map((key) => `${key}:${effortAllocation[key]}`)
      .join("|");

    // Simple hash function
    let hash = 0;
    for (let i = 0; i < sorted.length; i++) {
      const char = sorted.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash; // Convert to 32-bit integer
    }

    return Math.abs(hash).toString(36);
  }
}
