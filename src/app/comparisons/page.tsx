"use client";

import React, { useEffect, useState } from "react";
import { ComparisonDashboard } from "@/components/comparisons/ComparisonDashboard";

export default function ComparisonsPage() {
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // In a real app, you'd get this from authentication context
    // For now, we'll use a mock user ID or get it from localStorage
    const mockUserId = localStorage.getItem("currentUserId") || "mock-user-id";
    setUserId(mockUserId);
    setLoading(false);
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!userId) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            Please log in to view comparisons
          </h1>
          <p className="text-gray-600">
            You need to be logged in to see your peer comparisons.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <ComparisonDashboard userId={userId} />
    </div>
  );
}
