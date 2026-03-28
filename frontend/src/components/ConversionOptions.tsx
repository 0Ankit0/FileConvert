import {
  FormControlLabel,
  MenuItem,
  Paper,
  SelectChangeEvent,
  Select,
  Slider,
  Stack,
  Switch,
  Typography,
} from "@mui/material";
import { ChangeEvent } from "react";
import { ConversionOperation, OptionSchema } from "../types";

interface ConversionOptionsProps {
  operation?: ConversionOperation;
  values: Record<string, boolean | string | number>;
  onOptionChange: (key: string, value: boolean | string | number) => void;
}

function OptionField({
  option,
  value,
  onChange,
}: {
  option: OptionSchema;
  value: boolean | string | number;
  onChange: (value: boolean | string | number) => void;
}) {
  if (option.type === "boolean") {
    return (
      <FormControlLabel
        control={
          <Switch
            checked={Boolean(value)}
            onChange={(event: ChangeEvent<HTMLInputElement>) => onChange(event.target.checked)}
            inputProps={{ "aria-label": option.ariaLabel }}
          />
        }
        label={option.label}
      />
    );
  }

  if (option.type === "select") {
    return (
      <Stack spacing={1}>
        <Typography variant="body2">{option.label}</Typography>
        <Select
          size="small"
          value={String(value)}
          onChange={(event: SelectChangeEvent<string>) => onChange(event.target.value)}
          inputProps={{ "aria-label": option.ariaLabel }}
        >
          {option.choices?.map((choice) => (
            <MenuItem key={choice} value={choice}>
              {choice}
            </MenuItem>
          ))}
        </Select>
      </Stack>
    );
  }

  return (
    <Stack spacing={1}>
      <Typography variant="body2">{option.label}</Typography>
      <Slider
        value={Number(value)}
        valueLabelDisplay="auto"
        min={option.min}
        max={option.max}
        step={1}
        onChange={(_: Event, nextValue: number | number[]) => onChange(nextValue as number)}
        aria-label={option.ariaLabel}
      />
    </Stack>
  );
}

export function ConversionOptions({ operation, values, onOptionChange }: ConversionOptionsProps) {
  if (!operation) {
    return (
      <Paper variant="outlined" sx={{ p: 2 }}>
        <Typography variant="subtitle1">Conversion options</Typography>
        <Typography variant="body2" color="text.secondary">
          Select a tool to configure conversion-specific options.
        </Typography>
      </Paper>
    );
  }

  return (
    <Paper variant="outlined" sx={{ p: 2 }}>
      <Typography variant="subtitle1" gutterBottom>
        {operation.name} options
      </Typography>
      <Stack spacing={2}>
        {operation.options.map((option) => (
          <OptionField
            key={option.key}
            option={option}
            value={values[option.key] ?? option.defaultValue}
            onChange={(value) => onOptionChange(option.key, value)}
          />
        ))}
      </Stack>
    </Paper>
  );
}
