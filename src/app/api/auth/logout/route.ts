import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const cookieStore = await cookies();

  // Clear mock session cookie
  cookieStore.delete("ecowatch_auth_session");
  cookieStore.delete("ecowatch_demo_session");

  // If Supabase client is available, sign out on server
  const supabase = await createServerSupabaseClient();
  if (supabase) {
    await supabase.auth.signOut();
  }

  const { origin } = new URL(request.url);
  return NextResponse.redirect(`${origin}/`, { status: 303 });
}

