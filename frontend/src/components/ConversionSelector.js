import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
const conversionPairs = [
    { from: 'pdf', to: ['docx', 'txt'] },
    { from: 'docx', to: ['pdf', 'txt'] },
    { from: 'png', to: ['jpg', 'webp'] },
];
export function ConversionSelector() {
    return (_jsxs("section", { className: "card", children: [_jsx("h2", { children: "Conversion Tool Selector" }), _jsx("ul", { children: conversionPairs.map((pair) => (_jsxs("li", { children: [_jsx("strong", { children: pair.from.toUpperCase() }), " \u2192 ", pair.to.join(', ').toUpperCase()] }, pair.from))) })] }));
}
