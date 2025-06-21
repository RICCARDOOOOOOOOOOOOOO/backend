/* ------------------------------------------------------------------- */
/*  App.jsx                                                            */
/* ------------------------------------------------------------------- */
import React, { useMemo, useState, useEffect } from 'react';
import Card         from './components/card';
import SectionTitle from './components/Titoli';
import CassaModal   from './components/ModalCassa';
import TotaliCassa  from './components/TotaliCassa';
import NavBar       from './components/NavBar';

const API_BASE =
  'https://gestione.parrocchiacarpaneto.com/servizi/api/turni';

/* helpers ------------------------------------------------------------ */
const extractArray = (d) =>
  Array.isArray(d)                 ? d
  : Array.isArray(d?.returnObject) ? d.returnObject
  : Array.isArray(d?.turni)        ? d.turni
  : Array.isArray(d?.partecipanti) ? d.partecipanti
  : [];

const extractYear = (t) =>
  t?.year ?? t?.anno ?? (t?.inizio ? new Date(t.inizio).getFullYear() : null);

/* ------------------------------------------------------------------- */
export default function App() {
  /* ---------- costanti iniziali ----------------------------------- */
  const currentYear = new Date().getFullYear();
  const storedYear  = Number(localStorage.getItem('selectedYear'));
  const initialYear = storedYear || currentYear;          // ← qui l’anno giusto!

  const allYears = useMemo(
    () => Array.from({ length: 10 }, (_, i) => currentYear - i),
    [currentYear],
  );

  /* ---------- state ------------------------------------------------ */
  const [years,         setYears]         = useState(allYears);
  const [selectedYear,  setSelectedYear]  = useState(initialYear);  // ← usa subito quello salvato
  const [turni,         setTurni]         = useState([]);
  const [selectedTurno, setSelectedTurno] = useState(null);
  const [partecipanti,  setPartecipanti]  = useState([]);

  const [openModal,     setOpenModal]     = useState(false);
  const [modalData,     setModalData]     = useState(null);

  /* riepilogo on/off (persistente) ---------------------------------- */
  const [showSummary, setShowSummary] = useState(() => {
    const saved = localStorage.getItem('showSummary');
    return saved === null ? true : JSON.parse(saved);
  });
  const toggleSummary = () =>
    setShowSummary((prev) => {
      const next = !prev;
      localStorage.setItem('showSummary', JSON.stringify(next));
      return next;
    });

  /* se ho anno+turno salvati nascondo i selettori all’avvio ---------- */
  const [showSelectors, setShowSelectors] = useState(() => {
    return !(localStorage.getItem('selectedYear') &&
             localStorage.getItem('selectedTurnoId'));
  });

  /* forza refresh TotaliCassa --------------------------------------- */
  const [totVersion, setTotVersion] = useState(0);
  const bumpTotali = () => setTotVersion((v) => v + 1);

  /* ------------------------------------------------------------------ */
  /*  TOKEN da querystring                                              */
  useEffect(() => {
    const qs = new URLSearchParams(window.location.search);
    const tk = qs.get('token');
    if (tk) localStorage.setItem('token', tk);
  }, []);

  /* --------------- carica i turni dell’anno scelto ----------------- */
  useEffect(() => {
    if (!selectedYear) return;
    fetchTurni(selectedYear);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedYear]);

  /* header jwt ------------------------------------------------------- */
  const authHeader = () => ({
    'Content-Type': 'application/json',
    Customauthorization: 'Bearer ' + localStorage.getItem('token'),
  });

  /* ---------------- API calls -------------------------------------- */
  const fetchTurni = async (year) => {
    const res  = await fetch(`${API_BASE}/recuperaTurni.php?year=${year}`, {
      headers: authHeader(),
    });
    const data = await res.json();
    const arr  = extractArray(data);

    setTurni(arr);
    setPartecipanti([]);

    /* aggiorna dropdown anni */
    const found = new Set([...allYears]);
    arr.forEach((t) => {
      const y = extractYear(t);
      if (y) found.add(Number(y));
    });
    setYears(Array.from(found).sort((a, b) => b - a));

    /* se c’è un turno salvato per quell’anno, selezionalo e carica la lista */
    const savedId = Number(localStorage.getItem('selectedTurnoId'));
    if (savedId) {
      const match = arr.find((t) => Number(t.id) === savedId);
      if (match) {
        setSelectedTurno(match);
        setShowSelectors(false);
        fetchDettagli(match.id);
      }
    }
  };

  const fetchDettagli = async (idTurno) => {
    const res  = await fetch(`${API_BASE}/recuperaDettagli.php`, {
      method: 'POST',
      headers: authHeader(),
      body: JSON.stringify({ idturno: idTurno }),
    });
    const data = await res.json();
    setPartecipanti(extractArray(data));
  };

  /* ---------------- HANDLERS --------------------------------------- */
  const handleYear = (y) => {
    setSelectedYear(y);
    localStorage.setItem('selectedYear', y);
    localStorage.removeItem('selectedTurnoId'); // azzera turno salvato
    setSelectedTurno(null);
    setShowSelectors(true);
  };

  const handleTurnoClick = (t) => {
    setSelectedTurno(t);
    fetchDettagli(t.id);
    localStorage.setItem('selectedTurnoId', t.id);
    setShowSelectors(false);
  };

  const handleClickPartecipante = (p) => {
    setModalData(p);
    setOpenModal(true);
  };

  /* ---------------- RENDER ----------------------------------------- */
  return (
    <>
      <NavBar
        showSummary={showSummary}
        toggleSummary={toggleSummary}
        toggleSelectors={() => setShowSelectors((s) => !s)}
      />

      <div className="pt-20" />

      <div className="min-h-screen w-full bg-muted/40 flex flex-col items-center py-12 px-6 gap-8">
        {/* ---------- SELEZIONE ANNO / TURNO ------------------------- */}
        {showSelectors && (
          <Card className="w-full sm:max-w-2xl lg:max-w-5xl space-y-6">
            <SectionTitle>Seleziona&nbsp;Turno</SectionTitle>

            {/* dropdown anni */}
            <select
              value={selectedYear}
              onChange={(e) => handleYear(Number(e.target.value))}
              className="block mx-auto w-40 rounded-xl border border-zinc-300 bg-white py-2 pl-3 pr-8 text-center text-sm shadow-sm
                         focus:outline-none focus:ring-2 focus:ring-blue-600
                         dark:bg-zinc-800 dark:border-zinc-700"
            >
              {years.map((y) => (
                <option key={y}>{y}</option>
              ))}
            </select>

            {/* bottoni turni */}
            <div className="flex flex-wrap gap-4 justify-center">
              {turni.map((t, i) => (
                <button
                  key={t?.id ?? i}
                  onClick={() => handleTurnoClick(t)}
                  className={`rounded-xl py-2 px-4 text-sm font-medium transition
                    ${
                      selectedTurno?.id === t?.id
                        ? 'bg-blue-100 text-blue-700 ring-1 ring-blue-600'
                        : 'bg-muted hover:bg-muted/80'
                    }`}
                >
                  {t?.titolo ?? `Turno ${i}`}
                </button>
              ))}
            </div>
          </Card>
        )}

        {/* ---------- RIEPILOGO FINANZIARIO -------------------------- */}
        {selectedTurno && showSummary && (
          <TotaliCassa
            key={totVersion}       /* forza ricarico al bisogno */
            turnoId={selectedTurno.id}
          />
        )}

        {/* ---------- LISTA PARTECIPANTI ----------------------------- */}
        {selectedTurno && (
          <Card className="w-full sm:max-w-2xl lg:max-w-5xl">
            <SectionTitle>{selectedTurno.titolo}</SectionTitle>

            {partecipanti.length === 0 ? (
              <p className="text-center mt-6 text-sm text-zinc-500">
                Caricamento…
              </p>
            ) : (
              <ul className="flex flex-col gap-4 mt-6">
                {partecipanti.map((p, i) => (
                  <li
                    key={p?.id ?? i}
                    onClick={() => handleClickPartecipante(p)}
                    className="cursor-pointer rounded-xl bg-muted px-4 py-3 shadow-sm
                               hover:ring-2 hover:ring-blue-600/60"
                  >
                    {(p?.nome ?? p?.Nome) + ' ' + (p?.cognome ?? p?.Cognome)}
                  </li>
                ))}
              </ul>
            )}
          </Card>
        )}
      </div>

      {/* ---------- MODAL ------------------------------------------- */}
      <CassaModal
        open={openModal}
        onClose={() => setOpenModal(false)}
        partecipante={modalData}
        turno={selectedTurno}
        onChanged={bumpTotali}
      />
    </>
  );
}
