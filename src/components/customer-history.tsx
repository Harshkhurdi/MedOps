"use client";
import { useEffect, useState } from "react";
import { Alert, Button, Paper, Stack, Typography } from "@mui/material";
import Link from "next/link";
import { label, pretty } from "@/lib/ui-config";
export default function CustomerHistory({ id }: { id: string }) {
  const [data, setData] = useState<Record<string, unknown>>({}),
    [error, setError] = useState("");
  useEffect(() => {
    const c = new AbortController();
    fetch(`/api/customers/${id}/timeline`, { signal: c.signal })
      .then(async (r) => {
        const d = await r.json();
        if (!r.ok) throw new Error(d.error);
        setData(d);
      })
      .catch((e) => {
        if (e.name !== "AbortError") setError(e.message);
      });
    return () => c.abort();
  }, [id]);
  return (
    <Stack spacing={2}>
      <Typography variant="h6">Customer history</Typography>
      {error && <Alert severity="error">{error}</Alert>}
      {data.outstanding !== undefined && (
        <Typography>
          Outstanding: {pretty(data.outstanding, "amount")}
        </Typography>
      )}
      {Object.entries(data)
        .filter(([, v]) => Array.isArray(v))
        .map(([module, v]) => (
          <Paper variant="outlined" sx={{ p: 2 }} key={module}>
            <Typography sx={{ fontWeight: 700 }}>{pretty(module)}</Typography>
            {(v as Record<string, unknown>[]).length ? (
              (v as Record<string, unknown>[]).map((r) => (
                <Stack
                  key={String(r.id)}
                  direction="row"
                  sx={{ gap: 1, alignItems: "center", flexWrap: "wrap" }}
                >
                  <Button component={Link} href={`/${module}?record=${r.id}`}>
                    {label(r)}
                  </Button>
                  <Typography variant="body2">
                    {[
                      "status",
                      "stage",
                      "department",
                      "occurredAt",
                      "invoiceDate",
                      "startDate",
                      "endDate",
                      "notes",
                    ]
                      .filter((k) => r[k] != null)
                      .map((k) => pretty(r[k], k))
                      .join(" · ")}
                  </Typography>
                </Stack>
              ))
            ) : (
              <Typography>No records</Typography>
            )}
          </Paper>
        ))}
      <Typography variant="caption">
        Most recent 500 records per section. Open the register for older
        records.
      </Typography>
    </Stack>
  );
}
