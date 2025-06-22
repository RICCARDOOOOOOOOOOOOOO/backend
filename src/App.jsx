/* ------------------------------------------------------------------- */
/*  App.jsx                                                            */
/* ------------------------------------------------------------------- */
import React, { useMemo, useState, useEffect } from 'react';
import Card         from './components/card';
import SectionTitle from './components/Titoli';
import CassaModal   from './components/ModalCassa';
import TotaliCassa  from './components/TotaliCassa';
import NavBar       from './components/NavBar';
import {
  recuperaRiepilogoCassa,   // ← già esiste nei services
} from './services/cassa';

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

/* id helper (partec. può arrivare con nomi diversi) ------------------ */
const getIdAnag = (p) =>
  p?.id_anag ?? p?.idanag ?? p?.id ?? p?.idAnag ?? null;

/* ------------------------------------------------------------------- */
export default function App() {
  /* ---------- costanti iniziali ----------------------------------- */
  const currentYear = new Date().getFullYear();
  const storedYear  = Number(localStorage.getItem('selectedYear'));
  const initialYear = storedYear || currentYear;

  const allYears = useMemo(
    () => Array.from({ length: 10 }, (_, i) => currentYear - i),
    [currentYear],
  );

  /* ---------- state ------------------------------------------------ */
  const [years,         setYears]         = useState(allYears);
  const [selectedYear,  setSelectedYear]  = useState(initialYear);
  const [turni,         setTurni]         = useState([]);
  const [selectedTurno, setSelectedTurno] = useState(null);
  const [partecipanti,  setPartecipanti]  = useState([]);
  const [saldoMap,      setSaldoMap]      = useState({});   // id_anag → saldo €

  const [openModal,     setOpenModal]     = useState(false);
  const [modalData,     setModalData]     = useState(null);

  /* ricerca live ----------------------------------------------------- */
  const [query, setQuery] = useState('');

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

  /* se ho anno+turno salvati nascondo i selettori -------------------- */
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
    const tk = new URLSearchParams(window.location.search).get('token');
    if (tk) localStorage.setItem('token', tk);
  }, []);

  /* carica turni dell’anno scelto ----------------------------------- */
  useEffect(() => {
    if (!selectedYear) return;
    fetchTurni(selectedYear);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedYear]);

  /* ------------------------------------------------------------------ */
  /*  API helpers                                                       */
  const authHeader = () => ({
    'Content-Type': 'application/json',
    Customauthorization: 'Bearer ' + localStorage.getItem('token'),
  });

  const fetchTurni = async (year) => {
    const res  = await fetch(`${API_BASE}/recuperaTurni.php?year=${year}`, {
      headers: authHeader(),
    });
    const data = await res.json();
    const arr  = extractArray(data);

    setTurni(arr);
    setPartecipanti([]);
    setSaldoMap({});        // reset finché non ricarico riepilogo

    /* dropdown anni dinamico */
    const found = new Set([...allYears]);
    arr.forEach((t) => {
      const y = extractYear(t);
      if (y) found.add(Number(y));
    });
    setYears(Array.from(found).sort((a, b) => b - a));

    /* ripristina eventuale turno salvato */
    const savedId = Number(localStorage.getItem('selectedTurnoId'));
    if (savedId) {
      const match = arr.find((t) => Number(t.id) === savedId);
      if (match) {
        setSelectedTurno(match);
        setShowSelectors(false);
        fetchDettagli(match.id);     // carica lista + saldo map
      }
    }
  };

  const fetchDettagli = async (idTurno) => {
    /* lista partecipanti */
    const resP  = await fetch(`${API_BASE}/recuperaDettagli.php`, {
      method: 'POST',
      headers: authHeader(),
      body: JSON.stringify({ idturno: idTurno }),
    });
    const datiP = await resP.json();
    setPartecipanti(extractArray(datiP));

    /* saldo per ogni partecipante (riepilogo) */
    const riepilogo = await recuperaRiepilogoCassa(idTurno);
    const map = {};
    riepilogo.forEach((r) => {
      const id = getIdAnag(r);
      map[id]  = Number(
        r.totale_in_cassa ?? r.totaleInCassa ?? r.totale_inCassa ?? 0,
      );
    });
    setSaldoMap(map);
  };

  /* ------------------------------------------------------------------ */
  /*  HANDLERS                                                          */
  const handleYear = (y) => {
    setSelectedYear(y);
    localStorage.setItem('selectedYear', y);
    localStorage.removeItem('selectedTurnoId');
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

  /* filtro partecipanti --------------------------------------------- */
  const q = query.trim().toLowerCase();
  const filtered = q
    ? partecipanti.filter((p) => {
        const nome = (p?.nome ?? p?.Nome ?? '').toLowerCase();
        const cog  = (p?.cognome ?? p?.Cognome ?? '').toLowerCase();
        return nome.includes(q) || cog.includes(q);
      })
    : partecipanti;

  /* ------------------------------------------------------------------ */
  /*  RENDER                                                            */
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
          <TotaliCassa key={totVersion} turnoId={selectedTurno.id} />
        )}

        {/* ---------- LISTA PARTECIPANTI ----------------------------- */}
        {selectedTurno && (
          <Card className="w-full sm:max-w-2xl lg:max-w-5xl space-y-6">
            <SectionTitle>{selectedTurno.titolo}</SectionTitle>

            {/* input ricerca */}
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Cerca partecipante…"
              className="mx-auto w-full rounded-xl border px-4 py-2 text-sm
                         dark:bg-zinc-800 dark:border-zinc-700"
            />

            {/* elenco */}
            {filtered.length === 0 ? (
              <p className="text-center mt-4 text-sm text-zinc-500">
                Nessun risultato
              </p>
            ) : (
              <ul className="flex flex-col gap-4">
                {filtered.map((p, i) => {
                  const id    = getIdAnag(p);
                  const saldo = saldoMap[id] ?? 0;
                  const color =
                    saldo >= 0 ? 'text-emerald-600' : 'text-rose-600';
                  return (
                    <li
                      key={p?.id ?? i}
                      onClick={() => handleClickPartecipante(p)}
                      className="flex justify-between items-center cursor-pointer
                                 rounded-xl bg-muted px-4 py-3 shadow-sm
                                 hover:ring-2 hover:ring-blue-600/60"
                    >
                      <span>
                        {(p?.nome ?? p?.Nome) + ' ' + (p?.cognome ?? p?.Cognome)}
                      </span>
                      <span className={`ml-4 font-semibold ${color}`}>
                        {saldo.toFixed(2)} €
                      </span>
                    </li>
                  );
                })}
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
