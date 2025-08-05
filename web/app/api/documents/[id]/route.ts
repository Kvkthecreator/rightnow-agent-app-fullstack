import { NextRequest, NextResponse } from "next/server";

// ============================================================================
// ENTIRE DOCUMENT [ID] API DELETED - Migrated to Universal Change System
// ============================================================================

// All document operations now go through Universal Change System:
// - PATCH /api/documents/[id] → useUniversalChanges.updateDocument()
// - DELETE /api/documents/[id] → useUniversalChanges.deleteDocument() 
// - GET /api/documents/[id] → Still available in main documents route

// Background intelligence generation is now handled by UniversalChangeService
// Auto-save functionality uses Universal Change System with proper batching
// Real-time updates flow through UniversalChangeModal

// Migration completed - all document operations use unified pipeline

export async function GET() {
  return NextResponse.json(
    { 
      error: "This endpoint has been migrated to Universal Change System",
      message: "Use useUniversalChanges hook instead of direct API calls",
      migration: {
        "PATCH /api/documents/[id]": "useUniversalChanges.updateDocument()",
        "DELETE /api/documents/[id]": "useUniversalChanges.deleteDocument()"
      }
    },
    { status: 410 } // 410 Gone - resource no longer available
  );
}

export async function PATCH() {
  return NextResponse.json(
    { 
      error: "PATCH method migrated to Universal Change System",
      message: "Use useUniversalChanges.updateDocument() instead"
    },
    { status: 410 }
  );
}

export async function DELETE() {
  return NextResponse.json(
    { 
      error: "DELETE method migrated to Universal Change System", 
      message: "Use useUniversalChanges.deleteDocument() instead"
    },
    { status: 410 }
  );
}