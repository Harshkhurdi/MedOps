"use client";
import LookupFilter from "./lookup-filter";
import { useEffect, useState } from "react";
import {
  Alert,
  Button,
  MenuItem,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
export default function Accounting() {
  const [name, setName] = useState("invoices"),
    [message, setMessage] = useState(""),
    [error, setError] = useState(""),
    [from, setFrom] = useState(""),
    [to, setTo] = useState(""),
    [customer, setCustomer] = useState("");
  useEffect(() => {
    fetch("/api/accounting")
      .then(async (r) => {
        const d = await r.json();
        if (!r.ok) throw new Error(d.error);
        setMessage(d.message);
      })
      .catch((e) => setError(e.message));
  }, []);
  const params = new URLSearchParams({
    module: name,
    ...(from ? { from } : {}),
    ...(to ? { to } : {}),
    ...(customer ? { customerId: customer } : {}),
  });
  return (
    <Stack spacing={2}>
      <Typography variant="h4">Accounting exports</Typography>
      {error && <Alert severity="error">{error}</Alert>}
      <Alert severity="info">
        {message || "Manual CSV / Excel interchange"}
      </Alert>
      <Typography>
        MedOps remains an operations system. Tally and Zoho Books
        synchronization require a separately configured, documented connector.
      </Typography>
      <TextField
        select
        label="Register"
        value={name}
        onChange={(e) => setName(e.target.value)}
      >
        {["customers", "orders", "invoices", "payments", "adjustments"].map(
          (n) => (
            <MenuItem key={n} value={n}>
              {n}
            </MenuItem>
          ),
        )}
      </TextField>
      <Stack direction="row" sx={{ gap: 2, flexWrap: "wrap" }}>
        <TextField
          label="From"
          type="date"
          slotProps={{ inputLabel: { shrink: true } }}
          value={from}
          onChange={(e) => setFrom(e.target.value)}
        />
        <TextField
          label="To"
          type="date"
          slotProps={{ inputLabel: { shrink: true } }}
          value={to}
          onChange={(e) => setTo(e.target.value)}
        />
        {name !== "customers" && (
          <LookupFilter
            title="Customer (optional)"
            source="customers"
            value={customer}
            onChange={setCustomer}
          />
        )}
      </Stack>
      <Stack direction="row" spacing={2}>
        <Button href={`/api/accounting?${params}&format=csv`}>
          Export CSV
        </Button>
        <Button href={`/api/accounting?${params}&format=xlsx`}>
          Export Excel
        </Button>
      </Stack>
    </Stack>
  );
}
