import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { FormControlLabel, MenuItem, Paper, Select, Slider, Stack, Switch, Typography, } from "@mui/material";
function OptionField({ option, value, onChange, }) {
    if (option.type === "boolean") {
        return (_jsx(FormControlLabel, { control: _jsx(Switch, { checked: Boolean(value), onChange: (event) => onChange(event.target.checked), inputProps: { "aria-label": option.ariaLabel } }), label: option.label }));
    }
    if (option.type === "select") {
        return (_jsxs(Stack, { spacing: 1, children: [_jsx(Typography, { variant: "body2", children: option.label }), _jsx(Select, { size: "small", value: String(value), onChange: (event) => onChange(event.target.value), inputProps: { "aria-label": option.ariaLabel }, children: option.choices?.map((choice) => (_jsx(MenuItem, { value: choice, children: choice }, choice))) })] }));
    }
    return (_jsxs(Stack, { spacing: 1, children: [_jsx(Typography, { variant: "body2", children: option.label }), _jsx(Slider, { value: Number(value), valueLabelDisplay: "auto", min: option.min, max: option.max, step: 1, onChange: (_, nextValue) => onChange(nextValue), "aria-label": option.ariaLabel })] }));
}
export function ConversionOptions({ operation, values, onOptionChange }) {
    if (!operation) {
        return (_jsxs(Paper, { variant: "outlined", sx: { p: 2 }, children: [_jsx(Typography, { variant: "subtitle1", children: "Conversion options" }), _jsx(Typography, { variant: "body2", color: "text.secondary", children: "Select a tool to configure conversion-specific options." })] }));
    }
    return (_jsxs(Paper, { variant: "outlined", sx: { p: 2 }, children: [_jsxs(Typography, { variant: "subtitle1", gutterBottom: true, children: [operation.name, " options"] }), _jsx(Stack, { spacing: 2, children: operation.options.map((option) => (_jsx(OptionField, { option: option, value: values[option.key] ?? option.defaultValue, onChange: (value) => onOptionChange(option.key, value) }, option.key))) })] }));
}
