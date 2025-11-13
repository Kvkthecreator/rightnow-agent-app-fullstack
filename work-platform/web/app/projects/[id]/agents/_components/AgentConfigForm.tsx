"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import { toast } from "sonner";
import { Loader2, Save, Settings, X, Plus, History } from "lucide-react";
import { cn } from "@/lib/utils";

interface AgentConfigFormProps {
  projectId: string;
  agentId: string;
  agentType: string;
}

interface ConfigHistory {
  id: string;
  config_snapshot: any;
  config_version: number;
  changed_by_user_id: string;
  changed_at: string;
  change_reason: string | null;
}

export default function AgentConfigForm({ projectId, agentId, agentType }: AgentConfigFormProps) {
  const [config, setConfig] = useState<any>({});
  const [configSchema, setConfigSchema] = useState<any>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [history, setHistory] = useState<ConfigHistory[]>([]);
  const [changeReason, setChangeReason] = useState("");
  const [isDirty, setIsDirty] = useState(false);

  // Fetch config
  const fetchConfig = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/projects/${projectId}/agents/${agentId}/config`);
      if (!response.ok) throw new Error("Failed to fetch config");
      const data = await response.json();
      setConfig(data.config || {});
      setConfigSchema(data.config_schema || {});
    } catch (err) {
      console.error("[Config] Fetch error:", err);
      toast.error("Failed to load configuration");
    } finally {
      setLoading(false);
    }
  };

  // Fetch history
  const fetchHistory = async () => {
    try {
      const response = await fetch(`/api/projects/${projectId}/agents/${agentId}/config/history?limit=10`);
      if (!response.ok) throw new Error("Failed to fetch history");
      const data = await response.json();
      setHistory(data.history || []);
    } catch (err) {
      console.error("[Config] History error:", err);
      toast.error("Failed to load config history");
    }
  };

  useEffect(() => {
    fetchConfig();
  }, [projectId, agentId]);

  // Save config
  const handleSave = async () => {
    if (!changeReason.trim()) {
      toast.error("Please provide a reason for this change");
      return;
    }

    try {
      setSaving(true);
      const response = await fetch(`/api/projects/${projectId}/agents/${agentId}/config`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          config,
          change_reason: changeReason,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ detail: "Save failed" }));
        throw new Error(errorData.detail || "Save failed");
      }

      toast.success("Configuration saved successfully");
      setIsDirty(false);
      setChangeReason("");
      await fetchConfig();
    } catch (err) {
      console.error("[Config] Save error:", err);
      toast.error(err instanceof Error ? err.message : "Failed to save configuration");
    } finally {
      setSaving(false);
    }
  };

  // Update nested config value
  const updateConfig = (path: string[], value: any) => {
    const newConfig = JSON.parse(JSON.stringify(config));
    let current = newConfig;
    for (let i = 0; i < path.length - 1; i++) {
      if (!current[path[i]]) current[path[i]] = {};
      current = current[path[i]];
    }
    current[path[path.length - 1]] = value;
    setConfig(newConfig);
    setIsDirty(true);
  };

  // Get nested config value
  const getConfigValue = (path: string[]) => {
    let current = config;
    for (const key of path) {
      if (!current || typeof current !== "object") return undefined;
      current = current[key];
    }
    return current;
  };

  // Render form field based on schema type
  const renderField = (key: string, schema: any, path: string[] = []) => {
    const fullPath = [...path, key];
    const value = getConfigValue(fullPath);
    const fieldSchema = schema.properties?.[key] || {};
    const fieldType = fieldSchema.type;

    if (fieldType === "object") {
      return (
        <div key={fullPath.join(".")} className="space-y-3 rounded-lg border border-border p-4">
          <h4 className="text-sm font-medium text-foreground capitalize">
            {key.replace(/_/g, " ")}
          </h4>
          {Object.keys(fieldSchema.properties || {}).map((subKey) =>
            renderField(subKey, fieldSchema, fullPath)
          )}
        </div>
      );
    }

    if (fieldType === "array") {
      const arrayValue = value || [];
      return (
        <div key={fullPath.join(".")} className="space-y-2">
          <label className="text-sm font-medium text-foreground capitalize">
            {key.replace(/_/g, " ")}
          </label>
          <div className="space-y-2">
            {arrayValue.map((item: string, index: number) => (
              <div key={index} className="flex gap-2">
                <Input
                  value={item}
                  onChange={(e) => {
                    const newArray = [...arrayValue];
                    newArray[index] = e.target.value;
                    updateConfig(fullPath, newArray);
                  }}
                  placeholder={`Item ${index + 1}`}
                />
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    const newArray = arrayValue.filter((_: any, i: number) => i !== index);
                    updateConfig(fullPath, newArray);
                  }}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}
            <Button
              variant="outline"
              size="sm"
              onClick={() => updateConfig(fullPath, [...arrayValue, ""])}
              className="w-full"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Item
            </Button>
          </div>
        </div>
      );
    }

    // String, number, boolean
    return (
      <div key={fullPath.join(".")} className="space-y-2">
        <label className="text-sm font-medium text-foreground capitalize">
          {key.replace(/_/g, " ")}
        </label>
        {fieldType === "boolean" ? (
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={value || false}
              onChange={(e) => updateConfig(fullPath, e.target.checked)}
              className="h-4 w-4"
            />
            <span className="text-sm text-muted-foreground">
              {fieldSchema.description || "Enable this option"}
            </span>
          </div>
        ) : fieldType === "number" ? (
          <Input
            type="number"
            value={value || ""}
            onChange={(e) => updateConfig(fullPath, parseFloat(e.target.value) || 0)}
            placeholder={fieldSchema.description || "Enter number"}
          />
        ) : (
          <Input
            value={value || ""}
            onChange={(e) => updateConfig(fullPath, e.target.value)}
            placeholder={fieldSchema.description || "Enter value"}
          />
        )}
      </div>
    );
  };

  if (loading) {
    return (
      <Card className="p-6">
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <Settings className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-semibold text-foreground">Configuration</h2>
            {isDirty && (
              <Badge variant="secondary" className="ml-2">
                Unsaved changes
              </Badge>
            )}
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setShowHistory(!showHistory);
              if (!showHistory && history.length === 0) fetchHistory();
            }}
          >
            <History className="h-4 w-4 mr-2" />
            History
          </Button>
        </div>

        {Object.keys(configSchema.properties || {}).length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No configuration schema available for this agent type.
          </p>
        ) : (
          <div className="space-y-4">
            {Object.keys(configSchema.properties || {}).map((key) =>
              renderField(key, configSchema, [])
            )}

            <div className="pt-4 border-t space-y-3">
              <div>
                <label className="text-sm font-medium text-foreground">
                  Reason for Change <span className="text-destructive">*</span>
                </label>
                <Input
                  value={changeReason}
                  onChange={(e) => setChangeReason(e.target.value)}
                  placeholder="e.g., Updated watchlist to include new competitor"
                  className="mt-2"
                />
              </div>

              <div className="flex gap-2">
                <Button
                  onClick={handleSave}
                  disabled={saving || !isDirty}
                  className="flex-1"
                >
                  {saving ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      Save Configuration
                    </>
                  )}
                </Button>
                {isDirty && (
                  <Button
                    variant="outline"
                    onClick={() => {
                      fetchConfig();
                      setIsDirty(false);
                      setChangeReason("");
                    }}
                  >
                    Cancel
                  </Button>
                )}
              </div>
            </div>
          </div>
        )}
      </Card>

      {showHistory && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-foreground mb-4">Configuration History</h3>
          {history.length === 0 ? (
            <p className="text-sm text-muted-foreground">No configuration changes yet.</p>
          ) : (
            <div className="space-y-3">
              {history.map((entry) => (
                <div key={entry.id} className="rounded-lg border border-border p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <Badge variant="secondary" className="text-xs">
                        Version {entry.config_version}
                      </Badge>
                      <p className="text-xs text-muted-foreground mt-1">
                        {new Date(entry.changed_at).toLocaleString()}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setConfig(entry.config_snapshot);
                        setIsDirty(true);
                        toast.info(`Loaded version ${entry.config_version}`);
                      }}
                    >
                      Restore
                    </Button>
                  </div>
                  {entry.change_reason && (
                    <p className="text-sm text-foreground">
                      <span className="font-medium">Reason:</span> {entry.change_reason}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </Card>
      )}
    </div>
  );
}
