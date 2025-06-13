import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import dayjs from "dayjs";

export async function POST(req: NextRequest) {
    const body = await req.json();
    const { basket_id } = body;
    const supabase = createServerClient();

    const since = dayjs().subtract(48, "hour").toISOString();
    const { data: commits } = await supabase
        .from("dump_commits")
        .select("id, summary, created_at")
        .eq("basket_id", basket_id)
        .gte("created_at", since)
        .order("created_at", { ascending: true });

    if (!commits || commits.length === 0) {
        return NextResponse.json({
            summary: "No recent updates in the last 48 hours.",
        });
    }

    const formatted = commits
        .map(
            (c) =>
                `• ${dayjs(c.created_at).format("MMM D")}: ${c.summary || "Unnamed commit"}`,
        )
        .join("\n");
    const summary = `Here’s what you’ve worked on recently:\n${formatted}`;
    return NextResponse.json({ summary });
}
