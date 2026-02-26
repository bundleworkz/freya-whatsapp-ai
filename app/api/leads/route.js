export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

import { NextResponse } from "next/server";
import { getServiceClient } from "@/lib/supabase";

export async function GET(request) {
  const db = getServiceClient();
  if (!db) return NextResponse.json([]);

  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status");

  let query = db
    .from("leads")
    .select("*")
    .order("created_at", { ascending: false });

  if (status && status !== "all") {
    query = query.eq("status", status);
  }

  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data || []);
}

export async function PATCH(request) {
  const db = getServiceClient();
  if (!db) return NextResponse.json({ error: "DB not available" }, { status: 500 });

  const body = await request.json();
  const { id, status, notes } = body;

  const updateData = {};
  if (status) updateData.status = status;
  if (notes !== undefined) updateData.notes = notes;
  updateData.updated_at = new Date().toISOString();

  const { data, error } = await db
    .from("leads")
    .update(updateData)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}
