import { redirect } from "next/navigation";

// Root page - middleware will handle redirects
export default function HomePage() {
  // This will be handled by middleware, but adding fallback
  redirect("/login");
}
