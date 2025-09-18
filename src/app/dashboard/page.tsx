"use client";

import { useRouter } from "next/navigation";
import LifeStatMatrixCard from "@/components/dashboard/LifeStatMatrixCard";
import { ThemeToggle } from "@/components/ui/theme-toggle";

export default function DashboardPage() {
  const router = useRouter();
  return (
    <div className="min-h-screen bg-background">
      {/* Theme Toggle */}
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-foreground mb-2">
            Welcome to Your Dashboard! 🎮
          </h1>
          <p className="text-muted-foreground">
            Your personal growth journey starts here
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* LifeStat Matrix Card - Takes full width on mobile, 2 columns on desktop */}
          <LifeStatMatrixCard className="lg:col-span-2" />

          {/* Adventure Mode Card */}
          <div className="bg-card rounded-lg shadow-md p-6 border border-border">
            <h2 className="text-xl font-semibold text-foreground mb-4">
              🗺️ Adventure Mode
            </h2>
            <p className="text-muted-foreground mb-4">
              Set goals and track your real-world progress
            </p>
            <button
              onClick={() => router.push("/adventure")}
              className="w-full bg-primary text-primary-foreground py-2 px-4 rounded-md hover:bg-primary/90 transition-colors"
            >
              Start Adventure
            </button>
          </div>

          {/* Architect Mode Card */}
          <div className="bg-card rounded-lg shadow-md p-6 border border-border">
            <h2 className="text-xl font-semibold text-foreground mb-4">
              🏗️ Architect Mode
            </h2>
            <p className="text-muted-foreground mb-4">
              Simulate different growth paths and scenarios
            </p>
            <button
              onClick={() => router.push("/architect")}
              className="w-full bg-secondary text-secondary-foreground py-2 px-4 rounded-md hover:bg-secondary/90 transition-colors"
            >
              Plan Your Path
            </button>
          </div>

          {/* Recent Goals Card */}
          <div className="bg-card rounded-lg shadow-md p-6 border border-border">
            <h2 className="text-xl font-semibold text-foreground mb-4">
              🎯 Recent Goals
            </h2>
            <div className="space-y-2">
              <p className="text-muted-foreground text-sm">No goals set yet</p>
              <button
                onClick={() => router.push("/adventure")}
                className="text-primary hover:text-primary/80 text-sm font-medium"
              >
                Create your first goal →
              </button>
            </div>
          </div>

          {/* Peer Comparison Card */}
          <div className="bg-card rounded-lg shadow-md p-6 border border-border">
            <h2 className="text-xl font-semibold text-foreground mb-4">
              👥 Peer Insights
            </h2>
            <p className="text-muted-foreground mb-4">
              See how you compare with peers in your interests
            </p>
            <div className="space-y-2">
              <button
                onClick={() => router.push("/comparisons")}
                className="w-full bg-accent text-accent-foreground py-2 px-4 rounded-md hover:bg-accent/90 transition-colors"
              >
                View Comparisons
              </button>
              <button
                onClick={() => router.push("/comparisons/settings")}
                className="w-full text-accent hover:text-accent/80 text-sm font-medium"
              >
                Manage Settings →
              </button>
            </div>
          </div>

          {/* Quick Actions Card */}
          <div className="bg-card rounded-lg shadow-md p-6 border border-border">
            <h2 className="text-xl font-semibold text-foreground mb-4">
              ⚡ Quick Actions
            </h2>
            <div className="space-y-2">
              <button
                onClick={() => router.push("/retrospectives")}
                className="w-full text-left text-primary hover:text-primary/80 text-sm"
              >
                📝 Weekly Check-in
              </button>
              <button className="w-full text-left text-secondary hover:text-secondary/80 text-sm">
                🔄 Update Skills
              </button>
              <button
                onClick={() => router.push("/family")}
                className="w-full text-left text-accent hover:text-accent/80 text-sm"
              >
                👨‍👩‍👧‍👦 Family Mode
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
