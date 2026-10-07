"use client";
import { ThemeProvider, createTheme, CssBaseline } from "@mui/material";
const theme = createTheme({
  palette: {
    primary: { main: "#0b746d" },
    secondary: { main: "#c28124" },
    background: { default: "#f3f6f8" },
  },
  typography: {
    fontFamily: "Arial, Helvetica, sans-serif",
    h4: { fontWeight: 700 },
    h5: { fontWeight: 700 },
    button: { textTransform: "none", fontWeight: 600 },
  },
  shape: { borderRadius: 10 },
  components: {
    MuiButton: { defaultProps: { disableElevation: true } },
    MuiPaper: { styleOverrides: { root: { backgroundImage: "none" } } },
  },
});
export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      {children}
    </ThemeProvider>
  );
}
