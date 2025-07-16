import { apiPost } from "@/lib/api";

export interface TemplateBasketArgs {
  template_id: string;
  files: string[];
  guidelines?: string;
}

export async function createBasketFromTemplate(args: TemplateBasketArgs) {
  return apiPost<{ basket_id: string }>("/baskets/new-from-template", args);
}
