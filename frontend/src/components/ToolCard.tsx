import { Card, CardActionArea, CardContent, Chip, Stack, Typography } from "@mui/material";
import { ConversionOperation } from "../types";

interface ToolCardProps {
  operation: ConversionOperation;
  selected?: boolean;
  onSelect: (operation: ConversionOperation) => void;
}

export function ToolCard({ operation, selected = false, onSelect }: ToolCardProps) {
  return (
    <Card
      variant={selected ? "elevation" : "outlined"}
      elevation={selected ? 6 : 0}
      sx={{ borderColor: selected ? "primary.main" : "divider", height: "100%" }}
    >
      <CardActionArea
        aria-label={`Select ${operation.name} conversion tool`}
        onClick={() => onSelect(operation)}
        sx={{ height: "100%" }}
      >
        <CardContent>
          <Stack direction="row" spacing={1} justifyContent="space-between" alignItems="center" mb={1}>
            <Typography variant="h6" component="h3">
              {operation.name}
            </Typography>
            <Chip size="small" color="primary" label={operation.category} />
          </Stack>
          <Typography variant="body2" color="text.secondary">
            Input: {operation.accepts.map((ext) => `.${ext}`).join(", ")}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Output: {operation.outputs.map((ext) => `.${ext}`).join(", ")}
          </Typography>
        </CardContent>
      </CardActionArea>
    </Card>
  );
}
