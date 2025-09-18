"use client";

import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Shield,
  Eye,
  Settings,
  UserCheck,
  Activity,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

interface ActivityEntry {
  id: string;
  actionType: string;
  performedBy: string;
  details: any;
  createdAt: string;
}

interface ActivityLogData {
  activities: ActivityEntry[];
  pagination: {
    total: number;
    limit: number;
    offset: number;
    hasMore: boolean;
  };
}

interface FamilyActivityLogProps {
  relationshipId: string;
}

export default function FamilyActivityLog({
  relationshipId,
}: FamilyActivityLogProps) {
  const [activityData, setActivityData] = useState<ActivityLogData | null>(
    null
  );
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [expandedEntries, setExpandedEntries] = useState<Set<string>>(
    new Set()
  );

  useEffect(() => {
    loadActivityLog();
  }, [relationshipId]);

  const loadActivityLog = async (offset = 0) => {
    setIsLoading(true);
    setError("");

    try {
      const response = await fetch(
        `/api/family/activity-log?relationshipId=${relationshipId}&limit=20&offset=${offset}`
      );
      const result = await response.json();

      if (result.success) {
        if (offset === 0) {
          setActivityData(result.data);
        } else {
          // Append to existing data for "load more"
          setActivityData((prev) =>
            prev
              ? {
                  ...result.data,
                  activities: [...prev.activities, ...result.data.activities],
                }
              : result.data
          );
        }
      } else {
        setError(result.error || "Failed to load activity log");
      }
    } catch (error) {
      setError("Network error. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const loadMore = () => {
    if (activityData && activityData.pagination.hasMore) {
      loadActivityLog(activityData.activities.length);
    }
  };

  const toggleExpanded = (entryId: string) => {
    const newExpanded = new Set(expandedEntries);
    if (newExpanded.has(entryId)) {
      newExpanded.delete(entryId);
    } else {
      newExpanded.add(entryId);
    }
    setExpandedEntries(newExpanded);
  };

  const getActionIcon = (actionType: string) => {
    switch (actionType) {
      case "consent_updated":
        return <UserCheck className="h-4 w-4" />;
      case "dashboard_accessed":
        return <Eye className="h-4 w-4" />;
      case "privacy_changed":
        return <Settings className="h-4 w-4" />;
      default:
        return <Activity className="h-4 w-4" />;
    }
  };

  const getActionDescription = (actionType: string, details: any) => {
    switch (actionType) {
      case "consent_updated":
        return details.consentGiven
          ? "Family mode activated"
          : "Family mode consent revoked";
      case "dashboard_accessed":
        return `Parent viewed dashboard (${Object.entries(
          details.dataAccessed || {}
        )
          .filter(([_, accessed]) => accessed)
          .map(([type]) => type)
          .join(", ")})`;
      case "privacy_changed":
        return "Privacy settings updated";
      default:
        return actionType.replace(/_/g, " ");
    }
  };

  const getActionColor = (actionType: string) => {
    switch (actionType) {
      case "consent_updated":
        return "bg-green-100 text-green-800";
      case "dashboard_accessed":
        return "bg-blue-100 text-blue-800";
      case "privacy_changed":
        return "bg-orange-100 text-orange-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  if (isLoading && !activityData) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading activity log...</p>
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

  if (!activityData) {
    return (
      <Alert>
        <AlertDescription>No activity log data available.</AlertDescription>
      </Alert>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5" />
          Family Activity Log
        </CardTitle>
        <CardDescription>
          Complete transparency of all family mode interactions. Total
          activities: {activityData.pagination.total}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {activityData.activities.length === 0 ? (
          <p className="text-muted-foreground text-center py-8">
            No activity recorded yet.
          </p>
        ) : (
          <div className="space-y-4">
            {activityData.activities.map((activity) => (
              <div key={activity.id} className="border rounded-lg p-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3 flex-1">
                    <div className="mt-0.5">
                      {getActionIcon(activity.actionType)}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge className={getActionColor(activity.actionType)}>
                          {getActionDescription(
                            activity.actionType,
                            activity.details
                          )}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        By {activity.performedBy} •{" "}
                        {new Date(activity.createdAt).toLocaleString()}
                      </p>

                      {/* Expandable details */}
                      {activity.details &&
                        Object.keys(activity.details).length > 0 && (
                          <div className="mt-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => toggleExpanded(activity.id)}
                              className="h-auto p-0 text-xs text-muted-foreground hover:text-foreground"
                            >
                              {expandedEntries.has(activity.id) ? (
                                <>
                                  <ChevronUp className="h-3 w-3 mr-1" />
                                  Hide details
                                </>
                              ) : (
                                <>
                                  <ChevronDown className="h-3 w-3 mr-1" />
                                  Show details
                                </>
                              )}
                            </Button>

                            {expandedEntries.has(activity.id) && (
                              <div className="mt-2 p-3 bg-muted rounded text-xs">
                                <pre className="whitespace-pre-wrap">
                                  {JSON.stringify(activity.details, null, 2)}
                                </pre>
                              </div>
                            )}
                          </div>
                        )}
                    </div>
                  </div>
                </div>
              </div>
            ))}

            {/* Load More Button */}
            {activityData.pagination.hasMore && (
              <div className="flex justify-center pt-4">
                <Button
                  variant="outline"
                  onClick={loadMore}
                  disabled={isLoading}
                >
                  {isLoading ? "Loading..." : "Load More"}
                </Button>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
