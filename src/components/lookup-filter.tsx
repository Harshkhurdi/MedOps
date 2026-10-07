"use client";
import { useEffect, useState } from "react";
import { Autocomplete, TextField } from "@mui/material";
import { label } from "@/lib/ui-config";
type Row = { id: string; [key: string]: unknown };
export default function LookupFilter({
  source,
  value,
  onChange,
  title,
}: {
  source: string;
  value: string;
  onChange: (id: string) => void;
  title: string;
}) {
  const [q, setQ] = useState(""),
    [rows, setRows] = useState<Row[]>([]),
    [error, setError] = useState("");
  useEffect(() => {
    const c = new AbortController(),
      timer = setTimeout(
        () =>
          fetch(
            source === "employees"
              ? "/api/employees"
              : `/api/lookups/${source}?q=${encodeURIComponent(q)}&ids=${encodeURIComponent(value)}`,
            { signal: c.signal },
          )
            .then(async (r) => {
              const d = await r.json();
              if (!r.ok) throw new Error(d.error);
              setRows(d.rows);
              setError("");
            })
            .catch((e) => {
              if (e.name !== "AbortError") setError(e.message);
            }),
        200,
      );
    return () => {
      clearTimeout(timer);
      c.abort();
    };
  }, [source, q, value]);
  return (
    <Autocomplete
      sx={{ minWidth: 230 }}
      options={rows}
      getOptionLabel={(r) => label(r)}
      getOptionKey={(r) => r.id}
      value={rows.find((r) => r.id === value) ?? null}
      isOptionEqualToValue={(a, b) => a.id === b.id}
      onChange={(_, r) => onChange(r?.id ?? "")}
      onInputChange={(_, v, reason) => {
        if (reason === "input") setQ(v);
      }}
      renderInput={(p) => (
        <TextField
          {...p}
          size="small"
          label={title}
          error={Boolean(error)}
          helperText={error || undefined}
        />
      )}
    />
  );
}
