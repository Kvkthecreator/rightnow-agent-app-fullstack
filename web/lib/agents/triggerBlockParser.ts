import { apiPost } from "@/lib/api";

export async function triggerBlockParser(
  basket_id: string,
  payload: { raw_dump: string; media?: any[] }
) {
  await apiPost("/agent-run", {
    agent: "orch_block_manager_agent",
    input: { basket_id, ...payload },
  });
}
