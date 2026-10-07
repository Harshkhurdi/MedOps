"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Alert, Box, Button, Paper, Stack, Typography } from "@mui/material";
import AiSettings, { type AiConfiguration } from "./ai-settings";
type Status = {
  [key: string]: unknown;
  ai?: AiConfiguration;
  administrator?: boolean;
  error?: string;
};
export default function Settings() {
  const [status, setStatus] = useState<Status>({}),
    [message, setMessage] = useState("");
  function refresh() {
    fetch("/api/settings")
      .then((r) => r.json())
      .then(setStatus)
      .catch(() => setMessage("Could not load settings"));
  }
  useEffect(() => {
    fetch("/api/settings")
      .then((r) => r.json())
      .then(setStatus);
  }, []);
  async function action(url: string) {
    const r = await fetch(url, { method: "POST" });
    const data = await r.json();
    setMessage(
      r.ok
        ? "Completed successfully. " +
            (data.count !== undefined
              ? `${data.count} draft templates added. Review and approve them in Document templates.`
              : "Reminders updated.")
        : (data.error ?? "Operation failed"),
    );
  }
  return (
    <Stack spacing={3}>
      <Box>
        <Typography variant="h4">Settings</Typography>
        <Typography sx={{ mt: 1 }} color="text.secondary">
          Company configuration, employee access and privacy controls.
        </Typography>
      </Box>
      {status.error && <Alert severity="error">{status.error}</Alert>}
      {message && <Alert severity="info">{message}</Alert>}
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" },
          gap: 3,
        }}
      >
        <Paper variant="outlined" sx={{ p: 3 }}>
          <Typography variant="h6">Company & access</Typography>
          <Stack spacing={1} sx={{ mt: 2 }}>
            {[
              ["company", "Company information & reminder intervals"],
              ["users", "User accounts & permissions"],
              ["templates", "Document templates"],
              ["audit", "Audit history"],
            ].map(([href, title]) => (
              <Button
                key={href}
                component={Link}
                href={"/" + href}
                variant="outlined"
              >
                {title}
              </Button>
            ))}
            <Button onClick={() => void action("/api/templates/initialize")}>
              Add standard draft templates
            </Button>
            <Button onClick={() => void action("/api/reminders")}>
              Check reminders now
            </Button>
          </Stack>
        </Paper>
        <Paper variant="outlined" sx={{ p: 3 }}>
          <AiSettings
            key={JSON.stringify(status.ai)}
            config={status.ai}
            administrator={Boolean(status.administrator)}
            onSaved={refresh}
          />
        </Paper>
        <Paper variant="outlined" sx={{ p: 3 }}>
          <Typography variant="h6">Storage & infrastructure</Typography>
          {Object.entries(status)
            .filter(
              ([k]) =>
                ![
                  "aiStatus",
                  "aiProvider",
                  "externalDataProcessing",
                  "error",
                  "ai",
                  "administrator",
                ].includes(k),
            )
            .map(([k, v]) => (
              <Typography key={k} sx={{ mt: 1 }}>
                {k}: {String(v)}
              </Typography>
            ))}
          <Typography color="text.secondary" sx={{ mt: 2 }}>
            Documents are available only through authenticated downloads.
            Connection secrets are managed outside the application.
          </Typography>
        </Paper>
        <Paper variant="outlined" sx={{ p: 3 }}>
          <Typography variant="h6">Backup & recovery</Typography>
          <Typography sx={{ mt: 2 }}>
            Schedule encrypted PostgreSQL backups and private object-storage
            backups separately. Test restoration into isolated infrastructure
            before a recovery is needed.
          </Typography>
          <Typography sx={{ mt: 2 }} color="text.secondary">
            The repository’s backup guide includes database restore commands,
            file inventory checks and recovery verification. Managed database
            retention must be configured in the hosting account.
          </Typography>
        </Paper>
      </Box>
    </Stack>
  );
}
