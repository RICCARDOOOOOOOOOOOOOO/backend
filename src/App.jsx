import { useState, useEffect } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'
import ElencoTurni from './pages/elencoTurni';
import ElencoPresenzeTurno from './pages/ElencoPresenzeTurno';
import DettaglioCassa from './pages/DettaglioCassa';
import RiepilogoCassa from './pages/RiepilogoCassa';

function App() {
  const [count, setCount] = useState(0);
  const [turnoAttuale, setTurnoAttuale] = useState('');
  const [anagraficaAttuale, setAnagraficaAttuale] = useState('');

  const turnoSelezionato = (turno) => {
    setTurnoAttuale(turno);
  }

  const anagraficaSelezionata = (anagrafica) => {
    console.log("app anagraficaSelezionata", anagrafica);
    setAnagraficaAttuale(anagrafica);
  }

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const token = params.get('token')
    if (token) {
      localStorage.setItem('token', token)
    } else {
      console.log('Token non trovato in url')
      console.log('Token in localStorage:',localStorage.getItem('token'));
    }

  }, [])

  return (
    <>
    <a href="https://gestione.parrocchiacarpaneto.com/login/#/?returnUrl=http://localhost:5173">Rifai la login</a>

    <ElencoTurni turnoSelezionato={turnoSelezionato}></ElencoTurni>

    <DettaglioCassa id_turno={turnoAttuale.id} id_anag={anagraficaAttuale.idanag}></DettaglioCassa>

    <RiepilogoCassa id_turno={turnoAttuale.id} anagraficaSelezionata={anagraficaSelezionata}></RiepilogoCassa>

    <ElencoPresenzeTurno idTurno={turnoAttuale.id} anagraficaSelezionata={anagraficaSelezionata}></ElencoPresenzeTurno>

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
