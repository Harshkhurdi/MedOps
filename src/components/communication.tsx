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
export default function Communication() {
  const [configured, setConfigured] = useState(false),
    [form, setForm] = useState({
      recipient: "",
      subject: "",
      text: "",
      relatedModule: "rfqs",
      recordId: "",
      phone: "",
    }),
    [confirmed, setConfirmed] = useState(false),
    [busy, setBusy] = useState(false),
    [message, setMessage] = useState(""),
    [error, setError] = useState("");
  useEffect(() => {
    fetch("/api/communication")
      .then(async (r) => {
        const d = await r.json();
        if (!r.ok) throw new Error(d.error);
        setConfigured(d.emailConfigured);
      })
      .catch((e) => setError(e.message));
  }, []);
  function change(k: string, v: string) {
    setForm({ ...form, [k]: v });
    setConfirmed(false);
  }
  return (
    <Stack spacing={2}>
      <Typography variant="h4">Email & WhatsApp</Typography>
      <Alert severity="info">
        Sharing requires your deliberate action. Review recipients and text.
        Files are never attached or transmitted automatically.
      </Alert>
      {!configured && (
        <Alert severity="info">
          Email provider is not configured. Manual email and WhatsApp remain
          available.
        </Alert>
      )}
      {error && <Alert severity="error">{error}</Alert>}
      {message && <Alert severity="success">{message}</Alert>}
      <TextField
        select
        label="Related module"
        value={form.relatedModule}
        onChange={(e) => change("relatedModule", e.target.value)}
      >
        {["rfqs", "invoices", "amcs", "tickets", "tenders"].map((m) => (
          <MenuItem key={m} value={m}>
            {m}
          </MenuItem>
        ))}
      </TextField>
      {[
        ["recordId", "Related record ID"],
        ["recipient", "Email recipient"],
        ["subject", "Subject"],
        ["text", "Message text"],
        ["phone", "WhatsApp phone with country code"],
      ].map(([k, label]) => (
        <TextField
          key={k}
          label={label}
          value={form[k as keyof typeof form]}
          onChange={(e) => change(k, e.target.value)}
          multiline={k === "text"}
          minRows={k === "text" ? 5 : undefined}
        />
      ))}
      <FormControlLabel
        control={
          <Checkbox
            checked={confirmed}
            onChange={(e) => setConfirmed(e.target.checked)}
          />
        }
        label="I reviewed this recipient and text and want to send this email"
      />
      <Stack direction="row" sx={{ gap: 2, flexWrap: "wrap" }}>
        <Button
          variant="contained"
          disabled={!configured || !confirmed || busy}
          onClick={async () => {
            setBusy(true);
            setError("");
            try {
              const { phone: _, ...data } = form;
              void _;
              const r = await fetch("/api/communication", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  ...data,
                  confirmed,
                  requestId: crypto.randomUUID(),
                }),
              });
              const d = await r.json();
              if (!r.ok) throw new Error(d.error);
              setMessage("Email sending confirmed");
              setConfirmed(false);
            } catch (e) {
              setError((e as Error).message);
            } finally {
              setBusy(false);
            }
          }}
        >
          Send email
        </Button>
        <Button
          component="a"
          href={`mailto:${encodeURIComponent(form.recipient)}?subject=${encodeURIComponent(form.subject)}&body=${encodeURIComponent(form.text)}`}
          disabled={!form.recipient}
        >
          Open manual email
        </Button>
        <Button
          component="a"
          target="_blank"
          rel="noopener noreferrer"
          href={`https://wa.me/${form.phone.replace(/\D/g, "")}?text=${encodeURIComponent(form.text)}`}
          disabled={!/^\+?\d{8,15}$/.test(form.phone) || !form.text}
        >
          Share via WhatsApp
        </Button>
        <Button href="/mail">Email history</Button>
      </Stack>
    </Stack>
  );
}
