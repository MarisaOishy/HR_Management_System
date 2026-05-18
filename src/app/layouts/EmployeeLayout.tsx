import { Outlet } from "react-router";
import { useState } from "react";
import EmployeeProtectedRoute from "../components/EmployeeProtectedRoute";
import EmployeeSidebar from "../components/layout/EmployeeSidebar";
import EmployeeNavbar from "../components/layout/EmployeeNavbar";

export default function EmployeeLayout() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  return (
    <EmployeeProtectedRoute>
      <div className="flex h-screen overflow-hidden bg-gray-50">
        <EmployeeSidebar
          collapsed={sidebarCollapsed}
          onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
        />
        <div className="flex-1 flex flex-col overflow-hidden">
          <EmployeeNavbar onMenuClick={() => setSidebarCollapsed(!sidebarCollapsed)} />
          <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
            <Outlet />
          </main>
        </div>
      </div>
    </EmployeeProtectedRoute>
  );
}
