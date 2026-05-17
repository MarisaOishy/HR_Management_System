import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Badge } from "../../components/ui/badge";
import { Shield, Plus, MoreVertical, Edit2, Trash2, Loader2, Users } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "../../components/ui/dropdown-menu";
import { getAdminRoles, deleteAdminRole } from "../../../lib/services/adminService";
import type { Role } from "../../../lib/types/database";
import { toast } from "sonner";

export default function AdminRolesPage() {
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadRoles();
  }, []);

  const loadRoles = async () => {
    try {
      setLoading(true);
      const data = await getAdminRoles();
      setRoles(data);
    } catch (error: any) {
      toast.error("Failed to load roles: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this role?")) return;
    try {
      await deleteAdminRole(id);
      toast.success("Role deleted successfully");
      loadRoles();
    } catch (error: any) {
      toast.error("Failed to delete role: " + error.message);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-10 h-10 animate-spin text-purple-600" />
        <span className="ml-4 text-lg text-gray-500">Loading roles...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold text-gray-900">Roles & Permissions</h1>
          <p className="text-gray-600 mt-1">Manage system roles and their access levels.</p>
        </div>
        <Button className="bg-purple-600 hover:bg-purple-700">
          <Plus className="w-4 h-4 mr-2" />
          Create Role
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {roles.map((role) => (
          <Card key={role.id} className="relative overflow-hidden group">
            <div className="absolute top-0 left-0 w-1 h-full bg-purple-600"></div>
            <CardHeader className="pb-4">
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2 text-xl">
                    <Shield className="w-5 h-5 text-purple-600" />
                    {role.name}
                  </CardTitle>
                  <CardDescription className="mt-2 flex items-center gap-1">
                    <Users className="w-4 h-4" />
                    {role.users_count} users assigned
                  </CardDescription>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem className="cursor-pointer">
                      <Edit2 className="w-4 h-4 mr-2" /> Edit Role
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      className="cursor-pointer text-red-600 focus:text-red-600"
                      onClick={() => handleDelete(role.id)}
                    >
                      <Trash2 className="w-4 h-4 mr-2" /> Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <p className="text-sm font-medium text-gray-700">Permissions:</p>
                <div className="flex flex-wrap gap-2">
                  {role.permissions.slice(0, 5).map((perm, idx) => (
                    <Badge key={idx} variant="secondary" className="bg-gray-100 text-gray-700 font-normal">
                      {perm}
                    </Badge>
                  ))}
                  {role.permissions.length > 5 && (
                    <Badge variant="secondary" className="bg-gray-100 text-gray-700 font-normal">
                      +{role.permissions.length - 5} more
                    </Badge>
                  )}
                  {role.permissions.length === 0 && (
                    <span className="text-sm text-gray-500">No permissions assigned</span>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
