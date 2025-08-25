import { z } from "zod";

// Base event types following Canon v1.3.1
export const TimelineEventTypeSchema = z.enum([
  "dump.created",
  "reflection.computed",
  "delta.applied",
  "delta.rejected",
  "document.created",
  "document.updated",
  "block.created",
  "block.updated",
  "basket.created",
  "workspace.member_added",
]);

export type TimelineEventType = z.infer<typeof TimelineEventTypeSchema>;

// Event metadata schemas for different event types
const DumpCreatedMetaSchema = z.object({
  dump_id: z.string().uuid(),
  source_type: z.enum(["text", "file"]).optional(),
  char_count: z.number().int().min(0).optional(),
});

const ReflectionComputedMetaSchema = z.object({
  reflection_id: z.string().uuid(),
  computation_trace_id: z.string().uuid().optional(),
  substrate_window_hours: z.number().optional(),
});

const DeltaEventMetaSchema = z.object({
  delta_id: z.string().uuid(),
  operation: z.string(),
  affected_items: z.number().int().min(0).optional(),
});

const DocumentEventMetaSchema = z.object({
  document_id: z.string().uuid(),
  title: z.string().optional(),
  block_count: z.number().int().min(0).optional(),
});

const BlockEventMetaSchema = z.object({
  block_id: z.string().uuid(),
  block_type: z.string().optional(),
  document_id: z.string().uuid().optional(),
});

// Main Timeline Event DTO
export const TimelineEventDTOSchema = z.object({
  id: z.string().uuid(),
  basket_id: z.string().uuid(),
  event_type: TimelineEventTypeSchema,
  event_data: z.record(z.unknown()), // Type-specific metadata
  created_at: z.string(), // ISO timestamp
  created_by: z.string().uuid().optional(),
  meta: z.object({
    client_ts: z.string().optional(),
    trace_id: z.string().uuid().optional(),
  }).optional(),
}).strict();

export type TimelineEventDTO = z.infer<typeof TimelineEventDTOSchema>;

// Timeline cursor format: "timestamp:event_id"
export const TimelineCursorSchema = z.string().regex(
  /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{3})?Z:[a-f0-9-]{36}$/,
  "Invalid timeline cursor format"
);

export type TimelineCursor = z.infer<typeof TimelineCursorSchema>;

// Response schema for timeline API
export const GetTimelineResponseSchema = z.object({
  events: z.array(TimelineEventDTOSchema),
  has_more: z.boolean(),
  next_cursor: TimelineCursorSchema.optional(),
  last_cursor: TimelineCursorSchema.optional(), // For backwards compat
}).strict();

export type GetTimelineResponse = z.infer<typeof GetTimelineResponseSchema>;

// Helper to create cursor from event
export function createTimelineCursor(event: TimelineEventDTO): TimelineCursor {
  return `${event.created_at}:${event.id}` as TimelineCursor;
}

// Helper to parse cursor
export function parseTimelineCursor(cursor: TimelineCursor): { timestamp: string; event_id: string } {
  const [timestamp, event_id] = cursor.split(':');
  return { timestamp, event_id };
}