"use client";
import { useEffect, useState } from "react";
import {
  Alert,
  Button,
  Dialog,
  DialogContent,
  DialogActions,
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
    [error, setError] = useState(""),
    [loading, setLoading] = useState(false);
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
            if (c.signal.aborted) return;
            if (!r.ok) throw new Error(d.error);
            setGroups(d.groups);
            setError("");
            setLoading(false);
          })
          .catch((e) => {
            if (!c.signal.aborted) {
              setError(e.message);
              setLoading(false);
            }
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
        aria-labelledby="global-search-title"
        onClose={() => setOpen(false)}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle id="global-search-title">Search MedOps</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            fullWidth
            label="Search records, contacts or serial numbers"
            value={q}
            onChange={(e) => {
              setQ(e.target.value);
              setGroups([]);
              setError("");
              setLoading(e.target.value.trim().length >= 2);
            }}
            sx={{ mt: 1 }}
          />
          {error && <Alert severity="error">{error}</Alert>}
          {q.trim().length < 2 ? (
            <Typography sx={{ mt: 2 }}>
              Enter at least two characters.
            </Typography>
          ) : loading ? (
            <Typography role="status" sx={{ mt: 2 }}>
              Searching records…
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
          ) : !error ? (
            <Typography sx={{ mt: 2 }}>No matching records.</Typography>
          ) : null}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>Close search</Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
