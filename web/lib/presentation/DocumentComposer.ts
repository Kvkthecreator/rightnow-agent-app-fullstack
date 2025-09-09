/**
 * YARNNN P4 Presentation Pipeline - Document Composer
 * 
 * Sacred Principle #3: "Narrative is Deliberate"
 * Documents = substrate references + authored prose
 * 
 * Canon v2.0 Compliance:
 * - P4 consumes pure substrates, generates document artifacts
 * - Substrate types: block, dump, context_item, timeline_event
 * - Reflections are artifacts, not substrate references
 */

import { createRouteHandlerClient } from "@/lib/supabase/clients";
import { PipelineBoundaryGuard } from "@/lib/canon/PipelineBoundaryGuard";
import { routeChange } from "@/lib/governance/decisionGateway";
import type { ChangeDescriptor } from "@/lib/governance/changeDescriptor";

export interface SubstrateReference {
  id: string;
  type: 'dump' | 'block' | 'context_item' | 'timeline_event';
  excerpt?: string;
  order: number;
}

export interface NarrativeSection {
  id: string;
  content: string;
  order: number;
  title?: string;
}

export interface DocumentComposition {
  title: string;
  substrate_references: SubstrateReference[];
  narrative_sections: NarrativeSection[];
  workspace_id: string;
  basket_id?: string;
  author_id: string;
  document_type?: string; // e.g., 'narrative' | 'plan' | 'brief'
  composition_context?: Record<string, any>; // intent, window, pinned, etc.
  composition_signature?: string; // duplication control hash
}

export interface ComposedDocument {
  id: string;
  title: string;
  composition: DocumentComposition;
  created_at: string;
  created_by: string;
}

/**
 * P4 Presentation Pipeline Implementation
 * 
 * Implements Sacred Principle #3: "Narrative is Deliberate"
 * - Documents compose substrate references plus authored prose
 * - Never creates substrate, only composes existing substrate
 * - Respects substrate equality (any type can be referenced)
 */
export class DocumentComposer {
  
