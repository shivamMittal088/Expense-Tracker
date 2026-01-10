import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import "./assets/styles/fonts.css"
import './index.css'
import "react-day-picker/dist/style.css";

import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
