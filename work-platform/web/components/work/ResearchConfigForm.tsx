"use client";

import { Label } from '@/components/ui/Label';
import { Input } from '@/components/ui/Input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export interface ResearchConfig {
  research_scope: {
    domains?: string[];
    timeframe_lookback_days?: number;
    depth: "overview" | "detailed" | "comprehensive";
    focus_areas?: string[];
  };
  output_preferences: {
    format: "summary" | "detailed_report" | "structured_data";
    max_findings: number;
    confidence_threshold: number;
  };
}

interface ResearchConfigFormProps {
  config: ResearchConfig;
  onChange: (config: ResearchConfig) => void;
}

export default function ResearchConfigForm({ config, onChange }: ResearchConfigFormProps) {
  const updateScope = (field: string, value: any) => {
    onChange({
      ...config,
      research_scope: {
        ...config.research_scope,
        [field]: value,
      },
    });
  };

  const updateOutputPrefs = (field: string, value: any) => {
    onChange({
      ...config,
      output_preferences: {
        ...config.output_preferences,
        [field]: value,
      },
    });
  };

  return (
    <div className="space-y-4 rounded-lg border border-blue-200 bg-blue-50/50 p-4">
      <div className="text-sm font-medium text-blue-900">Research Configuration</div>

      {/* Research Depth */}
      <div className="space-y-2">
        <Label htmlFor="research-depth" className="text-xs font-medium text-slate-700">
          Research Depth
        </Label>
        <Select
          value={config.research_scope.depth}
          onValueChange={(value: "overview" | "detailed" | "comprehensive") =>
            updateScope("depth", value)
          }
        >
          <SelectTrigger id="research-depth" className="bg-white">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="overview">Overview - Quick survey</SelectItem>
            <SelectItem value="detailed">Detailed - Thorough analysis (default)</SelectItem>
            <SelectItem value="comprehensive">Comprehensive - Deep dive</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Timeframe */}
      <div className="space-y-2">
        <Label htmlFor="lookback-days" className="text-xs font-medium text-slate-700">
          Timeframe (days to look back)
        </Label>
        <Input
          id="lookback-days"
          type="number"
          min={1}
          max={365}
          value={config.research_scope.timeframe_lookback_days || 30}
          onChange={(e) => updateScope("timeframe_lookback_days", parseInt(e.target.value))}
          placeholder="30"
          className="bg-white"
        />
        <p className="text-xs text-slate-500">How far back to search (default: 30 days)</p>
      </div>

      {/* Focus Areas */}
      <div className="space-y-2">
        <Label htmlFor="focus-areas" className="text-xs font-medium text-slate-700">
          Focus Areas (optional)
        </Label>
        <Input
          id="focus-areas"
          type="text"
          value={config.research_scope.focus_areas?.join(", ") || ""}
          onChange={(e) =>
            updateScope(
              "focus_areas",
              e.target.value ? e.target.value.split(",").map((s) => s.trim()) : []
            )
          }
          placeholder="e.g., pricing, technology, market share"
          className="bg-white"
        />
        <p className="text-xs text-slate-500">Comma-separated topics to focus on</p>
      </div>

      {/* Output Format */}
      <div className="space-y-2">
        <Label htmlFor="output-format" className="text-xs font-medium text-slate-700">
          Output Format
        </Label>
        <Select
          value={config.output_preferences.format}
          onValueChange={(value: "summary" | "detailed_report" | "structured_data") =>
            updateOutputPrefs("format", value)
          }
        >
          <SelectTrigger id="output-format" className="bg-white">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="summary">Summary - High-level overview</SelectItem>
            <SelectItem value="detailed_report">Detailed Report (default)</SelectItem>
            <SelectItem value="structured_data">Structured Data - Tables/charts</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Max Findings */}
      <div className="space-y-2">
        <Label htmlFor="max-findings" className="text-xs font-medium text-slate-700">
          Maximum Findings
        </Label>
        <Input
          id="max-findings"
          type="number"
          min={1}
          max={50}
          value={config.output_preferences.max_findings}
          onChange={(e) => updateOutputPrefs("max_findings", parseInt(e.target.value))}
          className="bg-white"
        />
        <p className="text-xs text-slate-500">Max number of findings to return (1-50)</p>
      </div>

      {/* Confidence Threshold */}
      <div className="space-y-2">
        <Label htmlFor="confidence-threshold" className="text-xs font-medium text-slate-700">
          Confidence Threshold: {Math.round(config.output_preferences.confidence_threshold * 100)}%
        </Label>
        <input
          id="confidence-threshold"
          type="range"
          min={0}
          max={100}
          step={5}
          value={config.output_preferences.confidence_threshold * 100}
          onChange={(e) =>
            updateOutputPrefs("confidence_threshold", parseInt(e.target.value) / 100)
          }
          className="w-full"
        />
        <p className="text-xs text-slate-500">Only include findings with confidence above this level</p>
      </div>
    </div>
  );
}
