"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Users, Mail, Shield, Eye, CheckCircle, XCircle } from "lucide-react";

interface PendingRequest {
  relationshipId: string;
  parentEmail: string;
  parentAgeRange: string;
  relationshipType: string;
  createdAt: string;
}

interface FamilyModeActivationProps {
  userAge: number;
  isMinor: boolean;
}

export default function FamilyModeActivation({
  userAge,
  isMinor,
}: FamilyModeActivationProps) {
  const [childEmail, setChildEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<"success" | "error" | "info">(
    "info"
  );
  const [pendingRequests, setPendingRequests] = useState<PendingRequest[]>([]);

  // Load pending consent requests for minors
  useEffect(() => {
    if (isMinor) {
      loadPendingRequests();
    }
  }, [isMinor]);

  const loadPendingRequests = async () => {
    try {
      const response = await fetch("/api/family/consent");
      const result = await response.json();

      if (result.success) {
        setPendingRequests(result.data);
      }
    } catch (error) {
      console.error("Failed to load pending requests:", error);
    }
  };

  const handleCreateFamilyLink = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage("");

    try {
      const response = await fetch("/api/family/link", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          childEmail,
          relationshipType: "parent_child",
        }),
      });

      const result = await response.json();

      if (result.success) {
        setMessage(result.message);
        setMessageType("success");
        setChildEmail("");
      } else {
        setMessage(result.error || "Failed to create family link");
        setMessageType("error");
      }
    } catch (error) {
      setMessage("Network error. Please try again.");
      setMessageType("error");
    } finally {
      setIsLoading(false);
    }
  };

  const handleConsentResponse = async (
    relationshipId: string,
    consentGiven: boolean
  ) => {
    setIsLoading(true);

    try {
      const response = await fetch("/api/family/consent", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          relationshipId,
          consentGiven,
        }),
      });

      const result = await response.json();

      if (result.success) {
        setMessage(result.message);
        setMessageType("success");
        // Reload pending requests
        await loadPendingRequests();
      } else {
        setMessage(result.error || "Failed to update consent");
        setMessageType("error");
      }
    } catch (error) {
      setMessage("Network error. Please try again.");
      setMessageType("error");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Family Mode Introduction */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Family Mode
          </CardTitle>
          <CardDescription>
            {isMinor
              ? "Connect with your parent or guardian to share your interests and goals together."
              : "Connect with your child to explore their interests and support their growth journey."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <Shield className="h-5 w-5 text-blue-500 mt-0.5" />
              <div>
                <h4 className="font-medium">Privacy First</h4>
                <p className="text-sm text-muted-foreground">
                  {isMinor
                    ? "You control what your parent can see. You can change these settings anytime."
                    : "Your child controls what you can see. This promotes trust and healthy boundaries."}
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Eye className="h-5 w-5 text-green-500 mt-0.5" />
              <div>
                <h4 className="font-medium">Transparent Activity</h4>
                <p className="text-sm text-muted-foreground">
                  All family interactions are logged and visible to both parties
                  for complete transparency.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Parent Interface - Create Family Link */}
      {!isMinor && (
        <Card>
          <CardHeader>
            <CardTitle>Connect with Your Child</CardTitle>
            <CardDescription>
              Enter your child's email address to send a family connection
              request.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreateFamilyLink} className="space-y-4">
              <div>
                <label
                  htmlFor="childEmail"
                  className="block text-sm font-medium mb-2"
                >
                  Child's Email Address
                </label>
                <Input
                  id="childEmail"
                  type="email"
                  value={childEmail}
                  onChange={(e) => setChildEmail(e.target.value)}
                  placeholder="child@example.com"
                  required
                  disabled={isLoading}
                />
              </div>
              <Button type="submit" disabled={isLoading || !childEmail.trim()}>
                {isLoading ? "Sending Request..." : "Send Connection Request"}
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Child Interface - Pending Consent Requests */}
      {isMinor && pendingRequests.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Family Connection Requests</CardTitle>
            <CardDescription>
              You have pending requests from parents or guardians who want to
              connect with you.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {pendingRequests.map((request) => (
                <div
                  key={request.relationshipId}
                  className="border rounded-lg p-4"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4" />
                      <span className="font-medium">{request.parentEmail}</span>
                      <Badge variant="outline">
                        Age {request.parentAgeRange}
                      </Badge>
                    </div>
                    <span className="text-sm text-muted-foreground">
                      {new Date(request.createdAt).toLocaleDateString()}
                    </span>
                  </div>

                  <p className="text-sm text-muted-foreground mb-4">
                    This person wants to connect with you in Family Mode. They
                    will only be able to see what you choose to share with them.
                  </p>

                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={() =>
                        handleConsentResponse(request.relationshipId, true)
                      }
                      disabled={isLoading}
                      className="flex items-center gap-1"
                    >
                      <CheckCircle className="h-4 w-4" />
                      Accept
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() =>
                        handleConsentResponse(request.relationshipId, false)
                      }
                      disabled={isLoading}
                      className="flex items-center gap-1"
                    >
                      <XCircle className="h-4 w-4" />
                      Decline
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

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
