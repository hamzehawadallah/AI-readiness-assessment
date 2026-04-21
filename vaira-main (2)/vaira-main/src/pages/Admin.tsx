import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { AdminLogin } from "@/components/admin/AdminLogin";
import { AdminDashboard } from "@/components/admin/AdminDashboard";
import { Loader2 } from "lucide-react";

export default function Admin() {
  const { user, isAdmin, isLoading } = useAuth();
  const navigate = useNavigate();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Not logged in - show login
  if (!user) {
    return <AdminLogin />;
  }

  // Logged in but not admin
  if (!isAdmin) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 p-8">
        <h1 className="text-2xl font-bold text-foreground">Access Denied</h1>
        <p className="text-muted-foreground text-center max-w-md">
          Your account does not have admin privileges. Please contact an administrator if you believe this is an error.
        </p>
        <button
          onClick={() => navigate("/")}
          className="mt-4 text-primary hover:underline"
        >
          Return to Assessment
        </button>
      </div>
    );
  }

  // Admin user - show dashboard
  return <AdminDashboard />;
}
