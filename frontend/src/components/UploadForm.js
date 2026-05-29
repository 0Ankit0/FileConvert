import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
export function UploadForm() {
    const [filename, setFilename] = useState('');
    const handleSubmit = (event) => {
        event.preventDefault();
    };
    return (_jsxs("form", { onSubmit: handleSubmit, className: "card", children: [_jsx("h2", { children: "Upload File" }), _jsx("input", { type: "file", onChange: (event) => setFilename(event.target.files?.[0]?.name ?? '') }), _jsx("p", { children: filename ? `Selected: ${filename}` : 'No file selected yet.' }), _jsx("button", { type: "submit", children: "Upload" })] }));
}
