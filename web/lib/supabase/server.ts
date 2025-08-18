import { cookies } from "next/headers";
import { createRouteHandlerClient } from "./clients";

// Legacy function - use createRouteHandlerClient directly instead
export async function getServerSupabase() {
  return createRouteHandlerClient({ cookies });
}
