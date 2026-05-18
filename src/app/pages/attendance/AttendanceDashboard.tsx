import { useCallback, useEffect, useState } from "react";
import type React from "react";
import { Link } from "react-router";
import {
  Calendar as CalendarIcon,
  CheckCircle,
  Clock,
  Download,
  Loader2,
  Users,
  XCircle,
  AlertTriangle,
} from "lucide-react";
import { toast } from "sonner";
import { Badge } from "../../components/ui/badge";
import { Button } from "../../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../../components/ui/table";
import {
  getAllEmployees,
  getAttendanceWithEmployees,
  type AttendanceWithEmployee,
} from "../../../lib/services/attendanceService";
import type { Employee } from "../../../lib/types/database";

type EmployeePick = Pick<Employee, "id" | "name" | "role" | "avatar" | "status">;

function toLocalISODate(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function formatDuration(hoursStr: string) {
  const val = parseFloat(hoursStr);
  if (Number.isNaN(val) || val === 0) return "-";
  const h = Math.floor(val);
  const m = Math.round((val - h) * 60);
  if (h > 0 && m > 0) return `${h}h ${m}m`;
  if (h > 0) return `${h}h`;
  return `${m}m`;
}

function statusVariant(status: string) {
  switch (status) {
    case "Present":
      return "default" as const;
    case "Late":
    case "Present (Late)":
    case "Half Day":
      return "secondary" as const;
    case "Absent":
      return "destructive" as const;
    default:
      return "outline" as const;
  }
}

export default function AttendanceDashboard() {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [records, setRecords] = useState<AttendanceWithEmployee[]>([]);
  const [employees, setEmployees] = useState<EmployeePick[]>([]);
  const [loading, setLoading] = useState(true);

  const todayISO = toLocalISODate(currentTime);

  useEffect(() => {
    const timer = window.setInterval(() => setCurrentTime(new Date()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [attendanceData, empList] = await Promise.all([
        getAttendanceWithEmployees(todayISO),
        getAllEmployees(),
      ]);
      setRecords(attendanceData);
      setEmployees(empList);
    } catch (error: any) {
      toast.error("Failed to load attendance: " + error.message);
    } finally {
      setLoading(false);
    }
  }, [todayISO]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleExport = () => {
    if (records.length === 0) {
      toast.error("No attendance data to export");
      return;
    }

    const headers = ["Employee Name", "Role", "Check In", "Check Out", "Hours", "Overtime", "Status"];
    const escapeCSV = (value: string | number) => {
      const str = String(value ?? "");
      return str.includes(",") || str.includes('"') || str.includes("\n")
        ? `"${str.replace(/"/g, '""')}"`
        : str;
    };
    const rows = records.map((r) => [
      r.employee_name,
      r.employee_role,
      r.check_in,
      r.check_out,
      r.hours,
      r.overtime_hours,
      r.status,
    ]);
    const csvContent = [
      headers.map(escapeCSV).join(","),
      ...rows.map((row) => row.map(escapeCSV).join(",")),
    ].join("\n");
    const blob = new Blob(["﻿" + csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `attendance_${todayISO}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.success(`Exported ${records.length} record(s) to CSV`);
  };

  const totalEmployees = employees.length;
  const presentCount = records.filter((r) =>
    ["Present", "Late", "Present (Late)", "Half Day"].includes(r.status)
  ).length;
  const lateCount = records.filter(
    (r) => r.status === "Late" || r.status === "Present (Late)"
  ).length;
  const absentCount = records.filter((r) => r.status === "Absent").length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold text-gray-900">Attendance</h1>
          <p className="text-gray-600 mt-1">
            Today:{" "}
            {currentTime.toLocaleDateString("en-US", {
              weekday: "long",
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </p>
          <p className="text-sm text-gray-500 mt-1">Office time: 9:00 AM - 5:00 PM</p>
          <p className="text-xs text-gray-400 mt-1">
            Employees check in and out from their own panel. This view is read-only.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link to="/attendance/calendar">
              <CalendarIcon className="w-4 h-4 mr-2" />
              Calendar View
            </Link>
          </Button>
          <Button variant="outline" onClick={handleExport}>
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          label="Total Employees"
          value={totalEmployees}
          icon={<Users className="w-6 h-6" />}
          tone="blue"
        />
        <StatCard
          label="Present"
          value={presentCount}
          icon={<CheckCircle className="w-6 h-6" />}
          tone="green"
        />
        <StatCard
          label="Absent"
          value={absentCount}
          icon={<XCircle className="w-6 h-6" />}
          tone="red"
        />
        <StatCard
          label="Late"
          value={lateCount}
          icon={<Clock className="w-6 h-6" />}
          tone="orange"
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Today's Attendance</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            {loading ? (
              <div className="flex items-center justify-center py-16">
                <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                <span className="ml-3 text-gray-500">Loading attendance...</span>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Employee</TableHead>
                    <TableHead>Check In</TableHead>
                    <TableHead>Check Out</TableHead>
                    <TableHead>Hours</TableHead>
                    <TableHead>Overtime</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {records.map((record) => (
                    <TableRow key={record.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <img
                            src={record.employee_avatar}
                            alt={record.employee_name}
                            className="w-10 h-10 rounded-full object-cover"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${encodeURIComponent(record.employee_name)}&background=3b82f6&color=fff`;
                            }}
                          />
                          <div>
                            <p className="font-medium text-gray-900">{record.employee_name}</p>
                            <p className="text-sm text-gray-500">{record.employee_role}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{record.check_in}</TableCell>
                      <TableCell>{record.check_out}</TableCell>
                      <TableCell>{formatDuration(record.hours)}</TableCell>
                      <TableCell>
                        {parseFloat(record.overtime_hours) > 0 ? (
                          <span className="text-green-600 font-medium">
                            +{formatDuration(record.overtime_hours)}
                          </span>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap items-center gap-2">
                          <Badge variant={statusVariant(record.status)}>{record.status}</Badge>
                          {record.warning && (
                            <Badge
                              variant="outline"
                              className="text-orange-600 border-orange-300 bg-orange-50 gap-1"
                            >
                              <AlertTriangle className="w-3 h-3" />
                              Warning
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function StatCard({
  label,
  value,
  icon,
  tone,
}: {
  label: string;
  value: number;
  icon: React.ReactNode;
  tone: "blue" | "green" | "red" | "orange";
}) {
  const toneClass = {
    blue: "bg-blue-50 text-blue-600",
    green: "bg-green-50 text-green-600",
    red: "bg-red-50 text-red-600",
    orange: "bg-orange-50 text-orange-600",
  }[tone];

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm text-gray-600">{label}</p>
            <p className="text-3xl font-semibold text-gray-900 mt-2">{value}</p>
          </div>
          <div className={`p-3 rounded-lg ${toneClass}`}>{icon}</div>
        </div>
      </CardContent>
    </Card>
  );
}