  /**
   * Compose a document from substrate references + authored narrative
   * 
   * This is the canonical P4 operation that implements:
   * "Documents = substrate references + narrative"
   */
  static async composeDocument(
    composition: DocumentComposition,
    supabase: any
  ): Promise<{ success: boolean; document?: ComposedDocument; error?: string }> {
    
    try {
      // P4 Boundary Guard: Ensure we're only composing, not creating substrate
      PipelineBoundaryGuard.enforceP4Presentation({
        type: 'compose_document',
        data: composition,
        emitsEvents: ['document.composed', 'narrative.authored']
      });

      // Basic validation
      if (!composition.basket_id) {
        return { success: false, error: 'basket_id is required for document composition' };
      }

      if (!composition.narrative_sections || composition.narrative_sections.length === 0) {
        return { success: false, error: 'At least one narrative section is required' };
      }

      // Validate substrate references exist and are accessible
      const validationResult = await this.validateSubstrateReferences(
        composition.substrate_references,
        composition.workspace_id,
        supabase
      );

      if (!validationResult.valid) {
        return {
          success: false,
          error: `Invalid substrate references: ${validationResult.errors.join(', ')}`
        };
      }

      // Build raw content from narrative sections (ordered)
      const prose = [...composition.narrative_sections]
        .sort((a, b) => a.order - b.order)
        .map(s => s.content)
        .join('\n\n');

      // Create document artifact (P4-only)
      const { data: documentId, error: createErr } = await supabase.rpc('fn_document_create', {
        p_basket_id: composition.basket_id,
        p_title: composition.title,
        p_content_raw: prose,
        p_document_type: composition.document_type || 'narrative',
        p_metadata: {
          composition_context: composition.composition_context || {},
          composition_signature: composition.composition_signature || null,
          composition_type: 'substrate_plus_narrative'
        }
      });

      if (createErr || !documentId) {
        return { success: false, error: `Failed to create document: ${createErr?.message || 'unknown error'}` };
      }

      // Attach substrate references (generic)
      for (const ref of [...composition.substrate_references].sort((a, b) => a.order - b.order)) {
        const { error: attachErr } = await supabase.rpc('fn_document_attach_substrate', {
          p_document_id: documentId,
          p_substrate_type: ref.type,
          p_substrate_id: ref.id,
          p_role: 'reference',
          p_weight: 0.5,
          p_snippets: ref.excerpt ? [ref.excerpt] : [],
          p_metadata: { order: ref.order }
        });
        if (attachErr) {
          // Continue attaching others; collect errors if needed
          console.warn(`Failed to attach reference ${ref.type}:${ref.id} →`, attachErr.message);
        }
      }

      // Create initial version snapshot (idempotent by content hash)
      const versionMessage = 'Initial composition';
      const { data: versionHash, error: versionErr } = await supabase.rpc('fn_document_create_version', {
        p_document_id: documentId,
        p_content: prose,
        p_version_message: versionMessage
      });
      if (versionErr) {
        console.warn('Version creation failed:', versionErr.message);
      }

      // Fetch composed document for return
      const { data: docRow, error: docErr } = await supabase
        .from('documents')
        .select('*')
        .eq('id', documentId)
        .single();
      if (docErr || !docRow) {
        return { success: false, error: 'Document created but not retrievable' };
      }

      const composed: ComposedDocument = {
        id: docRow.id,
        title: docRow.title,
        composition,
        created_at: docRow.created_at,
        created_by: docRow.created_by || composition.author_id
      };

      return { success: true, document: composed };

    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown composition error'
      };
    }
  }

  /**
   * Create narrative-only document (authored prose without substrate references)
   */
  static async createNarrative(
    title: string,
    narrative_sections: NarrativeSection[],
    workspace_id: string,
    author_id: string,
    basket_id?: string,
    supabase?: any
  ): Promise<{ success: boolean; document?: ComposedDocument; error?: string }> {
    
    // This is still P4 but pure narrative (no substrate references)
    return this.composeDocument({
      title,
      substrate_references: [], // Pure narrative
      narrative_sections,
      workspace_id,
      basket_id,
      author_id
    }, supabase);
  }

  /**
   * Add substrate reference to existing document
   * 
   * P4 operation: consume existing substrate for composition
   */
  static async addSubstrateReference(
    document_id: string,
    substrate_ref: SubstrateReference,
    workspace_id: string,
    actor_id: string,
    supabase: any
  ): Promise<{ success: boolean; error?: string }> {
    
    try {
      PipelineBoundaryGuard.enforceP4Presentation({
        type: 'attach_reference',
        data: { document_id, substrate_ref },
        emitsEvents: ['document.updated']
      });

      // Validate the substrate reference exists
      const validationResult = await this.validateSubstrateReferences(
        [substrate_ref],
        workspace_id,
        supabase
      );

      if (!validationResult.valid) {
        return {
          success: false,
          error: `Invalid substrate reference: ${validationResult.errors.join(', ')}`
        };
      }

      // TODO: Canon v2.0 - Documents are artifacts, not substrates
      // This needs to be refactored to use P4 presentation pipeline instead of substrate governance
      return {
        success: false,
        error: 'Document reference addition temporarily disabled during canon v2.0 transition. Documents are now artifacts managed by P4 pipeline.'
      };

    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to add substrate reference'
      };
    }
  }

  /**
   * Validate that substrate references exist and are accessible
   * 
   * Ensures P4 only consumes existing substrate (never creates)
   */
  private static async validateSubstrateReferences(
    references: SubstrateReference[],
    workspace_id: string,
    supabase: any
  ): Promise<{ valid: boolean; errors: string[] }> {
    
    const errors: string[] = [];

    for (const ref of references) {
      try {
        let exists = false;

        // Check each substrate type (respecting substrate equality)
        switch (ref.type) {
          case 'dump':
            const { data: dump } = await supabase
              .from('raw_dumps')
              .select('id')
              .eq('id', ref.id)
              .eq('workspace_id', workspace_id)
              .single();
            exists = !!dump;
            break;

          case 'block':
            const { data: block } = await supabase
              .from('context_blocks')
              .select('id')
              .eq('id', ref.id)
              .eq('workspace_id', workspace_id)
              .single();
            exists = !!block;
            break;

          case 'context_item':
            const { data: item } = await supabase
              .from('context_items')
              .select('id')
              .eq('id', ref.id)
              .eq('workspace_id', workspace_id)
              .single();
            exists = !!item;
            break;

          case 'timeline_event':
            const { data: event } = await supabase
              .from('timeline_events')
              .select('id')
              .eq('id', ref.id)
              .eq('workspace_id', workspace_id)
              .single();
            exists = !!event;
            break;

          // Note: Reflections are now artifacts, not substrate references

          default:
            errors.push(`Unknown substrate type: ${ref.type}`);
            continue;
        }

        if (!exists) {
          errors.push(`Substrate reference not found: ${ref.type}:${ref.id}`);
        }

      } catch (error) {
        errors.push(`Failed to validate ${ref.type}:${ref.id} - ${error}`);
      }
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * Get document with resolved substrate references
   * 
   * P4 read operation: compose view without creating substrate
   */
  static async getDocumentWithReferences(
    document_id: string,
    workspace_id: string,
    supabase: any
  ): Promise<{ success: boolean; document?: any; error?: string }> {
    
    try {
      // Get document
      const { data: document, error: docError } = await supabase
        .from('documents')
        .select('*')
        .eq('id', document_id)
        .eq('workspace_id', workspace_id)
        .single();

      if (docError || !document) {
        return {
          success: false,
          error: 'Document not found'
        };
      }

      // Load substrate references for this document (P4 consumption, not creation)
      const { data: refs, error: refsErr } = await supabase
        .from('substrate_references')
        .select('substrate_id, substrate_type, metadata, snippets, role, weight, created_at')
        .eq('document_id', document_id)
        .order('created_at', { ascending: true });
      if (refsErr) {
        return { success: false, error: 'Failed to load document references' };
      }

      const references: SubstrateReference[] = (refs || []).map((r: any, idx: number) => ({
        id: r.substrate_id,
        type: r.substrate_type,
        order: r.metadata?.order ?? idx,
        excerpt: Array.isArray(r.snippets) && r.snippets.length > 0 ? r.snippets[0] : undefined
      }));

      const resolvedRefs = await this.resolveSubstrateReferences(references, workspace_id, supabase);

      return {
        success: true,
        document: {
          ...document,
          resolved_substrate: resolvedRefs,
          composition_type: 'substrate_plus_narrative'
        }
      };

    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get document'
      };
    }
  }

  /**
   * Resolve substrate references for document composition
   * 
   * P4 operation: read substrate for composition (never modify)
   */
  private static async resolveSubstrateReferences(
    references: SubstrateReference[],
    workspace_id: string,
    supabase: any
  ): Promise<any[]> {
    
    const resolved = [];

    for (const ref of references) {
      try {
        let data = null;

        // Equal treatment for all substrate types (Sacred Principle #2)
        switch (ref.type) {
          case 'dump':
            const { data: dump } = await supabase
              .from('raw_dumps')
              .select('*')
              .eq('id', ref.id)
              .eq('workspace_id', workspace_id)
              .single();
            data = dump;
            break;

          case 'block':
            const { data: block } = await supabase
              .from('context_blocks')
              .select('*')
              .eq('id', ref.id)
              .eq('workspace_id', workspace_id)
              .single();
            data = block;
            break;

          case 'context_item':
            const { data: item } = await supabase
              .from('context_items')
              .select('*')
              .eq('id', ref.id)
              .eq('workspace_id', workspace_id)
              .single();
            data = item;
            break;

          case 'timeline_event':
            const { data: event } = await supabase
              .from('timeline_events')
              .select('*')
              .eq('id', ref.id)
              .eq('workspace_id', workspace_id)
              .single();
            data = event;
            break;

          // Note: Reflections are now artifacts, not substrate references
        }

        if (data) {
          resolved.push({
            reference: ref,
            substrate: data,
            resolved_at: new Date().toISOString()
          });
        }

      } catch (error) {
        console.warn(`Failed to resolve substrate reference ${ref.type}:${ref.id}`, error);
      }
    }

    return resolved;
  }
}
