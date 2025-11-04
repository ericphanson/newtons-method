import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import LBFGSVisualizer from './lbfgs-visualizer.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <LBFGSVisualizer />
  </StrictMode>,
)
