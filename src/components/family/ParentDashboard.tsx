"use client";

import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Heart,
  Target,
  TrendingUp,
  Eye,
  EyeOff,
  Calendar,
  Star,
  BookOpen,
  Activity,
} from "lucide-react";
import { getSkillLevelName, getCommitmentLevelName } from "@/types";

interface ChildInfo {
  email: string;
  ageRange: string;
}

interface Interest {
  category: string;
  subcategory?: string;
  currentLevel: number;
  intentLevel: string;
  lastUpdated: string;
}

interface Goal {
  id: string;
  interestCategory: string;
  goalType: string;
  title: string;
  description: string;
  targetLevel?: number;
  timeframe: string;
  status: string;
  createdAt: string;
  targetDate?: string;
}

interface ProgressEntry {
  category: string;
  subcategory?: string;
  previousLevel?: number;
  newLevel: number;
  changedAt: string;
  notes?: string;
}

interface PrivacySettings {
  allowFamilyViewing: boolean;
  shareGoalsWithFamily: boolean;
  shareProgressWithFamily: boolean;
}

interface DashboardData {
  childInfo: ChildInfo;
  interests: Interest[];
  goals: Goal[];
  recentProgress: ProgressEntry[];
  privacySettings: PrivacySettings;
}

interface ParentDashboardProps {
  childUserId: string;
}

