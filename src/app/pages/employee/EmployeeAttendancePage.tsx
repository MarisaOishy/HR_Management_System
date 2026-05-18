import { useCallback, useEffect, useMemo, useState } from "react";
import { Loader2, LogIn, LogOut, AlertTriangle, CalendarDays } from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Badge } from "../../components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../../components/ui/table";
import { useAuth } from "../../contexts/AuthContext";
import {
  getAttendanceByEmployee,
  getEmployeeByEmail,
  getTodayRecord,
  selfCheckIn,
  selfCheckOut,
} from "../../../lib/services/attendanceService";
import type { AttendanceRecord } from "../../../lib/types/database";

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

export default function EmployeeAttendancePage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<"in" | "out" | null>(null);
  const [employeeId, setEmployeeId] = useState<string | null>(null);
  const [todayRecord, setTodayRecord] = useState<AttendanceRecord | null>(null);
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 30000);
    return () => clearInterval(id);
  }, []);

  const fetchData = useCallback(async () => {
    if (!user?.email) {
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      const emp = await getEmployeeByEmail(user.email);
      if (!emp) {
        setEmployeeId(null);
        setRecords([]);
        setTodayRecord(null);
        return;
      }
      setEmployeeId(emp.id);
      const [list, today] = await Promise.all([
        getAttendanceByEmployee(emp.id),
        getTodayRecord(emp.id),
      ]);
      setRecords(list);
      setTodayRecord(today);
    } catch (err: any) {
      toast.error("Failed to load attendance: " + err.message);
    } finally {
      setLoading(false);
    }
  }, [user?.email]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleCheckIn = async () => {
    if (!employeeId) return;
    setActionLoading("in");
    try {
      const result = await selfCheckIn(employeeId);
      toast.success(`Checked in at ${result.record.check_in} (${result.statusLabel})`);
      if (result.warning) toast.warning(result.warning);
      await fetchData();
    } catch (err: any) {
      toast.error(err.message || "Failed to check in");
    } finally {
      setActionLoading(null);
    }
  };

  const handleCheckOut = async () => {
    if (!employeeId) return;
    setActionLoading("out");
    try {
      const result = await selfCheckOut(employeeId);
      toast.success(`Checked out at ${result.record.check_out} (${result.workingTime})`);
      if (result.warning) toast.warning(result.warning);
      await fetchData();
    } catch (err: any) {
      toast.error(err.message || "Failed to check out");
    } finally {
      setActionLoading(null);
    }
  };

  const summary = useMemo(() => {
    const month = now.getMonth();
    const year = now.getFullYear();
    const monthRecs = records.filter((r) => {
      if (!r.date) return false;
      const d = new Date(r.date);
      return d.getMonth() === month && d.getFullYear() === year;
    });
    return {
      present: monthRecs.filter((r) =>
        ["Present", "Present (Late)", "Late", "Half Day"].includes(r.status)
      ).length,
      late: monthRecs.filter((r) =>
        ["Late", "Present (Late)"].includes(r.status)
      ).length,
      absent: monthRecs.filter((r) => r.status === "Absent").length,
      onLeave: monthRecs.filter((r) => r.status === "Leave").length,
    };
  }, [records, now]);

  const todayLabel = now.toLocaleDateString(undefined, {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  const timeLabel = now.toLocaleTimeString();

  const hasCheckedIn = !!(todayRecord?.check_in && todayRecord.check_in !== "-");
  const hasCheckedOut = !!(todayRecord?.check_out && todayRecord.check_out !== "-");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold text-gray-900">My Attendance</h1>
        <p className="text-gray-600 mt-1">Track your check-ins and your attendance history.</p>
      </div>

      {!employeeId && !loading && (
        <Card className="border-amber-200 bg-amber-50">
          <CardContent className="p-6 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5" />
            <div>
              <p className="font-medium text-amber-900">
                Your account is not linked to an employee profile.
              </p>
              <p className="text-sm text-amber-800 mt-1">
                Ask HR to add an employee record with the email{" "}
                <span className="font-semibold">{user?.email}</span>.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Today / Check-in card */}
      <Card>
        <CardHeader>
          <CardTitle>Today</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
            <div>
              <div className="flex items-center gap-2 text-gray-500 text-sm mb-1">
                <CalendarDays className="w-4 h-4" />
                {todayLabel}
              </div>
              <p className="text-4xl font-semibold text-gray-900">{timeLabel}</p>
              <p className="text-sm text-gray-500 mt-1">Office hours: 9:00 AM – 5:00 PM</p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="p-4 rounded-lg bg-gray-50">
                <p className="text-xs text-gray-500">Check-in</p>
                <p className="text-lg font-semibold text-gray-900">
                  {todayRecord?.check_in && todayRecord.check_in !== "-"
                    ? todayRecord.check_in
                    : "—"}
                </p>
              </div>
              <div className="p-4 rounded-lg bg-gray-50">
                <p className="text-xs text-gray-500">Check-out</p>
                <p className="text-lg font-semibold text-gray-900">
                  {todayRecord?.check_out && todayRecord.check_out !== "-"
                    ? todayRecord.check_out
                    : "—"}
                </p>
              </div>
              <div className="p-4 rounded-lg bg-gray-50 col-span-2">
                <p className="text-xs text-gray-500">Status</p>
                {todayRecord ? (
                  <Badge variant={statusVariant(todayRecord.status)} className="mt-1">
                    {todayRecord.status}
                  </Badge>
                ) : (
                  <p className="text-sm text-gray-500 mt-1">Not checked in yet</p>
                )}
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <Button
                size="lg"
                onClick={handleCheckIn}
                disabled={!employeeId || hasCheckedIn || actionLoading !== null}
              >
                {actionLoading === "in" ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <LogIn className="w-4 h-4 mr-2" />
                )}
                {hasCheckedIn ? "Checked in" : "Check in"}
              </Button>
              <Button
                size="lg"
                variant="outline"
                onClick={handleCheckOut}
                disabled={
                  !employeeId ||
                  !hasCheckedIn ||
                  hasCheckedOut ||
                  actionLoading !== null
                }
              >
                {actionLoading === "out" ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <LogOut className="w-4 h-4 mr-2" />
                )}
                {hasCheckedOut ? "Checked out" : "Check out"}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-5">
            <p className="text-sm text-gray-600">Present</p>
            <p className="text-2xl font-semibold text-gray-900 mt-1">{summary.present}</p>
            <p className="text-xs text-gray-500 mt-1">This month</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <p className="text-sm text-gray-600">Late</p>
            <p className="text-2xl font-semibold text-gray-900 mt-1">{summary.late}</p>
            <p className="text-xs text-gray-500 mt-1">This month</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <p className="text-sm text-gray-600">Absent</p>
            <p className="text-2xl font-semibold text-gray-900 mt-1">{summary.absent}</p>
            <p className="text-xs text-gray-500 mt-1">This month</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <p className="text-sm text-gray-600">On Leave</p>
            <p className="text-2xl font-semibold text-gray-900 mt-1">{summary.onLeave}</p>
            <p className="text-xs text-gray-500 mt-1">This month</p>
          </CardContent>
        </Card>
      </div>

      {/* History table */}
      <Card>
        <CardHeader>
          <CardTitle>Attendance History</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center py-12 text-gray-500">
              <Loader2 className="w-5 h-5 animate-spin mr-2" />
              Loading...
            </div>
          ) : records.length === 0 ? (
            <div className="p-12 text-center text-gray-500">
              No attendance records yet.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Check-in</TableHead>
                    <TableHead>Check-out</TableHead>
                    <TableHead>Hours</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {records.map((r) => (
                    <TableRow key={r.id}>
                      <TableCell>{r.date}</TableCell>
                      <TableCell>{r.check_in}</TableCell>
                      <TableCell>{r.check_out}</TableCell>
                      <TableCell>{r.hours}</TableCell>
                      <TableCell>
                        <Badge variant={statusVariant(r.status)}>{r.status}</Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
