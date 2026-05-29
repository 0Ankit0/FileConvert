import { FormControl, InputLabel, MenuItem, Select, SelectChangeEvent } from "@mui/material";

interface FormatPickerProps {
  options: string[];
  value: string;
  onChange: (value: string) => void;
}

export function FormatPicker({ options, value, onChange }: FormatPickerProps) {
  const handleChange = (event: SelectChangeEvent<string>) => onChange(event.target.value);
  const normalizedValue = options.includes(value) ? value : options[0] ?? "";

  return (
    <FormControl fullWidth>
      <InputLabel id="output-format-label">Output format</InputLabel>
      <Select
        labelId="output-format-label"
        aria-label="Select output format"
        label="Output format"
        value={normalizedValue}
        onChange={handleChange}
      >
        {options.map((option) => (
          <MenuItem key={option} value={option}>
            .{option}
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  );
}
