import { RouterProvider } from 'react-router-dom'
import router from './router'
import './App.css'

function App() {
  return (
    <div className="app-container">
      <header className="app-header">
        <h1>QuizForge</h1>
        <p>Générateur de quiz propulsé par l'IA</p>
      </header>
      
      <main className="app-content">
        <RouterProvider router={router} />
      </main>
      
      <footer className="app-footer">
        <p>QuizForge {new Date().getFullYear()} - POC Local</p>
      </footer>
    </div>
  )
}

export default App
