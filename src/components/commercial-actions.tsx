"use client";
import { useState } from "react";
import { Alert, Button, Stack, TextField } from "@mui/material";
import Link from "next/link";
export default function CommercialActions({
  module,
  row,
  writable,
  onNew,
  onChanged,
}: {
  module: string;
  row: Record<string, unknown>;
  writable: boolean;
  onNew: (row: Record<string, unknown>) => void;
  onChanged: () => void;
}) {
  const [reason, setReason] = useState(""),
    [notes, setNotes] = useState(""),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false);
  async function decide(decision: string) {
    if (
      decision === "REJECT" &&
      !window.confirm(
        "Reject this tender? The decision and reason will be retained in audit history.",
      )
    )
      return;
    setBusy(true);
    setError("");
    try {
      const r = await fetch("/api/records/decisions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tenderId: row.id,
          decision,
          reason: reason || null,
          notes: notes || null,
          confirmed: decision === "REJECT",
        }),
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data.error);
      onChanged();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Decision failed");
    } finally {
      setBusy(false);
    }
  }
  return (
    <Stack spacing={2}>
      {error && <Alert severity="error">{error}</Alert>}
      {module === "tenders" && writable && (
        <>
          <TextField
            label="Commercial decision reason"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
          />
          <TextField
            label="Commercial decision notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            multiline
          />
          <Stack direction="row" spacing={1}>
            <Button disabled={busy} onClick={() => void decide("PURSUE")}>
              Pursue
            </Button>
            <Button
              disabled={busy}
              color="error"
              onClick={() => void decide("REJECT")}
            >
              Reject
            </Button>
            <Button disabled={busy} onClick={() => void decide("REVIEW_LATER")}>
              Review Later
            </Button>
          </Stack>
          <Button
            component={Link}
            href={`/rfqs?from=tenders&id=${encodeURIComponent(String(row.id))}`}
          >
            Create RFQ from tender
          </Button>
        </>
      )}
      {module === "customers" && (
        <Button
          component={Link}
          href={`/rfqs?from=customers&id=${encodeURIComponent(String(row.id))}`}
        >
          Create RFQ for customer
        </Button>
      )}
      {module === "rfqs" && writable && (
        <>
          <Button
            onClick={() =>
              onNew({
                ...row,
                number: "",
                status: "DRAFT",
                sentAt: null,
                historical: false,
                originalDate: null,
                recordSource: "MANUAL",
              })
            }
          >
            Duplicate RFQ
          </Button>
          <Button component={Link} href="/generator">
            Generate RFQ letter
          </Button>
          <Button
            component={Link}
            href={`/quotes?from=rfqs&id=${encodeURIComponent(String(row.id))}`}
          >
            Add manufacturer quote
          </Button>
          <Button component={Link} href="/rfq-followups">
            Record follow-up
          </Button>
        </>
      )}
      {module === "quotes" && writable && (
        <Button
          onClick={() =>
            onNew({
              ...row,
              previousQuoteId: row.id,
              isFinal: false,
              historical: false,
              originalDate: null,
            })
          }
        >
          Add quotation revision
        </Button>
      )}
    </Stack>
  );
}
