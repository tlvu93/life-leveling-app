"use client";

import React, { useState } from "react";
import {
  Button,
  Card,
  CardHeader,
  CardContent,
  CardFooter,
  Input,
  Badge,
  Alert,
  LoadingSpinner,
  Skeleton,
  ProgressIndicator,
  ProgressBar,
  useToast,
  useSuccessToast,
  useErrorToast,
} from "@/components/ui";
import FeedbackSystem from "@/components/feedback/FeedbackSystem";
import { useLoadingState } from "@/hooks/useLoadingState";
import {
  useFormValidation,
  commonValidationRules,
} from "@/hooks/useFormValidation";
import { LifeLevelingError, ErrorCodes } from "@/lib/error-handler";
import {
  AppLayout,
  Container,
  PageHeader,
  Section,
} from "@/components/layout/AppLayout";

export default function DesignSystemDemo() {
  const [inputValue, setInputValue] = useState("");
  const [progressValue, setProgressValue] = useState(65);
  const { addToast } = useToast();
  const showSuccess = useSuccessToast();
  const showError = useErrorToast();

  const progressSteps = [
    { id: 1, title: "Getting Started", description: "Set up your profile" },
    { id: 2, title: "Choose Interests", description: "Select what you love" },
    { id: 3, title: "Set Goals", description: "Plan your journey" },
    { id: 4, title: "Track Progress", description: "Watch yourself grow" },
  ];

  return (
    <AppLayout variant="default">
      <Container size="xl">
        <Section spacing="lg">
          <PageHeader
            title="Design System Demo"
            subtitle="Explore the Life Leveling UI components and design patterns"
            breadcrumbs={[
              { label: "Demo", href: "/demo" },
              { label: "Design System" },
            ]}
          />

          {/* Buttons Section */}
          <Card className="mb-8">
            <CardHeader
              title="Buttons"
              subtitle="Interactive button components with various styles and states"
            />
            <CardContent>
              <div className="space-y-6">
                {/* Button Variants */}
                <div>
                  <h4 className="text-sm font-semibold text-neutral-700 mb-3">
                    Variants
                  </h4>
                  <div className="flex flex-wrap gap-3">
                    <Button variant="primary">Primary</Button>
                    <Button variant="secondary">Secondary</Button>
                    <Button variant="success">Success</Button>
                    <Button variant="warning">Warning</Button>
                    <Button variant="error">Error</Button>
                    <Button variant="ghost">Ghost</Button>
                    <Button variant="outline">Outline</Button>
                  </div>
                </div>

                {/* Button Sizes */}
                <div>
                  <h4 className="text-sm font-semibold text-neutral-700 mb-3">
                    Sizes
                  </h4>
                  <div className="flex flex-wrap items-center gap-3">
                    <Button size="sm">Small</Button>
                    <Button size="md">Medium</Button>
                    <Button size="lg">Large</Button>
                    <Button size="xl">Extra Large</Button>
                  </div>
                </div>

                {/* Playful Buttons */}
                <div>
                  <h4 className="text-sm font-semibold text-neutral-700 mb-3">
                    Playful Style
                  </h4>
                  <div className="flex flex-wrap gap-3">
                    <Button variant="primary" playful>
                      Playful Primary
                    </Button>
                    <Button variant="success" playful>
                      Playful Success
                    </Button>
                    <Button variant="secondary" playful>
                      Playful Secondary
                    </Button>
                  </div>
                </div>

                {/* Button States */}
                <div>
                  <h4 className="text-sm font-semibold text-neutral-700 mb-3">
                    States
                  </h4>
                  <div className="flex flex-wrap gap-3">
                    <Button isLoading>Loading</Button>
                    <Button disabled>Disabled</Button>
                    <Button leftIcon={<span>🚀</span>}>With Icon</Button>
                    <Button rightIcon={<span>→</span>}>With Right Icon</Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Cards Section */}
          <Card className="mb-8">
            <CardHeader
              title="Cards"
              subtitle="Flexible container components for content organization"
            />
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <Card variant="default">
                  <CardHeader
                    title="Default Card"
                    subtitle="Standard card styling"
                  />
                  <CardContent>
                    <p className="text-sm text-neutral-600">
                      This is a default card with standard styling and subtle
                      shadows.
                    </p>
                  </CardContent>
                </Card>

                <Card variant="elevated">
                  <CardHeader
                    title="Elevated Card"
                    subtitle="Enhanced shadow depth"
                  />
                  <CardContent>
                    <p className="text-sm text-neutral-600">
                      This card has enhanced shadows for more visual prominence.
                    </p>
                  </CardContent>
                </Card>

                <Card variant="playful">
                  <CardHeader
                    title="Playful Card"
                    subtitle="Age-appropriate styling"
                  />
                  <CardContent>
                    <p className="text-sm text-neutral-600">
                      This card uses playful gradients perfect for younger
                      users.
                    </p>
                  </CardContent>
                </Card>

                <Card variant="outlined" interactive glowing>
                  <CardHeader
                    title="Interactive Card"
                    subtitle="Clickable with hover effects"
                  />
                  <CardContent>
                    <p className="text-sm text-neutral-600">
                      This card is interactive with hover animations and glow
                      effects.
                    </p>
                  </CardContent>
                </Card>
              </div>
            </CardContent>
          </Card>

          {/* Form Elements */}
          <Card className="mb-8">
            <CardHeader
              title="Form Elements"
              subtitle="Input components for user interaction"
            />
            <CardContent>
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Input
                    label="Default Input"
                    placeholder="Enter some text..."
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                  />
                  <Input
                    label="Playful Input"
                    variant="playful"
                    placeholder="Playful styling..."
                    helperText="This input has playful styling"
                  />
                  <Input
                    label="Input with Icon"
                    leftIcon={<span>🔍</span>}
                    placeholder="Search..."
                  />
                  <Input
                    label="Error State"
                    error="This field is required"
                    placeholder="Required field..."
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Badges and Status */}
          <Card className="mb-8">
            <CardHeader
              title="Badges & Status"
              subtitle="Status indicators and skill level badges"
            />
            <CardContent>
              <div className="space-y-6">
                {/* Regular Badges */}
                <div>
                  <h4 className="text-sm font-semibold text-neutral-700 mb-3">
                    Regular Badges
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="default">Default</Badge>
                    <Badge variant="primary">Primary</Badge>
                    <Badge variant="success">Success</Badge>
                    <Badge variant="warning">Warning</Badge>
                    <Badge variant="error">Error</Badge>
                    <Badge dot variant="primary">
                      With Dot
                    </Badge>
                  </div>
                </div>

                {/* Skill Level Badges */}
                <div>
                  <h4 className="text-sm font-semibold text-neutral-700 mb-3">
                    Skill Level Badges
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="skill" skillLevel="novice">
                      Novice
                    </Badge>
                    <Badge variant="skill" skillLevel="intermediate">
                      Intermediate
                    </Badge>
                    <Badge variant="skill" skillLevel="advanced">
                      Advanced
                    </Badge>
                    <Badge variant="skill" skillLevel="expert">
                      Expert
                    </Badge>
                  </div>
                </div>

                {/* Removable Badges */}
                <div>
                  <h4 className="text-sm font-semibold text-neutral-700 mb-3">
                    Removable Badges
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    <Badge
                      variant="primary"
                      removable
                      onRemove={() => console.log("Removed")}
                    >
                      Music
                    </Badge>
                    <Badge
                      variant="secondary"
                      removable
                      onRemove={() => console.log("Removed")}
                    >
                      Sports
                    </Badge>
                    <Badge
                      variant="success"
                      removable
                      onRemove={() => console.log("Removed")}
                    >
                      Art
                    </Badge>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Progress Indicators */}
          <Card className="mb-8">
            <CardHeader
              title="Progress Indicators"
              subtitle="Progress tracking and step indicators"
            />
            <CardContent>
              <div className="space-y-8">
                {/* Progress Steps */}
                <div>
                  <h4 className="text-sm font-semibold text-neutral-700 mb-4">
                    Step Progress
                  </h4>
                  <ProgressIndicator
                    steps={progressSteps}
                    currentStep={2}
                    variant="playful"
                    showDescriptions={true}
                  />
                </div>

                {/* Progress Bars */}
                <div>
                  <h4 className="text-sm font-semibold text-neutral-700 mb-4">
                    Progress Bars
                  </h4>
                  <div className="space-y-4">
                    <ProgressBar
                      value={progressValue}
                      showLabel
                      label="Overall Progress"
                    />
                    <ProgressBar
                      value={85}
                      variant="success"
                      showLabel
                      label="Goal Achievement"
                    />
                    <ProgressBar
                      value={45}
                      variant="playful"
                      animated
                      showLabel
                      label="Skill Development"
                    />
                  </div>
                  <div className="mt-4">
                    <Button
                      size="sm"
                      onClick={() =>
                        setProgressValue(Math.min(progressValue + 10, 100))
                      }
                    >
                      Increase Progress
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Alerts and Feedback */}
          <Card className="mb-8">
            <CardHeader
              title="Alerts & Feedback"
              subtitle="User feedback and notification components"
            />
            <CardContent>
              <div className="space-y-6">
                {/* Alerts */}
                <div>
                  <h4 className="text-sm font-semibold text-neutral-700 mb-3">
                    Alerts
                  </h4>
                  <div className="space-y-4">
                    <Alert variant="info" title="Information">
                      This is an informational alert with helpful details.
                    </Alert>
                    <Alert
                      variant="success"
                      title="Success!"
                      dismissible
                      onDismiss={() => console.log("Dismissed")}
                    >
                      Great job! You&apos;ve completed your goal successfully.
                    </Alert>
                    <Alert variant="warning" title="Warning">
                      Please review your settings before continuing.
                    </Alert>
                    <Alert
                      variant="error"
                      title="Error"
                      dismissible
                      onDismiss={() => console.log("Dismissed")}
                    >
                      Something went wrong. Please try again.
                    </Alert>
                  </div>
                </div>

                {/* Toast Notifications */}
                <div>
                  <h4 className="text-sm font-semibold text-neutral-700 mb-3">
                    Toast Notifications
                  </h4>
                  <div className="flex flex-wrap gap-3">
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() =>
                        addToast({
                          message: "This is an info toast!",
                          variant: "info",
                        })
                      }
                    >
                      Show Info Toast
                    </Button>
                    <Button
                      variant="success"
                      size="sm"
                      onClick={() => showSuccess("Success! Great job!")}
                    >
                      Show Success Toast
                    </Button>
                    <Button
                      variant="error"
                      size="sm"
                      onClick={() => showError("Oops! Something went wrong.")}
                    >
                      Show Error Toast
                    </Button>
                    <Button
                      variant="warning"
                      size="sm"
                      onClick={() =>
                        addToast({
                          message: "This is a warning with an action!",
                          variant: "warning",
                          action: {
                            label: "Fix it",
                            onClick: () => console.log("Action clicked"),
                          },
                        })
                      }
                    >
                      Show Warning with Action
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Loading States */}
          <Card className="mb-8">
            <CardHeader
              title="Loading States"
              subtitle="Loading indicators and skeleton screens"
            />
            <CardContent>
              <div className="space-y-6">
                {/* Loading Spinners */}
                <div>
                  <h4 className="text-sm font-semibold text-neutral-700 mb-3">
                    Loading Spinners
                  </h4>
                  <div className="flex items-center gap-6">
                    <div className="text-center">
                      <LoadingSpinner size="sm" />
                      <p className="text-xs text-neutral-600 mt-2">Small</p>
                    </div>
                    <div className="text-center">
                      <LoadingSpinner size="md" />
                      <p className="text-xs text-neutral-600 mt-2">Medium</p>
                    </div>
                    <div className="text-center">
                      <LoadingSpinner size="lg" />
                      <p className="text-xs text-neutral-600 mt-2">Large</p>
                    </div>
                    <div className="text-center">
                      <LoadingSpinner size="xl" variant="success" />
                      <p className="text-xs text-neutral-600 mt-2">
                        XL Success
                      </p>
                    </div>
                  </div>
                </div>

                {/* Skeleton Loading */}
                <div>
                  <h4 className="text-sm font-semibold text-neutral-700 mb-3">
                    Skeleton Loading
                  </h4>
                  <div className="space-y-4">
                    <div className="flex items-center gap-4">
                      <Skeleton variant="circular" width={48} height={48} />
                      <div className="flex-1">
                        <Skeleton variant="text" lines={2} />
                      </div>
                    </div>
                    <Skeleton variant="rectangular" height={120} />
                    <Skeleton variant="text" lines={3} />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </Section>
      </Container>
    </AppLayout>
  );
}
{
  /* Error Handling Demo */
}
<Card className="mb-8">
  <CardHeader
    title="Error Handling"
    subtitle="Graceful error handling with user-friendly messages"
  />
  <CardContent>
    <div className="space-y-6">
      <div>
        <h4 className="text-sm font-semibold text-neutral-700 mb-3">
          Simulated Errors
        </h4>
        <div className="flex flex-wrap gap-3">
          <Button
            variant="error"
            size="sm"
            onClick={() => {
              throw new LifeLevelingError(
                ErrorCodes.NETWORK_ERROR,
                "Network connection failed",
                "Oops! The internet seems to be playing hide and seek. Let's try again! 🌐",
                "medium"
              );
            }}
          >
            Trigger Network Error
          </Button>
          <Button
            variant="warning"
            size="sm"
            onClick={() => {
              throw new LifeLevelingError(
                ErrorCodes.VALIDATION_ERROR,
                "Validation failed",
                "Hmm, something doesn't look quite right. Let's double-check! ✏️",
                "low"
              );
            }}
          >
            Trigger Validation Error
          </Button>
          <Button
            variant="error"
            size="sm"
            onClick={() => {
              throw new LifeLevelingError(
                ErrorCodes.API_ERROR,
                "Server error",
                "Our servers are having a moment. We're on it! Try again in a bit. ⚡",
                "high"
              );
            }}
          >
            Trigger API Error
          </Button>
        </div>
      </div>
    </div>
  </CardContent>
</Card>;

{
  /* Feedback System */
}
<Card className="mb-8">
  <CardHeader
    title="Feedback System"
    subtitle="User feedback collection with age-appropriate messaging"
  />
  <CardContent>
    <div className="space-y-6">
      <div>
        <h4 className="text-sm font-semibold text-neutral-700 mb-3">
          Feedback Form
        </h4>
        <FeedbackSystem
          variant="inline"
          ageGroup="teen"
          onSubmit={async (feedback) => {
            console.log("Feedback submitted:", feedback);
            // Simulate API call
            await new Promise((resolve) => setTimeout(resolve, 1500));
          }}
        />
      </div>
    </div>
  </CardContent>
</Card>;
