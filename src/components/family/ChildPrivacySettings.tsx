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
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import {
  Shield,
  Eye,
  EyeOff,
  Target,
  TrendingUp,
  Users,
  Lock,
  Unlock,
  Info,
} from "lucide-react";

interface PrivacyPreferences {
  allowPeerComparisons: boolean;
  allowFamilyViewing: boolean;
  shareGoalsWithFamily: boolean;
  shareProgressWithFamily: boolean;
  allowAnonymousDataCollection: boolean;
  dataRetentionConsent: boolean;
}

interface ChildPrivacySettingsProps {
  isMinor: boolean;
}

export default function ChildPrivacySettings({
  isMinor,
}: ChildPrivacySettingsProps) {
  const [preferences, setPreferences] = useState<PrivacyPreferences | null>(
    null
  );
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<"success" | "error" | "info">(
    "info"
  );

  useEffect(() => {
    loadPrivacyPreferences();
  }, []);

  const loadPrivacyPreferences = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/user/privacy");
      const result = await response.json();

      if (result.success) {
        setPreferences(result.data);
      } else {
        setMessage("Failed to load privacy preferences");
        setMessageType("error");
      }
    } catch (error) {
      setMessage("Network error. Please try again.");
      setMessageType("error");
    } finally {
      setIsLoading(false);
    }
  };

  const updatePreference = async (
    key: keyof PrivacyPreferences,
    value: boolean
  ) => {
    if (!preferences) return;

    setIsSaving(true);
    const updatedPreferences = { ...preferences, [key]: value };

    try {
      const response = await fetch("/api/user/privacy", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updatedPreferences),
      });

      const result = await response.json();

      if (result.success) {
        setPreferences(updatedPreferences);
        setMessage("Privacy settings updated successfully");
        setMessageType("success");

        // Clear success message after 3 seconds
        setTimeout(() => setMessage(""), 3000);
      } else {
        setMessage(result.error || "Failed to update privacy settings");
        setMessageType("error");
      }
    } catch (error) {
      setMessage("Network error. Please try again.");
      setMessageType("error");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading privacy settings...</p>
        </div>
      </div>
    );
  }

  if (!preferences) {
    return (
      <Alert className="border-red-200 bg-red-50">
        <AlertDescription>Failed to load privacy preferences.</AlertDescription>
      </Alert>
    );
  }

  const privacySettings = [
    {
      key: "allowFamilyViewing" as keyof PrivacyPreferences,
      title: "Allow Family Viewing",
      description:
        "Let connected family members see your interests and basic information",
      icon: Users,
      category: "family",
      required: true,
      note: "Required for family mode to work",
    },
    {
      key: "shareGoalsWithFamily" as keyof PrivacyPreferences,
      title: "Share Goals with Family",
      description: "Let family members see your current goals and aspirations",
      icon: Target,
      category: "family",
      required: false,
    },
    {
      key: "shareProgressWithFamily" as keyof PrivacyPreferences,
      title: "Share Progress with Family",
      description:
        "Let family members see your skill improvements and achievements",
      icon: TrendingUp,
      category: "family",
      required: false,
    },
    {
      key: "allowPeerComparisons" as keyof PrivacyPreferences,
      title: "Allow Peer Comparisons",
      description:
        "Compare your skills with others in your age group (anonymously)",
      icon: Users,
      category: "general",
      required: false,
    },
    {
      key: "allowAnonymousDataCollection" as keyof PrivacyPreferences,
      title: "Anonymous Data Collection",
      description: "Help improve the app by sharing anonymous usage data",
      icon: Shield,
      category: "general",
      required: false,
    },
  ];

  const familySettings = privacySettings.filter((s) => s.category === "family");
  const generalSettings = privacySettings.filter(
    (s) => s.category === "general"
  );

  return (
    <div className="space-y-6">
      {/* Privacy Control Header */}
      <Card className="border-blue-200 bg-blue-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-blue-600" />
            Your Privacy Controls
          </CardTitle>
          <CardDescription className="text-blue-700">
            {isMinor
              ? "You have complete control over what your family can see. These settings help you maintain your privacy while staying connected."
              : "Control what information you share and how your data is used."}
          </CardDescription>
        </CardHeader>
      </Card>

      {/* Family Privacy Settings */}
      {isMinor && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Family Sharing Settings
            </CardTitle>
            <CardDescription>
              Control what your connected family members can see about your
              journey
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {familySettings.map((setting) => {
                const IconComponent = setting.icon;
                const isEnabled = preferences[setting.key];

                return (
                  <div
                    key={setting.key}
                    className="flex items-start justify-between p-4 border rounded-lg"
                  >
                    <div className="flex items-start gap-3 flex-1">
                      <div className="mt-1">
                        <IconComponent className="h-5 w-5 text-muted-foreground" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-medium">{setting.title}</h4>
                          {setting.required && (
                            <Badge variant="outline" className="text-xs">
                              Required
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground mb-2">
                          {setting.description}
                        </p>
                        {setting.note && (
                          <div className="flex items-center gap-1 text-xs text-blue-600">
                            <Info className="h-3 w-3" />
                            <span>{setting.note}</span>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant={isEnabled ? "default" : "outline"}
                        size="sm"
                        onClick={() =>
                          updatePreference(setting.key, !isEnabled)
                        }
                        disabled={isSaving || setting.required}
                        className="flex items-center gap-1"
                      >
                        {isEnabled ? (
                          <>
                            <Eye className="h-3 w-3" />
                            Visible
                          </>
                        ) : (
                          <>
                            <EyeOff className="h-3 w-3" />
                            Private
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* General Privacy Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lock className="h-5 w-5" />
            General Privacy Settings
          </CardTitle>
          <CardDescription>
            Control how your data is used and shared within the app
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {generalSettings.map((setting) => {
              const IconComponent = setting.icon;
              const isEnabled = preferences[setting.key];

              return (
                <div
                  key={setting.key}
                  className="flex items-start justify-between p-4 border rounded-lg"
                >
                  <div className="flex items-start gap-3 flex-1">
                    <div className="mt-1">
                      <IconComponent className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-medium mb-1">{setting.title}</h4>
                      <p className="text-sm text-muted-foreground">
                        {setting.description}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant={isEnabled ? "default" : "outline"}
                      size="sm"
                      onClick={() => updatePreference(setting.key, !isEnabled)}
                      disabled={isSaving}
                      className="flex items-center gap-1"
                    >
                      {isEnabled ? (
                        <>
                          <Unlock className="h-3 w-3" />
                          Enabled
                        </>
                      ) : (
                        <>
                          <Lock className="h-3 w-3" />
                          Disabled
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Privacy Tips */}
      <Card className="border-green-200 bg-green-50">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <Shield className="h-5 w-5 text-green-600 mt-0.5" />
            <div>
              <h4 className="font-medium text-green-900 mb-2">Privacy Tips</h4>
              <ul className="text-sm text-green-700 space-y-1">
                <li>• You can change these settings anytime</li>
                <li>
                  • Family members are notified when you update your privacy
                  settings
                </li>
                <li>• All family interactions are logged for transparency</li>
                {isMinor && (
                  <li>
                    • Your interests are always visible to connected family
                    members for safety
                  </li>
                )}
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Status Message */}
      {message && (
        <Alert
          className={
            messageType === "error"
              ? "border-red-200 bg-red-50"
              : messageType === "success"
              ? "border-green-200 bg-green-50"
              : "border-blue-200 bg-blue-50"
          }
        >
          <AlertDescription>{message}</AlertDescription>
        </Alert>
      )}
    </div>
  );
}
