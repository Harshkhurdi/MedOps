"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Alert,
  Box,
  Button,
  MenuItem,
  Paper,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { Relation } from "./record-form";
type Row = Record<string, unknown>;
export default function Generator() {
  const [templates, setTemplates] = useState<Row[]>([]),
    [templateId, setTemplateId] = useState(""),
    [sourceModule, setSourceModule] = useState("tenders"),
    [sourceId, setSourceId] = useState(""),
    [format, setFormat] = useState("DOCX"),
    [values, setValues] = useState<Record<string, string>>({}),
    [preview, setPreview] = useState(""),
    [body, setBody] = useState(""),
    [message, setMessage] = useState(""),
    [fileId, setFileId] = useState(""),
    [busy, setBusy] = useState(false);
  useEffect(() => {
    const control = new AbortController();
    fetch("/api/records/templates?limit=100", { signal: control.signal })
      .then(async (r) => {
        const d = await r.json();
        if (!r.ok)
          throw new Error(d.error || "Could not load approved templates");
        setTemplates((d.rows ?? []).filter((t: Row) => t.approved));
      })
      .catch((e) => {
        if (!control.signal.aborted) setMessage(e.message);
      });
    return () => control.abort();
  }, []);
  const [companyDocumentIds, setCompanyDocumentIds] = useState<string[]>([]);
  function clearSource() {
    setPreview("");
    setValues({});
    setBody("");
    setFileId("");
    setMessage("");
  }
  async function bundle() {
    setBusy(true);
    setFileId("");
    setMessage("");
    try {
      const r = await fetch(`/api/tenders/${sourceId}/package`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ companyDocumentIds }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error);
      setFileId(d.fileId);
      setMessage(
        "Complete tender package saved. Review the ZIP in Draft history before marking the bid ready.",
      );
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Packaging failed");
    } finally {
      setBusy(false);
    }
  }
  const fields = [
    ...new Set(
      (body || String(templates.find((t) => t.id === templateId)?.body ?? ""))
        .match(/{{\s*\w+\s*}}/g)
        ?.map((x) => x.replace(/[{}\s]/g, "")) ?? [],
    ),
  ];
  async function generate(isPreview: boolean) {
    setBusy(true);
    setMessage("");
    setFileId("");
    try {
      const r = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          templateId,
          sourceModule,
          sourceId,
          format,
          values,
          preview: isPreview,
        }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error);
      setPreview(d.preview);
      if (isPreview) {
        setValues(d.values);
        setBody(d.body);
      } else {
        setFileId(d.fileId);
        setMessage(
          "Draft generated and stored privately. Download it and confirm your review in Draft history.",
        );
      }
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Generation failed");
    } finally {
      setBusy(false);
    }
  }
  return (
    <Stack spacing={3}>
      <Box>
        <Typography variant="h4">Document generator</Typography>
        <Typography color="text.secondary" sx={{ mt: 1 }}>
          Use approved templates and saved records. Preview, correct and review
          each draft.
        </Typography>
      </Box>
      <Stack direction="row" spacing={1}>
        <Button component={Link} href="/generated" variant="outlined">
          Draft history & review
        </Button>
        <Button component={Link} href="/templates" variant="outlined">
          Document templates
        </Button>
      </Stack>
      <Alert severity="info">
        Manufacturer authorizations and technical compliance decisions must come
        from verified sources. Templates never invent certificate contents or
        assume compliance.
      </Alert>
      {message && (
        <Alert severity={fileId ? "success" : "info"}>{message}</Alert>
      )}
      <Paper variant="outlined" sx={{ p: 3 }}>
        <Stack spacing={2}>
          <TextField
            select
            label="Approved template"
            disabled={busy}
            value={templateId}
            onChange={(e) => {
              setTemplateId(e.target.value);
              clearSource();
            }}
          >
            <MenuItem value="">Select a template</MenuItem>
            {templates.map((t) => (
              <MenuItem key={String(t.id)} value={String(t.id)}>
                {String(t.name)}
              </MenuItem>
            ))}
          </TextField>
          {!templates.length && (
            <Typography color="text.secondary">
              Ask an administrator to add and approve document templates in
              Settings.
            </Typography>
          )}
          <TextField
            select
            label="Source record type"
            disabled={busy}
            value={sourceModule}
            onChange={(e) => {
              setSourceModule(e.target.value);
              setSourceId("");
              clearSource();
            }}
          >
            {[
              ["rfqs", "RFQ"],
              ["ticket-visits", "Engineer service visit"],
              ["tenders", "Tender"],
              ["deliveries", "Delivery"],
              ["installations", "Installation"],
              ["invoices", "Invoice"],
            ].map(([v, l]) => (
              <MenuItem key={v} value={v}>
                {l}
              </MenuItem>
            ))}
          </TextField>
          <Relation
            field={{
              key: "sourceId",
              label: "Source record",
              type: "relation",
              source: sourceModule,
              required: true,
            }}
            disabled={busy}
            value={sourceId}
            root={{}}
            onChange={(v) => {
              setSourceId(String(v));
              clearSource();
            }}
          />
          <TextField
            select
            label="Output format"
            disabled={busy}
            value={format}
            onChange={(e) => {
              setFormat(e.target.value);
              setFileId("");
              setMessage("");
            }}
          >
            {["DOCX", "PDF", "XLSX", "ZIP"].map((f) => (
              <MenuItem key={f} value={f}>
                {f}
              </MenuItem>
            ))}
          </TextField>
          <Button
            variant="outlined"
            disabled={busy || !templateId || !sourceId}
            onClick={() => void generate(true)}
          >
            Load saved information & preview
          </Button>
          {fields.map((key) => (
            <TextField
              key={key}
              disabled={busy}
              label={key.replace(/_/g, " ")}
              value={values[key] ?? ""}
              onChange={(e) => {
                setValues((v) => ({ ...v, [key]: e.target.value }));
                setPreview("");
                setFileId("");
                setMessage("");
              }}
              multiline
              minRows={1}
            />
          ))}
          {Boolean(body) && (
            <Paper sx={{ p: 2, bgcolor: "#f5f8f9" }}>
              <Typography variant="subtitle2">Draft preview</Typography>
              <Typography
                component="pre"
                variant="body2"
                sx={{ whiteSpace: "pre-wrap", overflowWrap: "anywhere" }}
              >
                {body.replace(
                  /{{\s*(\w+)\s*}}/g,
                  (_, key: string) => values[key] || `[Complete ${key}]`,
                )}
              </Typography>
            </Paper>
          )}
          <Button
            variant="contained"
            disabled={busy || !body}
            onClick={() => void generate(false)}
          >
            {busy ? "Preparing…" : "Generate reviewed information as a draft"}
          </Button>
          {sourceModule === "tenders" && sourceId && (
            <Paper variant="outlined" sx={{ p: 2 }}>
              <Stack spacing={2}>
                <Typography variant="h6">Complete tender package</Typography>
                <Typography variant="body2">
                  Generate and review individual DOCX/PDF/XLSX drafts first.
                  This ZIP includes their latest reviewed versions, tender
                  source files and selected company evidence.
                </Typography>
                <Relation
                  field={{
                    key: "companyDocumentIds",
                    label: "Company evidence documents (optional)",
                    type: "multi",
                    source: "documents",
                  }}
                  disabled={busy}
                  value={companyDocumentIds}
                  root={{}}
                  multiple
                  onChange={(v) => {
                    setCompanyDocumentIds(v as string[]);
                    setFileId("");
                    setMessage("");
                  }}
                />
                <Button
                  onClick={() => void bundle()}
                  disabled={busy}
                  variant="outlined"
                >
                  Build complete tender ZIP
                </Button>
              </Stack>
            </Paper>
          )}
          {fileId && (
            <Button href={"/api/files/" + fileId} variant="outlined">
              Download generated draft
            </Button>
          )}
          {preview && !body && (
            <Typography component="pre">{preview}</Typography>
          )}
        </Stack>
      </Paper>
    </Stack>
  );
}
