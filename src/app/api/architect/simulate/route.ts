import { NextRequest, NextResponse } from "next/server";
import { AuthService } from "@/lib/auth";
import { Interest } from "@/types";
import { ScenarioCache } from "@/lib/scenario-cache";
import { runSimulation } from "@/lib/simulation";

interface SimulationRequest {
  effortAllocation: Record<string, number>;
  timeframeWeeks: number;
  currentInterests: Interest[];
}

export async function POST(request: NextRequest) {
  try {
    const userId = await AuthService.getUserIdFromRequest(request);

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body: SimulationRequest = await request.json();
    const { effortAllocation, timeframeWeeks, currentInterests } = body;

    if (
      !effortAllocation ||
      !timeframeWeeks ||
      !Array.isArray(currentInterests)
    ) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    if (timeframeWeeks < 1 || timeframeWeeks > 52) {
      return NextResponse.json({ error: "Invalid timeframe" }, { status: 400 });
    }

    const cachedResults = await ScenarioCache.getCachedSimulationResults(
      userId,
      effortAllocation
    );
    if (cachedResults) {
      return NextResponse.json({
        success: true,
        forecastedResults: cachedResults,
        cached: true,
      });
    }

    const forecastedResults = runSimulation(
      currentInterests,
      effortAllocation,
      timeframeWeeks
    );

    await ScenarioCache.cacheSimulationResults(
      userId,
      effortAllocation,
      forecastedResults
    );

    return NextResponse.json({
      success: true,
      forecastedResults,
    });
  } catch (error) {
    console.error("Simulation error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
