import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

// StrictMode removed: G6 graph.render() is async and incompatible
// with StrictMode's double-invoke of useEffect (destroy before render completes).
createRoot(document.getElementById('root')!).render(<App />)

