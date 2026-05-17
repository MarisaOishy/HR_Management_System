import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router";
import { Card, CardContent } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Badge } from "../../components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../../components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../components/ui/select";
import { Search, Download, Eye, Filter, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { getPayrollData } from "../../../lib/services/payrollService";
import { getEmployees } from "../../../lib/services/employeeService";
import type { Employee, PayrollRecord } from "../../../lib/types/database";
import { formatBDT } from "../../../lib/formatters";

export default function PayrollTablePage() {
  const [loading, setLoading] = useState(true);
  const [records, setRecords] = useState<PayrollRecord[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [search, setSearch] = useState("");
  const [selectedMonth, setSelectedMonth] = useState("all");
  const [selectedDepartment, setSelectedDepartment] = useState("all");

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [payrollRows, employeeRows] = await Promise.all([getPayrollData(), getEmployees()]);
      setRecords(payrollRows);
      setEmployees(employeeRows);
    } catch (error: any) {
      toast.error("Failed to load payroll table: " + error.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const employeeById = useMemo(() => new Map(employees.map((e) => [e.id, e])), [employees]);

  const availableMonths = useMemo(() => {
    const months = Array.from(new Set(records.map((r) => r.month).filter(Boolean)));
    return months.sort((a, b) => new Date(b).getTime() - new Date(a).getTime());
  }, [records]);

  const availableDepartments = useMemo(() => {
    const depts = Array.from(new Set(employees.map((e) => e.department).filter(Boolean)));
    return depts.sort((a, b) => a.localeCompare(b));
  }, [employees]);

  const filteredRows = useMemo(() => {
    const query = search.trim().toLowerCase();

    return records.filter((row) => {
      const employee = employeeById.get(row.employee_id);
      const monthMatch = selectedMonth === "all" || row.month === selectedMonth;
      const departmentMatch =
        selectedDepartment === "all" || (employee?.department ?? "Unknown") === selectedDepartment;
      const queryMatch =
        query.length === 0 ||
        row.employee_name.toLowerCase().includes(query) ||
        row.employee_id.toLowerCase().includes(query) ||
        row.month.toLowerCase().includes(query);

      return monthMatch && departmentMatch && queryMatch;
    });
  }, [records, employeeById, selectedMonth, selectedDepartment, search]);

  const handleExport = () => {
    if (filteredRows.length === 0) {
      toast.error("No payroll rows to export");
      return;
    }

    const headers = [
      "Employee Name",
      "Employee ID",
      "Department",
      "Month",
      "Basic Salary",
      "Allowances",
      "Deductions",
      "Net Salary",
      "Status",
      "Pay Date",
    ];

    const escapeCSV = (value: string | number) => {
      const str = String(value ?? "");
      if (str.includes(",") || str.includes('"') || str.includes("\n")) {
        return `"${str.replace(/"/g, '""')}"`;
      }
      return str;
    };

    const rows = filteredRows.map((row) => {
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
        row.status,
        row.pay_date,
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
    link.download = "payroll_table.csv";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    toast.success(`Exported ${filteredRows.length} row(s)`);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold text-gray-900">Payroll Table</h1>
          <p className="text-gray-600 mt-1">View and manage employee salaries</p>
        </div>
        <Button variant="outline" onClick={handleExport}>
          <Download className="w-4 h-4 mr-2" />
          Export
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                type="search"
                placeholder="Search employees..."
                className="pl-10"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <Select value={selectedMonth} onValueChange={setSelectedMonth}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue />
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
            <Select value={selectedDepartment} onValueChange={setSelectedDepartment}>
              <SelectTrigger className="w-full md:w-48">
                <Filter className="w-4 h-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Departments</SelectItem>
                {availableDepartments.map((department) => (
                  <SelectItem key={department} value={department}>
                    {department}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Payroll Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            {loading ? (
              <div className="flex items-center justify-center py-16 text-gray-500">
                <Loader2 className="w-5 h-5 animate-spin mr-2" />
                Loading payroll table...
              </div>
            ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Employee</TableHead>
                  <TableHead>Department</TableHead>
                  <TableHead>Basic Salary</TableHead>
                  <TableHead>Allowances</TableHead>
                  <TableHead>Deductions</TableHead>
                  <TableHead>Net Salary</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRows.map((row) => {
                  const employee = employeeById.get(row.employee_id);
                  return (
                    <TableRow key={row.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <img
                            src={employee?.avatar ?? `https://ui-avatars.com/api/?name=${encodeURIComponent(row.employee_name)}&background=3b82f6&color=fff`}
                            alt={row.employee_name}
                            className="w-10 h-10 rounded-full object-cover"
                          />
                          <div>
                            <p className="font-medium text-gray-900">{row.employee_name}</p>
                            <p className="text-sm text-gray-500">{row.employee_id}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{employee?.department ?? "Unknown"}</TableCell>
                      <TableCell>{formatBDT(row.basic_salary)}</TableCell>
                      <TableCell>{formatBDT(row.allowances)}</TableCell>
                      <TableCell>{formatBDT(row.deductions)}</TableCell>
                      <TableCell className="font-semibold">{formatBDT(row.net_salary)}</TableCell>
                      <TableCell>
                        <Badge variant={row.status === "Paid" ? "default" : "secondary"}>{row.status}</Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center justify-end gap-2">
                          <Button variant="ghost" size="sm" asChild>
                            <Link to={`/payroll/payslip/${row.id}`}>
                              <Eye className="w-4 h-4" />
                            </Link>
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
                {filteredRows.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center text-gray-500 py-10">
                      No payroll records found for current filters.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
