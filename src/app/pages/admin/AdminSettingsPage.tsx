import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Switch } from "../../components/ui/switch";
import { Label } from "../../components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../components/ui/tabs";
import { Settings2, ShieldAlert, Bell, Globe, Loader2, Save } from "lucide-react";
import { getSystemSettings, updateSystemSetting } from "../../../lib/services/adminService";
import type { SystemSetting } from "../../../lib/types/database";
import { toast } from "sonner";
import { useAuth } from "../../contexts/AuthContext";

export default function AdminSettingsPage() {
  const { user } = useAuth();
  const [settings, setSettings] = useState<SystemSetting[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState<Record<string, any>>({});

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setLoading(true);
      const data = await getSystemSettings();
      setSettings(data);
      
      const initialData: Record<string, any> = {};
      data.forEach(s => {
        initialData[s.id] = s.value;
      });
      setFormData(initialData);
    } catch (error: any) {
      toast.error("Failed to load settings: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (id: string, value: any) => {
    setFormData(prev => ({ ...prev, [id]: value }));
  };

  const handleSave = async (categorySettings: SystemSetting[]) => {
    try {
      setSaving(true);
      const email = user?.email || "system";
      
      for (const setting of categorySettings) {
        if (formData[setting.id] !== setting.value) {
          await updateSystemSetting(setting.id, formData[setting.id], email);
        }
      }
      toast.success("Settings saved successfully");
      await loadSettings();
    } catch (error: any) {
      toast.error("Failed to save settings: " + error.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-10 h-10 animate-spin text-purple-600" />
        <span className="ml-4 text-lg text-gray-500">Loading settings...</span>
      </div>
    );
  }

  const generalSettings = settings.filter(s => s.category === 'general');
  const securitySettings = settings.filter(s => s.category === 'security');
  const featureSettings = settings.filter(s => s.category === 'features');

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold text-gray-900">System Settings</h1>
        <p className="text-gray-600 mt-1">Global configuration for the HRMS platform.</p>
      </div>

      <Tabs defaultValue="general" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="general" className="flex items-center gap-2">
            <Settings2 className="w-4 h-4" /> General
          </TabsTrigger>
          <TabsTrigger value="security" className="flex items-center gap-2">
            <ShieldAlert className="w-4 h-4" /> Security
          </TabsTrigger>
          <TabsTrigger value="features" className="flex items-center gap-2">
            <Globe className="w-4 h-4" /> Features
          </TabsTrigger>
        </TabsList>

        <TabsContent value="general">
          <Card>
            <CardHeader>
              <CardTitle>General Configuration</CardTitle>
              <CardDescription>Basic system details and localization.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {generalSettings.map(setting => (
                <div key={setting.id} className="space-y-2">
                  <Label>{setting.description}</Label>
                  <Input 
                    value={formData[setting.id] || ''} 
                    onChange={(e) => handleChange(setting.id, e.target.value)}
                  />
                </div>
              ))}
              <Button onClick={() => handleSave(generalSettings)} disabled={saving} className="bg-purple-600 hover:bg-purple-700">
                {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                Save General Settings
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security">
          <Card>
            <CardHeader>
              <CardTitle>Security Rules</CardTitle>
              <CardDescription>Authentication and access policies.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {securitySettings.map(setting => (
                <div key={setting.id} className="flex items-center justify-between border-b border-gray-100 pb-4">
                  <div>
                    <Label className="text-base">{setting.description}</Label>
                    <p className="text-sm text-gray-500">Key: {setting.key}</p>
                  </div>
                  {setting.value === 'true' || setting.value === 'false' ? (
                    <Switch 
                      checked={formData[setting.id] === 'true'} 
                      onCheckedChange={(checked) => handleChange(setting.id, checked ? 'true' : 'false')}
                    />
                  ) : (
                    <Input 
                      className="w-32"
                      type="number"
                      value={formData[setting.id] || ''} 
                      onChange={(e) => handleChange(setting.id, e.target.value)}
                    />
                  )}
                </div>
              ))}
              <Button onClick={() => handleSave(securitySettings)} disabled={saving} className="bg-purple-600 hover:bg-purple-700">
                {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                Save Security Rules
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="features">
          <Card>
            <CardHeader>
              <CardTitle>Feature Toggles</CardTitle>
              <CardDescription>Enable or disable system modules.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {featureSettings.map(setting => (
                <div key={setting.id} className="flex items-center justify-between border-b border-gray-100 pb-4">
                  <div>
                    <Label className="text-base">{setting.description}</Label>
                    <p className="text-sm text-gray-500">Turn this feature on or off globally.</p>
                  </div>
                  <Switch 
                    checked={formData[setting.id] === 'true'} 
                    onCheckedChange={(checked) => handleChange(setting.id, checked ? 'true' : 'false')}
                  />
                </div>
              ))}
              <Button onClick={() => handleSave(featureSettings)} disabled={saving} className="bg-purple-600 hover:bg-purple-700">
                {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                Save Feature Toggles
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
