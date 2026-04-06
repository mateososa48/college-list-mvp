import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import CollegeTable from "@/components/college-table";
import TopBar from "@/components/top-bar";
import FeedbackButton from "@/components/feedback-button";
import DashboardRefresh from "@/components/dashboard-refresh";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("gpa, sat_score, act_score, column_preferences, display_preferences")
    .eq("id", user.id)
    .single();

  const { data: userSchools } = await supabase
    .from("user_schools")
    .select(
      `
      id, attainability, app_type, status, notes, added_at, is_favorite,
      schools (
        id, name, city, state, school_type, setting, enrollment,
        acceptance_rate, sat_25th, sat_75th, avg_gpa, test_policy,
        net_price, tuition_in_state, tuition_out_of_state,
        grad_rate, median_earnings, website_url, latitude, longitude
      )
    `
    )
    .eq("user_id", user.id)
    .order("added_at", { ascending: false });

  return (
    <div className="min-h-screen" style={{ backgroundColor: "var(--cr-page-bg)" }}>
      <DashboardRefresh />
      <TopBar isAdmin={user.email === "mateo_sosa@icloud.com"} />
      <FeedbackButton />
      <main className="max-w-[1600px] mx-auto px-3 md:px-6 pt-4 md:pt-6 pb-16">
        <CollegeTable
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          initialRows={(userSchools ?? []) as any[]}
          columnPrefs={profile?.column_preferences ?? {}}
          displayPrefs={profile?.display_preferences ?? {}}
        />
      </main>
    </div>
  );
}
