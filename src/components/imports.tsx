"use client";
import { useState } from "react";
import {
  Alert,
  Button,
  Checkbox,
  FormControlLabel,
  MenuItem,
  Paper,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { configs, pretty } from "@/lib/ui-config";
const names = [
  "customers",
  "manufacturers",
  "products",
  "equipment",
  "warranties",
  "amcs",
  "invoices",
  "payments",
  "parts",
];
export default function Imports() {
  const [name, setName] = useState("customers"),
    [file, setFile] = useState<{ headers: string[]; rows: string[][] } | null>(
      null,
    ),
    [mapping, setMapping] = useState<Record<string, string>>({}),
    [preview, setPreview] = useState<Record<string, unknown> | null>(null),
    [report, setReport] = useState<Record<string, unknown> | null>(null),
    [confirmed, setConfirmed] = useState(false),
    [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  const fields = configs[name].fields.filter((f) => f.type !== "items");
  async function request(url: string, options: RequestInit) {
    setBusy(true);
    setError("");
    try {
      const r = await fetch(url, options),
        d = await r.json();
      if (!r.ok) throw new Error(d.error);
      return d;
    } catch (e) {
      setError(e instanceof Error ? e.message : "Import failed");
      return null;
    } finally {
      setBusy(false);
    }
  }
  return (
    <Stack spacing={2}>
      <Typography variant="h4">Controlled historical import</Typography>
      <Alert severity="info">
        Upload CSV or a single-sheet Excel file, map fields, review validation,
        then confirm. Up to 100 rows and 4 MB per upload. Original dates and
        linked record IDs must be entered. Imports keep manual workflows and
        financial safeguards.
      </Alert>
      <TextField
        label="Register"
        select
        value={name}
        onChange={(e) => {
          setName(e.target.value);
          setPreview(null);
          setReport(null);
          setConfirmed(false);
          setMapping({});
        }}
      >
        {names.map((n) => (
          <MenuItem key={n} value={n}>
            {configs[n].title}
          </MenuItem>
        ))}
      </TextField>
      <Button component="label" disabled={busy}>
        Upload CSV / Excel
        <input
          hidden
          type="file"
          accept=".csv,.xlsx"
          onChange={async (e) => {
            const f = e.target.files?.[0];
            if (!f) return;
            const form = new FormData();
            form.set("file", f);
            const d = await request("/api/imports/upload", {
              method: "POST",
              body: form,
            });
            if (d) {
              setFile(d);
              setPreview(null);
              setReport(null);
              setConfirmed(false);
              setMapping(
                Object.fromEntries(
                  fields
                    .filter((x) => d.headers.includes(x.key))
                    .map((x) => [x.key, x.key]),
                ),
              );
            }
            e.target.value = "";
          }}
        />
      </Button>
      {error && <Alert severity="error">{error}</Alert>}
      {file && (
        <>
          <Typography>
            {file.rows.length} rows loaded. Map required fields; relation fields
            use saved record IDs.
          </Typography>
          <Paper variant="outlined" sx={{ p: 2 }}>
            <Stack spacing={2}>
              {fields
                .filter((f) => !["historical", "recordSource"].includes(f.key))
                .map((f) => (
                  <TextField
                    key={f.key}
                    label={`${f.label}${f.required ? " *" : ""}`}
                    select
                    value={mapping[f.key] ?? ""}
                    onChange={(e) => {
                      const next = { ...mapping };
                      if (e.target.value) next[f.key] = e.target.value;
                      else delete next[f.key];
                      setMapping(next);
                      setPreview(null);
                      setConfirmed(false);
                    }}
                  >
                    <MenuItem value="">Use default / blank</MenuItem>
                    {file.headers.map((h) => (
                      <MenuItem key={h} value={h}>
                        {h}
                      </MenuItem>
                    ))}
                  </TextField>
                ))}
            </Stack>
          </Paper>
          <Button
            disabled={busy}
            onClick={async () => {
              const d = await request("/api/imports", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ module: name, ...file, mapping }),
              });
              if (d) {
                setPreview(d);
                setReport(null);
                setConfirmed(false);
              }
            }}
          >
            Validate and preview
          </Button>
        </>
      )}
      {preview && (
        <>
          <Typography variant="h6">Validation preview</Typography>
          {(
            preview.preview as { row: number; status: string; error?: string }[]
          ).map((r) => (
            <Alert
              key={r.row}
              severity={r.status === "VALID" ? "success" : "error"}
            >
              Row {r.row}: {r.status} {r.error}
            </Alert>
          ))}
          <Paper
            variant="outlined"
            sx={{ p: 2, maxHeight: 300, overflow: "auto" }}
          >
            <Typography
              component="pre"
              variant="body2"
              sx={{ whiteSpace: "pre-wrap" }}
            >
              {JSON.stringify(preview.payload, null, 2)}
            </Typography>
          </Paper>
          <FormControlLabel
            control={
              <Checkbox
                checked={confirmed}
                onChange={(e) => setConfirmed(e.target.checked)}
              />
            }
            label="I reviewed the mapped values, original dates and rejected rows; import valid rows"
          />
          <Button
            disabled={busy || !confirmed}
            onClick={async () => {
              const d = await request(`/api/imports/${preview.id}`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ confirmed: true }),
              });
              if (d) setReport(d);
            }}
          >
            Confirm import
          </Button>
          <Button
            disabled={busy}
            onClick={async () => {
              const d = await request(`/api/imports/${preview.id}`, {});
              if (d) setReport(d);
            }}
          >
            Refresh saved report
          </Button>
        </>
      )}
      {report && (
        <>
          <Typography variant="h6">Import report</Typography>
          <Alert severity="info">
            Imported: {String(report.importedCount)} · Rejected:{" "}
            {String(report.rejectedCount)}
          </Alert>
          {(report.rows as Record<string, unknown>[]).map((r) => (
            <Typography key={String(r.row)}>
              Row {String(r.row)} · {pretty(r.status)} ·{" "}
              {String(r.error ?? r.id ?? "")}
            </Typography>
          ))}
        </>
      )}
    </Stack>
  );
}
