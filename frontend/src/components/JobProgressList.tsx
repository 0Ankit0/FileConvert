const jobs = [
  { id: 'job-101', status: 'Processing', progress: 72 },
  { id: 'job-102', status: 'Queued', progress: 10 },
]

export function JobProgressList() {
  return (
    <section className="card">
      <h2>Job Status & Progress</h2>
      {jobs.map((job) => (
        <article key={job.id}>
          <p>
            <strong>{job.id}</strong> — {job.status}
          </p>
          <progress max={100} value={job.progress} />
          <span>{job.progress}%</span>
        </article>
      ))}
    </section>
  )
}
