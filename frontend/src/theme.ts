import { PaletteMode, createTheme } from "@mui/material";

export const getAppTheme = (mode: PaletteMode) =>
  createTheme({
    palette: {
      mode,
      primary: {
        main: mode === "dark" ? "#81d4fa" : "#1976d2",
      },
      background: {
        default: mode === "dark" ? "#0f172a" : "#f8fafc",
        paper: mode === "dark" ? "#111827" : "#ffffff",
      },
    },
    shape: { borderRadius: 12 },
    typography: {
      h4: { fontWeight: 700 },
      h6: { fontWeight: 600 },
    },
  });
