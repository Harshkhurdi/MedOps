"use client";
import { useEffect, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Checkbox,
  FormControlLabel,
  MenuItem,
  Paper,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
type Configuration = {
  available: boolean;
  configured: boolean;
  aiModel: string;
  remaining: number;
  aiDailyLimit: number;
  providerLoggingAllowed: boolean;
};
export default function AiAssistant({ writable }: { writable: boolean }) {
  const [config, setConfig] = useState<Configuration | null>(null),
    [purpose, setPurpose] = useState("DRAFT_LETTER"),
    [text, setText] = useState(""),
    [consent, setConsent] = useState(false),
    [nonConfidential, setNonConfidential] = useState(false),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [result, setResult] = useState("");
  useEffect(() => {
    fetch("/api/ai")
      .then(async (r) => {
        const data = await r.json();
        if (!r.ok) throw new Error(data.error);
        setConfig(data);
      })
      .catch((e) => setError(e.message));
  }, []);
  async function submit() {
    setBusy(true);
    setError("");
    setResult("");
    try {
      const response = await fetch("/api/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          purpose,
          text,
          consent,
          ...(nonConfidential ? { nonConfidential: true } : {}),
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      setResult(data.text);
      setConfig((c) => (c ? { ...c, remaining: data.remaining } : c));
      if (data.truncated)
        setError(
          "The draft reached the output limit. Narrow your request for a complete response.",
        );
    } catch (e) {
      setError(e instanceof Error ? e.message : "AI request failed");
    } finally {
      setBusy(false);
      setConsent(false);
      setNonConfidential(false);
    }
  }
  return (
    <Stack spacing={3}>
      <Box>
        <Typography variant="h4">AI writing assistant</Typography>
        <Typography color="text.secondary" sx={{ mt: 1 }}>
          Draft letters, build checklists, improve wording and explain text you
          provide.
        </Typography>
      </Box>
      <Alert severity="info">
        Only the text you enter below is sent to OpenRouter and its provider
        after you approve each request. Stored records and documents are never
        attached. AI cannot change records or send messages.
      </Alert>
      {config?.providerLoggingAllowed && (
        <Alert severity="warning">
          NVIDIA logs text sent to this free model for security and product
          improvement. Do not enter company documents, customer details,
          personal information, passwords, pricing or confidential business
          text.
        </Alert>
      )}
      {config && !config.available && (
        <Alert severity="warning">
          AI is disabled
          {!config.configured
            ? " or awaiting its private API key/model"
            : " by your administrator"}
          . All business workflows remain available.
        </Alert>
      )}
      {!writable && (
        <Alert severity="info">
          Your administrator must grant AI request permission before you can use
          the assistant.
        </Alert>
      )}
      {error && <Alert severity="error">{error}</Alert>}
      <Paper variant="outlined" sx={{ p: 3 }}>
        <Stack spacing={2}>
          <TextField
            select
            label="What would you like help with?"
            value={purpose}
            onChange={(e) => {
              setPurpose(e.target.value);
              setConsent(false);
              setNonConfidential(false);
            }}
          >
            {[
              ["DRAFT_LETTER", "Draft a letter"],
              ["MAKE_CHECKLIST", "Create a checklist"],
              ["REWRITE", "Improve wording"],
              ["EXPLAIN", "Explain text"],
            ].map(([id, name]) => (
              <MenuItem key={id} value={id}>
                {name}
              </MenuItem>
            ))}
          </TextField>
          <TextField
            label="Text to send — review before approving"
            multiline
            minRows={8}
            value={text}
            onChange={(e) => {
              setText(e.target.value);
              setConsent(false);
              setNonConfidential(false);
            }}
            slotProps={{ htmlInput: { maxLength: 8000 } }}
            helperText={`${text.length}/8000 characters. Remove any information you do not want shared externally.`}
          />
          <FormControlLabel
            control={
              <Checkbox
                checked={consent}
                onChange={(e) => setConsent(e.target.checked)}
              />
            }
            label="I approve sending only the text above to OpenRouter and its AI provider."
          />
          {config?.providerLoggingAllowed && (
            <FormControlLabel
              control={
                <Checkbox
                  checked={nonConfidential}
                  onChange={(e) => setNonConfidential(e.target.checked)}
                />
              }
              label="This text contains no confidential or personal information. I understand NVIDIA logs it."
            />
          )}
          <Button
            variant="contained"
            disabled={
              busy ||
              !writable ||
              !config?.available ||
              config.remaining <= 0 ||
              !consent ||
              (config.providerLoggingAllowed && !nonConfidential) ||
              text.trim().length < 10
            }
            onClick={() => void submit()}
          >
            {busy ? "Preparing draft…" : "Send approved text"}
          </Button>
          {config?.available && (
            <Typography variant="body2" color="text.secondary">
              Model: {config.aiModel} · {config.remaining} requests remaining
              today (India time). Failed attempts also count toward the limit.
            </Typography>
          )}
        </Stack>
      </Paper>
      {result && (
        <Paper variant="outlined" sx={{ p: 3 }}>
          <Stack spacing={2}>
            <Typography variant="h6">Draft — review before use</Typography>
            <Typography
              sx={{ whiteSpace: "pre-wrap", overflowWrap: "anywhere" }}
            >
              {result}
            </Typography>
            <Button
              onClick={() =>
                void navigator.clipboard
                  .writeText(result)
                  .catch(() =>
                    setError(
                      "Could not copy. Select and copy the draft manually.",
                    ),
                  )
              }
            >
              Copy draft
            </Button>
          </Stack>
        </Paper>
      )}
    </Stack>
  );
}
