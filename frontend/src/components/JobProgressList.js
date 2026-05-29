import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
const jobs = [
    { id: 'job-101', status: 'Processing', progress: 72 },
    { id: 'job-102', status: 'Queued', progress: 10 },
];
export function JobProgressList() {
    return (_jsxs("section", { className: "card", children: [_jsx("h2", { children: "Job Status & Progress" }), jobs.map((job) => (_jsxs("article", { children: [_jsxs("p", { children: [_jsx("strong", { children: job.id }), " \u2014 ", job.status] }), _jsx("progress", { max: 100, value: job.progress }), _jsxs("span", { children: [job.progress, "%"] })] }, job.id)))] }));
}
