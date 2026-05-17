import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { Checkbox } from "../../components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "../../components/ui/dialog";
import { Plus, Edit, Trash2, Shield, Users, Loader2 } from "lucide-react";
import { toast } from "sonner";

import {
  getRoles,
  createRole,
  updateRole,
  deleteRole,
} from "../../../lib/services/roleService";
import { getEmployees } from "../../../lib/services/employeeService";
import type { Role, Employee } from "../../../lib/types/database";

const allPermissions = [
  { id: "all", label: "All Permissions (Admin)", description: "Full access to all system features" },
  { id: "employees", label: "Manage Employees", description: "View, add, edit, and delete employees" },
  { id: "attendance", label: "Manage Attendance", description: "Track and manage employee attendance" },
  { id: "leaves", label: "Manage Leaves", description: "Approve and manage leave requests" },
  { id: "payroll", label: "Manage Payroll", description: "Process salaries and manage payroll" },
  { id: "reports", label: "View Reports", description: "Access and generate reports" },
  { id: "settings", label: "System Settings", description: "Configure system settings" },
  { id: "team_view", label: "Team View", description: "View team details and performance" },
  { id: "self_view", label: "Self View", description: "View own profile and details" },
  { id: "request_leave", label: "Request Leave", description: "Submit leave applications" },
];

export default function RolesPage() {
  const [roles, setRoles] = useState<Role[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<Role | null>(null);

  const [roleName, setRoleName] = useState("");
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [rolesData, employeesData] = await Promise.all([
        getRoles(),
        getEmployees(),
      ]);
      setRoles(rolesData);
      setEmployees(employeesData);
    } catch (error: any) {
      toast.error("Failed to load data: " + error.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const userCountByRole = useMemo(() => {
    const map = new Map<string, number>();
    employees.forEach((emp) => {
      map.set(emp.role, (map.get(emp.role) ?? 0) + 1);
    });
    return map;
  }, [employees]);

  const resetForm = () => {
    setEditingRole(null);
    setRoleName("");
    setSelectedPermissions([]);
  };

  const openCreateDialog = () => {
    resetForm();
    setIsDialogOpen(true);
  };

  const openEditDialog = (role: Role) => {
    setEditingRole(role);
    setRoleName(role.name);
    // Handle permissions properly if it's stored as a JSON string or array
    const perms = Array.isArray(role.permissions) ? role.permissions : [];
    setSelectedPermissions(perms);
    setIsDialogOpen(true);
  };

  const handlePermissionToggle = (permissionId: string) => {
    setSelectedPermissions((prev) =>
      prev.includes(permissionId)
        ? prev.filter((id) => id !== permissionId)
        : [...prev, permissionId]
    );
  };

  const handleSaveRole = async () => {
    const trimmedName = roleName.trim();
    if (!trimmedName) {
      toast.error("Role name is required.");
      return;
    }
    if (selectedPermissions.length === 0) {
      toast.error("Please select at least one permission.");
      return;
    }

    setSaving(true);
    try {
      const usersCount = userCountByRole.get(trimmedName) ?? editingRole?.users_count ?? 0;

      if (editingRole) {
        await updateRole(editingRole.id, {
          name: trimmedName,
          permissions: selectedPermissions,
          users_count: usersCount,
        });
        toast.success("Role updated successfully.");
      } else {
        await createRole({
          name: trimmedName,
          permissions: selectedPermissions,
          users_count: usersCount,
        });
        toast.success("Role created successfully.");
      }
      setIsDialogOpen(false);
      resetForm();
      await fetchData();
    } catch (error: any) {
      toast.error("Failed to save role: " + error.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteRole = async (role: Role) => {
    if (!confirm(`Delete "${role.name}" role? This action cannot be undone.`)) return;
    setDeletingId(role.id);
    try {
      await deleteRole(role.id);
      toast.success("Role deleted successfully.");
      await fetchData();
    } catch (error: any) {
      toast.error("Failed to delete role: " + error.message);
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold text-gray-900">Roles & Permissions</h1>
          <p className="text-gray-600 mt-1">Manage user roles and access control</p>
        </div>
        <Button onClick={openCreateDialog}>
          <Plus className="w-4 h-4 mr-2" />
          Add Role
        </Button>
      </div>

      {/* Roles Grid */}
      {loading ? (
        <Card>
          <CardContent className="py-16 flex items-center justify-center text-gray-500">
            <Loader2 className="w-5 h-5 mr-2 animate-spin" />
            Loading roles...
          </CardContent>
        </Card>
      ) : roles.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center">
            <p className="text-gray-500">No roles found.</p>
            <Button className="mt-4" onClick={openCreateDialog}>
              <Plus className="w-4 h-4 mr-2" />
              Create First Role
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {roles.map((role) => {
            const usersCount = userCountByRole.get(role.name) ?? role.users_count ?? 0;
            const perms = Array.isArray(role.permissions) ? role.permissions : [];

            return (
              <Card key={role.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-3 bg-blue-50 rounded-lg">
                        <Shield className="w-6 h-6 text-blue-600" />
                      </div>
                      <div>
                        <CardTitle>{role.name}</CardTitle>
                        <p className="text-sm text-gray-600 mt-1">{usersCount} users assigned</p>
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="sm" onClick={() => openEditDialog(role)}>
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-red-600 hover:text-red-700"
                        onClick={() => handleDeleteRole(role)}
                        disabled={deletingId === role.id}
                      >
                        {deletingId === role.id ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Trash2 className="w-4 h-4" />
                        )}
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <p className="text-sm font-medium text-gray-700 mb-2">Permissions:</p>
                    <div className="space-y-1">
                      {perms.map((perm, index) => (
                        <div key={index} className="flex items-center gap-2 text-sm text-gray-600">
                          <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                          {perm === "all"
                            ? "All Permissions"
                            : perm.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())}
                        </div>
                      ))}
                    </div>
                  </div>
                  <Button variant="outline" className="w-full" asChild>
                    <Link to={`/employees?role=${encodeURIComponent(role.name)}`}>
                      <Users className="w-4 h-4 mr-2" />
                      View Users
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Role Dialog */}
      <Dialog
        open={isDialogOpen}
        onOpenChange={(open) => {
          setIsDialogOpen(open);
          if (!open) resetForm();
        }}
      >
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingRole ? "Edit Role" : "Create New Role"}</DialogTitle>
            <DialogDescription>
              {editingRole
                ? "Update role permissions and details."
                : "Define a new role with specific permissions."}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="roleName">Role Name</Label>
              <Input
                id="roleName"
                placeholder="e.g., Manager"
                value={roleName}
                onChange={(e) => setRoleName(e.target.value)}
              />
            </div>
            <div className="space-y-3">
              <Label>Permissions</Label>
              {allPermissions.map((permission) => (
                <div key={permission.id} className="flex items-start space-x-3 p-3 border rounded-lg">
                  <Checkbox
                    id={permission.id}
                    checked={selectedPermissions.includes(permission.id)}
                    onCheckedChange={() => handlePermissionToggle(permission.id)}
                  />
                  <div className="flex-1">
                    <Label htmlFor={permission.id} className="cursor-pointer font-medium">
                      {permission.label}
                    </Label>
                    <p className="text-sm text-gray-500">{permission.description}</p>
                  </div>
                </div>
              ))}
            </div>
            <Button className="w-full" onClick={handleSaveRole} disabled={saving}>
              {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {editingRole ? "Update Role" : "Create Role"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

