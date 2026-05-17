import { useCallback, useEffect, useMemo, useState } from "react";
import type React from "react";
import { Bar, BarChart, CartesianGrid, Cell, Legend, Line, LineChart, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Download, FileText, Loader2, Printer, RotateCcw, Sheet, TrendingUp, Users } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "../../components/ui/badge";
import { Button } from "../../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../components/ui/select";
import { getAttendanceRecords } from "../../../lib/services/attendanceService";
import { getEmployees } from "../../../lib/services/employeeService";
import { getLeaveRequests } from "../../../lib/services/leaveService";
import { getPayrollData } from "../../../lib/services/payrollService";
import { getPerformanceReviews } from "../../../lib/services/performanceService";
import type { AttendanceRecord, Employee, LeaveRequest, PayrollRecord, PerformanceReview } from "../../../lib/types/database";

const COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ec4899", "#6366f1", "#14b8a6"];
const REPORT_TYPES = [
  { value: "employees", label: "All Employees Report" },
  { value: "employee_detail", label: "Specific Employee Report" },
  { value: "attendance", label: "Attendance Detail" },
  { value: "attendance_summary", label: "Attendance Summary" },
  { value: "leave", label: "Leave Report" },
  { value: "payroll", label: "Payroll / Salary Report" },
  { value: "performance", label: "Performance Report" },
] as const;

type ReportType = (typeof REPORT_TYPES)[number]["value"];
type ExportFormat = "csv" | "excel" | "pdf" | "print";
type ReportRow = (string | number)[];

interface BuiltReport {
  title: string;
  filename: string;
  headers: string[];
  rows: ReportRow[];
}

function todayISO() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
}

