/* ------------------------------------------------------------------- */
/*  App.jsx – PDF + Mail toggle con stato salvato                      */
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
  invioMailCassaConAllegato,          /* ★ NEW */
} from './services/cassa';
import generaPdfCassa                  from './services/generaPdfCassa';

import { isTokenValid, setToken, clearToken, authHeader } from './services/auth';

/* ------------------------------------------------------------------ */
/* helper                                                             */
/* ------------------------------------------------------------------ */
const API_BASE =
  'https://gestione.parrocchiacarpaneto.com/servizi/api/turni';

const LOGIN_URL =
  'https://gestione.parrocchiacarpaneto.com/login/#/?returnUrl=' +
  encodeURIComponent(
    location.hostname === 'localhost'
      ? 'http://localhost:5173'
      : 'https://gestione.parrocchiacarpaneto.com/cassa_r',
  );

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

/* ------------------------------------------------------------------- */
export default function App() {
  /* ───────── auth check all’avvio ───────── */
  useEffect(() => {
    (async () => {
      const qs = new URLSearchParams(location.search);
      const tk = qs.get('token');
      if (tk) {
        setToken(tk);
        qs.delete('token');
        history.replaceState({}, '', location.pathname);
      }
      if (!(await isTokenValid())) {
        clearToken();
        location.href = LOGIN_URL;
      }
    })();
  }, []);

  /* ---------- iniziali ------------------------------------------- */
  const currentYear = new Date().getFullYear();
  const allYears    = useMemo(
    () => Array.from({ length: 10 }, (_, i) => currentYear - i),
    [currentYear],
  );

  /* ---------- state ---------------------------------------------- */
  const [years, setYears]               = useState(allYears);
  const [selectedYear, setSelectedYear] = useState(
    Number(localStorage.getItem('selectedYear')) || currentYear,
  );
  const [turni, setTurni]               = useState([]);
  const [selectedTurno, setSelectedTurno] = useState(null);
  const [partecipanti, setPartecipanti] = useState([]);
  const [saldoMap, setSaldoMap]         = useState({});

  const [openModal, setOpenModal]       = useState(false);
  const [modalData, setModalData]       = useState(null);

  const [query, setQuery] = useState('');

  /* riepilogo toggle */
  const [showSummary, setShowSummary] = useState(
    JSON.parse(localStorage.getItem('showSummary') ?? 'true'),
  );
  const toggleSummary = () =>
    setShowSummary((v) => {
      localStorage.setItem('showSummary', JSON.stringify(!v));
      return !v;
    });

  /* PDF / Mail toggle */
  const [showPdf, setShowPdf] = useState(
    JSON.parse(localStorage.getItem('showPdf') ?? 'false'),
  );
  const togglePdf = () =>
    setShowPdf((v) => {
      localStorage.setItem('showPdf', JSON.stringify(!v));
      return !v;
    });

/* mappa id_anag → true|false (deriva unicamente dall’API) */
const [sentMap, setSentMap] = useState({});




  /* selettori visibili? */
  const [showSelectors, setShowSelectors] = useState(() => {
    return !(
      localStorage.getItem('selectedYear') &&
      localStorage.getItem('selectedTurnoId')
    );
  });

  /* refresh riepilogo */
  const [totVersion, setTotVersion] = useState(0);
  const bumpTotali = () => setTotVersion((v) => v + 1);

  /* ---------- load turni on year change -------------------------- */
  useEffect(() => {
    if (selectedYear) fetchTurni(selectedYear);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedYear]);

  /* ---------------- API calls ------------------------------------ */
  const fetchTurni = async (year) => {
    const res  = await fetch(`${API_BASE}/recuperaTurni.php?year=${year}`, {
      headers: authHeader(),
    });
    const arr  = extractArray(await res.json());

    setTurni(arr);
    setPartecipanti([]);
    setSaldoMap({});

    /* anni dinamici */
    const found = new Set([...allYears]);
    arr.forEach((t) => found.add(extractYear(t)));
    setYears([...found].sort((a, b) => b - a));

    /* turno salvato */
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

/* -------------------------------------------------------------- */
/*  carica lista + saldi + flag “sent”                            */
/* -------------------------------------------------------------- */
const fetchDettagli = async (idTurno) => {
  /* 1. lista partecipanti -------------------------------------- */
  const resP = await fetch(`${API_BASE}/recuperaDettagli.php`, {
    method: 'POST',
    headers: authHeader(),
    body  : JSON.stringify({ idturno: idTurno }),
  });
  setPartecipanti(extractArray(await resP.json()));

  /* 2. riepilogo: saldo + sent --------------------------------- */
  const riepilogo  = await recuperaRiepilogoCassa(idTurno);

  const saldoTmp = {};
  const sentTmp  = {};

  riepilogo.forEach((r) => {
    const id          = getIdAnag(r);
    saldoTmp[id]      = Number(r.totale_in_cassa ?? r.totaleInCassa ?? 0);
    /* normalizza qualsiasi forma (true, 1, "1", "true"…) */
    sentTmp[id]       =
      r.sent === true || r.sent === 1 || r.sent === '1' || r.sent === 'true';
  });

  setSaldoMap(saldoTmp);
  setSentMap(sentTmp);            // ← nessun localStorage
};



  /* ---------------- HANDLERS ------------------------------------- */
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

  /* PDF download */
  const handlePdf = async (p) => {
    const cassa = await recuperaCassa(getIdAnag(p), selectedTurno.id);
    generaPdfCassa(
      { nome: p.nome ?? p.Nome, cognome: p.cognome ?? p.Cognome },
      cassa,
      selectedTurno,
    );                              /* scarica – no base64 */
  };


/* MAIL send */
const handleMail = async (p) => {
  try {
    // 1. dati di cassa del partecipante
    const cassa  = await recuperaCassa(getIdAnag(p), selectedTurno.id);

    // 2. genera il PDF in Base-64 (niente download)
    const base64 = await generaPdfCassa(
      { nome: p.nome ?? p.Nome, cognome: p.cognome ?? p.Cognome },
      cassa,
      selectedTurno,
      /* silent */ true          // ⇒ la funzione ora restituisce la stringa Base-64
    );

    // 3. invio mail con allegato
    await invioMailCassaConAllegato(
      selectedTurno.id,
      getIdAnag(p),
      base64,
    );

    /* ricarico il riepilogo: il backend ora restituisce sent=true */
    await fetchDettagli(selectedTurno.id);


    // 4. segna come “inviata” (solo in state: la prossima volta arriverà già true dal recuperaRiepilogoCassa.php)
    setSentMap((m) => ({ ...m, [getIdAnag(p)]: true }));


      } catch (e) {
        console.error(e);
        alert('Invio e-mail fallito');
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

  /* ---------------- RENDER --------------------------------------- */
  return (
    <>
      <NavBar
        showSummary={showSummary}
        toggleSummary={toggleSummary}
        showPdf={showPdf}
        togglePdf={togglePdf}
        toggleSelectors={() => setShowSelectors((s) => !s)}
      />

      <div className="pt-20" />

      <div className="min-h-screen w-full bg-muted/40 flex flex-col items-center
                      sm:py-12 px-3 sm:px-6 gap-8">
        {/* ---------- SELETTORI ----------------------------------- */}
        {showSelectors && (
          <Card className="w-full sm:max-w-2xl lg:max-w-5xl space-y-6">
            <SectionTitle>Seleziona Turno</SectionTitle>

            {/* select anni */}
            <select
              value={selectedYear}
              onChange={(e) => handleYear(Number(e.target.value))}
              className="block mx-auto w-40 rounded-xl border border-zinc-300 bg-white py-2 pl-3 pr-8
                         text-center text-sm shadow-sm focus:outline-none
                         focus:ring-2 focus:ring-blue-600
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

        {/* ---------- RIEPILOGO ------------------------------------ */}
        {selectedTurno && showSummary && (
          <TotaliCassa key={totVersion} turnoId={selectedTurno.id} />
        )}
        {/* --------- LISTA PARTECIPANTI ----------------------------- */}
        {selectedTurno && (
          <Card className="w-full sm:max-w-2xl lg:max-w-5xl space-y-6">
            <SectionTitle>{selectedTurno.titolo}</SectionTitle>

            {/* ricerca */}
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Cerca partecipante…"
              className="mx-auto w-full rounded-xl border px-4 py-2 text-sm
                         dark:bg-zinc-800 dark:border-zinc-700"
            />

            {filtered.length === 0 ? (
              <p className="text-center mt-4 text-sm text-zinc-500">Nessun risultato</p>
            ) : (
              <ul className="flex flex-col gap-4">
                {filtered.map((p, i) => {
                  const id    = getIdAnag(p);
                  const saldo = saldoMap[id] ?? 0;
                  const color = saldo >= 0 ? 'text-emerald-600' : 'text-rose-600';

                  return (
                    <li
                      key={id ?? i}
                      className="flex items-center rounded-xl bg-muted px-4 py-3
                                 shadow-sm hover:ring-2 hover:ring-blue-600/60"
                    >
                      {/* nome */}
                      <button
                        onClick={() => handleClickPartecipante(p)}
                        className="flex-1 text-left truncate focus:outline-none
                                   text-sm sm:text-base"
                      >
                        {(p?.nome ?? p?.Nome) + ' ' + (p?.cognome ?? p?.Cognome)}
                      </button>

                      {/* area azioni o saldo */}
                      {showPdf ? (
                        <div className="flex gap-2 ml-3 shrink-0">
                          {/* PDF */}
                          <button
                            onClick={() => handlePdf(p)}
                            title="Scarica PDF"
                            className="w-9 h-9 flex items-center justify-center
                                       rounded-lg hover:bg-blue-200 text-blue-700 text-lg"
                          >
                            🧾
                          </button>

                          {/* MAIL */}
                          <button
                            onClick={() => handleMail(p)}
                            title={sentMap[id] ? 'Inviata' : 'Invia e-mail'}
                            className={`w-9 h-9 flex items-center justify-center rounded-lg
                                        ${sentMap[id]
                                          ? 'bg-emerald-200 text-emerald-700'
                                          : 'hover:bg-emerald-100 text-emerald-700'}`}
                          >
                            {sentMap[id] ? '✅' : '✉️'}
                          </button>
                        </div>
                      ) : (
                        <span
                          onClick={() => handleClickPartecipante(p)}
                          className={`w-24 text-right font-semibold ${color}`}
                        >
                          {saldo.toFixed(2)} €
                        </span>
                      )}
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
