# Product Brain Wizards Implementation Roadmap

**Canon v3.0 Aligned - Option A (Revolutionary Transformation)**
**Date:** October 4, 2025

---

## ✅ Completed

### Milestone 1.1: Wizard Type Definitions
- ✅ Created `wizardTypes.ts` with SetupWizard and UploadWizard types
- ✅ Updated `BasketModeConfig` to include wizard configuration
- ✅ Added Product Brain wizard configuration:
  - Setup wizard: 5 steps (4 required + 1 optional)
  - Upload wizard: Max 5 documents, transformation message
- ✅ Committed and pushed (commit: `4e0a0653`)

---

## 🔄 Remaining Milestones

### Milestone 1.2: Setup Wizard Component
**Files to create:**
- `web/components/wizard/ProductBrainSetupWizard.tsx`
- `web/components/wizard/WizardStep.tsx`
- `web/components/wizard/WizardProgress.tsx`

**Component structure:**
```tsx
<ProductBrainSetupWizard>
  <WizardProgress currentStep={step} totalSteps={5} />
  <WizardStep step={currentStep} onNext={handleNext} onBack={handleBack}>
    {step === 0 && <VisionStep />}
    {step === 1 && <ProblemStep />}
    {step === 2 && <CustomerStep />}
    {step === 3 && <FeaturesStep />}
    {step === 4 && <ContextStep />}
  </WizardStep>
</ProductBrainSetupWizard>
```

**Features:**
- State management (localStorage persistence)
- Validation (minLength, required fields)
- Progress indicator
- Back/Next navigation
- Submit handler → API call

**Commit message:** "Milestone 1.2: Product Brain Setup Wizard UI components"

---

### Milestone 1.3: Setup Wizard Route & API
**Files to create:**
- `web/app/baskets/[id]/setup-wizard/page.tsx`
- `web/app/api/baskets/[id]/setup-wizard/route.ts`

**API endpoint logic:**
```typescript
POST /api/baskets/[id]/setup-wizard
{
  inputs: {
    product_vision: string,
    core_problem: string,
    core_customer: string,
    initial_features: string,
    founder_context?: string
  }
}

Flow:
1. Validate inputs against wizard config
2. Create 4-5 raw_dumps (P0) - one per input
3. Trigger P1 extraction (via work queue or inline)
4. Return { success: true, raw_dump_ids: [...], work_ids: [...] }
5. Frontend polls for P1 completion
6. On P1 complete → show governance preview OR auto-approve
7. On approval → trigger P4 for immediate artifacts
8. Redirect to /baskets/[id]/documents with success message
```

**Commit message:** "Milestone 1.3: Setup Wizard route and API endpoint (P0-P3 flow)"

---

### Milestone 2.1: Upload Wizard Infrastructure
**Files to create:**
- `web/app/baskets/[id]/upload-wizard/page.tsx`
- `web/components/wizard/UploadWizard.tsx`
- `web/app/api/baskets/[id]/upload-wizard/upload/route.ts`
- `web/app/api/baskets/[id]/upload-wizard/status/route.ts`

**Upload wizard flow:**
```
Step 1: Upload files (3-5 max)
  - Dropzone component
  - File preview
  - Upload to storage + create raw_dumps

Step 2: Extract substrate (P1 progress)
  - Show per-file extraction progress
  - "Found N blocks, M context items"

Step 3: Review substrate
  - Governance preview grouped by source document
  - Approve all or selective approval

Step 4: Side-by-side comparison
  - Left: Original (immutable reference)
  - Right: YARNNN composed document
  - Accept/Reject per document

Step 5: Completion summary
  - Stats (uploads, documents created, blocks approved)
  - Next steps (view documents, review substrate)
```

**Commit message:** "Milestone 2.1: Upload Wizard infrastructure and multi-step flow"

---

### Milestone 2.2: Upload Transformation & Composition
**Files to create:**
- `web/app/api/baskets/[id]/upload-wizard/compose/route.ts`
- `web/components/wizard/UploadComparison.tsx`

