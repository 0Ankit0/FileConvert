import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import ErrorOutlineIcon from "@mui/icons-material/ErrorOutline";
import ScheduleIcon from "@mui/icons-material/Schedule";
import { Card, CardContent, Chip, LinearProgress, Stack, Typography } from "@mui/material";
export function JobProgress({ job }) {
    const statusIcon = job.status === "completed" ? (_jsx(CheckCircleOutlineIcon, { fontSize: "small" })) : job.status === "failed" ? (_jsx(ErrorOutlineIcon, { fontSize: "small" })) : (_jsx(ScheduleIcon, { fontSize: "small" }));
    return (_jsx(Card, { variant: "outlined", children: _jsxs(CardContent, { children: [_jsxs(Stack, { direction: "row", justifyContent: "space-between", alignItems: "center", children: [_jsx(Typography, { variant: "subtitle1", children: job.sourceFileName }), _jsx(Chip, { icon: statusIcon, label: job.status, color: job.status === "completed" ? "success" : job.status === "failed" ? "error" : "default", size: "small", "aria-label": `Job status ${job.status}` })] }), _jsxs(Typography, { variant: "body2", color: "text.secondary", mt: 1, children: ["Output: .", job.outputFormat] }), _jsx(LinearProgress, { "aria-label": `Progress ${job.progress} percent`, variant: "determinate", value: job.progress, color: job.status === "failed" ? "error" : "primary", sx: { mt: 2, height: 10, borderRadius: 8 } }), job.error ? (_jsx(Typography, { variant: "body2", color: "error.main", mt: 1, "aria-live": "polite", children: job.error })) : null] }) }));
}
