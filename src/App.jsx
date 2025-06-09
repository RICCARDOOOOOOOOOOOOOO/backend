import { useState, useEffect } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'

function App() {
  const [count, setCount] = useState(0)

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const token = params.get('token')

    if (token) {
      console.log('Token trovato:', token)
      localStorage.setItem('token', token)
    } else {
      console.log('Token non trovato:')
    }
  }, [])

  // Sposta login qui dentro
  function login() {
    fetch('https://gestione.parrocchiacarpaneto.com/servizi/api/turni/recuperaTurni.php?year=2025', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Customauthorization': 'Bearer ' + localStorage.getItem('token') // Usa il token salvato
      }
    })
      .then(res => res.json())
      .then(data => {
        localStorage.setItem('token', data.token)
        console.log(data)
      })
  }
  

  return (
    <>
     <button onClick={login}>Login</button>
      <div>
        <a href="https://vite.dev" target="_blank">
          <img src={viteLogo} className="logo" alt="Vite logo" />
        </a>
        <a href="https://react.dev" target="_blank">
          <img src={reactLogo} className="logo react" alt="React logo" />
        </a>
      </div>
      <h1>fulgo e merca</h1>
      <div className="card">
        <button onClick={() => setCount((count) => count + 1)}>
          count is {count}
        </button>
        <p>
          Edit <code>src/App.jsx</code> and save to test HMR
        </p>
      </div>
      <p className="read-the-docs">
        Click on the Vite and React logos to learn more
      </p>
    </>
  )
}
export default App
