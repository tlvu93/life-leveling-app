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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Shield,
  AlertTriangle,
  Clock,
  Eye,
  UserX,
  Bell,
  Settings,
  Lock,
  Activity,
  CheckCircle,
  XCircle,
  Info,
} from "lucide-react";

interface SafetyAlert {
  id: string;
  type:
    | "privacy_change"
    | "unusual_activity"
    | "consent_revoked"
    | "new_connection";
  severity: "low" | "medium" | "high";
  message: string;
  timestamp: string;
  resolved: boolean;
}

interface SafetySettings {
  enableActivityAlerts: boolean;
  enablePrivacyChangeAlerts: boolean;
  enableUnusualActivityDetection: boolean;
  requireParentApprovalForNewConnections: boolean;
  maxDailyInteractionTime: number; // in minutes
  allowedInteractionHours: {
    start: string;
    end: string;
  };
}

interface FamilySafetyControlsProps {
  relationshipId: string;
  isParent: boolean;
  childAge: number;
}

export default function FamilySafetyControls({
  relationshipId,
  isParent,
  childAge,
}: FamilySafetyControlsProps) {
  const [safetyAlerts, setSafetyAlerts] = useState<SafetyAlert[]>([]);
  const [safetySettings, setSafetySettings] = useState<SafetySettings>({
    enableActivityAlerts: true,
    enablePrivacyChangeAlerts: true,
    enableUnusualActivityDetection: true,
    requireParentApprovalForNewConnections: true,
    maxDailyInteractionTime: 60,
    allowedInteractionHours: {
      start: "08:00",
      end: "20:00",
    },
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    loadSafetyData();
  }, [relationshipId]);

  const loadSafetyData = async () => {
    setIsLoading(true);
    try {
      // Load safety alerts
      const alertsResponse = await fetch(
        `/api/family/safety/alerts?relationshipId=${relationshipId}`
      );
      if (alertsResponse.ok) {
        const alertsResult = await alertsResponse.json();
        if (alertsResult.success) {
          setSafetyAlerts(alertsResult.data);
        }
      }

      // Load safety settings
      const settingsResponse = await fetch(
        `/api/family/safety/settings?relationshipId=${relationshipId}`
      );
      if (settingsResponse.ok) {
        const settingsResult = await settingsResponse.json();
        if (settingsResult.success) {
          setSafetySettings(settingsResult.data);
        }
      }
    } catch (error) {
      console.error("Failed to load safety data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const updateSafetySettings = async (newSettings: Partial<SafetySettings>) => {
    setIsSaving(true);
    try {
      const updatedSettings = { ...safetySettings, ...newSettings };

      const response = await fetch("/api/family/safety/settings", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          relationshipId,
          settings: updatedSettings,
        }),
      });

      const result = await response.json();
      if (result.success) {
        setSafetySettings(updatedSettings);
        setMessage("Safety settings updated successfully");
        setTimeout(() => setMessage(""), 3000);
      } else {
        setMessage("Failed to update safety settings");
      }
    } catch (error) {
      setMessage("Network error. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const resolveAlert = async (alertId: string) => {
    try {
      const response = await fetch("/api/family/safety/alerts", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          alertId,
          resolved: true,
        }),
      });

      if (response.ok) {
        setSafetyAlerts((alerts) =>
          alerts.map((alert) =>
            alert.id === alertId ? { ...alert, resolved: true } : alert
          )
        );
      }
    } catch (error) {
      console.error("Failed to resolve alert:", error);
    }
  };

  const getAlertIcon = (type: string, severity: string) => {
    if (severity === "high") {
      return <AlertTriangle className="h-4 w-4 text-red-500" />;
    }

    switch (type) {
      case "privacy_change":
        return <Eye className="h-4 w-4 text-blue-500" />;
      case "unusual_activity":
        return <Activity className="h-4 w-4 text-orange-500" />;
      case "consent_revoked":
        return <UserX className="h-4 w-4 text-red-500" />;
      case "new_connection":
        return <Bell className="h-4 w-4 text-green-500" />;
      default:
        return <Info className="h-4 w-4 text-gray-500" />;
    }
  };

  const getAlertColor = (severity: string) => {
    switch (severity) {
      case "high":
        return "border-red-200 bg-red-50";
      case "medium":
        return "border-orange-200 bg-orange-50";
      case "low":
        return "border-blue-200 bg-blue-50";
      default:
        return "border-gray-200 bg-gray-50";
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading safety controls...</p>
        </div>
      </div>
    );
  }

  const activeAlerts = safetyAlerts.filter((alert) => !alert.resolved);
  const resolvedAlerts = safetyAlerts.filter((alert) => alert.resolved);

  return (
    <div className="space-y-6">
      {/* Safety Status Header */}
      <Card className="border-green-200 bg-green-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-green-600" />
            Family Safety Controls
          </CardTitle>
          <CardDescription className="text-green-700">
            {isParent
              ? "Monitor and manage safety settings for your family connection"
              : "View safety measures in place for your family connection"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <Badge
              variant={activeAlerts.length === 0 ? "default" : "destructive"}
            >
              {activeAlerts.length === 0
                ? "All Clear"
                : `${activeAlerts.length} Alert${
                    activeAlerts.length !== 1 ? "s" : ""
                  }`}
            </Badge>
            <span className="text-sm text-muted-foreground">
              Last updated: {new Date().toLocaleString()}
            </span>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="alerts" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="alerts" className="flex items-center gap-2">
            <Bell className="h-4 w-4" />
            Alerts ({activeAlerts.length})
          </TabsTrigger>
          <TabsTrigger value="settings" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Settings
          </TabsTrigger>
          <TabsTrigger value="guidelines" className="flex items-center gap-2">
            <Info className="h-4 w-4" />
            Guidelines
          </TabsTrigger>
        </TabsList>

        {/* Alerts Tab */}
        <TabsContent value="alerts">
          <div className="space-y-4">
            {/* Active Alerts */}
            <Card>
              <CardHeader>
                <CardTitle>Active Alerts</CardTitle>
                <CardDescription>
                  Safety notifications that need your attention
                </CardDescription>
              </CardHeader>
              <CardContent>
                {activeAlerts.length === 0 ? (
                  <div className="text-center py-8">
                    <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
                    <p className="text-muted-foreground">
                      No active safety alerts
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {activeAlerts.map((alert) => (
                      <div
                        key={alert.id}
                        className={`border rounded-lg p-4 ${getAlertColor(
                          alert.severity
                        )}`}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex items-start gap-3 flex-1">
                            {getAlertIcon(alert.type, alert.severity)}
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <Badge variant="outline" className="text-xs">
                                  {alert.severity.toUpperCase()}
                                </Badge>
                                <span className="text-xs text-muted-foreground">
                                  {new Date(alert.timestamp).toLocaleString()}
                                </span>
                              </div>
                              <p className="text-sm font-medium">
                                {alert.message}
                              </p>
                            </div>
                          </div>
                          {isParent && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => resolveAlert(alert.id)}
                              className="flex items-center gap-1"
                            >
                              <CheckCircle className="h-3 w-3" />
                              Resolve
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Recent Resolved Alerts */}
            {resolvedAlerts.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Recently Resolved</CardTitle>
                  <CardDescription>
                    Previously addressed safety notifications
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {resolvedAlerts.slice(0, 5).map((alert) => (
                      <div
                        key={alert.id}
                        className="border rounded-lg p-3 opacity-60"
                      >
                        <div className="flex items-start gap-3">
                          <CheckCircle className="h-4 w-4 text-green-500 mt-0.5" />
                          <div className="flex-1">
                            <p className="text-sm">{alert.message}</p>
                            <span className="text-xs text-muted-foreground">
                              Resolved •{" "}
                              {new Date(alert.timestamp).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        {/* Settings Tab */}
        <TabsContent value="settings">
          <Card>
            <CardHeader>
              <CardTitle>Safety Settings</CardTitle>
              <CardDescription>
                {isParent
                  ? "Configure safety controls and monitoring preferences"
                  : "View current safety settings for your family connection"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {/* Alert Settings */}
                <div>
                  <h4 className="font-medium mb-3">Alert Preferences</h4>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <p className="font-medium text-sm">Activity Alerts</p>
                        <p className="text-xs text-muted-foreground">
                          Get notified about family mode interactions
                        </p>
                      </div>
                      <Button
                        variant={
                          safetySettings.enableActivityAlerts
                            ? "default"
                            : "outline"
                        }
                        size="sm"
                        onClick={() =>
                          updateSafetySettings({
                            enableActivityAlerts:
                              !safetySettings.enableActivityAlerts,
                          })
                        }
                        disabled={!isParent || isSaving}
                      >
                        {safetySettings.enableActivityAlerts
                          ? "Enabled"
                          : "Disabled"}
                      </Button>
                    </div>

                    <div className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <p className="font-medium text-sm">
                          Privacy Change Alerts
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Get notified when privacy settings are modified
                        </p>
                      </div>
                      <Button
                        variant={
                          safetySettings.enablePrivacyChangeAlerts
                            ? "default"
                            : "outline"
                        }
                        size="sm"
                        onClick={() =>
                          updateSafetySettings({
                            enablePrivacyChangeAlerts:
                              !safetySettings.enablePrivacyChangeAlerts,
                          })
                        }
                        disabled={!isParent || isSaving}
                      >
                        {safetySettings.enablePrivacyChangeAlerts
                          ? "Enabled"
                          : "Disabled"}
                      </Button>
                    </div>

                    <div className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <p className="font-medium text-sm">
                          Unusual Activity Detection
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Monitor for unexpected usage patterns
                        </p>
                      </div>
                      <Button
                        variant={
                          safetySettings.enableUnusualActivityDetection
                            ? "default"
                            : "outline"
                        }
                        size="sm"
                        onClick={() =>
                          updateSafetySettings({
                            enableUnusualActivityDetection:
                              !safetySettings.enableUnusualActivityDetection,
                          })
                        }
                        disabled={!isParent || isSaving}
                      >
                        {safetySettings.enableUnusualActivityDetection
                          ? "Enabled"
                          : "Disabled"}
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Time Limits */}
                <div>
                  <h4 className="font-medium mb-3">Interaction Limits</h4>
                  <div className="space-y-3">
                    <div className="p-3 border rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <Clock className="h-4 w-4" />
                        <p className="font-medium text-sm">
                          Daily Interaction Time
                        </p>
                      </div>
                      <p className="text-xs text-muted-foreground mb-2">
                        Maximum time per day for family mode interactions
                      </p>
                      <div className="flex items-center gap-2">
                        <span className="text-sm">
                          {safetySettings.maxDailyInteractionTime} minutes
                        </span>
                        {isParent && (
                          <div className="flex gap-1">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() =>
                                updateSafetySettings({
                                  maxDailyInteractionTime: Math.max(
                                    15,
                                    safetySettings.maxDailyInteractionTime - 15
                                  ),
                                })
                              }
                              disabled={isSaving}
                            >
                              -15
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() =>
                                updateSafetySettings({
                                  maxDailyInteractionTime: Math.min(
                                    180,
                                    safetySettings.maxDailyInteractionTime + 15
                                  ),
                                })
                              }
                              disabled={isSaving}
                            >
                              +15
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="p-3 border rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <Clock className="h-4 w-4" />
                        <p className="font-medium text-sm">Allowed Hours</p>
                      </div>
                      <p className="text-xs text-muted-foreground mb-2">
                        Time window when family mode interactions are allowed
                      </p>
                      <div className="flex items-center gap-2 text-sm">
                        <span>
                          {safetySettings.allowedInteractionHours.start}
                        </span>
                        <span>to</span>
                        <span>
                          {safetySettings.allowedInteractionHours.end}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Guidelines Tab */}
        <TabsContent value="guidelines">
          <Card>
            <CardHeader>
              <CardTitle>Family Safety Guidelines</CardTitle>
              <CardDescription>
                Best practices for safe and healthy family interactions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div>
                  <h4 className="font-medium mb-3 flex items-center gap-2">
                    <Shield className="h-4 w-4" />
                    For Parents
                  </h4>
                  <ul className="text-sm space-y-2 text-muted-foreground">
                    <li>
                      • Respect your child's privacy choices and boundaries
                    </li>
                    <li>
                      • Focus on encouragement and exploration rather than
                      monitoring
                    </li>
                    <li>
                      • Use the information to start conversations, not to judge
                    </li>
                    <li>
                      • Allow your child to lead discussions about their
                      interests
                    </li>
                    <li>• Celebrate effort and curiosity over achievements</li>
                  </ul>
                </div>

                <div>
                  <h4 className="font-medium mb-3 flex items-center gap-2">
                    <Lock className="h-4 w-4" />
                    For Children
                  </h4>
                  <ul className="text-sm space-y-2 text-muted-foreground">
                    <li>
                      • You control what your family can see about your journey
                    </li>
                    <li>• You can change your privacy settings anytime</li>
                    <li>
                      • All family interactions are logged for transparency
                    </li>
                    <li>
                      • Talk to a trusted adult if anything makes you
                      uncomfortable
                    </li>
                    <li>
                      • Your interests and goals are valid, regardless of what
                      others think
                    </li>
                  </ul>
                </div>

                <div>
                  <h4 className="font-medium mb-3 flex items-center gap-2">
                    <Bell className="h-4 w-4" />
                    Safety Features
                  </h4>
                  <ul className="text-sm space-y-2 text-muted-foreground">
                    <li>
                      • All family mode activities are logged and transparent
                    </li>
                    <li>
                      • Children have full control over their privacy settings
                    </li>
                    <li>• Time limits prevent excessive monitoring</li>
                    <li>
                      • Unusual activity detection helps identify potential
                      issues
                    </li>
                    <li>
                      • Either party can end the family connection at any time
                    </li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Status Message */}
      {message && (
        <Alert className="border-green-200 bg-green-50">
          <AlertDescription>{message}</AlertDescription>
        </Alert>
      )}
    </div>
  );
}
