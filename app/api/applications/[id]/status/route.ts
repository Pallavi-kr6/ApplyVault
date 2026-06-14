import { NextResponse } from "next/server";
import { z } from "zod";
import { applicationStatuses } from "@/lib/types/application";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const statusSchema = z.object({
  status: z.enum(applicationStatuses)
});

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createSupabaseServerClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { status } = statusSchema.parse(await request.json());
  const { data, error } = await supabase
    .from("applications")
    .update({ status })
    .eq("id", id)
    .eq("user_id", user.id)
    .select("*")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ application: data });
}
