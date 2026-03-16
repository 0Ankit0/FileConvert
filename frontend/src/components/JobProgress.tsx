import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import ErrorOutlineIcon from "@mui/icons-material/ErrorOutline";
import ScheduleIcon from "@mui/icons-material/Schedule";
import { Card, CardContent, Chip, LinearProgress, Stack, Typography } from "@mui/material";
import { ConversionJob } from "../types";

interface JobProgressProps {
  job: ConversionJob;
}

export function JobProgress({ job }: JobProgressProps) {
  const statusIcon =
    job.status === "completed" ? (
      <CheckCircleOutlineIcon fontSize="small" />
    ) : job.status === "failed" ? (
      <ErrorOutlineIcon fontSize="small" />
    ) : (
      <ScheduleIcon fontSize="small" />
    );

  return (
    <Card variant="outlined">
      <CardContent>
        <Stack direction="row" justifyContent="space-between" alignItems="center">
          <Typography variant="subtitle1">{job.sourceFileName}</Typography>
          <Chip
            icon={statusIcon}
            label={job.status}
            color={job.status === "completed" ? "success" : job.status === "failed" ? "error" : "default"}
            size="small"
            aria-label={`Job status ${job.status}`}
          />
        </Stack>
        <Typography variant="body2" color="text.secondary" mt={1}>
          Output: .{job.outputFormat}
        </Typography>
        <LinearProgress
          aria-label={`Progress ${job.progress} percent`}
          variant="determinate"
          value={job.progress}
          color={job.status === "failed" ? "error" : "primary"}
          sx={{ mt: 2, height: 10, borderRadius: 8 }}
        />
        {job.error ? (
          <Typography variant="body2" color="error.main" mt={1} aria-live="polite">
            {job.error}
          </Typography>
        ) : null}
      </CardContent>
    </Card>
  );
}
