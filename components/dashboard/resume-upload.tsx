"use client";

import { useState } from "react";
import { Upload } from "lucide-react";
import { Button } from "@/components/ui/button";

export function ResumeUpload() {
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function upload(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setMessage(null);

    const form = new FormData(event.currentTarget);
    const response = await fetch("/api/resume", { method: "POST", body: form });
    const data = await response.json();
    setLoading(false);
    setMessage(response.ok ? "Resume uploaded." : data.error ?? "Upload failed.");
  }

  return (
    <form id="resume-upload" className="rounded-lg border bg-card p-5" onSubmit={upload}>
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="font-semibold">Resume</h2>
          <p className="mt-1 text-sm text-muted-foreground">Upload a PDF or DOCX resume for match scoring.</p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <input className="text-sm" name="resume" type="file" accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document" required />
          <Button disabled={loading}>
            <Upload className="h-4 w-4" />
            {loading ? "Uploading" : "Upload"}
          </Button>
        </div>
      </div>
      {message && <p className="mt-3 text-sm text-muted-foreground">{message}</p>}
    </form>
  );
}
