import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router";
import { Card, CardContent } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { ArrowLeft, Download, Loader2, Printer } from "lucide-react";
import { toast } from "sonner";
import { getPayslip } from "../../../lib/services/payrollService";
import { getEmployeeById } from "../../../lib/services/employeeService";
import type { Employee, PayrollRecord } from "../../../lib/types/database";
import { formatBDT } from "../../../lib/formatters";

export default function PayslipPage() {
  const { id } = useParams();
  const [loading, setLoading] = useState(true);
  const [payroll, setPayroll] = useState<PayrollRecord | null>(null);
  const [employee, setEmployee] = useState<Employee | null>(null);

  const fetchPayslip = useCallback(async () => {
    if (!id) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const payrollRow = await getPayslip(id);
      setPayroll(payrollRow);
      const employeeRow = await getEmployeeById(payrollRow.employee_id).catch(() => null);
      setEmployee(employeeRow);
    } catch (error: any) {
      toast.error("Failed to load payslip: " + error.message);
      setPayroll(null);
      setEmployee(null);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchPayslip();
  }, [fetchPayslip]);

  const deductionBreakdown = useMemo(() => {
    if (!payroll) return { tax: 0, social: 0, health: 0 };
    return {
      tax: payroll.deductions * 0.6,
      social: payroll.deductions * 0.3,
      health: payroll.deductions * 0.1,
    };
  }, [payroll]);

  const handlePrint = () => {
    window.print();
  };

  const handleDownload = () => {
    if (!payroll) return;
    const employeeName = employee?.name ?? payroll.employee_name;
    const content = [
      "BanglaHR - Payslip",
      "-------------------",
      `Employee: ${employeeName}`,
      `Employee ID: ${payroll.employee_id}`,
      `Department: ${employee?.department ?? "Unknown"}`,
      `Role: ${employee?.role ?? "Unknown"}`,
      `Month: ${payroll.month}`,
      `Pay Date: ${payroll.pay_date}`,
      `Status: ${payroll.status}`,
      "",
      `Basic Salary: ${formatBDT(payroll.basic_salary)}`,
      `Allowances: ${formatBDT(payroll.allowances)}`,
      `Deductions: ${formatBDT(payroll.deductions)}`,
      `Net Salary: ${formatBDT(payroll.net_salary)}`,
    ].join("\n");

    const blob = new Blob([content], { type: "text/plain;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `payslip_${payroll.employee_id}_${payroll.month}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.success("Payslip downloaded");
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 text-gray-500">
        <Loader2 className="w-5 h-5 animate-spin mr-2" />
        Loading payslip...
      </div>
    );
  }

  if (!payroll || !employee) {
    return (
      <div className="space-y-4">
        <Link to="/payroll" className="text-sm text-blue-600 hover:underline">
          Back to payroll
        </Link>
        <div className="text-gray-600">Payslip not found.</div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Link
          to="/payroll"
          className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to payroll
        </Link>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handlePrint}>
            <Printer className="w-4 h-4 mr-2" />
            Print
          </Button>
          <Button variant="outline" onClick={handleDownload}>
            <Download className="w-4 h-4 mr-2" />
            Download
          </Button>
        </div>
      </div>

      {/* Payslip */}
      <Card>
        <CardContent className="p-8">
          {/* Company Header */}
          <div className="text-center border-b pb-6 mb-6">
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl flex items-center justify-center">
                <span className="text-white font-bold text-2xl">HR</span>
              </div>
            </div>
            <h1 className="text-2xl font-bold text-gray-900">BanglaHR</h1>
            <p className="text-gray-600 mt-1">Motijheel C/A, Dhaka 1000, Bangladesh</p>
            <p className="text-lg font-semibold text-blue-600 mt-4">PAYSLIP</p>
          </div>

          {/* Employee & Payment Info */}
          <div className="grid grid-cols-2 gap-8 mb-8">
            <div>
              <h3 className="font-semibold text-gray-900 mb-3">Employee Details</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Name:</span>
                  <span className="font-medium">{employee.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Employee ID:</span>
                  <span className="font-medium">{employee.id}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Department:</span>
                  <span className="font-medium">{employee.department}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Position:</span>
                  <span className="font-medium">{employee.role}</span>
                </div>
              </div>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 mb-3">Payment Details</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Pay Period:</span>
                  <span className="font-medium">{payroll.month}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Pay Date:</span>
                  <span className="font-medium">{payroll.pay_date}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Payment Method:</span>
                  <span className="font-medium">Bank Transfer</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Status:</span>
                  <span className="font-medium text-green-600">{payroll.status}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Earnings & Deductions */}
          <div className="grid grid-cols-2 gap-8 mb-8">
            <div className="border rounded-lg p-4">
              <h3 className="font-semibold text-gray-900 mb-4">Earnings</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-700">Basic Salary</span>
                  <span className="font-medium">{formatBDT(payroll.basic_salary)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-700">Allowances</span>
                  <span className="font-medium">{formatBDT(payroll.allowances)}</span>
                </div>
                <div className="border-t pt-3 flex justify-between font-semibold">
                  <span>Total Earnings</span>
                  <span>{formatBDT(payroll.basic_salary + payroll.allowances)}</span>
                </div>
              </div>
            </div>

            <div className="border rounded-lg p-4">
              <h3 className="font-semibold text-gray-900 mb-4">Deductions</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-700">Income Tax</span>
                  <span className="font-medium">{formatBDT(deductionBreakdown.tax)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-700">Social Security</span>
                  <span className="font-medium">{formatBDT(deductionBreakdown.social)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-700">Health Insurance</span>
                  <span className="font-medium">{formatBDT(deductionBreakdown.health)}</span>
                </div>
                <div className="border-t pt-3 flex justify-between font-semibold">
                  <span>Total Deductions</span>
                  <span>{formatBDT(payroll.deductions)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Net Pay */}
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-6 text-center">
            <p className="text-gray-700 mb-2">Net Pay</p>
            <p className="text-4xl font-bold text-gray-900">{formatBDT(payroll.net_salary)}</p>
            <p className="text-sm text-gray-600 mt-2">Amount payable for {payroll.month}</p>
          </div>

          {/* Footer */}
          <div className="mt-8 pt-6 border-t text-center text-sm text-gray-500">
            <p>This is a computer-generated payslip and does not require a signature.</p>
            <p className="mt-1">For queries, contact hr@banglahr.com.bd</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
