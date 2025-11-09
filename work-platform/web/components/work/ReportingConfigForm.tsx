"use client";

import { Label } from '@/components/ui/Label';
import { Input } from '@/components/ui/Input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';

export interface ReportingConfig {
  report_spec: {
    report_type: "executive_summary" | "progress_report" | "analytics" | "custom";
    time_period_start: string; // ISO date string
    time_period_end: string; // ISO date string
    sections_required: string[];
  };
  data_sources: {
    include_timeline_events: boolean;
    include_metrics: boolean;
    filter_by_tags?: string[];
  };
  audience: {
    stakeholder_level: "executive" | "manager" | "technical";
    depth: "high_level" | "detailed";
  };
}

interface ReportingConfigFormProps {
  config: ReportingConfig;
  onChange: (config: ReportingConfig) => void;
}

export default function ReportingConfigForm({ config, onChange }: ReportingConfigFormProps) {
  const updateReportSpec = (field: string, value: any) => {
    onChange({
      ...config,
      report_spec: {
        ...config.report_spec,
        [field]: value,
      },
    });
  };

  const updateDataSources = (field: string, value: any) => {
    onChange({
      ...config,
      data_sources: {
        ...config.data_sources,
        [field]: value,
      },
    });
  };

  const updateAudience = (field: string, value: any) => {
    onChange({
      ...config,
      audience: {
        ...config.audience,
        [field]: value,
      },
    });
  };

  return (
    <div className="space-y-4 rounded-lg border border-purple-200 bg-purple-50/50 p-4">
      <div className="text-sm font-medium text-purple-900">Reporting Configuration</div>

      {/* Report Type */}
      <div className="space-y-2">
        <Label htmlFor="report-type" className="text-xs font-medium text-slate-700">
          Report Type
        </Label>
        <Select
          value={config.report_spec.report_type}
          onValueChange={(value: "executive_summary" | "progress_report" | "analytics" | "custom") =>
            updateReportSpec("report_type", value)
          }
        >
          <SelectTrigger id="report-type" className="bg-white">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="executive_summary">Executive Summary (default)</SelectItem>
            <SelectItem value="progress_report">Progress Report - Status updates</SelectItem>
            <SelectItem value="analytics">Analytics - Data-driven insights</SelectItem>
            <SelectItem value="custom">Custom - Flexible format</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Time Period */}
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label htmlFor="time-period-start" className="text-xs font-medium text-slate-700">
            Start Date <span className="text-destructive">*</span>
          </Label>
          <Input
            id="time-period-start"
            type="date"
            value={config.report_spec.time_period_start}
            onChange={(e) => updateReportSpec("time_period_start", e.target.value)}
            className="bg-white"
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="time-period-end" className="text-xs font-medium text-slate-700">
            End Date <span className="text-destructive">*</span>
          </Label>
          <Input
            id="time-period-end"
            type="date"
            value={config.report_spec.time_period_end}
            onChange={(e) => updateReportSpec("time_period_end", e.target.value)}
            className="bg-white"
            required
          />
        </div>
      </div>

      {/* Sections Required */}
      <div className="space-y-2">
        <Label htmlFor="sections-required" className="text-xs font-medium text-slate-700">
          Required Sections
        </Label>
        <Input
          id="sections-required"
          type="text"
          value={config.report_spec.sections_required.join(", ")}
          onChange={(e) =>
            updateReportSpec(
              "sections_required",
              e.target.value ? e.target.value.split(",").map((s) => s.trim()) : ["Overview", "Key Metrics", "Recommendations"]
            )
          }
          placeholder="Overview, Key Metrics, Recommendations"
          className="bg-white"
        />
        <p className="text-xs text-slate-500">Comma-separated section names (default: Overview, Key Metrics, Recommendations)</p>
      </div>

      {/* Data Sources */}
      <div className="space-y-3 border-t border-purple-200 pt-4">
        <div className="text-xs font-medium text-slate-700">Data Sources</div>

        <div className="flex items-center space-x-2">
          <Checkbox
            id="include-timeline-events"
            checked={config.data_sources.include_timeline_events}
            onCheckedChange={(checked) => updateDataSources("include_timeline_events", checked)}
          />
          <label
            htmlFor="include-timeline-events"
            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
          >
            Include timeline events
          </label>
        </div>

        <div className="flex items-center space-x-2">
          <Checkbox
            id="include-metrics"
            checked={config.data_sources.include_metrics}
            onCheckedChange={(checked) => updateDataSources("include_metrics", checked)}
          />
          <label
            htmlFor="include-metrics"
            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
          >
            Include metrics and KPIs
          </label>
        </div>

        <div className="space-y-2">
          <Label htmlFor="filter-by-tags" className="text-xs font-medium text-slate-700">
            Filter by Tags (optional)
          </Label>
          <Input
            id="filter-by-tags"
            type="text"
            value={config.data_sources.filter_by_tags?.join(", ") || ""}
            onChange={(e) =>
              updateDataSources(
                "filter_by_tags",
                e.target.value ? e.target.value.split(",").map((s) => s.trim()) : undefined
              )
            }
            placeholder="e.g., milestone, feature, bug"
            className="bg-white"
          />
          <p className="text-xs text-slate-500">Comma-separated tags to filter data</p>
        </div>
      </div>

      {/* Audience */}
      <div className="space-y-3 border-t border-purple-200 pt-4">
        <div className="text-xs font-medium text-slate-700">Target Audience</div>

        <div className="space-y-2">
          <Label htmlFor="stakeholder-level" className="text-xs font-medium text-slate-700">
            Stakeholder Level
          </Label>
          <Select
            value={config.audience.stakeholder_level}
            onValueChange={(value: "executive" | "manager" | "technical") =>
              updateAudience("stakeholder_level", value)
            }
          >
            <SelectTrigger id="stakeholder-level" className="bg-white">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="executive">Executive - High-level overview</SelectItem>
              <SelectItem value="manager">Manager - Operational details</SelectItem>
              <SelectItem value="technical">Technical - In-depth analysis</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="depth" className="text-xs font-medium text-slate-700">
            Report Depth
          </Label>
          <Select
            value={config.audience.depth}
            onValueChange={(value: "high_level" | "detailed") =>
              updateAudience("depth", value)
            }
          >
            <SelectTrigger id="depth" className="bg-white">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="high_level">High Level - Summary only</SelectItem>
              <SelectItem value="detailed">Detailed - Comprehensive</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
}
