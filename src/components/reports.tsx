"use client";
import { useEffect, useState } from "react";
import {
  Alert,
  Box,
  Button,
  CircularProgress,
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
import { pretty } from "@/lib/ui-config";
type Report = {
  invoiced: string;
  received: string;
  outstanding: string;
  overdue: string;
  evaluatedAt: string;
  aging: { label: string; amount: string; count: number }[];
  customers: { id: string; name: string; amount: string; overdue: string }[];
  invoices: {
    id: string;
    number: string;
    customer: string;
    dueDate: string;
    daysOverdue: number;
    outstanding: string;
  }[];
};
export default function Reports() {
  const [data, setData] = useState<Report | null>(null),
    [error, setError] = useState("");
  useEffect(() => {
    fetch("/api/reports")
      .then(async (r) => {
        const result = await r.json();
        if (!r.ok) throw new Error(result.error);
        setData(result);
      })
      .catch((e) => setError(e.message));
  }, []);
  return (
    <Stack spacing={3}>
      <Box>
        <Typography variant="h4">Receivables & aging</Typography>
        <Typography color="text.secondary" sx={{ mt: 1 }}>
          Outstanding customer balances and overdue invoices, calculated from
          recorded receipts.
        </Typography>
      </Box>
      {error && <Alert severity="error">{error}</Alert>}
      {!data && !error && <CircularProgress />}
      {data && (
        <>
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: { xs: "1fr", md: "repeat(4, 1fr)" },
              gap: 2,
            }}
          >
            {[
              ["Total invoiced", data.invoiced],
              ["Received", data.received],
              ["Outstanding", data.outstanding],
              ["Overdue", data.overdue],
            ].map(([title, value]) => (
              <Paper key={title} variant="outlined" sx={{ p: 3 }}>
                <Typography color="text.secondary">{title}</Typography>
                <Typography variant="h5" sx={{ mt: 1 }}>
                  {pretty(value, "amount")}
                </Typography>
              </Paper>
            ))}
          </Box>
          <Paper variant="outlined" sx={{ p: 3 }}>
            <Typography variant="h6">Invoice aging</Typography>
            <Stack
              direction={{ xs: "column", md: "row" }}
              spacing={3}
              sx={{ mt: 2 }}
            >
              {data.aging.map((bucket) => (
                <Box key={bucket.label} sx={{ flex: 1 }}>
                  <Typography>{bucket.label}</Typography>
                  <Typography variant="h6">
                    {pretty(bucket.amount, "amount")}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {bucket.count} invoices
                  </Typography>
                </Box>
              ))}
            </Stack>
          </Paper>
          <Paper variant="outlined" sx={{ p: 3 }}>
            <Typography variant="h6">Customer balances</Typography>
            {data.customers.length ? (
              data.customers.map((c) => (
                <Stack
                  key={c.id}
                  direction="row"
                  sx={{ justifyContent: "space-between", mt: 2 }}
                >
                  <Typography>{c.name}</Typography>
                  <Typography>
                    {pretty(c.amount, "amount")} · Overdue{" "}
                    {pretty(c.overdue, "amount")}
                  </Typography>
                </Stack>
              ))
            ) : (
              <Typography sx={{ mt: 2 }}>
                No outstanding customer balances.
              </Typography>
            )}
          </Paper>
          <Paper variant="outlined">
            <Stack
              direction="row"
              sx={{ p: 2, justifyContent: "space-between", flexWrap: "wrap" }}
            >
              <Typography variant="h6">Invoices to follow up</Typography>
              <Button href="/api/export/invoices?format=xlsx">
                Download invoice register
              </Button>
            </Stack>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    {[
                      "Invoice",
                      "Customer",
                      "Due date",
                      "Days overdue",
                      "Outstanding",
                    ].map((label) => (
                      <TableCell key={label}>{label}</TableCell>
                    ))}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {data.invoices.map((invoice) => (
                    <TableRow key={invoice.id}>
                      <TableCell>{invoice.number}</TableCell>
                      <TableCell>{invoice.customer}</TableCell>
                      <TableCell>
                        {pretty(invoice.dueDate, "dueDate")}
                      </TableCell>
                      <TableCell>{invoice.daysOverdue}</TableCell>
                      <TableCell>
                        {pretty(invoice.outstanding, "amount")}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
            {!data.invoices.length && (
              <Typography sx={{ p: 3 }}>No unpaid invoices.</Typography>
            )}
          </Paper>
          <Typography variant="caption" color="text.secondary">
            Updated {pretty(data.evaluatedAt, "updatedAt")} · No AI processing
            is used for financial calculations.
          </Typography>
        </>
      )}
    </Stack>
  );
}
