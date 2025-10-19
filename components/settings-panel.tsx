"use client";
import React, { useState, useEffect } from "react";
import { X, Settings, Save, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";

type Setting = { settingKey: string; settingValue: string };

interface SettingsPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function SettingsPanel({ isOpen, onClose }: SettingsPanelProps) {
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      loadSettings();
    }
  }, [isOpen]);

  const loadSettings = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/v1/settings");
      if (!response.ok) throw new Error("Failed to load settings");
      const list = await response.json();
      const map: Record<string, string> = {};
      list.forEach((s: Setting) => (map[s.settingKey] = s.settingValue));
      setSettings(map);
    } catch (e: any) {
      setError(e?.message || "Failed to load settings");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (key: string, value: string) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  const saveSettings = async () => {
    setSaving(true);
    setError(null);
    try {
      const response = await fetch("/api/v1/settings/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });
      if (!response.ok) throw new Error("Failed to save settings");
      alert("Settings saved successfully!");
    } catch (e: any) {
      setError(e?.message || "Failed to save settings");
    } finally {
      setSaving(false);
    }
  };

  const resetToDefaults = async () => {
    setSaving(true);
    setError(null);
    try {
      const response = await fetch("/api/v1/settings/seed-defaults", {
        method: "POST",
      });
      if (!response.ok) throw new Error("Failed to reset settings");
      await loadSettings();
      alert("Settings reset to defaults!");
    } catch (e: any) {
      setError(e?.message || "Failed to reset settings");
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <div className="flex items-center space-x-2">
            <Settings className="h-6 w-6 text-blue-600" />
            <CardTitle className="text-2xl font-bold">System Settings</CardTitle>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {loading && <div className="text-center py-4">Loading settings...</div>}
          {error && <div className="text-red-600 bg-red-50 p-3 rounded-md">{error}</div>}
          
          {!loading && (
            <>
              {/* General Settings */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-800 border-b pb-2">General Settings</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="system_name">System Name</Label>
                    <Input
                      id="system_name"
                      value={settings.system_name || ""}
                      onChange={(e) => handleChange("system_name", e.target.value)}
                      placeholder="Help-Desk System"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="logo_url">Logo URL</Label>
                    <Input
                      id="logo_url"
                      value={settings.logo_url || ""}
                      onChange={(e) => handleChange("logo_url", e.target.value)}
                      placeholder="https://..."
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Language</Label>
                    <div className="text-sm text-gray-600 border rounded p-2">
                      Language selection has moved to the header. Use the globe icon at the top to switch languages.
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="timezone">Timezone</Label>
                    <Input
                      id="timezone"
                      value={settings.timezone || "Africa/Addis_Ababa"}
                      onChange={(e) => handleChange("timezone", e.target.value)}
                    />
                  </div>
                </div>
              </div>

              {/* Module Settings */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-800 border-b pb-2">Module Settings</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="enable_tickets">Enable Tickets Module</Label>
                    <Switch
                      id="enable_tickets"
                      checked={settings.enable_tickets === "true"}
                      onCheckedChange={(checked) => handleChange("enable_tickets", checked.toString())}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <Label htmlFor="enable_knowledge_base">Enable Knowledge Base</Label>
                    <Switch
                      id="enable_knowledge_base"
                      checked={settings.enable_knowledge_base === "true"}
                      onCheckedChange={(checked) => handleChange("enable_knowledge_base", checked.toString())}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <Label htmlFor="enable_chat">Enable Chat Module</Label>
                    <Switch
                      id="enable_chat"
                      checked={settings.enable_chat === "true"}
                      onCheckedChange={(checked) => handleChange("enable_chat", checked.toString())}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <Label htmlFor="enable_analytics">Enable Analytics</Label>
                    <Switch
                      id="enable_analytics"
                      checked={settings.enable_analytics === "true"}
                      onCheckedChange={(checked) => handleChange("enable_analytics", checked.toString())}
                    />
                  </div>
                </div>
              </div>

              {/* Notification Settings */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-800 border-b pb-2">Notification Settings</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="email_notifications">Email Notifications</Label>
                    <Switch
                      id="email_notifications"
                      checked={settings.email_notifications === "true"}
                      onCheckedChange={(checked) => handleChange("email_notifications", checked.toString())}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <Label htmlFor="push_notifications">Push Notifications</Label>
                    <Switch
                      id="push_notifications"
                      checked={settings.push_notifications === "true"}
                      onCheckedChange={(checked) => handleChange("push_notifications", checked.toString())}
                    />
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-between pt-6 border-t">
                <Button
                  variant="outline"
                  onClick={resetToDefaults}
                  disabled={saving}
                  className="flex items-center space-x-2"
                >
                  <RefreshCw className="h-4 w-4" />
                  <span>Reset to Defaults</span>
                </Button>
                
                <div className="flex space-x-2">
                  <Button variant="outline" onClick={onClose}>
                    Cancel
                  </Button>
                  <Button
                    onClick={saveSettings}
                    disabled={saving}
                    className="flex items-center space-x-2"
                  >
                    <Save className="h-4 w-4" />
                    <span>{saving ? "Saving..." : "Save Settings"}</span>
                  </Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
