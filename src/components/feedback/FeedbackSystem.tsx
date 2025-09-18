"use client";

import React, { useState } from "react";
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  Input,
  Alert,
} from "@/components/ui";
import { useSuccessToast, useErrorToast } from "@/components/ui/Toast";
import { useLoadingState } from "@/hooks/useLoadingState";
import { cn, getEncouragingMessage } from "@/lib/ui-utils";

export interface FeedbackData {
  type: "bug" | "feature" | "improvement" | "general";
  message: string;
  email?: string;
  rating?: number;
  context?: Record<string, any>;
}

export interface FeedbackSystemProps {
  onSubmit?: (feedback: FeedbackData) => Promise<void>;
  className?: string;
  variant?: "modal" | "inline" | "floating";
  showRating?: boolean;
  showEmail?: boolean;
  ageGroup?: "child" | "teen" | "adult";
}

const FeedbackSystem: React.FC<FeedbackSystemProps> = ({
  onSubmit,
  className,
  variant = "inline",
  showRating = true,
  showEmail = true,
  ageGroup = "teen",
}) => {
  const [isOpen, setIsOpen] = useState(variant !== "floating");
  const [feedbackType, setFeedbackType] =
    useState<FeedbackData["type"]>("general");
  const [message, setMessage] = useState("");
  const [email, setEmail] = useState("");
  const [rating, setRating] = useState<number>(0);

  const { isLoading, execute } = useLoadingState();
  const showSuccess = useSuccessToast();
  const showError = useErrorToast();

  const feedbackTypes = {
    bug: {
      label:
        ageGroup === "child"
          ? "Something's not working! 🐛"
          : "Report a Bug 🐛",
      description:
        ageGroup === "child"
          ? "Tell us what went wrong!"
          : "Found something that's not working as expected?",
      placeholder:
        ageGroup === "child"
          ? "What happened? Tell us everything!"
          : "Describe what went wrong and what you expected to happen...",
    },
    feature: {
      label:
        ageGroup === "child"
          ? "I have a cool idea! 💡"
          : "Request a Feature 💡",
      description:
        ageGroup === "child"
          ? "What awesome thing should we add?"
          : "Have an idea for a new feature?",
      placeholder:
        ageGroup === "child"
          ? "What cool new thing would you like to see?"
          : "Describe the feature you'd like to see...",
    },
    improvement: {
      label:
        ageGroup === "child"
          ? "Make it even better! ⭐"
          : "Suggest Improvement ⭐",
      description:
        ageGroup === "child"
          ? "How can we make this more awesome?"
          : "How can we make this better?",
      placeholder:
        ageGroup === "child"
          ? "How can we make this more fun and awesome?"
          : "What improvements would you like to see?",
    },
    general: {
      label:
        ageGroup === "child" ? "Just saying hi! 👋" : "General Feedback 💬",
      description:
        ageGroup === "child"
          ? "Tell us anything you want!"
          : "Share your thoughts with us",
      placeholder:
        ageGroup === "child"
          ? "What do you want to tell us?"
          : "Share your thoughts, questions, or comments...",
    },
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!message.trim()) {
      showError(
        ageGroup === "child"
          ? "Don't forget to tell us what you're thinking! ✏️"
          : "Please enter your feedback message."
      );
      return;
    }

    const feedbackData: FeedbackData = {
      type: feedbackType,
      message: message.trim(),
      email: email.trim() || undefined,
      rating: showRating ? rating : undefined,
      context: {
        ageGroup,
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent,
        url: window.location.href,
      },
    };

    await execute(
      async () => {
        if (onSubmit) {
          await onSubmit(feedbackData);
        } else {
          // Default submission (could be to an API endpoint)
          await new Promise((resolve) => setTimeout(resolve, 1000)); // Simulate API call
        }
      },
      {
        onSuccess: () => {
          showSuccess(
            ageGroup === "child"
              ? getEncouragingMessage("progress")
              : "Thanks for your feedback! We really appreciate it. 🙏"
          );

          // Reset form
          setMessage("");
          setEmail("");
          setRating(0);
          setFeedbackType("general");

          if (variant === "floating") {
            setIsOpen(false);
          }
        },
        onError: (error) => {
          showError(
            ageGroup === "child"
              ? "Oops! We couldn't send your message. Let's try again! 🔄"
              : "Failed to submit feedback. Please try again."
          );
        },
      }
    );
  };

  const StarRating: React.FC<{
    value: number;
    onChange: (value: number) => void;
  }> = ({ value, onChange }) => (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          onClick={() => onChange(star)}
          className={cn(
            "w-8 h-8 rounded-full transition-all duration-200",
            "hover:scale-110 focus:outline-none focus:ring-2 focus:ring-primary-500",
            star <= value
              ? "text-warning-500 hover:text-warning-600"
              : "text-neutral-300 hover:text-warning-400"
          )}
          aria-label={`Rate ${star} star${star !== 1 ? "s" : ""}`}
        >
          <svg
            className="w-full h-full"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
        </button>
      ))}
      <span className="ml-2 text-sm text-neutral-600">
        {value > 0 ? `${value}/5` : "Rate your experience"}
      </span>
    </div>
  );

  const feedbackForm = (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Feedback Type Selection */}
      <div>
        <label className="block text-sm font-medium text-neutral-700 mb-3">
          {ageGroup === "child"
            ? "What kind of message is this?"
            : "What type of feedback?"}
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {Object.entries(feedbackTypes).map(([type, config]) => (
            <button
              key={type}
              type="button"
              onClick={() => setFeedbackType(type as FeedbackData["type"])}
              className={cn(
                "p-3 rounded-xl border-2 text-left transition-all duration-200",
                "hover:scale-[1.02] focus:outline-none focus:ring-2 focus:ring-primary-500",
                feedbackType === type
                  ? "border-primary-500 bg-primary-50 text-primary-700"
                  : "border-neutral-200 bg-white hover:border-primary-300"
              )}
            >
              <div className="font-medium text-sm">{config.label}</div>
              <div className="text-xs text-neutral-600 mt-1">
                {config.description}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Rating */}
      {showRating && (
        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-3">
            {ageGroup === "child"
              ? "How awesome is Life Leveling?"
              : "How would you rate your experience?"}
          </label>
          <StarRating value={rating} onChange={setRating} />
        </div>
      )}

      {/* Message */}
      <div>
        <label
          htmlFor="feedback-message"
          className="block text-sm font-medium text-neutral-700 mb-2"
        >
          {ageGroup === "child" ? "Tell us more!" : "Your message"}
        </label>
        <textarea
          id="feedback-message"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder={feedbackTypes[feedbackType].placeholder}
          rows={4}
          className={cn(
            "w-full px-3 py-2 border border-neutral-300 rounded-xl",
            "focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500",
            "resize-none transition-all duration-200"
          )}
          required
        />
      </div>

      {/* Email */}
      {showEmail && (
        <Input
          label={
            ageGroup === "child"
              ? "Email (if you want us to write back!)"
              : "Email (optional)"
          }
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="your@email.com"
          helperText={
            ageGroup === "child"
              ? "We'll only use this to reply to you!"
              : "We'll only use this to respond to your feedback"
          }
        />
      )}

      {/* Submit Button */}
      <div className="flex justify-end">
        <Button
          type="submit"
          variant="primary"
          size="lg"
          isLoading={isLoading}
          playful={ageGroup === "child"}
          className="min-w-[120px]"
        >
          {isLoading
            ? "Sending..."
            : ageGroup === "child"
            ? "Send Message! 🚀"
            : "Send Feedback"}
        </Button>
      </div>
    </form>
  );

  if (variant === "floating") {
    return (
      <>
        {/* Floating Button */}
        {!isOpen && (
          <button
            onClick={() => setIsOpen(true)}
            className={cn(
              "fixed bottom-6 right-6 z-50",
              "bg-primary-500 hover:bg-primary-600 text-white",
              "w-14 h-14 rounded-full shadow-large hover:shadow-glow",
              "flex items-center justify-center",
              "transition-all duration-200 hover:scale-110",
              "focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
            )}
            aria-label="Open feedback form"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
              />
            </svg>
          </button>
        )}

        {/* Floating Modal */}
        {isOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
            <Card className="w-full max-w-lg max-h-[90vh] overflow-y-auto">
              <CardHeader
                title={
                  ageGroup === "child"
                    ? "Tell us what you think! 💭"
                    : "Share Your Feedback"
                }
                subtitle={
                  ageGroup === "child"
                    ? "We love hearing from you!"
                    : "Help us make Life Leveling better"
                }
                action={
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsOpen(false)}
                    aria-label="Close feedback form"
                  >
                    ✕
                  </Button>
                }
              />
              <CardContent>{feedbackForm}</CardContent>
            </Card>
          </div>
        )}
      </>
    );
  }

  return (
    <Card className={cn("w-full max-w-2xl", className)} variant="elevated">
      <CardHeader
        title={
          ageGroup === "child"
            ? "Tell us what you think! 💭"
            : "Share Your Feedback"
        }
        subtitle={
          ageGroup === "child"
            ? "We love hearing from you!"
            : "Help us make Life Leveling better"
        }
      />
      <CardContent>{feedbackForm}</CardContent>
    </Card>
  );
};

export default FeedbackSystem;
