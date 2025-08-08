import React from 'react'
import ReactDOM from 'react-dom/client'
import { Provider } from 'react-redux'
import { store } from './store/index.js'
import { ThemeProvider } from './contexts/ThemeContext.jsx'
import App from './App.jsx'
import { initConfig } from './utils/envConfig.js'
import { initMonitoring } from './utils/monitoring.js'
import { initializeErrorLogging } from './services/errorLogging.js'
import { initPerformanceMonitoring } from './utils/performance.js'
import './index.css'

// Initialize configuration and monitoring
initConfig()
initMonitoring().catch(console.warn)
initializeErrorLogging()
initPerformanceMonitoring()

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <Provider store={store}>
      <ThemeProvider>
        <App />
      </ThemeProvider>
    </Provider>
  </React.StrictMode>,
)