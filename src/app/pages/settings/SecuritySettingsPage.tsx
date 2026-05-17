import { useEffect, useState } from "react";
import { Key, Loader2, Shield, Smartphone } from "lucide-react";
import { toast } from "sonner";
import { Button } from "../../components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../components/ui/card";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { Switch } from "../../components/ui/switch";
import { useAuth } from "../../contexts/AuthContext";
import { supabase } from "../../../lib/supabase";
import { getDefaultSettings, getRecentSecurityLogs, getSettingsMap, saveSettingsMap, type SettingsMap } from "../../../lib/services/settingsService";
import { getEmployees, updateEmployee } from "../../../lib/services/employeeService";
import type { SystemSetting } from "../../../lib/types/database";

export default function SecuritySettingsPage() {
  const { user } = useAuth();
  const [settings, setSettings] = useState<SettingsMap>(getDefaultSettings("security"));
  const [logs, setLogs] = useState<SystemSetting[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingPassword, setSavingPassword] = useState(false);
  const [savingPrefs, setSavingPrefs] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const [securitySettings, recentLogs] = await Promise.all([
          getSettingsMap("security"),
          getRecentSecurityLogs(user?.email),
        ]);
        setSettings(securitySettings);
        setLogs(recentLogs);
      } catch (error: any) {
        toast.error("Failed to load security settings: " + error.message);
      } finally {
        setLoading(false);
      }
    })();
  }, [user?.email]);

  const updateSetting = async (key: string, value: boolean) => {
    const next = { ...settings, [key]: value };
    setSettings(next);
    setSavingPrefs(true);
    try {
      await saveSettingsMap("security", next, user?.email ?? "system");
      toast.success("Security preference saved.");
      setLogs(await getRecentSecurityLogs(user?.email));
    } catch (error: any) {
      toast.error("Failed to save preference: " + error.message);
    } finally {
      setSavingPrefs(false);
    }
  };

  const handlePasswordUpdate = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!user?.email) {
      toast.error("You must be signed in to update your password.");
      return;
    }
    if (newPassword.length < 8) {
      toast.error("New password must be at least 8 characters.");
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error("New password and confirmation do not match.");
      return;
    }

    setSavingPassword(true);
    try {
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: user.email,
        password: currentPassword,
      });
      if (signInError) throw new Error("Current password is incorrect.");

      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;

      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      toast.success("Password updated successfully.");
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setSavingPassword(false);
    }
  };

  const deactivateAccount = async () => {
    if (!user?.email) return;
    if (!window.confirm("Deactivate your linked employee account? You can ask an admin to reactivate it later.")) return;
    try {
      const employees = await getEmployees();
      const employee = employees.find((item) => item.email.toLowerCase() === user.email?.toLowerCase());
      if (!employee) throw new Error("No linked employee profile was found.");
      await updateEmployee(employee.id, { status: "Inactive" });
      toast.success("Account marked as inactive.");
    } catch (error: any) {
      toast.error("Failed to deactivate account: " + error.message);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        <span className="ml-3 text-gray-500">Loading security settings...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-3xl font-semibold text-gray-900">Security Settings</h1>
        <p className="text-gray-600 mt-1">Manage your account security and privacy</p>
      </div>

      <form onSubmit={handlePasswordUpdate} className="space-y-6">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-50 rounded-lg"><Key className="w-5 h-5 text-blue-600" /></div>
              <div>
                <CardTitle>Change Password</CardTitle>
                <CardDescription>Update your password regularly for security</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <PasswordField id="currentPassword" label="Current Password" value={currentPassword} onChange={setCurrentPassword} />
            <PasswordField id="newPassword" label="New Password" value={newPassword} onChange={setNewPassword} />
            <PasswordField id="confirmPassword" label="Confirm New Password" value={confirmPassword} onChange={setConfirmPassword} />
            <Button type="submit" disabled={savingPassword}>
              {savingPassword && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Update Password
            </Button>
          </CardContent>
        </Card>
      </form>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-50 rounded-lg"><Smartphone className="w-5 h-5 text-green-600" /></div>
            <div>
              <CardTitle>Two-Factor Authentication</CardTitle>
              <CardDescription>Store preferred 2FA methods for your account</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <ToggleRow label="SMS Authentication" description="Receive verification codes via SMS" checked={Boolean(settings.sms_2fa)} disabled={savingPrefs} onChange={(value) => updateSetting("sms_2fa", value)} />
          <ToggleRow label="Authenticator App" description="Use an authenticator app for codes" checked={Boolean(settings.authenticator_2fa)} disabled={savingPrefs} onChange={(value) => updateSetting("authenticator_2fa", value)} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-50 rounded-lg"><Shield className="w-5 h-5 text-purple-600" /></div>
            <div>
              <CardTitle>Security Activity</CardTitle>
              <CardDescription>Recent saved security preference changes</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div>
                <p className="font-medium text-gray-900">Current Session</p>
                <p className="text-sm text-gray-600">{user?.email || "Signed-in user"} - Browser session</p>
                <p className="text-xs text-gray-400 mt-1">Active now</p>
              </div>
              <div className="w-2 h-2 rounded-full bg-green-500" />
            </div>
            {logs.map((log) => (
              <div key={log.id} className="flex items-center justify-between p-3 border rounded-lg">
                <div>
                  <p className="font-medium text-gray-900">{log.description || log.key}</p>
                  <p className="text-sm text-gray-600">Updated by {log.updated_by || "system"}</p>
                  <p className="text-xs text-gray-400 mt-1">{log.updated_at ? new Date(log.updated_at).toLocaleString() : "Recently"}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Privacy Settings</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <ToggleRow label="Profile Visibility" description="Make your profile visible to all employees" checked={Boolean(settings.profile_visibility)} disabled={savingPrefs} onChange={(value) => updateSetting("profile_visibility", value)} />
          <ToggleRow label="Activity Status" description="Show when you're active" checked={Boolean(settings.activity_status)} disabled={savingPrefs} onChange={(value) => updateSetting("activity_status", value)} />
          <ToggleRow label="Email Visibility" description="Allow others to see your email" checked={Boolean(settings.email_visibility)} disabled={savingPrefs} onChange={(value) => updateSetting("email_visibility", value)} />
        </CardContent>
      </Card>

      <Card className="border-red-200">
        <CardHeader>
          <CardTitle className="text-red-600">Danger Zone</CardTitle>
          <CardDescription>Account actions</CardDescription>
        </CardHeader>
        <CardContent className="flex items-center justify-between gap-4">
          <div>
            <p className="font-medium text-gray-900">Deactivate Account</p>
            <p className="text-sm text-gray-500">Temporarily mark your linked employee profile inactive</p>
          </div>
          <Button type="button" variant="outline" className="text-red-600 border-red-200 hover:bg-red-50" onClick={deactivateAccount}>
            Deactivate
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

function PasswordField({ id, label, value, onChange }: { id: string; label: string; value: string; onChange: (value: string) => void }) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <Input id={id} type="password" value={value} onChange={(event) => onChange(event.target.value)} required />
    </div>
  );
}

function ToggleRow({ label, description, checked, disabled, onChange }: { label: string; description: string; checked: boolean; disabled?: boolean; onChange: (value: boolean) => void }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <div>
        <p className="font-medium text-gray-900">{label}</p>
        <p className="text-sm text-gray-500">{description}</p>
      </div>
      <Switch checked={checked} disabled={disabled} onCheckedChange={onChange} />
    </div>
  );
}
