import { useLocation } from "react-router-dom";
import { VCLLogo } from "@/components/VCLLogo";
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";
import { authApi, getAdminToken, clearAdminToken } from "@/lib/apiClient";
import { useEffect, useState } from "react";

export function Header() {
  const location = useLocation();
  const isAdminPage = location.pathname === "/admin" || location.pathname === "/admin/";
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    if (getAdminToken()) {
      authApi.check()
        .then(() => setIsLoggedIn(true))
        .catch(() => { clearAdminToken(); setIsLoggedIn(false); });
    }
  }, []);

  const handleLogout = async () => {
    await authApi.logout().catch(() => {});
    clearAdminToken();
    window.location.reload();
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex h-16 items-center justify-between px-4">
        <div className="flex-1" />
        <VCLLogo className="h-8 md:h-10 w-auto" />
        <div className="flex-1 flex justify-end">
          {isAdminPage && isLoggedIn && (
            <Button variant="ghost" size="sm" onClick={handleLogout}>
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}
