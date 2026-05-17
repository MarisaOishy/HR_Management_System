import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { Button } from "../../components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../components/ui/select";
import { ArrowLeft, Loader2, Calculator } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "../../../lib/supabase";
import { createPayrollRecord } from "../../../lib/services/payrollService";
import { getAttendanceByEmployee, parseTime12h } from "../../../lib/services/attendanceService";
import type { Employee } from "../../../lib/types/database";

export default function ProcessPayrollPage() {
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [selectedEmpId, setSelectedEmpId] = useState<string>("");
  const [empSearch, setEmpSearch] = useState("");

  const [month, setMonth] = useState("");
  const [allowances, setAllowances] = useState<number>(0);
  const [deductions, setDeductions] = useState<number>(0);

  const availableMonths = useMemo(() => {
    const months = [];
    const now = new Date();
    for (let i = 0; i < 12; i++) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthName = d.toLocaleString('default', { month: 'long' });
      months.push(`${monthName} ${d.getFullYear()}`);
    }
    return months;
  }, []);

  const fetchEmployees = useCallback(async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("employees")
        .select("*")
        .order("name");
      if (error) throw error;
      setEmployees(data || []);
    } catch (error: any) {
      toast.error("Failed to load employees: " + error.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchEmployees();
  }, [fetchEmployees]);

  useEffect(() => {
    if (!selectedEmpId || !month || month.length < 3) return;

    const d = new Date(month + " 1");
    if (isNaN(d.getTime())) return;

    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const yyyy = d.getFullYear();
    const prefix = `${yyyy}-${mm}`;

    let isMounted = true;
    
    const fetchAttendance = async () => {
      try {
        const records = await getAttendanceByEmployee(selectedEmpId);
        if (!isMounted) return;

        const monthlyRecords = records.filter(r => r.date.startsWith(prefix));

        let totalOvertimeHours = 0;
        let totalLateHours = 0;

        for (const r of monthlyRecords) {
          const hrs = parseFloat(r.hours);
          if (!isNaN(hrs) && hrs > 8) {
            totalOvertimeHours += (hrs - 8);
          }

          if (r.status === 'Present (Late)' || r.status === 'Late') {
            const inTime = parseTime12h(r.check_in);
            if (inTime) {
              const shiftStart = new Date(inTime);
              shiftStart.setHours(9, 0, 0, 0); // Assuming 9 AM shift start
              if (inTime > shiftStart) {
                const lateH = (inTime.getTime() - shiftStart.getTime()) / (1000 * 60 * 60);
                totalLateHours += lateH;
              }
            }
          }
        }

        const autoOvertime = Math.round(totalOvertimeHours * 1000);
        const autoDeduction = Math.round(totalLateHours * 300);

        setAllowances(autoOvertime);
        setDeductions(autoDeduction);
        
        if (autoOvertime > 0 || autoDeduction > 0) {
          toast.success(`Auto-calculated: ৳${autoOvertime} OT, ৳${autoDeduction} Deductions`);
        }
      } catch (e) {
        console.error("Failed to calculate attendance data:", e);
      }
    };

    const timer = setTimeout(() => {
      fetchAttendance();
    }, 800);

    return () => {
      isMounted = false;
      clearTimeout(timer);
    };
  }, [selectedEmpId, month]);

  const selectedEmployee = useMemo(() => {
    return employees.find((e) => e.id === selectedEmpId);
  }, [employees, selectedEmpId]);

  const baseSalary = selectedEmployee?.salary ?? 0;
  
  const netSalary = useMemo(() => {
    return baseSalary + (allowances || 0) - (deductions || 0);
  }, [baseSalary, allowances, deductions]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEmployee) {
      toast.error("Please select an employee");
      return;
    }
    if (!month) {
      toast.error("Please enter the month (e.g., January 2024)");
      return;
    }
    if (netSalary < 0) {
      toast.error("Net salary cannot be negative");
      return;
    }

    try {
      setSubmitting(true);
      await createPayrollRecord({
        employee_id: selectedEmployee.id,
        employee_name: selectedEmployee.name,
        month,
        basic_salary: baseSalary,
        allowances: allowances || 0,
        deductions: deductions || 0,
        net_salary: netSalary,
        status: "Paid",
        pay_date: new Date().toISOString().split("T")[0],
      });
      toast.success("Payroll processed successfully");
      navigate("/payroll/table");
    } catch (error: any) {
      toast.error("Failed to process payroll: " + error.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <Link
          to="/payroll"
          className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Payroll
        </Link>
        <h1 className="text-3xl font-semibold text-gray-900">Process Salary</h1>
        <p className="text-gray-600 mt-1">Manually process employee payroll payments</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Salary Details</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Employee *</Label>
                  {loading ? (
                    <div className="flex items-center h-10 border rounded-md px-3 text-sm text-gray-500 bg-gray-50">
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Loading...
                    </div>
                  ) : (
                    <div className="relative">
                      <Input
                        type="text"
                        placeholder="Type name, ID, or double click to select..."
                        value={empSearch}
                        onChange={(e) => {
                          const val = e.target.value;
                          setEmpSearch(val);
                          
                          const lowerVal = val.toLowerCase().trim();
                          const found = employees.find(
                            (emp) => 
                              emp.name.toLowerCase() === lowerVal || 
                              emp.id.toLowerCase() === lowerVal ||
                              `${emp.name.toLowerCase()} (${emp.id.toLowerCase()})` === lowerVal
                          );
                          
                          setSelectedEmpId(found ? found.id : "");
                        }}
                        list="employees-datalist"
                        className="w-full bg-white"
                      />
                      <datalist id="employees-datalist">
                        {employees.map((emp) => (
                          <option key={emp.id} value={`${emp.name} (${emp.id})`} />
                        ))}
                      </datalist>
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <Label>Month *</Label>
                  <Select value={month} onValueChange={setMonth}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select month" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableMonths.map((m) => (
                        <SelectItem key={m} value={m}>
                          {m}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="p-4 bg-gray-50 rounded-lg space-y-4">
                <div className="flex justify-between items-center border-b pb-4">
                  <Label className="text-base text-gray-600">Base Salary</Label>
                  <p className="text-xl font-semibold text-gray-900">
                    ৳{baseSalary.toLocaleString()}
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                  <div className="space-y-2">
                    <Label>Overtime & Bonuses (৳)</Label>
                    <Input 
                      type="number" 
                      min="0"
                      value={allowances === 0 ? '' : allowances} 
                      onChange={e => setAllowances(Number(e.target.value))} 
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Deductions (৳)</Label>
                    <Input 
                      type="number" 
                      min="0"
                      value={deductions === 0 ? '' : deductions} 
                      onChange={e => setDeductions(Number(e.target.value))} 
                    />
                  </div>
                </div>

                <div className="flex justify-between items-center pt-4 border-t mt-4">
                  <div className="flex items-center gap-2">
                    <Calculator className="w-5 h-5 text-blue-600" />
                    <Label className="text-lg text-gray-900">Calculated Net Salary</Label>
                  </div>
                  <p className="text-3xl font-bold text-blue-600">
                    ৳{netSalary.toLocaleString()}
                  </p>
                </div>
              </div>
            </div>

            <div className="flex gap-4 pt-4">
              <Button type="submit" size="lg" disabled={submitting || !selectedEmpId}>
                {submitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Confirm Payment
              </Button>
              <Button type="button" variant="outline" size="lg" asChild>
                <Link to="/payroll">Cancel</Link>
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
