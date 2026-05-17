import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Badge } from "../../components/ui/badge";
import { Loader2, Plus } from "lucide-react";
import { toast } from "sonner";
import { useAuth, isAdminOrHR } from "../../contexts/AuthContext";
import {
  getEmployeeByEmailForLeave,
  getLeaveBalanceByEmployee,
  getLeaveRequestsByEmployee,
} from "../../../lib/services/leaveService";
import type { LeaveBalance, LeaveRequest } from "../../../lib/types/database";

export default function LeaveHistoryPage() {
  const { user, role } = useAuth();
  const canManage = isAdminOrHR(role);

  const [loading, setLoading] = useState(true);
  const [employeeId, setEmployeeId] = useState<string | null>(null);
  const [balance, setBalance] = useState<LeaveBalance | null>(null);
  const [userLeaves, setUserLeaves] = useState<LeaveRequest[]>([]);

  const fetchData = useCallback(async () => {
    if (!user?.email) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const employee = await getEmployeeByEmailForLeave(user.email);
      if (!employee) {
        setEmployeeId(null);
        setUserLeaves([]);
        setBalance(null);
        return;
      }

      setEmployeeId(employee.id);

      const [requests, leaveBalance] = await Promise.all([
        getLeaveRequestsByEmployee(employee.id),
        getLeaveBalanceByEmployee(employee.id).catch(() => null),
      ]);
      setUserLeaves(requests);
      setBalance(leaveBalance);
    } catch (error: any) {
      toast.error("Failed to load leave history: " + error.message);
    } finally {
      setLoading(false);
    }
  }, [user?.email]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold text-gray-900">Leave History</h1>
          <p className="text-gray-600 mt-1">View your leave requests and balance</p>
        </div>
        {canManage && (
          <Button asChild>
            <Link to="/leave/request">
              <Plus className="w-4 h-4 mr-2" />
              Add Leave Record
            </Link>
          </Button>
        )}
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
              Your account is not linked to an employee profile. Contact HR.
            </p>
          ) : (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="text-center p-6 bg-blue-50 rounded-lg">
              <p className="text-4xl font-semibold text-blue-700">{balance?.annual_leave ?? 0}</p>
              <p className="text-sm text-gray-600 mt-2">Annual Leave</p>
              <p className="text-xs text-gray-500 mt-1">Available days</p>
            </div>
            <div className="text-center p-6 bg-green-50 rounded-lg">
              <p className="text-4xl font-semibold text-green-700">{balance?.sick_leave ?? 0}</p>
              <p className="text-sm text-gray-600 mt-2">Sick Leave</p>
              <p className="text-xs text-gray-500 mt-1">Available days</p>
            </div>
            <div className="text-center p-6 bg-purple-50 rounded-lg">
              <p className="text-4xl font-semibold text-purple-700">{balance?.casual_leave ?? 0}</p>
              <p className="text-sm text-gray-600 mt-2">Casual Leave</p>
              <p className="text-xs text-gray-500 mt-1">Available days</p>
            </div>
          </div>
          )}
        </CardContent>
      </Card>

      {/* Leave History */}
      <Card>
        <CardHeader>
          <CardTitle>Leave Requests</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12 text-gray-500">
              <Loader2 className="w-5 h-5 animate-spin mr-2" />
              Loading leave requests...
            </div>
          ) : (
          <div className="space-y-4">
            {employeeId && userLeaves.length > 0 ? (
              userLeaves.map((leave) => (
                <div
                  key={leave.id}
                  className="flex flex-col md:flex-row md:items-center justify-between p-4 border rounded-lg"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
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
                      {leave.start_date} to {leave.end_date} ({leave.days} days)
                    </p>
                    <p className="text-sm text-gray-600 mt-1">{leave.reason}</p>
                    <p className="text-xs text-gray-400 mt-2">Applied on {leave.applied_date}</p>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-12">
                <p className="text-gray-500">No leave requests found</p>
                {canManage && (
                  <Button className="mt-4" asChild>
                    <Link to="/leave/request">Add Leave Record</Link>
                  </Button>
                )}
              </div>
            )}
          </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
