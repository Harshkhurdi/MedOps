"use client";
import Link from "next/link";
import { Button, Paper, Stack, Typography } from "@mui/material";
export default function ReportRegisters({
  links,
}: {
  links: { href: string; label: string }[];
}) {
  return (
    <Paper variant="outlined" sx={{ p: 3, mb: 3 }}>
      <Typography variant="h6">Operations reports & registers</Typography>
      <Typography color="text.secondary" sx={{ mb: 2 }}>
        Open a register to filter by date, status and saved customer,
        manufacturer, product or employee. Export the filtered records as CSV or
        Excel.
      </Typography>
      <Stack direction="row" sx={{ gap: 1, flexWrap: "wrap" }}>
        {links.map((l) => (
          <Button
            key={l.href}
            component={Link}
            href={l.href}
            variant="outlined"
            size="small"
          >
            {l.label}
          </Button>
        ))}
      </Stack>
    </Paper>
  );
}
