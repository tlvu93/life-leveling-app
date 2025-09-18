"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import PathsDashboard from "@/components/paths/PathsDashboard";

export default function PathsPage() {
  const router = useRouter();
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const response = await fetch("/api/auth/me");
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.user) {
          setUserId(data.user.id);
        } else {
          router.push("/login");
        }
      } else {
        router.push("/login");
      }
    } catch (error) {
      console.error("Auth check failed:", error);
      router.push("/login");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your learning paths...</p>
        </div>
      </div>
    );
  }

  if (!userId) {
    return null; // Will redirect to login
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <PathsDashboard userId={userId} />
    </div>
  );
}
