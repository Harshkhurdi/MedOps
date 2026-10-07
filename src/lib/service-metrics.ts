export type TicketMetrics = {
  status: string;
  priority: string;
  reportedAt: Date;
  assignedAt: Date | null;
  firstVisitAt: Date | null;
  resolvedAt: Date | null;
  assignmentDueAt: Date | null;
  firstVisitDueAt: Date | null;
  resolutionDueAt: Date | null;
};
export function slaMetrics<T extends TicketMetrics>(
  rows: T[],
  now = new Date(),
) {
  const closed = ["RESOLVED", "CLOSED", "CANCELLED"];
  const average = (field: "assignedAt" | "firstVisitAt" | "resolvedAt") => {
    const samples = rows.filter((r) => r[field]);
    return samples.length
      ? Math.round(
          samples.reduce(
            (s, r) =>
              s + (r[field]!.getTime() - r.reportedAt.getTime()) / 60000,
            0,
          ) / samples.length,
        )
      : null;
  };
  const breaches = rows.filter(
    (r) =>
      r.status !== "CANCELLED" &&
      (
        [
          ["assignmentDueAt", "assignedAt"],
          ["firstVisitDueAt", "firstVisitAt"],
          ["resolutionDueAt", "resolvedAt"],
        ] as const
      ).some(
        ([due, actual]) =>
          r[due] &&
          (r[actual]
            ? r[actual]! > r[due]!
            : !closed.includes(r.status) && now > r[due]!),
      ),
  );
  return {
    open: rows.filter((r) => !closed.includes(r.status)).length,
    critical: rows.filter(
      (r) => r.priority === "CRITICAL" && !closed.includes(r.status),
    ).length,
    waitingForParts: rows.filter((r) => r.status === "WAITING_FOR_PARTS")
      .length,
    averageAssignmentMinutes: average("assignedAt"),
    averageFirstVisitMinutes: average("firstVisitAt"),
    averageResolutionMinutes: average("resolvedAt"),
    slaBreaches: breaches.length,
    breaches,
  };
}
