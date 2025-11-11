'use client';

import { Settings as SettingsIcon } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import SettingsSection from '@/components/settings/SettingsSection';
import DisplayBox from '@/components/settings/DisplayBox';
import { BasketDangerZone } from '@/components/projects/BasketDangerZone';

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
}

export function ProjectSettingsClient({ project, basketStats }: ProjectSettingsClientProps) {
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
