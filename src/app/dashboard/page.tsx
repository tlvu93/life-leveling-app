"use client";

import { useRouter } from "next/navigation";
import LifeStatMatrixCard from "@/components/dashboard/LifeStatMatrixCard";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function DashboardPage() {
  const router = useRouter();
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 p-4">
      {/* Theme Toggle */}
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>

      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent font-bold">
              Life Leveling Dashboard
            </h1>
            <p className="text-muted-foreground">
              Track your growth journey and unlock your potential
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button className="px-4 py-2 border border-input bg-background text-foreground rounded-lg hover:bg-accent hover:text-accent-foreground transition-colors">
              Edit Profile
            </button>
          </div>
        </div>

        {/* Main Content */}
        <div className="space-y-6">
          {/* LifeStat Matrix Card */}
          <LifeStatMatrixCard />

          {/* Feature Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Adventure Mode Card */}
            <Card variant="default" padding="none">
              <CardContent className="p-12 text-center space-y-4">
                <div className="text-6xl">🎯</div>
                <CardTitle className="text-2xl">Adventure Mode</CardTitle>
                <p className="text-muted-foreground max-w-md mx-auto">
                  Set goals and promises to your future self. Track your
                  progress through weekly check-ins and monthly retrospectives.
                </p>
                <Badge variant="secondary">Coming Soon</Badge>
              </CardContent>
            </Card>

            {/* Architect Mode Card */}
            <Card variant="default" padding="none">
              <CardContent className="p-12 text-center space-y-4">
                <div className="text-6xl">🏗️</div>
                <CardTitle className="text-2xl">Architect Mode</CardTitle>
                <p className="text-muted-foreground max-w-md mx-auto">
                  Simulate different growth paths and explore "what-if&quot;
                  scenarios for your interests. Plan your future development.
                </p>
                <Badge variant="secondary">Coming Soon</Badge>
              </CardContent>
            </Card>

            {/* Peer Comparison Card */}
            <Card variant="default" padding="none">
              <CardContent className="p-12 text-center space-y-4">
                <div className="text-6xl">👥</div>
                <CardTitle className="text-2xl">Peer Comparison</CardTitle>
                <p className="text-muted-foreground max-w-md mx-auto">
                  See how you compare with others in your interests and get
                  insights for growth.
                </p>
                <button
                  onClick={() => router.push("/comparisons")}
                  className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg hover:from-blue-600 hover:to-purple-700 transition-all duration-200 text-sm font-medium"
                >
                  View Comparisons
                </button>
              </CardContent>
            </Card>

            {/* Family Mode Card */}
            <Card variant="default" padding="none">
              <CardContent className="p-12 text-center space-y-4">
                <div className="text-6xl">👨‍👩‍👧‍👦</div>
                <CardTitle className="text-2xl">Family Mode</CardTitle>
                <p className="text-muted-foreground max-w-md mx-auto">
                  Track family growth and set shared goals together. Perfect for
                  parents and children.
                </p>
                <button
                  onClick={() => router.push("/family")}
                  className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg hover:from-blue-600 hover:to-purple-700 transition-all duration-200 text-sm font-medium"
                >
                  Explore Family
                </button>
              </CardContent>
            </Card>
          </div>

          {/* Quick Actions */}
          <Card variant="default">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <span>⚡</span>
                Quick Actions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <button
                  onClick={() => router.push("/retrospectives")}
                  className="h-auto p-4 flex flex-col items-center gap-2 border border-input bg-background text-foreground rounded-lg hover:bg-accent hover:text-accent-foreground transition-colors disabled:opacity-50"
                  disabled
                >
                  <span className="text-2xl">📝</span>
                  <span className="text-sm">Weekly Check-in</span>
                </button>
                <button
                  className="h-auto p-4 flex flex-col items-center gap-2 border border-input bg-background text-foreground rounded-lg hover:bg-accent hover:text-accent-foreground transition-colors disabled:opacity-50"
                  disabled
                >
                  <span className="text-2xl">🎯</span>
                  <span className="text-sm">Set New Goal</span>
                </button>
                <button
                  onClick={() => router.push("/architect")}
                  className="h-auto p-4 flex flex-col items-center gap-2 border border-input bg-background text-foreground rounded-lg hover:bg-accent hover:text-accent-foreground transition-colors disabled:opacity-50"
                  disabled
                >
                  <span className="text-2xl">🔮</span>
                  <span className="text-sm">Explore Paths</span>
                </button>
                <button
                  className="h-auto p-4 flex flex-col items-center gap-2 border border-input bg-background text-foreground rounded-lg hover:bg-accent hover:text-accent-foreground transition-colors disabled:opacity-50"
                  disabled
                >
                  <span className="text-2xl">📈</span>
                  <span className="text-sm">View Progress</span>
                </button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
