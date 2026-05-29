import DarkModeOutlinedIcon from "@mui/icons-material/DarkModeOutlined";
import LightModeOutlinedIcon from "@mui/icons-material/LightModeOutlined";
import {
  Alert,
  AppBar,
  Box,
  Button,
  Chip,
  CircularProgress,
  Container,
  CssBaseline,
  Divider,
  Grid,
  IconButton,
  List,
  ListItem,
  ListItemText,
  Stack,
  ThemeProvider,
  Toolbar,
  Typography,
} from "@mui/material";
import { useEffect, useMemo, useState } from "react";
import { createConversion, getCapabilities, getJobStatus, type CapabilitiesResponse } from "./api/conversions";
import { ConversionOptions } from "./components/ConversionOptions";
import { FormatPicker } from "./components/FormatPicker";
import { JobProgress } from "./components/JobProgress";
import { ResultPreview } from "./components/ResultPreview";
import { ToolCard } from "./components/ToolCard";
import { Uploader } from "./components/Uploader";
import { categoryOrder, operations } from "./data/operations";
import { getAppTheme } from "./theme";
import { ConversionJob, ConversionOperation, ToolCategory } from "./types";
import { extensionToMime, mimeFromFile } from "./utils/mime";

type View = "converter" | "queue" | "results" | "capabilities";

