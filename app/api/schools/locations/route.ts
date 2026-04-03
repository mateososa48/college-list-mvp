import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Returns all schools with lat/lng for the map — lightweight, only what the map needs
export async function GET() {
  const { data, error } = await supabase
    .from("schools")
    .select("id, name, city, state, latitude, longitude")
    .not("latitude", "is", null)
    .not("longitude", "is", null);

  if (error) {
    return NextResponse.json({ error: "Failed to load locations" }, { status: 500 });
  }

  return NextResponse.json({ locations: data ?? [] }, {
    headers: { "Cache-Control": "public, max-age=3600" },
  });
}
