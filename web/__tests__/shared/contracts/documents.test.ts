import {
  DocumentSchema,
  CreateDocumentRequestSchema,
  CreateDocumentResponseSchema,
  UpdateDocumentRequestSchema,
  GetDocumentsResponseSchema,
  type DocumentDTO,
} from '@shared/contracts/documents';

describe('Document Contracts', () => {
  describe('DocumentSchema', () => {
    it('should validate a valid document', () => {
      const validDocument: DocumentDTO = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        basket_id: '123e4567-e89b-12d3-a456-426614174001',
        title: 'Test Document',
        created_at: '2025-01-01T12:00:00Z',
        updated_at: '2025-01-01T13:00:00Z',
        metadata: { key: 'value' },
      };

      const result = DocumentSchema.safeParse(validDocument);
      expect(result.success).toBe(true);
    });

    it('should reject invalid UUID formats', () => {
      const invalidDocument = {
        id: 'invalid-uuid',
        basket_id: '123e4567-e89b-12d3-a456-426614174001',
        title: 'Test Document',
        created_at: '2025-01-01T12:00:00Z',
        updated_at: '2025-01-01T13:00:00Z',
        metadata: {},
      };

      const result = DocumentSchema.safeParse(invalidDocument);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].path).toEqual(['id']);
      }
    });

    it('should reject empty title', () => {
      const invalidDocument = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        basket_id: '123e4567-e89b-12d3-a456-426614174001',
        title: '',
        created_at: '2025-01-01T12:00:00Z',
        updated_at: '2025-01-01T13:00:00Z',
        metadata: {},
      };

      const result = DocumentSchema.safeParse(invalidDocument);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].path).toEqual(['title']);
      }
    });

    it('should use default empty metadata when not provided', () => {
      const documentWithoutMetadata = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        basket_id: '123e4567-e89b-12d3-a456-426614174001',
        title: 'Test Document',
        created_at: '2025-01-01T12:00:00Z',
        updated_at: '2025-01-01T13:00:00Z',
      };

      const result = DocumentSchema.safeParse(documentWithoutMetadata);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.metadata).toEqual({});
      }
    });
  });


  describe('CreateDocumentRequestSchema', () => {
    it('should validate a valid create request', () => {
      const validRequest = {
        basket_id: '123e4567-e89b-12d3-a456-426614174001',
        title: 'New Document',
        metadata: { type: 'draft' },
      };

      const result = CreateDocumentRequestSchema.safeParse(validRequest);
      expect(result.success).toBe(true);
    });

    it('should reject request without required fields', () => {
      const invalidRequest = {
        title: 'New Document',
      };

      const result = CreateDocumentRequestSchema.safeParse(invalidRequest);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues.some(issue => issue.path.includes('basket_id'))).toBe(true);
      }
    });

    it('should use default empty metadata when not provided', () => {
      const requestWithoutMetadata = {
        basket_id: '123e4567-e89b-12d3-a456-426614174001',
        title: 'New Document',
      };

      const result = CreateDocumentRequestSchema.safeParse(requestWithoutMetadata);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.metadata).toEqual({});
      }
    });
  });

  describe('UpdateDocumentRequestSchema', () => {
    it('should validate partial updates', () => {
      const validUpdate = {
        title: 'Updated Title',
      };

      const result = UpdateDocumentRequestSchema.safeParse(validUpdate);
      expect(result.success).toBe(true);
    });

    it('should validate metadata-only updates', () => {
      const validUpdate = {
        metadata: { status: 'published' },
      };

      const result = UpdateDocumentRequestSchema.safeParse(validUpdate);
      expect(result.success).toBe(true);
    });

    it('should reject empty objects', () => {
      const emptyUpdate = {};

      const result = UpdateDocumentRequestSchema.safeParse(emptyUpdate);
      expect(result.success).toBe(false);
    });
  });


  describe('GetDocumentsResponseSchema', () => {
    it('should validate a valid documents list response', () => {
      const validResponse = {
        documents: [
          {
            id: '123e4567-e89b-12d3-a456-426614174000',
            basket_id: '123e4567-e89b-12d3-a456-426614174001',
            title: 'Document 1',
            created_at: '2025-01-01T12:00:00Z',
            updated_at: '2025-01-01T13:00:00Z',
            metadata: {},
          },
        ],
        last_cursor: '2025-01-01T13:00:00Z',
      };

      const result = GetDocumentsResponseSchema.safeParse(validResponse);
      expect(result.success).toBe(true);
    });

    it('should allow empty documents list', () => {
      const emptyResponse = {
        documents: [],
        last_cursor: undefined,
      };

      const result = GetDocumentsResponseSchema.safeParse(emptyResponse);
      expect(result.success).toBe(true);
    });

    it('should validate nested document schemas', () => {
      const responseWithInvalidDocument = {
        documents: [
          {
            id: 'invalid-uuid',
            basket_id: '123e4567-e89b-12d3-a456-426614174001',
            title: '',
            created_at: '2025-01-01T12:00:00Z',
            updated_at: '2025-01-01T13:00:00Z',
            metadata: {},
          },
        ],
        last_cursor: '2025-01-01T13:00:00Z',
      };

      const result = GetDocumentsResponseSchema.safeParse(responseWithInvalidDocument);
      expect(result.success).toBe(false);
    });
  });
});