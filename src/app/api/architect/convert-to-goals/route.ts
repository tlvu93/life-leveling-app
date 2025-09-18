import { NextRequest, NextResponse } from "next/server";
import { AuthService } from "@/lib/auth";
import { getUserById } from "@/lib/database-operations";
import { sql } from "@/lib/db";
import { GoalType, Timeframe } from "@/types";

interface ConvertToGoalsRequest {
  scenarioId: string;
  effortAllocation: Record<string, number>;
  forecastedResults: Record<string, unknown>;
  timeframeWeeks: number;
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

    const body: ConvertToGoalsRequest = await request.json();
    const { scenarioId, effortAllocation, forecastedResults, timeframeWeeks } =
      body;

    // Validate input
    if (
      !scenarioId ||
      !effortAllocation ||
      !forecastedResults ||
      !timeframeWeeks
    ) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Verify scenario belongs to user
    const scenarioResult = await sql`
      SELECT * FROM simulation_scenarios 
      WHERE id = ${scenarioId} AND user_id = ${user.id}
    `;

    if (scenarioResult.length === 0) {
      return NextResponse.json(
        { error: "Scenario not found or unauthorized" },
        { status: 404 }
      );
    }

    const scenario = scenarioResult[0];

    if (scenario.is_converted_to_goals) {
      return NextResponse.json(
        { error: "Scenario already converted to goals" },
        { status: 409 }
      );
    }

    // Get user's current interests
    const interests = await sql`
      SELECT * FROM user_interests WHERE user_id = ${user.id}
    `;
    const createdGoals = [];

    // Create goals for each interest with significant effort allocation
    for (const [category, effort] of Object.entries(effortAllocation)) {
      if (effort >= 10) {
        // Only create goals for interests with 10%+ effort
        const interest = interests.find((i) => i.category === category);
        if (!interest) continue;

        const forecast = forecastedResults[category];
        if (!forecast) continue;

        // Determine goal type based on effort and projected growth
        let goalType: GoalType;
        let title: string;
        let description: string;
        let targetLevel: number | undefined;

        if (forecast.projectedLevel > interest.current_level + 0.5) {
          // Significant skill improvement expected
          goalType = GoalType.SKILL_INCREASE;
          targetLevel = Math.ceil(forecast.projectedLevel);
          title = `Improve ${category} Skills`;
          description = `Focus ${effort}% effort on ${category} to reach level ${targetLevel} over ${timeframeWeeks} weeks. Projected growth: +${(
            forecast.projectedLevel - interest.current_level
          ).toFixed(1)} levels.`;
        } else if (effort >= 30) {
          // High effort but modest growth - project completion goal
          goalType = GoalType.PROJECT_COMPLETION;
          title = `${category} Project Focus`;
          description = `Dedicate ${effort}% effort to a meaningful ${category} project over ${timeframeWeeks} weeks. Build practical skills through hands-on work.`;
        } else {
          // Moderate effort - broad promise goal
          goalType = GoalType.BROAD_PROMISE;
          title = `Maintain ${category} Practice`;
          description = `Consistently practice ${category} with ${effort}% effort allocation over ${timeframeWeeks} weeks to maintain and gradually improve skills.`;
        }

        // Determine timeframe based on weeks
        let timeframe: Timeframe;
        if (timeframeWeeks <= 4) {
          timeframe = Timeframe.WEEKLY;
        } else if (timeframeWeeks <= 12) {
          timeframe = Timeframe.MONTHLY;
        } else {
          timeframe = Timeframe.YEARLY;
        }

        // Calculate target date
        const targetDate = new Date();
        targetDate.setDate(targetDate.getDate() + timeframeWeeks * 7);

        // Create the goal
        const goalResult = await sql`
          INSERT INTO goals 
          (user_id, interest_category, goal_type, title, description, target_level, timeframe, target_date)
          VALUES (${
            user.id
          }, ${category}, ${goalType}, ${title}, ${description}, ${
          targetLevel || null
        }, ${timeframe}, ${targetDate})
          RETURNING *
        `;

        createdGoals.push(goalResult[0]);
      }
    }

    // Mark scenario as converted
    await sql`
      UPDATE simulation_scenarios 
      SET is_converted_to_goals = true 
      WHERE id = ${scenarioId}
    `;

    return NextResponse.json({
      success: true,
      message: `Created ${createdGoals.length} goals from scenario`,
      goalsCreated: createdGoals.length,
      goals: createdGoals.map((goal) => ({
        id: goal.id,
        title: goal.title,
        description: goal.description,
        goalType: goal.goal_type,
        interestCategory: goal.interest_category,
        targetLevel: goal.target_level,
        timeframe: goal.timeframe,
        targetDate: goal.target_date,
      })),
    });
  } catch (error) {
    console.error("Convert to goals error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
