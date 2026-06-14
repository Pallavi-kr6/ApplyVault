import { NextResponse } from "next/server";
import { z } from "zod";
import { createSupabaseServerClient, getUserFromRequest } from "@/lib/supabase/server";

const responseSchema = z.object({
  token: z.string().min(1)
});

/**
 * Exchanges the current user's Supabase session (from cookies via createSupabaseServerClient)
 * for a JWT that the Chrome extension can use as Authorization: Bearer <token>.
 */
export async function GET(request: Request) {
  // Ensure user is logged in (via cookies)
  const user = await getUserFromRequest(request);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { session }
  } = await supabase.auth.getSession();

  const accessToken = session?.access_token;
  if (!accessToken) {
    return NextResponse.json({ error: "No active session" }, { status: 401 });
  }

  // Validate shape before returning
  responseSchema.parse({ token: accessToken });

  return NextResponse.json({ token: accessToken });
}