export default function App() {
  const [mode, setMode] = useState<"light" | "dark">("light");
  const [activeView, setActiveView] = useState<View>("converter");
  const [selectedOperation, setSelectedOperation] = useState<ConversionOperation | undefined>();
  const [selectedOutput, setSelectedOutput] = useState<string>("");
  const [optionValues, setOptionValues] = useState<Record<string, boolean | string | number>>({});
  const [jobs, setJobs] = useState<ConversionJob[]>([]);
  const [isQueueLoading, setIsQueueLoading] = useState(false);
  const [requestError, setRequestError] = useState("");
  const [capabilities, setCapabilities] = useState<CapabilitiesResponse | null>(null);
  const [capabilityError, setCapabilityError] = useState("");
  const [isCapabilityLoading, setIsCapabilityLoading] = useState(false);

  const theme = useMemo(() => getAppTheme(mode), [mode]);

  const operationsByCategory = useMemo(() => {
    return categoryOrder.reduce<Record<ToolCategory, ConversionOperation[]>>((acc, category) => {
      acc[category] = operations.filter((operation) => operation.category === category);
      return acc;
    }, {} as Record<ToolCategory, ConversionOperation[]>);
  }, []);

  const supportedPairs = useMemo(() => {
    const pairs = new Set<string>();
    (capabilities?.conversions ?? []).forEach((pair) => {
      pairs.add(`${pair.input_mime}->${pair.output_mime}`);
    });
    return pairs;
  }, [capabilities]);

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
    const loadCapabilities = async () => {
      setIsCapabilityLoading(true);
      try {
        const loadedCapabilities = await getCapabilities();
        setCapabilities(loadedCapabilities);
        setCapabilityError("");
      } catch (error) {
        setCapabilityError(error instanceof Error ? error.message : "Failed to load API capabilities.");
      } finally {
        setIsCapabilityLoading(false);
      }
    };
    void loadCapabilities();
  }, []);

  useEffect(() => {
    const activeJobs = jobs.filter((job) => job.status === "queued" || job.status === "processing");
    if (activeJobs.length === 0) return;

    const timer = setInterval(async () => {
      const updates = await Promise.all(
        activeJobs.map(async (job) => {
          try {
            const next = await getJobStatus(job.id);
            return { id: job.id, next };
          } catch {
            return null;
          }
        }),
      );

      setJobs((currentJobs) =>
        currentJobs.map((job) => {
          const update = updates.find((entry) => entry?.id === job.id);
          if (!update) return job;
          return {
            ...job,
            progress: update.next.progress,
            status: update.next.status,
            resultUrl: update.next.status === "completed" ? update.next.download_url : job.resultUrl,
            previewUrl: update.next.status === "completed" ? update.next.download_url : job.previewUrl,
          };
        }),
      );
    }, 2000);

    return () => clearInterval(timer);
  }, [jobs]);

  const submitJob = async (file: File, remoteFileId: string) => {
    if (!selectedOperation) return;
    setIsQueueLoading(true);
    setRequestError("");

    const outputExtension = selectedOutput || selectedOperation.outputs[0];
    const sourceMime = mimeFromFile(file);
    const targetMime = extensionToMime(outputExtension);

    if (capabilities && !supportedPairs.has(`${sourceMime}->${targetMime}`)) {
      setIsQueueLoading(false);
      setRequestError(`Unsupported conversion for API backend: ${sourceMime} -> ${targetMime}`);
      return;
    }

    try {
      const created = await createConversion({
        file_id: remoteFileId,
        source_format: sourceMime,
        target_format: targetMime,
      });

      const newJob: ConversionJob = {
        id: created.job_id,
        remoteFileId,
        operationId: selectedOperation.id,
        sourceFileName: file.name,
        outputFormat: outputExtension,
        progress: 0,
        status: "queued",
        startedAt: Date.now(),
      };
      setJobs((existing) => [newJob, ...existing]);
      setActiveView("queue");
    } catch (error) {
      setRequestError(error instanceof Error ? error.message : "Unable to enqueue conversion job.");
    } finally {
      setIsQueueLoading(false);
    }
  };

  const enqueueJob = (file: File, remoteFileId: string) => {
    void submitJob(file, remoteFileId);
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
          <Button onClick={() => setActiveView("converter")} aria-label="Go to converter">
            Converter
          </Button>
          <Button onClick={() => setActiveView("queue")} aria-label="Go to queue page">
            Queue ({jobs.length})
          </Button>
          <Button onClick={() => setActiveView("results")} aria-label="Go to results page">
            Results ({completedResults.length})
          </Button>
          <Button onClick={() => setActiveView("capabilities")} aria-label="Go to capabilities page">
            API Features
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
        {activeView === "converter" ? (
          <Stack spacing={3}>
            <Box>
              <Typography variant="h4" gutterBottom>
                Convert files with a full toolkit
              </Typography>
              <Typography variant="body1" color="text.secondary">
                Pick from PDF, Office, Image, Media, Data, and Archive tools inspired by modern online conversion suites.
              </Typography>
            </Box>

            {requestError ? <Alert severity="error">{requestError}</Alert> : null}

            {categoryOrder.map((category) => (
              <Box key={category}>
                <Typography variant="h6" mb={1}>
                  {category} tools
                </Typography>
                <Grid container spacing={2}>
                  {operationsByCategory[category].map((operation) => (
                    <Grid key={operation.id} item xs={12} sm={6} lg={4}>
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
              <Grid item xs={12} md={7}>
                <Uploader operation={selectedOperation} onFileAccepted={enqueueJob} />
              </Grid>
              <Grid item xs={12} md={5}>
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
        ) : activeView === "queue" ? (
          <Box>
            <Typography variant="h4" gutterBottom>
              Queue
            </Typography>
            <Typography variant="body2" color="text.secondary" mb={3}>
              Track queued and in-flight jobs in real time.
            </Typography>
            {jobs.length === 0 ? (
              <Alert severity="info">No jobs in queue. Start from the Converter page.</Alert>
            ) : (
              <Stack spacing={1.5}>
                {jobs.map((job) => (
                  <JobProgress key={job.id} job={job} />
                ))}
              </Stack>
            )}
          </Box>
        ) : activeView === "results" ? (
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
                  <Grid key={result.id} item xs={12} md={6}>
                    <ResultPreview result={result} />
                  </Grid>
                ))}
              </Grid>
            )}
          </Box>
        ) : (
          <Box>
            <Typography variant="h4" gutterBottom>
              API Capabilities
            </Typography>
            <Typography variant="body2" color="text.secondary" mb={2}>
              Live backend capability discovery for supported conversion pairs and operations.
            </Typography>
            {isCapabilityLoading ? (
              <Stack direction="row" spacing={1} alignItems="center">
                <CircularProgress size={18} />
                <Typography variant="body2">Loading capabilities...</Typography>
              </Stack>
            ) : null}
            {capabilityError ? <Alert severity="error">{capabilityError}</Alert> : null}
            {capabilities ? (
              <Stack spacing={2}>
                <Box>
                  <Typography variant="subtitle1" mb={1}>
                    Plugins
                  </Typography>
                  <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                    {capabilities.plugins.map((plugin) => (
                      <Chip key={plugin} label={plugin} size="small" />
                    ))}
                  </Stack>
                </Box>
                <Box>
                  <Typography variant="subtitle1" mb={1}>
                    Operations
                  </Typography>
                  <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                    {capabilities.operations.map((operation) => (
                      <Chip key={operation} label={operation} color="primary" variant="outlined" size="small" />
                    ))}
                  </Stack>
                </Box>
                <Box>
                  <Typography variant="subtitle1" mb={1}>
                    Supported conversion pairs ({capabilities.conversions.length})
                  </Typography>
                  <List dense>
                    {capabilities.conversions.slice(0, 25).map((conversion) => (
                      <ListItem key={`${conversion.input_mime}-${conversion.output_mime}-${conversion.plugin}`} disablePadding>
                        <ListItemText
                          primary={`${conversion.input_mime} -> ${conversion.output_mime}`}
                          secondary={`plugin: ${conversion.plugin}`}
                        />
                      </ListItem>
                    ))}
                  </List>
                </Box>
              </Stack>
            ) : null}
          </Box>
        )}
      </Container>
    </ThemeProvider>
  );
}
