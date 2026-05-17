import { useCallback, useEffect, useState } from "react";
import type React from "react";
import { Link } from "react-router";
import { Calendar as CalendarIcon, CheckCircle, Clock, Download, Loader2, Pencil, RotateCcw, Users, XCircle, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "../../components/ui/badge";
import { Button } from "../../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../../components/ui/dialog";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../../components/ui/table";
import { Textarea } from "../../components/ui/textarea";
import { isAdminOrHR, useAuth } from "../../contexts/AuthContext";
import {
  createAttendance,
  getAllEmployees,
  getAttendanceWithEmployees,
  selfCheckIn,
  selfCheckOut,
  undoAttendanceCheckout,
  updateAttendance,
  type AttendanceWithEmployee,
} from "../../../lib/services/attendanceService";
import type { Employee } from "../../../lib/types/database";

type EmployeePick = Pick<Employee, "id" | "name" | "role" | "avatar" | "status">;
const STATUS_OPTIONS = ["Present", "Late", "Half Day", "Absent", "Leave"] as const;
type EditableStatus = (typeof STATUS_OPTIONS)[number];

function toLocalISODate(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function formatTimeForInput(timeString: string) {
  if (!timeString || timeString === "-") return "";
  const match = timeString.match(/^(\d{1,2}):(\d{2})(?:\s*(AM|PM))?$/i);
  if (!match) return "";
  let hours = parseInt(match[1], 10);
  const mins = match[2];
  const period = match[3]?.toUpperCase();
  if (period === "PM" && hours !== 12) hours += 12;
  if (period === "AM" && hours === 12) hours = 0;
  return `${hours.toString().padStart(2, "0")}:${mins}`;
}

function formatTimeFromInput(time24h: string) {
  if (!time24h) return "-";
  const [h, m] = time24h.split(":");
  let hours = parseInt(h, 10);
  const period = hours >= 12 ? "PM" : "AM";
  hours = hours % 12 || 12;
  return `${hours.toString().padStart(2, "0")}:${m} ${period}`;
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
  const { role } = useAuth();
  const canManage = isAdminOrHR(role);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [records, setRecords] = useState<AttendanceWithEmployee[]>([]);
  const [employees, setEmployees] = useState<EmployeePick[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [editingRecord, setEditingRecord] = useState<AttendanceWithEmployee | null>(null);
  const [editStatus, setEditStatus] = useState<EditableStatus>("Present");
  const [editCheckIn, setEditCheckIn] = useState("");
  const [editCheckOut, setEditCheckOut] = useState("");
  const [editNote, setEditNote] = useState("");

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

  const confirmEmployeeAction = (employeeId: string, action: "check-in" | "check-out") => {
    const employee = employees.find((emp) => emp.id === employeeId);
    if (!employee) {
      toast.error("Employee identity could not be verified.");
      return false;
    }
    return window.confirm(`Confirm ${action} for ${employee.name} at ${currentTime.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}?`);
  };

  const handleCheckIn = async (employeeId: string) => {
    if (!confirmEmployeeAction(employeeId, "check-in")) return;
    setActionLoading(true);
    try {
      const { record, statusLabel, warning } = await selfCheckIn(employeeId);
      toast.success(`Checked in at ${record.check_in} - ${statusLabel}`);
      if (warning) toast.warning(warning);
      await fetchData();
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleCheckOut = async (employeeId: string) => {
    if (!confirmEmployeeAction(employeeId, "check-out")) return;
    setActionLoading(true);
    try {
      const { record, workingTime, warning } = await selfCheckOut(employeeId);
      toast.success(`Checked out at ${record.check_out} - Worked: ${workingTime}`);
      if (warning) toast.warning(warning);
      await fetchData();
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setActionLoading(false);
    }
  };

  const openCorrectionDialog = (record: AttendanceWithEmployee) => {
    setEditingRecord(record);
    setEditStatus((record.status === "Present (Late)" ? "Late" : record.status) as EditableStatus);
    setEditCheckIn(formatTimeForInput(record.check_in));
    setEditCheckOut(formatTimeForInput(record.check_out));
    setEditNote("");
  };

  const handleCorrectionSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!editingRecord) return;
    if (!editNote.trim()) {
      toast.error("Please add a correction note.");
      return;
    }

    const checkIn = editStatus === "Absent" || editStatus === "Leave" ? "-" : formatTimeFromInput(editCheckIn);
    const checkOut = editStatus === "Absent" || editStatus === "Leave" ? "-" : formatTimeFromInput(editCheckOut);
    if (editStatus !== "Absent" && editStatus !== "Leave" && checkIn === "-") {
      toast.error("Check-in time is required for present, late, or half-day records.");
      return;
    }
    const summary = `${editingRecord.employee_name}\nStatus: ${editStatus}\nCheck in: ${checkIn}\nCheck out: ${checkOut}`;
    if (!window.confirm(`Save attendance correction?\n\n${summary}`)) return;

    setActionLoading(true);
    try {
      if (editingRecord.id.startsWith("absent-")) {
        await createAttendance({
          employee_id: editingRecord.employee_id,
          date: editingRecord.date,
          status: editStatus,
          check_in: checkIn,
          check_out: checkOut,
          note: editNote.trim(),
        });
      } else {
        await updateAttendance(editingRecord.id, {
          status: editStatus,
          check_in: checkIn,
          check_out: checkOut,
          note: editNote.trim(),
        });
      }
      toast.success("Attendance corrected successfully.");
      setEditingRecord(null);
      await fetchData();
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleUndoCheckout = async (record: AttendanceWithEmployee) => {
    if (record.id.startsWith("absent-")) return;
    if (!window.confirm(`Undo check-out for ${record.employee_name}? This clears the check-out time and working hours.`)) return;
    setActionLoading(true);
    try {
      await undoAttendanceCheckout(record.id);
      toast.success("Check-out was undone.");
      await fetchData();
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleExport = () => {
    if (records.length === 0) {
      toast.error("No attendance data to export");
      return;
    }

    const headers = ["Employee Name", "Role", "Check In", "Check Out", "Hours", "Overtime", "Status"];
    const escapeCSV = (value: string | number) => {
      const str = String(value ?? "");
      return str.includes(",") || str.includes('"') || str.includes("\n") ? `"${str.replace(/"/g, '""')}"` : str;
    };
    const rows = records.map((r) => [r.employee_name, r.employee_role, r.check_in, r.check_out, r.hours, r.overtime_hours, r.status]);
    const csvContent = [headers.map(escapeCSV).join(","), ...rows.map((row) => row.map(escapeCSV).join(","))].join("\n");
    const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8;" });
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
  const presentCount = records.filter((r) => ["Present", "Late", "Present (Late)", "Half Day"].includes(r.status)).length;
  const lateCount = records.filter((r) => r.status === "Late" || r.status === "Present (Late)").length;
  const absentCount = records.filter((r) => r.status === "Absent").length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold text-gray-900">Attendance</h1>
          <p className="text-gray-600 mt-1">
            Today: {currentTime.toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
          </p>
          <p className="text-sm text-gray-500 mt-1">Office time: 9:00 AM - 5:00 PM</p>
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
        <StatCard label="Total Employees" value={totalEmployees} icon={<Users className="w-6 h-6" />} tone="blue" />
        <StatCard label="Present" value={presentCount} icon={<CheckCircle className="w-6 h-6" />} tone="green" />
        <StatCard label="Absent" value={absentCount} icon={<XCircle className="w-6 h-6" />} tone="red" />
        <StatCard label="Late" value={lateCount} icon={<Clock className="w-6 h-6" />} tone="orange" />
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
                    {canManage && <TableHead className="text-right">Action</TableHead>}
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
                          <span className="text-green-600 font-medium">+{formatDuration(record.overtime_hours)}</span>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap items-center gap-2">
                          <Badge variant={statusVariant(record.status)}>{record.status}</Badge>
                          {record.warning && (
                            <Badge variant="outline" className="text-orange-600 border-orange-300 bg-orange-50 gap-1">
                              <AlertTriangle className="w-3 h-3" />
                              Warning
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      {canManage && (
                        <TableCell>
                          <div className="flex justify-end gap-2">
                            {record.status === "Leave" && record.id.startsWith("absent-") ? (
                              <Badge variant="outline" className="text-blue-600 border-blue-300 bg-blue-50 py-1.5">On Leave</Badge>
                            ) : record.check_in === "-" ? (
                              <Button size="sm" onClick={() => handleCheckIn(record.employee_id)} disabled={actionLoading}>
                                Check In
                              </Button>
                            ) : record.check_out === "-" ? (
                              <Button size="sm" className="bg-red-600 hover:bg-red-700" onClick={() => handleCheckOut(record.employee_id)} disabled={actionLoading}>
                                Check Out
                              </Button>
                            ) : (
                              <Button size="sm" variant="outline" onClick={() => handleUndoCheckout(record)} disabled={actionLoading}>
                                <RotateCcw className="w-4 h-4" />
                              </Button>
                            )}
                            <Button size="sm" variant="outline" onClick={() => openCorrectionDialog(record)} disabled={actionLoading}>
                              <Pencil className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      )}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>
        </CardContent>
      </Card>

      <Dialog open={Boolean(editingRecord)} onOpenChange={(open) => !open && setEditingRecord(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Correct Attendance</DialogTitle>
            <DialogDescription>
              {editingRecord ? `Editing ${editingRecord.employee_name} for ${editingRecord.date}` : "Update attendance record"}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCorrectionSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={editStatus} onValueChange={(value) => setEditStatus(value as EditableStatus)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {STATUS_OPTIONS.map((status) => (
                    <SelectItem key={status} value={status}>{status}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="editCheckIn">Check In</Label>
                <Input id="editCheckIn" type="time" value={editCheckIn} onChange={(e) => setEditCheckIn(e.target.value)} disabled={editStatus === "Absent" || editStatus === "Leave"} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="editCheckOut">Check Out</Label>
                <Input id="editCheckOut" type="time" value={editCheckOut} onChange={(e) => setEditCheckOut(e.target.value)} disabled={editStatus === "Absent" || editStatus === "Leave"} />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="editNote">Correction Note *</Label>
              <Textarea id="editNote" value={editNote} onChange={(e) => setEditNote(e.target.value)} placeholder="Reason for this correction" required />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setEditingRecord(null)}>Cancel</Button>
              <Button type="submit" disabled={actionLoading}>
                {actionLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Save Correction
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function StatCard({ label, value, icon, tone }: { label: string; value: number; icon: React.ReactNode; tone: "blue" | "green" | "red" | "orange" }) {
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
