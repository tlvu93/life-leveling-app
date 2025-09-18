import { NextRequest, NextResponse } from "next/server";
import { AuthService } from "@/lib/auth";
import { createUser, getUserByEmail } from "@/lib/database-operations-prisma";
import { parseAgeRange } from "@/types";
import { z } from "zod";

// Validation schema for registration
const registerSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  ageRange: z.string().regex(/^(\d+-\d+|\d+\+)$/, "Invalid age range format"),
  parentalConsent: z.boolean().optional(),
  isParentCreated: z.boolean().optional(),
  childEmail: z.string().email().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = registerSchema.parse(body);

    const {
      email,
      password,
      ageRange,
      parentalConsent,
      isParentCreated,
      childEmail,
    } = validatedData;

    // Parse age range
    const { min: ageRangeMin, max: ageRangeMax } = parseAgeRange(ageRange);

    // Check if user already exists
    const existingUser = await getUserByEmail(email);
    if (existingUser) {
      return NextResponse.json(
        { success: false, error: "User already exists with this email" },
        { status: 400 }
      );
    }

    // Age verification and parental consent logic
    if (ageRangeMin < 13) {
      if (!parentalConsent) {
        return NextResponse.json(
          {
            success: false,
            error: "Parental consent is required for users under 13",
          },
          { status: 400 }
        );
      }
    }

    // Handle parent-created profile flow
    if (isParentCreated && childEmail) {
      // Check if child email already exists
      const existingChild = await getUserByEmail(childEmail);
      if (existingChild) {
        return NextResponse.json(
          {
            success: false,
            error: "Child account already exists with this email",
          },
          { status: 400 }
        );
      }

      // Create child account with parent's consent
      const hashedPassword = await AuthService.hashPassword(password);
      const childUser = await createUser({
        email: childEmail,
        passwordHash: hashedPassword,
        ageRangeMin,
        ageRangeMax,
        familyModeEnabled: true,
      });

      return NextResponse.json({
        success: true,
        message: "Child account created successfully",
        data: {
          userId: childUser.id,
          email: childUser.email,
          familyModeEnabled: true,
        },
      });
    }

    // Regular self-registration flow
    const hashedPassword = await AuthService.hashPassword(password);
    const user = await createUser({
      email,
      passwordHash: hashedPassword,
      ageRangeMin,
      ageRangeMax,
      familyModeEnabled: false,
    });

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
      message: "Account created successfully",
      data: {
        userId: user.id,
        email: user.email,
        onboardingCompleted: user.onboardingCompleted,
      },
    });
  } catch (error) {
    console.error("Registration error:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: "Validation failed",
          details: error.issues.map((issue) => ({
            field: issue.path.join("."),
            message: issue.message,
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