**P4 composition from upload:**
```typescript
POST /api/baskets/[id]/upload-wizard/compose
{
  raw_dump_id: string,
  accept_transformation: boolean
}

If accept_transformation:
1. P4 composes document from extracted substrate
2. composition_instructions: { preserve_structure: 'moderate', source_upload: true }
3. substrate_filter: { source_raw_dump_id: raw_dump.id }
4. Create document_version with version_trigger: 'upload_composition'
5. Link: documents.source_raw_dump_id = raw_dump.id
6. Link: raw_dumps.document_id = document.id
7. Return { document_id, version_hash }

If reject:
1. Keep raw_dump in /uploads (reference only)
2. No document created
```

**Schema updates needed:**
```sql
-- Already exists from Canon v3.0:
ALTER TABLE documents ADD COLUMN source_raw_dump_id uuid REFERENCES raw_dumps(id);

-- Need to add:
ALTER TABLE raw_dumps ADD COLUMN document_id uuid REFERENCES documents(id);
```

**Commit message:** "Milestone 2.2: Upload transformation & document composition (P4)"

---

### Milestone 2.3: raw_dump ↔ document Linking
**Files to modify:**
- `web/components/documents/DocumentPage.tsx` - Add "View Original" affordance
- `web/app/baskets/[id]/uploads/UploadsClient.tsx` - Add "Composed into document" indicator

**Schema migration:**
```sql
-- supabase/migrations/20251004_raw_dump_document_linking.sql

-- Add document_id back-reference to raw_dumps
ALTER TABLE raw_dumps
  ADD COLUMN document_id uuid REFERENCES documents(id);

COMMENT ON COLUMN raw_dumps.document_id IS
  'If this raw_dump was transformed into a YARNNN document via Upload Wizard, links to the composed document';

-- Create index for efficient lookups
CREATE INDEX idx_raw_dumps_document_id ON raw_dumps(document_id) WHERE document_id IS NOT NULL;
CREATE INDEX idx_documents_source_raw_dump_id ON documents(source_raw_dump_id) WHERE source_raw_dump_id IS NOT NULL;
```

**DocumentPage updates:**
```tsx
{document.source_raw_dump_id && (
  <Badge variant="secondary" className="bg-purple-50 text-purple-700">
    <Upload className="h-3 w-3 mr-1" />
    Uploaded from document
    <Button
      variant="ghost"
      size="sm"
      onClick={() => router.push(`/baskets/${basketId}/uploads?highlight=${document.source_raw_dump_id}`)}
    >
      View Original
    </Button>
  </Badge>
)}
```

**UploadsClient updates:**
```tsx
{capture.dump.document_id && (
  <Badge variant="secondary" className="bg-green-50 text-green-700">
    <FileText className="h-3 w-3 mr-1" />
    Composed into YARNNN document
    <Button
      variant="ghost"
      size="sm"
      onClick={() => router.push(`/baskets/${basketId}/documents/${capture.dump.document_id}`)}
    >
      View Document
    </Button>
  </Badge>
)}
```

**Commit message:** "Milestone 2.3: raw_dump ↔ document bidirectional linking"

---

### Milestone 3.1: Admin Wizard Preview
**Files to modify:**
- `web/app/admin/basket-modes/AdminDashboard.tsx`

**Add wizard preview tab:**
```tsx
<Tabs>
  <Tab label="Configurations">...</Tab>
  <Tab label="Wizard Preview">
    <WizardPreview modeId={selectedMode} />
  </Tab>
  <Tab label="Baskets">...</Tab>
</Tabs>

<WizardPreview>
  {config.wizards?.setup?.enabled && (
    <Card>
      <h3>Setup Wizard ({config.wizards.setup.steps.length} steps)</h3>
      <ul>
        {config.wizards.setup.steps.map(step => (
          <li key={step.id}>
            {step.question}
            <Badge>{step.anchorRefs?.join(', ')}</Badge>
          </li>
        ))}
      </ul>
      <p>Immediate artifacts: {config.wizards.setup.immediateArtifacts.join(', ')}</p>
      <p>Queued artifacts: {config.wizards.setup.queuedArtifacts.join(', ')}</p>
    </Card>
  )}

  {config.wizards?.upload?.enabled && (
    <Card>
      <h3>Upload Wizard</h3>
      <p>Max documents: {config.wizards.upload.maxDocuments}</p>
      <p>Message: {config.wizards.upload.transformationMessage}</p>
    </Card>
  )}
</WizardPreview>
```

