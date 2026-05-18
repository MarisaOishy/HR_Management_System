import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Badge } from "../../components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../../components/ui/table";
import { Check, X, Eye, Loader2 } from "lucide-react";
import { getLeaveRequests, updateLeaveStatus, deductLeaveBalance } from "../../../lib/services/leaveService";
import type { LeaveRequest } from "../../../lib/types/database";
import { toast } from "sonner";
import { useAuth, canApproveLeaves } from "../../contexts/AuthContext";

export default function LeaveApprovalPage() {
  const { role } = useAuth();
  const canDecide = canApproveLeaves(role);
  const [requests, setRequests] = useState<LeaveRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchRequests = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getLeaveRequests();
      setRequests(data);
    } catch (error: any) {
      toast.error("Failed to fetch leave requests: " + error.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  const handleApprove = async (request: LeaveRequest) => {
    setActionLoading(request.id);
    try {
      // 1. Update status to Approved
      await updateLeaveStatus(request.id, "Approved");
      
      // 2. Deduct leave days
      await deductLeaveBalance(request.employee_id, request.type, request.days);
      
      toast.success("Leave request approved successfully");
      await fetchRequests(); // Refresh the list
    } catch (error: any) {
      toast.error("Error approving request: " + error.message);
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async (id: string) => {
    setActionLoading(id);
    try {
      await updateLeaveStatus(id, "Rejected");
      toast.success("Leave request rejected");
      await fetchRequests(); // Refresh the list
    } catch (error: any) {
      toast.error("Error rejecting request: " + error.message);
    } finally {
      setActionLoading(null);
    }
  };

  const pendingRequests = requests.filter((r) => r.status === "Pending");

  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();

  const isThisMonth = (dateString: string) => {
    if (!dateString) return false;
    const d = new Date(dateString);
    return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
  };

  const approvedThisMonth = requests.filter((r) => r.status === "Approved" && isThisMonth(r.applied_date)).length;
  const rejectedThisMonth = requests.filter((r) => r.status === "Rejected" && isThisMonth(r.applied_date)).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold text-gray-900">Leave Approvals</h1>
          <p className="text-gray-600 mt-1">
            {canDecide
              ? "Review and approve leave requests"
              : "View leave requests submitted by employees (read-only)"}
          </p>
        </div>
        <div className="flex gap-2">
          {canDecide && (
            <Link to="/leave/request">
              <Button className="bg-blue-600 hover:bg-blue-700">Add Leave Record</Button>
            </Link>
          )}
          <Link to="/leave/history">
            <Button variant="outline">View History</Button>
          </Link>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <Card>
          <CardContent className="p-6">
            <p className="text-sm text-gray-600">Pending Requests</p>
            <p className="text-3xl font-semibold text-gray-900 mt-2">{loading ? "-" : pendingRequests.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <p className="text-sm text-gray-600">Approved (This Month)</p>
            <p className="text-3xl font-semibold text-gray-900 mt-2">{loading ? "-" : approvedThisMonth}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <p className="text-sm text-gray-600">Rejected (This Month)</p>
            <p className="text-3xl font-semibold text-gray-900 mt-2">{loading ? "-" : rejectedThisMonth}</p>
          </CardContent>
        </Card>
      </div>

      {/* Pending Requests */}
      <Card>
        <CardHeader>
          <CardTitle>Pending Requests</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
             <div className="flex items-center justify-center py-16">
               <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
               <span className="ml-3 text-gray-500">Loading requests...</span>
             </div>
          ) : pendingRequests.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Employee</TableHead>
                    <TableHead>Leave Type</TableHead>
                    <TableHead>Duration</TableHead>
                    <TableHead>Days</TableHead>
                    <TableHead>Applied On</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pendingRequests.map((request) => (
                    <TableRow key={request.id}>
                      <TableCell>
                        <p className="font-medium text-gray-900">{request.employee_name}</p>
                        <p className="text-sm text-gray-500">{request.employee_id}</p>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">{request.type}</Badge>
                      </TableCell>
                      <TableCell>
                        <p className="text-sm">
                          {request.start_date} to {request.end_date}
                        </p>
                      </TableCell>
                      <TableCell>{request.days} days</TableCell>
                      <TableCell>{request.applied_date}</TableCell>
                      <TableCell>
                        <div className="flex items-center justify-end gap-2">
                          <Button variant="ghost" size="sm">
                            <Eye className="w-4 h-4" />
                          </Button>
                          {canDecide && (
                            <>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-green-600 hover:text-green-700"
                                onClick={() => handleApprove(request)}
                                disabled={actionLoading === request.id}
                              >
                                {actionLoading === request.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-red-600 hover:text-red-700"
                                onClick={() => handleReject(request.id)}
                                disabled={actionLoading === request.id}
                              >
                                {actionLoading === request.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <X className="w-4 h-4" />}
                              </Button>
                            </>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="p-12 text-center">
              <p className="text-gray-500">No pending leave requests</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* All Requests */}
      <Card>
        <CardHeader>
          <CardTitle>All Leave Requests</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
             <div className="flex items-center justify-center py-16">
               <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
               <span className="ml-3 text-gray-500">Loading requests...</span>
             </div>
          ) : requests.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Employee</TableHead>
                    <TableHead>Leave Type</TableHead>
                    <TableHead>Duration</TableHead>
                    <TableHead>Days</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Reason</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {requests.map((request) => (
                    <TableRow key={request.id}>
                      <TableCell>
                        <p className="font-medium text-gray-900">{request.employee_name}</p>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">{request.type}</Badge>
                      </TableCell>
                      <TableCell>
                        <p className="text-sm">
                          {request.start_date} to {request.end_date}
                        </p>
                      </TableCell>
                      <TableCell>{request.days} days</TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            request.status === "Approved"
                              ? "default"
                              : request.status === "Pending"
                              ? "secondary"
                              : "destructive"
                          }
                        >
                          {request.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <p className="text-sm text-gray-600 max-w-xs truncate">{request.reason}</p>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="p-12 text-center">
              <p className="text-gray-500">No leave requests found</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
