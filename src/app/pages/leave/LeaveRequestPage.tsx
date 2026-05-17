import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { Button } from "../../components/ui/button";
import { Textarea } from "../../components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../components/ui/select";
import { ArrowLeft, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "../../contexts/AuthContext";
import {
  createLeaveRequest,
  getLeaveBalanceByEmployee,
} from "../../../lib/services/leaveService";
import type { LeaveBalance } from "../../../lib/types/database";
import { supabase } from "../../../lib/supabase";

export default function LeaveRequestPage() {
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [employeesList, setEmployeesList] = useState<{ id: string; name: string }[]>([]);
  const [employeeId, setEmployeeId] = useState<string>("");
  const [balance, setBalance] = useState<LeaveBalance | null>(null);

  const [leaveType, setLeaveType] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [reason, setReason] = useState("");

  const leaveTypeLabel = useMemo(() => {
    const map: Record<string, string> = {
      annual: "Annual Leave",
      sick: "Sick Leave",
      casual: "Casual Leave",
      parental: "Parental Leave",
      unpaid: "Unpaid Leave",
    };
    return map[leaveType] ?? "";
  }, [leaveType]);

  const requestedDays = useMemo(() => {
    if (!startDate || !endDate) return 0;
    const start = new Date(startDate);
    const end = new Date(endDate);
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || end < start) return 0;
    const msPerDay = 1000 * 60 * 60 * 24;
    return Math.floor((end.getTime() - start.getTime()) / msPerDay) + 1;
  }, [startDate, endDate]);

  const fetchEmployees = useCallback(async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('employees')
        .select('id, name')
        .order('name');
      
      if (error) throw error;
      setEmployeesList(data || []);
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
    if (!employeeId) {
      setBalance(null);
      return;
    }
    const fetchBalance = async () => {
      try {
        const leaveBalance = await getLeaveBalanceByEmployee(employeeId);
        setBalance(leaveBalance);
      } catch {
        setBalance(null);
      }
    };
    fetchBalance();
  }, [employeeId]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!employeeId) {
      toast.error("Please select an employee.");
      return;
    }
    const selectedEmployee = employeesList.find(e => e.id === employeeId);
    if (!selectedEmployee) return;
    if (!leaveTypeLabel) {
      toast.error("Please select a leave type.");
      return;
    }
    if (!startDate || !endDate) {
      toast.error("Please choose both start and end dates.");
      return;
    }
    if (new Date(endDate) < new Date(startDate)) {
      toast.error("End date cannot be before start date.");
      return;
    }
    if (!reason.trim()) {
      toast.error("Please provide a reason for your leave request.");
      return;
    }
    if (requestedDays <= 0) {
      toast.error("Could not calculate leave duration.");
      return;
    }

    setSubmitting(true);
    try {
      await createLeaveRequest({
        employee_id: selectedEmployee.id,
        employee_name: selectedEmployee.name,
        type: leaveTypeLabel,
        start_date: startDate,
        end_date: endDate,
        days: requestedDays,
        reason: reason.trim(),
        status: "Pending",
        applied_date: new Date().toISOString().split("T")[0],
      });

      toast.success("Leave request submitted successfully.");
      navigate("/leave/history");
    } catch (error: any) {
      toast.error("Failed to submit leave request: " + error.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-3xl">
      {/* Header */}
      <div>
        <Link
          to="/leave/history"
          className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to leave history
        </Link>
        <h1 className="text-3xl font-semibold text-gray-900">Request Leave</h1>
        <p className="text-gray-600 mt-1">Submit a new leave request</p>
      </div>

      {/* Leave Balance */}
      <Card>
        <CardHeader>
          <CardTitle>Your Leave Balance</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8 text-gray-500">
              <Loader2 className="w-5 h-5 animate-spin mr-2" />
              Loading leave balance...
            </div>
          ) : !employeeId ? (
            <p className="text-sm text-amber-700 bg-amber-50 rounded-md p-3">
              Please select an employee to view their leave balance.
            </p>
          ) : (
            <div className="grid grid-cols-3 gap-4">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <p className="text-2xl font-semibold text-blue-700">{balance?.annual_leave ?? 0}</p>
              <p className="text-sm text-gray-600 mt-1">Annual Leave</p>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <p className="text-2xl font-semibold text-green-700">{balance?.sick_leave ?? 0}</p>
              <p className="text-sm text-gray-600 mt-1">Sick Leave</p>
            </div>
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <p className="text-2xl font-semibold text-purple-700">{balance?.casual_leave ?? 0}</p>
              <p className="text-sm text-gray-600 mt-1">Casual Leave</p>
            </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Request Form */}
      <Card>
        <CardHeader>
          <CardTitle>Leave Details</CardTitle>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={handleSubmit}>
            <div className="space-y-2">
              <Label htmlFor="employee">Employee *</Label>
              <Select value={employeeId} onValueChange={setEmployeeId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select employee" />
                </SelectTrigger>
                <SelectContent>
                  {employeesList.map((emp) => (
                    <SelectItem key={emp.id} value={emp.id}>
                      {emp.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="leaveType">Leave Type *</Label>
              <Select value={leaveType} onValueChange={setLeaveType}>
                <SelectTrigger>
                  <SelectValue placeholder="Select leave type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="annual">Annual Leave</SelectItem>
                  <SelectItem value="sick">Sick Leave</SelectItem>
                  <SelectItem value="casual">Casual Leave</SelectItem>
                  <SelectItem value="parental">Parental Leave</SelectItem>
                  <SelectItem value="unpaid">Unpaid Leave</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="startDate">Start Date *</Label>
                <Input id="startDate" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="endDate">End Date *</Label>
                <Input id="endDate" type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
              </div>
            </div>
            {requestedDays > 0 && (
              <p className="text-sm text-gray-600">Requested duration: <span className="font-medium">{requestedDays} day(s)</span></p>
            )}

            <div className="space-y-2">
              <Label htmlFor="reason">Reason *</Label>
              <Textarea
                id="reason"
                placeholder="Please provide a reason for your leave request..."
                rows={4}
                value={reason}
                onChange={(e) => setReason(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="attachment">Attachment (Optional)</Label>
              <Input id="attachment" type="file" />
              <p className="text-xs text-gray-500">
                Upload medical certificate or other supporting documents
              </p>
            </div>

            <div className="flex gap-4 pt-4">
              <Button type="submit" size="lg" disabled={submitting || loading || !employeeId}>
                {submitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Submit Request
              </Button>
              <Button type="button" variant="outline" size="lg" asChild>
                <Link to="/leave/history">Cancel</Link>
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
