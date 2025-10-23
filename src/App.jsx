import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import Display from './pages/Display'
import Customize from './pages/Customize'
import './styles/App.css'

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Display />} />
        <Route path="/customize" element={<Customize />} />
      </Routes>
    </Router>
  )
}

export default App
