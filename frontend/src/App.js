import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import DarkModeOutlinedIcon from "@mui/icons-material/DarkModeOutlined";
import LightModeOutlinedIcon from "@mui/icons-material/LightModeOutlined";
import { Alert, AppBar, Box, Button, Chip, CircularProgress, Container, CssBaseline, Divider, Grid, IconButton, List, ListItem, ListItemText, Stack, ThemeProvider, Toolbar, Typography, } from "@mui/material";
import { useEffect, useMemo, useState } from "react";
import { createConversion, getCapabilities, getJobStatus } from "./api/conversions";
import { ConversionOptions } from "./components/ConversionOptions";
import { FormatPicker } from "./components/FormatPicker";
import { JobProgress } from "./components/JobProgress";
import { ResultPreview } from "./components/ResultPreview";
import { ToolCard } from "./components/ToolCard";
import { Uploader } from "./components/Uploader";
import { categoryOrder, operations } from "./data/operations";
import { getAppTheme } from "./theme";
import { extensionToMime, mimeFromFile } from "./utils/mime";
export default function App() {
    const [mode, setMode] = useState("light");
    const [activeView, setActiveView] = useState("converter");
    const [selectedOperation, setSelectedOperation] = useState();
    const [selectedOutput, setSelectedOutput] = useState("");
    const [optionValues, setOptionValues] = useState({});
    const [jobs, setJobs] = useState([]);
    const [isQueueLoading, setIsQueueLoading] = useState(false);
    const [requestError, setRequestError] = useState("");
    const [capabilities, setCapabilities] = useState(null);
    const [capabilityError, setCapabilityError] = useState("");
    const [isCapabilityLoading, setIsCapabilityLoading] = useState(false);
    const theme = useMemo(() => getAppTheme(mode), [mode]);
    const operationsByCategory = useMemo(() => {
        return categoryOrder.reduce((acc, category) => {
            acc[category] = operations.filter((operation) => operation.category === category);
            return acc;
        }, {});
    }, []);
    const supportedPairs = useMemo(() => {
        const pairs = new Set();
        (capabilities?.conversions ?? []).forEach((pair) => {
            pairs.add(`${pair.input_mime}->${pair.output_mime}`);
        });
        return pairs;
    }, [capabilities]);
    useEffect(() => {
        if (!selectedOperation)
            return;
        setSelectedOutput(selectedOperation.outputs[0]);
        const defaults = {};
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
            }
            catch (error) {
                setCapabilityError(error instanceof Error ? error.message : "Failed to load API capabilities.");
            }
            finally {
                setIsCapabilityLoading(false);
            }
        };
        void loadCapabilities();
    }, []);
    useEffect(() => {
        const activeJobs = jobs.filter((job) => job.status === "queued" || job.status === "processing");
        if (activeJobs.length === 0)
            return;
        const timer = setInterval(async () => {
            const updates = await Promise.all(activeJobs.map(async (job) => {
                try {
                    const next = await getJobStatus(job.id);
                    return { id: job.id, next };
                }
                catch {
                    return null;
                }
            }));
            setJobs((currentJobs) => currentJobs.map((job) => {
                const update = updates.find((entry) => entry?.id === job.id);
                if (!update)
                    return job;
                return {
                    ...job,
                    progress: update.next.progress,
                    status: update.next.status,
                    resultUrl: update.next.status === "completed" ? update.next.download_url : job.resultUrl,
                    previewUrl: update.next.status === "completed" ? update.next.download_url : job.previewUrl,
                };
            }));
        }, 2000);
        return () => clearInterval(timer);
    }, [jobs]);
    const submitJob = async (file, remoteFileId) => {
        if (!selectedOperation)
            return;
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
            const newJob = {
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
        }
        catch (error) {
            setRequestError(error instanceof Error ? error.message : "Unable to enqueue conversion job.");
        }
        finally {
            setIsQueueLoading(false);
        }
    };
    const enqueueJob = (file, remoteFileId) => {
        void submitJob(file, remoteFileId);
    };
    const completedResults = jobs.filter((job) => job.status === "completed");
    return (_jsxs(ThemeProvider, { theme: theme, children: [_jsx(CssBaseline, {}), _jsx(AppBar, { position: "sticky", color: "default", elevation: 1, children: _jsxs(Toolbar, { children: [_jsx(Typography, { variant: "h6", sx: { flexGrow: 1 }, children: "FileConvert" }), _jsx(Button, { onClick: () => setActiveView("converter"), "aria-label": "Go to converter", children: "Converter" }), _jsxs(Button, { onClick: () => setActiveView("queue"), "aria-label": "Go to queue page", children: ["Queue (", jobs.length, ")"] }), _jsxs(Button, { onClick: () => setActiveView("results"), "aria-label": "Go to results page", children: ["Results (", completedResults.length, ")"] }), _jsx(Button, { onClick: () => setActiveView("capabilities"), "aria-label": "Go to capabilities page", children: "API Features" }), _jsx(IconButton, { sx: { ml: 1 }, "aria-label": `Switch to ${mode === "light" ? "dark" : "light"} mode`, onClick: () => setMode(mode === "light" ? "dark" : "light"), children: mode === "light" ? _jsx(DarkModeOutlinedIcon, {}) : _jsx(LightModeOutlinedIcon, {}) })] }) }), _jsx(Container, { sx: { py: 4 }, children: activeView === "converter" ? (_jsxs(Stack, { spacing: 3, children: [_jsxs(Box, { children: [_jsx(Typography, { variant: "h4", gutterBottom: true, children: "Convert files with a full toolkit" }), _jsx(Typography, { variant: "body1", color: "text.secondary", children: "Pick from PDF, Office, Image, Media, Data, and Archive tools inspired by modern online conversion suites." })] }), requestError ? _jsx(Alert, { severity: "error", children: requestError }) : null, categoryOrder.map((category) => (_jsxs(Box, { children: [_jsxs(Typography, { variant: "h6", mb: 1, children: [category, " tools"] }), _jsx(Grid, { container: true, spacing: 2, children: operationsByCategory[category].map((operation) => (_jsx(Grid, { item: true, xs: 12, sm: 6, lg: 4, children: _jsx(ToolCard, { operation: operation, selected: operation.id === selectedOperation?.id, onSelect: setSelectedOperation }) }, operation.id))) })] }, category))), _jsx(Divider, {}), _jsxs(Grid, { container: true, spacing: 2, children: [_jsx(Grid, { item: true, xs: 12, md: 7, children: _jsx(Uploader, { operation: selectedOperation, onFileAccepted: enqueueJob }) }), _jsx(Grid, { item: true, xs: 12, md: 5, children: _jsxs(Stack, { spacing: 2, children: [_jsx(FormatPicker, { options: selectedOperation?.outputs ?? [], value: selectedOutput, onChange: setSelectedOutput }), _jsx(ConversionOptions, { operation: selectedOperation, values: optionValues, onOptionChange: (key, value) => setOptionValues((current) => ({
                                                    ...current,
                                                    [key]: value,
                                                })) })] }) })] }), _jsx(Divider, {}), _jsxs(Box, { children: [_jsx(Typography, { variant: "h6", mb: 2, children: "Conversion queue" }), isQueueLoading ? (_jsxs(Stack, { direction: "row", spacing: 1, alignItems: "center", children: [_jsx(CircularProgress, { size: 18 }), _jsx(Typography, { variant: "body2", children: "Submitting conversion job\u2026" })] })) : null, jobs.length === 0 ? (_jsx(Alert, { severity: "info", children: "No jobs yet. Upload a file to start your first conversion." })) : (_jsx(Stack, { spacing: 1.5, mt: 1, children: jobs.map((job) => (_jsx(JobProgress, { job: job }, job.id))) }))] })] })) : activeView === "queue" ? (_jsxs(Box, { children: [_jsx(Typography, { variant: "h4", gutterBottom: true, children: "Queue" }), _jsx(Typography, { variant: "body2", color: "text.secondary", mb: 3, children: "Track queued and in-flight jobs in real time." }), jobs.length === 0 ? (_jsx(Alert, { severity: "info", children: "No jobs in queue. Start from the Converter page." })) : (_jsx(Stack, { spacing: 1.5, children: jobs.map((job) => (_jsx(JobProgress, { job: job }, job.id))) }))] })) : activeView === "results" ? (_jsxs(Box, { children: [_jsx(Typography, { variant: "h4", gutterBottom: true, children: "Results" }), _jsx(Typography, { variant: "body2", color: "text.secondary", mb: 3, children: "Access previews and downloads for successful conversions." }), jobs.length === 0 ? (_jsx(Alert, { severity: "info", children: "No results available yet. Start a conversion from the Converter page." })) : completedResults.length === 0 ? (_jsx(Alert, { severity: "warning", children: "Your jobs are still running or failed. Completed files will appear here." })) : (_jsx(Grid, { container: true, spacing: 2, children: completedResults.map((result) => (_jsx(Grid, { item: true, xs: 12, md: 6, children: _jsx(ResultPreview, { result: result }) }, result.id))) }))] })) : (_jsxs(Box, { children: [_jsx(Typography, { variant: "h4", gutterBottom: true, children: "API Capabilities" }), _jsx(Typography, { variant: "body2", color: "text.secondary", mb: 2, children: "Live backend capability discovery for supported conversion pairs and operations." }), isCapabilityLoading ? (_jsxs(Stack, { direction: "row", spacing: 1, alignItems: "center", children: [_jsx(CircularProgress, { size: 18 }), _jsx(Typography, { variant: "body2", children: "Loading capabilities..." })] })) : null, capabilityError ? _jsx(Alert, { severity: "error", children: capabilityError }) : null, capabilities ? (_jsxs(Stack, { spacing: 2, children: [_jsxs(Box, { children: [_jsx(Typography, { variant: "subtitle1", mb: 1, children: "Plugins" }), _jsx(Stack, { direction: "row", spacing: 1, flexWrap: "wrap", useFlexGap: true, children: capabilities.plugins.map((plugin) => (_jsx(Chip, { label: plugin, size: "small" }, plugin))) })] }), _jsxs(Box, { children: [_jsx(Typography, { variant: "subtitle1", mb: 1, children: "Operations" }), _jsx(Stack, { direction: "row", spacing: 1, flexWrap: "wrap", useFlexGap: true, children: capabilities.operations.map((operation) => (_jsx(Chip, { label: operation, color: "primary", variant: "outlined", size: "small" }, operation))) })] }), _jsxs(Box, { children: [_jsxs(Typography, { variant: "subtitle1", mb: 1, children: ["Supported conversion pairs (", capabilities.conversions.length, ")"] }), _jsx(List, { dense: true, children: capabilities.conversions.slice(0, 25).map((conversion) => (_jsx(ListItem, { disablePadding: true, children: _jsx(ListItemText, { primary: `${conversion.input_mime} -> ${conversion.output_mime}`, secondary: `plugin: ${conversion.plugin}` }) }, `${conversion.input_mime}-${conversion.output_mime}-${conversion.plugin}`))) })] })] })) : null] })) })] }));
}
