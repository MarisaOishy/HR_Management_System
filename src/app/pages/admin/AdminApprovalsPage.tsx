import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../components/ui/tabs";
import { CheckSquare, Loader2, CheckCircle2, XCircle, Clock, FileText, Landmark } from "lucide-react";
import { getPendingApprovals, getApprovalHistory, approveLeave, rejectLeave, approvePayroll, rejectPayroll, type ApprovalItem } from "../../../lib/services/adminService";
import { toast } from "sonner";
import { Badge } from "../../components/ui/badge";

export default function AdminApprovalsPage() {
  const [pending, setPending] = useState<ApprovalItem[]>([]);
  const [history, setHistory] = useState<ApprovalItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("pending");

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [pendingData, historyData] = await Promise.all([
        getPendingApprovals(),
        getApprovalHistory()
      ]);
      setPending(pendingData);
      setHistory(historyData);
    } catch (error: any) {
      toast.error("Failed to load approvals: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (item: ApprovalItem) => {
    try {
      if (item.type === 'leave') {
        await approveLeave(item.id);
      } else if (item.type === 'payroll') {
        await approvePayroll(item.id);
      }
      toast.success("Approved successfully");
      loadData();
    } catch (error: any) {
      toast.error("Failed to approve: " + error.message);
    }
  };

  const handleReject = async (item: ApprovalItem) => {
    try {
      if (item.type === 'leave') {
        await rejectLeave(item.id);
      } else if (item.type === 'payroll') {
        await rejectPayroll(item.id);
      }
      toast.success("Rejected successfully");
      loadData();
    } catch (error: any) {
      toast.error("Failed to reject: " + error.message);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-10 h-10 animate-spin text-purple-600" />
        <span className="ml-4 text-lg text-gray-500">Loading approvals...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold text-gray-900">Approval Center</h1>
        <p className="text-gray-600 mt-1">Review and manage pending requests.</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="pending" className="flex items-center gap-2">
            <Clock className="w-4 h-4" />
            Pending ({pending.length})
          </TabsTrigger>
          <TabsTrigger value="history" className="flex items-center gap-2">
            <CheckSquare className="w-4 h-4" />
            History
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="space-y-4">
          {pending.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center h-64 text-gray-500">
                <CheckCircle2 className="w-12 h-12 text-green-400 mb-4" />
                <p className="text-lg font-medium text-gray-900">All caught up!</p>
                <p>There are no pending approvals at this time.</p>
              </CardContent>
            </Card>
          ) : (
            pending.map((item) => (
              <Card key={`${item.type}-${item.id}`}>
                <CardContent className="p-6">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="flex items-start gap-4">
                      <div className={`p-3 rounded-lg ${item.type === 'leave' ? 'bg-blue-100 text-blue-600' : 'bg-emerald-100 text-emerald-600'}`}>
                        {item.type === 'leave' ? <FileText className="w-6 h-6" /> : <Landmark className="w-6 h-6" />}
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">{item.title}</h3>
                        <p className="text-sm text-gray-500 mt-1">Requested by <span className="font-medium text-gray-900">{item.requestedBy}</span> on {item.requestedDate}</p>
                        <p className="text-gray-700 mt-2">{item.description}</p>
                      </div>
                    </div>
                    <div className="flex gap-3 shrink-0">
                      <Button variant="outline" className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200" onClick={() => handleReject(item)}>
                        <XCircle className="w-4 h-4 mr-2" /> Reject
                      </Button>
                      <Button className="bg-green-600 hover:bg-green-700" onClick={() => handleApprove(item)}>
                        <CheckCircle2 className="w-4 h-4 mr-2" /> Approve
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        <TabsContent value="history" className="space-y-4">
          {history.length === 0 ? (
            <Card>
              <CardContent className="flex items-center justify-center h-64 text-gray-500">
                No history found.
              </CardContent>
            </Card>
          ) : (
            history.map((item) => (
              <Card key={`${item.type}-${item.id}`}>
                <CardContent className="p-4 sm:p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4">
                       <div className={`p-2 rounded-lg ${item.type === 'leave' ? 'bg-blue-100 text-blue-600' : 'bg-emerald-100 text-emerald-600'}`}>
                        {item.type === 'leave' ? <FileText className="w-5 h-5" /> : <Landmark className="w-5 h-5" />}
                      </div>
                      <div>
                        <h3 className="font-medium text-gray-900">{item.title}</h3>
                        <p className="text-sm text-gray-500">{item.requestedBy} • {item.requestedDate}</p>
                        <p className="text-sm text-gray-600 mt-1">{item.description}</p>
                      </div>
                    </div>
                    <Badge variant="outline" className={item.status === 'Approved' || item.status === 'Paid' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-red-50 text-red-700 border-red-200'}>
                      {item.status}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
