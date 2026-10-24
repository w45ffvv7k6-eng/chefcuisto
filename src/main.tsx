import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { HashRouter } from 'react-router-dom'
import { registerSW } from 'virtual:pwa-register'
import App from './App'
import { MinuteursProvider } from './lib/minuteurs'
import { appliquerTheme, lireTheme } from './lib/theme'
import './styles.css'

appliquerTheme(lireTheme())
registerSW({ immediate: true })

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <HashRouter>
      <MinuteursProvider>
        <App />
      </MinuteursProvider>
    </HashRouter>
  </StrictMode>,
)
