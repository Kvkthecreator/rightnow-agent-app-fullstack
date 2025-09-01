/**
 * YARNNN P4 Presentation Pipeline - Document Composer
 * 
 * Sacred Principle #3: "Narrative is Deliberate"
 * Documents = substrate references + authored prose
 * 
 * Canon v1.4.0 Compliance:
 * - P4 consumes substrate, never creates it
 * - Any substrate type can be referenced (no hierarchy)
 * - Narrative provides coherent story atop substrate signals
 */

import { createRouteHandlerClient } from "@/lib/supabase/clients";
import { PipelineBoundaryGuard } from "@/lib/canon/PipelineBoundaryGuard";
import { routeChange } from "@/lib/governance/decisionGateway";
import type { ChangeDescriptor } from "@/lib/governance/changeDescriptor";

export interface SubstrateReference {
  id: string;
  type: 'raw_dump' | 'context_block' | 'context_item' | 'timeline_event' | 'reflection';
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

      // Create document composition through governance (follows Sacred Principle #1)
      const changeDescriptor: ChangeDescriptor = {
        entry_point: 'document_edit',
        actor_id: composition.author_id,
        workspace_id: composition.workspace_id,
        basket_id: composition.basket_id,
        blast_radius: 'Global', // Document composition affects workspace-level narrative
        ops: [{
          type: 'DocumentCompose',
          data: {
            title: composition.title,
            substrate_references: composition.substrate_references,
            narrative_sections: composition.narrative_sections,
            composition_type: 'substrate_plus_narrative'
          }
        }],
        provenance: [
          { type: 'user', id: composition.author_id },
          { type: 'pipeline', id: 'P4_PRESENTATION' }
        ]
      };

      // Route through governance (respects workspace governance settings)
      const result = await routeChange(supabase, changeDescriptor);

      if (result.committed) {
        // Direct composition committed
        return {
          success: true,
          document: {
            id: `doc-${Date.now()}`, // Generate document ID
            title: composition.title,
            composition,
            created_at: new Date().toISOString(),
            created_by: composition.author_id
          }
        };
      } else if (result.proposal_id) {
        // Composition sent to governance for review
        return {
          success: false,
          error: `Document composition requires approval. Proposal ID: ${result.proposal_id}`
        };
      } else {
        return {
          success: false,
          error: 'Failed to process document composition'
        };
      }

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

      // Add reference through governance
      const changeDescriptor: ChangeDescriptor = {
        entry_point: 'document_edit',
        actor_id,
        workspace_id,
        blast_radius: 'Local', // Adding reference is local to document
        ops: [{
          type: 'DocumentAddReference',
          data: {
            document_id,
            substrate_reference: substrate_ref
          }
        }],
        provenance: [
          { type: 'user', id: actor_id },
          { type: 'doc', id: document_id },
          { type: 'pipeline', id: 'P4_PRESENTATION' }
        ]
      };

      const result = await routeChange(supabase, changeDescriptor);

      return {
        success: result.committed || !!result.proposal_id,
        error: result.committed ? undefined : `Reference addition requires approval. Proposal: ${result.proposal_id}`
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
          case 'raw_dump':
            const { data: dump } = await supabase
              .from('raw_dumps')
              .select('id')
              .eq('id', ref.id)
              .eq('workspace_id', workspace_id)
              .single();
            exists = !!dump;
            break;

          case 'context_block':
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

          case 'reflection':
            // Reflections are computed read-models, validate via reflection cache
            const { data: reflection } = await supabase
              .from('reflection_cache')
              .select('id')
              .eq('id', ref.id)
              .eq('workspace_id', workspace_id)
              .single();
            exists = !!reflection;
            break;

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

      // Get resolved substrate references (P4 consumption, not creation)
      const resolvedRefs = await this.resolveSubstrateReferences(
        document.substrate_references || [],
        workspace_id,
        supabase
      );

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
          case 'raw_dump':
            const { data: dump } = await supabase
              .from('raw_dumps')
              .select('*')
              .eq('id', ref.id)
              .eq('workspace_id', workspace_id)
              .single();
            data = dump;
            break;

          case 'context_block':
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

          case 'reflection':
            const { data: reflection } = await supabase
              .from('reflection_cache')
              .select('*')
              .eq('id', ref.id)
              .eq('workspace_id', workspace_id)
              .single();
            data = reflection;
            break;
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