export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

import { NextResponse } from "next/server";
import { getServiceClient } from "@/lib/supabase";

export async function GET(request) {
  const db = getServiceClient();
  if (!db) return NextResponse.json([]);

  const { searchParams } = new URL(request.url);
  const leadId = searchParams.get("lead_id");
  const conversationId = searchParams.get("id");

  if (conversationId) {
    const { data: messages, error } = await db
      .from("messages")
      .select("*")
      .eq("conversation_id", conversationId)
      .order("created_at", { ascending: true });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json(messages || []);
  }

  if (leadId) {
    const { data, error } = await db
      .from("conversations")
      .select("*")
      .eq("lead_id", leadId)
      .order("started_at", { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json(data || []);
  }

  const { data, error } = await db
    .from("conversations")
    .select("*")
    .order("started_at", { ascending: false })
    .limit(50);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data || []);
}
