"use client";

import { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
import { Users, Settings, Activity, Plus } from "lucide-react";
import { AuthUser } from "@/lib/auth";
import FamilyModeActivation from "./FamilyModeActivation";
import ParentDashboard from "./ParentDashboard";
import FamilyActivityLog from "./FamilyActivityLog";
import ChildPrivacySettings from "./ChildPrivacySettings";
import ExplorationInterface from "./ExplorationInterface";
import FamilySafetyControls from "./FamilySafetyControls";

interface FamilyRelationship {
  id: string;
  parentUserId: string;
  childUserId: string;
  parentEmail?: string;
  childEmail?: string;
  relationshipType: string;
  childConsentGiven: boolean;
  createdAt: string;
}

interface FamilyModeInterfaceProps {
  currentUser: AuthUser;
}

export default function FamilyModeInterface({
  currentUser,
}: FamilyModeInterfaceProps) {
  const [relationships, setRelationships] = useState<FamilyRelationship[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedChildId, setSelectedChildId] = useState<string | null>(null);
  const [selectedRelationshipId, setSelectedRelationshipId] = useState<
    string | null
  >(null);

  const isMinor = currentUser.ageRangeMin < 18;

  useEffect(() => {
    loadFamilyRelationships();
  }, []);

  const loadFamilyRelationships = async () => {
    setIsLoading(true);
    setError("");

    try {
      const response = await fetch("/api/family/relationships");
      const result = await response.json();

      if (result.success) {
        setRelationships(result.data);
        // Auto-select first active relationship for dashboard
        const activeRelationships = result.data.filter(
          (r: FamilyRelationship) => r.childConsentGiven
        );
        if (activeRelationships.length > 0) {
          const firstRelationship = activeRelationships[0];
          setSelectedRelationshipId(firstRelationship.id);
          if (!isMinor) {
            setSelectedChildId(firstRelationship.childUserId);
          }
        }
      } else {
        setError(result.error || "Failed to load family relationships");
      }
    } catch (error) {
      setError("Network error. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const activeRelationships = relationships.filter((r) => r.childConsentGiven);
  const pendingRelationships = relationships.filter(
    (r) => !r.childConsentGiven
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading family mode...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Family Mode Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Family Mode Status
          </CardTitle>
          <CardDescription>
            {currentUser.familyModeEnabled
              ? "Family mode is active. You can share your journey with connected family members."
              : "Family mode is not active. Connect with family members to get started."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <Badge
              variant={currentUser.familyModeEnabled ? "default" : "secondary"}
            >
              {currentUser.familyModeEnabled ? "Active" : "Inactive"}
            </Badge>
            <span className="text-sm text-muted-foreground">
              {activeRelationships.length} active connection
              {activeRelationships.length !== 1 ? "s" : ""}
              {pendingRelationships.length > 0 && (
                <>, {pendingRelationships.length} pending</>
              )}
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Main Interface */}
      {activeRelationships.length === 0 ? (
        // No active relationships - show activation interface
        <FamilyModeActivation
          userAge={currentUser.ageRangeMin}
          isMinor={isMinor}
        />
      ) : (
        // Has active relationships - show full interface
        <Tabs defaultValue="dashboard" className="space-y-4">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="dashboard" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              {isMinor ? "Family View" : "Dashboard"}
            </TabsTrigger>
            <TabsTrigger
              value="exploration"
              className="flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              {isMinor ? "Explore" : "Exploration"}
            </TabsTrigger>
            <TabsTrigger value="privacy" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              {isMinor ? "Privacy" : "Settings"}
            </TabsTrigger>
            <TabsTrigger value="safety" className="flex items-center gap-2">
              <Activity className="h-4 w-4" />
              Safety
            </TabsTrigger>
            <TabsTrigger value="activity" className="flex items-center gap-2">
              <Activity className="h-4 w-4" />
              Activity
            </TabsTrigger>
          </TabsList>

          {/* Dashboard Tab */}
          <TabsContent value="dashboard">
            {!isMinor && selectedChildId ? (
              <div className="space-y-4">
                {/* Child Selector for Parents */}
                {activeRelationships.length > 1 && (
                  <Card>
                    <CardContent className="pt-6">
                      <div className="flex items-center gap-4">
                        <span className="text-sm font-medium">
                          Viewing dashboard for:
                        </span>
                        <div className="flex gap-2">
                          {activeRelationships.map((relationship) => (
                            <Button
                              key={relationship.id}
                              variant={
                                selectedChildId === relationship.childUserId
                                  ? "default"
                                  : "outline"
                              }
                              size="sm"
                              onClick={() => {
                                setSelectedChildId(relationship.childUserId);
                                setSelectedRelationshipId(relationship.id);
                              }}
                            >
                              {relationship.childEmail}
                            </Button>
                          ))}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}

                <ParentDashboard childUserId={selectedChildId} />
              </div>
            ) : (
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center py-8">
                    <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-medium mb-2">
                      {isMinor ? "Connected with Family" : "No Child Selected"}
                    </h3>
                    <p className="text-muted-foreground">
                      {isMinor
                        ? "Your family members can see the information you choose to share with them."
                        : "Select a child from the relationships above to view their dashboard."}
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Exploration Tab */}
          <TabsContent value="exploration">
            {!isMinor && selectedChildId && activeRelationships.length > 0 ? (
              <ExplorationInterface
                childUserId={selectedChildId}
                childInterests={[]} // This would be loaded from the dashboard data
                childAge={16} // This would come from the child's profile
              />
            ) : isMinor ? (
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center py-8">
                    <Plus className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-medium mb-2">
                      Explore New Interests
                    </h3>
                    <p className="text-muted-foreground">
                      Discover new activities and interests to add to your
                      journey.
                    </p>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center py-8">
                    <Plus className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">
                      Select a child to view exploration suggestions.
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Privacy/Settings Tab */}
          <TabsContent value="privacy">
            {isMinor ? (
              <ChildPrivacySettings isMinor={isMinor} />
            ) : (
              <div className="space-y-4">
                {/* Active Relationships */}
                <Card>
                  <CardHeader>
                    <CardTitle>Active Connections</CardTitle>
                    <CardDescription>
                      Family members you're currently connected with
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {activeRelationships.length === 0 ? (
                      <p className="text-muted-foreground text-center py-4">
                        No active connections.
                      </p>
                    ) : (
                      <div className="space-y-3">
                        {activeRelationships.map((relationship) => (
                          <div
                            key={relationship.id}
                            className="flex items-center justify-between p-3 border rounded-lg"
                          >
                            <div>
                              <p className="font-medium">
                                {relationship.childEmail}
                              </p>
                              <p className="text-sm text-muted-foreground">
                                {relationship.relationshipType.replace(
                                  "_",
                                  " "
                                )}{" "}
                                • Connected{" "}
                                {new Date(
                                  relationship.createdAt
                                ).toLocaleDateString()}
                              </p>
                            </div>
                            <Badge>Active</Badge>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Add New Connection */}
                <FamilyModeActivation
                  userAge={currentUser.ageRangeMin}
                  isMinor={isMinor}
                />
              </div>
            )}
          </TabsContent>

          {/* Safety Tab */}
          <TabsContent value="safety">
            {selectedRelationshipId ? (
              <FamilySafetyControls
                relationshipId={selectedRelationshipId}
                isParent={!isMinor}
                childAge={16} // This would come from the relationship data
              />
            ) : (
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center py-8">
                    <Activity className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">
                      Select a relationship to view safety controls.
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Activity Log Tab */}
          <TabsContent value="activity">
            {selectedRelationshipId ? (
              <FamilyActivityLog relationshipId={selectedRelationshipId} />
            ) : (
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center py-8">
                    <Activity className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">
                      Select a relationship to view activity log.
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      )}

      {/* Error Display */}
      {error && (
        <Alert className="border-destructive/20 bg-destructive/10">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
    </div>
  );
}
