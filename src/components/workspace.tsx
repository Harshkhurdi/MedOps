"use client";
import LookupFilter from "./lookup-filter";
import TenderSource from "./tender-source";
import CustomerHistory from "./customer-history";
import EquipmentHistory from "./equipment-history";
import ControlSummary from "./control-summary";
import { useState, useEffect, useCallback, useRef } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogContent,
  DialogActions,
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
import CommercialActions from "./commercial-actions";
import { RecordForm } from "./record-form";
type Row = Record<string, unknown>;
const groups: Record<string, [string, string][]> = {
  rfqs: [
    ["rfqs", "RFQs"],
    ["quotes", "Quotations & revisions"],
    ["rfq-followups", "Follow-ups"],
    ["comparisons", "Commercial assumptions"],
    ["comparison", "Compare options"],
  ],
  customers: [
    ["customers", "Customers"],
    ["customer-contacts", "Customer contacts"],
    ["interactions", "Interactions"],
    ["pipeline", "Sales pipeline"],
    ["competitors", "Competitors"],
    ["competitor-customers", "Competitor history"],
    ["manufacturers", "Manufacturers"],
    ["products", "Products"],
    ["manufacturer-contacts", "Manufacturer contacts"],
  ],
  tenders: [
    ["tenders", "Tenders"],
    ["requirements", "Technical compliance"],
    ["decisions", "Go / No-Go"],
    ["results", "Win / Loss"],
    ["checklist", "Bid checklist"],
    ["securities", "Securities"],
    ["approvals", "Approvals"],
    ["approval-policies", "Approval policies"],
  ],
  deliveries: [
    ["deliveries", "Dispatch & delivery"],
    ["equipment", "Installed base"],
    ["installations", "Installations"],
  ],
  tickets: [
    ["tickets", "Service tickets"],
    ["ticket-visits", "Engineer visits"],
    ["engineer", "Engineer home"],
    ["service-sla", "Service SLA"],
    ["sla-rules", "SLA rules"],
  ],
  parts: [
    ["parts", "Spare parts"],
    ["inventory", "Stock transactions"],
  ],
  consumables: [
    ["consumables", "Catalogue"],
    ["compatibility", "Approved compatibility"],
    ["consumable-opportunities", "Opportunities"],
  ],
  amcs: [
    ["amcs", "Contracts"],
    ["visits", "Maintenance visits"],
    ["amc-opportunities", "AMC opportunities"],
  ],
  invoices: [
    ["invoices", "Invoices"],
    ["payments", "Receipts"],
    ["followups", "Follow-ups"],
    ["adjustments", "Financial corrections"],
    ["costs", "Operational costs"],
    ["profitability", "Profitability"],
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
  canExport = true,
  allowedModules,
}: {
  module: string;
  config: ModuleConfig;
  writable: boolean;
  canExport?: boolean;
  allowedModules?: string[];
}) {
  const searchParams = useSearchParams();
  const parent = searchParams.get("parent") ?? "";
  const recordId = searchParams.get("record");
  const sourceModule = searchParams.get("from");
  const sourceId = searchParams.get("id");
  const listRequest = useRef<AbortController | null>(null);
  const [serviceNote, setServiceNote] = useState("");
  const [gemUrl, setGemUrl] = useState(""),
    [gemMessage, setGemMessage] = useState("");
  const [rows, setRows] = useState<Row[]>([]),
    [total, setTotal] = useState(0),
    [page, setPage] = useState(0),
    [q, setQ] = useState(""),
    [status, setStatus] = useState(""),
    [sort, setSort] = useState("newest"),
    [fromDate, setFromDate] = useState(""),
    [toDate, setToDate] = useState(""),
    [dimension, setDimension] = useState(""),
    [dimensionValue, setDimensionValue] = useState(""),
    [loading, setLoading] = useState(true),
    [error, setError] = useState(""),
    [form, setForm] = useState<Row | null | false>(false),
    [detail, setDetail] = useState<Row | null>(null);
  const filters = new URLSearchParams({
    ...(fromDate ? { from: fromDate } : {}),
    ...(toDate ? { to: toDate } : {}),
    ...(dimension && dimensionValue ? { [dimension]: dimensionValue } : {}),
  }).toString();
  const load = useCallback(async () => {
    listRequest.current?.abort();
    const control = new AbortController();
    listRequest.current = control;
    setLoading(true);
    try {
      const response = await fetch(
        `/api/records/${module}?page=${page + 1}&q=${encodeURIComponent(q)}&status=${status}&sort=${sort}&${filters}&parent=${encodeURIComponent(parent)}`,
        { signal: control.signal },
      );
      const data = await response.json();
      if (control.signal.aborted) return;
      if (!response.ok) throw new Error(data.error);
      setError("");
      setRows(data.rows);
      setTotal(data.total);
    } catch (e) {
      if (!control.signal.aborted)
        setError(e instanceof Error ? e.message : "Could not load records");
    } finally {
      if (!control.signal.aborted) setLoading(false);
    }
  }, [module, page, q, status, sort, filters, parent]);
  useEffect(() => {
    const timer = setTimeout(() => void load(), 200);
    return () => {
      clearTimeout(timer);
      listRequest.current?.abort();
    };
  }, [load]);
  useEffect(() => {
    const id = recordId;
    if (!id) return;
    const c = new AbortController();
    fetch(`/api/records/${module}/${encodeURIComponent(id)}`, {
      signal: c.signal,
    })
      .then(async (r) => {
        const d = await r.json();
        if (!r.ok) throw new Error(d.error);
        setDetail(d);
      })
      .catch((e) => {
        if (e.name !== "AbortError") setError(e.message);
      });
    return () => c.abort();
  }, [module, recordId]);
  useEffect(() => {
    const from = sourceModule,
      id = sourceId;
    if (
      !writable ||
      !id ||
      !from ||
      !["rfqs", "quotes", "tickets", "ticket-visits"].includes(module)
    )
      return;
    const control = new AbortController();
    fetch(`/api/lookups/${from}?for=${module}&ids=${encodeURIComponent(id)}`, {
      signal: control.signal,
    })
      .then(async (r) => {
        const d = await r.json();
        if (!r.ok) throw new Error(d.error);
        const source = d.rows[0];
        if (!source) throw new Error("Source record not found");
        const seed: Row = { __new: true };
        if (from === "customers") seed.customerId = id;
        if (module === "tickets" && from === "equipment")
          Object.assign(seed, {
            equipmentId: id,
            customerId: source.customerId,
            serialNumber: source.serialNumber,
            productName: source.productName,
            manufacturerId: source.manufacturerId,
            model: source.model,
            department: source.department,
          });
        if (module === "ticket-visits" && from === "tickets")
          Object.assign(seed, {
            ticketId: id,
            engineerId: source.assignedToId,
          });
        if (from === "tenders")
          Object.assign(seed, {
            tenderId: id,
            customerId: source.customerId,
            productName: source.items[0]?.equipment,
            model: source.items[0]?.model,
            quantity: source.items[0]?.quantity,
            manufacturerId: source.items[0]?.manufacturerId,
            warrantyRequirement: source.warrantyTerms,
            tenderDeadline: source.deadline,
          });
        if (from === "rfqs")
          Object.assign(seed, {
            rfqId: id,
            tenderId: source.tenderId,
            manufacturerId: source.manufacturerId,
            productId: source.productId,
            productName: source.productName,
            model: source.model,
            quantity: source.quantity,
            warranty: source.warrantyRequirement,
          });
        setForm(seed);
      })
      .catch((e) => {
        if (e.name !== "AbortError") setError(e.message);
      });
    return () => control.abort();
  }, [module, writable, sourceModule, sourceId]);
  const tabs = Object.entries(groups)
    .find(
      ([parent, children]) =>
        parent === module || children.some(([child]) => child === module),
    )?.[1]
    ?.filter(([m]) => !allowedModules || allowedModules.includes(m));
  const statuses = config.fields.find((f) =>
    ["status", "stage", "outcome", "decision"].includes(f.key),
  )?.options;
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
            {config.createLabel ??
              (module === "company" ? "Add company profile" : "Add record")}
          </Button>
        )}
      </Stack>
      <Stack direction="row" sx={{ gap: 1, flexWrap: "wrap" }}>
        <TextField
          size="small"
          label="From date"
          type="date"
          slotProps={{ inputLabel: { shrink: true } }}
          value={fromDate}
          onChange={(e) => {
            setFromDate(e.target.value);
            setPage(0);
          }}
        />
        <TextField
          size="small"
          label="To date"
          type="date"
          slotProps={{ inputLabel: { shrink: true } }}
          value={toDate}
          onChange={(e) => {
            setToDate(e.target.value);
            setPage(0);
          }}
        />
        <TextField
          size="small"
          label="Filter by saved record"
          select
          value={dimension}
          onChange={(e) => {
            setDimension(e.target.value);
            setDimensionValue("");
            setPage(0);
          }}
          sx={{ minWidth: 190 }}
        >
          <MenuItem value="">All records</MenuItem>
          {config.fields
            .filter((f) =>
              [
                "customerId",
                "manufacturerId",
                "productId",
                "employeeId",
                "assignedToId",
                "engineerId",
              ].includes(f.key),
            )
            .map((f) => (
              <MenuItem key={f.key} value={f.key}>
                {f.label}
              </MenuItem>
            ))}
        </TextField>
        {dimension && (
          <LookupFilter
            source={
              config.fields.find((f) => f.key === dimension)?.source ??
              "employees"
            }
            value={dimensionValue}
            onChange={(id) => {
              setDimensionValue(id);
              setPage(0);
            }}
            title="Choose a saved record"
          />
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
      {module === "amc-opportunities" && writable && (
        <Button
          variant="outlined"
          onClick={async () => {
            const r = await fetch("/api/opportunities/refresh", {
              method: "POST",
            });
            const d = await r.json();
            if (!r.ok) setError(d.error);
            else void load();
          }}
        >
          Refresh actual contract opportunities
        </Button>
      )}
      {module === "securities" && <ControlSummary module="securities" />}
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
          disabled={!canExport}
          variant="outlined"
          href={`/api/export/${module}?format=xlsx&q=${encodeURIComponent(q)}&status=${encodeURIComponent(status)}&${filters}`}
        >
          Export Excel
        </Button>
        <Button
          disabled={!canExport}
          variant="outlined"
          href={`/api/export/${module}?format=csv&q=${encodeURIComponent(q)}&status=${encodeURIComponent(status)}&${filters}`}
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
            <Typography variant="h6">
              {q || status || filters || parent
                ? "No matching records"
                : "No records yet"}
            </Typography>
            <Typography color="text.secondary" sx={{ mt: 1 }}>
              {q || status || filters || parent
                ? "Adjust your search or filters to find saved records."
                : "Your saved business records will appear here."}
            </Typography>
            {!q &&
              !status &&
              !filters &&
              !parent &&
              writable &&
              !config.readOnly && (
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
                        !config.immutable &&
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
        aria-labelledby="record-form-title"
        onClose={() => setForm(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle id="record-form-title">
          {form && !form.__new ? "Edit" : "Create"} {config.title.toLowerCase()}
        </DialogTitle>
        <DialogContent>
          {form !== false && (
            <RecordForm
              key={`${module}:${String(form?.id ?? `${sourceModule}:${sourceId}`)}`}
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
        aria-labelledby="record-detail-title"
        onClose={() => setDetail(null)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle id="record-detail-title">
          {config.title} record
        </DialogTitle>
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
              {module === "tenders" && detail && (
                <ControlSummary
                  module="checklist"
                  tenderId={String(detail.id)}
                />
              )}
              {module === "tenders" && (
                <TenderSource
                  key={String(detail.updatedAt)}
                  id={String(detail.id)}
                  row={detail}
                  writable={writable}
                  onChanged={() => {
                    setDetail(null);
                    void load();
                  }}
                />
              )}
              {module === "customers" && (
                <CustomerHistory id={String(detail.id)} />
              )}
              {module === "equipment" && (
                <EquipmentHistory id={String(detail.id)} />
              )}
              {module === "tickets" && (
                <EquipmentHistory id={String(detail.id)} coverage />
              )}
              <CommercialActions
                module={module}
                row={detail}
                writable={writable}
                onNew={(seed) => {
                  setDetail(null);
                  setForm({ ...seed, __new: true });
                }}
                onChanged={() => {
                  setDetail(null);
                  void load();
                }}
              />
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
                  <Button
                    component={Link}
                    href={"/" + detail.module + "?record=" + detail.recordId}
                  >
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
                  <Button
                    onClick={async () => {
                      await fetch(`/api/records/notifications/${detail.id}`, {
                        method: "PATCH",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ complete: true }),
                      });
                      setDetail(null);
                      void load();
                    }}
                  >
                    Mark completed
                  </Button>
                </Stack>
              )}
            </Stack>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDetail(null)}>Close record</Button>
        </DialogActions>
      </Dialog>
    </Stack>
  );
}
