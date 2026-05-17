import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../components/ui/tabs";
import { Download, Users, Landmark, Calendar, FileText, Loader2, ArrowRight } from "lucide-react";
import { toast } from "sonner";
import { 
  getAttendanceReport, 
  getPayrollReport, 
  exportToCSV 
} from "../../../lib/services/adminService";

export default function AdminReportsPage() {
  const [loading, setLoading] = useState(false);
  const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM
  const [selectedMonth, setSelectedMonth] = useState(currentMonth);

  const handleExportAttendance = async () => {
    try {
      setLoading(true);
      const data = await getAttendanceReport(selectedMonth);
      if (data.length === 0) {
        toast.info("No attendance data found for this month");
        return;
      }
      exportToCSV(data, `Attendance_Report_${selectedMonth}`);
      toast.success("Attendance report exported successfully");
    } catch (error: any) {
      toast.error("Failed to export report: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleExportPayroll = async () => {
    try {
      setLoading(true);
      // Ensure format matches the DB "March 2026" or adapt service to use YYYY-MM
      // For simplicity, we just fetch all or adapt based on UI need. 
      const data = await getPayrollReport(); 
      if (data.length === 0) {
        toast.info("No payroll data found");
        return;
      }
      exportToCSV(data, `Payroll_Report`);
      toast.success("Payroll report exported successfully");
    } catch (error: any) {
      toast.error("Failed to export report: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold text-gray-900">Reports & Analytics</h1>
        <p className="text-gray-600 mt-1">Generate and export system reports.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Calendar className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <CardTitle>Attendance Report</CardTitle>
                <CardDescription>Monthly attendance summary per employee.</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-4">
              <input 
                type="month" 
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-600 focus:border-transparent"
              />
              <Button onClick={handleExportAttendance} disabled={loading} className="w-full sm:w-auto">
                {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Download className="w-4 h-4 mr-2" />}
                Export CSV
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-emerald-100 rounded-lg">
                <Landmark className="w-5 h-5 text-emerald-600" />
              </div>
              <div>
                <CardTitle>Payroll Report</CardTitle>
                <CardDescription>Comprehensive payroll and salary data.</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="flex items-end">
            <Button onClick={handleExportPayroll} disabled={loading} className="w-full">
              {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Download className="w-4 h-4 mr-2" />}
              Export All Payroll Data (CSV)
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Users className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <CardTitle>Employee Directory</CardTitle>
                <CardDescription>Full employee listing and details.</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
             <Button variant="outline" className="w-full" onClick={() => toast.info("Directory export initiated")}>
              <Download className="w-4 h-4 mr-2" /> Export Directory
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-100 rounded-lg">
                <FileText className="w-5 h-5 text-orange-600" />
              </div>
              <div>
                <CardTitle>Leave History</CardTitle>
                <CardDescription>All historical leave requests.</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Button variant="outline" className="w-full" onClick={() => toast.info("Leave history export initiated")}>
              <Download className="w-4 h-4 mr-2" /> Export Leave History
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
