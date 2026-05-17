import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../components/ui/select";
import { Landmark, TrendingUp, Users, Calendar, Download, Eye, Loader2 } from "lucide-react";
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { toast } from "sonner";
import { getPayrollData } from "../../../lib/services/payrollService";
import { getEmployees } from "../../../lib/services/employeeService";
import type { Employee, PayrollRecord } from "../../../lib/types/database";
import { formatBDT } from "../../../lib/formatters";

export default function PayrollDashboard() {
  const [loading, setLoading] = useState(true);
  const [records, setRecords] = useState<PayrollRecord[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [selectedMonth, setSelectedMonth] = useState<string>("all");

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [payrollRows, employeeRows] = await Promise.all([getPayrollData(), getEmployees()]);
      setRecords(payrollRows);
      setEmployees(employeeRows);
    } catch (error: any) {
      toast.error("Failed to load payroll data: " + error.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const availableMonths = useMemo(() => {
    const months = Array.from(new Set(records.map((r) => r.month).filter(Boolean)));
    return months.sort((a, b) => new Date(b).getTime() - new Date(a).getTime());
  }, [records]);

  const filteredRecords = useMemo(() => {
    if (selectedMonth === "all") return records;
    return records.filter((r) => r.month === selectedMonth);
  }, [records, selectedMonth]);

  const totalPayroll = useMemo(
    () => filteredRecords.reduce((sum, p) => sum + (p.net_salary ?? 0), 0),
    [filteredRecords]
  );

  const avgSalary = useMemo(
    () => (filteredRecords.length > 0 ? Math.round(totalPayroll / filteredRecords.length) : 0),
    [filteredRecords, totalPayroll]
  );

  const latestPayDate = useMemo(() => {
    if (filteredRecords.length === 0) return "-";
    const dates = filteredRecords.map((r) => r.pay_date).filter(Boolean);
    if (dates.length === 0) return "-";
    return new Date(Math.max(...dates.map((d) => new Date(d).getTime()))).toLocaleDateString();
  }, [filteredRecords]);

  const monthlyData = useMemo(() => {
    const monthMap = new Map<string, number>();
    records.forEach((row) => {
      monthMap.set(row.month, (monthMap.get(row.month) ?? 0) + (row.net_salary ?? 0));
    });
    return Array.from(monthMap.entries())
      .sort((a, b) => new Date(a[0]).getTime() - new Date(b[0]).getTime())
      .map(([month, amount]) => ({
        month: new Date(month).toLocaleDateString(undefined, { month: "short", year: "2-digit" }),
        amount,
      }));
  }, [records]);

  const departmentData = useMemo(() => {
    const employeeById = new Map(employees.map((e) => [e.id, e]));
    const deptMap = new Map<string, number>();
    filteredRecords.forEach((row) => {
      const employee = employeeById.get(row.employee_id);
      const dept = employee?.department ?? "Unknown";
      deptMap.set(dept, (deptMap.get(dept) ?? 0) + (row.net_salary ?? 0));
    });
    return Array.from(deptMap.entries())
      .map(([dept, amount]) => ({ dept, amount }))
      .sort((a, b) => b.amount - a.amount);
  }, [employees, filteredRecords]);

  const recentPayslips = useMemo(
    () =>
      [...filteredRecords]
        .sort((a, b) => new Date(b.pay_date).getTime() - new Date(a.pay_date).getTime())
        .slice(0, 8),
    [filteredRecords]
  );

  const handleExport = () => {
    if (filteredRecords.length === 0) {
      toast.error("No payroll data to export");
      return;
    }

    const employeeById = new Map(employees.map((e) => [e.id, e]));
    const headers = [
      "Employee Name",
      "Employee ID",
      "Department",
      "Month",
      "Basic Salary",
      "Allowances",
      "Deductions",
      "Net Salary",
      "Pay Date",
      "Status",
    ];

    const escapeCSV = (value: string | number) => {
      const str = String(value ?? "");
      if (str.includes(",") || str.includes('"') || str.includes("\n")) {
        return `"${str.replace(/"/g, '""')}"`;
      }
      return str;
    };

    const rows = filteredRecords.map((row) => {
      const employee = employeeById.get(row.employee_id);
      return [
        row.employee_name,
        row.employee_id,
        employee?.department ?? "Unknown",
        row.month,
        row.basic_salary,
        row.allowances,
        row.deductions,
        row.net_salary,
        row.pay_date,
        row.status,
      ];
    });

    const csvContent = [
      headers.map(escapeCSV).join(","),
      ...rows.map((r) => r.map(escapeCSV).join(",")),
    ].join("\n");

    const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `payroll_${selectedMonth === "all" ? "all" : selectedMonth}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    toast.success(`Exported ${filteredRecords.length} record(s)`);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold text-gray-900">Payroll</h1>
          <p className="text-gray-600 mt-1">Manage employee salaries and payroll</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Select value={selectedMonth} onValueChange={setSelectedMonth}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select month" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All months</SelectItem>
              {availableMonths.map((month) => (
                <SelectItem key={month} value={month}>
                  {month}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button className="bg-blue-600 hover:bg-blue-700" asChild>
            <Link to="/payroll/process">
              Process Salary
            </Link>
          </Button>
          <Button variant="outline" asChild>
            <Link to="/payroll/table">
              <Calendar className="w-4 h-4 mr-2" />
              View Table
            </Link>
          </Button>
          <Button variant="outline" onClick={handleExport}>
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {loading ? (
        <Card>
          <CardContent className="py-16 flex items-center justify-center text-gray-500">
            <Loader2 className="w-6 h-6 mr-2 animate-spin" />
            Loading payroll dashboard...
          </CardContent>
        </Card>
      ) : (
      <>
      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Payroll</p>
                <p className="text-3xl font-semibold text-gray-900 mt-2">
                  {formatBDT(totalPayroll)}
                </p>
                <p className="text-sm text-gray-500 mt-1">{selectedMonth === "all" ? "Across all months" : selectedMonth}</p>
              </div>
              <div className="p-3 rounded-lg bg-blue-50 text-blue-600">
                <Landmark className="w-6 h-6" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-gray-600">Avg Salary</p>
                <p className="text-3xl font-semibold text-gray-900 mt-2">{formatBDT(avgSalary)}</p>
                <p className="text-sm text-gray-500 mt-1">Per employee</p>
              </div>
              <div className="p-3 rounded-lg bg-green-50 text-green-600">
                <TrendingUp className="w-6 h-6" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-gray-600">Employees Paid</p>
                <p className="text-3xl font-semibold text-gray-900 mt-2">{filteredRecords.length}</p>
                <p className="text-sm text-gray-500 mt-1">{selectedMonth === "all" ? "All records" : selectedMonth}</p>
              </div>
              <div className="p-3 rounded-lg bg-purple-50 text-purple-600">
                <Users className="w-6 h-6" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-gray-600">Last Pay Date</p>
                <p className="text-xl font-semibold text-gray-900 mt-2">{latestPayDate}</p>
                <p className="text-sm text-gray-500 mt-1">Most recent payroll</p>
              </div>
              <div className="p-3 rounded-lg bg-orange-50 text-orange-600">
                <Calendar className="w-6 h-6" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Monthly Payroll Trend</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="month" stroke="#6b7280" />
                <YAxis stroke="#6b7280" />
                <Tooltip />
                <Line
                  type="monotone"
                  dataKey="amount"
                  stroke="#8b5cf6"
                  strokeWidth={2}
                  dot={{ fill: "#8b5cf6" }}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Department Payroll</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={departmentData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="dept" stroke="#6b7280" />
                <YAxis stroke="#6b7280" />
                <Tooltip />
                <Bar dataKey="amount" fill="#3b82f6" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Recent Payslips */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Recent Payslips</CardTitle>
          <Link to="/payroll/table" className="text-sm text-blue-600 hover:underline">
            View all
          </Link>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {recentPayslips.map((payroll) => (
              <div
                key={payroll.id}
                className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div>
                  <p className="font-medium text-gray-900">{payroll.employee_name}</p>
                  <p className="text-sm text-gray-600">{payroll.month}</p>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-gray-900">{formatBDT(payroll.net_salary)}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs text-green-600 bg-green-50 px-2 py-1 rounded">
                      {payroll.status}
                    </span>
                    <Button variant="ghost" size="sm" asChild>
                      <Link to={`/payroll/payslip/${payroll.id}`}>
                        <Eye className="w-4 h-4" />
                      </Link>
                    </Button>
                  </div>
                </div>
              </div>
            ))}
            {recentPayslips.length === 0 && (
              <p className="text-gray-500 text-center py-8">No payroll records found.</p>
            )}
          </div>
        </CardContent>
      </Card>
      </>
      )}
    </div>
  );
}
