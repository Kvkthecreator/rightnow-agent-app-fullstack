'use client';

import { Settings as SettingsIcon, Zap, Copy, Check } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import SettingsSection from '@/components/settings/SettingsSection';
import DisplayBox from '@/components/settings/DisplayBox';
import { BasketDangerZone } from '@/components/projects/BasketDangerZone';
import { useState } from 'react';

interface AgentSession {
  id: string;
  agent_type: string;
  created_at: string;
  last_active_at: string | null;
  parent_session_id: string | null;
  created_by_session_id: string | null;
}

interface ProjectSettingsClientProps {
  project: {
    id: string;
    name: string;
    description: string | null;
    basket_id: string;
    status: string;
    created_at: string;
    updated_at: string;
  };
  basketStats: {
    blocks: number;
    dumps: number;
  };
  agentSessions: AgentSession[];
}

function getAgentDisplayName(agentType: string): string {
  switch (agentType) {
    case 'thinking_partner':
      return 'Thinking Partner';
    case 'research':
      return 'Research Agent';
    case 'content':
      return 'Content Agent';
    case 'reporting':
      return 'Reporting Agent';
    default:
      return agentType.charAt(0).toUpperCase() + agentType.slice(1) + ' Agent';
  }
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <button
      onClick={handleCopy}
      className="ml-2 p-1 hover:bg-slate-100 rounded transition-colors"
      title="Copy to clipboard"
    >
      {copied ? (
        <Check className="h-3.5 w-3.5 text-green-600" />
      ) : (
        <Copy className="h-3.5 w-3.5 text-slate-400" />
      )}
    </button>
  );
}

export function ProjectSettingsClient({ project, basketStats, agentSessions }: ProjectSettingsClientProps) {
  // Separate TP (parent) from specialists (children)
  const tpSession = agentSessions.find(s => s.agent_type === 'thinking_partner');
  const specialistSessions = agentSessions.filter(s => s.agent_type !== 'thinking_partner');
  return (
    <div className="max-w-4xl mx-auto space-y-6 px-6 py-8">
      {/* Header */}
      <Card className="p-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center">
            <SettingsIcon className="h-5 w-5 text-slate-600" />
          </div>
          <div>
            <h1 className="text-xl font-semibold text-slate-900">Project Settings</h1>
            <p className="text-slate-600 text-sm">Manage {project.name} configuration and data</p>
          </div>
        </div>
      </Card>

      {/* General Settings */}
      <SettingsSection
        title="General"
        description="Project metadata and identifiers"
      >
        <DisplayBox label="Project ID" value={project.id} />
        <DisplayBox label="Name" value={project.name} />
        {project.description && (
          <DisplayBox label="Description" value={project.description} />
        )}
        <DisplayBox label="Status" value={project.status} />
        <DisplayBox
          label="Created"
          value={new Date(project.created_at).toLocaleString()}
        />
      </SettingsSection>

      {/* Context Storage */}
      <SettingsSection
        title="Context Storage"
        description="Basket statistics and substrate data"
      >
        <DisplayBox label="Basket ID" value={project.basket_id} />
        <DisplayBox
          label="Context Blocks"
          value={`${basketStats.blocks} block${basketStats.blocks !== 1 ? 's' : ''}`}
        />
        <DisplayBox
          label="Raw Dumps"
          value={`${basketStats.dumps} dump${basketStats.dumps !== 1 ? 's' : ''}`}
        />
        <div className="rounded-md bg-blue-50 p-4 border border-blue-200">
          <p className="text-xs text-blue-900">
            Context blocks are extracted knowledge and meaning from your project.
            Raw dumps are the original source materials before processing.
          </p>
        </div>
      </SettingsSection>

      {/* Agent Sessions */}
      <SettingsSection
        title="Agent Infrastructure"
        description="Pre-scaffolded agent sessions and hierarchical relationships"
      >
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="text-sm text-slate-600">
              All agent sessions created during project setup
            </div>
            <Badge variant="secondary" className="gap-2 bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/20">
              {agentSessions.length} Sessions Active
            </Badge>
          </div>

          {/* Thinking Partner (Root Session) */}
          {tpSession && (
            <div className="rounded-lg border border-slate-200 bg-slate-50/50 p-4">
              <div className="flex items-start gap-3 mb-3">
                <div className="rounded-lg bg-primary/10 p-2">
                  <Zap className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h4 className="font-medium text-slate-900">{getAgentDisplayName(tpSession.agent_type)}</h4>
                    <Badge variant="outline" className="text-xs bg-purple-500/10 text-purple-700 border-purple-500/20">
                      Root Session
                    </Badge>
                  </div>
                  <p className="text-xs text-slate-500 mt-1">Orchestrates all specialist agents</p>
                </div>
              </div>
              <div className="space-y-2 text-xs">
                <div className="flex items-center justify-between bg-white rounded px-3 py-2">
                  <span className="text-slate-600 font-medium">Session ID</span>
                  <div className="flex items-center font-mono text-slate-900">
                    {tpSession.id}
                    <CopyButton text={tpSession.id} />
                  </div>
                </div>
                <div className="flex items-center justify-between bg-white rounded px-3 py-2">
                  <span className="text-slate-600 font-medium">Created</span>
                  <span className="text-slate-900">{new Date(tpSession.created_at).toLocaleString()}</span>
                </div>
                {tpSession.last_active_at && (
                  <div className="flex items-center justify-between bg-white rounded px-3 py-2">
                    <span className="text-slate-600 font-medium">Last Active</span>
                    <span className="text-slate-900">{new Date(tpSession.last_active_at).toLocaleString()}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Specialist Sessions (Children) */}
          {specialistSessions.length > 0 && (
            <div className="space-y-3">
              <h4 className="text-sm font-medium text-slate-700">Specialist Agents</h4>
              <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                {specialistSessions.map((session) => (
                  <div key={session.id} className="rounded-lg border border-slate-200 bg-white p-3">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="rounded bg-slate-100 p-1.5">
                        <Zap className="h-4 w-4 text-slate-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h5 className="text-sm font-medium text-slate-900 truncate">
                          {getAgentDisplayName(session.agent_type)}
                        </h5>
                      </div>
                    </div>
                    <div className="space-y-2 text-xs">
                      <div className="bg-slate-50 rounded px-2 py-1.5">
                        <div className="text-slate-500 mb-0.5">Session ID</div>
                        <div className="flex items-center justify-between">
                          <code className="text-slate-900 text-[10px] truncate flex-1">
                            {session.id.split('-')[0]}...
                          </code>
                          <CopyButton text={session.id} />
                        </div>
                      </div>
                      {session.parent_session_id && (
                        <div className="bg-slate-50 rounded px-2 py-1.5">
                          <div className="text-slate-500 mb-0.5">Parent Session</div>
                          <code className="text-slate-900 text-[10px] truncate block">
                            {session.parent_session_id.split('-')[0]}...
                          </code>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="rounded-md bg-blue-50 p-4 border border-blue-200">
            <p className="text-xs text-blue-900">
              These session IDs are useful for debugging and API integration. The hierarchical structure
              ensures the Thinking Partner orchestrates all specialist agents during work execution.
            </p>
          </div>
        </div>
      </SettingsSection>

      {/* Danger Zone */}
      <BasketDangerZone
        projectId={project.id}
        projectName={project.name}
        basketId={project.basket_id}
        basketStats={basketStats}
      />
    </div>
  );
}
