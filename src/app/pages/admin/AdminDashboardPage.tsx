import { useState, useEffect } from "react";
import { Link } from "react-router";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Users, Building2, Shield, FileText, CheckSquare, Clock, TrendingUp, Landmark, AlertTriangle, Loader2, ArrowRight, Activity, UserCheck, UserX, Calendar } from "lucide-react";
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { getAdminDashboardStats, type AdminDashboardStats } from "../../../lib/services/adminService";
import { getDepartmentDistribution, getAttendanceTrend, type DeptDistribution, type AttendanceTrendPoint } from "../../../lib/services/dashboardService";
import { toast } from "sonner";

const COLORS = ["#8b5cf6", "#ec4899", "#3b82f6", "#f59e0b", "#10b981", "#6366f1"];
const Settings = Shield; // alias
const ScrollText = Activity; // alias

export default function AdminDashboardPage() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<AdminDashboardStats | null>(null);
  const [deptData, setDeptData] = useState<DeptDistribution[]>([]);
  const [trendData, setTrendData] = useState<AttendanceTrendPoint[]>([]);

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const [s, d, t] = await Promise.all([getAdminDashboardStats(), getDepartmentDistribution(), getAttendanceTrend()]);
        setStats(s); setDeptData(d); setTrendData(t);
      } catch (err: any) { toast.error("Failed to load dashboard: " + err.message); }
      finally { setLoading(false); }
    })();
  }, []);

  if (loading) return (
    <div className="flex items-center justify-center h-96">
      <Loader2 className="w-10 h-10 animate-spin text-purple-600" />
      <span className="ml-4 text-lg text-gray-500">Loading admin dashboard...</span>
    </div>
  );

  const cards = stats ? [
    { title: "Total Employees", value: stats.totalEmployees, sub: `${stats.activeEmployees} active`, icon: Users, c: "bg-blue-50 text-blue-600", b: "border-blue-200" },
    { title: "Departments", value: stats.totalDepartments, sub: "Units", icon: Building2, c: "bg-purple-50 text-purple-600", b: "border-purple-200" },
    { title: "Roles", value: stats.totalRoles, sub: "Levels", icon: Shield, c: "bg-pink-50 text-pink-600", b: "border-pink-200" },
    { title: "Present Today", value: stats.presentToday, sub: `${stats.lateToday} late`, icon: UserCheck, c: "bg-green-50 text-green-600", b: "border-green-200" },
    { title: "Absent Today", value: stats.absentToday, sub: `${stats.onLeaveToday} on leave`, icon: UserX, c: "bg-red-50 text-red-600", b: "border-red-200" },
    { title: "Pending Leaves", value: stats.pendingLeaves, sub: "Awaiting", icon: FileText, c: "bg-orange-50 text-orange-600", b: "border-orange-200" },
    { title: "Pending Payrolls", value: stats.pendingPayrolls, sub: "To process", icon: Landmark, c: "bg-cyan-50 text-cyan-600", b: "border-cyan-200" },
    { title: "Monthly Payroll", value: `Tk ${(stats.monthlyPayroll/1000).toFixed(0)}K`, sub: "Disbursement", icon: TrendingUp, c: "bg-emerald-50 text-emerald-600", b: "border-emerald-200" },
  ] : [];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold text-gray-900">Admin Dashboard</h1>
          <p className="text-gray-600 mt-1">System-wide overview and management controls.</p>
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <Activity className="w-4 h-4" /><span>Last updated: {new Date().toLocaleTimeString()}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((s) => { const I = s.icon; return (
          <Card key={s.title} className={`border ${s.b} hover:shadow-md transition-shadow`}>
            <CardContent className="p-5">
              <div className="flex items-start justify-between">
                <div><p className="text-sm text-gray-500 font-medium">{s.title}</p><p className="text-2xl font-bold text-gray-900 mt-1">{s.value}</p><p className="text-xs text-gray-400 mt-1">{s.sub}</p></div>
                <div className={`p-2.5 rounded-lg ${s.c}`}><I className="w-5 h-5" /></div>
              </div>
            </CardContent>
          </Card>
        ); })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card><CardHeader><CardTitle>Attendance Trend (6 Months)</CardTitle></CardHeader><CardContent>
          {trendData.length === 0 ? <div className="flex items-center justify-center h-[280px] text-gray-400"><AlertTriangle className="w-5 h-5 mr-2"/>No data</div> : (
          <ResponsiveContainer width="100%" height={280}><BarChart data={trendData}><CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb"/><XAxis dataKey="month" stroke="#6b7280"/><YAxis stroke="#6b7280"/><Tooltip/><Bar dataKey="present" fill="#8b5cf6" radius={[4,4,0,0]} name="Present"/><Bar dataKey="late" fill="#f59e0b" radius={[4,4,0,0]} name="Late"/><Bar dataKey="absent" fill="#ef4444" radius={[4,4,0,0]} name="Absent"/></BarChart></ResponsiveContainer>)}
        </CardContent></Card>
        <Card><CardHeader><CardTitle>Department Distribution</CardTitle></CardHeader><CardContent>
          {deptData.length === 0 ? <div className="flex items-center justify-center h-[280px] text-gray-400"><AlertTriangle className="w-5 h-5 mr-2"/>No data</div> : (
          <ResponsiveContainer width="100%" height={280}><PieChart><Pie data={deptData} cx="50%" cy="50%" labelLine={false} label={({name,percent})=>`${name} ${(percent*100).toFixed(0)}%`} outerRadius={100} fill="#8884d8" dataKey="value">{deptData.map((_,i)=>(<Cell key={i} fill={COLORS[i%COLORS.length]}/>))}</Pie><Tooltip/></PieChart></ResponsiveContainer>)}
        </CardContent></Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2"><CardHeader className="flex flex-row items-center justify-between"><CardTitle>Recent Audit Activity</CardTitle><Link to="/admin/audit-logs" className="text-sm text-purple-600 hover:underline flex items-center gap-1">View all<ArrowRight className="w-4 h-4"/></Link></CardHeader><CardContent>
          {(stats?.recentAuditLogs??[]).length===0 ? <div className="flex items-center justify-center py-8 text-gray-400"><Clock className="w-5 h-5 mr-2"/>No audit activity yet</div> : (
          <div className="space-y-3">{stats!.recentAuditLogs.map(l=>(
            <div key={l.id} className="flex items-start gap-3 p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors">
              <div className="p-2 bg-purple-100 rounded-lg"><Activity className="w-4 h-4 text-purple-600"/></div>
              <div className="flex-1 min-w-0"><p className="text-sm text-gray-900 font-medium">{l.action}</p><p className="text-xs text-gray-500">{l.resource_type} • {l.actor_email}</p><p className="text-xs text-gray-400 mt-1">{new Date(l.created_at).toLocaleString()}</p></div>
            </div>))}</div>)}
        </CardContent></Card>
        <Card><CardHeader><CardTitle>Quick Actions</CardTitle></CardHeader><CardContent><div className="space-y-2">
          {[
            {l:"Manage Users",h:"/admin/users",i:Users,c:"text-blue-600 bg-blue-50 hover:bg-blue-100"},
            {l:"Manage Roles",h:"/admin/roles",i:Shield,c:"text-purple-600 bg-purple-50 hover:bg-purple-100"},
            {l:"View Approvals",h:"/admin/approvals",i:CheckSquare,c:"text-orange-600 bg-orange-50 hover:bg-orange-100"},
            {l:"Generate Reports",h:"/admin/reports",i:Calendar,c:"text-emerald-600 bg-emerald-50 hover:bg-emerald-100"},
          ].map(a=>{const I=a.i;return(
            <Link key={a.l} to={a.h} className={`flex items-center gap-3 p-3 rounded-lg transition-colors ${a.c}`}><I className="w-5 h-5"/><span className="font-medium text-sm">{a.l}</span><ArrowRight className="w-4 h-4 ml-auto opacity-50"/></Link>
          );})}</div></CardContent></Card>
      </div>
    </div>
  );
}
