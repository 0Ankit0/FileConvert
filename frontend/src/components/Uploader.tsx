import CloudUploadOutlinedIcon from "@mui/icons-material/CloudUploadOutlined";
import InsertDriveFileOutlinedIcon from "@mui/icons-material/InsertDriveFileOutlined";
import { Alert, Box, Paper, Stack, Typography } from "@mui/material";
import { useRef, useState } from "react";
import { ConversionOperation } from "../types";

interface UploaderProps {
  operation?: ConversionOperation;
  onFileAccepted: (file: File) => void;
}

export function Uploader({ operation, onFileAccepted }: UploaderProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string>("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateFile = (file: File) => {
    if (!operation) {
      setError("Select a conversion tool first.");
      return;
    }
    const extension = file.name.split(".").pop()?.toLowerCase() ?? "";
    if (!operation.accepts.includes(extension)) {
      setError(`Unsupported file type .${extension}. Expected: ${operation.accepts.join(", ")}`);
      return;
    }
    setError("");
    onFileAccepted(file);
  };

  return (
    <>
      <Paper
        role="button"
        tabIndex={0}
        aria-label="Upload source file by clicking or dragging"
        onClick={() => fileInputRef.current?.click()}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            fileInputRef.current?.click();
          }
        }}
        onDragOver={(event) => {
          event.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={(event) => {
          event.preventDefault();
          setIsDragging(false);
          const droppedFile = event.dataTransfer.files.item(0);
          if (droppedFile) validateFile(droppedFile);
        }}
        sx={{
          p: 4,
          border: "2px dashed",
          borderColor: isDragging ? "primary.main" : "divider",
          backgroundColor: isDragging ? "action.hover" : "background.paper",
          cursor: "pointer",
        }}
      >
        <Stack spacing={1} alignItems="center">
          <CloudUploadOutlinedIcon color={isDragging ? "primary" : "inherit"} fontSize="large" />
          <Typography variant="h6">Drag & drop a file, or click to browse</Typography>
          <Typography variant="body2" color="text.secondary">
            {operation
              ? `Accepts: ${operation.accepts.map((ext) => `.${ext}`).join(", ")}`
              : "Choose a tool to enable file detection and validation"}
          </Typography>
        </Stack>
      </Paper>

      <input
        ref={fileInputRef}
        hidden
        type="file"
        onChange={(event) => {
          const file = event.target.files?.item(0);
          if (file) validateFile(file);
        }}
      />

      {error ? (
        <Alert sx={{ mt: 2 }} severity="error" aria-live="polite">
          {error}
        </Alert>
      ) : null}

      {!error && operation ? (
        <Box mt={2} aria-live="polite">
          <Typography variant="caption" color="text.secondary">
            <InsertDriveFileOutlinedIcon sx={{ verticalAlign: "middle", mr: 0.5 }} fontSize="inherit" />
            File-type detection active for {operation.name}
          </Typography>
        </Box>
      ) : null}
    </>
  );
}
