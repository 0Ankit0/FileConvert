import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import DownloadOutlinedIcon from "@mui/icons-material/DownloadOutlined";
import VisibilityOutlinedIcon from "@mui/icons-material/VisibilityOutlined";
import { Button, Card, CardActions, CardContent, Stack, Typography } from "@mui/material";
export function ResultPreview({ result }) {
    return (_jsxs(Card, { variant: "outlined", children: [_jsxs(CardContent, { children: [_jsx(Typography, { variant: "h6", children: result.sourceFileName }), _jsxs(Typography, { variant: "body2", color: "text.secondary", children: ["Converted to .", result.outputFormat] })] }), _jsx(CardActions, { children: _jsxs(Stack, { direction: "row", spacing: 1, children: [_jsx(Button, { startIcon: _jsx(VisibilityOutlinedIcon, {}), href: result.previewUrl || "#", target: "_blank", rel: "noreferrer", disabled: !result.previewUrl, "aria-label": `Preview result for ${result.sourceFileName}`, children: "Preview" }), _jsx(Button, { variant: "contained", startIcon: _jsx(DownloadOutlinedIcon, {}), href: result.resultUrl || "#", disabled: !result.resultUrl, "aria-label": `Download result for ${result.sourceFileName}`, children: "Download" })] }) })] }));
}
