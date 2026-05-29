import CloudUploadOutlinedIcon from "@mui/icons-material/CloudUploadOutlined";
import InsertDriveFileOutlinedIcon from "@mui/icons-material/InsertDriveFileOutlined";
import { Alert, Box, LinearProgress, Paper, Stack, Typography } from "@mui/material";
import { DragEvent, KeyboardEvent, useEffect, useRef, useState } from "react";
import { uploadFileInChunks } from "../api/chunkUpload";
import { ConversionOperation } from "../types";

interface UploaderProps {
  operation?: ConversionOperation;
  onFileAccepted: (file: File, remoteFileId: string) => void;
}

export function Uploader({ operation, onFileAccepted }: UploaderProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string>("");
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setError("");
  }, [operation?.id]);

  const validateFile = async (file: File) => {
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
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : "Upload failed.");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <>
      <Paper
        role="button"
        tabIndex={0}
        aria-label="Upload source file by clicking or dragging"
        onClick={() => {
          if (!isUploading && fileInputRef.current) {
            fileInputRef.current.value = "";
            fileInputRef.current.click();
          }
        }}
        onKeyDown={(event: KeyboardEvent) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            if (!isUploading && fileInputRef.current) {
              fileInputRef.current.value = "";
              fileInputRef.current.click();
            }
          }
        }}
        onDragOver={(event: DragEvent) => {
          event.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={(event: DragEvent) => {
          event.preventDefault();
          setIsDragging(false);
          const droppedFile = event.dataTransfer.files.item(0);
          if (droppedFile && !isUploading) validateFile(droppedFile);
        }}
        sx={{
          p: 4,
          border: "2px dashed",
          borderColor: isDragging ? "primary.main" : "divider",
          backgroundColor: isDragging ? "action.hover" : "background.paper",
          cursor: isUploading ? "progress" : "pointer",
          opacity: isUploading ? 0.8 : 1,
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
        disabled={isUploading}
        onChange={(event) => {
          const file = event.target.files?.item(0);
          if (file) validateFile(file);
          event.currentTarget.value = "";
        }}
      />

      {error ? (
        <Alert sx={{ mt: 2 }} severity="error" aria-live="polite">
          {error}
        </Alert>
      ) : null}

      {isUploading ? (
        <Box mt={2} aria-live="polite">
          <Typography variant="body2" color="text.secondary" mb={0.5}>
            Uploading in chunks… {uploadProgress}%
          </Typography>
          <LinearProgress variant="determinate" value={uploadProgress} />
        </Box>
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
