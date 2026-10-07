"use client";
import { useEffect, useState } from "react";
import { Alert, Chip, Stack, Typography } from "@mui/material";
export default function ControlSummary({
  module,
  tenderId,
}: {
  module: string;
  tenderId?: string;
}) {
  const [data, setData] = useState<Record<string, number | string>>({}),
    [error, setError] = useState("");
  useEffect(() => {
    const c = new AbortController();
    fetch(
      "/api/controls/summary" +
        (tenderId ? "?tenderId=" + encodeURIComponent(tenderId) : ""),
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
  }, [tenderId]);
  return (
    <Stack spacing={1}>
      {error ? (
        <Alert severity="error">{error}</Alert>
      ) : (
        <>
          <Typography variant="h6">
            {module === "checklist"
              ? "Checklist completion"
              : "Security totals"}
          </Typography>
          <Stack direction="row" sx={{ gap: 1, flexWrap: "wrap" }}>
            {Object.entries(data).map(([k, v]) => (
              <Chip
                key={k}
                label={`${k.replace(/([A-Z])/g, " $1")}: ${v}${k === "percent" ? "%" : ""}`}
              />
            ))}
          </Stack>
        </>
      )}
    </Stack>
  );
}
