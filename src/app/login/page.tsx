"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Alert,
  Box,
  Button,
  Paper,
  Stack,
  TextField,
  Typography,
  Chip,
} from "@mui/material";
export default function Login() {
  const router = useRouter();
  const [error, setError] = useState(""),
    [busy, setBusy] = useState(false);
  async function login(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setError("");
    const form = new FormData(e.currentTarget);
    try {
      const r = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: form.get("email"),
          password: form.get("password"),
        }),
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data.error);
      router.push("/dashboard");
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Login failed");
      setBusy(false);
    }
  }
  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "grid",
        placeItems: "center",
        p: 3,
        background: "linear-gradient(120deg,#102b36,#0b746d)",
      }}
    >
      <Paper sx={{ p: { xs: 3, sm: 5 }, maxWidth: 450, width: "100%" }}>
        <Stack spacing={3}>
          <Box>
            <Chip label="PRIVATE WORKSPACE" size="small" color="primary" />
            <Typography variant="h3" sx={{ mt: 2, fontWeight: 800 }}>
              MedOps<span style={{ color: "#0b746d" }}>.</span>
            </Typography>
            <Typography color="text.secondary" sx={{ mt: 1 }}>
              Medical equipment operations, together.
            </Typography>
          </Box>
          <Typography variant="h6">Sign in to your workspace</Typography>
          {error && <Alert severity="error">{error}</Alert>}
          <form onSubmit={login}>
            <Stack spacing={2}>
              <TextField
                label="Email"
                type="email"
                name="email"
                autoComplete="username"
                required
                fullWidth
              />
              <TextField
                label="Password"
                type="password"
                name="password"
                autoComplete="current-password"
                required
                fullWidth
              />
              <Button
                type="submit"
                variant="contained"
                size="large"
                disabled={busy}
              >
                {busy ? "Signing in…" : "Sign in"}
              </Button>
            </Stack>
          </form>
          <Typography variant="caption" color="text.secondary">
            Company records stay private. AI features and external data
            processing are disabled.
          </Typography>
        </Stack>
      </Paper>
    </Box>
  );
}
