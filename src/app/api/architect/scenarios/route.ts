import { NextRequest, NextResponse } from "next/server";
import { AuthService } from "@/lib/auth";
import { getUserById } from "@/lib/database-operations";
import { sql } from "@/lib/db";
import { SimulationScenario } from "@/types";
import { ScenarioCache } from "@/lib/scenario-cache";

interface CreateScenarioRequest {
  scenarioName: string;
  effortAllocation: Record<string, number>;
  forecastedResults: Record<string, unknown>;
  timeframeWeeks: number;
}

export async function GET(request: NextRequest) {
  try {
    const userId = await AuthService.getUserIdFromRequest(request);

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await getUserById(userId);
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Try to get from cache first
    let formattedScenarios = await ScenarioCache.getCachedUserScenarios(
      user.id
    );

    if (formattedScenarios.length === 0) {
      // Get all scenarios for the user from database
      const scenarios = await sql`
        SELECT * FROM simulation_scenarios 
        WHERE user_id = ${user.id}
        ORDER BY created_at DESC
      `;

      formattedScenarios = scenarios.map((row) => ({
        id: row.id,
        userId: row.user_id,
        scenarioName: row.scenario_name,
        effortAllocation: row.effort_allocation,
        forecastedResults: row.forecasted_results,
        timeframeWeeks: row.timeframe_weeks,
        createdAt: row.created_at,
        isConvertedToGoals: row.is_converted_to_goals,
      }));

      // Cache the results
      await ScenarioCache.cacheUserScenarios(user.id, formattedScenarios);
    }

    return NextResponse.json({
      success: true,
      scenarios: formattedScenarios,
    });
  } catch (error) {
    console.error("Get scenarios error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const userId = await AuthService.getUserIdFromRequest(request);

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await getUserById(userId);
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const body: CreateScenarioRequest = await request.json();
    const {
      scenarioName,
      effortAllocation,
      forecastedResults,
      timeframeWeeks,
    } = body;

    // Validate input
    if (
      !scenarioName ||
      !effortAllocation ||
      !forecastedResults ||
      !timeframeWeeks
    ) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    if (scenarioName.length > 255) {
      return NextResponse.json(
        { error: "Scenario name too long" },
        { status: 400 }
      );
    }

    if (timeframeWeeks < 1 || timeframeWeeks > 52) {
      return NextResponse.json({ error: "Invalid timeframe" }, { status: 400 });
    }

    // Check if user already has a scenario with this name
    const existingScenario = await sql`
      SELECT id FROM simulation_scenarios 
      WHERE user_id = ${user.id} AND scenario_name = ${scenarioName}
    `;

    if (existingScenario.length > 0) {
      return NextResponse.json(
        { error: "Scenario name already exists" },
        { status: 409 }
      );
    }

    // Create new scenario
    const result = await sql`
      INSERT INTO simulation_scenarios 
      (user_id, scenario_name, effort_allocation, forecasted_results, timeframe_weeks)
      VALUES (${user.id}, ${scenarioName}, ${JSON.stringify(
      effortAllocation
    )}, ${JSON.stringify(forecastedResults)}, ${timeframeWeeks})
      RETURNING *
    `;

    const newScenario = result[0];
    const formattedScenario: SimulationScenario = {
      id: newScenario.id,
      userId: newScenario.user_id,
      scenarioName: newScenario.scenario_name,
      effortAllocation: newScenario.effort_allocation,
      forecastedResults: newScenario.forecasted_results,
      timeframeWeeks: newScenario.timeframe_weeks,
      createdAt: newScenario.created_at,
      isConvertedToGoals: newScenario.is_converted_to_goals,
    };

    // Cache the new scenario
    await ScenarioCache.cacheScenario(formattedScenario);

    return NextResponse.json({
      success: true,
      scenario: formattedScenario,
    });
  } catch (error) {
    console.error("Create scenario error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const userId = await AuthService.getUserIdFromRequest(request);

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await getUserById(userId);
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const { searchParams } = new URL(request.url);
    const scenarioId = searchParams.get("id");

    if (!scenarioId) {
      return NextResponse.json(
        { error: "Scenario ID required" },
        { status: 400 }
      );
    }

    // Delete scenario (only if it belongs to the user)
    const result = await sql`
      DELETE FROM simulation_scenarios 
      WHERE id = ${scenarioId} AND user_id = ${user.id}
      RETURNING id
    `;

    if (result.length === 0) {
      return NextResponse.json(
        { error: "Scenario not found or unauthorized" },
        { status: 404 }
      );
    }

    // Remove from cache
    await ScenarioCache.removeScenario(scenarioId, user.id);

    return NextResponse.json({
      success: true,
      message: "Scenario deleted successfully",
    });
  } catch (error) {
    console.error("Delete scenario error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
