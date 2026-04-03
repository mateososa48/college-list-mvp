import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

const supabase = createAdminClient();

const SCHOOL_SELECT_COLUMNS =
  "id, name, city, state, school_type, setting, enrollment, acceptance_rate, sat_25th, sat_75th, avg_gpa, test_policy, net_price, tuition_in_state, tuition_out_of_state, grad_rate, median_earnings, website_url, latitude, longitude";

export async function GET(request: NextRequest) {
  const id = request.nextUrl.searchParams.get("id");

  if (!id) {
    return NextResponse.json({ error: "Missing school id" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("schools")
    .select(SCHOOL_SELECT_COLUMNS)
    .eq("id", id)
    .maybeSingle();

  if (error) {
    console.error("School details error:", error);
    return NextResponse.json({ error: "Failed to load school details" }, { status: 500 });
  }

  if (!data) {
    return NextResponse.json({ error: "School not found" }, { status: 404 });
  }

  return NextResponse.json({ school: data });
}
