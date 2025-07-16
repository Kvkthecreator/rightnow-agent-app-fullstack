import { postDump } from "./dumpApi";
import { createClient } from "@supabase/supabase-js";

export interface CreateDumpArgs {
  basketId: string;
  text?: string;
  images?: File[];
  userId?: string; // optional, will fetch from supabase session if absent
}

export async function createDump({ basketId, text, images = [], userId }: CreateDumpArgs) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
  let uid = userId;
  if (!uid) {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    uid = user?.id ?? "";
  }
  return await postDump({ basketId, userId: uid, text, images });
}
