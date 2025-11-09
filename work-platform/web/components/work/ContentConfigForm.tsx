"use client";

import { Label } from '@/components/ui/Label';
import { Input } from '@/components/ui/Input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';

export interface ContentConfig {
  content_spec: {
    platform: "linkedin" | "twitter" | "blog" | "email" | "landing_page" | "general";
    tone: "professional" | "casual" | "technical" | "promotional";
    target_audience: string;
    word_count_min?: number;
    word_count_max?: number;
  };
  brand_requirements: {
    use_brand_voice: boolean;
    include_cta: boolean;
    reference_blocks?: string[];
  };
  variations_count: number;
}

interface ContentConfigFormProps {
  config: ContentConfig;
  onChange: (config: ContentConfig) => void;
}

export default function ContentConfigForm({ config, onChange }: ContentConfigFormProps) {
  const updateContentSpec = (field: string, value: any) => {
    onChange({
      ...config,
      content_spec: {
        ...config.content_spec,
        [field]: value,
      },
    });
  };

  const updateBrandRequirements = (field: string, value: any) => {
    onChange({
      ...config,
      brand_requirements: {
        ...config.brand_requirements,
        [field]: value,
      },
    });
  };

  return (
    <div className="space-y-4 rounded-lg border border-green-200 bg-green-50/50 p-4">
      <div className="text-sm font-medium text-green-900">Content Configuration</div>

      {/* Platform */}
      <div className="space-y-2">
        <Label htmlFor="platform" className="text-xs font-medium text-slate-700">
          Target Platform
        </Label>
        <Select
          value={config.content_spec.platform}
          onValueChange={(value: "linkedin" | "twitter" | "blog" | "email" | "landing_page" | "general") =>
            updateContentSpec("platform", value)
          }
        >
          <SelectTrigger id="platform" className="bg-white">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="general">General - Multi-purpose</SelectItem>
            <SelectItem value="linkedin">LinkedIn - Professional posts</SelectItem>
            <SelectItem value="twitter">Twitter - Short-form tweets</SelectItem>
            <SelectItem value="blog">Blog - Long-form articles</SelectItem>
            <SelectItem value="email">Email - Newsletters/campaigns</SelectItem>
            <SelectItem value="landing_page">Landing Page - Marketing copy</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Tone */}
      <div className="space-y-2">
        <Label htmlFor="tone" className="text-xs font-medium text-slate-700">
          Content Tone
        </Label>
        <Select
          value={config.content_spec.tone}
          onValueChange={(value: "professional" | "casual" | "technical" | "promotional") =>
            updateContentSpec("tone", value)
          }
        >
          <SelectTrigger id="tone" className="bg-white">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="professional">Professional (default)</SelectItem>
            <SelectItem value="casual">Casual - Conversational</SelectItem>
            <SelectItem value="technical">Technical - In-depth</SelectItem>
            <SelectItem value="promotional">Promotional - Marketing</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Target Audience */}
      <div className="space-y-2">
        <Label htmlFor="target-audience" className="text-xs font-medium text-slate-700">
          Target Audience <span className="text-destructive">*</span>
        </Label>
        <Input
          id="target-audience"
          type="text"
          value={config.content_spec.target_audience}
          onChange={(e) => updateContentSpec("target_audience", e.target.value)}
          placeholder="e.g., Enterprise CTOs, SaaS founders, Marketing professionals"
          className="bg-white"
          maxLength={200}
          required
        />
        <p className="text-xs text-slate-500">Who will read this content? (3-200 characters)</p>
      </div>

      {/* Word Count Range */}
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label htmlFor="word-count-min" className="text-xs font-medium text-slate-700">
            Min Word Count (optional)
          </Label>
          <Input
            id="word-count-min"
            type="number"
            min={10}
            max={config.content_spec.word_count_max || 10000}
            value={config.content_spec.word_count_min || ""}
            onChange={(e) => updateContentSpec("word_count_min", e.target.value ? parseInt(e.target.value) : undefined)}
            placeholder="e.g., 100"
            className="bg-white"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="word-count-max" className="text-xs font-medium text-slate-700">
            Max Word Count (optional)
          </Label>
          <Input
            id="word-count-max"
            type="number"
            min={config.content_spec.word_count_min || 10}
            max={10000}
            value={config.content_spec.word_count_max || ""}
            onChange={(e) => updateContentSpec("word_count_max", e.target.value ? parseInt(e.target.value) : undefined)}
            placeholder="e.g., 500"
            className="bg-white"
          />
        </div>
      </div>

      {/* Brand Requirements */}
      <div className="space-y-3 border-t border-green-200 pt-4">
        <div className="text-xs font-medium text-slate-700">Brand Requirements</div>

        <div className="flex items-center space-x-2">
          <Checkbox
            id="use-brand-voice"
            checked={config.brand_requirements.use_brand_voice}
            onCheckedChange={(checked) => updateBrandRequirements("use_brand_voice", checked)}
          />
          <label
            htmlFor="use-brand-voice"
            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
          >
            Use brand voice from context
          </label>
        </div>

        <div className="flex items-center space-x-2">
          <Checkbox
            id="include-cta"
            checked={config.brand_requirements.include_cta}
            onCheckedChange={(checked) => updateBrandRequirements("include_cta", checked)}
          />
          <label
            htmlFor="include-cta"
            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
          >
            Include call-to-action
          </label>
        </div>
      </div>

      {/* Variations Count */}
      <div className="space-y-2">
        <Label htmlFor="variations-count" className="text-xs font-medium text-slate-700">
          Number of Variations
        </Label>
        <Input
          id="variations-count"
          type="number"
          min={1}
          max={5}
          value={config.variations_count}
          onChange={(e) => onChange({ ...config, variations_count: parseInt(e.target.value) })}
          className="bg-white"
        />
        <p className="text-xs text-slate-500">Generate 1-5 content variations (default: 1)</p>
      </div>
    </div>
  );
}
