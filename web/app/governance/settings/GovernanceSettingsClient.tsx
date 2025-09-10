"use client";

import { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Label } from '@/components/ui/Label';
import { Badge } from '@/components/ui/Badge';
import { Settings, Shield, AlertTriangle, CheckCircle2, Circle } from 'lucide-react';

interface GovernanceSettings {
  governance_enabled: boolean;
  validator_required: boolean;
  // Removed from UI: direct_substrate_writes is canon-enforced server-side (always false)
  governance_ui_enabled: boolean;
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
  const [settings, setSettings] = useState<GovernanceSettings>(() => {
    if (initialSettings) {
      return {
        governance_enabled: initialSettings.governance_enabled,
        validator_required: initialSettings.validator_required,
        governance_ui_enabled: initialSettings.governance_ui_enabled,
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

  useEffect(() => {
    setHasChanges(JSON.stringify(settings) !== JSON.stringify(getInitialSettings()));
  }, [settings]);

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
      const response = await fetch('/api/governance/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          governance_enabled: settings.governance_enabled,
          validator_required: settings.validator_required,
          governance_ui_enabled: settings.governance_ui_enabled,
          entry_point_policies: settings.entry_point_policies,
          default_blast_radius: settings.default_blast_radius
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update settings');
      }

      toast.success('Governance settings updated ✓');
      setHasChanges(false);
      
      // Refresh the page to get updated settings
      window.location.reload();
      
    } catch (error) {
      console.error('Settings update failed:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to update settings');
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
            
            <div className="flex items-center gap-3">
              <StatusIcon className="h-5 w-5" />
              <Badge className={governanceStatus.color}>
                {governanceStatus.status}
              </Badge>
            </div>
          </div>
        </div>

        {/* Global Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-blue-600" />
              Content Review Controls
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-8 p-8">
            
            {/* Main toggles */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    id="governance-enabled"
                    checked={settings.governance_enabled}
                    onChange={(e) => setSettings(prev => ({ 
                      ...prev, 
                      governance_enabled: e.target.checked 
                    }))}
                    className="h-4 w-4"
                  />
                  <Label htmlFor="governance-enabled" className="font-medium">
                    Enable Content Review
                  </Label>
                </div>
                <p className="text-sm text-gray-600 ml-7">
                  Require approval for content changes
                </p>
              </div>

              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    id="governance-ui"
                    checked={settings.governance_ui_enabled}
                    onChange={(e) => setSettings(prev => ({ 
                      ...prev, 
                      governance_ui_enabled: e.target.checked 
                    }))}
                    disabled={!settings.governance_enabled}
                    className="h-4 w-4"
                  />
                  <Label htmlFor="governance-ui" className="font-medium">
                    Show Review Interface
                  </Label>
                </div>
                <p className="text-sm text-gray-600 ml-7">
                  Display pending approvals and review tools
                </p>
              </div>

              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    id="validator-required"
                    checked={settings.validator_required}
                    onChange={(e) => setSettings(prev => ({ 
                      ...prev, 
                      validator_required: e.target.checked 
                    }))}
                    disabled={!settings.governance_enabled}
                    className="h-4 w-4"
                  />
                  <Label htmlFor="validator-required" className="font-medium">
                    Require Validator (disables auto‑approve)
                  </Label>
                </div>
                <p className="text-sm text-gray-600 ml-7">
                  When enabled, all proposals require validation and cannot be auto‑approved.
                </p>
              </div>

              {/* Canon: direct_substrate_writes is enforced server-side (always false). Removed from UI. */}
            </div>

            {/* Blast Radius */}
            <div className="space-y-3">
              <Label className="font-medium">Default Change Scope</Label>
              <select
                value={settings.default_blast_radius === 'Global' ? 'Scoped' : settings.default_blast_radius}
                onChange={(e) => setSettings(prev => ({ 
                  ...prev, 
                  default_blast_radius: e.target.value 
                }))}
                className="w-full md:w-64 border border-gray-300 rounded-lg px-4 py-3 text-sm"
              >
                <option value="Local">Local (single basket)</option>
                <option value="Scoped">Scoped (workspace-wide)</option>
              </select>
            </div>
          </CardContent>
        </Card>

        {/* Entry Point Policies */}
        <Card>
          <CardHeader className="p-6">
            <CardTitle>Action Review Policies</CardTitle>
            <p className="text-sm text-gray-600 mt-2">
              Choose when different types of content changes need approval
            </p>
          </CardHeader>
          <CardContent className="p-8">
            <div className="space-y-6">
              {Object.entries(settings.entry_point_policies)
                .filter(([entryPoint]) => ['onboarding_dump','manual_edit','graph_action','timeline_restore'].includes(entryPoint))
                .map(([entryPoint, policy]) => (
                <div key={entryPoint} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div>
                    <div className="font-medium text-sm">
                      {entryPoint.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                    </div>
                    <div className="text-xs text-gray-600 mt-1">
                      {getEntryPointDescription(entryPoint)}
                    </div>
                  </div>
                  
                  {entryPoint === 'onboarding_dump' ? (
                    <select
                      value={'direct'}
                      disabled
                      className="border border-gray-300 rounded-lg px-3 py-2 text-sm min-w-28 bg-gray-100 text-gray-600"
                    >
                      <option value="direct">Direct</option>
                    </select>
                  ) : entryPoint === 'timeline_restore' ? (
                    <select
                      value={'proposal'}
                      disabled={!settings.governance_enabled}
                      className="border border-gray-300 rounded-lg px-3 py-2 text-sm min-w-28"
                    >
                      <option value="proposal">Proposal</option>
                    </select>
                  ) : (
                    <select
                      value={policy === 'direct' ? 'proposal' : policy}
                      onChange={(e) => setSettings(prev => ({
                        ...prev,
                        entry_point_policies: {
                          ...prev.entry_point_policies,
                          [entryPoint]: e.target.value
                        }
                      }))}
                      disabled={!settings.governance_enabled}
                      className="border border-gray-300 rounded-lg px-3 py-2 text-sm min-w-28"
                    >
                      <option value="proposal">Proposal</option>
                      <option value="hybrid">Hybrid</option>
                    </select>
                  )}
                </div>
              ))}
            </div>
            
            <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="text-sm text-blue-800">
                <strong>Policy Types:</strong>
                <ul className="mt-2 space-y-1 text-xs">
                  <li><strong>Proposal:</strong> All changes require approval</li>
                  <li><strong>Direct:</strong> P0 capture only (always direct). Other entry points do not allow Direct.</li>
                  <li><strong>Hybrid:</strong> Risk-based routing. If enabled, agents may auto‑approve small, clean proposals; otherwise they go to review.</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Save Controls */}
        <div className="flex items-center justify-between p-6 bg-white rounded-lg border border-gray-200">
          <div className="text-sm text-gray-600">
            {hasChanges ? (
              <span className="text-orange-600">You have unsaved changes</span>
            ) : (
              <span>All changes saved</span>
            )}
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
              disabled={loading || !hasChanges}
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
