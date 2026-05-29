import { PaletteMode, createTheme } from "@mui/material";

export const getAppTheme = (mode: PaletteMode) =>
  createTheme({
    palette: {
      mode,
      primary: {
        main: mode === "dark" ? "#57c2cc" : "#006d77",
      },
      secondary: {
        main: mode === "dark" ? "#ffb703" : "#ca6702",
      },
      background: {
        default: mode === "dark" ? "#0d1b2a" : "#f2efe8",
        paper: mode === "dark" ? "#1b263b" : "#fffdf8",
      },
    },
    shape: { borderRadius: 14 },
    typography: {
      fontFamily: "Poppins, Manrope, Helvetica, Arial, sans-serif",
      h4: { fontWeight: 700, letterSpacing: "-0.02em" },
      h6: { fontWeight: 600, letterSpacing: "-0.01em" },
    },
    components: {
      MuiCssBaseline: {
        styleOverrides: {
          body: {
            backgroundImage:
              mode === "dark"
                ? "radial-gradient(circle at 15% 10%, rgba(87,194,204,0.12), transparent 35%), radial-gradient(circle at 80% 20%, rgba(255,183,3,0.08), transparent 40%)"
                : "radial-gradient(circle at 10% 5%, rgba(0,109,119,0.08), transparent 30%), radial-gradient(circle at 85% 10%, rgba(202,103,2,0.1), transparent 35%)",
            backgroundAttachment: "fixed",
          },
        },
      },
    },
  });
