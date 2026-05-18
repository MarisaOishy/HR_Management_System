import { Outlet, Link, useLocation } from "react-router";
import {
  LayoutDashboard,
  Users,
  Shield,
  Building2,
  CheckSquare,
  ScrollText,
  BarChart3,
  Settings,
  ChevronLeft,
  ArrowLeft,
} from "lucide-react";
import AdminProtectedRoute from "../components/AdminProtectedRoute";
import Navbar from "../components/layout/Navbar";
import { cn } from "../components/ui/utils";
import { useState } from "react";

const adminNavigation = [
  { name: "Dashboard", href: "/admin", icon: LayoutDashboard },
  { name: "Users", href: "/admin/users", icon: Users },
  { name: "Roles & Permissions", href: "/admin/roles", icon: Shield },
  { name: "Departments", href: "/admin/departments", icon: Building2 },
  { name: "Approvals", href: "/admin/approvals", icon: CheckSquare },
  { name: "Audit Logs", href: "/admin/audit-logs", icon: ScrollText },
  { name: "Reports", href: "/admin/reports", icon: BarChart3 },
  { name: "Settings", href: "/admin/settings", icon: Settings },
];

export default function AdminLayout() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const location = useLocation();

  return (
    <AdminProtectedRoute>
      <div className="flex h-screen overflow-hidden bg-gray-50">
        {/* Admin Sidebar */}
        <>
          {/* Mobile overlay */}
          {!sidebarCollapsed && (
            <div
              className="fixed inset-0 bg-black/50 z-40 lg:hidden"
              onClick={() => setSidebarCollapsed(true)}
            />
          )}

          <aside
            className={cn(
              "fixed lg:static inset-y-0 left-0 z-50 flex flex-col bg-gradient-to-b from-slate-900 to-slate-800 border-r border-slate-700 transition-all duration-300",
              sidebarCollapsed ? "-translate-x-full lg:translate-x-0 lg:w-20" : "w-64"
            )}
          >
            {/* Admin Logo */}
            <div className="flex items-center justify-between h-16 px-4 border-b border-slate-700">
              {!sidebarCollapsed && (
                <Link to="/admin" className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
                    <Shield className="w-4 h-4 text-white" />
                  </div>
                  <span className="font-semibold text-white">Admin Panel</span>
                </Link>
              )}
              <button
                onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                className="hidden lg:flex p-1.5 rounded-lg hover:bg-slate-700 transition-colors"
              >
                <ChevronLeft
                  className={cn(
                    "w-5 h-5 text-slate-400 transition-transform",
                    sidebarCollapsed && "rotate-180"
                  )}
                />
              </button>
            </div>

            {/* Navigation */}
            <nav className="flex-1 overflow-y-auto p-4 space-y-1">
              {adminNavigation.map((item) => {
                const isActive =
                  location.pathname === item.href ||
                  (item.href !== "/admin" && location.pathname.startsWith(item.href));
                const Icon = item.icon;

                return (
                  <Link
                    key={item.name}
                    to={item.href}
                    className={cn(
                      "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors group",
                      isActive
                        ? "bg-purple-600/20 text-purple-300 border border-purple-500/30"
                        : "text-slate-300 hover:bg-slate-700/50 hover:text-white"
                    )}
                  >
                    <Icon
                      className={cn(
                        "w-5 h-5 flex-shrink-0",
                        isActive ? "text-purple-400" : "text-slate-400 group-hover:text-white"
                      )}
                    />
                    {!sidebarCollapsed && (
                      <span className="font-medium text-sm">{item.name}</span>
                    )}
                  </Link>
                );
              })}
            </nav>

            {/* Back to main app */}
            {!sidebarCollapsed && (
              <div className="p-4 border-t border-slate-700">
                <Link
                  to="/dashboard"
                  className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700/50 transition-colors"
                >
                  <ArrowLeft className="w-5 h-5" />
                  <span className="font-medium text-sm">Back to HRMS</span>
                </Link>
              </div>
            )}
          </aside>
        </>

        {/* Main content */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <Navbar onMenuClick={() => setSidebarCollapsed(!sidebarCollapsed)} />
          <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
            <Outlet />
          </main>
        </div>
      </div>
    </AdminProtectedRoute>
  );
}
