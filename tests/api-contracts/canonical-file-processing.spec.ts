import { test, expect } from '@playwright/test';
import { readFile } from 'fs/promises';
import { join } from 'path';

/**
 * [API CONTRACTS] Canonical File Processing Pipeline Tests
 * 
 * Tests the end-to-end canonical file processing pipeline:
 * - Upload API validation with canonical formats
 * - Supabase Storage integration
 * - Content extraction (text/PDF/image OCR)
 * - Batch processing for unified context
 * - P1 Substrate Agent structured knowledge extraction
 * 
 * Canon v2.0 Compliance: Only canonical formats (text/markdown/PDF/images)
 */

test.describe('Canonical File Processing Pipeline', () => {
  const basketId = process.env.TEST_BASKET_ID || 'da75cf04-65e5-46ac-940a-74e2ffe077a2';

  test('Canonical text file processing (.txt)', async ({ request }) => {
    // Create test text file content
    const textContent = 'Goal: Complete the project by Friday\\nConstraint: Budget limit $5000\\nMetric: Success rate 95%';
    const textFile = new File([textContent], 'test-goals.txt', { type: 'text/plain' });

    const formData = new FormData();
    formData.append('files', textFile);
    formData.append('basket_id', basketId);
    formData.append('dump_request_id', crypto.randomUUID());
    formData.append('meta', JSON.stringify({
      client_ts: new Date().toISOString(),
      ingest_trace_id: crypto.randomUUID(),
      batch_context: 'canonical_test'
    }));

    const response = await request.post('/api/dumps/upload', {
      multipart: formData as any,
      headers: { 'x-playwright-test': 'true' }
    });

    expect(response.ok()).toBeTruthy();
    const result = await response.json();
    
    // Verify immediate text processing
    expect(result).toHaveProperty('success', true);
    expect(result).toHaveProperty('dump_id');
    expect(result).toHaveProperty('processing_method', 'immediate_text');
  });

  test('Canonical markdown file processing (.md)', async ({ request }) => {
    const markdownContent = `# Project Requirements
    
## Goals
- Complete development by Q4
- Launch with 99% uptime

## Constraints  
- Limited to 3 developers
- Must use existing infrastructure

## Success Metrics
- User satisfaction: 4.5/5 stars
- Performance: <200ms response time`;

    const mdFile = new File([markdownContent], 'requirements.md', { type: 'text/markdown' });

    const formData = new FormData();
    formData.append('files', mdFile);
    formData.append('basket_id', basketId);
    formData.append('dump_request_id', crypto.randomUUID());

    const response = await request.post('/api/dumps/upload', {
      multipart: formData as any,
      headers: { 'x-playwright-test': 'true' }
    });

    expect(response.ok()).toBeTruthy();
    const result = await response.json();
    expect(result.processing_method).toBe('immediate_text');
  });

  test('Canonical PDF processing - storage and extraction', async ({ request }) => {
    // Note: In real test, would use actual PDF file
    // For now, simulate PDF upload
    const pdfBuffer = Buffer.from('%PDF-1.4\\n1 0 obj\\n<< /Type /Catalog /Pages 2 0 R >>\\nendobj\\n');
    const pdfFile = new File([pdfBuffer], 'test-document.pdf', { type: 'application/pdf' });

    const formData = new FormData();
    formData.append('files', pdfFile);
    formData.append('basket_id', basketId);
    formData.append('dump_request_id', crypto.randomUUID());

    const response = await request.post('/api/dumps/upload', {
      multipart: formData as any,
      headers: { 'x-playwright-test': 'true' }
    });

    expect(response.ok()).toBeTruthy();
    const result = await response.json();
    
    // Verify storage-based processing for PDF
    expect(result.processing_method).toBe('storage_extraction');
    expect(result.dump_id).toBeTruthy();
  });

  test('Canonical image processing - OCR extraction', async ({ request }) => {
    // Simulate PNG image upload
    const pngBuffer = Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]); // PNG signature
    const imageFile = new File([pngBuffer], 'screenshot.png', { type: 'image/png' });

    const formData = new FormData();
    formData.append('files', imageFile);
    formData.append('basket_id', basketId);
    formData.append('dump_request_id', crypto.randomUUID());

    const response = await request.post('/api/dumps/upload', {
      multipart: formData as any,
      headers: { 'x-playwright-test': 'true' }
    });

    expect(response.ok()).toBeTruthy();
    const result = await response.json();
    expect(result.processing_method).toBe('storage_extraction');
  });

  test('Rejected non-canonical formats', async ({ request }) => {
    // Test CSV rejection (removed legacy format)
    const csvContent = 'Name,Value,Status\\nProject A,1000,Active\\nProject B,2000,Pending';
    const csvFile = new File([csvContent], 'data.csv', { type: 'text/csv' });

    const formData = new FormData();
    formData.append('files', csvFile);
    formData.append('basket_id', basketId);
    formData.append('dump_request_id', crypto.randomUUID());

    const response = await request.post('/api/dumps/upload', {
      multipart: formData as any,
      headers: { 'x-playwright-test': 'true' }
    });

    expect(response.status()).toBe(400);
    const error = await response.json();
    expect(error.error).toBe('Unsupported file type');
    expect(error.details).toContain('Supported formats: Text (.txt, .md), PDF (.pdf), Images');
  });

  test('Rejected legacy Office formats', async ({ request }) => {
    // Test .docx rejection (never supported in canonical)
    const docxBuffer = Buffer.from('PK'); // Simulated Office document
    const docxFile = new File([docxBuffer], 'document.docx', { 
      type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' 
    });

    const formData = new FormData();
    formData.append('files', docxFile);
    formData.append('basket_id', basketId);
    formData.append('dump_request_id', crypto.randomUUID());

    const response = await request.post('/api/dumps/upload', {
      multipart: formData as any,
      headers: { 'x-playwright-test': 'true' }
    });

    expect(response.status()).toBe(400);
    expect((await response.json()).error).toBe('Unsupported file type');
  });

  test('Batch processing with unified context', async ({ request }) => {
    const batchId = crypto.randomUUID();
    
    // Upload text content with batch context
    const textResponse = await request.post('/api/dumps/new', {
      data: {
        basket_id: basketId,
        text_dump: 'Project overview: Building AI-powered analytics platform',
        dump_request_id: crypto.randomUUID(),
        meta: {
          batch_id: batchId,
          batch_context: 'multi_format_memory'
        }
      },
      headers: { 'x-playwright-test': 'true' }
    });

    // Upload file with same batch context  
    const markdownFile = new File(['## Technical Requirements\\n- Python 3.9+\\n- PostgreSQL 14+'], 'tech-specs.md', { type: 'text/markdown' });
    
    const formData = new FormData();
    formData.append('files', markdownFile);
    formData.append('basket_id', basketId);
    formData.append('dump_request_id', crypto.randomUUID());
    formData.append('meta', JSON.stringify({
      batch_id: batchId,
      batch_context: 'multi_format_memory'
    }));

    const fileResponse = await request.post('/api/dumps/upload', {
      multipart: formData as any,
      headers: { 'x-playwright-test': 'true' }
    });

    expect(textResponse.ok()).toBeTruthy();
    expect(fileResponse.ok()).toBeTruthy();
    
    // Both uploads should succeed and share batch context
    const textResult = await textResponse.json();
    const fileResult = await fileResponse.json();
    
    expect(textResult.success).toBeTruthy();
    expect(fileResult.success).toBeTruthy();
  });

  test('Uploads support multiple files plus text in one request', async ({ request }) => {
    const formData = new FormData();
    formData.append('basket_id', basketId);
    formData.append('text_dump', 'Kick-off notes for multi-file capture');
    formData.append('dump_request_id', crypto.randomUUID());
    formData.append('files', new File(['First attachment'], 'one.md', { type: 'text/markdown' }));
    formData.append('dump_request_id', crypto.randomUUID());
    formData.append('files', new File([Buffer.from('%PDF-1.4')], 'two.pdf', { type: 'application/pdf' }));
    formData.append('dump_request_id', crypto.randomUUID());

    const response = await request.post('/api/dumps/upload', {
      multipart: formData as any,
      headers: { 'x-playwright-test': 'true' }
    });

    expect(response.ok()).toBeTruthy();
    const result = await response.json();
    expect(result.success).toBeTruthy();
    expect(result.dumps.length).toBeGreaterThanOrEqual(3);
    expect(result.dump_ids.length).toBeGreaterThanOrEqual(2);
  });

  test('File size and validation limits', async ({ request }) => {
    // Test file size limit (simulated large file)
    const largeContent = 'x'.repeat(60 * 1024 * 1024); // 60MB
    const largeFile = new File([largeContent], 'huge-file.txt', { type: 'text/plain' });

    const formData = new FormData();
    formData.append('files', largeFile);
    formData.append('basket_id', basketId);
    formData.append('dump_request_id', crypto.randomUUID());

    const response = await request.post('/api/dumps/upload', {
      multipart: formData as any,
      headers: { 'x-playwright-test': 'true' }
    });

    // Should handle large files gracefully (either process or reject with clear error)
    if (!response.ok()) {
      const error = await response.json();
      expect(error).toHaveProperty('error');
    } else {
      const result = await response.json();
      expect(result).toHaveProperty('success');
    }
  });

  test('Missing required parameters', async ({ request }) => {
    const textFile = new File(['test content'], 'test.txt', { type: 'text/plain' });
    
    const formData = new FormData();
    formData.append('files', textFile);
    // Missing basket_id and dump_request_id

    const response = await request.post('/api/dumps/upload', {
      multipart: formData as any,
      headers: { 'x-playwright-test': 'true' }
    });

    expect(response.status()).toBe(400);
    const error = await response.json();
    expect(error.error).toContain('Missing required field');
  });

  test('Canonical MIME type validation consistency', async ({ request }) => {
    // Test all canonical image formats
    const imageFormats = [
      { ext: 'jpg', mime: 'image/jpeg' },
      { ext: 'png', mime: 'image/png' },
      { ext: 'gif', mime: 'image/gif' },
      { ext: 'bmp', mime: 'image/bmp' },
      { ext: 'tiff', mime: 'image/tiff' },
      { ext: 'webp', mime: 'image/webp' }
    ];

    for (const format of imageFormats) {
      const imageBuffer = Buffer.from([0x00, 0x01, 0x02, 0x03]); // Minimal image data
      const imageFile = new File([imageBuffer], `test.${format.ext}`, { type: format.mime });

      const formData = new FormData();
      formData.append('files', imageFile);
      formData.append('basket_id', basketId);
      formData.append('dump_request_id', crypto.randomUUID());

      const response = await request.post('/api/dumps/upload', {
        multipart: formData as any,
        headers: { 'x-playwright-test': 'true' }
      });

      expect(response.ok()).toBeTruthy();
      const result = await response.json();
      expect(result.processing_method).toBe('storage_extraction');
    }
  });
});
