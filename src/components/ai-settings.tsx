"use client";
import { useState } from "react";
import {
  Alert,
  Button,
  Checkbox,
  Chip,
  FormControlLabel,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
export type AiConfiguration = {
  aiEnabled: boolean;
  aiModel: string;
  aiDailyLimit: number;
  aiMaxOutputTokens: number;
  configured: boolean;
  available: boolean;
  providerLoggingAllowed: boolean;
};
export default function AiSettings({
  config,
  administrator,
  onSaved,
}: {
  config?: AiConfiguration;
  administrator: boolean;
  onSaved: () => void;
}) {
  const [values, setValues] = useState({
      aiEnabled: config?.aiEnabled ?? false,
      aiModel: config?.aiModel ?? "",
      aiDailyLimit: config?.aiDailyLimit ?? 10,
      aiMaxOutputTokens: config?.aiMaxOutputTokens ?? 1200,
    }),
    [message, setMessage] = useState(""),
    [busy, setBusy] = useState(false);
  async function save() {
    setBusy(true);
    setMessage("");
    try {
      const r = await fetch("/api/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      const data = await r.json();
      setMessage(r.ok ? "AI settings saved." : data.error);
      if (r.ok) onSaved();
    } catch {
      setMessage("Could not save settings");
    } finally {
      setBusy(false);
    }
  }
  return (
    <Stack spacing={2}>
      <Typography variant="h6">AI Features</Typography>
      <Chip
        label={`AI Features: ${config?.available ? "Enabled" : "Disabled"}`}
        color="primary"
        sx={{ alignSelf: "start" }}
      />
      <Typography>
        Provider: OpenRouter. Only employee-entered text is shared after
        explicit consent. Stored documents and records are excluded.
      </Typography>
      {!config?.configured && (
        <Alert severity="info">
          Add the private OpenRouter API key to the hosting environment and
          select a model. Keep the key out of chat, Git and browser code.
        </Alert>
      )}
      <Typography variant="body2" color="text.secondary">
        {config?.providerLoggingAllowed
          ? "The selected free NVIDIA endpoint logs submitted text for security and product improvement. Only non-confidential text is allowed, with confirmation before every request."
          : "Privacy controls require zero-retention providers and prohibit data collection. Requests fail if no eligible provider is available. The free NVIDIA endpoint is incompatible with this mode."}{" "}
        Set a spending limit on your OpenRouter key.
      </Typography>
      {administrator && (
        <>
          <TextField
            label="OpenRouter model ID"
            value={values.aiModel}
            onChange={(e) => setValues({ ...values, aiModel: e.target.value })}
            placeholder="provider/model"
          />
          <TextField
            label="Daily requests per employee"
            type="number"
            value={values.aiDailyLimit}
            onChange={(e) =>
              setValues({ ...values, aiDailyLimit: Number(e.target.value) })
            }
            slotProps={{ htmlInput: { min: 1, max: 100 } }}
          />
          <TextField
            label="Maximum output tokens per request"
            type="number"
            value={values.aiMaxOutputTokens}
            onChange={(e) =>
              setValues({
                ...values,
                aiMaxOutputTokens: Number(e.target.value),
              })
            }
            slotProps={{ htmlInput: { min: 100, max: 4000 } }}
          />
          <FormControlLabel
            control={
              <Checkbox
                checked={values.aiEnabled}
                onChange={(e) =>
                  setValues({ ...values, aiEnabled: e.target.checked })
                }
              />
            }
            label="Enable employee AI requests"
          />
          <Button
            disabled={busy}
            variant="outlined"
            onClick={() => void save()}
          >
            Save AI settings
          </Button>
        </>
      )}
      {message && <Alert severity="info">{message}</Alert>}
    </Stack>
  );
}
