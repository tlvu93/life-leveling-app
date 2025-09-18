"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Target,
  Users,
  Plus,
  MessageCircle,
  Calendar,
  Star,
  CheckCircle,
  Clock,
} from "lucide-react";

interface SharedGoal {
  id: string;
  title: string;
  description: string;
  category: string;
  targetLevel?: number;
  timeframe: string;
  status: "draft" | "active" | "completed";
  createdBy: "parent" | "child";
  agreedBy: ("parent" | "child")[];
  discussionPoints: string[];
  createdAt: string;
}

interface SharedGoalSettingProps {
  relationshipId: string;
  isParent: boolean;
  childInterests: string[];
}

export default function SharedGoalSetting({
  relationshipId,
  isParent,
  childInterests,
}: SharedGoalSettingProps) {
  const [sharedGoals, setSharedGoals] = useState<SharedGoal[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const [newGoal, setNewGoal] = useState({
    title: "",
    description: "",
    category: "",
    timeframe: "monthly",
  });
  const [discussionPoint, setDiscussionPoint] = useState("");
  const [selectedGoalId, setSelectedGoalId] = useState<string | null>(null);

  const handleCreateGoal = async () => {
    if (!newGoal.title.trim() || !newGoal.description.trim()) return;

    const goal: SharedGoal = {
      id: crypto.randomUUID(),
      ...newGoal,
      status: "draft",
      createdBy: isParent ? "parent" : "child",
      agreedBy: [],
      discussionPoints: [],
      createdAt: new Date().toISOString(),
    };

    setSharedGoals((prev) => [...prev, goal]);
    setNewGoal({
      title: "",
      description: "",
      category: "",
      timeframe: "monthly",
    });
    setIsCreating(false);
  };

  const handleAgreeToGoal = (goalId: string) => {
    setSharedGoals((prev) =>
      prev.map((goal) => {
        if (goal.id === goalId) {
          const role = isParent ? "parent" : "child";
          if (!goal.agreedBy.includes(role)) {
            const updatedAgreedBy = [...goal.agreedBy, role];
            return {
              ...goal,
              agreedBy: updatedAgreedBy,
              status: updatedAgreedBy.length === 2 ? "active" : goal.status,
            };
          }
        }
        return goal;
      })
    );
  };

  const handleAddDiscussionPoint = (goalId: string) => {
    if (!discussionPoint.trim()) return;

    setSharedGoals((prev) =>
      prev.map((goal) => {
        if (goal.id === goalId) {
          return {
            ...goal,
            discussionPoints: [...goal.discussionPoints, discussionPoint],
          };
        }
        return goal;
      })
    );

    setDiscussionPoint("");
    setSelectedGoalId(null);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "draft":
        return "bg-yellow-100 text-yellow-800";
      case "active":
        return "bg-green-100 text-green-800";
      case "completed":
        return "bg-blue-100 text-blue-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "draft":
        return <Clock className="h-3 w-3" />;
      case "active":
        return <Target className="h-3 w-3" />;
      case "completed":
        return <CheckCircle className="h-3 w-3" />;
      default:
        return <Target className="h-3 w-3" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="border-purple-200 bg-purple-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5 text-purple-600" />
            Shared Goal Setting
          </CardTitle>
          <CardDescription className="text-purple-700">
            Work together to set and achieve meaningful goals
          </CardDescription>
        </CardHeader>
      </Card>

      {/* Create New Goal */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Create New Goal</span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsCreating(!isCreating)}
              className="flex items-center gap-1"
            >
              <Plus className="h-3 w-3" />
              {isCreating ? "Cancel" : "New Goal"}
            </Button>
          </CardTitle>
        </CardHeader>
        {isCreating && (
          <CardContent>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Goal Title
                </label>
                <Input
                  value={newGoal.title}
                  onChange={(e) =>
                    setNewGoal((prev) => ({ ...prev, title: e.target.value }))
                  }
                  placeholder="What do you want to achieve together?"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Description
                </label>
                <Input
                  value={newGoal.description}
                  onChange={(e) =>
                    setNewGoal((prev) => ({
                      ...prev,
                      description: e.target.value,
                    }))
                  }
                  placeholder="Describe the goal in more detail..."
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Category
                  </label>
                  <select
                    value={newGoal.category}
                    onChange={(e) =>
                      setNewGoal((prev) => ({
                        ...prev,
                        category: e.target.value,
                      }))
                    }
                    className="w-full p-2 border rounded-md"
                  >
                    <option value="">Select category</option>
                    {childInterests.map((interest) => (
                      <option key={interest} value={interest}>
                        {interest}
                      </option>
                    ))}
                    <option value="General">General</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    Timeframe
                  </label>
                  <select
                    value={newGoal.timeframe}
                    onChange={(e) =>
                      setNewGoal((prev) => ({
                        ...prev,
                        timeframe: e.target.value,
                      }))
                    }
                    className="w-full p-2 border rounded-md"
                  >
                    <option value="weekly">Weekly</option>
                    <option value="monthly">Monthly</option>
                    <option value="yearly">Yearly</option>
                  </select>
                </div>
              </div>

              <div className="flex gap-2">
                <Button
                  onClick={handleCreateGoal}
                  className="flex items-center gap-1"
                >
                  <Target className="h-3 w-3" />
                  Create Goal
                </Button>
                <Button variant="outline" onClick={() => setIsCreating(false)}>
                  Cancel
                </Button>
              </div>
            </div>
          </CardContent>
        )}
      </Card>

      {/* Shared Goals List */}
      <Card>
        <CardHeader>
          <CardTitle>Shared Goals</CardTitle>
          <CardDescription>Goals you're working on together</CardDescription>
        </CardHeader>
        <CardContent>
          {sharedGoals.length === 0 ? (
            <div className="text-center py-8">
              <Target className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">
                No shared goals yet. Create one to get started!
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {sharedGoals.map((goal) => (
                <div key={goal.id} className="border rounded-lg p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h4 className="font-medium">{goal.title}</h4>
                        <Badge className={getStatusColor(goal.status)}>
                          {getStatusIcon(goal.status)}
                          <span className="ml-1">{goal.status}</span>
                        </Badge>
                        {goal.category && (
                          <Badge variant="outline">{goal.category}</Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">
                        {goal.description}
                      </p>
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {goal.timeframe}
                        </span>
                        <span className="flex items-center gap-1">
                          <Star className="h-3 w-3" />
                          Created by {goal.createdBy}
                        </span>
                        <span>Agreement: {goal.agreedBy.length}/2</span>
                      </div>
                    </div>
                  </div>

                  {/* Agreement Status */}
                  <div className="flex items-center gap-2 mb-3">
                    <div className="flex items-center gap-1">
                      <div
                        className={`w-3 h-3 rounded-full ${
                          goal.agreedBy.includes("parent")
                            ? "bg-green-500"
                            : "bg-gray-300"
                        }`}
                      />
                      <span className="text-xs">Parent</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <div
                        className={`w-3 h-3 rounded-full ${
                          goal.agreedBy.includes("child")
                            ? "bg-green-500"
                            : "bg-gray-300"
                        }`}
                      />
                      <span className="text-xs">Child</span>
                    </div>
                  </div>

                  {/* Discussion Points */}
                  {goal.discussionPoints.length > 0 && (
                    <div className="mb-3">
                      <h5 className="text-sm font-medium mb-2 flex items-center gap-1">
                        <MessageCircle className="h-3 w-3" />
                        Discussion Points
                      </h5>
                      <ul className="text-sm space-y-1">
                        {goal.discussionPoints.map((point, index) => (
                          <li key={index} className="text-muted-foreground">
                            • {point}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex items-center gap-2">
                    {goal.status === "draft" &&
                      !goal.agreedBy.includes(
                        isParent ? "parent" : "child"
                      ) && (
                        <Button
                          size="sm"
                          onClick={() => handleAgreeToGoal(goal.id)}
                          className="flex items-center gap-1"
                        >
                          <CheckCircle className="h-3 w-3" />
                          Agree to Goal
                        </Button>
                      )}

                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() =>
                        setSelectedGoalId(
                          selectedGoalId === goal.id ? null : goal.id
                        )
                      }
                      className="flex items-center gap-1"
                    >
                      <MessageCircle className="h-3 w-3" />
                      Add Discussion Point
                    </Button>
                  </div>

                  {/* Add Discussion Point */}
                  {selectedGoalId === goal.id && (
                    <div className="mt-3 p-3 bg-muted rounded-lg">
                      <div className="flex gap-2">
                        <Input
                          value={discussionPoint}
                          onChange={(e) => setDiscussionPoint(e.target.value)}
                          placeholder="Add a discussion point or question..."
                          className="flex-1"
                        />
                        <Button
                          size="sm"
                          onClick={() => handleAddDiscussionPoint(goal.id)}
                          disabled={!discussionPoint.trim()}
                        >
                          Add
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Tips for Shared Goal Setting */}
      <Card className="border-green-200 bg-green-50">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <Target className="h-5 w-5 text-green-600 mt-0.5" />
            <div>
              <h4 className="font-medium text-green-900 mb-2">
                Tips for Successful Shared Goals
              </h4>
              <ul className="text-sm text-green-700 space-y-1">
                <li>
                  • Make sure both parties genuinely want to work on the goal
                </li>
                <li>• Break large goals into smaller, manageable steps</li>
                <li>
                  • Celebrate progress together, not just final achievements
                </li>
                <li>• Use discussion points to talk through challenges</li>
                <li>• Be flexible and adjust goals as interests evolve</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
