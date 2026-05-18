import { Link, Outlet } from "react-router";
import { Home } from "lucide-react";
import { Button } from "../components/ui/button";

export default function AuthLayout() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex flex-col">
      {/* Top navbar */}
      <header className="h-16 px-4 sm:px-6 lg:px-8 flex items-center justify-between bg-white/70 backdrop-blur border-b border-white/60">
        <Link to="/" className="flex items-center gap-2">
          <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-sm">BD</span>
          </div>
          <span className="font-semibold text-gray-900">BanglaHR</span>
        </Link>
        <Button variant="ghost" asChild>
          <Link to="/" className="flex items-center gap-2">
            <Home className="w-4 h-4" />
            Home
          </Link>
        </Button>
      </header>

      {/* Auth content */}
      <div className="flex-1 flex items-center justify-center p-4">
        <Outlet />
      </div>
    </div>
  );
}
