export type InputAsset =
  | { type: "image"; url: string; label?: string }
  | { type: "file"; url: string; name: string };

export interface BasketInputPayload {
  input_text: string;
  intent_summary: string;
  assets: InputAsset[];
}
