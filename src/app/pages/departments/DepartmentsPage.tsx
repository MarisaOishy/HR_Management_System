import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "../../components/ui/dialog";
import { Plus, Edit, Trash2, Users, Loader2 } from "lucide-react";
import { toast } from "sonner";
import {
  createDepartment,
  deleteDepartment,
  getDepartments,
  updateDepartment,
} from "../../../lib/services/departmentService";
import { getEmployees } from "../../../lib/services/employeeService";
import type { Department, Employee } from "../../../lib/types/database";
import { formatBDT } from "../../../lib/formatters";

export default function DepartmentsPage() {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingDepartment, setEditingDepartment] = useState<Department | null>(null);

  const [deptName, setDeptName] = useState("");
  const [deptHead, setDeptHead] = useState("");
  const [budget, setBudget] = useState("");

  const activeEmployees = useMemo(
    () => employees.filter((emp) => emp.status === "Active"),
    [employees]
  );

  const departmentStats = useMemo(() => {
    const map = new Map<string, { count: number; totalSalary: number; active: number; onLeave: number }>();
    employees.forEach((emp) => {
      const stats = map.get(emp.department) || { count: 0, totalSalary: 0, active: 0, onLeave: 0 };
      stats.count += 1;
      stats.totalSalary += emp.salary || 0;
      if (emp.status === "Active") stats.active += 1;
      if (emp.status === "On Leave") stats.onLeave += 1;
      map.set(emp.department, stats);
    });
    return map;
  }, [employees]);

  const resetForm = () => {
    setEditingDepartment(null);
    setDeptName("");
    setDeptHead("");
    setBudget("");
  };

  const openCreateDialog = () => {
    resetForm();
    setIsDialogOpen(true);
  };

  const openEditDialog = (department: Department) => {
    setEditingDepartment(department);
    setDeptName(department.name);
    setDeptHead(department.head);
    setBudget(String(department.budget));
    setIsDialogOpen(true);
  };

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [departmentRows, employeeRows] = await Promise.all([
        getDepartments(),
        getEmployees(),
      ]);
      setDepartments(departmentRows);
      setEmployees(employeeRows);
    } catch (error: any) {
      toast.error("Failed to load departments: " + error.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleSaveDepartment = async () => {
    const trimmedName = deptName.trim();
    const trimmedHead = deptHead.trim();
    const parsedBudget = Number(budget);

    if (!trimmedName) {
      toast.error("Department name is required.");
      return;
    }
    if (!trimmedHead) {
      toast.error("Department head is required.");
      return;
    }
    if (Number.isNaN(parsedBudget) || parsedBudget < 0) {
      toast.error("Budget must be a valid non-negative number.");
      return;
    }

    const employeesCount = departmentStats.get(trimmedName)?.count ?? editingDepartment?.employees_count ?? 0;

    setSaving(true);
    try {
      if (editingDepartment) {
        await updateDepartment(editingDepartment.id, {
          name: trimmedName,
          head: trimmedHead,
          budget: parsedBudget,
          employees_count: employeesCount,
        });
        toast.success("Department updated");
      } else {
        await createDepartment({
          name: trimmedName,
          head: trimmedHead,
          budget: parsedBudget,
          employees_count: employeesCount,
        });
        toast.success("Department created");
      }
      setIsDialogOpen(false);
      resetForm();
      await fetchData();
    } catch (error: any) {
      toast.error("Failed to save department: " + error.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteDepartment = async (department: Department) => {
    if (!confirm(`Delete "${department.name}" department? This action cannot be undone.`)) return;
    setDeletingId(department.id);
    try {
      await deleteDepartment(department.id);
      toast.success("Department deleted");
      await fetchData();
    } catch (error: any) {
      toast.error("Failed to delete department: " + error.message);
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold text-gray-900">Departments</h1>
          <p className="text-gray-600 mt-1">Manage company departments</p>
        </div>
        <Button onClick={openCreateDialog}>
          <Plus className="w-4 h-4 mr-2" />
          Add Department
        </Button>
      </div>

      {/* Departments Grid */}
      {loading ? (
        <Card>
          <CardContent className="py-16 flex items-center justify-center text-gray-500">
            <Loader2 className="w-5 h-5 mr-2 animate-spin" />
            Loading departments...
          </CardContent>
        </Card>
      ) : departments.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center">
            <p className="text-gray-500">No departments found.</p>
            <Button className="mt-4" onClick={openCreateDialog}>
              <Plus className="w-4 h-4 mr-2" />
              Create First Department
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {departments.map((dept) => {
            const stats = departmentStats.get(dept.name) || { count: 0, totalSalary: 0, active: 0, onLeave: 0 };
            const employeeCount = stats.count;
            const avgSalary = employeeCount > 0 ? Math.round(stats.totalSalary / employeeCount) : 0;
            const actualAnnualPayroll = stats.totalSalary * 12;

            return (
              <Card key={dept.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle>{dept.name}</CardTitle>
                      <p className="text-sm text-gray-600 mt-1">Head: {dept.head || "Not assigned"}</p>
                    </div>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="sm" onClick={() => openEditDialog(dept)}>
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-red-600 hover:text-red-700"
                        onClick={() => handleDeleteDepartment(dept)}
                        disabled={deletingId === dept.id}
                      >
                        {deletingId === dept.id ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Trash2 className="w-4 h-4" />
                        )}
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <Users className="w-8 h-8 text-blue-600" />
                      <div>
                        <p className="text-2xl font-semibold text-gray-900">{employeeCount}</p>
                        <p className="text-sm text-gray-600">Total Employees</p>
                      </div>
                    </div>
                    <div className="text-right text-sm">
                      <p className="text-green-600 font-medium">{stats.active} Active</p>
                      <p className="text-orange-500 font-medium">{stats.onLeave} On Leave</p>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Annual Budget</span>
                      <span className="font-medium">{formatBDT(dept.budget)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Actual Annual Payroll</span>
                      <span className={`font-medium ${actualAnnualPayroll > dept.budget ? 'text-red-600' : 'text-green-600'}`}>
                        {formatBDT(actualAnnualPayroll)}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Avg Monthly Salary</span>
                      <span className="font-medium">{formatBDT(avgSalary)}</span>
                    </div>
                  </div>
                  <Button variant="outline" className="w-full" asChild>
                    <Link to={`/employees?department=${encodeURIComponent(dept.name)}`}>View Employees</Link>
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <Dialog
        open={isDialogOpen}
        onOpenChange={(open) => {
          setIsDialogOpen(open);
          if (!open) resetForm();
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingDepartment ? "Edit Department" : "Create New Department"}</DialogTitle>
            <DialogDescription>
              {editingDepartment
                ? "Update department details for HR operations."
                : "Add a new department to your organization."}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="deptName">Department Name</Label>
              <Input
                id="deptName"
                placeholder="e.g., Engineering"
                value={deptName}
                onChange={(e) => setDeptName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="deptHead">Department Head</Label>
              <Input
                id="deptHead"
                list="department-head-options"
                placeholder="Choose or type head name"
                value={deptHead}
                onChange={(e) => setDeptHead(e.target.value)}
              />
              <datalist id="department-head-options">
                {activeEmployees.map((emp) => (
                  <option key={emp.id} value={emp.name} />
                ))}
              </datalist>
            </div>
            <div className="space-y-2">
              <Label htmlFor="budget">Annual Budget</Label>
              <Input
                id="budget"
                type="number"
                placeholder="0"
                value={budget}
                onChange={(e) => setBudget(e.target.value)}
              />
            </div>
            <Button className="w-full" onClick={handleSaveDepartment} disabled={saving}>
              {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {editingDepartment ? "Update Department" : "Create Department"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
