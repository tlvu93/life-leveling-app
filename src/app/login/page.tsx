"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ThemeToggle } from "@/components/ui/theme-toggle";

export default function LoginPage() {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();
  const searchParams = useSearchParams();
  const returnUrl = searchParams.get("returnUrl") || "/dashboard";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (data.success) {
        // Login successful, redirect to return URL or dashboard
        if (data.data.onboardingCompleted) {
          router.push(returnUrl);
        } else {
          router.push("/onboarding");
        }
      } else {
        setError(data.error || "Login failed");
      }
    } catch (error) {
      console.error("Login error:", error);
      setError("An unexpected error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex items-center justify-center px-4">
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h1 className="text-4xl font-bold mb-2">
            Welcome to Life Leveling! 🎮
          </h1>
          <p className="text-muted-foreground">
            Level up your life skills in a fun, game-like way
          </p>
        </div>

        <div className="bg-card rounded-lg shadow-md p-8 border">
          {error && (
            <div className="mb-4 p-3 bg-destructive/15 border border-destructive/20 text-destructive rounded">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-foreground"
              >
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                value={formData.email}
                onChange={handleInputChange}
                className="mt-1 block w-full px-3 py-2 bg-input border border-border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent text-foreground placeholder:text-muted-foreground"
                placeholder="Enter your email"
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-foreground"
              >
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                value={formData.password}
                onChange={handleInputChange}
                className="mt-1 block w-full px-3 py-2 bg-input border border-border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent text-foreground placeholder:text-muted-foreground"
                placeholder="Enter your password"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-primary-foreground bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-ring transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? "Signing In..." : "Sign In"}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-muted-foreground">
              Don't have an account?{" "}
              <Link
                href="/register"
                className="font-medium text-primary hover:text-primary/80"
              >
                Sign up here
              </Link>
            </p>
          </div>
        </div>

        <div className="text-center text-sm text-muted-foreground">
          <p>🌟 Start your personal growth journey today!</p>
        </div>
      </div>
    </div>
  );
}
