"use client";
import { useEffect, useState } from "react";
import {
  Alert,
  Button,
  Chip,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";
import Link from "next/link";
import { Relation } from "./record-form";
type Option = {
  id: string;
  name: string;
  currency: string;
  totalCost: string;
  sellingPrice: string;
  contribution: string;
  marginPercent: string | null;
  leadTimeDays: number | null;
  quote?: {
    productName: string;
    model?: string;
    validityDate?: string;
    paymentTerms?: string;
    series: { manufacturer: { name: string } };
  };
};
export default function Comparison() {
  const [tenderId, setTender] = useState(""),
    [rfqId, setRfq] = useState(""),
    [rows, setRows] = useState<Option[]>([]),
    [error, setError] = useState(""),
    [total, setTotal] = useState(0);
  useEffect(() => {
    const c = new AbortController();
    fetch(
      `/api/commercial/compare?tenderId=${encodeURIComponent(tenderId)}&rfqId=${encodeURIComponent(rfqId)}`,
      { signal: c.signal },
    )
      .then(async (r) => {
        const d = await r.json();
        if (!r.ok) throw new Error(d.error);
        setRows(d.rows);
        setTotal(d.total);
        setError("");
      })
      .catch((e) => {
        if (e.name !== "AbortError") setError(e.message);
      });
    return () => c.abort();
  }, [tenderId, rfqId]);
  return (
    <Stack spacing={3}>
      <Typography variant="h4">Commercial comparison</Typography>
      <Typography>
        Compare saved assumptions within the same currency. Highlights describe
        the data; employees make the final selection.
      </Typography>
      <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
        <Relation
          field={{ key: "tenderId", label: "Filter tender", source: "tenders" }}
          value={tenderId}
          onChange={(v) => setTender(String(v))}
          root={{ __module: "comparisons" }}
        />
        <Relation
          field={{ key: "rfqId", label: "Filter RFQ", source: "rfqs" }}
          value={rfqId}
          onChange={(v) => setRfq(String(v))}
          root={{ __module: "comparisons" }}
        />
      </Stack>
      <Button component={Link} href="/comparisons">
        Add or edit commercial assumptions · Excel/CSV export
      </Button>
      {error && <Alert severity="error">{error}</Alert>}
      {total > rows.length && (
        <Alert severity="info">
          Showing the latest 100 of {total} options. Filter by tender or RFQ for
          a complete comparison.
        </Alert>
      )}
      {!rows.length && !error && (
        <Alert severity="info">No saved comparison options yet.</Alert>
      )}
      {[...new Set(rows.map((r) => r.currency))].map((currency) => {
        const options = rows.filter((r) => r.currency === currency),
          lowest = Math.min(...options.map((r) => Number(r.totalCost))),
          margins = options.filter((r) => r.marginPercent != null),
          highest = margins.length
            ? Math.max(...margins.map((r) => Number(r.marginPercent)))
            : null,
          leads = options.filter((r) => r.leadTimeDays != null),
          shortest = leads.length
            ? Math.min(...leads.map((r) => r.leadTimeDays!))
            : null;
        return (
          <Paper variant="outlined" key={currency} sx={{ p: 2 }}>
            <Typography variant="h6">{currency}</Typography>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    {[
                      "Option / manufacturer",
                      "Product / model",
                      "Total cost",
                      "Selling price",
                      "Contribution",
                      "Margin %",
                      "Lead time / validity",
                      "Payment terms",
                      "Highlights",
                    ].map((h) => (
                      <TableCell key={h}>{h}</TableCell>
                    ))}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {options.map((r) => (
                    <TableRow key={r.id}>
                      <TableCell>
                        {r.name}
                        <br />
                        {r.quote?.series.manufacturer.name}
                      </TableCell>
                      <TableCell>
                        {r.quote?.productName}
                        <br />
                        {r.quote?.model}
                      </TableCell>
                      <TableCell>{r.totalCost}</TableCell>
                      <TableCell>{r.sellingPrice}</TableCell>
                      <TableCell>{r.contribution}</TableCell>
                      <TableCell>{r.marginPercent ?? "—"}</TableCell>
                      <TableCell>
                        {r.leadTimeDays ?? "—"} days
                        <br />
                        {r.quote?.validityDate?.slice(0, 10)}
                      </TableCell>
                      <TableCell>{r.quote?.paymentTerms}</TableCell>
                      <TableCell>
                        {Number(r.totalCost) === lowest && (
                          <Chip size="small" label="Lowest cost" />
                        )}
                        {r.marginPercent != null &&
                          highest != null &&
                          Number(r.marginPercent) === highest && (
                            <Chip size="small" label="Highest margin" />
                          )}
                        {r.leadTimeDays != null &&
                          r.leadTimeDays === shortest && (
                            <Chip size="small" label="Shortest lead time" />
                          )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        );
      })}
    </Stack>
  );
}
