"use client";
import LookupFilter from "./lookup-filter";
import { useEffect, useState } from "react";
import {
  Alert,
  Button,
  MenuItem,
  Paper,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import Link from "next/link";
import { pretty } from "@/lib/ui-config";
type Action = {
  id: string;
  module: string;
  label: string;
  action: string;
  dueAt: string | null;
  priority: string;
  employeeId: string | null;
  href: string;
};
export default function Brief() {
  const [actions, setActions] = useState<Action[]>([]),
    [error, setError] = useState(""),
    [moduleFilter, setModule] = useState(""),
    [employee, setEmployee] = useState(""),
    [priority, setPriority] = useState("");
  useEffect(() => {
    const c = new AbortController();
    fetch(
      `/api/brief?${new URLSearchParams({ module: moduleFilter, employeeId: employee, priority })}`,
      { signal: c.signal },
    )
      .then(async (r) => {
        const d = await r.json();
        if (!r.ok) throw new Error(d.error);
        setActions(d.actions);
        setError("");
      })
      .catch((e) => {
        if (e.name !== "AbortError") setError(e.message);
      });
    return () => c.abort();
  }, [moduleFilter, employee, priority]);
  return (
    <Stack spacing={2}>
      <Typography variant="h4">Today’s brief</Typography>
      <Typography color="text.secondary">
        Actions from actual deadlines, contract dates, balances and service
        records.
      </Typography>
      <Stack direction="row" sx={{ gap: 2, flexWrap: "wrap" }}>
        <TextField
          label="Module"
          select
          value={moduleFilter}
          onChange={(e) => setModule(e.target.value)}
          sx={{ minWidth: 180 }}
        >
          {[
            "",
            "tenders",
            "rfqs",
            "rfq-followups",
            "quotes",
            "securities",
            "orders",
            "deliveries",
            "equipment",
            "tickets",
            "ticket-visits",
            "parts",
            "amcs",
            "amc-opportunities",
            "consumable-opportunities",
            "invoices",
            "followups",
            "interactions",
            "tasks",
          ].map((m) => (
            <MenuItem key={m} value={m}>
              {m || "All modules"}
            </MenuItem>
          ))}
        </TextField>
        <LookupFilter
          source="employees"
          value={employee}
          onChange={setEmployee}
          title="Employee (optional)"
        />
        <TextField
          label="Priority"
          select
          value={priority}
          onChange={(e) => setPriority(e.target.value)}
          sx={{ minWidth: 150 }}
        >
          {["", "HIGH", "NORMAL", "LOW"].map((p) => (
            <MenuItem key={p} value={p}>
              {p || "All priorities"}
            </MenuItem>
          ))}
        </TextField>
      </Stack>
      {error && <Alert severity="error">{error}</Alert>}
      {actions.map((a) => (
        <Paper
          key={`${a.module}-${a.id}-${a.action}`}
          variant="outlined"
          sx={{ p: 2 }}
        >
          <Stack
            direction="row"
            sx={{ gap: 2, justifyContent: "space-between", flexWrap: "wrap" }}
          >
            <Stack>
              <Typography sx={{ fontWeight: 700 }}>
                {a.action} · {a.label}
              </Typography>
              <Typography variant="body2">
                {a.module} · {a.priority}{" "}
                {a.dueAt && `· ${pretty(a.dueAt, "dueAt")}`}
              </Typography>
            </Stack>
            <Button component={Link} href={a.href}>
              Open record
            </Button>
          </Stack>
        </Paper>
      ))}
      {!actions.length && !error && (
        <Alert severity="info">No actions match these filters.</Alert>
      )}
      <Typography variant="caption">
        Up to 500 records per register. Manual records remain available in their
        registers. No AI processing.
      </Typography>
    </Stack>
  );
}
