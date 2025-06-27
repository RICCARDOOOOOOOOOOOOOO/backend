/* ------------------------------------------------------------------- */
/*  App.jsx – versione con                                          */
/*  • check token + redirect login                                    */
/*  • pulsante PDF/emoj 🧾                                             */
/*  • padding / font mobile già ridotti                               */
/* ------------------------------------------------------------------- */
import React, { useMemo, useState, useEffect } from 'react';
import Card         from './components/card';
import SectionTitle from './components/Titoli';
import CassaModal   from './components/ModalCassa';
import TotaliCassa  from './components/TotaliCassa';
import NavBar       from './components/NavBar';

import {
  recuperaRiepilogoCassa,
  recuperaCassa,
} from './services/cassa';

import generaPdfCassa from './services/generaPdfCassa';

/* utilità auth ------------------------------------------------------ */
import {
  isTokenValid,
  setToken,
  clearToken,
  authHeader,             // header già pronto con Bearer
} from './services/auth';

/* ------------------------------------------------------------------ */
/* helper                                                             */
/* ------------------------------------------------------------------ */
const API_BASE =
  'https://gestione.parrocchiacarpaneto.com/servizi/api/turni';

const LOGIN_URL =
  'https://gestione.parrocchiacarpaneto.com/login/#/?returnUrl=' +
  ( location.protocol === 'https:' ? encodeURIComponent('https://gestione.parrocchiacarpaneto.com/cassa_r')
          : encodeURIComponent('http://localhost:5173'));

const extractArray = (d) =>
  Array.isArray(d)                 ? d
  : Array.isArray(d?.returnObject) ? d.returnObject
  : Array.isArray(d?.turni)        ? d.turni
  : Array.isArray(d?.partecipanti) ? d.partecipanti
  : [];

const extractYear = (t) =>
  t?.year ?? t?.anno ?? (t?.inizio ? new Date(t.inizio).getFullYear() : null);

const getIdAnag = (p) =>
  p?.id_anag ?? p?.idanag ?? p?.id ?? p?.idAnag ?? null;

