import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import AppPlot from './AppPlot.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <AppPlot />
  </StrictMode>,
)
