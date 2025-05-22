/**
 * Shared TypeScript types for API responses.
 */
export interface Report {
  id: string;
  task_id: string;
  output_json: {
    output_type: string;
    data: any;
  };
  created_at: string;
}