import { createBrowserRouter } from "react-router";
import MainLayout from "./layouts/MainLayout";
import AuthLayout from "./layouts/AuthLayout";

// Public Pages
import LandingPage from "./pages/LandingPage";

// Auth Pages
import LoginPage from "./pages/auth/LoginPage";
import ForgotPasswordPage from "./pages/auth/ForgotPasswordPage";
import ResetPasswordPage from "./pages/auth/ResetPasswordPage";

// Dashboard
import DashboardPage from "./pages/dashboard/DashboardPage";

// Employee Management
import EmployeeListPage from "./pages/employees/EmployeeListPage";
import EmployeeAddPage from "./pages/employees/EmployeeAddPage";
import EmployeeEditPage from "./pages/employees/EmployeeEditPage";
import EmployeeProfilePage from "./pages/employees/EmployeeProfilePage";

// Attendance Management
import AttendanceDashboard from "./pages/attendance/AttendanceDashboard";
import AttendanceCalendar from "./pages/attendance/AttendanceCalendar";

// Leave Management
import LeaveRequestPage from "./pages/leave/LeaveRequestPage";
import LeaveApprovalPage from "./pages/leave/LeaveApprovalPage";
import LeaveHistoryPage from "./pages/leave/LeaveHistoryPage";

// Payroll Management
import PayrollDashboard from "./pages/payroll/PayrollDashboard";
import PayslipPage from "./pages/payroll/PayslipPage";
import PayrollTablePage from "./pages/payroll/PayrollTablePage";
import ProcessPayrollPage from "./pages/payroll/ProcessPayrollPage";

// Departments & Roles
import DepartmentsPage from "./pages/departments/DepartmentsPage";
import RolesPage from "./pages/roles/RolesPage";

// Performance
import PerformanceReviewsPage from "./pages/performance/PerformanceReviewsPage";
import PerformanceFeedbackPage from "./pages/performance/PerformanceFeedbackPage";

// Settings
import ProfileSettingsPage from "./pages/settings/ProfileSettingsPage";
import CompanySettingsPage from "./pages/settings/CompanySettingsPage";
import SecuritySettingsPage from "./pages/settings/SecuritySettingsPage";

// Reports & Analytics
import ReportsPage from "./pages/reports/ReportsPage";

// Admin Module
import AdminLayout from "./layouts/AdminLayout";
import AdminDashboardPage from "./pages/admin/AdminDashboardPage";
import AdminUsersPage from "./pages/admin/AdminUsersPage";
import AdminRolesPage from "./pages/admin/AdminRolesPage";
import AdminDepartmentsPage from "./pages/admin/AdminDepartmentsPage";
import AdminApprovalsPage from "./pages/admin/AdminApprovalsPage";
import AdminAuditLogsPage from "./pages/admin/AdminAuditLogsPage";
import AdminReportsPage from "./pages/admin/AdminReportsPage";
import AdminSettingsPage from "./pages/admin/AdminSettingsPage";

// Employee Self-Service Module
import EmployeeLayout from "./layouts/EmployeeLayout";
import EmployeeDashboardPage from "./pages/employee/EmployeeDashboardPage";
import EmployeeAttendancePage from "./pages/employee/EmployeeAttendancePage";
import EmployeeLeavePage from "./pages/employee/EmployeeLeavePage";
import EmployeePayrollPage from "./pages/employee/EmployeePayrollPage";

// Not Found
import NotFoundPage from "./pages/NotFoundPage";

export const router = createBrowserRouter([
  // Public landing page (no auth required)
  { path: "/", Component: LandingPage },

  {
    path: "/auth",
    Component: AuthLayout,
    children: [
      { path: "login", Component: LoginPage },
      { path: "forgot-password", Component: ForgotPasswordPage },
      { path: "reset-password", Component: ResetPasswordPage },
    ],
  },
  {
    path: "/admin",
    Component: AdminLayout,
    children: [
      { index: true, Component: AdminDashboardPage },
      { path: "users", Component: AdminUsersPage },
      { path: "roles", Component: AdminRolesPage },
      { path: "departments", Component: AdminDepartmentsPage },
      { path: "approvals", Component: AdminApprovalsPage },
      { path: "audit-logs", Component: AdminAuditLogsPage },
      { path: "reports", Component: AdminReportsPage },
      { path: "settings", Component: AdminSettingsPage },
    ],
  },

  // Employee self-service panel (Employee role only)
  {
    path: "/employee",
    Component: EmployeeLayout,
    children: [
      { index: true, Component: EmployeeDashboardPage },
      { path: "dashboard", Component: EmployeeDashboardPage },
      { path: "attendance", Component: EmployeeAttendancePage },
      { path: "leave", Component: EmployeeLeavePage },
      { path: "payroll", Component: EmployeePayrollPage },
    ],
  },
  // Protected app routes (dashboard + modules) wrapped in MainLayout
  {
    Component: MainLayout,
    children: [
      // Dashboard
      { path: "/dashboard", Component: DashboardPage },

      // Employees
      { path: "/employees", Component: EmployeeListPage },
      { path: "/employees/add", Component: EmployeeAddPage },
      { path: "/employees/edit/:id", Component: EmployeeEditPage },
      { path: "/employees/profile/:id", Component: EmployeeProfilePage },

      // Attendance
      { path: "/attendance", Component: AttendanceDashboard },
      { path: "/attendance/calendar", Component: AttendanceCalendar },

      // Leave
      { path: "/leave/request", Component: LeaveRequestPage },
      { path: "/leave/approval", Component: LeaveApprovalPage },
      { path: "/leave/history", Component: LeaveHistoryPage },

      // Payroll
      { path: "/payroll", Component: PayrollDashboard },
      { path: "/payroll/process", Component: ProcessPayrollPage },
      { path: "/payroll/payslip/:id", Component: PayslipPage },
      { path: "/payroll/table", Component: PayrollTablePage },

      // Departments & Roles
      { path: "/departments", Component: DepartmentsPage },
      { path: "/roles", Component: RolesPage },

      // Performance
      { path: "/performance/reviews", Component: PerformanceReviewsPage },
      { path: "/performance/feedback", Component: PerformanceFeedbackPage },

      // Settings
      { path: "/settings/profile", Component: ProfileSettingsPage },
      { path: "/settings/company", Component: CompanySettingsPage },
      { path: "/settings/security", Component: SecuritySettingsPage },

      // Reports
      { path: "/reports", Component: ReportsPage },
    ],
  },

  // Not Found (catch-all)
  { path: "*", Component: NotFoundPage },
]);
