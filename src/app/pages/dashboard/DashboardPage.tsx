import { useState, useEffect } from "react";
import { Link } from "react-router";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import {
  Users, Calendar, FileText, Landmark,
  TrendingUp, TrendingDown, ArrowRight, Clock,
  CheckCircle, XCircle, Loader2, AlertTriangle,
} from "lucide-react";
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from "recharts";
import {
  getDashboardStats,
  getAttendanceTrend,
  getEmployeeGrowth,
  getDepartmentDistribution,
  getRecentActivities,
  type DashboardStats,
  type AttendanceTrendPoint,
  type EmployeeGrowthPoint,
  type DeptDistribution,
  type RecentActivity,
} from "../../../lib/services/dashboardService";
import { toast } from "sonner";

const COLORS = ["#3b82f6", "#8b5cf6", "#ec4899", "#f59e0b", "#10b981", "#6366f1"];

export default function DashboardPage() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [attendanceTrend, setAttendanceTrend] = useState<AttendanceTrendPoint[]>([]);
  const [employeeGrowth, setEmployeeGrowth] = useState<EmployeeGrowthPoint[]>([]);
  const [deptDistribution, setDeptDistribution] = useState<DeptDistribution[]>([]);
  const [recentActivities, setRecentActivities] = useState<RecentActivity[]>([]);

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const [statsData, trendData, growthData, deptData, activityData] = await Promise.all([
          getDashboardStats(),
          getAttendanceTrend(),
          getEmployeeGrowth(),
          getDepartmentDistribution(),
          getRecentActivities(),
        ]);
        setStats(statsData);
        setAttendanceTrend(trendData);
        setEmployeeGrowth(growthData);
        setDeptDistribution(deptData);
        setRecentActivities(activityData);
      } catch (error: any) {
        toast.error("Failed to load dashboard data: " + error.message);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // ── Format payroll as "Tk XXK" ────────────────────────────
  const formatPayroll = (amount: number): string => {
    if (amount >= 1000000) return `Tk ${(amount / 1000000).toFixed(1)}M`;
    if (amount >= 1000) return `Tk ${(amount / 1000).toFixed(0)}K`;
    return `Tk ${amount}`;
  };

  // ── Build stat cards from real data ───────────────────────
  const statCards = stats
    ? [
        {
          title: "Total Employees",
          value: stats.totalEmployees.toString(),
          change: `${stats.presentToday} present today`,
          trend: "up" as const,
          icon: Users,
          color: "blue",
        },
        {
          title: "Present Today",
          value: stats.presentToday.toString(),
          change: `${stats.presentPercentage}%`,
          trend: "up" as const,
          icon: CheckCircle,
          color: "green",
        },
        {
          title: "Pending Leaves",
          value: stats.pendingLeaves.toString(),
          change: `${stats.onLeaveToday} on leave today`,
          trend: stats.pendingLeaves > 5 ? ("up" as const) : ("down" as const),
          icon: FileText,
          color: "orange",
        },
        {
          title: "Payroll (Monthly)",
          value: formatPayroll(stats.monthlyPayroll),
          change: `${stats.totalEmployees} employees`,
          trend: "up" as const,
          icon: Landmark,
          color: "purple",
        },
      ]
    : [];

  const colorClasses: Record<string, string> = {
    blue: "bg-blue-50 text-blue-600",
    green: "bg-green-50 text-green-600",
    orange: "bg-orange-50 text-orange-600",
    purple: "bg-purple-50 text-purple-600",
  };

  // ── Icon map for activities ───────────────────────────────
  const iconMap: Record<string, any> = {
    calendar: Calendar,
    check: CheckCircle,
    user: Users,
    briefcase: Landmark,
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-10 h-10 animate-spin text-blue-600" />
        <span className="ml-4 text-lg text-gray-500">Loading dashboard...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-semibold text-gray-900">Dashboard</h1>
        <p className="text-gray-600 mt-1">Welcome back! Here's what's happening today.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat) => {
          const Icon = stat.icon;

          return (
            <Card key={stat.title}>
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm text-gray-600">{stat.title}</p>
                    <p className="text-3xl font-semibold text-gray-900 mt-2">{stat.value}</p>
                    <div className="flex items-center gap-1 mt-2">
                      {stat.trend === "up" ? (
                        <TrendingUp className="w-4 h-4 text-green-600" />
                      ) : (
                        <TrendingDown className="w-4 h-4 text-red-600" />
                      )}
                      <span
                        className={`text-sm ${
                          stat.trend === "up" ? "text-green-600" : "text-red-600"
                        }`}
                      >
                        {stat.change}
                      </span>
                    </div>
                  </div>
                  <div className={`p-3 rounded-lg ${colorClasses[stat.color]}`}>
                    <Icon className="w-6 h-6" />
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Attendance Trend */}
        <Card>
          <CardHeader>
            <CardTitle>Attendance Trend</CardTitle>
          </CardHeader>
          <CardContent>
            {attendanceTrend.length === 0 ? (
              <div className="flex items-center justify-center h-[300px] text-gray-400">
                <AlertTriangle className="w-5 h-5 mr-2" />
                No attendance data available
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={attendanceTrend}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="month" stroke="#6b7280" />
                  <YAxis stroke="#6b7280" />
                  <Tooltip />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="present"
                    stroke="#3b82f6"
                    strokeWidth={2}
                    dot={{ fill: "#3b82f6" }}
                  />
                  <Line
                    type="monotone"
                    dataKey="absent"
                    stroke="#ef4444"
                    strokeWidth={2}
                    dot={{ fill: "#ef4444" }}
                  />
                  <Line
                    type="monotone"
                    dataKey="late"
                    stroke="#f59e0b"
                    strokeWidth={2}
                    dot={{ fill: "#f59e0b" }}
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Employee Growth */}
        <Card>
          <CardHeader>
            <CardTitle>Employee Growth</CardTitle>
          </CardHeader>
          <CardContent>
            {employeeGrowth.length === 0 ? (
              <div className="flex items-center justify-center h-[300px] text-gray-400">
                <AlertTriangle className="w-5 h-5 mr-2" />
                No employee data available
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={employeeGrowth}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="month" stroke="#6b7280" />
                  <YAxis stroke="#6b7280" />
                  <Tooltip />
                  <Bar dataKey="count" fill="#8b5cf6" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Department Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Department Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            {deptDistribution.length === 0 ? (
              <div className="flex items-center justify-center h-[250px] text-gray-400">
                <AlertTriangle className="w-5 h-5 mr-2" />
                No department data
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={deptDistribution}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {deptDistribution.map((_entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Recent Activity</CardTitle>
            <Link to="/reports" className="text-sm text-blue-600 hover:underline flex items-center gap-1">
              View all
              <ArrowRight className="w-4 h-4" />
            </Link>
          </CardHeader>
          <CardContent>
            {recentActivities.length === 0 ? (
              <div className="flex items-center justify-center py-8 text-gray-400">
                <Clock className="w-5 h-5 mr-2" />
                No recent activity
              </div>
            ) : (
              <div className="space-y-4">
                {recentActivities.map((activity) => {
                  const Icon = iconMap[activity.icon] || Clock;

                  return (
                    <div key={activity.id} className="flex items-start gap-4">
                      <div className="p-2 bg-gray-100 rounded-lg">
                        <Icon className="w-4 h-4 text-gray-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-gray-900">
                          <span className="font-medium">{activity.user}</span>{" "}
                          {activity.action}
                        </p>
                        <p className="text-sm text-gray-500 mt-1">{activity.details}</p>
                        <p className="text-xs text-gray-400 mt-1">{activity.timestamp}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <Link
              to="/employees/add"
              className="flex flex-col items-center gap-2 p-4 rounded-lg border-2 border-dashed border-gray-300 hover:border-blue-500 hover:bg-blue-50 transition-colors"
            >
              <Users className="w-6 h-6 text-gray-600" />
              <span className="text-sm font-medium text-gray-700">Add Employee</span>
            </Link>
            <Link
              to="/leave/request"
              className="flex flex-col items-center gap-2 p-4 rounded-lg border-2 border-dashed border-gray-300 hover:border-blue-500 hover:bg-blue-50 transition-colors"
            >
              <FileText className="w-6 h-6 text-gray-600" />
              <span className="text-sm font-medium text-gray-700">Request Leave</span>
            </Link>
            <Link
              to="/attendance"
              className="flex flex-col items-center gap-2 p-4 rounded-lg border-2 border-dashed border-gray-300 hover:border-blue-500 hover:bg-blue-50 transition-colors"
            >
              <Calendar className="w-6 h-6 text-gray-600" />
              <span className="text-sm font-medium text-gray-700">Mark Attendance</span>
            </Link>
            <Link
              to="/reports"
              className="flex flex-col items-center gap-2 p-4 rounded-lg border-2 border-dashed border-gray-300 hover:border-blue-500 hover:bg-blue-50 transition-colors"
            >
              <Landmark className="w-6 h-6 text-gray-600" />
              <span className="text-sm font-medium text-gray-700">View Reports</span>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
