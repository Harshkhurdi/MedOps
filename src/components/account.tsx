"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Alert,
  Button,
  Paper,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
export default function Account() {
  const [currentPassword, setCurrent] = useState(""),
    [newPassword, setNew] = useState(""),
    [confirmation, setConfirmation] = useState(""),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false);
  const router = useRouter();
  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const response = await fetch("/api/auth/password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      try {
        for (const key of Object.keys(sessionStorage))
          if (key.startsWith("medops-draft:")) sessionStorage.removeItem(key);
      } catch {
        // The password is already changed even when browser storage is unavailable.
      }
      router.push("/login");
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Password change failed");
    } finally {
      setBusy(false);
    }
  }
  return (
    <Stack spacing={3}>
      <Typography variant="h4">My account</Typography>
      <Typography>
        Change your password. All existing sessions will end, then you can sign
        in again.
      </Typography>
      {error && <Alert severity="error">{error}</Alert>}
      <Paper
        component="form"
        method="post"
        action="/api/auth/password"
        onSubmit={submit}
        variant="outlined"
        sx={{ p: 3, maxWidth: 600 }}
      >
        <Stack spacing={2}>
          <TextField
            label="Current password"
            type="password"
            autoComplete="current-password"
            required
            value={currentPassword}
            onChange={(e) => setCurrent(e.target.value)}
          />
          <TextField
            label="New password"
            type="password"
            autoComplete="new-password"
            required
            value={newPassword}
            onChange={(e) => setNew(e.target.value)}
            helperText="At least 12 characters"
            slotProps={{ htmlInput: { minLength: 12, maxLength: 256 } }}
          />
          <TextField
            label="Confirm new password"
            type="password"
            autoComplete="new-password"
            required
            value={confirmation}
            onChange={(e) => setConfirmation(e.target.value)}
          />
          <Button
            type="submit"
            variant="contained"
            disabled={
              busy || newPassword.length < 12 || newPassword !== confirmation
            }
          >
            Change password and sign out
          </Button>
        </Stack>
      </Paper>
    </Stack>
  );
}
