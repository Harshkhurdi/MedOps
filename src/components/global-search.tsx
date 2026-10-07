"use client";
import { useEffect, useState } from "react";
import {
  Alert,
  Button,
  Dialog,
  DialogContent,
  DialogTitle,
  List,
  ListItemButton,
  ListItemText,
  TextField,
  Typography,
} from "@mui/material";
import Link from "next/link";
type Group = {
  entity: string;
  results: { id: string; label: string; href: string }[];
};
export default function GlobalSearch() {
  const [open, setOpen] = useState(false),
    [q, setQ] = useState(""),
    [groups, setGroups] = useState<Group[]>([]),
    [error, setError] = useState("");
  useEffect(() => {
    const listener = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((v) => !v);
      }
    };
    document.addEventListener("keydown", listener);
    return () => document.removeEventListener("keydown", listener);
  }, []);
  useEffect(() => {
    if (!open || q.trim().length < 2) return;
    const c = new AbortController();
    const timer = setTimeout(
      () =>
        fetch(`/api/search?q=${encodeURIComponent(q)}`, { signal: c.signal })
          .then(async (r) => {
            const d = await r.json();
            if (!r.ok) throw new Error(d.error);
            setGroups(d.groups);
            setError("");
          })
          .catch((e) => {
            if (e.name !== "AbortError") setError(e.message);
          }),
      250,
    );
    return () => {
      clearTimeout(timer);
      c.abort();
    };
  }, [open, q]);
  return (
    <>
      <Button onClick={() => setOpen(true)} size="small">
        Search · ⌘/Ctrl K
      </Button>
      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle>Search MedOps</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            fullWidth
            label="Search records, contacts or serial numbers"
            value={q}
            onChange={(e) => {
              setQ(e.target.value);
              setGroups([]);
            }}
            sx={{ mt: 1 }}
          />
          {error && <Alert severity="error">{error}</Alert>}
          {q.length < 2 ? (
            <Typography sx={{ mt: 2 }}>
              Enter at least two characters.
            </Typography>
          ) : groups.length ? (
            groups.map((g) => (
              <List key={g.entity}>
                <Typography sx={{ fontWeight: 700 }}>
                  {g.entity.replaceAll("-", " ")}
                </Typography>
                {g.results.map((r) => (
                  <ListItemButton
                    key={r.id}
                    component={Link}
                    href={r.href}
                    onClick={() => setOpen(false)}
                  >
                    <ListItemText primary={r.label} />
                  </ListItemButton>
                ))}
              </List>
            ))
          ) : (
            <Typography sx={{ mt: 2 }}>No matching records.</Typography>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
