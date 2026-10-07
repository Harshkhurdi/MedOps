"use client";
import { useEffect, useState } from "react";
import {
  Alert,
  Button,
  Checkbox,
  FormControlLabel,
  MenuItem,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
export default function Ocr() {
  const [moduleFilter, setModule] = useState("documents"),
    [data, setData] = useState<{
      available: boolean;
      message: string;
      files: { id: string; name: string; version: number }[];
    } | null>(null),
    [fileId, setFileId] = useState(""),
    [confirmed, setConfirmed] = useState(false),
    [text, setText] = useState(""),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false);
  useEffect(() => {
    const c = new AbortController();
    fetch(`/api/ocr?module=${moduleFilter}`, { signal: c.signal })
      .then(async (r) => {
        const d = await r.json();
        if (!r.ok) throw new Error(d.error);
        setData(d);
        setError("");
      })
      .catch((e) => {
        if (e.name !== "AbortError") setError(e.message);
      });
    return () => c.abort();
  }, [moduleFilter]);
  return (
    <Stack spacing={2}>
      <Typography variant="h4">Private document OCR</Typography>
      {error && <Alert severity="error">{error}</Alert>}
      {data && (
        <Alert severity={data.available ? "info" : "warning"}>
          {data.message}
        </Alert>
      )}
      <TextField
        label="Document register"
        select
        value={moduleFilter}
        onChange={(e) => {
          setModule(e.target.value);
          setFileId("");
          setConfirmed(false);
          setText("");
        }}
      >
        {[
          "documents",
          "tenders",
          "orders",
          "invoices",
          "tickets",
          "ticket-visits",
          "warranties",
          "amcs",
        ].map((m) => (
          <MenuItem key={m} value={m}>
            {m}
          </MenuItem>
        ))}
      </TextField>
      <TextField
        label="Uploaded document"
        select
        value={fileId}
        onChange={(e) => {
          setFileId(e.target.value);
          setConfirmed(false);
          setText("");
        }}
      >
        <MenuItem value="">Choose a file</MenuItem>
        {data?.files.map((f) => (
          <MenuItem key={f.id} value={f.id}>
            {f.name} · v{f.version}
          </MenuItem>
        ))}
      </TextField>
      <FormControlLabel
        control={
          <Checkbox
            checked={confirmed}
            onChange={(e) => setConfirmed(e.target.checked)}
          />
        }
        label="Process only this file with my private OCR worker; I will verify the extracted text"
      />
      <Button
        disabled={!data?.available || !fileId || !confirmed || busy}
        onClick={async () => {
          setBusy(true);
          setError("");
          try {
            const r = await fetch("/api/ocr", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ fileId, confirmed: true }),
              }),
              d = await r.json();
            if (!r.ok) throw new Error(d.error);
            setText(d.text);
          } catch (e) {
            setError(e instanceof Error ? e.message : "OCR unavailable");
          } finally {
            setBusy(false);
          }
        }}
      >
        Extract text
      </Button>
      {text && (
        <>
          <Alert severity="warning">
            Unverified extracted text. Confirm important values; no record has
            been changed.
          </Alert>
          <TextField
            multiline
            minRows={10}
            label="Unverified extracted text"
            value={text}
            onChange={(e) => setText(e.target.value)}
          />
        </>
      )}
      <Typography>
        Manual entry works in every register. Selectable tender PDFs can still
        be extracted from the tender’s document panel.
      </Typography>
    </Stack>
  );
}
