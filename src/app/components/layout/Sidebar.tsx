import { Link, useLocation } from "react-router";
import {
  LayoutDashboard,
  Users,
  Calendar,
  FileText,
  Landmark,
  Building2,
  TrendingUp,
  Settings,
  BarChart3,
  ChevronLeft,
  Shield,
} from "lucide-react";
import { cn } from "../ui/utils";
import { useAuth } from "../../contexts/AuthContext";

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

const navigation = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Employees", href: "/employees", icon: Users },
  { name: "Attendance", href: "/attendance", icon: Calendar },
  { name: "Leave", href: "/leave/approval", icon: FileText },
  { name: "Payroll", href: "/payroll", icon: Landmark },
  { name: "Departments", href: "/departments", icon: Building2 },
  { name: "Roles", href: "/roles", icon: Shield, restrictedFor: ["HR"] },
  { name: "Performance", href: "/performance/reviews", icon: TrendingUp },
  { name: "Reports", href: "/reports", icon: BarChart3 },
  { name: "Settings", href: "/settings/profile", icon: Settings, restrictedFor: ["HR"] },
];

export default function Sidebar({ collapsed, onToggle }: SidebarProps) {
  const location = useLocation();
  const { role, initials, user } = useAuth();
  const userEmail = user?.email || "";
  const visibleNavigation = navigation.filter(
    (item) => !item.restrictedFor || !item.restrictedFor.includes(role)
  );

  return (
    <>
      {/* Mobile overlay */}
      {!collapsed && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={onToggle}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed lg:static inset-y-0 left-0 z-50 flex flex-col bg-white border-r border-gray-200 transition-all duration-300",
          collapsed ? "-translate-x-full lg:translate-x-0 lg:w-20" : "w-64"
        )}
      >
        {/* Logo */}
        <div className="flex items-center justify-between h-16 px-4 border-b border-gray-200">
          {!collapsed && (
            <Link to="/dashboard" className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">BD</span>
              </div>
              <span className="font-semibold text-gray-900">BanglaHR</span>
            </Link>
          )}
          <button
            onClick={onToggle}
            className="hidden lg:flex p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <ChevronLeft
              className={cn(
                "w-5 h-5 text-gray-600 transition-transform",
                collapsed && "rotate-180"
              )}
            />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto p-4 space-y-1">
          {visibleNavigation.map((item) => {
            const isActive =
              location.pathname === item.href ||
              (item.href !== "/" && location.pathname.startsWith(item.href));
            const Icon = item.icon;

            return (
              <Link
                key={item.name}
                to={item.href}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors group",
                  isActive
                    ? "bg-blue-50 text-blue-700"
                    : "text-gray-700 hover:bg-gray-100"
                )}
              >
                <Icon
                  className={cn(
                    "w-5 h-5 flex-shrink-0",
                    isActive ? "text-blue-700" : "text-gray-500 group-hover:text-gray-700"
                  )}
                />
                {!collapsed && (
                  <span className="font-medium">{item.name}</span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* User info (bottom) */}
        {!collapsed && (
          <div className="p-4 border-t border-gray-200">
            <div className="flex items-center gap-3 p-3 rounded-lg bg-gray-50">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-semibold">
                {initials}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {role}
                </p>
                <p className="text-xs text-gray-500 truncate">{userEmail}</p>
              </div>
            </div>
          </div>
        )}
      </aside>
    </>
  );
}
