import { useState, useEffect } from "react";
import { Link, useParams } from "react-router";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Badge } from "../../components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../components/ui/tabs";
import { ArrowLeft, Mail, Phone, Calendar, MapPin, Landmark, Building2, Edit, Download, Loader2 } from "lucide-react";
import { getEmployeeById } from "../../../lib/services/employeeService";
import { getAttendanceByEmployee } from "../../../lib/services/attendanceService";
import { getLeaveRequestsByEmployee } from "../../../lib/services/leaveService";
import type { Employee, AttendanceRecord, LeaveRequest } from "../../../lib/types/database";
import { toast } from "sonner";
import { formatBDT } from "../../../lib/formatters";

export default function EmployeeProfilePage() {
  const { id } = useParams();
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [leaves, setLeaves] = useState<LeaveRequest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    (async () => {
      try {
        const [emp, att, lv] = await Promise.all([
          getEmployeeById(id),
          getAttendanceByEmployee(id),
          getLeaveRequestsByEmployee(id),
        ]);
        setEmployee(emp);
        setAttendance(att);
        setLeaves(lv);
      } catch (error: any) {
        toast.error("Failed to load employee: " + error.message);
      } finally { setLoading(false); }
    })();
  }, [id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        <span className="ml-3 text-gray-500">Loading profile...</span>
      </div>
    );
  }
  if (!employee) return <div className="text-center py-20 text-gray-500">Employee not found</div>;

  return (
    <div className="space-y-6">
      <div>
        <Link to="/employees" className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 mb-4">
          <ArrowLeft className="w-4 h-4" /> Back to employees
        </Link>
      </div>

      {/* Profile Header */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-6">
            <img src={employee.avatar} alt={employee.name} className="w-32 h-32 rounded-full object-cover"
              onError={(e) => { (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${encodeURIComponent(employee.name)}&background=3b82f6&color=fff&size=150`; }} />
            <div className="flex-1">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4">
                <div>
                  <h1 className="text-3xl font-semibold text-gray-900">{employee.name}</h1>
                  <p className="text-lg text-gray-600 mt-1">{employee.role}</p>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" asChild>
                    <Link to={`/employees/edit/${employee.id}`}><Edit className="w-4 h-4 mr-2" /> Edit</Link>
                  </Button>
                  <Button variant="outline"><Download className="w-4 h-4 mr-2" /> Export</Button>
                </div>
              </div>
              <Badge variant={employee.status === "Active" ? "default" : "secondary"}>{employee.status}</Badge>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-6">
                <div className="flex items-center gap-3 text-gray-700">
                  <Mail className="w-5 h-5 text-gray-400" />
                  <div><p className="text-sm text-gray-500">Email</p><p className="font-medium">{employee.email}</p></div>
                </div>
                <div className="flex items-center gap-3 text-gray-700">
                  <Phone className="w-5 h-5 text-gray-400" />
                  <div><p className="text-sm text-gray-500">Phone</p><p className="font-medium">{employee.phone}</p></div>
                </div>
                <div className="flex items-center gap-3 text-gray-700">
                  <Building2 className="w-5 h-5 text-gray-400" />
                  <div><p className="text-sm text-gray-500">Department</p><p className="font-medium">{employee.department}</p></div>
                </div>
                <div className="flex items-center gap-3 text-gray-700">
                  <Calendar className="w-5 h-5 text-gray-400" />
                  <div><p className="text-sm text-gray-500">Join Date</p><p className="font-medium">{employee.join_date}</p></div>
                </div>
                <div className="flex items-center gap-3 text-gray-700">
                  <Landmark className="w-5 h-5 text-gray-400" />
                  <div><p className="text-sm text-gray-500">Salary</p><p className="font-medium">{formatBDT(employee.salary)}</p></div>
                </div>
                <div className="flex items-center gap-3 text-gray-700">
                  <MapPin className="w-5 h-5 text-gray-400" />
                  <div><p className="text-sm text-gray-500">Location</p><p className="font-medium">{employee.address || "N/A"}</p></div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs defaultValue="details" className="w-full">
        <TabsList>
          <TabsTrigger value="details">Details</TabsTrigger>
          <TabsTrigger value="attendance">Attendance</TabsTrigger>
          <TabsTrigger value="leaves">Leaves</TabsTrigger>
          <TabsTrigger value="documents">Documents</TabsTrigger>
        </TabsList>

        <TabsContent value="details" className="space-y-6 mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader><CardTitle>Personal Information</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                <div><p className="text-sm text-gray-500">Full Name</p><p className="font-medium">{employee.name}</p></div>
                <div><p className="text-sm text-gray-500">Date of Birth</p><p className="font-medium">{employee.date_of_birth || "N/A"}</p></div>
                <div><p className="text-sm text-gray-500">Gender</p><p className="font-medium">{employee.gender || "N/A"}</p></div>
                <div><p className="text-sm text-gray-500">Address</p><p className="font-medium">{employee.address || "N/A"}</p></div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle>Emergency Contact</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                <div><p className="text-sm text-gray-500">Contact Phone</p><p className="font-medium">{employee.emergency_contact || "N/A"}</p></div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="attendance" className="mt-6">
          <Card>
            <CardHeader><CardTitle>Recent Attendance</CardTitle></CardHeader>
            <CardContent>
              <div className="space-y-4">
                {attendance.length > 0 ? attendance.map((record) => (
                  <div key={record.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <p className="font-medium">{record.date}</p>
                      <p className="text-sm text-gray-600">{record.check_in} - {record.check_out}</p>
                    </div>
                    <Badge variant={record.status === "Present" ? "default" : record.status === "Late" ? "secondary" : "destructive"}>
                      {record.status}
                    </Badge>
                  </div>
                )) : <p className="text-center text-gray-500 py-8">No attendance records found</p>}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="leaves" className="mt-6">
          <Card>
            <CardHeader><CardTitle>Leave History</CardTitle></CardHeader>
            <CardContent>
              <div className="space-y-4">
                {leaves.length > 0 ? leaves.map((leave) => (
                  <div key={leave.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <p className="font-medium">{leave.type}</p>
                      <p className="text-sm text-gray-600">{leave.start_date} to {leave.end_date} ({leave.days} days)</p>
                      <p className="text-sm text-gray-500 mt-1">{leave.reason}</p>
                    </div>
                    <Badge variant={leave.status === "Approved" ? "default" : leave.status === "Pending" ? "secondary" : "destructive"}>
                      {leave.status}
                    </Badge>
                  </div>
                )) : <p className="text-center text-gray-500 py-8">No leave records found</p>}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="documents" className="mt-6">
          <Card>
            <CardHeader><CardTitle>Documents</CardTitle></CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <p className="font-medium">Resume.pdf</p>
                    <p className="text-sm text-gray-600">Uploaded on {employee.join_date}</p>
                  </div>
                  <Button variant="outline" size="sm"><Download className="w-4 h-4 mr-2" /> Download</Button>
                </div>
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <p className="font-medium">ID_Proof.pdf</p>
                    <p className="text-sm text-gray-600">Uploaded on {employee.join_date}</p>
                  </div>
                  <Button variant="outline" size="sm"><Download className="w-4 h-4 mr-2" /> Download</Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
