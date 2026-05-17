import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "../../components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../components/ui/card";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../components/ui/select";
import { Switch } from "../../components/ui/switch";
import { useAuth } from "../../contexts/AuthContext";
import { getDefaultSettings, getSettingsMap, saveSettingsMap, type SettingsMap } from "../../../lib/services/settingsService";

export default function CompanySettingsPage() {
  const { user } = useAuth();
  const [settings, setSettings] = useState<SettingsMap>(getDefaultSettings("company"));
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        setSettings(await getSettingsMap("company"));
      } catch (error: any) {
        toast.error("Failed to load company settings: " + error.message);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const updateSetting = (key: string, value: any) => {
    setSettings((current) => ({ ...current, [key]: value }));
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (settings.office_start_time >= settings.office_end_time) {
      toast.error("Office end time must be after start time.");
      return;
    }

    setSaving(true);
    try {
      await saveSettingsMap("company", settings, user?.email ?? "system");
      toast.success("Company settings saved.");
    } catch (error: any) {
      toast.error("Failed to save company settings: " + error.message);
    } finally {
      setSaving(false);
    }
  };

  const resetDefaults = () => {
    setSettings(getDefaultSettings("company"));
    toast.info("Defaults restored. Save settings to apply them.");
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        <span className="ml-3 text-gray-500">Loading company settings...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-3xl font-semibold text-gray-900">Company Settings</h1>
        <p className="text-gray-600 mt-1">Manage your organization settings</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Company Information</CardTitle>
            <CardDescription>Basic information about your company</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <TextField id="companyName" label="Company Name" value={settings.company_name} onChange={(value) => updateSetting("company_name", value)} required />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <TextField id="companyEmail" label="Company Email" type="email" value={settings.company_email} onChange={(value) => updateSetting("company_email", value)} required />
              <TextField id="companyPhone" label="Company Phone" type="tel" value={settings.company_phone} onChange={(value) => updateSetting("company_phone", value)} required />
            </div>
            <TextField id="address" label="Address" value={settings.company_address} onChange={(value) => updateSetting("company_address", value)} required />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <TextField id="website" label="Website" type="url" value={settings.company_website} onChange={(value) => updateSetting("company_website", value)} />
              <div className="space-y-2">
                <Label>Industry</Label>
                <Select value={settings.industry} onValueChange={(value) => updateSetting("industry", value)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="technology">Technology</SelectItem>
                    <SelectItem value="healthcare">Healthcare</SelectItem>
                    <SelectItem value="finance">Finance</SelectItem>
                    <SelectItem value="retail">Retail</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Working Hours</CardTitle>
            <CardDescription>Set default working hours for employees</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <TextField id="startTime" label="Start Time" type="time" value={settings.office_start_time} onChange={(value) => updateSetting("office_start_time", value)} />
              <TextField id="endTime" label="End Time" type="time" value={settings.office_end_time} onChange={(value) => updateSetting("office_end_time", value)} />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Working Days</Label>
                <Select value={String(settings.working_days)} onValueChange={(value) => updateSetting("working_days", value)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="5">Monday - Friday</SelectItem>
                    <SelectItem value="6">Monday - Saturday</SelectItem>
                    <SelectItem value="7">All Days</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Timezone</Label>
                <Select value={settings.timezone} onValueChange={(value) => updateSetting("timezone", value)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Asia/Dhaka">Bangladesh Standard Time (BST, UTC+6)</SelectItem>
                    <SelectItem value="Asia/Kolkata">India Standard Time (UTC+5:30)</SelectItem>
                    <SelectItem value="America/New_York">US Eastern Time</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Leave Policies</CardTitle>
            <CardDescription>Configure leave allowances</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <TextField id="annualLeave" label="Annual Leave (days)" type="number" value={settings.annual_leave_days} onChange={(value) => updateSetting("annual_leave_days", Number(value))} min="0" />
            <TextField id="sickLeave" label="Sick Leave (days)" type="number" value={settings.sick_leave_days} onChange={(value) => updateSetting("sick_leave_days", Number(value))} min="0" />
            <TextField id="casualLeave" label="Casual Leave (days)" type="number" value={settings.casual_leave_days} onChange={(value) => updateSetting("casual_leave_days", Number(value))} min="0" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Notifications</CardTitle>
            <CardDescription>Manage notification preferences</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <ToggleRow label="Email Notifications" description="Receive email updates for important events" checked={Boolean(settings.email_notifications)} onChange={(value) => updateSetting("email_notifications", value)} />
            <ToggleRow label="Leave Notifications" description="Get notified about leave requests" checked={Boolean(settings.leave_notifications)} onChange={(value) => updateSetting("leave_notifications", value)} />
            <ToggleRow label="Attendance Alerts" description="Receive alerts for attendance issues" checked={Boolean(settings.attendance_notifications)} onChange={(value) => updateSetting("attendance_notifications", value)} />
          </CardContent>
        </Card>

        <div className="flex gap-4">
          <Button type="submit" size="lg" disabled={saving}>
            {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            {saving ? "Saving..." : "Save Settings"}
          </Button>
          <Button type="button" variant="outline" size="lg" onClick={resetDefaults}>
            Reset to Defaults
          </Button>
        </div>
      </form>
    </div>
  );
}

function TextField({ id, label, value, onChange, type = "text", required, min }: { id: string; label: string; value: any; onChange: (value: string) => void; type?: string; required?: boolean; min?: string }) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <Input id={id} type={type} value={value ?? ""} min={min} onChange={(event) => onChange(event.target.value)} required={required} />
    </div>
  );
}

function ToggleRow({ label, description, checked, onChange }: { label: string; description: string; checked: boolean; onChange: (value: boolean) => void }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <div className="space-y-0.5">
        <Label>{label}</Label>
        <p className="text-sm text-gray-500">{description}</p>
      </div>
      <Switch checked={checked} onCheckedChange={onChange} />
    </div>
  );
}
