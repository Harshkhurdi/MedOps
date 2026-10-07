"use client";
import { useState, useEffect } from "react";
import {
  Alert,
  Autocomplete,
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
import { type Field, type ModuleConfig, label } from "@/lib/ui-config";
type Row = Record<string, unknown>;
const permissionModules = [
  "dashboard",
  "tasks",
  "reports",
  "ai",
  "company",
  "customers",
  "manufacturers",
  "products",
  "documents",
  "tenders",
  "requirements",
  "templates",
  "generated",
  "orders",
  "deliveries",
  "equipment",
  "installations",
  "warranties",
  "amcs",
  "visits",
  "invoices",
  "payments",
  "followups",
  "notifications",
];
export function Relation({
  field,
  value,
  onChange,
  root,
  multiple = false,
}: {
  field: Field;
  value: unknown;
  onChange: (value: unknown) => void;
  root: Row;
  multiple?: boolean;
}) {
  const [options, setOptions] = useState<Row[]>([]),
    [search, setSearch] = useState("");
  useEffect(() => {
    const control = new AbortController();
    const timer = setTimeout(async () => {
      try {
        if (field.source === "orderItems") {
          const orderId = root.orderId;
          if (!orderId) {
            setOptions([]);
            return;
          }
          const response = await fetch(
            `/api/lookups/orders?for=${root.__module ?? ""}&ids=${encodeURIComponent(String(orderId))}`,
            {
              signal: control.signal,
            },
          );
          if (response.ok) {
            const data = await response.json();
            setOptions(data.rows?.[0]?.items ?? []);
          }
          return;
        }
        if (field.source === "files") {
          const response = await fetch(
            `/api/lookups/documents?for=${root.__module ?? ""}`,
            {
              signal: control.signal,
            },
          );
          if (response.ok) {
            const data = await response.json();
            setOptions(data.rows.flatMap((r: Row) => (r.files ?? []) as Row[]));
          }
          return;
        }
        const response = await fetch(
          field.source === "employees"
            ? "/api/employees"
            : `/api/lookups/${field.source}?for=${root.__module ?? ""}&q=${encodeURIComponent(search)}&ids=${encodeURIComponent((multiple ? ((value as string[]) ?? []) : value ? [String(value)] : []).join(","))}&customerId=${encodeURIComponent(String(root.customerId ?? ""))}`,
          { signal: control.signal },
        );
        if (!response.ok) {
          setOptions([]);
          return;
        }
        const data = await response.json();
        let rows = data.rows as Row[];
        if (field.key === "tenderId" && root.items)
          rows = rows.filter((r) => r.status === "WON");
        if (field.source === "equipment" && root.customerId)
          rows = rows.filter((r) => r.customerId === root.customerId);
        setOptions(rows);
      } catch {}
    }, 250);
    return () => {
      clearTimeout(timer);
      control.abort();
    };
  }, [
    field.source,
    field.key,
    root.orderId,
    root.customerId,
    root.items,
    root.__module,
    multiple,
    value,
    search,
  ]);
  const selected = multiple
    ? ((value as string[]) ?? []).map(
        (id) => options.find((r) => r.id === id) ?? { id, name: id },
      )
    : (options.find((r) => r.id === value) ??
      (value ? { id: value, name: String(value) } : null));
  return (
    <Autocomplete<Row, boolean, false, false>
      multiple={multiple}
      options={options}
      value={selected as Row | Row[] | null}
      filterOptions={(x) => x}
      isOptionEqualToValue={(a, b) => a.id === b.id}
      getOptionLabel={(r) => label(r)}
      onInputChange={(_, v, reason) => {
        if (reason === "input") setSearch(v);
      }}
      onChange={(_, v) =>
        onChange(
          multiple
            ? (v as Row[]).map((r) => String(r.id))
            : ((v as Row | null)?.id ?? ""),
        )
      }
      renderInput={(params) => (
        <TextField
          {...params}
          label={field.label}
          required={field.required && !value}
          helperText="Type to search saved records"
        />
      )}
    />
  );
}
function initial(config: ModuleConfig, row?: Row) {
  const values: Row = {};
  for (const f of config.fields) {
    let value =
      row?.[f.key] ??
      f.default ??
      (f.type === "boolean"
        ? false
        : f.type === "items"
          ? []
          : f.type === "multi"
            ? []
            : f.type === "permissions"
              ? []
              : f.type === "custom"
                ? {}
                : "");
    if (f.type === "date" && value) value = String(value).slice(0, 10);
    if (f.type === "datetime-local" && value) {
      const d = new Date(String(value));
      value = new Date(d.getTime() - d.getTimezoneOffset() * 60000)
        .toISOString()
        .slice(0, 16);
    }
    if (f.key === "equipmentIds" && row?.equipment)
      value = (row.equipment as Row[]).map((e) => e.equipmentId);
    values[f.key] = value;
  }
  return values;
}
export function RecordForm({
  module,
  config,
  row,
  onSaved,
  onCancel,
}: {
  module: string;
  config: ModuleConfig;
  row?: Row;
  onSaved: () => void;
  onCancel: () => void;
}) {
  const [values, setValues] = useState<Row>(() => initial(config, row)),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false);
  async function setField(key: string, value: unknown) {
    setValues((v) => ({ ...v, [key]: value }));
    if (module === "orders" && key === "tenderId" && value) {
      const r = await fetch(`/api/lookups/tenders?for=orders&ids=${value}`);
      if (r.ok) {
        const t = (await r.json()).rows[0];
        if (!t) return;
        setValues((v) => ({
          ...v,
          customerId: t.customerId,
          deliveryDeadline: "",
          paymentTerms: t.deliveryTerms ?? "",
          items: t.items.map((i: Row) => ({
            equipment: i.equipment,
            model: i.model ?? "",
            manufacturerId: i.manufacturerId ?? "",
            quantity: i.quantity,
            unitPrice: "",
            taxRate: "0",
          })),
        }));
      }
    }
    if (
      ["deliveries", "invoices"].includes(module) &&
      key === "orderId" &&
      value
    ) {
      const r = await fetch(`/api/lookups/orders?for=${module}&ids=${value}`);
      if (r.ok) {
        const o = (await r.json()).rows[0];
        if (!o) return;
        setValues((v) => ({
          ...v,
          customerId: o.customerId,
          ...(module === "deliveries"
            ? {
                location: o.customer?.address ?? "",
                items: o.items.map((i: Row) => ({
                  orderItemId: i.id,
                  quantity: 1,
                })),
              }
            : { paymentTermDays: v.paymentTermDays || 30 }),
        }));
      }
    }
    if (module === "equipment" && key === "deliveryId" && value) {
      const r = await fetch(
        `/api/lookups/deliveries?for=equipment&ids=${value}`,
      );
      if (r.ok) {
        const d = (await r.json()).rows[0];
        if (!d) return;
        setValues((v) => ({
          ...v,
          orderId: d.orderId,
          customerId: d.order.customerId,
          orderItemId: d.items[0]?.orderItemId ?? "",
        }));
      }
    }
  }
  function normalize(f: Field, value: unknown): unknown {
    if (f.type === "boolean") return Boolean(value);
    if (f.type === "items")
      return ((value as Row[]) ?? []).map((item) =>
        Object.fromEntries(
          (f.fields ?? []).map((sub) => [
            sub.key,
            normalize(sub, item[sub.key]),
          ]),
        ),
      );
    if (f.type === "multi" || f.type === "permissions" || f.type === "custom")
      return value;
    if (value === "" || value == null) return f.required ? "" : null;
    if (f.type === "datetime-local")
      return new Date(String(value)).toISOString();
    return value;
  }
  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setError("");
    setBusy(true);
    try {
      if (
        values.status === "CANCELLED" &&
        !window.confirm(
          "Cancel this record? The change will be recorded in the audit history.",
        )
      )
        return;
      const data = Object.fromEntries(
        config.fields.map((f) => [f.key, normalize(f, values[f.key])]),
      );
      if (module === "users" && !data.password) delete data.password;
      const response = await fetch(
        `/api/records/${module}${row ? "/" + row.id : ""}`,
        {
          method: row ? "PATCH" : "POST",
          headers: {
            "Content-Type": "application/json",
            ...(row ? { "If-Match": JSON.stringify(row.updatedAt) } : {}),
          },
          body: JSON.stringify(data),
        },
      );
      const result = await response.json();
      if (!response.ok) throw new Error(result.error);
      onSaved();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Save failed");
    } finally {
      setBusy(false);
    }
  }
  function input(
    f: Field,
    value: unknown,
    onChange: (v: unknown) => void,
    root = values,
  ): React.ReactNode {
    if (f.type === "relation" || f.type === "multi")
      return (
        <Relation
          field={f}
          value={value}
          onChange={onChange}
          root={{ ...root, __module: module }}
          multiple={f.type === "multi"}
        />
      );
    if (f.type === "boolean")
      return (
        <FormControlLabel
          control={
            <Checkbox
              checked={Boolean(value)}
              onChange={(e) => onChange(e.target.checked)}
            />
          }
          label={f.label}
        />
      );
    if (f.type === "items")
      return (
        <Stack spacing={2}>
          <Typography sx={{ fontWeight: 700 }}>{f.label}</Typography>
          {(value as Row[]).map((item, i) => (
            <Paper variant="outlined" sx={{ p: 2 }} key={i}>
              <Stack spacing={2}>
                {f.fields?.map((sub) => (
                  <Box key={sub.key}>
                    {input(sub, item[sub.key], (v) =>
                      onChange(
                        (value as Row[]).map((r, n) =>
                          n === i ? { ...r, [sub.key]: v } : r,
                        ),
                      ),
                    )}
                  </Box>
                ))}
                <Button
                  color="error"
                  onClick={() =>
                    onChange((value as Row[]).filter((_, n) => n !== i))
                  }
                >
                  Remove item
                </Button>
              </Stack>
            </Paper>
          ))}
          <Button
            variant="outlined"
            onClick={() =>
              onChange([
                ...(value as Row[]),
                Object.fromEntries(
                  (f.fields ?? []).map((sub) => [
                    sub.key,
                    sub.default ?? (sub.key === "quantity" ? 1 : ""),
                  ]),
                ),
              ])
            }
          >
            Add item
          </Button>
        </Stack>
      );
    if (f.type === "permissions") {
      const permissions = (value ?? []) as {
        module: string;
        read: boolean;
        write: boolean;
      }[];
      return (
        <Box>
          <Typography sx={{ fontWeight: 700 }}>Module permissions</Typography>
          {permissionModules.map((m) => {
            const p = permissions.find((p) => p.module === m) ?? {
              module: m,
              read: false,
              write: false,
            };
            return (
              <Box
                key={m}
                sx={{ display: "flex", alignItems: "center", gap: 2 }}
              >
                <Typography sx={{ width: 150 }}>{m}</Typography>
                {(["read", "write"] as const).map((k) => (
                  <FormControlLabel
                    key={k}
                    label={k === "read" ? "View" : "Edit"}
                    control={
                      <Checkbox
                        checked={p[k]}
                        onChange={(e) =>
                          onChange([
                            ...permissions.filter((p) => p.module !== m),
                            {
                              ...p,
                              [k]: e.target.checked,
                              ...(k === "write" && e.target.checked
                                ? { read: true }
                                : {}),
                            },
                          ])
                        }
                      />
                    }
                  />
                ))}
              </Box>
            );
          })}
        </Box>
      );
    }
    if (f.type === "custom") {
      const entries = Object.entries(value as Record<string, string>);
      return (
        <Stack spacing={1}>
          <Typography>{f.label}</Typography>
          {entries.map(([key, v], i) => (
            <Stack direction="row" spacing={1} key={i}>
              <TextField
                label="Field name"
                value={key}
                onChange={(e) =>
                  onChange(
                    Object.fromEntries(
                      entries.map((entry, n) =>
                        n === i ? [e.target.value, v] : entry,
                      ),
                    ),
                  )
                }
              />
              <TextField
                label="Value"
                value={v}
                onChange={(e) =>
                  onChange({ ...(value as object), [key]: e.target.value })
                }
              />
            </Stack>
          ))}
          <Button
            onClick={() =>
              onChange({
                ...(value as object),
                [`Additional field ${entries.length + 1}`]: "",
              })
            }
          >
            Add company field
          </Button>
        </Stack>
      );
    }
    return (
      <TextField
        fullWidth
        label={f.label}
        required={f.required}
        value={value ?? ""}
        type={
          f.key === "password"
            ? "password"
            : f.type === "textarea" || f.type === "select"
              ? "text"
              : (f.type ?? "text")
        }
        select={f.type === "select"}
        multiline={f.type === "textarea"}
        minRows={f.type === "textarea" ? 3 : undefined}
        onChange={(e) => onChange(e.target.value)}
        slotProps={{
          inputLabel: {
            shrink: ["date", "datetime-local"].includes(f.type ?? "")
              ? true
              : undefined,
          },
          htmlInput: f.type === "number" ? { min: 0, step: "any" } : {},
        }}
      >
        {f.options?.map((o) => (
          <MenuItem key={o} value={o}>
            {o.replace(/_/g, " ")}
          </MenuItem>
        ))}
      </TextField>
    );
  }
  return (
    <form onSubmit={submit}>
      <Stack spacing={2} sx={{ py: 1 }}>
        {error && <Alert severity="error">{error}</Alert>}
        {config.fields.map((f) => (
          <Box key={f.key}>
            {input(f, values[f.key], (v) => void setField(f.key, v))}
          </Box>
        ))}
        <Stack direction="row" spacing={2} sx={{ justifyContent: "flex-end" }}>
          <Button onClick={onCancel}>Cancel</Button>
          <Button type="submit" variant="contained" disabled={busy}>
            {busy ? "Saving…" : "Save record"}
          </Button>
        </Stack>
      </Stack>
    </form>
  );
}
