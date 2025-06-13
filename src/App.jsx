import React, { useMemo, useState, useEffect } from 'react';
import Card from './components/card';
import SectionTitle from './components/Titoli';
import Modal from './components/ModalTest';
import CassaModal from './components/ModalCassa';

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

/* Estrae l'anno da un turno (qualunque sia la proprietà) */
const extractYear = (t) =>
  t?.year ??
  t?.anno ??
  (t?.inizio ? new Date(t.inizio).getFullYear() : null);


export default function App() {
  const currentYear = new Date().getFullYear();

  /* Memo per non ricalcolare ad ogni render */
  const allYears = useMemo(
    () => Array.from({ length: 10 }, (_, i) => currentYear - i),
    [],
  );

  const [years, setYears] = useState(allYears);
  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [turni, setTurni] = useState([]);
  const [selectedTurno, setSelectedTurno] = useState(null);
  const [partecipanti, setPartecipanti] = useState([]);
  const [openModal, setOpenModal] = useState(false);
  const [modalData, setModalData] = useState(null);

  const handleClickPartecipante = (p) => {
    setModalData(p);
    setOpenModal(true);
  };


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

      /* --------------- aggiorna dropdown anni --------------- */
      const found = new Set([...allYears]);      // i 10 anni “fissi”
      turniArr.forEach((t) => {
        const yr = extractYear(t);
        if (yr) found.add(Number(yr));
      });
      setYears(Array.from(found).sort((a, b) => b - a));  // ordine decrescente

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
    <>
    <div className="min-h-screen w-full bg-muted/40 flex flex-col items-center py-12 px-6 gap-8">
      {/* ---------- CARD CASSA ---------- */}
      <Card className="w-full sm:max-w-2xl lg:max-w-5xl space-y-6">
        <SectionTitle>Cassa</SectionTitle>

        {/* --- Select anni --- */}
        <select
          value={selectedYear}
          onChange={(e) => setSelectedYear(Number(e.target.value))}
          className="block mx-auto w-40 rounded-xl border border-zinc-300 bg-white py-2 pl-3 pr-8 text-center text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-primary dark:bg-zinc-800 dark:border-zinc-700"
        >
          {years.map((y) => (
            <option key={y}>{y}</option>
          ))}
        </select>

        {/* --- Bottoni turni (tanti quanti ne arrivano) --- */}
        <div className="flex flex-wrap gap-4 justify-center">
          {turni.map((t, i) => (
            <button
              key={t?.id ?? i}
              onClick={() => handleTurnoClick(t)}
              className={`rounded-xl py-2 px-4 text-sm font-medium transition
                ${selectedTurno?.id === t?.id
                  ? 'bg-primary/10 text-primary ring-1 ring-primary'
                  : 'bg-muted hover:bg-muted/80'}`}
            >
              {t?.titolo ?? `Turno ${i}`}
            </button>
          ))}
        </div>

      </Card>

      {/* ---------- CARD PARTECIPANTI ---------- */}
      {selectedTurno && (
        <Card className="w-full sm:max-w-2xl lg:max-w-5xl">
          <SectionTitle>{selectedTurno.titolo}</SectionTitle>

          {partecipanti.length === 0 ? (
            <p className="text-center mt-6 text-sm text-zinc-500">Caricamento…</p>
          ) : (
            /* elenco con “pill” tailwind */
            <ul className="flex flex-col gap-4 mt-6">
              {partecipanti.map((p, i) => (
                <li
                  key={p?.id ?? i}
                  onClick={() => handleClickPartecipante(p)}
                  className="cursor-pointer rounded-xl bg-muted px-4 py-3 shadow-sm hover:ring-2 hover:ring-primary/40"
                >
                  {(p?.nome ?? p?.Nome) + ' ' + (p?.cognome ?? p?.Cognome)}
                </li>
              ))}
            </ul>
          )}
        </Card>
      )}
    </div>
    {/* ------- MODAL FLOTTANTE ------- */}
    <CassaModal
      open={openModal}
      onClose={() => setOpenModal(false)}
      partecipante={modalData}     /* l’oggetto cliccato */
      turno={selectedTurno}        /* serve id_turno */
    />

    </>

  );
}