function isWithinRange(value: string | undefined, startDate: string, endDate: string) {
  if (!value) return true;
  if (startDate && value < startDate) return false;
  if (endDate && value > endDate) return false;
  return true;
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

function escapeCsv(value: string | number) {
  const text = String(value ?? "");
  return /[",\n\r]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

function toCsv(report: BuiltReport) {
  return [report.headers.map(escapeCsv).join(","), ...report.rows.map((row) => row.map(escapeCsv).join(","))].join("\r\n");
}

function escapeHtml(value: string | number) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function tableHtml(report: BuiltReport) {
  return `<!doctype html><html><head><meta charset="utf-8"><title>${escapeHtml(report.title)}</title><style>
    body{font-family:Arial,sans-serif;color:#111827;padding:24px}
    h1{font-size:20px;margin:0 0 16px}
    table{border-collapse:collapse;width:100%;font-size:12px}
    th,td{border:1px solid #d1d5db;padding:6px;text-align:left;vertical-align:top}
    th{background:#f3f4f6}
  </style></head><body><h1>${escapeHtml(report.title)}</h1><table><thead><tr>${report.headers.map((h) => `<th>${escapeHtml(h)}</th>`).join("")}</tr></thead><tbody>${report.rows.map((row) => `<tr>${row.map((cell) => `<td>${escapeHtml(cell)}</td>`).join("")}</tr>`).join("")}</tbody></table></body></html>`;
}

function escapePdfText(value: string | number) {
  return String(value ?? "").replace(/[\\()]/g, "\\$&").slice(0, 110);
}

function createPdfBlob(report: BuiltReport) {
  const lines = [report.title, "", report.headers.join(" | "), ...report.rows.map((row) => row.join(" | "))];
  const pages: string[][] = [];
  for (let i = 0; i < lines.length; i += 38) pages.push(lines.slice(i, i + 38));

  const objects: string[] = ["<< /Type /Catalog /Pages 2 0 R >>", ""];
  const pageRefs: string[] = [];

  pages.forEach((pageLines, pageIndex) => {
    const content = `BT /F1 9 Tf 40 780 Td ${pageLines.map((line, index) => `${index === 0 ? "" : "0 -18 Td "}(${escapePdfText(line)}) Tj`).join(" ")} ET`;
    const pageObjectNumber = objects.length + 1;
    const contentObjectNumber = objects.length + 2;
    pageRefs.push(`${pageObjectNumber} 0 R`);
    objects.push(`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 842 595] /Resources << /Font << /F1 << /Type /Font /Subtype /Type1 /BaseFont /Helvetica >> >> >> /Contents ${contentObjectNumber} 0 R >>`);
    objects.push(`<< /Length ${content.length} >>\nstream\n${content}\nendstream`);
  });

  objects[1] = `<< /Type /Pages /Kids [${pageRefs.join(" ")}] /Count ${pageRefs.length} >>`;

  let pdf = "%PDF-1.4\n";
  const offsets: number[] = [];
  objects.forEach((object, index) => {
    offsets.push(pdf.length);
    pdf += `${index + 1} 0 obj\n${object}\nendobj\n`;
  });
  const xref = pdf.length;
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n${offsets.map((offset) => `${String(offset).padStart(10, "0")} 00000 n `).join("\n")}\ntrailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF`;
  return new Blob([pdf], { type: "application/pdf" });
}

export default function ReportsPage() {
  const [reportType, setReportType] = useState<ReportType>("attendance");
  const [selectedEmployeeId, setSelectedEmployeeId] = useState("all");
  const [selectedDepartment, setSelectedDepartment] = useState("all");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState<ExportFormat | null>(null);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [leaves, setLeaves] = useState<LeaveRequest[]>([]);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [payroll, setPayroll] = useState<PayrollRecord[]>([]);
  const [performance, setPerformance] = useState<PerformanceReview[]>([]);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [empRes, leaveRes, attRes, payRes, perfRes] = await Promise.all([
        getEmployees(),
        getLeaveRequests(),
        getAttendanceRecords(),
        getPayrollData(),
        getPerformanceReviews(),
      ]);
      setEmployees(empRes);
      setLeaves(leaveRes);
      setAttendance(attRes);
      setPayroll(payRes);
      setPerformance(perfRes);
    } catch (error: any) {
      toast.error("Failed to load report data: " + error.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const employeeMap = useMemo(() => new Map(employees.map((employee) => [employee.id, employee])), [employees]);
  const departments = useMemo(() => Array.from(new Set(employees.map((employee) => employee.department).filter(Boolean))).sort(), [employees]);
  const filteredEmployeeIds = useMemo(() => {
    return new Set(
      employees
        .filter((employee) => selectedEmployeeId === "all" || employee.id === selectedEmployeeId)
        .filter((employee) => selectedDepartment === "all" || employee.department === selectedDepartment)
        .map((employee) => employee.id),
    );
  }, [employees, selectedDepartment, selectedEmployeeId]);

  const activeEmployees = employees.filter((e) => e.status === "Active").length;
  const totalPayroll = payroll.reduce((acc, curr) => acc + Number(curr.net_salary || 0), 0);
  const avgAttendance = attendance.length
    ? Math.round((attendance.filter((a) => ["Present", "Late", "Present (Late)", "Half Day"].includes(a.status)).length / attendance.length) * 1000) / 10
    : 0;

  const departmentDistribution = useMemo(() => {
    const map = new Map<string, number>();
    employees.forEach((emp) => map.set(emp.department, (map.get(emp.department) || 0) + 1));
    return Array.from(map.entries()).map(([name, value]) => ({ name, value }));
  }, [employees]);

  const attendanceTrend = useMemo(() => {
    const map: Record<string, { present: number; absent: number }> = {};
    attendance.forEach((att) => {
      const month = new Date(att.date).toLocaleString("en-US", { month: "short" });
      if (!map[month]) map[month] = { present: 0, absent: 0 };
      if (att.status === "Absent") map[month].absent += 1;
      else map[month].present += 1;
    });
    return Object.entries(map).map(([month, stats]) => ({ month, ...stats }));
  }, [attendance]);

  const buildReport = (): BuiltReport => {
    const today = todayISO();
    const employeeName = (employeeId: string) => employeeMap.get(employeeId)?.name ?? "";
    const allowedEmployee = (employeeId: string) => filteredEmployeeIds.has(employeeId);

    if (reportType === "employees") {
      const rows = employees
        .filter((employee) => allowedEmployee(employee.id))
        .filter((employee) => isWithinRange(employee.join_date, startDate, endDate))
        .map((employee) => [employee.id, employee.name, employee.email, employee.phone, employee.department, employee.role, employee.join_date, employee.salary, employee.status]);
      return { title: "All Employees Report", filename: `employees-report-${today}`, headers: ["ID", "Name", "Email", "Phone", "Department", "Role", "Join Date", "Salary", "Status"], rows };
    }

    if (reportType === "employee_detail") {
      if (selectedEmployeeId === "all") throw new Error("Select a specific employee first.");
      const employee = employeeMap.get(selectedEmployeeId);
      if (!employee) throw new Error("Selected employee was not found.");
      const employeeAttendance = attendance.filter((row) => row.employee_id === selectedEmployeeId && isWithinRange(row.date, startDate, endDate));
      const employeePayroll = payroll.filter((row) => row.employee_id === selectedEmployeeId && isWithinRange(row.pay_date, startDate, endDate));
      const employeeLeaves = leaves.filter((row) => row.employee_id === selectedEmployeeId && isWithinRange(row.applied_date, startDate, endDate));
      const rows: ReportRow[] = [
        ["Profile", "Name", employee.name],
        ["Profile", "Department", employee.department],
        ["Profile", "Role", employee.role],
        ["Profile", "Phone", employee.phone],
        ["Attendance", "Records", employeeAttendance.length],
        ["Attendance", "Present/Late/Half Day", employeeAttendance.filter((row) => row.status !== "Absent").length],
        ["Leave", "Requests", employeeLeaves.length],
        ["Payroll", "Total Net Salary", employeePayroll.reduce((sum, row) => sum + Number(row.net_salary || 0), 0)],
      ];
      return { title: `${employee.name} Employee Report`, filename: `employee-${employee.id}-report-${today}`, headers: ["Section", "Metric", "Value"], rows };
    }

    if (reportType === "attendance_summary") {
      const rows = Array.from(filteredEmployeeIds).map((employeeId) => {
        const employeeRecords = attendance.filter((row) => row.employee_id === employeeId && isWithinRange(row.date, startDate, endDate));
        return [
          employeeId,
          employeeName(employeeId),
          employeeRecords.length,
          employeeRecords.filter((row) => ["Present", "Present (Late)", "Late"].includes(row.status)).length,
          employeeRecords.filter((row) => row.status === "Half Day").length,
          employeeRecords.filter((row) => row.status === "Absent").length,
          employeeRecords.reduce((sum, row) => sum + Number(row.hours || 0), 0).toFixed(2),
        ];
      });
      return { title: "Attendance Summary", filename: `attendance-summary-${today}`, headers: ["Employee ID", "Name", "Records", "Present/Late", "Half Days", "Absent", "Total Hours"], rows };
    }

    if (reportType === "attendance") {
      const rows = attendance
        .filter((row) => allowedEmployee(row.employee_id))
        .filter((row) => isWithinRange(row.date, startDate, endDate))
        .map((row) => [row.employee_id, employeeName(row.employee_id), row.date, row.check_in, row.check_out, row.status, row.hours]);
      return { title: "Attendance Detail Report", filename: `attendance-detail-${today}`, headers: ["Employee ID", "Name", "Date", "Check In", "Check Out", "Status", "Hours"], rows };
    }

    if (reportType === "leave") {
      const rows = leaves
        .filter((row) => allowedEmployee(row.employee_id))
        .filter((row) => isWithinRange(row.applied_date, startDate, endDate))
        .map((row) => [row.employee_id, row.employee_name, row.type, row.start_date, row.end_date, row.days, row.reason, row.status, row.applied_date]);
      return { title: "Leave Report", filename: `leave-report-${today}`, headers: ["Employee ID", "Name", "Type", "Start Date", "End Date", "Days", "Reason", "Status", "Applied Date"], rows };
    }

    if (reportType === "payroll") {
      const rows = payroll
        .filter((row) => allowedEmployee(row.employee_id))
        .filter((row) => isWithinRange(row.pay_date, startDate, endDate))
        .map((row) => [row.employee_id, row.employee_name, row.month, row.basic_salary, row.allowances, row.deductions, row.net_salary, row.status, row.pay_date]);
      return { title: "Payroll / Salary Report", filename: `payroll-report-${today}`, headers: ["Employee ID", "Name", "Month", "Basic Salary", "Allowances", "Deductions", "Net Salary", "Status", "Pay Date"], rows };
    }

    const rows = performance
      .filter((row) => allowedEmployee(row.employee_id))
      .filter((row) => isWithinRange(row.review_date, startDate, endDate))
      .map((row) => [row.employee_id, row.employee_name, row.period, row.rating, row.technical_skills, row.communication, row.teamwork, row.leadership, row.reviewer, row.review_date, row.comments]);
    return { title: "Performance Report", filename: `performance-report-${today}`, headers: ["Employee ID", "Name", "Period", "Rating", "Technical", "Communication", "Teamwork", "Leadership", "Reviewer", "Review Date", "Comments"], rows };
  };

  const reportPreview = useMemo(() => {
    if (loading) return null;
    try {
      return buildReport();
    } catch {
      return null;
    }
  }, [attendance, employeeMap, employees, endDate, filteredEmployeeIds, leaves, loading, payroll, performance, reportType, selectedEmployeeId, startDate]);

  const resetFilters = () => {
    setSelectedEmployeeId("all");
    setSelectedDepartment("all");
    setStartDate("");
    setEndDate("");
  };

  const handleExport = async (format: ExportFormat) => {
    if (loading) {
      toast.info("Please wait, report data is still loading.");
      return;
    }
    if (startDate && endDate && startDate > endDate) {
      toast.error("Start date cannot be after end date.");
      return;
    }

    setExporting(format);
    try {
      await new Promise((resolve) => window.setTimeout(resolve, 80));
      const report = buildReport();
      if (report.rows.length === 0) {
        toast.warning("No matching data found. Try clearing the date range, employee, or department filter.");
        return;
      }

      if (format === "csv") {
        downloadBlob(new Blob(["\uFEFF" + toCsv(report)], { type: "text/csv;charset=utf-8;" }), `${report.filename}.csv`);
      } else if (format === "excel") {
        downloadBlob(new Blob(["\uFEFF" + tableHtml(report)], { type: "application/vnd.ms-excel;charset=utf-8;" }), `${report.filename}.xls`);
      } else if (format === "pdf") {
        downloadBlob(createPdfBlob(report), `${report.filename}.pdf`);
      } else {
        const printWindow = window.open("", "_blank", "width=1100,height=800");
        if (!printWindow) throw new Error("Popup blocked. Allow popups to print reports.");
        printWindow.document.write(tableHtml(report));
        printWindow.document.close();
        printWindow.focus();
        printWindow.print();
      }

      toast.success(`${report.title} exported successfully.`);
    } catch (error: any) {
      toast.error(error.message || "Export failed.");
    } finally {
      setExporting(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold text-gray-900">Reports & Analytics</h1>
          <p className="text-gray-600 mt-1">Filter, preview, and export HRMS module reports</p>
        </div>
        <Button onClick={() => handleExport("csv")} disabled={loading || Boolean(exporting)}>
          {exporting === "csv" ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Download className="w-4 h-4 mr-2" />}
          Export CSV
        </Button>
      </div>

      <Card>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-4">
            <div className="space-y-2">
              <Label>Report Type</Label>
              <Select value={reportType} onValueChange={(value) => setReportType(value as ReportType)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {REPORT_TYPES.map((type) => <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Employee</Label>
              <Select value={selectedEmployeeId} onValueChange={setSelectedEmployeeId}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Employees</SelectItem>
                  {employees.map((employee) => <SelectItem key={employee.id} value={employee.id}>{employee.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Department</Label>
              <Select value={selectedDepartment} onValueChange={setSelectedDepartment}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Departments</SelectItem>
                  {departments.map((department) => <SelectItem key={department} value={department}>{department}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="startDate">Start Date</Label>
              <Input id="startDate" type="date" value={startDate} onChange={(event) => setStartDate(event.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="endDate">End Date</Label>
              <Input id="endDate" type="date" value={endDate} onChange={(event) => setEndDate(event.target.value)} />
            </div>
          </div>
          <div className="flex flex-wrap gap-2 mt-4">
            <Badge variant="outline">Specific employee export supported</Badge>
            <Badge variant="outline">Date range filtering</Badge>
            <Badge variant="outline">Department filtering</Badge>
            <Badge variant={reportPreview?.rows.length ? "default" : "secondary"}>
              {reportPreview ? `${reportPreview.rows.length} matching row${reportPreview.rows.length === 1 ? "" : "s"}` : "Select filters"}
            </Badge>
            <Button type="button" variant="outline" size="sm" onClick={resetFilters}>
              <RotateCcw className="w-4 h-4 mr-2" />
              Reset Filters
            </Button>
          </div>
          {reportPreview?.rows.length === 0 && (
            <p className="text-sm text-orange-600 mt-3">
              No records match these filters. The demo data is mostly dated March and April 2026, so a narrow current-date range may export nothing.
            </p>
          )}
        </CardContent>
      </Card>

      {loading ? (
        <Card>
          <CardContent className="py-16 flex items-center justify-center text-gray-500">
            <Loader2 className="w-6 h-6 mr-3 animate-spin" />
            Loading analytics data from modules...
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <MetricCard label="Avg Attendance" value={`${avgAttendance}%`} icon={<TrendingUp className="w-6 h-6" />} tone="green" />
            <MetricCard label="Leave Requests" value={leaves.length} icon={<FileText className="w-6 h-6" />} tone="orange" />
            <MetricCard label="Total Payroll" value={`Tk ${totalPayroll.toLocaleString()}`} icon={<TrendingUp className="w-6 h-6" />} tone="blue" />
            <MetricCard label="Active Employees" value={activeEmployees} icon={<Users className="w-6 h-6" />} tone="purple" />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader><CardTitle>Attendance Trend</CardTitle></CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={attendanceTrend}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis dataKey="month" stroke="#6b7280" />
                    <YAxis stroke="#6b7280" />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="present" stroke="#10b981" strokeWidth={2} name="Present" />
                    <Line type="monotone" dataKey="absent" stroke="#ef4444" strokeWidth={2} name="Absent" />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle>Department Distribution</CardTitle></CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie data={departmentDistribution} cx="50%" cy="50%" labelLine={false} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} outerRadius={100} dataKey="value">
                      {departmentDistribution.map((entry, index) => <Cell key={entry.name} fill={COLORS[index % COLORS.length]} />)}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card className="lg:col-span-2">
              <CardHeader><CardTitle>Employee Growth</CardTitle></CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart data={employees.map((employee) => ({ name: employee.name.split(" ")[0], salary: employee.salary }))}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis dataKey="name" stroke="#6b7280" />
                    <YAxis stroke="#6b7280" />
                    <Tooltip />
                    <Bar dataKey="salary" fill="#3b82f6" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Export Options</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <ExportButton label="PDF Report" icon={<FileText className="w-6 h-6" />} loading={exporting === "pdf"} disabled={loading || Boolean(exporting)} onClick={() => handleExport("pdf")} />
            <ExportButton label="CSV Export" icon={<FileText className="w-6 h-6" />} loading={exporting === "csv"} disabled={loading || Boolean(exporting)} onClick={() => handleExport("csv")} />
            <ExportButton label="Excel Export" icon={<Sheet className="w-6 h-6" />} loading={exporting === "excel"} disabled={loading || Boolean(exporting)} onClick={() => handleExport("excel")} />
            <ExportButton label="Print Report" icon={<Printer className="w-6 h-6" />} loading={exporting === "print"} disabled={loading || Boolean(exporting)} onClick={() => handleExport("print")} />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function MetricCard({ label, value, icon, tone }: { label: string; value: string | number; icon: React.ReactNode; tone: "green" | "orange" | "blue" | "purple" }) {
  const toneClass = {
    green: "bg-green-50 text-green-600",
    orange: "bg-orange-50 text-orange-600",
    blue: "bg-blue-50 text-blue-600",
    purple: "bg-purple-50 text-purple-600",
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

function ExportButton({ label, icon, loading, disabled, onClick }: { label: string; icon: React.ReactNode; loading: boolean; disabled: boolean; onClick: () => void }) {
  return (
    <Button variant="outline" className="h-auto py-4 flex flex-col gap-2" disabled={disabled} onClick={onClick}>
      {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : icon}
      <span>{label}</span>
    </Button>
  );
}
