"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import {
  AppBar,
  Avatar,
  Box,
  Button,
  Chip,
  Divider,
  Drawer,
  List,
  ListItemButton,
  ListItemText,
  Toolbar,
  Typography,
  IconButton,
} from "@mui/material";
import MenuIcon from "@mui/icons-material/Menu";
type SafeUser = {
  name: string;
  role: string;
  permissions: { module: string; read: boolean; write: boolean }[];
};
const navigation = [
  ["dashboard", "Dashboard"],
  ["tasks", "Tasks & follow-ups"],
  ["reports", "Reports"],
  ["ai", "AI writing assistant"],
  ["tenders", "Tenders"],
  ["rfqs", "RFQs & quotations"],
  ["comparison", "Commercial comparison"],
  ["generator", "Document generator"],
  ["securities", "Securities / EMD / PBG"],
  ["approvals", "Approvals"],
  ["communication", "Email & WhatsApp"],
  ["orders", "Purchase orders"],
  ["deliveries", "Deliveries & installations"],
  ["warranties", "Warranty management"],
  ["amcs", "AMC management"],
  ["invoices", "Payments & receivables"],
  ["documents", "Company documents"],
  ["customers", "Customers & manufacturers"],
  ["notifications", "Notifications"],
  ["settings", "Settings"],
];
export default function Shell({
  user,
  children,
}: {
  user: SafeUser;
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname(),
    [mobile, setMobile] = useState(false);
  const allowed = (m: string) =>
    user.role === "ADMIN" ||
    user.permissions.some(
      (p) =>
        p.module ===
          (m === "generator"
            ? "generated"
            : m === "comparison"
              ? "comparisons"
              : m) && p.read,
    );
  const drawer = (
    <Box sx={{ height: "100%", bgcolor: "#142d39", color: "#dbe7ea" }}>
      <Box sx={{ p: 3 }}>
        <Typography variant="h4" color="white">
          MedOps<span style={{ color: "#6fe0c9" }}>.</span>
        </Typography>
        <Typography variant="caption" sx={{ color: "#8ba6b3" }}>
          MEDICAL EQUIPMENT OPERATIONS
        </Typography>
      </Box>
      <Divider sx={{ borderColor: "#2a4653" }} />
      <List sx={{ px: 1.5 }}>
        {navigation
          .filter(([m]) => allowed(m))
          .map(([m, title]) => (
            <ListItemButton
              key={m}
              component={Link}
              href={"/" + m}
              selected={pathname.startsWith("/" + m)}
              onClick={() => setMobile(false)}
              sx={{
                borderRadius: 1,
                mb: 0.5,
                "&.Mui-selected": { bgcolor: "#22534f", color: "#9bf1da" },
                "&.Mui-selected:hover": { bgcolor: "#22534f" },
              }}
            >
              <ListItemText
                primary={title}
                slotProps={{ primary: { sx: { fontSize: 14 } } }}
              />
            </ListItemButton>
          ))}
      </List>
      <Box sx={{ p: 3 }}>
        <Chip
          label="Private records · optional AI"
          size="small"
          sx={{ bgcolor: "#203e47", color: "#a9cac5" }}
        />
      </Box>
    </Box>
  );
  return (
    <Box sx={{ display: "flex", minHeight: "100vh" }}>
      <Box component="nav" sx={{ width: { md: 252 }, flexShrink: { md: 0 } }}>
        <Drawer
          open={mobile}
          onClose={() => setMobile(false)}
          sx={{
            display: { xs: "block", md: "none" },
            "& .MuiDrawer-paper": { width: 252 },
          }}
        >
          {drawer}
        </Drawer>
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: "none", md: "block" },
            "& .MuiDrawer-paper": { width: 252, border: 0 },
          }}
          open
        >
          {drawer}
        </Drawer>
      </Box>
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <AppBar
          position="sticky"
          elevation={0}
          color="inherit"
          sx={{ borderBottom: "1px solid #dfe5e9" }}
        >
          <Toolbar sx={{ gap: 2 }}>
            <IconButton
              sx={{ display: { md: "none" } }}
              onClick={() => setMobile(true)}
              aria-label="Open navigation"
            >
              <MenuIcon />
            </IconButton>
            <Typography variant="body2" color="text.secondary" sx={{ flex: 1 }}>
              Company operations / {pathname.split("/")[1]}
            </Typography>
            <Avatar
              sx={{
                width: 30,
                height: 30,
                bgcolor: "primary.main",
                fontSize: 14,
              }}
            >
              {user.name[0]}
            </Avatar>
            <Button component={Link} href="/account" size="small">
              {user.name}
            </Button>
            <Button
              size="small"
              onClick={async () => {
                await fetch("/api/auth/logout", { method: "POST" });
                router.push("/login");
                router.refresh();
              }}
            >
              Sign out
            </Button>
          </Toolbar>
        </AppBar>
        <Box
          component="main"
          sx={{ p: { xs: 2, md: 4 }, maxWidth: 1600, mx: "auto" }}
        >
          {children}
        </Box>
      </Box>
    </Box>
  );
}
