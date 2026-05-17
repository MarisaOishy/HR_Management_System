import { useEffect, useRef, useState } from "react";
import { Loader2, Upload, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "../../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { Textarea } from "../../components/ui/textarea";
import { PhoneInput } from "../../components/PhoneInput";
import { useAuth } from "../../contexts/AuthContext";
import { supabase } from "../../../lib/supabase";
import { getEmployees, replaceAvatar, updateEmployee, validateAvatarFile } from "../../../lib/services/employeeService";
import { inferPhoneCountry, toInternationalPhone } from "../../../lib/phone";
import type { Employee } from "../../../lib/types/database";

export default function ProfileSettingsPage() {
  const { user, displayName, initials } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [bio, setBio] = useState("");

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const authEmail = user?.email ?? "";
        const employees = await getEmployees();
        const matched = employees.find((item) => item.email.toLowerCase() === authEmail.toLowerCase()) ?? employees[0] ?? null;
        setEmployee(matched);

        const name = (user?.user_metadata?.name as string | undefined) || matched?.name || displayName;
        const [first, ...rest] = name.split(" ");
        setFirstName(first || "");
        setLastName(rest.join(" "));
        setEmail(authEmail || matched?.email || "");
        setPhone(matched?.phone || "");
        setBio((user?.user_metadata?.bio as string | undefined) || "");
        setAvatarPreview((user?.user_metadata?.avatar_url as string | undefined) || matched?.avatar || null);
      } catch (error: any) {
        toast.error("Failed to load profile: " + error.message);
      } finally {
        setLoading(false);
      }
    })();
  }, [displayName, user]);

  const handleAvatarChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const validationError = validateAvatarFile(file);
    if (validationError) {
      toast.error(validationError);
      event.target.value = "";
      return;
    }
    setAvatarFile(file);
    const reader = new FileReader();
    reader.onload = () => setAvatarPreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  const clearSelectedAvatar = () => {
    setAvatarFile(null);
    setAvatarPreview((user?.user_metadata?.avatar_url as string | undefined) || employee?.avatar || null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!user) {
      toast.error("You must be signed in to update profile settings.");
      return;
    }

    setSaving(true);
    try {
      const fullName = `${firstName.trim()} ${lastName.trim()}`.trim();
      const normalizedPhone = toInternationalPhone(phone, inferPhoneCountry(phone));
      let avatarUrl = avatarPreview || "";

      if (avatarFile && employee) {
        avatarUrl = await replaceAvatar(avatarFile, employee.id, employee.avatar);
      }

      const { error: authError } = await supabase.auth.updateUser({
        email: email.trim(),
        data: {
          name: fullName,
          bio: bio.trim(),
          avatar_url: avatarUrl,
        },
      });
      if (authError) throw authError;

      if (employee) {
        await updateEmployee(employee.id, {
          name: fullName,
          email: email.trim(),
          phone: normalizedPhone,
          avatar: avatarUrl || employee.avatar,
        });
      }

      toast.success("Profile settings saved.");
      setAvatarFile(null);
    } catch (error: any) {
      toast.error("Failed to save profile: " + error.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        <span className="ml-3 text-gray-500">Loading profile settings...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-3xl font-semibold text-gray-900">Profile Settings</h1>
        <p className="text-gray-600 mt-1">Manage your personal information</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader><CardTitle>Profile Picture</CardTitle></CardHeader>
          <CardContent>
            <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp,image/gif" className="hidden" onChange={handleAvatarChange} />
            <div className="flex items-center gap-6">
              <div className="relative">
                {avatarPreview ? (
                  <img src={avatarPreview} alt="Profile preview" className="w-24 h-24 rounded-full object-cover border-2 border-blue-400" />
                ) : (
                  <div className="w-24 h-24 rounded-full bg-blue-600 flex items-center justify-center text-white font-semibold text-2xl">{initials}</div>
                )}
                {avatarFile && (
                  <button type="button" onClick={clearSelectedAvatar} className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-0.5 hover:bg-red-600" title="Remove selected photo">
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
              <div>
                <Button type="button" variant="outline" onClick={() => fileInputRef.current?.click()}>
                  <Upload className="w-4 h-4 mr-2" />
                  Upload Photo
                </Button>
                <p className="text-sm text-gray-500 mt-2">JPG, PNG, WebP, or GIF. Max size 5MB.</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Personal Information</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName">First Name</Label>
                <Input id="firstName" value={firstName} onChange={(event) => setFirstName(event.target.value)} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">Last Name</Label>
                <Input id="lastName" value={lastName} onChange={(event) => setLastName(event.target.value)} />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} required />
              </div>
              <PhoneInput id="phone" label="Phone" value={phone} onChange={setPhone} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="bio">Bio</Label>
              <Textarea id="bio" rows={4} placeholder="Tell us about yourself..." value={bio} onChange={(event) => setBio(event.target.value)} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Work Information</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <ReadOnlyField label="Department" value={employee?.department || "Not linked"} />
              <ReadOnlyField label="Position" value={employee?.role || "Not linked"} />
              <ReadOnlyField label="Employee ID" value={employee?.id || "Not linked"} />
              <ReadOnlyField label="Join Date" value={employee?.join_date || "Not linked"} />
            </div>
          </CardContent>
        </Card>

        <div className="flex gap-4">
          <Button type="submit" size="lg" disabled={saving}>
            {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            {saving ? "Saving..." : "Save Changes"}
          </Button>
          <Button type="button" variant="outline" size="lg" onClick={() => window.location.reload()}>
            Cancel
          </Button>
        </div>
      </form>
    </div>
  );
}

function ReadOnlyField({ label, value }: { label: string; value: string }) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <Input value={value} disabled />
    </div>
  );
}
