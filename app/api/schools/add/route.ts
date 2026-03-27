import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import type { ScorecardSchool } from "@/lib/scorecard";

export async function POST(request: NextRequest) {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const school: ScorecardSchool = await request.json();

  const { error: schoolErr } = await supabase.from("schools").upsert({
    id: school.id,
    name: school.name,
    city: school.city,
    state: school.state,
    school_type: school.school_type,
    setting: school.setting,
    enrollment: school.enrollment,
    acceptance_rate: school.acceptance_rate,
    sat_25th: school.sat_25th,
    sat_75th: school.sat_75th,
    avg_gpa: school.avg_gpa,
    test_policy: school.test_policy,
    net_price: school.net_price,
    tuition_in_state: school.tuition_in_state,
    tuition_out_of_state: school.tuition_out_of_state,
    grad_rate: school.grad_rate,
    median_earnings: school.median_earnings,
    website_url: school.website_url,
    updated_at: new Date().toISOString(),
  }, { onConflict: "id" });

  if (schoolErr) {
    console.error("School upsert error:", schoolErr);
    return NextResponse.json({ error: schoolErr.message }, { status: 500 });
  }

  const { data: userSchool, error: listErr } = await supabase
    .from("user_schools")
    .insert({
      user_id: user.id,
      school_id: school.id,
      attainability: null,
    })
    .select()
    .single();

  if (listErr) {
    if (listErr.code === "23505") {
      return NextResponse.json({ error: "Already on your list" }, { status: 409 });
    }
    return NextResponse.json({ error: listErr.message }, { status: 500 });
  }

  return NextResponse.json({ userSchool, school });
}
