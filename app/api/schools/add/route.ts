import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { classify } from "@/lib/attainability";
import type { ScorecardSchool } from "@/lib/scorecard";

export async function POST(request: NextRequest) {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const school: ScorecardSchool = await request.json();

  // Upsert school into global schools table
  const { error: schoolErr } = await supabase.from("schools").upsert({
    id: school.id,
    name: school.name,
    city: school.city,
    state: school.state,
    school_type: school.school_type,
    acceptance_rate: school.acceptance_rate,
    sat_25th: school.sat_25th,
    sat_75th: school.sat_75th,
    avg_gpa: school.avg_gpa,
    test_policy: school.test_policy,
    net_price: school.net_price,
    updated_at: new Date().toISOString(),
  }, { onConflict: "id" });

  if (schoolErr) {
    console.error("School upsert error:", schoolErr);
    return NextResponse.json({ error: schoolErr.message }, { status: 500 });
  }

  // Get user profile to compute attainability
  const { data: profile } = await supabase
    .from("profiles")
    .select("sat_score, act_score, gpa")
    .eq("id", user.id)
    .single();

  // Convert ACT to SAT if needed (rough conversion)
  let sat = profile?.sat_score ?? null;
  if (!sat && profile?.act_score) {
    const actToSat: Record<number, number> = {
      36: 1590, 35: 1540, 34: 1500, 33: 1460, 32: 1430, 31: 1400,
      30: 1370, 29: 1340, 28: 1310, 27: 1280, 26: 1240, 25: 1210,
      24: 1180, 23: 1140, 22: 1110, 21: 1080, 20: 1040, 19: 1010,
      18: 970, 17: 930, 16: 890, 15: 850,
    };
    sat = actToSat[profile.act_score] ?? null;
  }

  const attainability = classify(sat, profile?.gpa ?? null, school);

  // Insert into user's list
  const { data: userSchool, error: listErr } = await supabase
    .from("user_schools")
    .insert({
      user_id: user.id,
      school_id: school.id,
      attainability,
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
