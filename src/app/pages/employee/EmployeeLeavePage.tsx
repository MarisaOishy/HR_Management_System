import { useCallback, useEffect, useMemo, useState } from "react";
import { Loader2, Plus, AlertTriangle, X } from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Badge } from "../../components/ui/badge";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { Textarea } from "../../components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../../components/ui/dialog";
import { useAuth } from "../../contexts/AuthContext";
import {
  createLeaveRequest,
  getEmployeeByEmailForLeave,
  getLeaveBalanceByEmployee,
  getLeaveRequestsByEmployee,
} from "../../../lib/services/leaveService";
import type { LeaveBalance, LeaveRequest } from "../../../lib/types/database";

const LEAVE_TYPES = [
  { value: "Annual Leave", label: "Annual Leave" },
  { value: "Sick Leave", label: "Sick Leave" },
  { value: "Casual Leave", label: "Casual Leave" },
  { value: "Parental Leave", label: "Parental Leave" },
  { value: "Unpaid Leave", label: "Unpaid Leave" },
];

export default function EmployeeLeavePage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);

  const [employee, setEmployee] = useState<{ id: string; name: string } | null>(null);
  const [balance, setBalance] = useState<LeaveBalance | null>(null);
  const [leaves, setLeaves] = useState<LeaveRequest[]>([]);

  const [leaveType, setLeaveType] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [reason, setReason] = useState("");

  const requestedDays = useMemo(() => {
    if (!startDate || !endDate) return 0;
    const s = new Date(startDate);
    const e = new Date(endDate);
    if (Number.isNaN(s.getTime()) || Number.isNaN(e.getTime()) || e < s) return 0;
    const msPerDay = 1000 * 60 * 60 * 24;
    return Math.floor((e.getTime() - s.getTime()) / msPerDay) + 1;
  }, [startDate, endDate]);

  const fetchData = useCallback(async () => {
    if (!user?.email) {
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      const emp = await getEmployeeByEmailForLeave(user.email);
      if (!emp) {
        setEmployee(null);
        setLeaves([]);
        setBalance(null);
        return;
      }
      setEmployee({ id: emp.id, name: emp.name });

      const [list, bal] = await Promise.all([
        getLeaveRequestsByEmployee(emp.id),
        getLeaveBalanceByEmployee(emp.id).catch(() => null),
      ]);
      setLeaves(list);
      setBalance(bal);
    } catch (err: any) {
      toast.error("Failed to load leave data: " + err.message);
    } finally {
      setLoading(false);
    }
  }, [user?.email]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const resetForm = () => {
    setLeaveType("");
    setStartDate("");
    setEndDate("");
    setReason("");
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!employee) {
      toast.error("Your account is not linked to an employee profile.");
      return;
    }
    if (!leaveType) {
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
      toast.error("Please provide a reason.");
      return;
    }
    if (requestedDays <= 0) {
      toast.error("Could not calculate leave duration.");
      return;
    }

    setSubmitting(true);
    try {
      await createLeaveRequest({
        employee_id: employee.id,
        employee_name: employee.name,
        type: leaveType,
        start_date: startDate,
        end_date: endDate,
        days: requestedDays,
        reason: reason.trim(),
        status: "Pending",
        applied_date: new Date().toISOString().split("T")[0],
      });

      toast.success("Leave request submitted. Waiting for Admin approval.");
      resetForm();
      setDialogOpen(false);
      await fetchData();
    } catch (err: any) {
      toast.error("Failed to submit: " + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const pending = leaves.filter((l) => l.status === "Pending");
  const approved = leaves.filter((l) => l.status === "Approved");
  const rejected = leaves.filter((l) => l.status === "Rejected");

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold text-gray-900">My Leaves</h1>
          <p className="text-gray-600 mt-1">
            Submit leave requests and track their approval status.
          </p>
        </div>
        <Button
          size="lg"
          onClick={() => setDialogOpen(true)}
          disabled={!employee || loading}
        >
          <Plus className="w-4 h-4 mr-2" />
          Request Leave
        </Button>
      </div>

      {!employee && !loading && (
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

      {/* Balance */}
      <Card>
        <CardHeader>
          <CardTitle>Leave Balance</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8 text-gray-500">
              <Loader2 className="w-5 h-5 animate-spin mr-2" />
              Loading...
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="text-center p-6 bg-blue-50 rounded-lg">
                <p className="text-4xl font-semibold text-blue-700">
                  {balance?.annual_leave ?? 0}
                </p>
                <p className="text-sm text-gray-600 mt-2">Annual Leave</p>
              </div>
              <div className="text-center p-6 bg-green-50 rounded-lg">
                <p className="text-4xl font-semibold text-green-700">
                  {balance?.sick_leave ?? 0}
                </p>
                <p className="text-sm text-gray-600 mt-2">Sick Leave</p>
              </div>
              <div className="text-center p-6 bg-purple-50 rounded-lg">
                <p className="text-4xl font-semibold text-purple-700">
                  {balance?.casual_leave ?? 0}
                </p>
                <p className="text-sm text-gray-600 mt-2">Casual Leave</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-5">
            <p className="text-sm text-gray-600">Pending</p>
            <p className="text-2xl font-semibold text-amber-600 mt-1">{pending.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <p className="text-sm text-gray-600">Approved</p>
            <p className="text-2xl font-semibold text-green-600 mt-1">{approved.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <p className="text-sm text-gray-600">Rejected</p>
            <p className="text-2xl font-semibold text-red-600 mt-1">{rejected.length}</p>
          </CardContent>
        </Card>
      </div>

      {/* Requests list */}
      <Card>
        <CardHeader>
          <CardTitle>My Requests</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12 text-gray-500">
              <Loader2 className="w-5 h-5 animate-spin mr-2" />
              Loading requests...
            </div>
          ) : leaves.length === 0 ? (
            <div className="text-center py-10 text-gray-500">
              <p>No leave requests yet.</p>
              {employee && (
                <Button className="mt-4" onClick={() => setDialogOpen(true)}>
                  Submit your first request
                </Button>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              {leaves.map((leave) => (
                <div
                  key={leave.id}
                  className="flex flex-col md:flex-row md:items-center justify-between p-4 border rounded-lg gap-3"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge variant="secondary">{leave.type}</Badge>
                      <Badge
                        variant={
                          leave.status === "Approved"
                            ? "default"
                            : leave.status === "Pending"
                            ? "secondary"
                            : "destructive"
                        }
                      >
                        {leave.status}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-900 font-medium">
                      {leave.start_date} → {leave.end_date} ({leave.days} day
                      {leave.days > 1 ? "s" : ""})
                    </p>
                    <p className="text-sm text-gray-600 mt-1">{leave.reason}</p>
                    <p className="text-xs text-gray-400 mt-1">
                      Applied on {leave.applied_date}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Request dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Request Leave</DialogTitle>
            <DialogDescription>
              Your request will be sent to the Admin for approval.
            </DialogDescription>
          </DialogHeader>
          <form className="space-y-4" onSubmit={handleSubmit}>
            <div className="space-y-2">
              <Label>Leave Type *</Label>
              <Select value={leaveType} onValueChange={setLeaveType}>
                <SelectTrigger>
                  <SelectValue placeholder="Select leave type" />
                </SelectTrigger>
                <SelectContent>
                  {LEAVE_TYPES.map((t) => (
                    <SelectItem key={t.value} value={t.value}>
                      {t.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="startDate">Start Date *</Label>
                <Input
                  id="startDate"
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="endDate">End Date *</Label>
                <Input
                  id="endDate"
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
              </div>
            </div>
            {requestedDays > 0 && (
              <p className="text-sm text-gray-600">
                Requested duration:{" "}
                <span className="font-medium">{requestedDays} day(s)</span>
              </p>
            )}

            <div className="space-y-2">
              <Label htmlFor="reason">Reason *</Label>
              <Textarea
                id="reason"
                rows={3}
                placeholder="Please describe the reason for your leave..."
                value={reason}
                onChange={(e) => setReason(e.target.value)}
              />
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="ghost"
                onClick={() => setDialogOpen(false)}
                disabled={submitting}
              >
                <X className="w-4 h-4 mr-2" />
                Cancel
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Submit Request
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
