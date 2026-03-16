import DownloadOutlinedIcon from "@mui/icons-material/DownloadOutlined";
import VisibilityOutlinedIcon from "@mui/icons-material/VisibilityOutlined";
import { Button, Card, CardActions, CardContent, Stack, Typography } from "@mui/material";
import { ConversionJob } from "../types";

interface ResultPreviewProps {
  result: ConversionJob;
}

export function ResultPreview({ result }: ResultPreviewProps) {
  return (
    <Card variant="outlined">
      <CardContent>
        <Typography variant="h6">{result.sourceFileName}</Typography>
        <Typography variant="body2" color="text.secondary">
          Converted to .{result.outputFormat}
        </Typography>
      </CardContent>
      <CardActions>
        <Stack direction="row" spacing={1}>
          <Button
            startIcon={<VisibilityOutlinedIcon />}
            href={result.previewUrl || "#"}
            target="_blank"
            rel="noreferrer"
            disabled={!result.previewUrl}
            aria-label={`Preview result for ${result.sourceFileName}`}
          >
            Preview
          </Button>
          <Button
            variant="contained"
            startIcon={<DownloadOutlinedIcon />}
            href={result.resultUrl || "#"}
            disabled={!result.resultUrl}
            aria-label={`Download result for ${result.sourceFileName}`}
          >
            Download
          </Button>
        </Stack>
      </CardActions>
    </Card>
  );
}
