/**
 * Wizard Types for Basket-Mode Setup and Upload Existing workflows
 * Canon v3.0 aligned - respects P0-P3 governance, substrate-first philosophy
 */

export type WizardStepFieldType = 'text' | 'textarea' | 'file_upload';

export type SetupWizardStep = {
  id: string;
  field: string; // Maps to anchor ID or substrate intent
  question: string;
  prompt: string;
  placeholder: string;
  inputType: WizardStepFieldType;
  optional?: boolean;
  anchorRefs?: string[]; // Which anchors this input is intended to create
  minLength?: number;
  maxLength?: number;
};

export type SetupWizardConfig = {
  id: string;
  title: string;
  subtitle: string;
  steps: SetupWizardStep[];
  artifacts: {
    immediate: string[]; // Deliverable IDs to compose immediately after P1
    queued: string[]; // Deliverable IDs queued until substrate approved
  };
};

export type UploadWizardStep = {
  id: string;
  title: string;
  subtitle: string;
  stepType: 'upload' | 'extract' | 'review' | 'compare' | 'complete';
  ui?: {
    maxFiles?: number;
    acceptedTypes?: string[];
    showProgress?: boolean;
    groupBy?: 'source_document' | 'anchor_type';
  };
};

export type UploadWizardConfig = {
  id: string;
  title: string;
  subtitle: string;
  steps: UploadWizardStep[];
  transformationMessage: string; // Clear messaging about composition vs preservation
  maxDocuments: number;
};

export type WizardSubmission = {
  basketId: string;
  wizardType: 'setup' | 'upload';
  modeId: string;
  inputs: Record<string, string | File[]>;
  metadata?: Record<string, any>;
};
