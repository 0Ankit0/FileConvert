import { Link, Route, Routes } from 'react-router-dom'

import { ConversionPage } from './pages/ConversionPage'
import { HistoryPage } from './pages/HistoryPage'
import { JobStatusPage } from './pages/JobStatusPage'
import { UploadPage } from './pages/UploadPage'

export default function App() {
  return (
    <div className="layout">
      <header>
        <h1>FileConvert</h1>
        <nav>
          <Link to="/">Upload</Link>
          <Link to="/convert">Conversion Tool</Link>
          <Link to="/jobs">Job Status</Link>
          <Link to="/history">Results</Link>
        </nav>
      </header>
      <main>
        <Routes>
          <Route path="/" element={<UploadPage />} />
          <Route path="/convert" element={<ConversionPage />} />
          <Route path="/jobs" element={<JobStatusPage />} />
          <Route path="/history" element={<HistoryPage />} />
        </Routes>
      </main>
    </div>
  )
}
