"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function DemoPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Simulate demo setup
    const setupDemo = async () => {
      // Create a demo user ID
      const demoUserId = "demo-" + Math.random().toString(36).substr(2, 9);

      // Set demo mode in localStorage
      localStorage.setItem("lifeleveling-demo-mode", "true");
      localStorage.setItem("lifeleveling-demo-user-id", demoUserId);

      // Redirect to onboarding for demo setup
      setTimeout(() => {
        router.push("/onboarding?demo=true");
      }, 1500);
    };

    setupDemo();
  }, [router]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 p-4 flex items-center justify-center">
      <div className="text-center space-y-4">
        <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto">
          <span className="text-2xl">🎯</span>
        </div>
        <div className="space-y-2">
          <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Setting up your demo...
          </h1>
          <p className="text-muted-foreground">
            Welcome to Life Leveling! Let's get you started.
          </p>
        </div>
        <div className="flex items-center justify-center space-x-2">
          <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"></div>
          <div
            className="w-2 h-2 bg-purple-500 rounded-full animate-bounce"
            style={{ animationDelay: "0.1s" }}
          ></div>
          <div
            className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"
            style={{ animationDelay: "0.2s" }}
          ></div>
        </div>
      </div>
    </div>
  );
}
