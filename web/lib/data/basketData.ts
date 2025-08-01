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
      return null;
    }

    const workspace = await ensureWorkspaceServer(supabase);
    const workspaceId = workspace?.id;

    if (!workspaceId) {
      return null;
    }

    const basket = await getBasketServer(basketId, workspaceId);
    
    if (!basket) {
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
      return [];
    }

    const workspace = await ensureWorkspaceServer(supabase);
    const workspaceId = workspace?.id;

    if (!workspaceId) {
      return [];
    }

    const docs = await getDocumentsServer(workspaceId);
    
    // Filter documents by basketId if needed
    // For now, return all documents associated with the workspace
    return docs || [];
  } catch (error) {
    console.error('Error fetching documents:', error);
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
      content: '# Project Strategy\n\nThis document outlines our strategic approach...',
      updated_at: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
      created_at: new Date(Date.now() - 172800000).toISOString(), // 2 days ago
      wordCount: 1247
    },
    {
      id: 'doc-2', 
      title: 'Market Research Findings',
      content: '# Market Research\n\nKey findings from our market analysis...',
      updated_at: new Date(Date.now() - 172800000).toISOString(), // 2 days ago
      created_at: new Date(Date.now() - 259200000).toISOString(), // 3 days ago
      wordCount: 892
    },
    {
      id: 'doc-3',
      title: 'Implementation Plan',
      content: '# Implementation\n\nDetailed plan for executing our strategy...',
      updated_at: new Date(Date.now() - 259200000).toISOString(), // 3 days ago
      created_at: new Date(Date.now() - 345600000).toISOString(), // 4 days ago
      wordCount: 1563
    }
  ];
}