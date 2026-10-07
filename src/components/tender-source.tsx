"use client";
import { useEffect, useState } from "react";
import {
  Alert,
  Button,
  Checkbox,
  FormControlLabel,
  Link,
  Paper,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import type { TrackerTender } from "@/lib/integrations/tender-tracker-contract";
type Version = {
  id: string;
  snapshot: TrackerTender;
  resolution: string;
  receivedAt: string;
  discoveredAt: string;
  sourceUpdatedAt: string | null;
};
type Import = {
  id: string;
  externalTenderId: string;
  externalSourceUrl: string;
  importedAt: string;
  versions: Version[];
};
const fieldNames = {
  title: "Title",
  institutionName: "Institution",
  state: "State",
  category: "Category",
  deadline: "Deadline",
  publicationDate: "Published",
  description: "Description / notes",
};
export default function TenderSource({
  id,
  row,
  writable,
  onChanged,
}: {
  id: string;
  row: Record<string, unknown>;
  writable: boolean;
  onChanged: () => void;
}) {
  const [data, setData] = useState<{
      updatedAt: string;
      imports: Import[];
    } | null>(null),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false),
    [fields, setFields] = useState<string[]>([]),
    [items, setItems] = useState<Record<string, string>>({}),
    [replaceItems, setReplaceItems] = useState(false);
  useEffect(() => {
    fetch(`/api/tenders/${id}/source`)
      .then(async (r) => {
        const d = await r.json();
        if (!r.ok) throw new Error(d.error);
        setData(d);
      })
      .catch((e) => setError(e.message));
  }, [id]);
  if (error && !data) return <Alert severity="error">{error}</Alert>;
  if (!data?.imports.length) return null;
  function existingItem(item: TrackerTender["items"][number]) {
    return Array.isArray(row.items)
      ? (row.items as Record<string, unknown>[]).find(
          (prior) =>
            prior.sourceItemId === item.id ||
            prior.equipment === item.equipment,
        )
      : undefined;
  }
  const pending = data.imports
    .flatMap((i) => i.versions)
    .filter((v) => v.resolution === "PENDING_REVIEW");
  async function review(versionId: string, action: "ACCEPT" | "KEEP") {
    setBusy(true);
    setError("");
    try {
      const r = await fetch(`/api/tenders/${id}/source`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          versionId,
          action,
          expectedUpdatedAt: data!.updatedAt,
          fields,
          ...(replaceItems && action === "ACCEPT"
            ? {
                items: Object.entries(items).map(([id, q]) => ({
                  id,
                  quantity: Number(q),
                })),
              }
            : {}),
        }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error);
      onChanged();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not review");
    } finally {
      setBusy(false);
    }
  }
  return (
    <Paper variant="outlined" sx={{ p: 2 }}>
      <Stack spacing={2}>
        <Typography variant="h6">Imported from Tender Tracker</Typography>
        <Typography>
          Discovery information only. Pursue, compliance, manufacturers and all
          commercial decisions require your normal MedOps workflow.
        </Typography>
        {error && <Alert severity="error">{error}</Alert>}
        {data.imports.map((link) => (
          <Stack key={link.id} spacing={1}>
            <Link
              href={link.externalSourceUrl}
              target="_blank"
              rel="noopener noreferrer"
            >
              Original tender / source
            </Link>
            <Typography variant="body2">
              Source identity: {link.externalTenderId} · Imported:{" "}
              {new Date(link.importedAt).toLocaleString("en-IN")}
            </Typography>
            {link.versions.map((version, index) => (
              <details
                key={version.id}
                open={index === 0 && version.resolution === "PENDING_REVIEW"}
              >
                <summary>
                  {version.resolution === "PENDING_REVIEW"
                    ? link.versions.length > 1
                      ? "Source Update Available"
                      : "Pending Review"
                    : version.resolution === "ACCEPTED"
                      ? "Source accepted"
                      : "MedOps values kept"}{" "}
                  · {new Date(version.receivedAt).toLocaleString("en-IN")}
                </summary>
                <Typography variant="body2">
                  Discovered: {version.discoveredAt} · Source updated:{" "}
                  {version.sourceUpdatedAt ?? "Not provided"}
                </Typography>
                {Object.entries(fieldNames).map(([key, label]) => {
                  const sourceKey =
                    key === "institutionName" ? "institution" : key;
                  const value =
                    version.snapshot[sourceKey as keyof TrackerTender];
                  if (value === undefined) return null;
                  return (
                    <Stack key={key}>
                      <Typography variant="body2">
                        {label}: MedOps{" "}
                        {String(
                          row[key === "description" ? "notes" : key] ??
                            "Not available",
                        )}{" "}
                        → Source {String(value)}
                      </Typography>
                      {writable &&
                        version.resolution === "PENDING_REVIEW" &&
                        pending[0]?.id === version.id && (
                          <FormControlLabel
                            control={
                              <Checkbox
                                checked={fields.includes(key)}
                                onChange={(_, checked) =>
                                  setFields(
                                    checked
                                      ? [...fields, key]
                                      : fields.filter((f) => f !== key),
                                  )
                                }
                              />
                            }
                            label={`Apply source ${label.toLowerCase()}`}
                          />
                        )}
                    </Stack>
                  );
                })}
                <Typography variant="subtitle2">
                  Individual source items
                </Typography>
                {version.snapshot.items.map((item) => (
                  <Stack
                    key={item.id}
                    data-source-item-id={item.id}
                    direction="row"
                    sx={{ alignItems: "center" }}
                    spacing={1}
                  >
                    {writable &&
                      version.resolution === "PENDING_REVIEW" &&
                      pending[0]?.id === version.id && (
                        <Checkbox
                          checked={item.id in items}
                          onChange={(_, checked) =>
                            setItems((previous) => {
                              const copy = { ...previous };
                              if (checked)
                                copy[item.id] =
                                  item.quantity === null
                                    ? ""
                                    : String(item.quantity);
                              else delete copy[item.id];
                              return copy;
                            })
                          }
                        />
                      )}
                    <Typography>
                      {item.equipment} · Source quantity:{" "}
                      {item.quantity ?? item.quantityText ?? "Not available"} ·{" "}
                      {item.category ?? "Category not provided"}
                      {" · MedOps quantity: "}
                      {String(
                        existingItem(item)?.quantity ?? "No matching item",
                      )}
                    </Typography>
                    {item.sourceUrl && (
                      <Link
                        href={item.sourceUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        Item source
                        {item.sourcePage ? ` p. ${item.sourcePage}` : ""}
                        {item.sourceSheet ? ` ${item.sourceSheet}` : ""}
                        {item.sourceRow ? ` row ${item.sourceRow}` : ""}
                      </Link>
                    )}
                    {item.id in items && (
                      <TextField
                        label="Reviewed quantity"
                        type="number"
                        size="small"
                        value={items[item.id]}
                        onChange={(e) =>
                          setItems({ ...items, [item.id]: e.target.value })
                        }
                      />
                    )}
                  </Stack>
                ))}
                {[
                  ...version.snapshot.documents,
                  ...version.snapshot.references,
                  ...version.snapshot.revisions
                    .filter((r) => r.url)
                    .map((r) => ({
                      label: r.title ?? "Corrigendum / revision",
                      url: r.url!,
                    })),
                ].map((d, n) => (
                  <Link
                    key={n}
                    href={d.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    sx={{ display: "block" }}
                  >
                    {d.label}
                  </Link>
                ))}
                {writable &&
                  version.resolution === "PENDING_REVIEW" &&
                  pending[0]?.id === version.id && (
                    <>
                      <FormControlLabel
                        control={
                          <Checkbox
                            checked={replaceItems}
                            onChange={(_, checked) => setReplaceItems(checked)}
                          />
                        }
                        label="Replace equipment lines with my selected source items and reviewed quantities"
                      />
                      <Typography variant="body2">
                        Unknown quantities require manual confirmation. Existing
                        model/manufacturer/product selections are retained for
                        matching items. Unselected source fields are kept
                        unchanged.
                      </Typography>
                      <Stack direction="row" spacing={1}>
                        <Button
                          disabled={busy}
                          onClick={() => void review(version.id, "ACCEPT")}
                        >
                          Accept selected source values
                        </Button>
                        <Button
                          disabled={busy}
                          onClick={() => void review(version.id, "KEEP")}
                        >
                          Keep MedOps values
                        </Button>
                      </Stack>
                    </>
                  )}
              </details>
            ))}
          </Stack>
        ))}
      </Stack>
    </Paper>
  );
}
