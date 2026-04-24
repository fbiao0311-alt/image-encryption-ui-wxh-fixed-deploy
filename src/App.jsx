import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Home from './pages/Home'
import EncryptionPage from './pages/EncryptionPage'
import RandomnessPage from './pages/RandomnessPage'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/randomness" element={<RandomnessPage />} />
        <Route path="/encryption" element={<EncryptionPage />} />
      </Routes>
    </BrowserRouter>
  )
}