/* ------------------------------------------------------------------ */
export default function App() {
  /* ---------- ①  controllo token all’avvio ----------------------- */
  useEffect(() => {
    (async () => {
      /* token nella querystring (ritorno dal login) ---------------- */
      const params = new URLSearchParams(window.location.search);
      const tkUrl  = params.get('token');
      if (tkUrl) {
        setToken(tkUrl);
        params.delete('token');
        window.history.replaceState({}, '', window.location.pathname);
      }

      const ok = await isTokenValid();
      if (!ok) {
        clearToken();
        window.location.href = LOGIN_URL;
      }
    })();
  }, []);

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
  const [saldoMap,      setSaldoMap]      = useState({});

  const [openModal,     setOpenModal]     = useState(false);
  const [modalData,     setModalData]     = useState(null);

  const [query, setQuery] = useState('');

  /* riepilogo on/off (persistente) ---------------------------------- */
  const [showSummary, setShowSummary] = useState(() => {
    const saved = localStorage.getItem('showSummary');
    return saved === null ? true : JSON.parse(saved);
  });
  const toggleSummary = () =>
    setShowSummary((p) => {
      const n = !p;
      localStorage.setItem('showSummary', JSON.stringify(n));
      return n;
    });

  const [showSelectors, setShowSelectors] = useState(() => {
    return !(
      localStorage.getItem('selectedYear') &&
      localStorage.getItem('selectedTurnoId')
    );
  });

  const [totVersion, setTotVersion] = useState(0);
  const bumpTotali   = () => setTotVersion((v) => v + 1);

  /* ------------------------------------------------------------------ */
  /* carica turni dell’anno scelto ----------------------------------- */
  useEffect(() => {
    if (!selectedYear) return;
    fetchTurni(selectedYear);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedYear]);

  /* ------------------------------------------------------------------ */
  /*  API calls                                                        */
  const fetchTurni = async (year) => {
    const res  = await fetch(`${API_BASE}/recuperaTurni.php?year=${year}`, {
      headers: authHeader(),
    });
    const data = await res.json();
    const arr  = extractArray(data);

    setTurni(arr);
    setPartecipanti([]);
    setSaldoMap({});

    /* aggiorna lista anni dinamica */
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
        fetchDettagli(match.id);
      }
    }
  };

  const fetchDettagli = async (idTurno) => {
    /* lista partecipanti */
    const resP = await fetch(`${API_BASE}/recuperaDettagli.php`, {
      method: 'POST',
      headers: authHeader(),
      body: JSON.stringify({ idturno: idTurno }),
    });
    setPartecipanti(extractArray(await resP.json()));

    /* mappa saldi */
    const riepilogo = await recuperaRiepilogoCassa(idTurno);
    const map = {};
    riepilogo.forEach((r) => {
      map[getIdAnag(r)] =
        Number(r.totale_in_cassa ?? r.totaleInCassa ?? 0);
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

  /* PDF ---------------------------------------------------------------- */
  const handlePdf = async (p) => {
    try {
      const cassa = await recuperaCassa(getIdAnag(p), selectedTurno.id);
      generaPdfCassa(
        { nome: p.nome ?? p.Nome, cognome: p.cognome ?? p.Cognome },
        cassa,
        selectedTurno,
      );
    } catch (e) {
      console.error('Errore PDF:', e);
      alert('Impossibile generare il PDF');
    }
  };

  /* filtro ricerca -------------------------------------------------- */
  const q = query.trim().toLowerCase();
  const filtered = q
    ? partecipanti.filter((p) => {
        const n = (p?.nome ?? p?.Nome ?? '').toLowerCase();
        const c = (p?.cognome ?? p?.Cognome ?? '').toLowerCase();
        return n.includes(q) || c.includes(q);
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

      <div className="min-h-screen w-full bg-muted/40 flex flex-col items-center
                      sm:py-12 px-3 sm:px-6 gap-8">

        {/* ---------- SELETTORI anno/turno --------------------------- */}
        {showSelectors && (
          <Card className="w-full sm:max-w-2xl lg:max-w-5xl space-y-6">
            <SectionTitle>Seleziona Turno</SectionTitle>

            <select
              value={selectedYear}
              onChange={(e) => handleYear(Number(e.target.value))}
              className="block mx-auto w-40 rounded-xl border border-zinc-300 bg-white py-2 pl-3 pr-8 text-center text-sm
                         shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-600
                         dark:bg-zinc-800 dark:border-zinc-700"
            >
              {years.map((y) => (
                <option key={y}>{y}</option>
              ))}
            </select>

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

        {/* ---------- RIEPILOGO ------------------------------------ */}
        {selectedTurno && showSummary && (
          <TotaliCassa key={totVersion} turnoId={selectedTurno.id} />
        )}

        {/* ---------- LISTA PARTECIPANTI --------------------------- */}
        {selectedTurno && (
          <Card className="w-full sm:max-w-2xl lg:max-w-5xl space-y-6">
            <SectionTitle>{selectedTurno.titolo}</SectionTitle>

            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Cerca partecipante…"
              className="mx-auto w-full rounded-xl border px-4 py-2 text-sm
                         dark:bg-zinc-800 dark:border-zinc-700"
            />

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
                      className="flex items-center rounded-xl bg-muted px-4 py-3
                                 shadow-sm hover:ring-2 hover:ring-blue-600/60"
                    >
                      {/* nome (click → modal) */}
                      <button
                        onClick={() => handleClickPartecipante(p)}
                        className="flex-1 text-left truncate focus:outline-none
                                   text-sm sm:text-base"
                      >
                        {(p?.nome ?? p?.Nome) + ' ' + (p?.cognome ?? p?.Cognome)}
                      </button>

                      {/* saldo */}
                      <span
                        onClick={() => handleClickPartecipante(p)}
                        className={`w-24 text-right font-semibold ${color}`}
                      >
                        {saldo.toFixed(2)} €
                      </span>

                      {/* PDF */}
                      <button
                        onClick={() => handlePdf(p)}
                        title="Scarica PDF"
                        className="ml-4 shrink-0 w-10 h-10 flex items-center justify-center
                                   rounded-lg hover:bg-blue-200 text-blue-700 text-xl"
                      >
                        🧾
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </Card>
        )}
      </div>

      {/* ---------- MODAL ----------------------------------------- */}
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
