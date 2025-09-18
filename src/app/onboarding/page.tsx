"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  OnboardingWizard,
  OnboardingData,
} from "@/components/onboarding/OnboardingWizard";
import { UserProfile } from "@/types";

export default function OnboardingPage() {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const response = await fetch("/api/auth/me");
        const data = await response.json();

        if (data.success) {
          setUser(data.data);
          // If user has already completed onboarding, redirect to dashboard
          if (data.data.onboardingCompleted) {
            router.push("/dashboard");
          }
        } else {
          // Not authenticated, redirect to login
          router.push("/login");
        }
      } catch (error) {
        console.error("Error fetching user:", error);
        router.push("/login");
      } finally {
        setIsLoading(false);
      }
    };

    fetchUser();
  }, [router]);

  const handleOnboardingComplete = async (data: OnboardingData) => {
    setIsSubmitting(true);
    try {
      const response = await fetch("/api/onboarding/complete", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();
      console.log("API Response:", result);

      if (result.success) {
        // Redirect to dashboard on success
        console.log(
          "Onboarding completed successfully, redirecting to dashboard..."
        );

        // Redirect immediately since JWT token is updated
        console.log("Calling router.push('/dashboard')...");
        router.push("/dashboard");
        console.log("router.push called");
      } else {
        console.error("Onboarding failed:", result.error);
        alert(
          `Failed to complete onboarding: ${result.message || result.error}`
        );
      }
    } catch (error) {
      console.error("Error completing onboarding:", error);
      alert("An unexpected error occurred. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-foreground mb-4">
            Authentication Required
          </h1>
          <p className="text-muted-foreground mb-6">
            Please log in to access the onboarding flow.
          </p>
          <button
            onClick={() => router.push("/login")}
            className="px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <OnboardingWizard
      onComplete={handleOnboardingComplete}
      isLoading={isSubmitting}
    />
  );
}
