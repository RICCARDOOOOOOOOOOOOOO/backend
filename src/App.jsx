import React, { useState, useEffect } from 'react';

const API_BASE = 'https://gestione.parrocchiacarpaneto.com/servizi/api/turni';

/* Estrae sempre un array dall'oggetto di risposta (returnObject, turni, partecipanti…) */
const extractArray = (data) => {
  if (!data) return [];
  if (Array.isArray(data)) return data;
  if (Array.isArray(data.returnObject)) return data.returnObject;
  if (Array.isArray(data.turni)) return data.turni;
  if (Array.isArray(data.partecipanti)) return data.partecipanti;
  return [];
};

export default function App() {
  const [years, setYears] = useState([2025, 2024]);
  const [selectedYear, setSelectedYear] = useState(2025);
  const [turni, setTurni] = useState([]);
  const [selectedTurno, setSelectedTurno] = useState(null);
  const [partecipanti, setPartecipanti] = useState([]);

  /* Token nella querystring → localStorage */
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const tokenFromURL = params.get('token');
    if (tokenFromURL) localStorage.setItem('token', tokenFromURL);
  }, []);

  /* Ricarica turni quando cambia l'anno */
  useEffect(() => {
    fetchTurni(selectedYear);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedYear]);

  /* Header comune con JWT */
  const authHeader = () => ({
    'Content-Type': 'application/json',
    Customauthorization: 'Bearer ' + localStorage.getItem('token'),
  });

  /* -------------------- API CALLS -------------------- */
  const fetchTurni = async (year) => {
    try {
      const res = await fetch(`${API_BASE}/recuperaTurni.php?year=${year}`, {
        method: 'GET',
        headers: authHeader(),
      });

      if (!res.ok) {
        console.error('fetchTurni status:', res.status);
        if (res.status === 401) console.warn('Token non valido/scaduto');
      }

      const data = await res.json();
      console.log('fetchTurni RAW:', data);

      if (data.token) localStorage.setItem('token', data.token);

      const turniArr = extractArray(data);
      console.log('turni estratti:', turniArr);

      setTurni(turniArr);
      setSelectedTurno(null);
      setPartecipanti([]);

      /* aggiorna dropdown anni */
      const found = new Set([year]);
      turniArr.forEach((t) => {
        const yr = t?.year ?? t?.anno ?? (t?.inizio ? new Date(t.inizio).getFullYear() : null);
        if (yr) found.add(Number(yr));
      });
      setYears(Array.from(found).sort((a, b) => b - a));
    } catch (err) {
      console.error('Errore fetchTurni:', err);
    }
  };

  const fetchDettagli = async (idTurno) => {
    try {
      /* L'endpoint richiede POST con payload { idturno } come nel tuo vecchio codice */
      const res = await fetch(`${API_BASE}/recuperaDettagli.php`, {
        method: 'POST',
        headers: authHeader(),
        body: JSON.stringify({ idturno: idTurno }),
      });

      if (!res.ok) console.error('fetchDettagli status:', res.status);

      const data = await res.json();
      console.log('fetchDettagli RAW:', data);

      if (data.token) localStorage.setItem('token', data.token);

      setPartecipanti(extractArray(data));
    } catch (err) {
      console.error('Errore fetchDettagli:', err);
    }
  };

  /* -------------------- HANDLERS -------------------- */
  const handleTurnoClick = (t) => {
    if (!t?.id) return;
    setSelectedTurno(t);
    fetchDettagli(t.id);
  };

  const aggiorna = () => fetchTurni(selectedYear);

  /* -------------------- RENDER -------------------- */
  return (
    <div className="min-h-screen flex flex-col items-center p-8 font-sans">
      <button
        onClick={aggiorna}
        className="self-end mb-4 px-4 py-1 rounded-lg shadow text-sm hover:bg-gray-100"
      >
        Reset
      </button>

      <h1 className="text-4xl font-bold mb-6">Cassa</h1>

      <select
        className="mb-8 p-2 rounded-xl shadow border focus:outline-none focus:ring"
        value={selectedYear}
        onChange={(e) => setSelectedYear(Number(e.target.value))}
      >
        {years.map((y) => (
          <option key={y} value={y}>
            {y}
          </option>
        ))}
      </select>

      {/* --- Bottoni turni (max 4) --- */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {turni.slice(0, 4).map((t, idx) => (
          <button
            key={t?.id ?? idx}
            disabled={!t}
            className={`rounded-xl py-2 px-4 shadow focus:outline-none focus:ring transition ${
              selectedTurno?.id === t?.id ? 'bg-gray-200' : 'bg-white'
            } ${!t ? 'opacity-50 cursor-default' : 'hover:bg-gray-100'}`}
            onClick={() => handleTurnoClick(t)}
          >
            {t?.titolo ?? '—'}
          </button>
        ))}
      </div>

      {/* --- Lista partecipanti --- */}
      {selectedTurno && (
        <div className="mt-10 w-full max-w-xl">
          <h2 className="text-2xl font-semibold mb-4">{selectedTurno.titolo}</h2>
          {partecipanti.length === 0 ? (
            <p>Caricamento partecipanti...</p>
          ) : (
            <ul className="list-disc ml-6 space-y-1">
              {partecipanti.map((p, i) => (
                <li key={p?.id ?? p?.ID ?? i}>
                  {(p?.nome ?? p?.Nome ?? '') + ' ' + (p?.cognome ?? p?.Cognome ?? '')}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
