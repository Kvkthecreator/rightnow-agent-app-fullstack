import { createServerSupabaseClient } from "@/lib/supabaseServerClient";
import { ensureWorkspaceServer } from "@/lib/workspaces/ensureWorkspaceServer";
import { getBasketServer } from "@/lib/server/baskets";
import { getDocumentsServer } from "@/lib/server/documents";

// Clean data fetching utilities for baskets work
export async function getBasketData(basketId: string) {
  try {
    const supabase = createServerSupabaseClient();
    
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      // In development, provide mock data
      if (process.env.NODE_ENV === 'development') {
        console.warn('No user found, using mock basket data for development');
        return getMockBasketData(basketId);
      }
      return null;
    }

    const workspace = await ensureWorkspaceServer(supabase);
    const workspaceId = workspace?.id;

    if (!workspaceId) {
      // In development, provide mock data
      if (process.env.NODE_ENV === 'development') {
        console.warn('No workspace found, using mock basket data for development');
        return getMockBasketData(basketId);
      }
      return null;
    }

    const basket = await getBasketServer(basketId, workspaceId);
    
    if (!basket) {
      // In development, provide mock data
      if (process.env.NODE_ENV === 'development') {
        console.warn('Basket not found, using mock basket data for development');
        return getMockBasketData(basketId);
      }
      return null;
    }

    return {
      id: basketId,
      name: basket.name ?? "Untitled",
      status: basket.status ?? "ACTIVE",
      createdAt: basket.created_at || new Date().toISOString(),
      workspace: { id: workspaceId }
    };
  } catch (error) {
    console.error('Error fetching basket data:', error);
    // In development, provide mock data as fallback
    if (process.env.NODE_ENV === 'development') {
      console.warn('API error, using mock basket data for development');
      return getMockBasketData(basketId);
    }
    return null;
  }
}

export async function getBasketDocuments(basketId: string) {
  try {
    const supabase = createServerSupabaseClient();
    
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      // In development, provide mock data
      if (process.env.NODE_ENV === 'development') {
        console.warn('No user found, using mock documents for development');
        return getMockDocuments();
      }
      return [];
    }

    const workspace = await ensureWorkspaceServer(supabase);
    const workspaceId = workspace?.id;

    if (!workspaceId) {
      // In development, provide mock data
      if (process.env.NODE_ENV === 'development') {
        console.warn('No workspace found, using mock documents for development');
        return getMockDocuments();
      }
      return [];
    }

    const docs = await getDocumentsServer(workspaceId);
    
    // Filter documents by basketId to ensure consistency with dashboard metrics
    const basketDocs = docs?.filter(doc => doc.basket_id === basketId) || [];
    
    console.log(`📊 Filtered documents for basket ${basketId}:`, {
      totalWorkspaceDocs: docs?.length || 0,
      basketSpecificDocs: basketDocs.length
    });
    
    return basketDocs;
  } catch (error) {
    console.error('Error fetching documents:', error);
    // In development, provide mock data as fallback
    if (process.env.NODE_ENV === 'development') {
      console.warn('API error, using mock documents for development');
      return getMockDocuments();
    }
    return [];
  }
}

export async function getDocument(basketId: string, documentId: string) {
  try {
    const documents = await getBasketDocuments(basketId);
    return documents.find(doc => doc.id === documentId) || null;
  } catch (error) {
    console.error('Error fetching document:', error);
    return null;
  }
}

export async function getUserAndWorkspace() {
  try {
    const supabase = createServerSupabaseClient();
    
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { user: null, workspace: null };
    }

    const workspace = await ensureWorkspaceServer(supabase);
    
    return { user, workspace };
  } catch (error) {
    console.error('Error fetching user and workspace:', error);
    return { user: null, workspace: null };
  }
}

// Helper for development/fallback data
export function getMockBasketData(basketId: string) {
  return {
    id: basketId,
    name: 'Strategic Planning Project',
    status: 'ACTIVE',
    createdAt: new Date().toISOString(),
    workspace: { id: 'mock-workspace-id' }
  };
}

export function getMockDocuments() {
  return [
    {
      id: 'doc-1',
      title: 'Project Strategy Overview',
      basket_id: 'mock-basket-id',
      content_raw: '# Project Strategy\n\nThis document outlines our strategic approach...',
      document_type: 'strategic-analysis',
      workspace_id: 'mock-workspace-id',
      created_at: new Date(Date.now() - 172800000).toISOString(), // 2 days ago
      updated_at: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
      metadata: { wordCount: 1247 }
    },
    {
      id: 'doc-2', 
      title: 'Market Research Findings',
      basket_id: 'mock-basket-id',
      content_raw: '# Market Research\n\nKey findings from our market analysis...',
      document_type: 'research-notes',
      workspace_id: 'mock-workspace-id',
      created_at: new Date(Date.now() - 259200000).toISOString(), // 3 days ago
      updated_at: new Date(Date.now() - 172800000).toISOString(), // 2 days ago
      metadata: { wordCount: 892 }
    },
    {
      id: 'doc-3',
      title: 'Implementation Plan',
      basket_id: 'mock-basket-id',
      content_raw: '# Implementation\n\nDetailed plan for executing our strategy...',
      document_type: 'project-plan',
      workspace_id: 'mock-workspace-id',
      created_at: new Date(Date.now() - 345600000).toISOString(), // 4 days ago
      updated_at: new Date(Date.now() - 259200000).toISOString(), // 3 days ago
      metadata: { wordCount: 1563 }
    }
  ];
}