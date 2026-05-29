import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import CloudUploadOutlinedIcon from "@mui/icons-material/CloudUploadOutlined";
import InsertDriveFileOutlinedIcon from "@mui/icons-material/InsertDriveFileOutlined";
import { Alert, Box, LinearProgress, Paper, Stack, Typography } from "@mui/material";
import { useEffect, useRef, useState } from "react";
import { uploadFileInChunks } from "../api/chunkUpload";
export function Uploader({ operation, onFileAccepted }) {
    const [isDragging, setIsDragging] = useState(false);
    const [error, setError] = useState("");
    const [isUploading, setIsUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const fileInputRef = useRef(null);
    useEffect(() => {
        setError("");
    }, [operation?.id]);
    const validateFile = async (file) => {
        if (!operation) {
            setError("Select a conversion tool first.");
            return;
        }
        const extension = file.name.split(".").pop()?.toLowerCase() ?? "";
        if (!operation.accepts.includes(extension)) {
            setError(`Unsupported file type .${extension}. Expected: ${operation.accepts.join(", ")}`);
            return;
        }
        try {
            setError("");
            setIsUploading(true);
            setUploadProgress(0);
            const upload = await uploadFileInChunks(file, (uploaded, total) => {
                setUploadProgress(Math.round((uploaded / total) * 100));
            });
            onFileAccepted(file, upload.file_id);
        }
        catch (uploadError) {
            setError(uploadError instanceof Error ? uploadError.message : "Upload failed.");
        }
        finally {
            setIsUploading(false);
        }
    };
    return (_jsxs(_Fragment, { children: [_jsx(Paper, { role: "button", tabIndex: 0, "aria-label": "Upload source file by clicking or dragging", onClick: () => {
                    if (!isUploading && fileInputRef.current) {
                        fileInputRef.current.value = "";
                        fileInputRef.current.click();
                    }
                }, onKeyDown: (event) => {
                    if (event.key === "Enter" || event.key === " ") {
                        event.preventDefault();
                        if (!isUploading && fileInputRef.current) {
                            fileInputRef.current.value = "";
                            fileInputRef.current.click();
                        }
                    }
                }, onDragOver: (event) => {
                    event.preventDefault();
                    setIsDragging(true);
                }, onDragLeave: () => setIsDragging(false), onDrop: (event) => {
                    event.preventDefault();
                    setIsDragging(false);
                    const droppedFile = event.dataTransfer.files.item(0);
                    if (droppedFile && !isUploading)
                        validateFile(droppedFile);
                }, sx: {
                    p: 4,
                    border: "2px dashed",
                    borderColor: isDragging ? "primary.main" : "divider",
                    backgroundColor: isDragging ? "action.hover" : "background.paper",
                    cursor: isUploading ? "progress" : "pointer",
                    opacity: isUploading ? 0.8 : 1,
                }, children: _jsxs(Stack, { spacing: 1, alignItems: "center", children: [_jsx(CloudUploadOutlinedIcon, { color: isDragging ? "primary" : "inherit", fontSize: "large" }), _jsx(Typography, { variant: "h6", children: "Drag & drop a file, or click to browse" }), _jsx(Typography, { variant: "body2", color: "text.secondary", children: operation
                                ? `Accepts: ${operation.accepts.map((ext) => `.${ext}`).join(", ")}`
                                : "Choose a tool to enable file detection and validation" })] }) }), _jsx("input", { ref: fileInputRef, hidden: true, type: "file", disabled: isUploading, onChange: (event) => {
                    const file = event.target.files?.item(0);
                    if (file)
                        validateFile(file);
                    event.currentTarget.value = "";
                } }), error ? (_jsx(Alert, { sx: { mt: 2 }, severity: "error", "aria-live": "polite", children: error })) : null, isUploading ? (_jsxs(Box, { mt: 2, "aria-live": "polite", children: [_jsxs(Typography, { variant: "body2", color: "text.secondary", mb: 0.5, children: ["Uploading in chunks\u2026 ", uploadProgress, "%"] }), _jsx(LinearProgress, { variant: "determinate", value: uploadProgress })] })) : null, !error && operation ? (_jsx(Box, { mt: 2, "aria-live": "polite", children: _jsxs(Typography, { variant: "caption", color: "text.secondary", children: [_jsx(InsertDriveFileOutlinedIcon, { sx: { verticalAlign: "middle", mr: 0.5 }, fontSize: "inherit" }), "File-type detection active for ", operation.name] }) })) : null] }));
}
