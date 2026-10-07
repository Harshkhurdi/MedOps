"use client";
import { useEffect, useState } from "react";
import { Alert, Button, Chip, Paper, Stack, Typography } from "@mui/material";
import Link from "next/link";
type Ticket = {
  id: string;
  number: string;
  assignedToId: string;
  customer: { name: string; address: string | null; phone: string | null };
  productName: string;
  serialNumber: string | null;
  issue: string;
  status: string;
  priority: string;
};
type Visit = { id: string; scheduledAt: string; ticket: { number: string } };
export default function ServiceHome({ sla = false }: { sla?: boolean }) {
  const [data, setData] = useState<Record<string, unknown> | null>(null),
    [error, setError] = useState("");
  useEffect(() => {
    const c = new AbortController();
    fetch(sla ? "/api/service/summary" : "/api/engineer", { signal: c.signal })
      .then(async (r) => {
        const d = await r.json();
        if (!r.ok) throw new Error(d.error);
        setData(d);
      })
      .catch((e) => {
        if (e.name !== "AbortError") setError(e.message);
      });
    return () => c.abort();
  }, [sla]);
  return (
    <Stack spacing={2}>
      <Typography variant="h4">
        {sla ? "Service SLA" : "Engineer home"}
      </Typography>
      {sla && (
        <Button href="/api/service/export?format=xlsx">Export SLA Excel</Button>
      )}
      {error && <Alert severity="error">{error}</Alert>}
      {!data && !error && <Typography>Loading service records…</Typography>}
      {sla && data && (
        <>
          <Stack direction="row" sx={{ gap: 1, flexWrap: "wrap" }}>
            {Object.entries(data)
              .filter(([k]) => k !== "breaches")
              .map(([k, v]) => (
                <Chip
                  key={k}
                  label={`${k.replace(/([A-Z])/g, " $1")}: ${v ?? "No completed observations"}`}
                />
              ))}
          </Stack>
          <Typography variant="h6">SLA breaches</Typography>
          {(data.breaches as Ticket[]).map((t) => (
            <Button
              component={Link}
              key={t.id}
              href={`/tickets?record=${t.id}`}
            >
              {t.number} · {t.status}
            </Button>
          ))}
        </>
      )}
      {!sla && data && (
        <>
          {["today", "overdue"].map((key) => (
            <Paper key={key} variant="outlined" sx={{ p: 2 }}>
              <Typography variant="h6">
                {key === "today" ? "Today's visits" : "Overdue visits"}
              </Typography>
              {!(data[key] as Visit[]).length && (
                <Typography>No visits</Typography>
              )}
              {(data[key] as Visit[]).map((v) => (
                <Button
                  component={Link}
                  key={v.id}
                  href={`/ticket-visits?record=${v.id}`}
                >
                  {v.ticket.number} ·{" "}
                  {new Date(v.scheduledAt).toLocaleString("en-IN")}
                </Button>
              ))}
            </Paper>
          ))}
          <Typography variant="h6">Assigned tickets</Typography>
          {!(data.tickets as Ticket[]).length && (
            <Alert severity="info">No open assigned tickets.</Alert>
          )}
          {(data.tickets as Ticket[]).map((t) => (
            <Paper variant="outlined" key={t.id} sx={{ p: 2 }}>
              <Stack spacing={1}>
                <Typography variant="h6">
                  {t.number} · {t.customer.name}
                </Typography>
                <Typography>
                  {t.customer.address} · {t.customer.phone}
                </Typography>
                <Typography>
                  {t.productName} · Serial {t.serialNumber ?? "Not entered"}
                </Typography>
                <Typography>{t.issue}</Typography>
                <Chip label={`${t.priority} · ${t.status}`} />
                <Stack direction="row" spacing={1}>
                  <Button component={Link} href={`/tickets?record=${t.id}`}>
                    Open ticket and contracts
                  </Button>
                  <Button
                    component={Link}
                    href={`/ticket-visits?from=tickets&id=${t.id}`}
                  >
                    Record service visit
                  </Button>
                </Stack>
              </Stack>
            </Paper>
          ))}
        </>
      )}
    </Stack>
  );
}
