"use client";
import GlobalSearch from "./global-search";
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
  Collapse,
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
  {
    title: "Dashboard",
    items: [
      ["dashboard", "Operations dashboard"],
      ["brief", "Today’s brief"],
      ["executive", "Executive dashboard"],
      ["tasks", "Tasks & follow-ups"],
      ["notifications", "Notifications"],
    ],
  },
  {
    title: "Tenders & commercial",
    items: [
      ["tenders", "Tenders & decisions"],
      ["rfqs", "RFQs & quotations"],
      ["comparison", "Commercial comparison"],
      ["securities", "Securities / EMD / PBG"],
      ["approvals", "Approvals"],
      ["communication", "Email & WhatsApp"],
      ["generator", "Document generator"],
    ],
  },
  {
    title: "Operations",
    items: [
      ["orders", "Purchase orders"],
      ["deliveries", "Deliveries & installations"],
      ["equipment", "Installed base"],
    ],
  },
  {
    title: "Service",
    items: [
      ["tickets", "Service tickets & SLA"],
      ["engineer", "Engineer home"],
      ["warranties", "Warranty management"],
      ["parts", "Spare parts & stock"],
      ["amcs", "AMC & opportunities"],
      ["consumables", "Consumables & opportunities"],
    ],
  },
  {
    title: "Finance",
    items: [
      ["invoices", "Invoices & receivables"],
      ["adjustments", "Financial corrections"],
      ["costs", "Operational costs"],
      ["profitability", "Operational profitability"],
      ["accounting", "Accounting exports"],
    ],
  },
  {
    title: "Sales / CRM",
    items: [
      ["customers", "Customers & manufacturers"],
      ["customer-contacts", "Customer contacts"],
      ["interactions", "Customer interactions"],
      ["pipeline", "Sales pipeline"],
      ["competitors", "Competitors"],
    ],
  },
  {
    title: "Management",
    items: [
      ["analytics", "Performance analytics"],
      ["reports", "Reports & registers"],
    ],
  },
  {
    title: "Administration",
    items: [
      ["documents", "Company documents"],
      ["imports", "Historical imports"],
      ["ocr", "Private OCR"],
      ["ai", "AI writing assistant"],
      ["settings", "Settings"],
    ],
  },
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
    [mobile, setMobile] = useState(false),
    [collapsed, setCollapsed] = useState<Record<string, boolean>>({});
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
    <Box sx={{ minHeight: "100%", flexShrink: 0, bgcolor: "#142d39", color: "#dbe7ea" }}>
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
          .filter((g) => g.items.some(([m]) => allowed(m)))
          .map((g) => (
            <Box key={g.title}>
              <ListItemButton
                onClick={() =>
                  setCollapsed((c) => ({ ...c, [g.title]: !c[g.title] }))
                }
                aria-expanded={!collapsed[g.title]}
                sx={{ color: "#8ba6b3", py: 1 }}
              >
                <ListItemText
                  primary={g.title}
                  slotProps={{
                    primary: { sx: { fontSize: 12, fontWeight: 700 } },
                  }}
                />
                <Typography variant="caption">
                  {collapsed[g.title] ? "+" : "−"}
                </Typography>
              </ListItemButton>
              <Collapse in={!collapsed[g.title]}>
                {g.items
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
                        pl: 3,
                        "&.Mui-selected": {
                          bgcolor: "#22534f",
                          color: "#9bf1da",
                        },
                        "&.Mui-selected:hover": { bgcolor: "#22534f" },
                      }}
                    >
                      <ListItemText
                        primary={title}
                        slotProps={{ primary: { sx: { fontSize: 14 } } }}
                      />
                    </ListItemButton>
                  ))}
              </Collapse>
            </Box>
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
            "& .MuiDrawer-paper": { width: 252, bgcolor: "#142d39" },
          }}
        >
          {drawer}
        </Drawer>
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: "none", md: "block" },
            "& .MuiDrawer-paper": { width: 252, border: 0, bgcolor: "#142d39" },
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
          <Toolbar sx={{ gap: { xs: 1, md: 2 }, flexWrap: "wrap", py: { xs: 1, md: 0 } }}>
            <IconButton
              sx={{ display: { md: "none" } }}
              onClick={() => setMobile(true)}
              aria-label="Open navigation"
            >
              <MenuIcon />
            </IconButton>
            <Typography variant="body2" color="text.secondary" sx={{ flex: { xs: "1 1 calc(100% - 56px)", md: 1 }, minWidth: 0, overflowWrap: "anywhere" }}>
              Company operations / {pathname.split("/")[1]}
            </Typography>
            {allowed("search") && <GlobalSearch />}
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
            <Button component={Link} href="/account" size="small" sx={{ maxWidth: "100%", overflowWrap: "anywhere" }}>
              {user.name}
            </Button>
            <Button
              size="small"
              onClick={async () => {
                await fetch("/api/auth/logout", { method: "POST" });
                for (const key of Object.keys(sessionStorage))
                  if (key.startsWith("medops-draft:"))
                    sessionStorage.removeItem(key);
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
