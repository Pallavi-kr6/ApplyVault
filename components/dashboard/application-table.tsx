"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Application, applicationStatuses } from "@/lib/types/application";
import { formatDate } from "@/lib/utils";

export function ApplicationTable({ applications }: { applications: Application[] }) {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("All");
  const [type, setType] = useState("All");

  const filtered = useMemo(() => {
    const search = query.toLowerCase();
    return applications.filter((application) => {
      const matchesSearch =
        application.company_name.toLowerCase().includes(search) ||
        application.job_title.toLowerCase().includes(search);
      const matchesStatus = status === "All" || application.status === status;
      const employment = `${application.employment_type ?? ""} ${application.location ?? ""}`.toLowerCase();
      const matchesType =
        type === "All" ||
        (type === "Remote" && employment.includes("remote")) ||
        (type === "Internship" && employment.includes("intern")) ||
        (type === "Full-time" && employment.includes("full"));

      return matchesSearch && matchesStatus && matchesType;
    });
  }, [applications, query, status, type]);

  return (
    <section className="rounded-lg border bg-card">
      <div className="grid gap-3 border-b p-4 md:grid-cols-[1fr_180px_180px]">
        <label className="relative">
          <Search className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input className="pl-9" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search company or role" />
        </label>
        <Select value={status} onChange={(event) => setStatus(event.target.value)}>
          <option>All</option>
          {applicationStatuses.map((item) => (
            <option key={item}>{item}</option>
          ))}
        </Select>
        <Select value={type} onChange={(event) => setType(event.target.value)}>
          <option>All</option>
          <option>Remote</option>
          <option>Internship</option>
          <option>Full-time</option>
        </Select>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[760px] text-left text-sm">
          <thead className="bg-muted/60 text-xs uppercase text-muted-foreground">
            <tr>
              <th className="px-4 py-3">Company</th>
              <th className="px-4 py-3">Role</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Salary</th>
              <th className="px-4 py-3">Location</th>
              <th className="px-4 py-3">Date Applied</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((application) => (
              <tr key={application.id} className="border-t">
                <td className="px-4 py-3 font-medium">
                  <Link className="hover:underline" href={`/dashboard/applications/${application.id}`}>
                    {application.company_name}
                  </Link>
                </td>
                <td className="px-4 py-3">{application.job_title}</td>
                <td className="px-4 py-3">
                  <Badge>{application.status}</Badge>
                </td>
                <td className="px-4 py-3">{application.salary ?? "-"}</td>
                <td className="px-4 py-3">{application.location ?? "-"}</td>
                <td className="px-4 py-3">{formatDate(application.applied_at)}</td>
              </tr>
            ))}
            {!filtered.length && (
              <tr>
                <td className="px-4 py-10 text-center text-muted-foreground" colSpan={6}>
                  No applications match the current filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
