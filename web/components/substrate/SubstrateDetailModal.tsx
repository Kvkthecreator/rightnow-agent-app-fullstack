"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import { FileText, Database, Link2, Hash, Clock, Copy, ExternalLink, X } from 'lucide-react';
import { fetchWithToken } from '@/lib/fetchWithToken';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

const SEMANTIC_TYPE_OPTIONS = [
  { value: '', label: '— None —' },
  { value: 'fact', label: 'Fact' },
  { value: 'metric', label: 'Metric' },
  { value: 'intent', label: 'Intent' },
  { value: 'objective', label: 'Objective' },
  { value: 'rationale', label: 'Rationale' },
  { value: 'principle', label: 'Principle' },
  { value: 'assumption', label: 'Assumption' },
  { value: 'context', label: 'Context' },
  { value: 'constraint', label: 'Constraint' },
  { value: 'entity', label: 'Entity' },
  { value: 'insight', label: 'Insight' },
  { value: 'action', label: 'Action' },
  { value: 'summary', label: 'Summary' },
  { value: 'classification', label: 'Classification' },
];

const ANCHOR_SUGGESTIONS = [
  'problem',
  'constraint',
  'metric',
  'customer_need',
  'solution',
  'vision',
  'objective',
  'risk',
];

interface SubstrateDetailModalProps {
  substrateType: 'raw_dump' | 'block' | 'context_item' | 'relationship' | 'timeline_event';
  substrateId: string;
  basketId: string;
  open: boolean;
  onClose: () => void;
  onUpdate?: () => void; // Callback after mutations
}

interface SubstrateDetail {
  id: string;
  created_at: string;
  updated_at?: string;
  // Raw dump fields
  body_md?: string;
  text_dump?: string;
  file_url?: string;
  processing_status?: string;
  processed_at?: string;
  // Block fields (Canon-compliant)
  title?: string;           // Canon: authoritative title field
  content?: string;         // Canon: authoritative content field
  semantic_type?: string;
  state?: string;
  status?: string;
  confidence_score?: number;
  scope?: string | null;
  version?: number | null;
  anchor_role?: string | null;
  anchor_status?: string | null;
  anchor_confidence?: number | null;
  times_referenced?: number;
  usefulness_score?: number;
  last_used_at?: string | null;
  metadata?: Record<string, any>;
  knowledge_summary?: {
    has_summary: boolean;
    goals: number;
    constraints: number;
    metrics: number;
    entities: number;
    insights: number;
    actions: number;
    facts: number;
  } | null;
  knowledge_ingredients?: Record<string, any> | null;
  needs_enrichment?: boolean;
  provenance?: Record<string, any> | null;
  references?: Array<{
    document_id: string;
    title: string;
    doc_type?: string | null;
    updated_at?: string | null;
  }>;
  revisions?: Array<{
    id: string;
    summary?: string | null;
    diff?: any;
    created_at: string;
    actor_id?: string | null;
  }>;
  // Context item fields (Canon-compliant)
  label?: string;              // Legacy support
  kind?: string;               // Canon: entity kind/type
  type?: string;               // Legacy support
  semantic_meaning?: string;   // Canon: semantic interpretation
  semantic_category?: string;  // Canon: semantic category
  synonyms?: string[];
  description?: string;
  // Relationship fields (Canon-compliant)
  relationship_type?: string;
  from_block?: {
    id: string;
    title?: string | null;
    semantic_type?: string | null;
    created_at?: string;
  };
  to_block?: {
    id: string;
    title?: string | null;
    semantic_type?: string | null;
    created_at?: string;
  };
  inference_method?: string | null;
  // Timeline event fields
  event_kind?: string;
  preview?: string;
  ref_id?: string;
  payload?: any;
}

interface HistoryEntry {
  timestamp: string;
  action: string;
  details?: string;
  agent?: string;
}

