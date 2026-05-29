import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
const history = [
    {
        id: 'job-009',
        source: 'contract.docx',
        converted: 'contract.pdf',
        downloadedAt: '2026-03-01 08:15 UTC',
    },
    {
        id: 'job-007',
        source: 'scan.png',
        converted: 'scan.webp',
        downloadedAt: '2026-02-26 19:02 UTC',
    },
];
export function ResultHistory() {
    return (_jsxs("section", { className: "card", children: [_jsx("h2", { children: "Download & Result History" }), _jsxs("table", { children: [_jsx("thead", { children: _jsxs("tr", { children: [_jsx("th", { children: "Job" }), _jsx("th", { children: "Source" }), _jsx("th", { children: "Output" }), _jsx("th", { children: "Downloaded" })] }) }), _jsx("tbody", { children: history.map((entry) => (_jsxs("tr", { children: [_jsx("td", { children: entry.id }), _jsx("td", { children: entry.source }), _jsx("td", { children: _jsx("a", { href: "#", children: entry.converted }) }), _jsx("td", { children: entry.downloadedAt })] }, entry.id))) })] })] }));
}
