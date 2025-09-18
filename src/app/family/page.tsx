import { AuthService } from "@/lib/auth";
import { redirect } from "next/navigation";
import FamilyModeInterface from "@/components/family/FamilyModeInterface";

export default async function FamilyPage() {
  const currentUser = await AuthService.getCurrentUser();

  if (!currentUser) {
    redirect("/register");
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Family Mode</h1>
          <p className="text-muted-foreground">
            Connect with family members to share your growth journey together.
          </p>
        </div>

        <FamilyModeInterface currentUser={currentUser} />
      </div>
    </div>
  );
}
