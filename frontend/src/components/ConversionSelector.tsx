const conversionPairs = [
  { from: 'pdf', to: ['docx', 'txt'] },
  { from: 'docx', to: ['pdf', 'txt'] },
  { from: 'png', to: ['jpg', 'webp'] },
]

export function ConversionSelector() {
  return (
    <section className="card">
      <h2>Conversion Tool Selector</h2>
      <ul>
        {conversionPairs.map((pair) => (
          <li key={pair.from}>
            <strong>{pair.from.toUpperCase()}</strong> → {pair.to.join(', ').toUpperCase()}
          </li>
        ))}
      </ul>
    </section>
  )
}
