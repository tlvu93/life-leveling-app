import { Suspense } from "react";
import { redirect } from "next/navigation";
import { AuthService } from "@/lib/auth";
import { getUserByEmail } from "@/lib/database-operations";
import ArchitectModeInterface from "@/components/architect/ArchitectModeInterface";

export default async function ArchitectPage() {
  const user = await AuthService.getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  const userProfile = await getUserByEmail(user.id);

  if (!userProfile) {
    redirect("/register");
  }

  if (!userProfile.onboardingCompleted) {
    redirect("/onboarding");
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 p-4">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            🏗️ Architect Mode
          </h1>
          <p className="text-lg text-gray-600">
            Simulate different scenarios and explore potential growth paths
          </p>
        </div>

        <Suspense
          fallback={
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
            </div>
          }
        >
          <ArchitectModeInterface userProfile={userProfile} />
        </Suspense>
      </div>
    </div>
  );
}
