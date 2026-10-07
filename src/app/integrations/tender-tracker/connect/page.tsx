"use client";
import { useEffect, useState } from "react";
import {
  Alert,
  Button,
  Container,
  Paper,
  Stack,
  Typography,
} from "@mui/material";
export default function ConnectTracker() {
  const [error, setError] = useState(""),
    [busy, setBusy] = useState(false),
    [signedIn, setSignedIn] = useState(false);
  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => setSignedIn(r.ok))
      .catch(() => setError("Could not check your account"));
  }, []);
  async function connect() {
    setBusy(true);
    setError("");
    try {
      const state = new URLSearchParams(window.location.search).get("state");
      const r = await fetch("/api/integrations/tender-tracker/connect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ state }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error);
      window.location.assign(d.callback);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not connect");
      setBusy(false);
    }
  }
  return (
    <Container maxWidth="sm" sx={{ py: 8 }}>
      <Paper sx={{ p: 4 }}>
        <Stack spacing={3}>
          <Typography variant="h4">Connect Tender Tracker</Typography>
          <Typography>
            Allow Tender Tracker to send the opportunities you explicitly select
            to MedOps. Every new opportunity starts Pending Review. This
            connection cannot read your business records.
          </Typography>
          {error && <Alert severity="error">{error}</Alert>}
          {signedIn ? (
            <Button
              variant="contained"
              disabled={busy}
              onClick={() => void connect()}
            >
              {busy ? "Connecting…" : "Connect my MedOps account"}
            </Button>
          ) : (
            <>
              <Typography>
                Sign in to MedOps, then return to this page to connect.
              </Typography>
              <Button href="/login" target="_blank">
                Sign in to MedOps
              </Button>
              <Button onClick={() => window.location.reload()}>
                I have signed in
              </Button>
            </>
          )}
        </Stack>
      </Paper>
    </Container>
  );
}
