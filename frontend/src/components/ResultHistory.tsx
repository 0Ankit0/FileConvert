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
]

export function ResultHistory() {
  return (
    <section className="card">
      <h2>Download & Result History</h2>
      <table>
        <thead>
          <tr>
            <th>Job</th>
            <th>Source</th>
            <th>Output</th>
            <th>Downloaded</th>
          </tr>
        </thead>
        <tbody>
          {history.map((entry) => (
            <tr key={entry.id}>
              <td>{entry.id}</td>
              <td>{entry.source}</td>
              <td>
                <a href="#">{entry.converted}</a>
              </td>
              <td>{entry.downloadedAt}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  )
}
