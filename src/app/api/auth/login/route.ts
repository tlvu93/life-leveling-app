import { NextRequest, NextResponse } from "next/server";
import { AuthService } from "@/lib/auth";
import { getUserWithPasswordByEmail } from "@/lib/database-operations-prisma";
import { z } from "zod";

// Validation schema for login
const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = loginSchema.parse(body);

    const { email, password } = validatedData;

    // Get user with password hash
    const userWithPassword = await getUserWithPasswordByEmail(email);
    if (!userWithPassword) {
      return NextResponse.json(
        { success: false, error: "Invalid email or password" },
        { status: 401 }
      );
    }

    const { user, passwordHash } = userWithPassword;

    // Verify password
    const isValidPassword = await AuthService.verifyPassword(
      password,
      passwordHash
    );

    if (!isValidPassword) {
      return NextResponse.json(
        { success: false, error: "Invalid email or password" },
        { status: 401 }
      );
    }

    // Create authentication session
    const authUser = {
      id: user.id,
      ageRangeMin: user.ageRangeMin,
      ageRangeMax: user.ageRangeMax,
      familyModeEnabled: user.familyModeEnabled,
      onboardingCompleted: user.onboardingCompleted,
      createdAt: user.createdAt.toISOString(),
    };

    await AuthService.createAuthSession(authUser);

    return NextResponse.json({
      success: true,
      message: "Login successful",
      data: {
        userId: user.id,
        email: user.email,
        onboardingCompleted: user.onboardingCompleted,
        familyModeEnabled: user.familyModeEnabled,
      },
    });
  } catch (error) {
    console.error("Login error:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: "Validation failed",
          details: error.issues.map((e: any) => ({
            field: e.path.join("."),
            message: e.message,
          })),
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
