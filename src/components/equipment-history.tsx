"use client";
import { useEffect, useState } from "react";
import { Alert, Button, Paper, Stack, Typography } from "@mui/material";
import Link from "next/link";
import { label, pretty } from "@/lib/ui-config";
export default function EquipmentHistory({
  id,
  coverage = false,
}: {
  id: string;
  coverage?: boolean;
}) {
  const [data, setData] = useState<Record<string, unknown>>({}),
    [error, setError] = useState("");
  useEffect(() => {
    const c = new AbortController();
    fetch(
      coverage
        ? `/api/service/tickets/${id}/coverage`
        : `/api/equipment/${id}/timeline`,
      { signal: c.signal },
    )
      .then(async (r) => {
        const d = await r.json();
        if (!r.ok) throw new Error(d.error);
        setData(d);
      })
      .catch((e) => {
        if (e.name !== "AbortError") setError(e.message);
      });
    return () => c.abort();
  }, [id, coverage]);
  return (
    <Stack spacing={1}>
      <Typography variant="h6">
        {coverage ? "Actual warranty / AMC coverage" : "Equipment timeline"}
      </Typography>
      {error && <Alert severity="error">{error}</Alert>}
      {Object.entries(data)
        .filter(([k]) => k !== "equipment")
        .map(([k, v]) => (
          <Paper key={k} variant="outlined" sx={{ p: 2 }}>
            <Typography sx={{ fontWeight: 700 }}>
              {k.replace(/([A-Z])/g, " $1")}
            </Typography>
            {Array.isArray(v) ? (
              v.length ? (
                v.map((row, i) => (
                  <Typography
                    key={String(row.id ?? i)}
                    sx={{ whiteSpace: "pre-wrap" }}
                  >
                    {label(row)} ·{" "}
                    {[
                      "status",
                      "commencement",
                      "startDate",
                      "endDate",
                      "reportedAt",
                      "scheduledAt",
                      "completedAt",
                      "workDone",
                      "type",
                      "quantity",
                      "reason",
                    ]
                      .filter((f) => row[f] != null)
                      .map((f) => `${f}: ${pretty(row[f])}`)
                      .join(" · ")}
                  </Typography>
                ))
              ) : (
                <Typography>No records</Typography>
              )
            ) : (
              <Typography>{pretty(v)}</Typography>
            )}
          </Paper>
        ))}
      {!coverage && (
        <Button component={Link} href={`/tickets?from=equipment&id=${id}`}>
          New Service Ticket for this equipment
        </Button>
      )}
    </Stack>
  );
}
