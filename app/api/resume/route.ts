import { NextResponse } from "next/server";
import { extractResumeText } from "@/lib/resume/extract-text";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const allowedTypes = new Set([
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
]);

export async function POST(request: Request) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const form = await request.formData();
  const file = form.get("resume");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Resume file is required." }, { status: 400 });
  }

  if (!allowedTypes.has(file.type)) {
    return NextResponse.json({ error: "Only PDF and DOCX resumes are supported." }, { status: 400 });
  }

  const extractedText = await extractResumeText(file);
  if (!extractedText) {
    return NextResponse.json({ error: "Could not read text from this resume. Try uploading a text-based PDF or DOCX." }, { status: 400 });
  }

  const extension = file.name.split(".").pop() ?? "bin";
  const path = `${user.id}/${crypto.randomUUID()}.${extension}`;
  const { error: uploadError } = await supabase.storage.from("resumes").upload(path, file, {
    contentType: file.type,
    upsert: false
  });

  if (uploadError) return NextResponse.json({ error: uploadError.message }, { status: 500 });

  const { data, error } = await supabase
    .from("resumes")
    .insert({
      user_id: user.id,
      file_name: file.name,
      file_path: path,
      content_type: file.type,
      extracted_text: extractedText
    })
    .select("*")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ resume: data }, { status: 201 });
}
