"use client";

import { useState, useEffect } from 'react';
import { notificationService } from '@/lib/notifications/service';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Label } from '@/components/ui/Label';
import { Badge } from '@/components/ui/Badge';
import { Settings, Shield, AlertTriangle, CheckCircle2, Circle, ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface GovernanceSettings {
  governance_enabled: boolean;
  validator_required: boolean;
  // Removed from UI: direct_substrate_writes is canon-enforced server-side (always false)
  governance_ui_enabled: boolean;
  // Phase 2: retention controls
  retention_enabled: boolean;
  retention_policy_text: string; // JSON text for flexible policy; parsed on save
  // Simplified top-level mode: 'proposal' | 'hybrid'
  mode: 'proposal' | 'hybrid';
  entry_point_policies: {
    onboarding_dump: string;
    manual_edit: string;
    graph_action: string;
    timeline_restore: string;
  };
  default_blast_radius: string;
}

interface GovernanceSettingsClientProps {
  workspaceId: string;
  workspaceName: string;
  initialSettings: any;
  userRole: string;
}

export default function GovernanceSettingsClient({ 
  workspaceId, 
  workspaceName, 
  initialSettings,
  userRole 
}: GovernanceSettingsClientProps) {
  const router = useRouter();
  const [settings, setSettings] = useState<GovernanceSettings>(() => {
    if (initialSettings) {
      return {
        governance_enabled: true,
        validator_required: false,
        governance_ui_enabled: true,
        retention_enabled: Boolean(initialSettings.retention_enabled),
        retention_policy_text: JSON.stringify(initialSettings.retention_policy || {}, null, 2),
        mode: (initialSettings.ep_manual_edit === 'hybrid' || initialSettings.ep_graph_action === 'hybrid') ? 'hybrid' : 'proposal',
        entry_point_policies: {
          onboarding_dump: 'direct', // Canon: P0 capture must be direct
          manual_edit: initialSettings.ep_manual_edit,
          graph_action: initialSettings.ep_graph_action,
          timeline_restore: initialSettings.ep_timeline_restore
        },
        default_blast_radius: initialSettings.default_blast_radius === 'Global' ? 'Scoped' : initialSettings.default_blast_radius
      };
    }
    
    // Canon-compliant defaults
    return {
      governance_enabled: true,
      validator_required: false,
      governance_ui_enabled: true,
      retention_enabled: false,
      retention_policy_text: '{\n  "dump": { "days": null },\n  "block": { "days": null },\n  "context_item": { "days": null }\n}',
      mode: 'proposal',
      entry_point_policies: {
        onboarding_dump: 'direct',
        manual_edit: 'proposal',
        graph_action: 'proposal',
        timeline_restore: 'proposal'
      },
      default_blast_radius: 'Scoped'
    };
  });

  const [loading, setLoading] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [vacuumSummary, setVacuumSummary] = useState<{ window: string; total_deleted: number; by_type: Record<string, number>; last_event_at: string | null } | null>(null);

  useEffect(() => {
    setHasChanges(true);
  }, [settings]);

  useEffect(() => {
    const fetchSummary = async () => {
      try {
        const res = await fetch('/api/vacuum/summary', { cache: 'no-store' });
        if (res.ok) setVacuumSummary(await res.json());
      } catch {}
    };
    fetchSummary();
  }, []);

  const getInitialSettings = () => {
    if (initialSettings) {
      return {
        governance_enabled: initialSettings.governance_enabled,
        validator_required: initialSettings.validator_required,
        governance_ui_enabled: initialSettings.governance_ui_enabled,
        entry_point_policies: {
          onboarding_dump: 'direct',
          manual_edit: initialSettings.ep_manual_edit,
          graph_action: initialSettings.ep_graph_action,
          timeline_restore: initialSettings.ep_timeline_restore
        },
        default_blast_radius: initialSettings.default_blast_radius === 'Global' ? 'Scoped' : initialSettings.default_blast_radius
      };
    }
    return null;
  };

  const handleSave = async () => {
    setLoading(true);
    
    try {
      // Validate retention policy JSON
      let retentionPolicy: any = {};
      try {
        retentionPolicy = settings.retention_policy_text ? JSON.parse(settings.retention_policy_text) : {};
      } catch (e) {
        throw new Error('Retention policy JSON is invalid');
      }

      // Derive entry point policies from simplified mode
      const derivedPolicies = {
        onboarding_dump: 'direct',
        manual_edit: settings.mode,
        graph_action: settings.mode,
        timeline_restore: 'proposal'
      };

      const response = await fetch('/api/governance/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          governance_enabled: true,
          validator_required: false,
          governance_ui_enabled: true,
          retention_enabled: settings.retention_enabled,
          retention_policy: retentionPolicy,
          entry_point_policies: derivedPolicies,
          default_blast_radius: settings.default_blast_radius
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update settings');
      }

      notificationService.notify({
        type: 'governance.settings.changed',
        title: 'Settings Updated',
        message: 'Governance settings have been updated successfully',
        severity: 'success'
      });
      setHasChanges(false);
      
      // Refresh the page to get updated settings
      window.location.reload();
      
    } catch (error) {
      console.error('Settings update failed:', error);
      notificationService.notify({
        type: 'governance.settings.changed',
        title: 'Settings Update Failed',
        message: error instanceof Error ? error.message : 'Failed to update settings',
        severity: 'error',
        channels: ['toast', 'persistent']
      });
    } finally {
      setLoading(false);
    }
  };

  const getGovernanceStatus = () => {
    if (!settings.governance_enabled) {
      return { status: 'disabled', color: 'bg-red-100 text-red-800', icon: Circle };
    }
    // Canon: full mode when governance is enabled and validator is required (P0 always direct, direct_substrate_writes is enforced server-side)
    if (settings.governance_enabled && settings.validator_required) {
      return { status: 'full', color: 'bg-green-100 text-green-800', icon: CheckCircle2 };
    }
    if (settings.governance_enabled && settings.governance_ui_enabled) {
      return { status: 'partial', color: 'bg-yellow-100 text-yellow-800', icon: AlertTriangle };
    }
    return { status: 'testing', color: 'bg-blue-100 text-blue-800', icon: Circle };
  };

  const governanceStatus = getGovernanceStatus();
  const StatusIcon = governanceStatus.icon;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto py-8 space-y-8 max-w-4xl px-6">
        
        {/* Header */}
        <div className="bg-white rounded-lg border border-gray-200 p-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <Settings className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Review Settings</h1>
                <p className="text-gray-600 mt-1">Configure when content needs approval • {workspaceName}</p>
              </div>
            </div>
            
            {/* Status badge removed to reduce cognitive load */}
          </div>
        </div>

        {/* (Removed) Content Review Controls — consolidated into Review Mode */}

        {/* Simplified Mode Controls */}
        <Card>
          <CardHeader className="p-6">
            <CardTitle>Review Mode</CardTitle>
            <p className="text-sm text-gray-600 mt-2">
              Choose how changes get reviewed
            </p>
          </CardHeader>
          <CardContent className="p-8 space-y-4">
            <div className="flex gap-6">
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="radio"
                  name="mode"
                  checked={settings.mode === 'proposal'}
                  onChange={() => setSettings(prev => ({ ...prev, mode: 'proposal' }))}
                  className="h-4 w-4"
                />
                <span>Review everything</span>
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="radio"
                  name="mode"
                  checked={settings.mode === 'hybrid'}
                  onChange={() => setSettings(prev => ({ ...prev, mode: 'hybrid' }))}
                  disabled={!settings.governance_enabled}
                  className="h-4 w-4"
                />
                <span>Smart review (auto‑approve safe changes)</span>
              </label>
            </div>

            <div className="text-xs text-gray-600">
              In Smart review, simple changes are approved automatically. You can switch to Review everything anytime. Timeline restores always ask for review.
            </div>

            {/* Default Change Scope moved under Advanced */}

            {/* Advanced Policies (optional) */}
            <details className="mt-4">
              <summary className="text-sm cursor-pointer">Advanced policies (optional)</summary>
              <div className="mt-3 p-3 bg-gray-50 rounded border text-xs text-gray-600">
                Entry‑point policies are managed automatically by Review Mode. Manual overrides are disabled to reduce complexity.
              </div>
              <div className="space-y-2 pt-3">
                <Label className="font-medium">Default Change Scope</Label>
                <select
                  value={settings.default_blast_radius === 'Global' ? 'Scoped' : settings.default_blast_radius}
                  onChange={(e) => setSettings(prev => ({ 
                    ...prev, 
                    default_blast_radius: e.target.value 
                  }))}
                  className="w-full md:w-64 border border-gray-300 rounded-lg px-3 py-2 text-sm"
                >
                  <option value="Local">Local (this basket)</option>
                  <option value="Scoped">Scoped (your workspace)</option>
                </select>
              </div>
            </details>
          </CardContent>
        </Card>

        {/* Retention Policy */}
        <Card>
          <CardHeader className="p-6">
            <CardTitle>Retention Policy</CardTitle>
            <p className="text-sm text-gray-600 mt-2">
              Control if and when archived/redacted items become eligible for physical deletion. Leave days as null to never delete that type.
            </p>
          </CardHeader>
          <CardContent className="p-8 space-y-4">
            {vacuumSummary && (
              <div className="rounded-lg border bg-gray-50 p-3 text-xs text-gray-700">
                <div className="flex items-center justify-between">
                  <div>
                    <strong>Last 24h physical deletes:</strong> {vacuumSummary.total_deleted}
                    {vacuumSummary.last_event_at && (
                      <span className="ml-2 text-gray-500">(latest {new Date(vacuumSummary.last_event_at).toLocaleString()})</span>
                    )}
                  </div>
                  <Button variant="ghost" size="sm" onClick={async () => {
                    try {
                      const res = await fetch('/api/vacuum/summary', { cache: 'no-store' });
                      if (res.ok) setVacuumSummary(await res.json());
                    } catch {}
                  }}>Refresh</Button>
                </div>
              </div>
            )}
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={settings.retention_enabled}
                onChange={(e) => setSettings(prev => ({ ...prev, retention_enabled: e.target.checked }))}
                className="h-4 w-4"
              />
              <span>Enable retention policy</span>
            </label>
            <div>
              <Label className="font-medium text-sm">Policy JSON</Label>
              <textarea
                value={settings.retention_policy_text}
                onChange={(e) => setSettings(prev => ({ ...prev, retention_policy_text: e.target.value }))}
                className="w-full mt-2 h-40 border border-gray-300 rounded p-2 font-mono text-xs"
                spellCheck={false}
              />
              <div className="text-xs text-gray-500 mt-2">
                Example: {'{ "dump": { "days": 180 }, "block": { "days": 365 }, "context_item": { "days": null } }'}
              </div>
            </div>
            <div className="flex gap-2">
              <Button 
                variant="outline"
                onClick={async () => {
                  try {
                    const res = await fetch('/api/vacuum/run', { method: 'POST' });
                    const json = await res.json();
                    if (res.ok) {
                      notificationService.notify({ type: 'system.performance.alert', title: 'Vacuum Run', message: JSON.stringify(json.result || json), severity: 'info' });
                    } else {
                      notificationService.notify({ type: 'system.performance.alert', title: 'Vacuum Failed', message: json.error || 'Failed to run vacuum', severity: 'error' });
                    }
                  } catch (e) {
                    notificationService.notify({ type: 'system.performance.alert', title: 'Vacuum Failed', message: 'Network or server error', severity: 'error' });
                  }
                }}
              >
                Run Vacuum Now (Admin)
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Save Controls */}
        <div className="flex items-center justify-between p-6 bg-white rounded-lg border border-gray-200">
          <div className="flex items-center gap-2">
            <button
              onClick={() => { try { router.back(); } catch { router.push('/baskets'); } }}
              className="inline-flex items-center gap-1 text-sm text-gray-700 hover:text-gray-900"
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </button>
          </div>
          
          <div className="flex items-center gap-3">
            <Button 
              variant="ghost" 
              onClick={() => window.location.reload()}
              disabled={loading}
            >
              Reset
            </Button>
            <Button 
              onClick={handleSave}
              disabled={loading}
            >
              {loading ? 'Saving...' : 'Save Settings'}
            </Button>
          </div>
        </div>

      </div>
    </div>
  );
}

function getEntryPointDescription(entryPoint: string): string {
  switch (entryPoint) {
    case 'onboarding_dump': return 'Initial content capture from new users';
    case 'manual_edit': return 'Direct editing of substrate (Add Meaning, etc.)';
    case 'document_edit': return 'Document composition and narrative editing';
    case 'reflection_suggestion': return 'AI-suggested insights and patterns';
    case 'graph_action': return 'Relationship and connection management';
    case 'timeline_restore': return 'Restoring content from timeline history';
    default: return 'Substrate modification action';
  }
}
