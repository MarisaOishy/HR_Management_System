import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router";
import {
  Calendar,
  FileText,
  Landmark,
  CheckCircle2,
  Clock,
  TrendingUp,
  AlertTriangle,
  Loader2,
  ArrowRight,
  Mail,
  Phone,
  Building2,
  BadgeCheck,
} from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Badge } from "../../components/ui/badge";
import { Button } from "../../components/ui/button";
import { useAuth } from "../../contexts/AuthContext";
import { supabase } from "../../../lib/supabase";
import {
  getAttendanceByEmployee,
} from "../../../lib/services/attendanceService";
import {
  getLeaveBalanceByEmployee,
  getLeaveRequestsByEmployee,
} from "../../../lib/services/leaveService";
import { getPayrollByEmployee } from "../../../lib/services/payrollService";
import type {
  AttendanceRecord,
  Employee,
  LeaveBalance,
  LeaveRequest,
  PayrollRecord,
} from "../../../lib/types/database";

export default function EmployeeDashboardPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [leaveBalance, setLeaveBalance] = useState<LeaveBalance | null>(null);
  const [leaves, setLeaves] = useState<LeaveRequest[]>([]);
  const [latestPayroll, setLatestPayroll] = useState<PayrollRecord | null>(null);

  const fetchData = useCallback(async () => {
    if (!user?.email) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);

      const { data: emp, error } = await supabase
        .from("employees")
        .select("*")
        .eq("email", user.email)
        .maybeSingle();

      if (error) throw error;
      setEmployee(emp ?? null);

      if (!emp) return;

      const [att, balance, leaveRequests, payrolls] = await Promise.all([
        getAttendanceByEmployee(emp.id),
        getLeaveBalanceByEmployee(emp.id).catch(() => null),
        getLeaveRequestsByEmployee(emp.id),
        getPayrollByEmployee(emp.id).catch(() => [] as PayrollRecord[]),
      ]);
      setAttendance(att);
      setLeaveBalance(balance);
      setLeaves(leaveRequests);
      setLatestPayroll(payrolls[0] ?? null);
    } catch (err: any) {
      toast.error("Failed to load dashboard: " + err.message);
    } finally {
      setLoading(false);
    }
  }, [user?.email]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-10 h-10 animate-spin text-blue-600" />
        <span className="ml-4 text-lg text-gray-500">Loading your dashboard...</span>
      </div>
    );
  }

  if (!employee) {
    return (
      <Card className="max-w-2xl">
        <CardContent className="p-8 text-center">
          <AlertTriangle className="w-12 h-12 text-amber-500 mx-auto mb-3" />
          <h2 className="text-lg font-semibold text-gray-900 mb-1">
            Your account is not linked to an employee profile
          </h2>
          <p className="text-sm text-gray-600">
            Please ask your HR to add an employee record with the email{" "}
            <span className="font-medium">{user?.email}</span>.
          </p>
        </CardContent>
      </Card>
    );
  }

  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();
  const monthAttendance = attendance.filter((r) => {
    if (!r.date) return false;
    const d = new Date(r.date);
    return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
  });

  const presentDays = monthAttendance.filter((r) =>
    ["Present", "Present (Late)", "Late", "Half Day"].includes(r.status)
  ).length;
  const absentDays = monthAttendance.filter((r) => r.status === "Absent").length;
  const lateDays = monthAttendance.filter((r) =>
    ["Late", "Present (Late)"].includes(r.status)
  ).length;

  const pendingLeaves = leaves.filter((l) => l.status === "Pending").length;
  const approvedLeaves = leaves.filter((l) => l.status === "Approved").length;

  const balanceTotal =
    (leaveBalance?.annual_leave ?? 0) +
    (leaveBalance?.sick_leave ?? 0) +
    (leaveBalance?.casual_leave ?? 0);

  const recentLeaves = leaves.slice(0, 5);

  return (
    <div className="space-y-6">
      {/* Greeting */}
      <div>
        <h1 className="text-3xl font-semibold text-gray-900">
          Hi, {employee.name.split(" ")[0]}
        </h1>
        <p className="text-gray-600 mt-1">
          Here&apos;s a snapshot of your work this month.
        </p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-gray-600">Present (this month)</p>
                <p className="text-3xl font-semibold text-gray-900 mt-2">{presentDays}</p>
                <div className="flex items-center gap-1 mt-2 text-sm text-green-600">
                  <TrendingUp className="w-4 h-4" />
                  {lateDays > 0 ? `${lateDays} late` : "On time"}
                </div>
              </div>
              <div className="p-3 rounded-lg bg-green-50 text-green-600">
                <CheckCircle2 className="w-6 h-6" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-gray-600">Absent</p>
                <p className="text-3xl font-semibold text-gray-900 mt-2">{absentDays}</p>
                <p className="text-sm text-gray-500 mt-2">This month</p>
              </div>
              <div className="p-3 rounded-lg bg-red-50 text-red-600">
                <Clock className="w-6 h-6" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-gray-600">Leave Balance</p>
                <p className="text-3xl font-semibold text-gray-900 mt-2">{balanceTotal}</p>
                <p className="text-sm text-gray-500 mt-2">Days remaining</p>
              </div>
              <div className="p-3 rounded-lg bg-blue-50 text-blue-600">
                <FileText className="w-6 h-6" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-gray-600">Latest Net Salary</p>
                <p className="text-3xl font-semibold text-gray-900 mt-2">
                  {latestPayroll
                    ? `Tk ${latestPayroll.net_salary.toLocaleString()}`
                    : "—"}
                </p>
                <p className="text-sm text-gray-500 mt-2">
                  {latestPayroll?.month ?? "No payslips yet"}
                </p>
              </div>
              <div className="p-3 rounded-lg bg-purple-50 text-purple-600">
                <Landmark className="w-6 h-6" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile card */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>My Profile</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4 mb-6">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white text-2xl font-bold">
                {employee.name
                  .split(" ")
                  .map((n) => n[0])
                  .join("")
                  .toUpperCase()
                  .slice(0, 2)}
              </div>
              <div className="min-w-0">
                <p className="font-semibold text-gray-900 truncate">{employee.name}</p>
                <p className="text-sm text-gray-600 truncate">{employee.role}</p>
                <Badge variant="secondary" className="mt-1">
                  <BadgeCheck className="w-3 h-3 mr-1" />
                  {employee.status}
                </Badge>
              </div>
            </div>

            <ul className="space-y-3 text-sm">
              <li className="flex items-center gap-2 text-gray-700">
                <Mail className="w-4 h-4 text-gray-400" />
                <span className="truncate">{employee.email}</span>
              </li>
              <li className="flex items-center gap-2 text-gray-700">
                <Phone className="w-4 h-4 text-gray-400" />
                <span>{employee.phone || "—"}</span>
              </li>
              <li className="flex items-center gap-2 text-gray-700">
                <Building2 className="w-4 h-4 text-gray-400" />
                <span>{employee.department}</span>
              </li>
              <li className="flex items-center gap-2 text-gray-700">
                <Calendar className="w-4 h-4 text-gray-400" />
                <span>Joined {employee.join_date}</span>
              </li>
            </ul>
          </CardContent>
        </Card>

        {/* Leave balance */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Leave Balance</CardTitle>
            <Link
              to="/employee/leave"
              className="text-sm text-blue-600 hover:underline flex items-center gap-1"
            >
              Manage leaves
              <ArrowRight className="w-4 h-4" />
            </Link>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
              <div className="p-5 rounded-lg bg-blue-50 text-center">
                <p className="text-3xl font-semibold text-blue-700">
                  {leaveBalance?.annual_leave ?? 0}
                </p>
                <p className="text-sm text-gray-600 mt-1">Annual Leave</p>
              </div>
              <div className="p-5 rounded-lg bg-green-50 text-center">
                <p className="text-3xl font-semibold text-green-700">
                  {leaveBalance?.sick_leave ?? 0}
                </p>
                <p className="text-sm text-gray-600 mt-1">Sick Leave</p>
              </div>
              <div className="p-5 rounded-lg bg-purple-50 text-center">
                <p className="text-3xl font-semibold text-purple-700">
                  {leaveBalance?.casual_leave ?? 0}
                </p>
                <p className="text-sm text-gray-600 mt-1">Casual Leave</p>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
              <div className="p-3 rounded-lg bg-gray-50">
                <p className="text-gray-500">Pending</p>
                <p className="text-xl font-semibold text-gray-900">{pendingLeaves}</p>
              </div>
              <div className="p-3 rounded-lg bg-gray-50">
                <p className="text-gray-500">Approved</p>
                <p className="text-xl font-semibold text-gray-900">{approvedLeaves}</p>
              </div>
              <div className="p-3 rounded-lg bg-gray-50">
                <p className="text-gray-500">Total requests</p>
                <p className="text-xl font-semibold text-gray-900">{leaves.length}</p>
              </div>
              <div className="p-3 rounded-lg bg-gray-50">
                <p className="text-gray-500">Available</p>
                <p className="text-xl font-semibold text-gray-900">{balanceTotal}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent leaves */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Recent Leave Requests</CardTitle>
          <Link
            to="/employee/leave"
            className="text-sm text-blue-600 hover:underline flex items-center gap-1"
          >
            View all
            <ArrowRight className="w-4 h-4" />
          </Link>
        </CardHeader>
        <CardContent>
          {recentLeaves.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <FileText className="w-8 h-8 mx-auto mb-2 text-gray-400" />
              <p>No leave requests yet.</p>
              <Button asChild className="mt-3">
                <Link to="/employee/leave">Submit a request</Link>
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {recentLeaves.map((leave) => (
                <div
                  key={leave.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between p-4 border rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <Badge variant="secondary">{leave.type}</Badge>
                    <div>
                      <p className="text-sm text-gray-900 font-medium">
                        {leave.start_date} → {leave.end_date} ({leave.days} day
                        {leave.days > 1 ? "s" : ""})
                      </p>
                      <p className="text-xs text-gray-500">
                        Applied on {leave.applied_date}
                      </p>
                    </div>
                  </div>
                  <Badge
                    className="mt-2 sm:mt-0"
                    variant={
                      leave.status === "Approved"
                        ? "default"
                        : leave.status === "Pending"
                        ? "secondary"
                        : "destructive"
                    }
                  >
                    {leave.status}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