export default function SubstrateDetailModal({
  substrateType,
  substrateId,
  basketId,
  open,
  onClose,
  onUpdate
}: SubstrateDetailModalProps) {
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'content' | 'history' | 'settings'>('content');
  const [substrate, setSubstrate] = useState<SubstrateDetail | null>(null);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [blockAction, setBlockAction] = useState<'view' | 'edit' | 'retag' | 'archive'>('view');
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editContent, setEditContent] = useState('');
  const [retagSemanticType, setRetagSemanticType] = useState('');
  const [retagAnchorRole, setRetagAnchorRole] = useState('');

  useEffect(() => {
    if (open && substrateId) {
      setBlockAction('view');
      setActionError(null);
      loadSubstrate();
    }
  }, [open, substrateId, substrateType]);

  const loadSubstrate = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Map substrate types to API endpoints
      const endpoints: Record<string, string> = {
        'raw_dump': `/api/baskets/${basketId}/dumps/${substrateId}`,
        'block': `/api/baskets/${basketId}/building-blocks/${substrateId}`,
        'context_item': `/api/baskets/${basketId}/context-items/${substrateId}`,
        'relationship': `/api/baskets/${basketId}/relationships/${substrateId}`,
        'timeline_event': `/api/baskets/${basketId}/timeline/${substrateId}`
      };
      
      const response = await fetchWithToken(endpoints[substrateType]);
      if (!response.ok) throw new Error('Failed to load substrate details');
      
      const data = await response.json();
      setSubstrate(data);

      if (data?.semantic_type || data?.title) {
        setEditTitle(data.title || '');
        setEditContent(data.content || '');
      }
      if (data?.semantic_type) {
        setRetagSemanticType(data.semantic_type);
      }
      if (data?.anchor_role !== undefined) {
        setRetagAnchorRole(data.anchor_role || '');
      }

      if (data?.revisions && Array.isArray(data.revisions) && data.revisions.length > 0) {
        setHistory(
          data.revisions.map((revision: any) => ({
            timestamp: revision.created_at,
            action: revision.summary || 'Revision',
            details: revision.diff ? JSON.stringify(revision.diff) : undefined,
            agent: revision.actor_id || 'system'
          }))
        );
      } else {
        setHistory([
          {
            timestamp: data?.created_at || new Date().toISOString(),
            action: 'Created',
            agent: substrateType === 'raw_dump' ? 'P0 Capture' : 'P1 Extraction'
          }
        ]);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load substrate');
    } finally {
      setLoading(false);
    }
  };

  const cloneMetadata = () => {
    const source = substrate?.metadata ?? {};
    try {
      // @ts-ignore structuredClone may exist in runtime
      return typeof structuredClone === 'function' ? structuredClone(source) : JSON.parse(JSON.stringify(source));
    } catch {
      return JSON.parse(JSON.stringify(source));
    }
  };

  const runWorkRequest = async (operations: any[]) => {
    setActionLoading(true);
    setActionError(null);

    try {
      const response = await fetchWithToken('/api/work', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          work_type: 'MANUAL_EDIT',
          work_payload: {
            basket_id: basketId,
            operations,
            user_override: 'allow_auto',
          },
          priority: 'normal',
        }),
      });

      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(payload.error || 'Failed to submit work request');
      }

      if (payload.executed_immediately === false) {
        throw new Error('Work request queued for review');
      }

      await loadSubstrate();
      onUpdate?.();
      setBlockAction('view');
    } catch (err) {
      setActionError(err instanceof Error ? err.message : String(err));
    } finally {
      setActionLoading(false);
    }
  };

  const handleSaveEdit = async () => {
    if (!substrate) return;
    const metadata = cloneMetadata();
    if (metadata && metadata.knowledge_ingredients) {
      metadata.knowledge_ingredients.title = editTitle.trim();
      if (metadata.knowledge_ingredients.summary !== undefined) {
        metadata.knowledge_ingredients.summary = editContent.trim();
      }
    }
    const operations = [
      {
        type: 'ReviseBlock',
        data: {
          block_id: substrate.id,
          title: editTitle.trim(),
          content: editContent.trim(),
          semantic_type: substrate.semantic_type,
          anchor_role: substrate.anchor_role ?? null,
          confidence: substrate.confidence_score ?? 1,
          metadata,
        },
      },
    ];
    await runWorkRequest(operations);
  };

  const handleSaveRetag = async () => {
    if (!substrate) return;
    const metadata = cloneMetadata();
    if (metadata && metadata.knowledge_ingredients) {
      if (retagSemanticType) {
        metadata.knowledge_ingredients.semantic_type = retagSemanticType;
      }
      metadata.knowledge_ingredients.anchor_role = retagAnchorRole.trim() || null;
    }
    const operations = [
      {
        type: 'UpdateBlock',
        data: {
          block_id: substrate.id,
          semantic_type: retagSemanticType || substrate.semantic_type,
          anchor_role: retagAnchorRole.trim() || null,
          confidence: substrate.confidence_score ?? 1,
          metadata,
        },
      },
    ];
    await runWorkRequest(operations);
  };

  const handleArchiveBlock = async () => {
    if (!substrate) return;
    const operations = [
      {
        type: 'ArchiveBlock',
        data: {
          block_id: substrate.id,
        },
      },
    ];
    await runWorkRequest(operations);
  };

  const toggleBlockAction = (mode: 'edit' | 'retag' | 'archive') => {
    setActionError(null);
    setBlockAction(prev => (prev === mode ? 'view' : mode));
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleString();
  };

  const getIcon = () => {
    switch (substrateType) {
      case 'raw_dump': return <FileText className="h-4 w-4" />;
      case 'block': return <Database className="h-4 w-4" />;
      case 'context_item': return <Hash className="h-4 w-4" />;
      case 'relationship': return <Link2 className="h-4 w-4" />;
      case 'timeline_event': return <Clock className="h-4 w-4" />;
    }
  };

  const getTitle = () => {
    switch (substrateType) {
      case 'raw_dump': return `Memory - ${formatTimestamp(substrate?.created_at || '')}`;
      case 'block': return `Block - ${substrate?.semantic_type || 'Unknown Type'}`;
      case 'context_item': return `Entity - ${substrate?.title || substrate?.label || 'Unnamed'}`;
      case 'relationship': return 'Relationship';
      case 'timeline_event': return `Event - ${substrate?.event_kind || 'Unknown'}`;
    }
  };

  const renderContent = () => {
    if (loading) {
      return <div className="p-6 text-center text-gray-500">Loading...</div>;
    }

    if (error) {
      return <div className="p-6 text-center text-red-600">Error: {error}</div>;
    }

    if (!substrate) {
      return <div className="p-6 text-center text-gray-500">No data found</div>;
    }

    switch (substrateType) {
      case 'raw_dump':
        return (
          <div className="space-y-4">
            {(substrate.body_md || substrate.text_dump) && (
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-2">Memory Content</h4>
                <div className="bg-gray-50 p-3 rounded text-sm text-gray-800 max-h-64 overflow-y-auto whitespace-pre-wrap">
                  {substrate.body_md || substrate.text_dump}
                </div>
              </div>
            )}
            {substrate.file_url && (
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-2">File Info</h4>
                <div className="flex items-center gap-2 text-sm">
                  <span>Filename:</span>
                  <span className="font-mono text-blue-600">{substrate.file_url.split('/').pop()}</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => window.open(substrate.file_url, '_blank')}
                  >
                    <ExternalLink className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            )}
            <div className="flex items-center gap-4 text-sm text-gray-600">
              <span>Processing Status: <span className="font-medium">{substrate.processing_status || 'completed'}</span></span>
              <span>Created: {formatTimestamp(substrate.created_at)}</span>
            </div>
          </div>
        );

      case 'block': {
        const knowledge = substrate.knowledge_ingredients || substrate.metadata?.knowledge_ingredients;
        const knowledgeSummary = substrate.knowledge_summary || {
          has_summary: Boolean(knowledge?.summary),
          goals: Array.isArray(knowledge?.goals) ? knowledge.goals.length : 0,
          constraints: Array.isArray(knowledge?.constraints) ? knowledge.constraints.length : 0,
          metrics: Array.isArray(knowledge?.metrics) ? knowledge.metrics.length : 0,
          entities: Array.isArray(knowledge?.entities) ? knowledge.entities.length : 0,
          insights: Array.isArray(knowledge?.insights) ? knowledge.insights.length : 0,
          actions: Array.isArray(knowledge?.actions) ? knowledge.actions.length : 0,
          facts: Array.isArray(knowledge?.facts) ? knowledge.facts.length : 0,
        };

        const displayConfidence = (value?: number) => {
          if (value === undefined || value === null) return '—';
          return `${Math.round(value * 100)}%`;
        };

        const renderKnowledgeGroups = () => {
          if (!knowledge) {
            return null;
          }

          const sections: React.ReactNode[] = [];

          if (knowledge.summary) {
            sections.push(
              <div key="summary" className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                <h5 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
                  <span>📝 Summary</span>
                </h5>
                <p className="mt-2 text-sm text-slate-700 whitespace-pre-line">
                  {knowledge.summary}
                </p>
              </div>
            );
          }

          const listSection = (
            key: string,
            label: string,
            icon: string,
            items: any[] | undefined,
            toneClass: string,
            renderItem: (item: any, index: number) => React.ReactNode
          ) => {
            if (!items || items.length === 0) return;
            sections.push(
              <div key={key} className={`rounded-lg border ${toneClass} bg-white px-3 py-3`}>
                <div className="flex items-center justify-between text-sm font-semibold text-slate-900">
                  <span>{icon} {label}</span>
                  <span className="text-slate-500 font-medium">{items.length}</span>
                </div>
                <div className="mt-3 space-y-2">
                  {items.map(renderItem)}
                </div>
              </div>
            );
          };

        const goalRenderer = (goal: any, index: number) => (
          <div key={index} className="rounded border border-indigo-100 bg-indigo-50/60 px-3 py-2 text-sm">
            <div className="font-medium text-indigo-800">{goal.description || goal.title || 'Goal'}</div>
            {goal.priority && <div className="text-xs text-indigo-600 mt-1">Priority {goal.priority}</div>}
          </div>
        );

        const constraintRenderer = (constraint: any, index: number) => (
          <div key={index} className="rounded border border-rose-100 bg-rose-50/60 px-3 py-2 text-sm">
            <div className="font-medium text-rose-800">{constraint.description}</div>
            {constraint.severity && <div className="text-xs text-rose-600 mt-1">Severity {constraint.severity}</div>}
          </div>
        );

        const metricRenderer = (metric: any, index: number) => (
          <div key={index} className="rounded border border-emerald-100 bg-emerald-50/50 px-3 py-2 text-sm">
            <div className="font-medium text-emerald-800">{metric.name || 'Metric'}</div>
            <div className="text-xs text-emerald-600 mt-1">{metric.value_text || metric.description}</div>
          </div>
        );

        const entityRenderer = (entity: any, index: number) => (
          <div key={index} className="rounded border border-blue-100 bg-blue-50/60 px-3 py-2 text-sm">
            <div className="font-medium text-blue-800">{entity.name}</div>
            {entity.role && <div className="text-xs text-blue-600 mt-1">Role {entity.role}</div>}
          </div>
        );

        const insightRenderer = (insight: any, index: number) => (
          <div key={index} className="rounded border border-amber-100 bg-amber-50/60 px-3 py-2 text-sm">
            <div className="font-medium text-amber-800">{insight.text || insight.insight}</div>
            {Array.isArray(insight.supporting_facts) && insight.supporting_facts.length > 0 && (
              <div className="text-xs text-amber-600 mt-1">
                Supports: {insight.supporting_facts.join(', ')}
              </div>
            )}
          </div>
        );

        const actionRenderer = (action: any, index: number) => (
          <div key={index} className="rounded border border-emerald-100 bg-emerald-50/70 px-3 py-2 text-sm">
            <div className="font-medium text-emerald-800">{action.action || action.description}</div>
            <div className="text-xs text-emerald-600 mt-1 flex flex-wrap gap-2">
              {action.priority && <span>Priority {action.priority}</span>}
              {action.owner && <span>Owner {action.owner}</span>}
              {action.timeline && <span>Timeline {action.timeline}</span>}
            </div>
          </div>
        );

        const factRenderer = (fact: any, index: number) => (
          <div key={index} className="rounded border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700">
            {fact.text || fact}
          </div>
        );

        listSection('goals', 'Goals', '🎯', knowledge.goals, 'border-indigo-200', goalRenderer);
        listSection('constraints', 'Constraints', '⚠️', knowledge.constraints, 'border-rose-200', constraintRenderer);
        listSection('metrics', 'Metrics', '📊', knowledge.metrics, 'border-emerald-200', metricRenderer);
        listSection('entities', 'Entities', '👥', knowledge.entities, 'border-blue-200', entityRenderer);
        listSection('insights', 'Insights', '💡', knowledge.insights, 'border-amber-200', insightRenderer);
        listSection('actions', 'Actions', '✅', knowledge.actions, 'border-emerald-200', actionRenderer);
        listSection('facts', 'Facts', '🧩', knowledge.facts, 'border-slate-200', factRenderer);

        if (sections.length === 0) {
          return (
            <div className="rounded-lg border border-dashed border-slate-200 bg-slate-50 p-6 text-sm text-slate-500">
              No structured ingredients captured yet.
            </div>
          );
        }

        return <div className="space-y-4">{sections}</div>;
      };

        const renderActionError = () => (
          actionError && (
            <div className="rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
              {actionError}
            </div>
          )
        );

        return (
          <div className="space-y-6">
            {/* Primary Content Display - Single source of truth */}
            <section className="space-y-4">
              {/* Title and Type */}
              {substrate.title && (
                <div>
                  <h3 className="text-lg font-semibold text-slate-900">{substrate.title}</h3>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {substrate.semantic_type && (
                      <Badge variant="outline" className="bg-slate-100 text-slate-700 border-slate-200">
                        {substrate.semantic_type}
                      </Badge>
                    )}
                    {(substrate.state || substrate.status) && (
                      <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200">
                        {substrate.state || substrate.status}
                      </Badge>
                    )}
                  </div>
                </div>
              )}

              {/* Main Content */}
              <div className="rounded-lg border border-slate-200 bg-white p-4">
                <div className="prose prose-slate prose-sm max-w-none">
                  <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    components={{
                      h1: ({children}) => <h1 className="text-xl font-bold text-slate-900 mt-4 mb-3">{children}</h1>,
                      h2: ({children}) => <h2 className="text-lg font-semibold text-slate-800 mt-3 mb-2">{children}</h2>,
                      h3: ({children}) => <h3 className="text-base font-semibold text-slate-800 mt-2 mb-1">{children}</h3>,
                      p: ({children}) => <p className="text-sm text-slate-800 leading-relaxed mb-3">{children}</p>,
                      ul: ({children}) => <ul className="list-disc list-inside space-y-1 text-slate-800 mb-3 text-sm">{children}</ul>,
                      ol: ({children}) => <ol className="list-decimal list-inside space-y-1 text-slate-800 mb-3 text-sm">{children}</ol>,
                      li: ({children}) => <li className="leading-relaxed">{children}</li>,
                      blockquote: ({children}) => (
                        <blockquote className="border-l-4 border-blue-400 bg-blue-50 pl-3 py-2 italic text-slate-700 my-3 text-sm">
                          {children}
                        </blockquote>
                      ),
                      strong: ({children}) => <strong className="font-semibold text-slate-900">{children}</strong>,
                      em: ({children}) => <em className="italic text-slate-700">{children}</em>,
                      code: ({children}) => <code className="bg-slate-100 text-slate-800 px-1.5 py-0.5 rounded text-xs font-mono">{children}</code>,
                      pre: ({children}) => <pre className="bg-slate-900 text-slate-100 p-3 rounded-lg overflow-x-auto my-3 text-xs">{children}</pre>,
                    }}
                  >
                    {substrate.content || 'No content available'}
                  </ReactMarkdown>
                </div>
              </div>

              {/* Metadata */}
              <div className="grid gap-x-6 gap-y-2 text-sm text-slate-600 md:grid-cols-2">
                <div>
                  <span className="font-medium text-slate-700">Confidence:</span> {displayConfidence(substrate.confidence_score)}
                </div>
                <div>
                  <span className="font-medium text-slate-700">Times used:</span> {substrate.times_referenced ?? 0}
                </div>
                <div>
                  <span className="font-medium text-slate-700">Version:</span> {substrate.version ?? 1}
                </div>
                <div>
                  <span className="font-medium text-slate-700">Created:</span> {formatTimestamp(substrate.created_at)}
                </div>
                {substrate.updated_at && (
                  <div className="md:col-span-2">
                    <span className="font-medium text-slate-700">Updated:</span> {formatTimestamp(substrate.updated_at)}
                  </div>
                )}
              </div>

              {/* Knowledge Ingredients - Collapsible */}
              {knowledge && (knowledgeSummary.facts > 0 || knowledgeSummary.goals > 0 || knowledgeSummary.constraints > 0 || knowledgeSummary.metrics > 0 || knowledgeSummary.entities > 0 || knowledgeSummary.insights > 0 || knowledgeSummary.actions > 0) && (
                <details className="group rounded-lg border border-slate-200 bg-slate-50">
                  <summary className="flex items-center justify-between px-4 py-3 cursor-pointer hover:bg-slate-100 rounded-lg">
                    <span className="text-sm font-semibold text-slate-900">Knowledge Ingredients</span>
                    <div className="flex items-center gap-2">
                      {knowledgeSummary.facts > 0 && <span className="text-xs text-slate-600">🧩 {knowledgeSummary.facts}</span>}
                      {knowledgeSummary.goals > 0 && <span className="text-xs text-slate-600">🎯 {knowledgeSummary.goals}</span>}
                      {knowledgeSummary.constraints > 0 && <span className="text-xs text-slate-600">⚠️ {knowledgeSummary.constraints}</span>}
                      {knowledgeSummary.metrics > 0 && <span className="text-xs text-slate-600">📊 {knowledgeSummary.metrics}</span>}
                      <span className="ml-2 text-slate-400 group-open:rotate-180 transition-transform">▼</span>
                    </div>
                  </summary>
                  <div className="px-4 pb-4 pt-2 space-y-3">
                    {renderKnowledgeGroups()}
                  </div>
                </details>
              )}

              {substrate.needs_enrichment && (
                <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
                  ℹ️ This block could benefit from enrichment to extract structured knowledge ingredients.
                </div>
              )}
            </section>

            {(substrate.provenance || knowledge?.provenance) && (
              <section className="space-y-2">
                <h4 className="text-sm font-semibold text-slate-900">Provenance</h4>
                <div className="rounded border border-slate-200 bg-white px-3 py-3 text-sm text-slate-700">
                  {(() => {
                    const provenance = substrate.provenance || knowledge?.provenance;
                    if (!provenance) return null;
                    return (
                      <ul className="list-disc list-inside space-y-1">
                        {provenance.dump_ids && <li>Dump IDs: {provenance.dump_ids.join(', ')}</li>}
                        {provenance.extraction_method && <li>Method: {provenance.extraction_method}</li>}
                        {provenance.confidence !== undefined && <li>Provenance confidence: {Math.round((provenance.confidence || 0) * 100)}%</li>}
                        {provenance.source_hint && <li>Source: {provenance.source_hint}</li>}
                      </ul>
                    );
                  })()}
                </div>
              </section>
            )}

            {substrate.references && substrate.references.length > 0 && (
              <section className="space-y-2">
                <h4 className="text-sm font-semibold text-slate-900">Used in documents</h4>
                <div className="space-y-2">
                  {substrate.references.map((ref) => (
                    <Link
                      key={ref.document_id}
                      href={`/baskets/${basketId}/documents/${ref.document_id}`}
                      className="block rounded border border-blue-100 bg-blue-50/60 px-3 py-2 text-sm text-blue-700 hover:bg-blue-100"
                    >
                      <span className="font-medium">{ref.title}</span>
                      {ref.doc_type && <span className="ml-2 text-xs uppercase tracking-wide">{ref.doc_type}</span>}
                    </Link>
                  ))}
                </div>
              </section>
            )}
          </div>
        );
      }

      case 'context_item':
        return (
          <div className="space-y-4">
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-1">Entity</h4>
              <p className="text-lg font-medium">{substrate.title || substrate.label || 'Unknown Entity'}</p>
            </div>
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-1">Kind</h4>
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                {substrate.kind || substrate.type || 'entity'}
              </span>
            </div>
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-1">Semantic Meaning</h4>
              <div className="bg-gray-50 p-3 rounded text-sm text-gray-800 max-h-64 overflow-y-auto">
                {substrate.content || substrate.semantic_meaning || 'No semantic meaning available'}
              </div>
            </div>
            {substrate.synonyms && substrate.synonyms.length > 0 && (
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-1">Synonyms</h4>
                <div className="flex flex-wrap gap-1">
                  {substrate.synonyms.map((syn, i) => (
                    <span key={i} className="px-2 py-1 bg-gray-100 rounded text-xs">{syn}</span>
                  ))}
                </div>
              </div>
            )}
            {substrate.description && (
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-1">Description</h4>
                <p className="text-sm text-gray-800">{substrate.description}</p>
              </div>
            )}
            <div className="text-sm text-gray-600">
              <span>State: <span className="font-medium">{substrate.state || 'ACTIVE'}</span></span>
            </div>
          </div>
        );

      case 'relationship':
        return (
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-sm">
              <span className="font-medium">From:</span>
              <span className="bg-gray-100 px-2 py-1 rounded">
                {substrate.from_block?.title || substrate.from_block?.semantic_type || 'Block'} ({substrate.from_block?.id?.slice(0, 8)}...)
              </span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <span className="font-medium">Type:</span>
              <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded font-medium">{substrate.relationship_type}</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <span className="font-medium">To:</span>
              <span className="bg-gray-100 px-2 py-1 rounded">
                {substrate.to_block?.title || substrate.to_block?.semantic_type || 'Block'} ({substrate.to_block?.id?.slice(0, 8)}...)
              </span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <span className="font-medium">Confidence:</span>
              <span>{Math.round((substrate.confidence_score ?? 0) * 100)}%</span>
            </div>
            {substrate.inference_method && (
              <div className="flex items-center gap-2 text-sm">
                <span className="font-medium">Inference method:</span>
                <span>{substrate.inference_method}</span>
              </div>
            )}
            {substrate.metadata?.description && (
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-1">Description</h4>
                <p className="text-sm text-gray-800">{substrate.metadata.description}</p>
              </div>
            )}
            {substrate.metadata?.reasoning && (
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-1">Reasoning</h4>
                <p className="text-sm text-gray-800">{substrate.metadata.reasoning}</p>
              </div>
            )}
          </div>
        );

      case 'timeline_event':
        return (
          <div className="space-y-4">
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-1">Event</h4>
              <p className="text-sm font-medium">{substrate.event_kind}</p>
            </div>
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-1">Preview</h4>
              <p className="text-sm">{substrate.preview}</p>
            </div>
            {substrate.ref_id && (
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-1">Reference</h4>
                <code className="text-xs bg-gray-100 px-2 py-1 rounded">{substrate.ref_id}</code>
              </div>
            )}
            <div className="text-sm text-gray-600">
              <span>Time: {formatTimestamp(substrate.created_at)}</span>
            </div>
          </div>
        );
    }
  };

  const renderHistory = () => {
    return (
      <div className="space-y-3">
        {history.map((entry, index) => (
          <div key={index} className="flex items-start gap-3 text-sm">
            <Clock className="h-4 w-4 text-gray-400 mt-0.5" />
            <div className="flex-1">
              <div className="font-medium text-gray-900">{entry.action}</div>
              <div className="text-gray-600">
                {formatTimestamp(entry.timestamp)}
                {entry.agent && <span> by {entry.agent}</span>}
              </div>
              {entry.details && <div className="text-gray-500 mt-1">{entry.details}</div>}
            </div>
          </div>
        ))}
      </div>
    );
  };

  const renderSettings = () => {
    if (substrateType !== 'block') {
      return (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <Database className="h-12 w-12 text-slate-300 mb-4" />
          <p className="text-sm text-slate-500">
            Settings are only available for blocks.
          </p>
        </div>
      );
    }

    const renderActionError = () => (
      actionError && (
        <div className="rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
          {actionError}
        </div>
      )
    );

    return (
      <div className="space-y-6">
        {/* Actions Section */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-slate-200">
            <h3 className="text-base font-semibold text-slate-900">Block Actions</h3>
          </div>

          {/* Edit Block Section */}
          <section className="rounded-lg border border-slate-200 bg-white p-4 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-sm font-semibold text-slate-900">Edit Block</h4>
                <p className="text-xs text-slate-500 mt-0.5">Update the title or content</p>
              </div>
              <Button
                size="sm"
                variant={blockAction === 'edit' ? 'default' : 'outline'}
                onClick={() => toggleBlockAction('edit')}
              >
                {blockAction === 'edit' ? 'Editing' : 'Edit'}
              </Button>
            </div>

          {blockAction === 'edit' && (
            <div className="space-y-3 pt-2 border-t border-slate-100">
              <div>
                <label className="text-sm font-medium text-slate-700 mb-1 block">Title</label>
                <Input
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  placeholder="Block title"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700 mb-1 block">Content</label>
                <textarea
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  placeholder="Block content"
                  className="w-full min-h-[160px] rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              {renderActionError()}
              <div className="flex justify-end gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => toggleBlockAction('edit')}
                  disabled={actionLoading}
                >
                  Cancel
                </Button>
                <Button
                  size="sm"
                  onClick={handleSaveEdit}
                  disabled={actionLoading || !editTitle.trim() || !editContent.trim()}
                >
                  {actionLoading ? 'Saving…' : 'Save new version'}
                </Button>
              </div>
            </div>
          )}
        </section>

          {/* Update Tags Section */}
          <section className="rounded-lg border border-slate-200 bg-white p-4 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-sm font-semibold text-slate-900">Update Tags</h4>
                <p className="text-xs text-slate-500 mt-0.5">Modify semantic type and anchor role</p>
              </div>
              <Button
                size="sm"
                variant={blockAction === 'retag' ? 'default' : 'outline'}
                onClick={() => toggleBlockAction('retag')}
              >
                {blockAction === 'retag' ? 'Updating' : 'Update'}
              </Button>
            </div>

          {blockAction === 'retag' && (
            <div className="space-y-3 pt-2 border-t border-slate-100">
              <div>
                <label className="text-sm font-medium text-slate-700 mb-1 block">Semantic Type</label>
                <select
                  value={retagSemanticType}
                  onChange={(e) => setRetagSemanticType(e.target.value)}
                  className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  {SEMANTIC_TYPE_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700 mb-1 block">Anchor Role (optional)</label>
                <Input
                  value={retagAnchorRole}
                  onChange={(e) => setRetagAnchorRole(e.target.value)}
                  placeholder="e.g., project_constraint, stakeholder_need"
                />
                <div className="mt-2 flex flex-wrap gap-2 text-xs">
                  {ANCHOR_SUGGESTIONS.map((role) => (
                    <button
                      key={role}
                      type="button"
                      className={`rounded-full border px-2 py-1 ${retagAnchorRole === role ? 'border-amber-400 bg-amber-50 text-amber-700' : 'border-slate-200 bg-slate-50 text-slate-600 hover:border-slate-300'}`}
                      onClick={() => setRetagAnchorRole(role)}
                    >
                      {role}
                    </button>
                  ))}
                  <span className="text-slate-400">or type a custom role</span>
                </div>
              </div>
              {renderActionError()}
              <div className="flex justify-end gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => toggleBlockAction('retag')}
                  disabled={actionLoading}
                >
                  Cancel
                </Button>
                <Button
                  size="sm"
                  onClick={handleSaveRetag}
                  disabled={actionLoading}
                >
                  {actionLoading ? 'Updating…' : 'Update tags'}
                </Button>
              </div>
            </div>
          )}
        </section>

        {/* Danger Zone */}
        <section className="rounded-lg border border-rose-200 bg-rose-50 p-4 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-sm font-semibold text-rose-900">Danger Zone</h4>
              <p className="text-xs text-rose-700 mt-1">Irreversible actions</p>
            </div>
            <Button
              size="sm"
              variant={blockAction === 'archive' ? 'destructive' : 'outline'}
              onClick={() => toggleBlockAction('archive')}
            >
              {blockAction === 'archive' ? 'Confirm?' : 'Archive'}
            </Button>
          </div>

          {blockAction === 'archive' && (
            <div className="space-y-3 pt-2 border-t border-rose-200">
              <p className="text-sm text-rose-700">
                Archiving removes this block from active memory but preserves a tombstone. Downstream documents may need regeneration if they reference it.
              </p>
              {renderActionError()}
              <div className="flex justify-end gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => toggleBlockAction('archive')}
                  disabled={actionLoading}
                >
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={handleArchiveBlock}
                  disabled={actionLoading}
                >
                  {actionLoading ? 'Archiving…' : 'Confirm archive'}
                </Button>
              </div>
            </div>
          )}
        </section>
        </div>
      </div>
    );
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[80vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="border-b border-gray-200 p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {getIcon()}
            <h3 className="text-lg font-medium text-gray-900">{getTitle()}</h3>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => copyToClipboard(substrateId)}
              className="flex items-center gap-1.5 text-gray-600 hover:text-gray-900"
              title="Copy substrate ID"
            >
              <Copy className="h-3.5 w-3.5" />
              <span className="text-xs">Copy ID</span>
            </Button>
            <Button variant="ghost" size="sm" onClick={onClose} title="Close modal (or click outside)">
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200">
          <div className="flex">
            <button
              className={`px-4 py-2 text-sm font-medium border-b-2 ${
                activeTab === 'content'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
              onClick={() => setActiveTab('content')}
            >
              Content
            </button>
            <button
              className={`px-4 py-2 text-sm font-medium border-b-2 ${
                activeTab === 'history'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
              onClick={() => setActiveTab('history')}
            >
              History
            </button>
            {substrateType === 'block' && (
              <button
                className={`px-4 py-2 text-sm font-medium border-b-2 ${
                  activeTab === 'settings'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
                onClick={() => setActiveTab('settings')}
              >
                Settings
              </button>
            )}
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6">
          {activeTab === 'content' ? renderContent() : activeTab === 'history' ? renderHistory() : renderSettings()}
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 p-4 flex items-center justify-end">
          <Button variant="outline" size="sm" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </div>
  );
}
