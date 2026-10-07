"use client";
import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogContent,
  DialogTitle,
  Divider,
  LinearProgress,
  MenuItem,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  TextField,
  Typography,
} from "@mui/material";
import { type ModuleConfig, pretty } from "@/lib/ui-config";
import { RecordForm } from "./record-form";
type Row = Record<string, unknown>;
const groups: Record<string, [string, string][]> = {
  customers: [
    ["customers", "Customers"],
    ["manufacturers", "Manufacturers"],
    ["products", "Products"],
  ],
  tenders: [
    ["tenders", "Tenders"],
    ["requirements", "Technical compliance"],
  ],
  deliveries: [
    ["deliveries", "Dispatch & delivery"],
    ["equipment", "Serial numbers"],
    ["installations", "Installations"],
  ],
  amcs: [
    ["amcs", "Contracts"],
    ["visits", "Service visits"],
  ],
  invoices: [
    ["invoices", "Invoices"],
    ["payments", "Receipts"],
    ["followups", "Follow-ups"],
  ],
  documents: [
    ["documents", "Document library"],
    ["company", "Company profile"],
  ],
  generated: [
    ["generator", "Generate documents"],
    ["generated", "Draft history"],
    ["templates", "Templates"],
  ],
};
function FilePanel({
  module,
  rowId,
  writable,
}: {
  module: string;
  rowId: string;
  writable: boolean;
}) {
  const [files, setFiles] = useState<Row[]>([]),
    [busy, setBusy] = useState(false),
    [progress, setProgress] = useState(0),
    [message, setMessage] = useState(""),
    [extracted, setExtracted] = useState("");
  const load = useCallback(async () => {
    const r = await fetch(`/api/files?module=${module}&recordId=${rowId}`);
    if (r.ok) setFiles(await r.json());
  }, [module, rowId]);
  useEffect(() => {
    const timer = setTimeout(() => void load(), 0);
    return () => clearTimeout(timer);
  }, [load]);
  function upload(file: File) {
    setBusy(true);
    setMessage("");
    const form = new FormData();
    form.set("module", module);
    form.set("recordId", rowId);
    form.set("file", file);
    const xhr = new XMLHttpRequest();
    xhr.open("POST", "/api/files");
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable)
        setProgress(Math.round((e.loaded / e.total) * 100));
    };
    xhr.onload = () => {
      setBusy(false);
      const result = JSON.parse(xhr.responseText);
      if (xhr.status < 300) {
        setMessage("File stored privately. Previous versions are retained.");
        void load();
      } else setMessage(result.error ?? "Upload failed");
    };
    xhr.onerror = () => {
      setBusy(false);
      setMessage("Upload failed. Try again.");
    };
    xhr.send(form);
  }
  return (
    <Stack spacing={2}>
      <Typography variant="h6">Private files</Typography>
      <Typography variant="body2" color="text.secondary">
        PDF, DOCX, XLSX, PNG or JPEG · maximum 4 MB. A replacement retains the
        earlier version.
      </Typography>
      <Button component="label" variant="outlined" disabled={busy || !writable}>
        Upload document
        <input
          hidden
          type="file"
          accept=".pdf,.docx,.xlsx,.png,.jpg,.jpeg"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) upload(file);
            e.target.value = "";
          }}
        />
      </Button>
      {busy && <LinearProgress variant="determinate" value={progress} />}{" "}
      {message && <Alert severity="info">{message}</Alert>}
      {files.map((f) => (
        <Stack
          key={String(f.id)}
          direction={{ xs: "column", sm: "row" }}
          spacing={1}
          sx={{ alignItems: "center" }}
        >
          <Typography sx={{ flex: 1 }}>
            {String(f.name)} <Chip label={`v${f.version}`} size="small" />
          </Typography>
          <Button href={"/api/files/" + f.id}>Download</Button>
          {["application/pdf", "image/png", "image/jpeg"].includes(
            String(f.mime),
          ) && (
            <Button href={"/api/files/" + f.id + "?preview=1"} target="_blank">
              Preview
            </Button>
          )}
          {module === "tenders" && writable && f.mime === "application/pdf" && (
            <Button
              onClick={async () => {
                const r = await fetch("/api/tenders/extract", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ fileId: f.id }),
                });
                const data = await r.json();
                setExtracted(data.text ?? data.error ?? "");
                setMessage(data.message ?? "");
              }}
            >
              Extract text
            </Button>
          )}
        </Stack>
      ))}
      {!files.length && (
        <Typography color="text.secondary">
          No documents uploaded yet.
        </Typography>
      )}
      {extracted && (
        <TextField
          label="Extracted selectable text — review before using"
          value={extracted}
          multiline
          minRows={6}
          fullWidth
          onChange={(e) => setExtracted(e.target.value)}
        />
      )}
    </Stack>
  );
}
export default function Workspace({
  module,
  config,
  writable,
}: {
  module: string;
  config: ModuleConfig;
  writable: boolean;
}) {
  const [serviceNote, setServiceNote] = useState("");
  const [gemUrl, setGemUrl] = useState(""),
    [gemMessage, setGemMessage] = useState("");
  const [rows, setRows] = useState<Row[]>([]),
    [total, setTotal] = useState(0),
    [page, setPage] = useState(0),
    [q, setQ] = useState(""),
    [status, setStatus] = useState(""),
    [sort, setSort] = useState("newest"),
    [loading, setLoading] = useState(true),
    [error, setError] = useState(""),
    [form, setForm] = useState<Row | null | false>(false),
    [detail, setDetail] = useState<Row | null>(null);
  const load = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch(
        `/api/records/${module}?page=${page + 1}&q=${encodeURIComponent(q)}&status=${status}&sort=${sort}`,
      );
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      setError("");
      setRows(data.rows);
      setTotal(data.total);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not load records");
    } finally {
      setLoading(false);
    }
  }, [module, page, q, status, sort]);
  useEffect(() => {
    const timer = setTimeout(() => void load(), 200);
    return () => clearTimeout(timer);
  }, [load]);
  const tabs = Object.entries(groups).find(
    ([parent, children]) =>
      parent === module || children.some(([child]) => child === module),
  )?.[1];
  const statuses = config.fields.find((f) => f.key === "status")?.options;
  const value = (row: Row, key: string) => row[key];
  async function review(record: Row, name = module) {
    const r = await fetch(`/api/review/${name}/${record.id}`, {
      method: "POST",
    });
    const data = await r.json();
    if (!r.ok) setError(data.error);
    else {
      setDetail(null);
      void load();
    }
  }
  return (
    <Stack spacing={3}>
      <Stack
        direction={{ xs: "column", sm: "row" }}
        sx={{ justifyContent: "space-between" }}
        spacing={2}
      >
        <Box>
          <Typography variant="h4">{config.title}</Typography>
          <Typography color="text.secondary" sx={{ mt: 1 }}>
            {config.description}
          </Typography>
        </Box>
        {writable && !config.readOnly && (
          <Button
            variant="contained"
            onClick={() => setForm(null)}
            sx={{ alignSelf: "center", whiteSpace: "nowrap" }}
          >
            Add {module === "company" ? "company profile" : "record"}
          </Button>
        )}
      </Stack>
      {tabs && (
        <Stack direction="row" spacing={1} sx={{ flexWrap: "wrap" }}>
          {tabs.map(([href, title]) => (
            <Button
              key={href}
              component={Link}
              href={"/" + href}
              variant={href === module ? "contained" : "outlined"}
              size="small"
            >
              {title}
            </Button>
          ))}
        </Stack>
      )}
      {module === "tenders" && (
        <Alert severity="info">
          GeM metadata and PDF text can assist manual entry. Portal restrictions
          and scanned documents are never bypassed.
        </Alert>
      )}
      {module === "tenders" && writable && (
        <Paper variant="outlined" sx={{ p: 2 }}>
          <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
            <TextField
              label="GeM tender URL for public metadata"
              value={gemUrl}
              onChange={(e) => setGemUrl(e.target.value)}
              size="small"
              sx={{ flex: 1 }}
            />
            <Button
              variant="outlined"
              disabled={!gemUrl}
              onClick={async () => {
                try {
                  const r = await fetch("/api/tenders/import", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ url: gemUrl }),
                  });
                  const d = await r.json();
                  setGemMessage(
                    d.error ?? `${d.title ?? ""} ${d.message ?? ""}`,
                  );
                } catch {
                  setGemMessage(
                    "Public metadata could not be retrieved. Use manual entry.",
                  );
                }
              }}
            >
              Read public metadata
            </Button>
          </Stack>
          {gemMessage && (
            <Alert severity="info" sx={{ mt: 2 }}>
              {gemMessage}
            </Alert>
          )}
        </Paper>
      )}
      <Stack direction="row" spacing={1} sx={{ flexWrap: "wrap" }}>
        <Button
          variant="outlined"
          href={`/api/export/${module}?format=xlsx&q=${encodeURIComponent(q)}&status=${encodeURIComponent(status)}`}
        >
          Export Excel
        </Button>
        <Button
          variant="outlined"
          href={`/api/export/${module}?format=csv&q=${encodeURIComponent(q)}&status=${encodeURIComponent(status)}`}
        >
          Export CSV
        </Button>
        <Button onClick={() => void load()}>Refresh records</Button>
      </Stack>
      {error && (
        <Alert severity="error" onClose={() => setError("")}>
          {error}
        </Alert>
      )}
      <Paper variant="outlined">
        <Stack
          direction={{ xs: "column", sm: "row" }}
          spacing={2}
          sx={{ p: 2 }}
        >
          <TextField
            label="Search records"
            size="small"
            value={q}
            onChange={(e) => {
              setQ(e.target.value);
              setPage(0);
            }}
            sx={{ flex: 1 }}
          />
          {statuses && (
            <TextField
              select
              label="Filter by status"
              size="small"
              value={status}
              onChange={(e) => {
                setStatus(e.target.value);
                setPage(0);
              }}
              sx={{ minWidth: 180 }}
            >
              <MenuItem value="">All statuses</MenuItem>
              {statuses.map((s) => (
                <MenuItem key={s} value={s}>
                  {s.replace(/_/g, " ")}
                </MenuItem>
              ))}
            </TextField>
          )}
          <TextField
            select
            label="Sort"
            size="small"
            value={sort}
            onChange={(e) => setSort(e.target.value)}
            sx={{ minWidth: 160 }}
          >
            <MenuItem value="newest">Newest first</MenuItem>
            <MenuItem value="oldest">Oldest first</MenuItem>
          </TextField>
        </Stack>
        {loading ? (
          <Box sx={{ p: 6, textAlign: "center" }}>
            <CircularProgress size={28} />
          </Box>
        ) : !rows.length ? (
          <Box sx={{ p: 6, textAlign: "center" }}>
            <Typography variant="h6">No records yet</Typography>
            <Typography color="text.secondary" sx={{ mt: 1 }}>
              Your saved business records will appear here.
            </Typography>
            {writable && !config.readOnly && (
              <Button sx={{ mt: 2 }} onClick={() => setForm(null)}>
                Create your first record
              </Button>
            )}
          </Box>
        ) : (
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  {config.columns.map((c) => (
                    <TableCell
                      key={c}
                      sx={{ fontWeight: 700, bgcolor: "#f8fafb" }}
                    >
                      {c
                        .replace(/([A-Z])/g, " $1")
                        .replace(/^./, (s) => s.toUpperCase())}
                    </TableCell>
                  ))}
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {rows.map((r) => (
                  <TableRow key={String(r.id)} hover>
                    {config.columns.map((c) => (
                      <TableCell key={c}>
                        {c === "status" || c === "priority" ? (
                          <Chip label={pretty(value(r, c), c)} size="small" />
                        ) : (
                          pretty(value(r, c), c)
                        )}
                      </TableCell>
                    ))}
                    <TableCell>
                      <Button size="small" onClick={() => setDetail(r)}>
                        View
                      </Button>
                      {writable &&
                        !config.readOnly &&
                        ![
                          "payments",
                          "invoices",
                          "equipment",
                          "warranties",
                        ].includes(module) && (
                          <Button size="small" onClick={() => setForm(r)}>
                            Edit
                          </Button>
                        )}
                      {module === "notifications" && (
                        <Button
                          size="small"
                          onClick={async () => {
                            await fetch(`/api/records/notifications/${r.id}`, {
                              method: "PATCH",
                              headers: { "Content-Type": "application/json" },
                              body: JSON.stringify({ read: true }),
                            });
                            void load();
                          }}
                        >
                          Mark read
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
        <TablePagination
          component="div"
          count={total}
          page={page}
          onPageChange={(_, p) => setPage(p)}
          rowsPerPage={20}
          rowsPerPageOptions={[20]}
        />
      </Paper>
      <Dialog
        open={form !== false}
        onClose={() => setForm(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          {form ? "Edit" : "Create"} {config.title.toLowerCase()}
        </DialogTitle>
        <DialogContent>
          {form !== false && (
            <RecordForm
              key={String(form?.id ?? "new")}
              module={module}
              config={config}
              row={form ?? undefined}
              onSaved={() => {
                setForm(false);
                void load();
              }}
              onCancel={() => setForm(false)}
            />
          )}
        </DialogContent>
      </Dialog>
      <Dialog
        open={Boolean(detail)}
        onClose={() => setDetail(null)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>{config.title} record</DialogTitle>
        <DialogContent>
          {detail && (
            <Stack spacing={2}>
              {Object.entries(detail)
                .filter(
                  ([k, v]) =>
                    !["id", "updatedAt", "passwordHash", "snapshot"].includes(
                      k,
                    ) &&
                    !Array.isArray(v) &&
                    typeof v !== "object",
                )
                .map(([key, v]) => (
                  <Box key={key}>
                    <Typography variant="caption" color="text.secondary">
                      {key.replace(/([A-Z])/g, " $1")}
                    </Typography>
                    <Typography sx={{ whiteSpace: "pre-wrap" }}>
                      {pretty(v, key)}
                    </Typography>
                  </Box>
                ))}
              {Object.entries(detail)
                .filter(
                  ([k, v]) =>
                    v &&
                    typeof v === "object" &&
                    !Array.isArray(v) &&
                    !["snapshot", "additionalFields"].includes(k),
                )
                .map(([key, v]) => (
                  <Box key={key}>
                    <Typography variant="caption" color="text.secondary">
                      {key}
                    </Typography>
                    <Typography>{pretty(v, key)}</Typography>
                  </Box>
                ))}
              {Object.entries(detail)
                .filter(
                  ([k, v]) =>
                    Array.isArray(v) && !["files", "permissions"].includes(k),
                )
                .map(([key, v]) => (
                  <Box key={key}>
                    <Typography variant="h6">{key}</Typography>
                    {(v as Row[]).map((item, i) => (
                      <Paper key={i} variant="outlined" sx={{ p: 2, my: 1 }}>
                        {Object.entries(item)
                          .filter(
                            ([k, x]) =>
                              !["id", "createdAt", "updatedAt"].includes(k) &&
                              !k.endsWith("Id") &&
                              typeof x !== "object",
                          )
                          .map(([k, x]) => (
                            <Typography key={k} variant="body2">
                              {k}: {pretty(x, k)}
                            </Typography>
                          ))}
                      </Paper>
                    ))}
                  </Box>
                ))}
              {module === "invoices" && (
                <Alert severity="info">
                  Outstanding:{" "}
                  {pretty(value(detail, "outstanding"), "outstanding")}
                </Alert>
              )}
              {module === "warranties" && writable && (
                <Stack spacing={1}>
                  <TextField
                    label="New warranty service note"
                    value={serviceNote}
                    onChange={(e) => setServiceNote(e.target.value)}
                    multiline
                  />
                  <Button
                    disabled={!serviceNote.trim()}
                    onClick={async () => {
                      const r = await fetch(
                        `/api/warranties/${detail.id}/notes`,
                        {
                          method: "POST",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({ note: serviceNote }),
                        },
                      );
                      const d = await r.json();
                      if (!r.ok) setError(d.error);
                      else {
                        setServiceNote("");
                        setDetail(null);
                        void load();
                      }
                    }}
                  >
                    Add service note to history
                  </Button>
                </Stack>
              )}
              {config.files && (
                <>
                  <Divider />
                  <FilePanel
                    module={module}
                    rowId={String(detail.id)}
                    writable={writable}
                  />
                </>
              )}
              {module === "generated" && (
                <Stack direction="row" spacing={2}>
                  <Button href={"/api/files/" + (detail.file as Row)?.id}>
                    Download draft
                  </Button>
                  {writable && (
                    <Button onClick={() => void review(detail, "generated")}>
                      Confirm draft reviewed
                    </Button>
                  )}
                </Stack>
              )}
              {module === "tenders" && writable && (
                <Button variant="outlined" onClick={() => void review(detail)}>
                  Confirm bid package reviewed
                </Button>
              )}
              {module === "notifications" && (
                <Stack direction="row">
                  <Button component={Link} href={"/" + detail.module}>
                    Open related module
                  </Button>
                  <Button
                    onClick={async () => {
                      await fetch(`/api/records/notifications/${detail.id}`, {
                        method: "PATCH",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ dismiss: true }),
                      });
                      setDetail(null);
                      void load();
                    }}
                  >
                    Dismiss
                  </Button>
                </Stack>
              )}
            </Stack>
          )}
        </DialogContent>
      </Dialog>
    </Stack>
  );
}
