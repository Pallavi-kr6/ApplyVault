import { SupabaseClient } from "@supabase/supabase-js";
import { extractResumeTextFromBuffer } from "./extract-text";

type ResumeRecord = {
  id: string;
  file_path: string;
  content_type: string;
  extracted_text: string | null;
};

export async function getLatestResumeText(supabase: SupabaseClient, userId: string) {
  const { data: resume } = await supabase
    .from("resumes")
    .select("id, file_path, content_type, extracted_text")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle<ResumeRecord>();

  if (!resume) return null;
  if (resume.extracted_text) return resume.extracted_text;

  const { data: file } = await supabase.storage.from("resumes").download(resume.file_path);
  if (!file) return null;

  const extractedText = await extractResumeTextFromBuffer(resume.content_type, Buffer.from(await file.arrayBuffer()));
  if (!extractedText) return null;

  await supabase
    .from("resumes")
    .update({ extracted_text: extractedText })
    .eq("id", resume.id)
    .eq("user_id", userId);

  return extractedText;
}