export default function ParentDashboard({ childUserId }: ParentDashboardProps) {
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(
    null
  );
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    loadDashboardData();
  }, [childUserId]);

  const loadDashboardData = async () => {
    setIsLoading(true);
    setError("");

    try {
      const response = await fetch(
        `/api/family/dashboard?childUserId=${childUserId}`
      );
      const result = await response.json();

      if (result.success) {
        setDashboardData(result.data);
      } else {
        setError(result.error || "Failed to load dashboard data");
      }
    } catch (error) {
      setError("Network error. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Alert className="border-red-200 bg-red-50">
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  if (!dashboardData) {
    return (
      <Alert>
        <AlertDescription>No dashboard data available.</AlertDescription>
      </Alert>
    );
  }

  const { childInfo, interests, goals, recentProgress, privacySettings } =
    dashboardData;

  return (
    <div className="space-y-6">
      {/* Child Info Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Heart className="h-5 w-5 text-pink-500" />
            {childInfo.email}'s Journey
          </CardTitle>
          <CardDescription>
            Age {childInfo.ageRange} • Exploring their interests and setting
            goals
          </CardDescription>
        </CardHeader>
      </Card>

      {/* Privacy Notice */}
      <Card className="border-blue-200 bg-blue-50">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <Eye className="h-5 w-5 text-blue-500 mt-0.5" />
            <div>
              <h4 className="font-medium text-blue-900">What You Can See</h4>
              <div className="text-sm text-blue-700 mt-1 space-y-1">
                <div className="flex items-center gap-2">
                  <Eye className="h-3 w-3" />
                  <span>Interests: Always visible</span>
                </div>
                <div className="flex items-center gap-2">
                  {privacySettings.shareGoalsWithFamily ? (
                    <Eye className="h-3 w-3" />
                  ) : (
                    <EyeOff className="h-3 w-3" />
                  )}
                  <span>
                    Goals:{" "}
                    {privacySettings.shareGoalsWithFamily
                      ? "Visible"
                      : "Private"}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  {privacySettings.shareProgressWithFamily ? (
                    <Eye className="h-3 w-3" />
                  ) : (
                    <EyeOff className="h-3 w-3" />
                  )}
                  <span>
                    Progress:{" "}
                    {privacySettings.shareProgressWithFamily
                      ? "Visible"
                      : "Private"}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Dashboard Tabs */}
      <Tabs defaultValue="interests" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="interests" className="flex items-center gap-2">
            <Star className="h-4 w-4" />
            Interests
          </TabsTrigger>
          <TabsTrigger value="goals" className="flex items-center gap-2">
            <Target className="h-4 w-4" />
            Goals
          </TabsTrigger>
          <TabsTrigger value="progress" className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Progress
          </TabsTrigger>
        </TabsList>

        {/* Interests Tab */}
        <TabsContent value="interests">
          <Card>
            <CardHeader>
              <CardTitle>Current Interests</CardTitle>
              <CardDescription>
                Areas your child is exploring and developing
              </CardDescription>
            </CardHeader>
            <CardContent>
              {interests.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">
                  No interests recorded yet.
                </p>
              ) : (
                <div className="grid gap-4 md:grid-cols-2">
                  {interests.map((interest, index) => (
                    <div key={index} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium">{interest.category}</h4>
                        <Badge variant="outline">
                          {getSkillLevelName(interest.currentLevel)}
                        </Badge>
                      </div>
                      {interest.subcategory && (
                        <p className="text-sm text-muted-foreground mb-2">
                          {interest.subcategory}
                        </p>
                      )}
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">
                          {getCommitmentLevelName(interest.intentLevel as any)}{" "}
                          commitment
                        </span>
                        <span className="text-muted-foreground">
                          Updated{" "}
                          {new Date(interest.lastUpdated).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Goals Tab */}
        <TabsContent value="goals">
          <Card>
            <CardHeader>
              <CardTitle>Active Goals</CardTitle>
              <CardDescription>
                {privacySettings.shareGoalsWithFamily
                  ? "Goals your child is working towards"
                  : "Your child has chosen to keep their goals private"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {!privacySettings.shareGoalsWithFamily ? (
                <div className="text-center py-8">
                  <EyeOff className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">
                    Your child has chosen to keep their goals private. This
                    helps them maintain autonomy while still sharing their
                    interests with you.
                  </p>
                </div>
              ) : goals.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">
                  No active goals at the moment.
                </p>
              ) : (
                <div className="space-y-4">
                  {goals.map((goal) => (
                    <div key={goal.id} className="border rounded-lg p-4">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h4 className="font-medium">{goal.title}</h4>
                          <p className="text-sm text-muted-foreground">
                            {goal.interestCategory} •{" "}
                            {goal.goalType.replace("_", " ")}
                          </p>
                        </div>
                        <Badge variant="outline">{goal.timeframe}</Badge>
                      </div>
                      <p className="text-sm mb-3">{goal.description}</p>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          <span>
                            Started{" "}
                            {new Date(goal.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                        {goal.targetDate && (
                          <div className="flex items-center gap-1">
                            <Target className="h-3 w-3" />
                            <span>
                              Target{" "}
                              {new Date(goal.targetDate).toLocaleDateString()}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Progress Tab */}
        <TabsContent value="progress">
          <Card>
            <CardHeader>
              <CardTitle>Recent Progress</CardTitle>
              <CardDescription>
                {privacySettings.shareProgressWithFamily
                  ? "Recent skill improvements and achievements"
                  : "Your child has chosen to keep their progress private"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {!privacySettings.shareProgressWithFamily ? (
                <div className="text-center py-8">
                  <EyeOff className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">
                    Your child has chosen to keep their progress private. You
                    can still see their interests and support their journey in
                    other ways.
                  </p>
                </div>
              ) : recentProgress.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">
                  No recent progress updates.
                </p>
              ) : (
                <div className="space-y-4">
                  {recentProgress.map((progress, index) => (
                    <div key={index} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium">
                          {progress.category}
                          {progress.subcategory && ` - ${progress.subcategory}`}
                        </h4>
                        <div className="flex items-center gap-2">
                          {progress.previousLevel && (
                            <>
                              <Badge variant="outline">
                                {getSkillLevelName(progress.previousLevel)}
                              </Badge>
                              <span className="text-muted-foreground">→</span>
                            </>
                          )}
                          <Badge>{getSkillLevelName(progress.newLevel)}</Badge>
                        </div>
                      </div>
                      <div className="flex items-center justify-between text-sm text-muted-foreground">
                        <span>
                          {new Date(progress.changedAt).toLocaleDateString()}
                        </span>
                        {progress.notes && (
                          <span className="italic">"{progress.notes}"</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Refresh Button */}
      <div className="flex justify-center">
        <Button
          variant="outline"
          onClick={loadDashboardData}
          disabled={isLoading}
        >
          <Activity className="h-4 w-4 mr-2" />
          Refresh Dashboard
        </Button>
      </div>
    </div>
  );
}
