import { FormEvent, useState } from 'react'

export function UploadForm() {
  const [filename, setFilename] = useState<string>('')

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
  }

  return (
    <form onSubmit={handleSubmit} className="card">
      <h2>Upload File</h2>
      <input
        type="file"
        onChange={(event) => setFilename(event.target.files?.[0]?.name ?? '')}
      />
      <p>{filename ? `Selected: ${filename}` : 'No file selected yet.'}</p>
      <button type="submit">Upload</button>
    </form>
  )
}
