import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { FormControl, InputLabel, MenuItem, Select } from "@mui/material";
export function FormatPicker({ options, value, onChange }) {
    const handleChange = (event) => onChange(event.target.value);
    const normalizedValue = options.includes(value) ? value : options[0] ?? "";
    return (_jsxs(FormControl, { fullWidth: true, children: [_jsx(InputLabel, { id: "output-format-label", children: "Output format" }), _jsx(Select, { labelId: "output-format-label", "aria-label": "Select output format", label: "Output format", value: normalizedValue, onChange: handleChange, children: options.map((option) => (_jsxs(MenuItem, { value: option, children: [".", option] }, option))) })] }));
}