**Commit message:** "Milestone 3.1: Admin wizard configuration preview panel"

---

### Milestone 3.2: Basket Creation Flow Update
**Files to modify:**
- `web/app/baskets/new/page.tsx` or basket creation flow

**Flow update:**
```
1. User creates basket → selects mode (product_brain)
2. If mode has wizards.setup.enabled:
   → Redirect to /baskets/[id]/setup-wizard
3. Else:
   → Redirect to /baskets/[id] (normal flow)
```

**Commit message:** "Milestone 3.2: Auto-redirect to setup wizard on basket creation"

---

### Milestone 3.3: Legacy Cleanup
**Files to delete:**
- `web/components/wizard/SinglePageWizard.tsx` (replaced by new system)
- `web/components/onboarding/OnboardingForm.tsx` (replaced by setup wizard)
- Any old wizard components not aligned with Canon v3.0

**Files to update:**
- Remove references to old onboarding flow
- Update tests if any

**Commit message:** "Milestone 3.3: Remove legacy wizard components (canon purity)"

---

## Testing Checklist

### Setup Wizard
- [ ] Create new Product Brain basket → auto-redirects to setup wizard
- [ ] Fill in all 4 required fields → submit
- [ ] Verify 4 raw_dumps created (P0)
- [ ] Verify P1 extraction creates 8-12 blocks
- [ ] Verify governance approval (manual or auto based on workspace settings)
- [ ] Verify immediate artifact (profile PRD) composed
- [ ] Verify 2 queued artifacts shown as "Ready to compose"

### Upload Wizard
- [ ] Upload 3 documents (PDF, DOCX, MD)
- [ ] Verify 3 raw_dumps created
- [ ] Verify P1 extraction per document (15-40 blocks total)
- [ ] Review substrate proposals grouped by source
- [ ] Approve substrate
- [ ] View side-by-side comparison (original vs YARNNN)
- [ ] Accept transformation for 2 docs, reject 1
- [ ] Verify 2 YARNNN documents created
- [ ] Verify source_raw_dump_id linkage
- [ ] Verify document_id back-reference on raw_dumps
- [ ] "View Original" button on documents works
- [ ] "Composed into document" badge on uploads works

### Admin
- [ ] Edit Product Brain wizard config in admin panel
- [ ] Add/remove wizard steps via JSON
- [ ] Preview wizard configuration
- [ ] Verify basket creation uses updated wizard

---

## Canon Compliance Verification

**✅ All wizards must:**
1. Respect P0-P3 governance (all inputs → raw_dumps → P1 → P2 → P3)
2. Create documents via P4 composition (not direct content insertion)
3. Documents are read-only composed views (Canon v3.0)
4. Upload wizard implements Option A (transformation, not migration)
5. Original documents preserved in raw_dumps (Layer 1)
6. Substrate extracted and governed (Layer 2)
7. Documents composed from substrate (Layer 3)
8. No direct editing allowed
9. Clear separation of concerns
10. User workspace auto-approval settings respected

---

## Success Metrics

**Setup Wizard:**
- 90%+ completion rate
- Avg 5-7 minutes to complete
- 8-12 substrate proposals generated
- 70%+ approval rate on first governance review

**Upload Wizard:**
- 3-5 documents uploaded per session
- 80%+ transformation acceptance rate
- Users understand transformation vs migration
- "View Original" used regularly (trust indicator)

---

## Next Steps After Implementation

1. **Phase 2 Wizard Types** (Future)
   - Campaign Brain setup wizard
   - Research Brain setup wizard
   - Custom wizard builder in admin

2. **Wizard Enhancements** (Future)
   - AI-assisted input suggestions
   - Real-time substrate preview during wizard
   - Wizard templates for common use cases

3. **Upload Wizard v2** (Future)
   - Bulk upload (10+ documents)
   - Advanced extraction options
   - Custom composition instructions per upload

---

**Document Version:** 1.0
**Status:** Milestone 1.1 Complete, Remaining milestones pending
**Next Action:** Continue with Milestone 1.2 (Setup Wizard components)
