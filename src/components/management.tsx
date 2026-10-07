"use client";
import LookupFilter from "./lookup-filter";
import { useEffect, useState } from "react";
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  MenuItem,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from "@mui/material";
import { pretty } from "@/lib/ui-config";
export default function Management({ view = "analytics" }: { view?: string }) {
  const [data, setData] = useState<Record<string, unknown> | null>(null),
    [error, setError] = useState(""),
    [from, setFrom] = useState(""),
    [to, setTo] = useState(""),
    [filter, setFilter] = useState(""),
    [value, setValue] = useState(""),
    [query, setQuery] = useState(""),
    [rank, setRank] = useState("revenue"),
    [format, setFormat] = useState("xlsx");
  useEffect(() => {
    const c = new AbortController();
    fetch(`/api/management?view=${view}&${query}`, { signal: c.signal })
      .then(async (r) => {
        const d = await r.json();
        if (!r.ok) throw new Error(d.error);
        setData(d);
        setError("");
      })
      .catch((e) => {
        if (e.name !== "AbortError") setError(e.message);
      });
    return () => c.abort();
  }, [view, query]);
  const profit = data?.profitability as {
    policy: string;
    revenue: string;
    recordedCosts: string;
    grossContribution: string;
    contributionMarginPercent: string;
    serviceCost: string;
    postSaleCost: string;
    groups: Record<string, unknown>[];
  } | null;
  const table = (rows: Record<string, unknown>[], key: string) =>
    rows.length ? (
      <TableContainer key={key} component={Paper} variant="outlined">
        <Typography variant="h6" sx={{ p: 2 }}>
          {pretty(key)}
        </Typography>
        <Table size="small">
          <TableHead>
            <TableRow>
              {Object.keys(rows[0]).map((k) => (
                <TableCell key={k}>
                  {pretty(k.replace(/([A-Z])/g, " $1"))}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {rows.map((r, i) => (
              <TableRow key={i}>
                {Object.entries(r).map(([k, v]) => (
                  <TableCell key={k}>{pretty(v, k)}</TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    ) : (
      <Alert key={key} severity="info">
        No {pretty(key)} records for these filters.
      </Alert>
    );
  const rankedCustomers = [
    ...((data?.customerMetrics ?? []) as Record<string, unknown>[]),
  ].sort((a, b) => {
    if (a[rank] == null) return b[rank] == null ? 0 : 1;
    if (b[rank] == null) return -1;
    const score = (v: unknown) => {
      const [whole, fraction = ""] = String(v).split(".");
      return BigInt(whole) * 100n + BigInt(fraction.padEnd(2, "0"));
    };
    const left = score(a[rank]),
      right = score(b[rank]);
    return left === right
      ? String(a.customer).localeCompare(String(b.customer))
      : left > right
        ? -1
        : 1;
  });
  return (
    <Stack spacing={3}>
      <Typography variant="h4">
        {view === "profitability"
          ? "Operational profitability"
          : view === "executive"
            ? "Executive management"
            : "Customer, manufacturer & product analytics"}
      </Typography>
      <Stack direction="row" sx={{ gap: 2, flexWrap: "wrap" }}>
        <TextField
          label="From"
          type="date"
          value={from}
          onChange={(e) => setFrom(e.target.value)}
          slotProps={{ inputLabel: { shrink: true } }}
        />
        <TextField
          label="To"
          type="date"
          value={to}
          onChange={(e) => setTo(e.target.value)}
          slotProps={{ inputLabel: { shrink: true } }}
        />
        <TextField
          label="Filter"
          select
          value={filter}
          onChange={(e) => {
            setFilter(e.target.value);
            setValue("");
          }}
          sx={{ minWidth: 160 }}
        >
          {["", "customerId", "manufacturerId", "productId", "employeeId"].map(
            (k) => (
              <MenuItem key={k} value={k}>
                {k ? pretty(k) : "All"}
              </MenuItem>
            ),
          )}
        </TextField>
        {filter && (
          <LookupFilter
            title={filter.replace("Id", "")}
            source={
              filter === "customerId"
                ? "customers"
                : filter === "manufacturerId"
                  ? "manufacturers"
                  : filter === "productId"
                    ? "products"
                    : "employees"
            }
            value={value}
            onChange={setValue}
          />
        )}
        <Button
          onClick={() =>
            setQuery(
              new URLSearchParams({
                ...(from ? { from } : {}),
                ...(to ? { to } : {}),
                ...(filter && value ? { [filter]: value } : {}),
              }).toString(),
            )
          }
        >
          Apply filters
        </Button>
      </Stack>
      {error && <Alert severity="error">{error}</Alert>}
      {!data && !error && <CircularProgress />}
      {data && (
        <>
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: { xs: "1fr", md: "repeat(4,1fr)" },
              gap: 2,
            }}
          >
            {Object.entries(
              view === "profitability" && profit
                ? Object.fromEntries(
                    Object.entries(profit).filter(
                      ([k]) => !["groups", "policy"].includes(k),
                    ),
                  )
                : (data.cards as Record<string, unknown>),
            ).map(([k, v]) => (
              <Paper key={k} variant="outlined" sx={{ p: 2 }}>
                <Typography color="text.secondary">
                  {pretty(k.replace(/([A-Z])/g, " $1"))}
                </Typography>
                <Typography variant="h5">{pretty(v)}</Typography>
              </Paper>
            ))}
          </Box>
          {profit && (
            <>
              <Alert severity="info">{profit.policy}</Alert>
              {table(profit.groups, "contribution by dimension")}
            </>
          )}
          {view !== "profitability" && (
            <>
              <TextField
                select
                label="Rank customers by"
                value={rank}
                onChange={(e) => setRank(e.target.value)}
                sx={{ maxWidth: 320 }}
              >
                {[
                  ["revenue", "Revenue"],
                  ["outstanding", "Outstanding amount"],
                  ["installedDevices", "Installed base"],
                  ["opportunityValue", "Opportunity value"],
                ].map(([key, label]) => (
                  <MenuItem key={key} value={key}>
                    {label}
                  </MenuItem>
                ))}
              </TextField>
              {table(rankedCustomers, "customer performance")}
              {table(
                data.manufacturers as Record<string, unknown>[],
                "manufacturer performance",
              )}
              {table(
                data.productMetrics as Record<string, unknown>[],
                "product performance",
              )}
            </>
          )}
          <Stack direction="row" sx={{ gap: 1, flexWrap: "wrap" }}>
            <TextField
              select
              label="Export format"
              value={format}
              onChange={(e) => setFormat(e.target.value)}
              size="small"
              sx={{ minWidth: 140 }}
            >
              <MenuItem value="xlsx">Excel</MenuItem>
              <MenuItem value="csv">CSV</MenuItem>
            </TextField>
            {[
              "profitability",
              "customerMetrics",
              "manufacturers",
              "productMetrics",
            ].map((section) => (
              <Button
                key={section}
                href={`/api/management/export?view=${view}&section=${section}&format=${format}&${query}`}
              >
                Export {section}
              </Button>
            ))}
          </Stack>
          <Typography variant="caption">
            {String(data.datePolicy)} · Updated{" "}
            {pretty(data.evaluatedAt, "updatedAt")}
          </Typography>
        </>
      )}
    </Stack>
  );
}
