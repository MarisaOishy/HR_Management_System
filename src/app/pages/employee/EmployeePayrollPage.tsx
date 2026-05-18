import { useCallback, useEffect, useMemo, useState } from "react";
import { Loader2, AlertTriangle, Download, Landmark } from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
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
import { getEmployeeByEmail } from "../../../lib/services/attendanceService";
import { getPayrollByEmployee } from "../../../lib/services/payrollService";
import type { PayrollRecord } from "../../../lib/types/database";

function statusVariant(status: string) {
  switch (status?.toLowerCase()) {
    case "paid":
      return "default" as const;
    case "pending":
      return "secondary" as const;
    case "failed":
      return "destructive" as const;
    default:
      return "outline" as const;
  }
}

function formatBDT(amount: number): string {
  if (typeof amount !== "number" || Number.isNaN(amount)) return "—";
  return `Tk ${amount.toLocaleString()}`;
}

export default function EmployeePayrollPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [employeeId, setEmployeeId] = useState<string | null>(null);
  const [records, setRecords] = useState<PayrollRecord[]>([]);

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
        return;
      }
      setEmployeeId(emp.id);
      const list = await getPayrollByEmployee(emp.id);
      setRecords(list);
    } catch (err: any) {
      toast.error("Failed to load payroll: " + err.message);
    } finally {
      setLoading(false);
    }
  }, [user?.email]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const latest = records[0] ?? null;

  const ytd = useMemo(() => {
    const currentYear = new Date().getFullYear();
    const yearRecs = records.filter((r) => {
      if (!r.pay_date) return false;
      return new Date(r.pay_date).getFullYear() === currentYear;
    });
    return {
      count: yearRecs.length,
      net: yearRecs.reduce((sum, r) => sum + (r.net_salary || 0), 0),
    };
  }, [records]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold text-gray-900">My Payroll</h1>
        <p className="text-gray-600 mt-1">View your monthly payslips and earnings.</p>
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

      {/* Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-5">
            <p className="text-sm text-gray-600">Latest Net Salary</p>
            <p className="text-2xl font-semibold text-gray-900 mt-1">
              {latest ? formatBDT(latest.net_salary) : "—"}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              {latest?.month ?? "No payslips yet"}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <p className="text-sm text-gray-600">YTD Earnings</p>
            <p className="text-2xl font-semibold text-gray-900 mt-1">
              {formatBDT(ytd.net)}
            </p>
            <p className="text-xs text-gray-500 mt-1">{ytd.count} payslip(s) this year</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <p className="text-sm text-gray-600">Total Payslips</p>
            <p className="text-2xl font-semibold text-gray-900 mt-1">{records.length}</p>
            <p className="text-xs text-gray-500 mt-1">All time</p>
          </CardContent>
        </Card>
      </div>

      {/* Latest payslip breakdown */}
      {latest && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Latest Payslip — {latest.month}</CardTitle>
            <Badge variant={statusVariant(latest.status)}>{latest.status}</Badge>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Basic Salary</span>
                  <span className="font-medium text-gray-900">
                    {formatBDT(latest.basic_salary)}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Allowances</span>
                  <span className="font-medium text-green-700">
                    + {formatBDT(latest.allowances)}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Deductions</span>
                  <span className="font-medium text-red-700">
                    − {formatBDT(latest.deductions)}
                  </span>
                </div>
                <div className="border-t pt-3 flex justify-between">
                  <span className="font-semibold text-gray-900">Net Salary</span>
                  <span className="font-semibold text-blue-700 text-lg">
                    {formatBDT(latest.net_salary)}
                  </span>
                </div>
              </div>

              <div className="rounded-lg bg-gradient-to-br from-blue-50 to-purple-50 p-6 flex flex-col items-center justify-center text-center">
                <Landmark className="w-10 h-10 text-blue-600 mb-3" />
                <p className="text-sm text-gray-600">Paid on</p>
                <p className="text-lg font-semibold text-gray-900">
                  {latest.pay_date || "—"}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* All payslips */}
      <Card>
        <CardHeader>
          <CardTitle>Payslip History</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center py-12 text-gray-500">
              <Loader2 className="w-5 h-5 animate-spin mr-2" />
              Loading...
            </div>
          ) : records.length === 0 ? (
            <div className="p-12 text-center text-gray-500">
              <Landmark className="w-10 h-10 mx-auto mb-2 text-gray-400" />
              No payslips yet.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Month</TableHead>
                    <TableHead>Pay Date</TableHead>
                    <TableHead>Basic</TableHead>
                    <TableHead>Allowances</TableHead>
                    <TableHead>Deductions</TableHead>
                    <TableHead>Net</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {records.map((r) => (
                    <TableRow key={r.id}>
                      <TableCell className="font-medium">{r.month}</TableCell>
                      <TableCell>{r.pay_date}</TableCell>
                      <TableCell>{formatBDT(r.basic_salary)}</TableCell>
                      <TableCell className="text-green-700">
                        + {formatBDT(r.allowances)}
                      </TableCell>
                      <TableCell className="text-red-700">
                        − {formatBDT(r.deductions)}
                      </TableCell>
                      <TableCell className="font-semibold">
                        {formatBDT(r.net_salary)}
                      </TableCell>
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
