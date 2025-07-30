import { fetchWithToken } from "@/lib/fetchWithToken";

export interface DocumentCreationData {
  basket_id: string;
  title: string;
  content?: string;
  document_type?: string;
  metadata?: Record<string, any>;
}

export interface CreatedDocument {
  id: string;
  title: string;
  content: string;
  document_type: string;
  basket_id: string;
  created_at: string;
}

export async function createDocument(data: DocumentCreationData): Promise<CreatedDocument> {
  const response = await fetchWithToken('/api/documents', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      basket_id: data.basket_id,
      title: data.title,
      content: data.content || `# ${data.title}\n\nStart writing your content here...`,
      document_type: data.document_type || 'general',
      metadata: {
        createdVia: 'manual',
        ...data.metadata
      }
    })
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(`Failed to create document: ${errorData.message || response.statusText}`);
  }

  return response.json();
}

export async function createDocumentWithPrompt(basketId: string): Promise<CreatedDocument> {
  // Generate a default title with timestamp to avoid the prompt issue
  const timestamp = new Date().toLocaleString();
  const defaultTitle = `New Document - ${timestamp}`;

  return createDocument({
    basket_id: basketId,
    title: defaultTitle,
    content: `# ${defaultTitle}\n\nStart writing your content here...`,
    document_type: 'general'
  });
}