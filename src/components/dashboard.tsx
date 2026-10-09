"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableRow,
  Typography,
} from "@mui/material";
import { pretty } from "@/lib/ui-config";
type DashboardData = {
  cards: { label: string; value: string | number; module: string }[];
  finances: {
    outstanding: string;
    invoiced: string;
    received: string;
    overdue: string;
    byCustomer: { id: string; name: string; amount: string }[];
    recentPayments: Record<string, unknown>[];
    expectedThisMonth: Record<string, unknown>[];
    followups: Record<string, unknown>[];
  };
  deadlines: Record<string, unknown>[];
  activity: Record<string, unknown>[];
};
export default function Dashboard() {
  const [data, setData] = useState<DashboardData | null>(null),
    [error, setError] = useState("");
  useEffect(() => {
    fetch("/api/dashboard")
      .then(async (r) => {
        const d = await r.json();
        if (!r.ok) throw new Error(d.error);
        setData(d);
      })
      .catch((e) => setError(e.message));
  }, []);
  if (error) return <Alert severity="error">{error}</Alert>;
  if (!data) return <CircularProgress />;
  return (
    <Stack spacing={3}>
      <Box>
        <Typography variant="overline" color="primary">
          YOUR OPERATIONS, CONNECTED
        </Typography>
        <Typography variant="h4">Operations overview</Typography>
        <Typography color="text.secondary" sx={{ mt: 1 }}>
          A clear view of tenders, fulfilment, service and receivables.
        </Typography>
      </Box>
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: {
            xs: "1fr",
            sm: "repeat(2,1fr)",
            lg: "repeat(4,1fr)",
          },
          gap: 2,
        }}
      >
        {data.cards.map((c) => (
          <Paper key={c.label} variant="outlined" sx={{ p: 2.5 }}>
            <Typography color="text.secondary" variant="body2">
              {c.label}
            </Typography>
            <Typography variant="h4" sx={{ my: 1, color: "primary.dark" }}>
              {typeof c.value === "string" && c.value.startsWith("₹")
                ? pretty(c.value.slice(2), "amount")
                : c.value}
            </Typography>
            <Button component={Link} href={"/" + c.module} size="small">
              View records →
            </Button>
          </Paper>
        ))}
      </Box>
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "1fr", md: "1.3fr 1fr" },
          gap: 3,
        }}
      >
        <Paper variant="outlined" sx={{ p: 3 }}>
          <Typography variant="h6">
            Upcoming deadlines & pending actions
          </Typography>
          {data.deadlines.length ? (
            data.deadlines.map((d) => (
              <Stack
                key={String(d.id)}
                direction="row"
                spacing={2}
                sx={{
                  alignItems: "center",
                  py: 2,
                  borderBottom: "1px solid #eef1f3",
                }}
              >
                <Box sx={{ flex: 1 }}>
                  <Typography>{String(d.title)}</Typography>
                  <Button component={Link} href={"/" + d.module} size="small">
                    Open record list
                  </Button>
                </Box>
                <Chip
                  label={String(d.priority)}
                  size="small"
                  color={d.priority === "HIGH" ? "warning" : "default"}
                />
              </Stack>
            ))
          ) : (
            <Typography color="text.secondary" sx={{ py: 4 }}>
              No upcoming tasks. Reminders appear after scheduled checks.
            </Typography>
          )}
        </Paper>
        <Paper variant="outlined" sx={{ p: 3 }}>
          <Typography variant="h6">Financial overview</Typography>
          <Table>
            <TableBody>
              {[
                ["Total invoiced", data.finances.invoiced],
                ["Received", data.finances.received],
                ["Outstanding", data.finances.outstanding],
                ["Overdue", data.finances.overdue],
              ].map(([title, value]) => (
                <TableRow key={title}>
                  <TableCell>{title}</TableCell>
                  <TableCell align="right">{pretty(value, "amount")}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <Typography variant="subtitle2" sx={{ mt: 3 }}>
            Outstanding by customer
          </Typography>
          {data.finances.byCustomer.length ? (
            data.finances.byCustomer.map((c) => (
              <Typography key={c.id} sx={{ mt: 1 }}>
                {c.name}: {pretty(c.amount, "amount")}
              </Typography>
            ))
          ) : (
            <Typography color="text.secondary" sx={{ mt: 2 }}>
              No customer invoices yet.
            </Typography>
          )}
        </Paper>
      </Box>
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" },
          gap: 3,
        }}
      >
        <Paper variant="outlined" sx={{ p: 3 }}>
          <Typography variant="h6">Payments expected this month</Typography>
          {data.finances.expectedThisMonth?.length ? (
            data.finances.expectedThisMonth.map((i, n) => (
              <Typography key={n} sx={{ my: 1 }}>
                {String(i.number)} · {pretty(i.outstanding, "amount")} ·{" "}
                {pretty(i.dueDate, "dueDate")}
              </Typography>
            ))
          ) : (
            <Typography sx={{ mt: 2 }} color="text.secondary">
              No outstanding invoices due this month.
            </Typography>
          )}
          <Typography variant="h6" sx={{ mt: 3 }}>
            Recently received payments
          </Typography>
          {data.finances.recentPayments?.map((p, n) => (
            <Typography key={n} sx={{ my: 1 }}>
              {String(p.reference)} · {pretty(p.amount, "amount")} ·{" "}
              {pretty(p.paymentDate, "paymentDate")}
            </Typography>
          ))}
        </Paper>
        <Paper variant="outlined" sx={{ p: 3 }}>
          <Typography variant="h6">Recent activity</Typography>
          {data.activity.length ? (
            data.activity.map((a) => (
              <Typography key={String(a.id)} variant="body2" sx={{ my: 2 }}>
                {pretty(a.action)} · {String(a.module)} ·{" "}
                {pretty(a.createdAt, "createdAt")}
              </Typography>
            ))
          ) : (
            <Typography color="text.secondary" sx={{ mt: 2 }}>
              New activity will appear as records are created and updated.
            </Typography>
          )}
        </Paper>
      </Box>
    </Stack>
  );
}
