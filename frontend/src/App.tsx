import DarkModeOutlinedIcon from "@mui/icons-material/DarkModeOutlined";
import LightModeOutlinedIcon from "@mui/icons-material/LightModeOutlined";
import {
  Alert,
  AppBar,
  Box,
  Button,
  CircularProgress,
  Container,
  CssBaseline,
  Divider,
  Grid,
  IconButton,
  Stack,
  ThemeProvider,
  Toolbar,
  Typography,
} from "@mui/material";
import { useEffect, useMemo, useState } from "react";
import { ConversionOptions } from "./components/ConversionOptions";
import { FormatPicker } from "./components/FormatPicker";
import { JobProgress } from "./components/JobProgress";
import { ResultPreview } from "./components/ResultPreview";
import { ToolCard } from "./components/ToolCard";
import { Uploader } from "./components/Uploader";
import { categoryOrder, operations } from "./data/operations";
import { getAppTheme } from "./theme";
import { ConversionJob, ConversionOperation, ToolCategory } from "./types";

type View = "landing" | "results";

export default function App() {
  const [mode, setMode] = useState<"light" | "dark">("light");
  const [activeView, setActiveView] = useState<View>("landing");
  const [selectedOperation, setSelectedOperation] = useState<ConversionOperation | undefined>();
  const [selectedOutput, setSelectedOutput] = useState<string>("");
  const [optionValues, setOptionValues] = useState<Record<string, boolean | string | number>>({});
  const [jobs, setJobs] = useState<ConversionJob[]>([]);
  const [isQueueLoading, setIsQueueLoading] = useState(false);

  const theme = useMemo(() => getAppTheme(mode), [mode]);

  const operationsByCategory = useMemo(() => {
    return categoryOrder.reduce<Record<ToolCategory, ConversionOperation[]>>((acc, category) => {
      acc[category] = operations.filter((operation) => operation.category === category);
      return acc;
    }, {} as Record<ToolCategory, ConversionOperation[]>);
  }, []);

  useEffect(() => {
    if (!selectedOperation) return;
    setSelectedOutput(selectedOperation.outputs[0]);

    const defaults: Record<string, boolean | string | number> = {};
    selectedOperation.options.forEach((option) => {
      defaults[option.key] = option.defaultValue;
    });
    setOptionValues(defaults);
  }, [selectedOperation]);

  useEffect(() => {
    const poll = setInterval(() => {
      setJobs((currentJobs) =>
        currentJobs.map((job) => {
          if (job.status === "completed" || job.status === "failed") return job;

          const nextProgress = Math.min(job.progress + Math.floor(Math.random() * 20) + 5, 100);
          if (nextProgress === 100) {
            const isFail = Math.random() < 0.08;
            return {
              ...job,
              progress: 100,
              status: isFail ? "failed" : "completed",
              error: isFail ? "Conversion failed: source appears corrupted." : undefined,
              resultUrl: isFail ? undefined : `https://example.com/downloads/${job.id}.${job.outputFormat}`,
              previewUrl: isFail ? undefined : `https://example.com/previews/${job.id}`,
            };
          }

          return { ...job, progress: nextProgress, status: "processing" };
        }),
      );
      setIsQueueLoading(false);
    }, 1800);

    return () => clearInterval(poll);
  }, []);

  const enqueueJob = (file: File, remoteFileId: string) => {
    if (!selectedOperation) return;
    setIsQueueLoading(true);
    const newJob: ConversionJob = {
      id: crypto.randomUUID(),
      remoteFileId,
      operationId: selectedOperation.id,
      sourceFileName: file.name,
      outputFormat: selectedOutput || selectedOperation.outputs[0],
      progress: 0,
      status: "queued",
      startedAt: Date.now(),
    };
    setJobs((existing) => [newJob, ...existing]);
  };

  const completedResults = jobs.filter((job) => job.status === "completed");

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AppBar position="sticky" color="default" elevation={1}>
        <Toolbar>
          <Typography variant="h6" sx={{ flexGrow: 1 }}>
            FileConvert
          </Typography>
          <Button onClick={() => setActiveView("landing")} aria-label="Go to converter">
            Converter
          </Button>
          <Button onClick={() => setActiveView("results")} aria-label="Go to results page">
            Results ({completedResults.length})
          </Button>
          <IconButton
            sx={{ ml: 1 }}
            aria-label={`Switch to ${mode === "light" ? "dark" : "light"} mode`}
            onClick={() => setMode(mode === "light" ? "dark" : "light")}
          >
            {mode === "light" ? <DarkModeOutlinedIcon /> : <LightModeOutlinedIcon />}
          </IconButton>
        </Toolbar>
      </AppBar>

      <Container sx={{ py: 4 }}>
        {activeView === "landing" ? (
          <Stack spacing={3}>
            <Box>
              <Typography variant="h4" gutterBottom>
                Convert files in seconds
              </Typography>
              <Typography variant="body1" color="text.secondary">
                Pick a category, upload your file, customize conversion options, and monitor queue updates in real time.
              </Typography>
            </Box>

            {categoryOrder.map((category) => (
              <Box key={category}>
                <Typography variant="h6" mb={1}>
                  {category} tools
                </Typography>
                <Grid container spacing={2}>
                  {operationsByCategory[category].map((operation) => (
                    <Grid key={operation.id} size={{ xs: 12, sm: 6, lg: 4 }}>
                      <ToolCard
                        operation={operation}
                        selected={operation.id === selectedOperation?.id}
                        onSelect={setSelectedOperation}
                      />
                    </Grid>
                  ))}
                </Grid>
              </Box>
            ))}

            <Divider />
            <Grid container spacing={2}>
              <Grid size={{ xs: 12, md: 7 }}>
                <Uploader operation={selectedOperation} onFileAccepted={enqueueJob} />
              </Grid>
              <Grid size={{ xs: 12, md: 5 }}>
                <Stack spacing={2}>
                  <FormatPicker
                    options={selectedOperation?.outputs ?? []}
                    value={selectedOutput}
                    onChange={setSelectedOutput}
                  />
                  <ConversionOptions
                    operation={selectedOperation}
                    values={optionValues}
                    onOptionChange={(key, value) =>
                      setOptionValues((current) => ({
                        ...current,
                        [key]: value,
                      }))
                    }
                  />
                </Stack>
              </Grid>
            </Grid>

            <Divider />
            <Box>
              <Typography variant="h6" mb={2}>
                Conversion queue
              </Typography>
              {isQueueLoading ? (
                <Stack direction="row" spacing={1} alignItems="center">
                  <CircularProgress size={18} />
                  <Typography variant="body2">Submitting conversion job…</Typography>
                </Stack>
              ) : null}

              {jobs.length === 0 ? (
                <Alert severity="info">No jobs yet. Upload a file to start your first conversion.</Alert>
              ) : (
                <Stack spacing={1.5} mt={1}>
                  {jobs.map((job) => (
                    <JobProgress key={job.id} job={job} />
                  ))}
                </Stack>
              )}
            </Box>
          </Stack>
        ) : (
          <Box>
            <Typography variant="h4" gutterBottom>
              Results
            </Typography>
            <Typography variant="body2" color="text.secondary" mb={3}>
              Access previews and downloads for successful conversions.
            </Typography>

            {jobs.length === 0 ? (
              <Alert severity="info">No results available yet. Start a conversion from the Converter page.</Alert>
            ) : completedResults.length === 0 ? (
              <Alert severity="warning">Your jobs are still running or failed. Completed files will appear here.</Alert>
            ) : (
              <Grid container spacing={2}>
                {completedResults.map((result) => (
                  <Grid key={result.id} size={{ xs: 12, md: 6 }}>
                    <ResultPreview result={result} />
                  </Grid>
                ))}
              </Grid>
            )}
          </Box>
        )}
      </Container>
    </ThemeProvider>
  );
}
