/**
 * YARNNN P4 Presentation Pipeline - Document Composer Component
 * 
 * Sacred Principle #3: "Narrative is Deliberate"
 * Implements canonical "Documents = substrate references + authored prose"
 * 
 * P4 Pipeline Rules:
 * - Consumes substrate, never creates it
 * - Any substrate type can be referenced (substrate equality)
 * - Narrative provides coherent story atop substrate signals
 */

'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { apiClient } from '@/lib/api/client';

interface SubstrateReference {
  id: string;
  type: 'raw_dump' | 'context_block' | 'context_item' | 'timeline_event' | 'reflection';
  title?: string;
  content?: string;
  excerpt?: string;
  order: number;
}

interface NarrativeSection {
  id: string;
  content: string;
  order: number;
  title?: string;
}

interface DocumentComposerProps {
  basketId: string;
  workspaceId: string;
  onDocumentCreated?: (documentId: string) => void;
}

/**
 * P4 Document Composer - Implements Sacred Principle #3
 * 
 * Allows users to compose documents from:
 * 1. Substrate references (any type - substrate equality)
 * 2. Authored narrative prose
 */
export function DocumentComposer({ basketId, workspaceId, onDocumentCreated }: DocumentComposerProps) {
  const [title, setTitle] = useState('');
  const [narrativeSections, setNarrativeSections] = useState<NarrativeSection[]>([
    { id: 'main', content: '', order: 1, title: 'Main Section' }
  ]);
  const [substrateReferences, setSubstrateReferences] = useState<SubstrateReference[]>([]);
  const [availableSubstrate, setAvailableSubstrate] = useState<any[]>([]);
  const [isComposing, setIsComposing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load available substrate for reference (P4 consumption, not creation)
  useEffect(() => {
    loadAvailableSubstrate();
  }, [basketId]);

  async function loadAvailableSubstrate() {
    try {
      // Load all substrate types equally (Sacred Principle #2: All Substrates are Peers)
      const [dumps, blocks, contextItems, events] = await Promise.all([
        apiClient.request(`/api/baskets/${basketId}?type=raw_dumps`),
        apiClient.request(`/api/baskets/${basketId}?type=context_blocks`),
        apiClient.request(`/api/baskets/${basketId}?type=context_items`),
        apiClient.request(`/api/baskets/${basketId}/timeline`)
      ]);

      const substrate = [
        ...(dumps as any)?.data?.map((d: any) => ({ ...d, substrate_type: 'raw_dump' })) || [],
        ...(blocks as any)?.data?.map((b: any) => ({ ...b, substrate_type: 'context_block' })) || [],
        ...(contextItems as any)?.data?.map((c: any) => ({ ...c, substrate_type: 'context_item' })) || [],
        ...(events as any)?.data?.map((e: any) => ({ ...e, substrate_type: 'timeline_event' })) || []
      ];

      setAvailableSubstrate(substrate);
    } catch (error) {
      console.error('Failed to load substrate:', error);
    }
  }

  function addNarrativeSection() {
    const newSection: NarrativeSection = {
      id: `section-${Date.now()}`,
      content: '',
      order: narrativeSections.length + 1,
      title: `Section ${narrativeSections.length + 1}`
    };
    setNarrativeSections([...narrativeSections, newSection]);
  }

  function updateNarrativeSection(id: string, field: keyof NarrativeSection, value: string | number) {
    setNarrativeSections(sections =>
      sections.map(section =>
        section.id === id ? { ...section, [field]: value } : section
      )
    );
  }

  function addSubstrateReference(substrate: any) {
    const ref: SubstrateReference = {
      id: substrate.id,
      type: substrate.substrate_type,
      title: substrate.title || substrate.label || substrate.kind,
      content: substrate.content || substrate.text_dump || substrate.preview,
      order: substrateReferences.length + 1
    };
    setSubstrateReferences([...substrateReferences, ref]);
  }

  function removeSubstrateReference(id: string) {
    setSubstrateReferences(refs => refs.filter(ref => ref.id !== id));
  }

  async function composeDocument() {
    if (!title.trim()) {
      setError('Document title is required');
      return;
    }

    if (narrativeSections.every(section => !section.content.trim())) {
      setError('At least one narrative section with content is required (authored prose)');
      return;
    }

    setIsComposing(true);
    setError(null);

    try {
      // Call canonical /api/work endpoint with P4_COMPOSE work type
      const response = await apiClient.request('/api/work', {
        method: 'POST',
        body: JSON.stringify({
          work_type: 'P4_COMPOSE',
          work_payload: {
            operations: [{
              type: 'compose_document',
              data: {
                title,
                substrate_references: substrateReferences,
                narrative_sections: narrativeSections,
                workspace_id: workspaceId
              }
            }],
            basket_id: basketId,
            confidence_score: 0.95, // High confidence for manual composition
            user_override: 'allow_auto'
          },
          priority: 'normal'
        })
      }) as any;

      if (response.success && response.work_id) {
        // Document composition is now async via universal work orchestration
        onDocumentCreated?.(response.work_id); // Pass work_id for tracking
        // Reset form
        setTitle('');
        setNarrativeSections([{ id: 'main', content: '', order: 1, title: 'Main Section' }]);
        setSubstrateReferences([]);
      } else {
        setError(response.error || 'Failed to initiate document composition');
      }

    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to compose document');
    } finally {
      setIsComposing(false);
    }
  }

  const compositionType = 
    substrateReferences.length === 0 ? 'pure_narrative' :
    narrativeSections.every(s => !s.content.trim()) ? 'substrate_only' :
    'substrate_plus_narrative';

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>P4 Document Composer</CardTitle>
          <p className="text-sm text-muted-foreground">
            Sacred Principle #3: Documents = substrate references + authored prose
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Document Title */}
          <div>
            <label className="block text-sm font-medium mb-2">Document Title</label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter document title..."
              className="w-full"
            />
          </div>

          {/* Composition Type Indicator */}
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">Composition Type:</span>
            <Badge variant="outline">{compositionType}</Badge>
            <Badge variant="secondary">P4_PRESENTATION</Badge>
          </div>

          {/* Narrative Sections (Authored Prose) */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="block text-sm font-medium">Narrative Sections (Authored Prose)</label>
              <Button onClick={addNarrativeSection} size="sm" variant="outline">
                Add Section
              </Button>
            </div>
            
            {narrativeSections.map((section, index) => (
              <Card key={section.id} className="mb-3">
                <CardContent className="pt-4">
                  <Input
                    value={section.title || ''}
                    onChange={(e) => updateNarrativeSection(section.id, 'title', e.target.value)}
                    placeholder="Section title..."
                    className="mb-2"
                  />
                  <Textarea
                    value={section.content}
                    onChange={(e) => updateNarrativeSection(section.id, 'content', e.target.value)}
                    placeholder="Write your narrative prose here..."
                    rows={4}
                    className="w-full"
                  />
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Substrate References (Equal Treatment) */}
          <div>
            <label className="block text-sm font-medium mb-3">
              Substrate References (All Types Equal)
            </label>
            
            {/* Available Substrate */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mb-4 max-h-40 overflow-y-auto">
              {availableSubstrate.map((substrate) => (
                <Card 
                  key={substrate.id} 
                  className="p-3 cursor-pointer hover:bg-accent"
                  onClick={() => addSubstrateReference(substrate)}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <Badge variant="secondary" className="text-xs">
                        {substrate.substrate_type}
                      </Badge>
                      <p className="text-sm font-medium truncate mt-1">
                        {substrate.title || substrate.label || substrate.kind || 'Untitled'}
                      </p>
                    </div>
                    <Button size="sm" variant="ghost">Add</Button>
                  </div>
                </Card>
              ))}
            </div>

            {/* Selected References */}
            {substrateReferences.length > 0 && (
              <div className="space-y-2">
                <p className="text-sm font-medium">Selected References:</p>
                {substrateReferences.map((ref) => (
                  <div key={ref.id} className="flex items-center justify-between p-2 bg-accent rounded">
                    <div>
                      <Badge variant="outline" className="text-xs">{ref.type}</Badge>
                      <span className="ml-2 text-sm">{ref.title}</span>
                    </div>
                    <Button 
                      size="sm" 
                      variant="ghost"
                      onClick={() => removeSubstrateReference(ref.id)}
                    >
                      Remove
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Error Display */}
          {error && (
            <div className="p-3 bg-destructive/10 border border-destructive/20 rounded text-destructive text-sm">
              {error}
            </div>
          )}

          {/* Compose Button */}
          <div className="flex justify-end">
            <Button 
              onClick={composeDocument}
              disabled={isComposing || !title.trim()}
              className="min-w-32"
            >
              {isComposing ? 'Composing...' : 'Compose Document'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}