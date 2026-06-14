"use client";

import { useMemo, useState } from "react";
import { DndContext, DragEndEvent, PointerSensor, useDroppable, useSensor, useSensors } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { useDraggable } from "@dnd-kit/core";
import { Application, ApplicationStatus, applicationStatuses } from "@/lib/types/application";

function Column({ status, children }: { status: ApplicationStatus; children: React.ReactNode }) {
  const { setNodeRef, isOver } = useDroppable({ id: status });
  return (
    <section ref={setNodeRef} className={`min-h-[420px] rounded-lg border bg-card p-3 ${isOver ? "ring-2 ring-primary" : ""}`}>
      <h2 className="mb-3 text-sm font-semibold">{status}</h2>
      <div className="space-y-3">{children}</div>
    </section>
  );
}

function ApplicationCard({ application }: { application: Application }) {
  const { attributes, listeners, setNodeRef, transform } = useDraggable({ id: application.id });
  return (
    <article
      ref={setNodeRef}
      style={{ transform: CSS.Translate.toString(transform) }}
      className="cursor-grab rounded-md border bg-background p-3 shadow-sm active:cursor-grabbing"
      {...listeners}
      {...attributes}
    >
      <h3 className="text-sm font-semibold">{application.job_title}</h3>
      <p className="mt-1 text-sm text-muted-foreground">{application.company_name}</p>
      <p className="mt-3 text-xs text-muted-foreground">{application.location ?? application.source_platform}</p>
    </article>
  );
}

export function KanbanBoard({ applications }: { applications: Application[] }) {
  const [items, setItems] = useState(applications);
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }));
  const byStatus = useMemo(
    () => Object.fromEntries(applicationStatuses.map((status) => [status, items.filter((item) => item.status === status)])) as Record<ApplicationStatus, Application[]>,
    [items]
  );

  async function onDragEnd(event: DragEndEvent) {
    const id = String(event.active.id);
    const status = event.over?.id as ApplicationStatus | undefined;
    if (!status || !applicationStatuses.includes(status)) return;

    const current = items.find((item) => item.id === id);
    if (!current || current.status === status) return;

    setItems((previous) => previous.map((item) => (item.id === id ? { ...item, status } : item)));
    const response = await fetch(`/api/applications/${id}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status })
    });

    if (!response.ok) {
      setItems((previous) => previous.map((item) => (item.id === id ? current : item)));
    }
  }

  return (
    <DndContext sensors={sensors} onDragEnd={onDragEnd}>
      <div className="grid gap-4 lg:grid-cols-5">
        {applicationStatuses.map((status) => (
          <Column key={status} status={status}>
            {byStatus[status].map((application) => (
              <ApplicationCard key={application.id} application={application} />
            ))}
          </Column>
        ))}
      </div>
    </DndContext>
  );
}
